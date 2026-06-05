import { FormEvent, useEffect, useMemo, useState } from 'react';
import { Clock3, Loader2, MessageCircleMore, Send, Sparkles, UserRound } from 'lucide-react';
import { useSearchParams } from 'react-router-dom';
import { toast } from 'sonner';
import { adminService } from '@/src/entities/admin/api/admin-service';
import { SupportInboxConversation, SupportInboxItem } from '@/src/entities/admin/model/types';
import { useAdminAuthStore } from '@/src/shared/model/admin-auth-store';
import { useAdminUiStore } from '@/src/shared/store/admin-ui-store';
import { cn } from '@/src/shared/lib/utils';
import { useSupportUnreadStore } from '@/src/shared/model/support-unread-store';
import { Button } from '@/src/shared/ui/button';
import { Input } from '@/src/shared/ui/input';

const copy = {
  vi: {
    eyebrow: 'Hỗ trợ bán hàng',
    title: 'Trung tâm tư vấn khách hàng',
    description:
      'Quản lý hội thoại theo thời gian thực, phân loại trạng thái chăm sóc và phản hồi từng khách hàng trong một inbox riêng.',
    empty: 'Chưa có cuộc trò chuyện nào từ khách hàng.',
    selectHint: 'Chọn một cuộc trò chuyện để xem nội dung chi tiết.',
    replyPlaceholder: 'Nhập câu trả lời cho khách hàng...',
    send: 'Gửi phản hồi',
    customer: 'Khách hàng',
    live: 'Realtime',
    lastMessage: 'Tin nhắn gần nhất',
    unread: 'chưa đọc',
    noMessages: 'Cuộc trò chuyện chưa có nội dung.',
    loadListError: 'Không thể tải hội thoại hỗ trợ',
    loadDetailError: 'Không thể tải nội dung trò chuyện',
    sendError: 'Không thể gửi phản hồi',
    conversationCount: 'cuộc trò chuyện',
    adminLabel: 'Nhân viên tư vấn',
    systemLabel: 'Hệ thống',
  },
  en: {
    eyebrow: 'Sales support',
    title: 'Customer support center',
    description: 'Manage live conversations, classify support status, and reply to each customer in a dedicated inbox.',
    empty: 'No customer conversations yet.',
    selectHint: 'Select a conversation to view the details.',
    replyPlaceholder: 'Type your reply to the customer...',
    send: 'Send reply',
    customer: 'Customer',
    live: 'Realtime',
    lastMessage: 'Latest message',
    unread: 'unread',
    noMessages: 'This conversation has no messages yet.',
    loadListError: 'Unable to load support conversations',
    loadDetailError: 'Unable to load conversation details',
    sendError: 'Unable to send reply',
    conversationCount: 'conversations',
    adminLabel: 'Support staff',
    systemLabel: 'System',
  },
} as const;

const toneClassMap = {
  warning: 'bg-amber-500/10 text-amber-700 border-amber-500/20',
  info: 'bg-sky-500/10 text-sky-700 border-sky-500/20',
  primary: 'bg-primary/10 text-primary border-primary/20',
  success: 'bg-emerald-500/10 text-emerald-700 border-emerald-500/20',
} as const;

const formatTime = (value: string, locale: 'vi' | 'en') =>
  new Date(value).toLocaleString(locale === 'vi' ? 'vi-VN' : 'en-US', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });

