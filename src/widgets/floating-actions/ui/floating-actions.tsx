import { FormEvent, useEffect, useMemo, useRef, useState } from 'react';
import { motion, useReducedMotion } from 'motion/react';
import { Bot, CheckCheck, CircleDot, Headset, Loader2, MessageCircleMore, Send, Sparkles, UserRound, X } from 'lucide-react';
import { communityKeys, SupportChannel, useSendSupportMessage, useSupportConversation } from '@/src/entities/community/api/community-api';
import { queryClient } from '@/src/shared/lib/react-query';
import { useAuthStore } from '@/src/shared/model/auth-store';
import { useSupportUnreadStore } from '@/src/shared/model/support-unread-store';
import { cn } from '@/src/shared/lib/utils';
import { Button } from '@/src/shared/ui/button';
import { Drawer, DrawerContent, DrawerDescription, DrawerHeader, DrawerTitle } from '@/src/shared/ui/drawer';
import { Input } from '@/src/shared/ui/input';
import { ScrollToTopButton } from '@/src/shared/ui/scroll-to-top-button';
import { toast } from 'sonner';


const channelCopy: Record<
  SupportChannel,
  {
    title: string;
    description: string;
    placeholder: string;
    suggestions: string[];
    icon: typeof Bot;
    pendingLabel: string;
    authLabel: string;
    modeLabel: string;
    summaryLabel: string;
  }
> = {
  AI: {
    title: 'Chatbot hỗ trợ',
    description: 'Tư vấn theo nhu cầu mua sắm, gợi ý sản phẩm phù hợp và lưu lịch sử riêng cho từng tài khoản.',
    placeholder: 'Nhắn nhu cầu của bạn để được chatbot hỗ trợ...',
    suggestions: ['Tư vấn serum cho da dầu mụn dưới 500.000đ', 'Gợi ý nồi chiên không dầu chính hãng', 'Chọn tai nghe pin lâu để đi làm'],
    icon: Bot,
    pendingLabel: 'Chatbot đang soạn gợi ý phù hợp...',
    authLabel: 'Đăng nhập để dùng chatbot hỗ trợ cá nhân hóa.',
    modeLabel: 'Tư vấn tự động',
    summaryLabel: 'Luôn sẵn sàng',
  },
  HUMAN: {
    title: 'Nhân viên tư vấn',
    description: 'Gửi yêu cầu cho nhân viên tư vấn. Mỗi tài khoản có một cửa sổ chat riêng để theo dõi và hỗ trợ chốt đơn.',
    placeholder: 'Nhắn yêu cầu để nhân viên tư vấn hỗ trợ...',
    suggestions: ['Mình cần tư vấn combo chăm sóc da phù hợp', 'Cho mình hỏi deal nào tốt cho đồ gia dụng hôm nay', 'Nhờ nhân viên hỗ trợ chốt đơn giúp mình'],
    icon: Headset,
    pendingLabel: 'Đang gửi yêu cầu cho nhân viên tư vấn...',
    authLabel: 'Đăng nhập để nhắn với nhân viên tư vấn.',
    modeLabel: 'Nhân viên thật hỗ trợ',
    summaryLabel: 'Sẽ có nhân viên tiếp nhận',
  },
};

const workflowToneClassMap = {
  warning: 'border-amber-500/20 bg-amber-500/10 text-amber-700',
  info: 'border-sky-500/20 bg-sky-500/10 text-sky-700',
  primary: 'border-primary/20 bg-primary/10 text-primary',
  success: 'border-emerald-500/20 bg-emerald-500/10 text-emerald-700',
} as const;

const humanWorkflowHintMap = {
  PENDING: 'Yêu cầu của bạn đang chờ nhân viên tiếp nhận.',
  RECEIVED: 'Nhân viên đã tiếp nhận cuộc trò chuyện của bạn.',
  IN_PROGRESS: 'Nhân viên đang xử lý và sẽ phản hồi trong cửa sổ chat này.',
  READ: 'Bạn đã xem phản hồi mới nhất từ nhân viên.',
} as const;

const formatMessageTime = (value: string) =>
  new Date(value).toLocaleTimeString('vi-VN', {
    hour: '2-digit',
    minute: '2-digit',
  });

