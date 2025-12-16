Setup notes for chat + Firestore rules

1) Enable Anonymous Authentication (if you want clients to use anonymous sign-in)
- Go to Firebase Console -> Authentication -> Sign-in method -> enable 'Anonymous'.

2) Deploy Firestore rules
- From your project root where `ver2.0` is your firebase project, run:

```bash
cd ver2.0
# make sure firebase CLI is authenticated and project set
firebase deploy --only firestore:rules
```

The rules file is at `ver2.0/firestore.rules`.

3) Admin users
- The rules use the existence of `/admins/{uid}` to identify admins. Create an admin doc for your admin UID, e.g. via Admin SDK or Firestore console.
- Example (Node admin SDK):

```js
admin.firestore().doc(`admins/${uid}`).set({ createdAt: admin.firestore.FieldValue.serverTimestamp(), role: 'admin' });
```

4) Cloud Function (bot responder)
- If you want automatic bot replies via OpenAI/Gemini, set up the Cloud Function and environment variables (OPENAI_API_KEY or Gemini key).
- Build & deploy functions in `ver2.0/functions`:

```bash
cd ver2.0/functions
npm install
npm run build
firebase deploy --only functions
```

5) AdBlock / Network blocking
- The browser console `ERR_BLOCKED_BY_CLIENT` messages indicate a browser extension (adblocker/privacy) blocking Firestore websocket or long-poll requests. Ask testers to disable adblock on your site when testing Firestore listeners.

6) Notes on behaviour
- The customer chat widget now requires authenticated client (anonymous sign-in will be attempted automatically). If anonymous auth is not enabled, clients must sign in to send messages.
- Messages are stored in `chat_messages` with `threadId` equal to the session id (or a real user UID if logged in).
- Support requests are saved in `support_requests` and also inserted into chat thread for visibility.

If you want, I can also:
- Add server-side batching or Cloud Function to mark `unread` flags and notify admins.
- Add push notifications for admins on new support requests.

