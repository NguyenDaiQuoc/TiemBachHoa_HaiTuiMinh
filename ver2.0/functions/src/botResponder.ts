import * as admin from 'firebase-admin';
import { onDocumentCreated } from 'firebase-functions/v2/firestore';
import * as logger from 'firebase-functions/logger';

if (!admin.apps.length) {
  admin.initializeApp();
}

const db = admin.firestore();

// Helper: call OpenAI-style chat completion. Uses OPENAI_API_KEY env var.
async function callOpenAI(messages: Array<{role:string, content:string}>, model = process.env.OPENAI_MODEL || 'gpt-4o-mini') {
  const key = process.env.OPENAI_API_KEY;
  if (!key) throw new Error('OPENAI_API_KEY not set in function environment');

  const url = 'https://api.openai.com/v1/chat/completions';
  const body = {
    model,
    messages: messages.map(m => ({ role: m.role, content: m.content })),
    temperature: 0.2,
    max_tokens: 600,
  };

  const res = await fetch(url, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${key}`,
    },
    body: JSON.stringify(body),
  });

  if (!res.ok) {
    const t = await res.text();
    throw new Error(`OpenAI responded ${res.status}: ${t}`);
  }

  const json = await res.json();
  // Safely pick a text field depending on API shape
  const reply = json?.choices?.[0]?.message?.content || json?.choices?.[0]?.text || '';
  return String(reply);
}

// Trigger: when a new message is written to chat_messages.
export const autoBotReply = onDocumentCreated('/chat_messages/{msgId}', async (event) => {
  try {
    const snap = event.data;
    if (!snap) {
      logger.warn('No snapshot data');
      return;
    }
    const data = snap.data();
    if (!data) return;

    const msgId = event.params.msgId;
    const role = data.role || 'customer';
    const text = data.message || data.text || '';
    const threadId = data.threadId || null;

    // Only respond to customer messages and avoid responding twice
    if (role !== 'customer') {
      logger.info('Message not from customer, skipping', { msgId, role });
      return;
    }
    if (data.botResponded) {
      logger.info('Already responded by bot, skipping', { msgId });
      return;
    }

    // Mark message as botResponding to avoid duplicate triggers
    await db.collection('chat_messages').doc(msgId).update({ botResponded: true }).catch(() => null);

    // Build conversation context: optionally pull previous messages in same thread (last 6)
    const messages: Array<{role:string, content:string}> = [];
    if (threadId) {
      const q = db.collection('chat_messages').where('threadId', '==', threadId).orderBy('createdAt', 'desc').limit(6);
      const prev = await q.get();
      const prevDocs = prev.docs.reverse();
      prevDocs.forEach(d => {
        const dt = d.data();
        messages.push({ role: dt.role === 'admin' ? 'assistant' : (dt.role === 'bot' ? 'assistant' : 'user'), content: String(dt.message || dt.text || '') });
      });
    }

    // Add the latest user message
    messages.push({ role: 'user', content: String(text) });

    // Call LLM
    let replyText = '';
    try {
      replyText = await callOpenAI(messages);
    } catch (err:any) {
      logger.error('LLM call failed', err?.message || err);
      replyText = 'Xin lỗi, hệ thống bot hiện không trả lời được. Chúng tôi sẽ có nhân viên hỗ trợ sớm.';
    }

    // Write bot reply to chat_messages
    const out: any = {
      role: 'bot',
      message: replyText,
      createdAt: admin.firestore.FieldValue.serverTimestamp(),
      inReplyTo: msgId,
    };
    if (threadId) out.threadId = threadId;

    const created = await db.collection('chat_messages').add(out);

    // Also append the bot reply into the per-user `chats/{threadId}` document if it exists (or create it).
    try {
      if (threadId) {
        const chatRef = db.collection('chats').doc(String(threadId));
        const msgObj = {
          id: `bot-${Date.now()}`,
          role: 'bot',
          message: replyText,
          createdAt: admin.firestore.FieldValue.serverTimestamp(),
          inReplyTo: msgId,
          sourceMessageId: created.id
        };
        const docSnap = await chatRef.get();
        if (!docSnap.exists) {
          await chatRef.set({
            userId: threadId,
            name: 'Khách',
            createdAt: admin.firestore.FieldValue.serverTimestamp(),
            updatedAt: admin.firestore.FieldValue.serverTimestamp(),
            messages: [msgObj],
            hasUnread: false
          });
        } else {
          await chatRef.update({
            messages: admin.firestore.FieldValue.arrayUnion(msgObj),
            updatedAt: admin.firestore.FieldValue.serverTimestamp(),
            // bot replies are not unread for admins
            hasUnread: false
          });
        }
      }
    } catch (e) {
      logger.warn('Failed to append bot reply to chats doc', e);
    }

    logger.info('Bot reply created for', { msgId });
  } catch (e:any) {
    logger.error('autoBotReply error', e?.message || e);
  }
});