export const FloatingActions = () => {
  const reduceMotion = useReducedMotion();
  const token = useAuthStore((state) => state.token);
  const isHydrated = useAuthStore((state) => state.isHydrated);
  const userUnreadCount = useSupportUnreadStore((state) => state.userUnreadCount);
  const incrementUserUnread = useSupportUnreadStore((state) => state.incrementUserUnread);
  const resetUserUnread = useSupportUnreadStore((state) => state.resetUserUnread);
  const isAuthenticated = !!token;
  const [isChatOpen, setIsChatOpen] = useState(false);
  const [activeChannel, setActiveChannel] = useState<SupportChannel>('AI');
  const [message, setMessage] = useState('');
  const messageViewportRef = useRef<HTMLDivElement | null>(null);

  const aiConversationQuery = useSupportConversation('AI', isAuthenticated && isChatOpen && activeChannel === 'AI');
  const humanConversationQuery = useSupportConversation('HUMAN', isAuthenticated && isChatOpen && activeChannel === 'HUMAN');
  const sendMessageMutation = useSendSupportMessage();

  const currentQuery = activeChannel === 'AI' ? aiConversationQuery : humanConversationQuery;
  const currentConversation = currentQuery.data;
  const messages = useMemo(() => currentConversation?.messages || [], [currentConversation]);
  const currentCopy = channelCopy[activeChannel];
  const CurrentIcon = currentCopy.icon;

  useEffect(() => {
    if (!token) {
      resetUserUnread();
      return;
    }

    const stream = new EventSource(`/api/community/chat/stream?token=${encodeURIComponent(token)}`);

    const handleSupport = (event: Event) => {
      const payload = JSON.parse((event as MessageEvent).data || '{}') as { channel?: SupportChannel; sender?: string };
      if (payload.channel !== 'HUMAN') return;

      queryClient.invalidateQueries({ queryKey: communityKeys.chat('HUMAN') });

      if (isChatOpen && activeChannel === 'HUMAN') {
        resetUserUnread();
        return;
      }

      if (payload.sender === 'ADMIN' || payload.sender === 'SYSTEM' || !payload.sender) {
        incrementUserUnread();
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
  }, [activeChannel, incrementUserUnread, isChatOpen, resetUserUnread, token]);

  useEffect(() => {
    if (isChatOpen && activeChannel === 'HUMAN') {
      resetUserUnread();
    }
  }, [activeChannel, isChatOpen, resetUserUnread]);

  useEffect(() => {
    const viewport = messageViewportRef.current;
    if (!viewport) return;
    viewport.scrollTo({ top: viewport.scrollHeight, behavior: reduceMotion ? 'auto' : 'smooth' });
  }, [messages, reduceMotion, currentConversation?.workflowStatus.code]);

  const handleSendMessage = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const nextMessage = message.trim();

    if (!isAuthenticated) {
      toast.error(currentCopy.authLabel);
      return;
    }

    if (!nextMessage) return;

    try {
      await sendMessageMutation.mutateAsync({ channel: activeChannel, message: nextMessage });
      setMessage('');
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Không thể gửi tin nhắn');
    }
  };

  return (
    <>
      <div className="fixed bottom-3 right-3 z-[70] flex flex-row-reverse items-end gap-2 md:bottom-6 md:right-6 md:flex-col md:gap-3">
        <motion.button
          whileHover={reduceMotion ? undefined : { scale: 1.04 }}
          whileTap={reduceMotion ? undefined : { scale: 0.96 }}
          onClick={() => setIsChatOpen(true)}
          className="relative flex h-14 w-14 items-center justify-center rounded-2xl border border-emerald-200/80 bg-white p-1.5 shadow-xl shadow-emerald-500/20 transition-colors hover:bg-emerald-50 dark:border-emerald-400/20 dark:bg-slate-950 dark:hover:bg-slate-900 md:h-[4.75rem] md:w-[4.75rem] md:rounded-[1.7rem] md:p-2"
          aria-label="Mở trung tâm hỗ trợ"
        >
          <span className="flex h-10 w-10 items-center justify-center rounded-full bg-[#19b955] text-white shadow-lg shadow-emerald-500/30 md:h-[3.6rem] md:w-[3.6rem]">
            <MessageCircleMore className="h-5 w-5 md:h-7 md:w-7" />
          </span>
          {userUnreadCount > 0 && (
            <span className="absolute -right-1 -top-1 flex min-h-6 min-w-6 items-center justify-center rounded-full border-2 border-background bg-background px-1 text-[10px] font-black text-primary shadow-sm">
              {userUnreadCount > 9 ? '9+' : userUnreadCount}
            </span>
          )}
        </motion.button>

        <motion.a
          whileHover={reduceMotion ? undefined : { scale: 1.04 }}
          whileTap={reduceMotion ? undefined : { scale: 0.96 }}
          href="https://zalo.me/0931454176"
          target="_blank"
          rel="noreferrer"
          className="flex h-14 w-14 items-center justify-center rounded-2xl border border-sky-200/80 bg-white p-1.5 shadow-xl shadow-sky-500/20 transition-transform hover:bg-sky-50 dark:border-sky-400/20 dark:bg-slate-950 dark:hover:bg-slate-900 md:h-[4.75rem] md:w-[4.75rem] md:rounded-[1.7rem] md:p-2"
          aria-label="Liên hệ Zalo"
        >
          <img src="/zalo-logo.svg" alt="Zalo" className="h-10 w-10 object-contain md:h-[3.6rem] md:w-[3.6rem]" />
        </motion.a>

        <motion.a
          whileHover={reduceMotion ? undefined : { scale: 1.04 }}
          whileTap={reduceMotion ? undefined : { scale: 0.96 }}
          href="https://m.me/haituiminh"
          target="_blank"
          rel="noreferrer"
          className="flex h-14 w-14 items-center justify-center rounded-2xl border border-sky-200/80 bg-white p-1 shadow-xl shadow-sky-500/20 transition-transform hover:bg-sky-50 dark:border-sky-400/20 dark:bg-slate-950 dark:hover:bg-slate-900 md:h-[4.75rem] md:w-[4.75rem] md:rounded-[1.7rem] md:p-1.5"
          aria-label="Liên hệ Messenger"
        >
          <img src="/messenger-logo.svg" alt="Messenger" className="h-11 w-11 object-contain md:h-[4rem] md:w-[4rem]" />
        </motion.a>

        <ScrollToTopButton className="h-14 w-14 rounded-2xl border-slate-200/80 bg-white text-foreground shadow-xl shadow-slate-500/15 hover:bg-slate-50 dark:border-slate-400/20 dark:bg-slate-950 dark:hover:bg-slate-900 md:h-[4.75rem] md:w-[4.75rem] md:rounded-[1.7rem] [&>svg]:h-5 [&>svg]:w-5 md:[&>svg]:h-6 md:[&>svg]:w-6" />
      </div>

      <Drawer open={isChatOpen} onOpenChange={setIsChatOpen} direction="right">
        <DrawerContent className="ml-auto h-full w-full max-w-[min(760px,100vw)] border-l border-border/60 bg-card">
          <DrawerHeader className="border-b border-border/60 px-6 py-5 text-left">
            <div className="flex items-start justify-between gap-4">
              <div>
                <p className="font-heading text-sm font-semibold uppercase tracking-[0.22em] text-muted-foreground">Trung tâm hỗ trợ</p>
                <DrawerTitle className="mt-1 text-2xl font-semibold">{currentCopy.title}</DrawerTitle>
                <DrawerDescription className="mt-2 text-sm leading-6">{currentCopy.description}</DrawerDescription>
              </div>
              <button
                onClick={() => setIsChatOpen(false)}
                className="rounded-full border border-border/60 p-2 text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
                aria-label="Đóng chat"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
          </DrawerHeader>

          <div className="border-b border-border/60 px-6 py-5">
            <div className="grid grid-cols-2 gap-3">
              {(['AI', 'HUMAN'] as SupportChannel[]).map((channel) => {
                const item = channelCopy[channel];
                const Icon = item.icon;
                const isActive = activeChannel === channel;

                return (
                  <button
                    key={channel}
                    onClick={() => setActiveChannel(channel)}
                    className={cn(
                      'rounded-[24px] border p-4 text-left transition-all',
                      isActive ? 'border-primary/40 bg-primary/8 shadow-lg shadow-primary/10' : 'border-border/60 bg-background hover:border-primary/20 hover:bg-muted/40'
                    )}
                  >
                    <div className="flex items-center gap-3">
                      <div className={cn('flex h-11 w-11 items-center justify-center rounded-2xl', isActive ? 'bg-primary text-primary-foreground' : 'bg-primary/10 text-primary')}>
                        <Icon className="h-5 w-5" />
                      </div>
                      <div>
                        <p className="font-heading text-base font-semibold">{item.title}</p>
                        <p className="mt-1 text-xs leading-5 text-muted-foreground">{item.modeLabel}</p>
                      </div>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

          <div className="flex min-h-0 flex-1 flex-col">
            <div className="border-b border-border/60 bg-background/80 px-6 py-5 backdrop-blur">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div className="flex items-center gap-3">
                  <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-primary/10 text-primary">
                    <CurrentIcon className="h-5 w-5" />
                  </div>
                  <div>
                    <p className="text-sm font-semibold">{activeChannel === 'AI' ? 'Phiên hỗ trợ tự động' : 'Phiên tư vấn với nhân viên'}</p>
                    <p className="text-xs text-muted-foreground">
                      {activeChannel === 'AI'
                        ? 'Phản hồi nhanh, gợi ý sản phẩm và combo phù hợp.'
                        : 'Theo dõi tiến độ xử lý yêu cầu và phản hồi từ đội ngũ tư vấn.'}
                    </p>
                  </div>
                </div>

                {activeChannel === 'HUMAN' && currentConversation?.workflowStatus ? (
                  <div className={cn('inline-flex items-center gap-2 rounded-full border px-3 py-1.5 text-[11px] font-semibold uppercase tracking-[0.16em]', workflowToneClassMap[currentConversation.workflowStatus.tone])}>
                    <CircleDot className="h-3.5 w-3.5" />
                    {currentConversation.workflowStatus.label}
                  </div>
                ) : (
                  <div className="inline-flex items-center gap-2 rounded-full border border-primary/20 bg-primary/10 px-3 py-1.5 text-[11px] font-semibold uppercase tracking-[0.16em] text-primary">
                    <Sparkles className="h-3.5 w-3.5" />
                    {currentCopy.summaryLabel}
                  </div>
                )}
              </div>

              {activeChannel === 'HUMAN' && currentConversation?.workflowStatus ? (
                <div className="mt-3 grid gap-3 md:grid-cols-3">
                  <div className="rounded-2xl border border-border/60 bg-card px-4 py-3">
                    <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-muted-foreground">Trạng thái</p>
                    <p className="mt-1 text-sm font-semibold">{currentConversation.workflowStatus.label}</p>
                  </div>
                  <div className="rounded-2xl border border-border/60 bg-card px-4 py-3">
                    <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-muted-foreground">Kênh hỗ trợ</p>
                    <p className="mt-1 text-sm font-semibold">Nhân viên tư vấn riêng</p>
                  </div>
                  <div className="rounded-2xl border border-border/60 bg-card px-4 py-3">
                    <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-muted-foreground">Cập nhật mới nhất</p>
                    <p className="mt-1 text-sm font-semibold">{currentConversation.lastMessageAt ? formatMessageTime(currentConversation.lastMessageAt) : 'Chưa có'}</p>
                  </div>
                </div>
              ) : null}
            </div>

            <div ref={messageViewportRef} className="flex-1 space-y-5 overflow-y-auto bg-background/50 px-6 py-6 lg:px-7">
              {isHydrated && !isAuthenticated && (
                <div className="rounded-3xl border border-dashed border-border/60 bg-background p-6 text-center">
                  <CurrentIcon className="mx-auto h-8 w-8 text-primary" />
                  <p className="mt-3 text-sm font-semibold">{currentCopy.authLabel}</p>
                </div>
              )}

              {isAuthenticated && currentQuery.isLoading && (
                <div className="flex items-center justify-center py-12">
                  <Loader2 className="h-6 w-6 animate-spin text-primary" />
                </div>
              )}

              {isAuthenticated && currentQuery.isError && (
                <div className="rounded-3xl border border-destructive/20 bg-destructive/5 p-5 text-sm text-destructive">
                  {currentQuery.error instanceof Error ? currentQuery.error.message : 'Không thể tải lịch sử trò chuyện.'}
                </div>
              )}

              {isAuthenticated && !currentQuery.isLoading && messages.length === 0 && (
                <div className="rounded-3xl border border-border/60 bg-background p-6">
                  <div className="flex items-center gap-2">
                    <Sparkles className="h-4 w-4 text-primary" />
                    <p className="text-sm font-semibold">Gợi ý bắt đầu</p>
                  </div>
                  <ul className="mt-3 space-y-2 text-sm leading-6 text-muted-foreground">
                    {currentCopy.suggestions.map((item) => (
                      <li key={item}>"{item}"</li>
                    ))}
                  </ul>
                </div>
              )}

              {messages.map((item) => (
                <div key={item.id} className={cn('flex', item.sender === 'USER' ? 'justify-end' : 'justify-start')}>
                  <div
                    className={cn(
                      'max-w-[88%] rounded-3xl px-5 py-4 text-sm leading-7 shadow-sm',
                      item.sender === 'USER'
                        ? 'bg-primary text-primary-foreground'
                        : item.sender === 'ASSISTANT'
                          ? 'border border-border/60 bg-background text-foreground'
                          : item.sender === 'ADMIN'
                            ? 'border border-emerald-500/20 bg-emerald-500/10 text-foreground'
                            : 'border border-dashed border-border/70 bg-card text-muted-foreground'
                    )}
                  >
                    <div className="mb-2 flex items-center gap-2 text-[11px] font-semibold uppercase tracking-[0.16em] opacity-75">
                      {item.sender === 'ASSISTANT' && <Bot className="h-3.5 w-3.5" />}
                      {item.sender === 'ADMIN' && <Headset className="h-3.5 w-3.5" />}
                      {item.sender === 'USER' && <UserRound className="h-3.5 w-3.5" />}
                      {item.sender === 'ASSISTANT' ? 'Chatbot' : item.sender === 'ADMIN' ? 'Nhân viên' : item.sender === 'USER' ? 'Bạn' : 'Hệ thống'}
                    </div>
                    <p className="whitespace-pre-wrap">{item.content}</p>
                    <div className="mt-2 flex items-center justify-between gap-3 text-[11px] opacity-75">
                      <span>{formatMessageTime(item.createdAt)}</span>
                      {activeChannel === 'HUMAN' && item.sender === 'ADMIN' && (
                        <span className="inline-flex items-center gap-1">
                          <CheckCheck className="h-3.5 w-3.5" />
                          Phản hồi tư vấn
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              ))}

              {sendMessageMutation.isPending && (
                <div className="flex justify-start">
                  <div className="rounded-3xl border border-border/60 bg-background px-4 py-3 text-sm text-muted-foreground">{currentCopy.pendingLabel}</div>
                </div>
              )}
            </div>

            <form onSubmit={handleSendMessage} className="border-t border-border/60 bg-card px-6 py-5">
              {activeChannel === 'HUMAN' && (
                <p className="mb-3 text-xs leading-5 text-muted-foreground">
                  {currentConversation?.workflowStatus ? humanWorkflowHintMap[currentConversation.workflowStatus.code] : 'Nhân viên sẽ hỗ trợ ngay trong cửa sổ chat này.'}
                </p>
              )}

              <div className="flex items-center gap-3">
                <Input
                  value={message}
                  onChange={(event) => setMessage(event.target.value)}
                  placeholder={currentCopy.placeholder}
                  className="h-12 rounded-2xl"
                  disabled={!isAuthenticated || sendMessageMutation.isPending}
                />
                <Button type="submit" disabled={!isAuthenticated || sendMessageMutation.isPending || !message.trim()} className="h-12 rounded-2xl px-4">
                  <Send className="h-4 w-4" />
                </Button>
              </div>
            </form>
          </div>
        </DrawerContent>
      </Drawer>
    </>
  );
};