export const AdminSupport = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const locale = useAdminUiStore((state) => state.locale);
  const token = useAdminAuthStore((state) => state.token);
  const resetAdminUnread = useSupportUnreadStore((state) => state.resetAdminUnread);
  const t = copy[locale];

  const [conversations, setConversations] = useState<SupportInboxItem[]>([]);
  const [selectedId, setSelectedId] = useState<string | null>(searchParams.get('conversation'));
  const [activeConversation, setActiveConversation] = useState<SupportInboxConversation | null>(null);
  const [isLoadingList, setIsLoadingList] = useState(true);
  const [isLoadingConversation, setIsLoadingConversation] = useState(false);
  const [isSending, setIsSending] = useState(false);
  const [message, setMessage] = useState('');

  const loadConversations = async (preferredId?: string | null) => {
    const list = await adminService.getSupportConversations();
    setConversations(list);
    const targetId = preferredId && list.some((item) => item.id === preferredId) ? preferredId : list[0]?.id || null;
    setSelectedId(targetId);
    return { list, targetId };
  };

  const loadConversationDetail = async (conversationId: string) => {
    const detail = await adminService.getSupportConversation(conversationId);
    setActiveConversation(detail);
    return detail;
  };

  useEffect(() => {
    let active = true;
    setIsLoadingList(true);

    loadConversations(searchParams.get('conversation'))
      .catch((error) => {
        if (active) toast.error(error.message || t.loadListError);
      })
      .finally(() => {
        if (active) setIsLoadingList(false);
      });

    return () => {
      active = false;
    };
  }, [searchParams, t.loadListError]);

  useEffect(() => {
    if (!selectedId) {
      setActiveConversation(null);
      return;
    }

    let active = true;
    setIsLoadingConversation(true);

    loadConversationDetail(selectedId)
      .catch((error) => {
        if (active) toast.error(error.message || t.loadDetailError);
      })
      .finally(() => {
        if (active) setIsLoadingConversation(false);
      });

    return () => {
      active = false;
    };
  }, [selectedId, t.loadDetailError]);

  useEffect(() => {
    resetAdminUnread();
  }, [activeConversation?.id, resetAdminUnread]);

  useEffect(() => {
    if (!token) return;

    const stream = new EventSource(`/api/admin/support/stream?token=${encodeURIComponent(token)}`);

    const handleSupport = async (event: Event) => {
      const payload = JSON.parse((event as MessageEvent).data || '{}') as { conversationId?: string };
      const currentId = payload.conversationId || selectedId;
      const { targetId } = await loadConversations(currentId);
      if (targetId) {
        await loadConversationDetail(targetId);
      }
    };

    const handleError = () => {
      stream.close();
    };

    stream.addEventListener('support', handleSupport);
    stream.onerror = handleError;

    return () => {
      stream.removeEventListener('support', handleSupport);
      stream.onerror = null;
      stream.close();
    };
  }, [selectedId, token]);

  const selectedSummary = useMemo(() => conversations.find((item) => item.id === selectedId) || null, [conversations, selectedId]);

  const handleSelectConversation = (id: string) => {
    setSelectedId(id);
    setSearchParams((prev) => {
      const next = new URLSearchParams(prev);
      next.set('conversation', id);
      return next;
    });
  };

  const handleSendReply = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const nextMessage = message.trim();
    if (!selectedId || !nextMessage) return;

    try {
      setIsSending(true);
      await adminService.sendSupportReply(selectedId, nextMessage);
      setMessage('');
      await Promise.all([loadConversations(selectedId), loadConversationDetail(selectedId)]);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : t.sendError);
    } finally {
      setIsSending(false);
    }
  };

  return (
    <div className="space-y-8">
      <div className="space-y-3">
        <div className="flex flex-wrap items-center gap-3">
          <p className="font-heading text-sm font-semibold uppercase tracking-[0.22em] text-muted-foreground">{t.eyebrow}</p>
          <span className="inline-flex items-center gap-2 rounded-full border border-emerald-500/20 bg-emerald-500/10 px-3 py-1 text-[11px] font-semibold text-emerald-700">
            <Sparkles className="h-3.5 w-3.5" />
            {t.live}
          </span>
        </div>
        <div className="flex flex-col gap-3 md:flex-row md:items-end md:justify-between">
          <div>
            <h1 className="text-4xl font-semibold tracking-tight">{t.title}</h1>
            <p className="mt-2 max-w-3xl text-base leading-7 text-muted-foreground">{t.description}</p>
          </div>
          <div className="rounded-full border border-border/60 bg-card px-4 py-2 text-sm text-muted-foreground">
            {conversations.length} {t.conversationCount}
          </div>
        </div>
      </div>

      <div className="grid gap-6 xl:grid-cols-[380px_minmax(0,1fr)]">
        <section className="rounded-[30px] border border-border/60 bg-card/95 p-4 shadow-soft">
          {isLoadingList ? (
            <div className="flex min-h-[320px] items-center justify-center">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
          ) : conversations.length === 0 ? (
            <div className="flex min-h-[320px] flex-col items-center justify-center gap-3 rounded-[24px] border border-dashed border-border/60 bg-background px-6 text-center">
              <MessageCircleMore className="h-9 w-9 text-primary" />
              <p className="max-w-xs text-sm leading-6 text-muted-foreground">{t.empty}</p>
            </div>
          ) : (
            <div className="space-y-3">
              {conversations.map((conversation) => {
                const isActive = conversation.id === selectedId;

                return (
                  <button
                    key={conversation.id}
                    onClick={() => handleSelectConversation(conversation.id)}
                    className={cn(
                      'w-full rounded-[24px] border p-4 text-left transition-all',
                      isActive ? 'border-primary/40 bg-primary/8 shadow-lg shadow-primary/10' : 'border-border/50 bg-background hover:border-primary/20 hover:bg-muted/40'
                    )}
                  >
                    <div className="flex items-start gap-3">
                      <div className="flex h-12 w-12 items-center justify-center overflow-hidden rounded-2xl bg-primary/10 text-primary">
                        {conversation.customer.avatar ? (
                          <img src={conversation.customer.avatar} alt={conversation.customer.name || conversation.customer.email} className="h-full w-full object-cover" />
                        ) : (
                          <UserRound className="h-5 w-5" />
                        )}
                      </div>

                      <div className="min-w-0 flex-1">
                        <div className="flex items-start justify-between gap-3">
                          <div className="min-w-0">
                            <p className="truncate text-base font-semibold">{conversation.customer.name || conversation.customer.email}</p>
                            <p className="truncate text-xs text-muted-foreground">{conversation.customer.email}</p>
                          </div>

                          {conversation.unreadForAdmin > 0 && (
                            <span className="rounded-full bg-primary px-2.5 py-1 text-[10px] font-bold uppercase tracking-[0.14em] text-primary-foreground">
                              {conversation.unreadForAdmin} {t.unread}
                            </span>
                          )}
                        </div>

                        <div className="mt-3 flex flex-wrap items-center gap-2">
                          <span
                            className={cn(
                              'inline-flex rounded-full border px-2.5 py-1 text-[10px] font-semibold uppercase tracking-[0.16em]',
                              toneClassMap[conversation.workflowStatus.tone]
                            )}
                          >
                            {conversation.workflowStatus.label}
                          </span>
                          <span className="inline-flex items-center gap-1 text-xs text-muted-foreground">
                            <Clock3 className="h-3.5 w-3.5" />
                            {formatTime(conversation.lastMessageAt, locale)}
                          </span>
                        </div>

                        <p className="mt-3 text-[11px] font-semibold uppercase tracking-[0.18em] text-muted-foreground">{t.lastMessage}</p>
                        <p className="mt-1 line-clamp-2 text-sm leading-6 text-foreground/80">{conversation.lastMessage?.content || t.noMessages}</p>
                      </div>
                    </div>
                  </button>
                );
              })}
            </div>
          )}
        </section>

        <section className="flex min-h-[700px] flex-col overflow-hidden rounded-[34px] border border-border/60 bg-card/95 shadow-soft">
          {!selectedId ? (
            <div className="flex flex-1 items-center justify-center px-8 text-center">
              <div>
                <MessageCircleMore className="mx-auto h-10 w-10 text-primary" />
                <p className="mt-4 text-base leading-7 text-muted-foreground">{t.selectHint}</p>
              </div>
            </div>
          ) : isLoadingConversation || !activeConversation ? (
            <div className="flex flex-1 items-center justify-center">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
          ) : (
            <>
              <div className="border-b border-border/60 bg-background/80 px-6 py-5 backdrop-blur">
                <div className="flex items-center justify-between gap-4">
                  <div className="flex min-w-0 items-center gap-4">
                    <div className="flex h-14 w-14 items-center justify-center overflow-hidden rounded-2xl bg-primary/10 text-primary">
                      {selectedSummary?.customer.avatar ? (
                        <img src={selectedSummary.customer.avatar} alt={selectedSummary.customer.name || selectedSummary.customer.email} className="h-full w-full object-cover" />
                      ) : (
                        <UserRound className="h-6 w-6" />
                      )}
                    </div>
                    <div className="min-w-0">
                      <p className="font-heading text-sm font-semibold uppercase tracking-[0.2em] text-muted-foreground">{t.customer}</p>
                      <h2 className="truncate text-2xl font-semibold">{selectedSummary?.customer.name || selectedSummary?.customer.email}</h2>
                      <p className="truncate text-sm text-muted-foreground">{selectedSummary?.customer.email}</p>
                    </div>
                  </div>
                  <div
                    className={cn(
                      'inline-flex rounded-full border px-3 py-1.5 text-[11px] font-semibold uppercase tracking-[0.16em]',
                      toneClassMap[activeConversation.workflowStatus.tone]
                    )}
                  >
                    {activeConversation.workflowStatus.label}
                  </div>
                </div>
              </div>

              <div className="flex-1 space-y-4 overflow-y-auto bg-background/50 px-6 py-6">
                {activeConversation.messages.map((item) => (
                  <div key={item.id} className={cn('flex', item.sender === 'ADMIN' ? 'justify-end' : 'justify-start')}>
                    <div
                      className={cn(
                        'max-w-[82%] rounded-[24px] px-4 py-3 text-sm leading-7 shadow-sm',
                        item.sender === 'ADMIN'
                          ? 'bg-primary text-primary-foreground'
                          : item.sender === 'SYSTEM'
                            ? 'border border-dashed border-border/70 bg-card text-muted-foreground'
                            : 'border border-border/60 bg-card text-foreground'
                      )}
                    >
                      <p className="mb-2 text-[11px] font-semibold uppercase tracking-[0.16em] opacity-75">
                        {item.sender === 'ADMIN' ? t.adminLabel : item.sender === 'USER' ? t.customer : t.systemLabel}
                      </p>
                      <p className="whitespace-pre-wrap">{item.content}</p>
                      <p className={cn('mt-2 text-[11px]', item.sender === 'ADMIN' ? 'text-primary-foreground/75' : 'text-muted-foreground')}>
                        {formatTime(item.createdAt, locale)}
                      </p>
                    </div>
                  </div>
                ))}
              </div>

              <form onSubmit={handleSendReply} className="border-t border-border/60 bg-card px-6 py-5">
                <div className="flex items-center gap-3">
                  <Input
                    value={message}
                    onChange={(event) => setMessage(event.target.value)}
                    placeholder={t.replyPlaceholder}
                    className="h-12 rounded-2xl"
                    disabled={isSending}
                  />
                  <Button type="submit" className="h-12 rounded-2xl px-5" disabled={isSending || !message.trim()}>
                    {isSending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
                    <span className="ml-2 hidden sm:inline">{t.send}</span>
                  </Button>
                </div>
              </form>
            </>
          )}
        </section>
      </div>
    </div>
  );
};
