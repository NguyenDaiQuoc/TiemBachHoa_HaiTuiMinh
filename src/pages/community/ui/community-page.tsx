import { useMemo, useState } from 'react';
import { motion, useReducedMotion } from 'motion/react';
import { BadgeCheck, CheckCircle2, ChevronRight, Flame, Gift, Heart, Loader2, MessageSquareHeart, Sparkles, Star, Users2 } from 'lucide-react';
import { Link } from 'react-router-dom';
import {
  useClaimReferral,
  useCommunityCheckIn,
  useCommunityFeed,
  useCommunityMissions,
  useCommunityShop,
  useDoCheckIn,
  useReferral,
  useToggleShopFollow,
} from '@/src/entities/community/api/community-api';
import { Button } from '@/src/shared/ui/button';
import { Input } from '@/src/shared/ui/input';
import { useAuthStore } from '@/src/shared/model/auth-store';
import { cn } from '@/src/shared/lib/utils';
import { toast } from 'sonner';

const cardMotion = {
  initial: { opacity: 0, y: 20 },
  whileInView: { opacity: 1, y: 0 },
  viewport: { once: true, amount: 0.2 },
  transition: { duration: 0.35 },
};

export const CommunityPage = () => {
  const reduceMotion = useReducedMotion();
  const isAuthenticated = useAuthStore((state) => !!state.token);
  const [referralCode, setReferralCode] = useState('');

  const { data: shop, isLoading: shopLoading } = useCommunityShop();
  const followMutation = useToggleShopFollow();
  const feedQuery = useCommunityFeed();
  const checkInQuery = useCommunityCheckIn(isAuthenticated);
  const checkInMutation = useDoCheckIn();
  const referralQuery = useReferral(isAuthenticated);
  const claimReferralMutation = useClaimReferral();
  const missionsQuery = useCommunityMissions(isAuthenticated);

  const feedItems = useMemo(
    () => feedQuery.data?.pages.flatMap((page) => page.data.items) || [],
    [feedQuery.data]
  );

  const trendingProducts = feedQuery.data?.pages[0]?.data.trendingProducts || [];

  const handleToggleFollow = async () => {
    if (!isAuthenticated) {
      toast.error('Vui lòng đăng nhập để theo dõi cộng đồng');
      return;
    }

    try {
      const response = await followMutation.mutateAsync();
      toast.success(response.following ? 'Đã theo dõi cửa hàng' : 'Đã bỏ theo dõi cửa hàng');
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Không thể cập nhật theo dõi');
    }
  };

  const handleCheckIn = async () => {
    try {
      await checkInMutation.mutateAsync();
      toast.success('Điểm danh thành công');
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Không thể điểm danh');
    }
  };

  const handleClaimReferral = async () => {
    const code = referralCode.trim();
    if (!code) {
      toast.error('Vui lòng nhập mã giới thiệu');
      return;
    }

    try {
      await claimReferralMutation.mutateAsync(code);
      toast.success('Áp dụng mã giới thiệu thành công');
      setReferralCode('');
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Không thể áp dụng mã giới thiệu');
    }
  };

  return (
    <div className="bg-background text-foreground">
      <section className="border-b border-border/50 bg-card">
        <div className="container mx-auto grid max-w-7xl gap-8 px-4 py-10 lg:grid-cols-[1.3fr_0.7fr] lg:items-end">
          <div className="space-y-5">
            <p className="text-[10px] font-black uppercase tracking-[0.28em] text-muted-foreground">
              Social Commerce Hub
            </p>
            <h1 className="text-4xl font-black uppercase tracking-tight md:text-6xl">
              Cộng đồng <span className="text-primary italic">mua sắm thật</span>
            </h1>
            <p className="max-w-2xl text-sm leading-relaxed text-muted-foreground md:text-base">
              Khám phá đánh giá đã xác minh, hình ảnh thực tế, nhiệm vụ tích điểm và các tín hiệu mua sắm đáng tin cậy
              dành cho mỹ phẩm chính hãng, đồ gia dụng và đồ công nghệ.
            </p>
            <div className="flex flex-wrap gap-3">
              {['Đánh giá thật', 'Ảnh/video thật', 'Theo dõi shop', 'Điểm danh mỗi ngày'].map((item) => (
                <span
                  key={item}
                  className="rounded-full border border-border/60 bg-background px-4 py-2 text-[10px] font-black uppercase tracking-widest text-muted-foreground"
                >
                  {item}
                </span>
              ))}
            </div>
          </div>

          <motion.div
            {...(reduceMotion ? {} : cardMotion)}
            className="rounded-[32px] border border-border/60 bg-background p-6 shadow-soft"
          >
            {shopLoading ? (
              <div className="flex min-h-52 items-center justify-center">
                <Loader2 className="h-6 w-6 animate-spin text-primary" />
              </div>
            ) : (
              <div className="space-y-5">
                <div className="flex items-start justify-between gap-4">
                  <div className="space-y-2">
                    <p className="text-[10px] font-black uppercase tracking-[0.2em] text-primary">Official Community</p>
                    <h2 className="text-2xl font-black tracking-tight">{shop?.name}</h2>
                    <p className="text-sm text-muted-foreground">{shop?.description}</p>
                  </div>
                  <BadgeCheck className="h-6 w-6 text-primary" />
                </div>

                <div className="grid grid-cols-3 gap-3">
                  <div className="rounded-2xl border border-border/60 bg-card p-4">
                    <p className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Follower</p>
                    <p className="mt-2 text-2xl font-black text-primary">{shop?.followerCount || 0}</p>
                  </div>
                  <div className="rounded-2xl border border-border/60 bg-card p-4">
                    <p className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Feed thật</p>
                    <p className="mt-2 text-2xl font-black text-primary">{feedItems.length}</p>
                  </div>
                  <div className="rounded-2xl border border-border/60 bg-card p-4">
                    <p className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Nhiệm vụ</p>
                    <p className="mt-2 text-2xl font-black text-primary">{missionsQuery.data?.missions.length || 0}</p>
                  </div>
                </div>

                <Button
                  onClick={handleToggleFollow}
                  disabled={followMutation.isPending}
                  className="h-12 w-full rounded-2xl text-xs font-black uppercase tracking-widest"
                >
                  {shop?.following ? 'Đang theo dõi cộng đồng' : 'Theo dõi cửa hàng'}
                </Button>
              </div>
            )}
          </motion.div>
        </div>
      </section>

      <div className="container mx-auto grid max-w-7xl gap-10 px-4 py-10 lg:grid-cols-[1.2fr_0.8fr]">
        <section className="space-y-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground">Community Feed</p>
              <h2 className="text-3xl font-black uppercase tracking-tight">Khách hàng đang chia sẻ gì</h2>
            </div>
            <Link
              to="/products"
              className="inline-flex h-10 items-center justify-center rounded-2xl border border-border bg-background px-4 text-sm font-medium transition-colors hover:bg-muted"
            >
              Khám phá sản phẩm
              <ChevronRight className="ml-1 h-4 w-4" />
            </Link>
          </div>

          <div className="space-y-5">
            {feedItems.map((item, index) => (
              <motion.article
                key={item.id}
                {...(reduceMotion ? {} : cardMotion)}
                transition={{ duration: 0.3, delay: reduceMotion ? 0 : index * 0.04 }}
                className="rounded-[28px] border border-border/60 bg-card p-5 shadow-soft"
              >
                <div className="flex items-start justify-between gap-4">
                  <div className="flex items-center gap-3">
                    <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-primary/10 text-lg font-black text-primary">
                      {item.review.user.name.charAt(0)}
                    </div>
                    <div>
                      <p className="text-sm font-black">{item.review.user.name}</p>
                      <div className="flex items-center gap-2 text-[11px] text-muted-foreground">
                        <span>{new Date(item.createdAt).toLocaleDateString('vi-VN')}</span>
                        <span>•</span>
                        <span>{item.engagement.badge}</span>
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-1 rounded-full bg-primary/10 px-3 py-1 text-[10px] font-black uppercase tracking-widest text-primary">
                    <Star className="h-3 w-3 fill-current" />
                    {item.review.rating}/5
                  </div>
                </div>

                <div className="mt-5 grid gap-5 md:grid-cols-[1.2fr_0.8fr]">
                  <div className="space-y-4">
                    <p className="text-sm leading-relaxed text-foreground">{item.review.content}</p>
                    {item.review.media.length > 0 && (
                      <div className="grid grid-cols-2 gap-3">
                        {item.review.media.slice(0, 4).map((media) => (
                          <div key={media.url} className="overflow-hidden rounded-2xl border border-border/50 bg-background">
                            {media.type === 'image' ? (
                              <img src={media.url} alt="Đánh giá của khách hàng" className="h-36 w-full object-cover" loading="lazy" />
                            ) : (
                              <video src={media.url} className="h-36 w-full object-cover" controls preload="metadata" />
                            )}
                          </div>
                        ))}
                      </div>
                    )}
                  </div>

                  <Link
                    to={`/product/${item.product.id}`}
                    className="flex gap-4 rounded-[24px] border border-border/50 bg-background p-4 transition-colors hover:bg-muted/50"
                  >
                    <img src={item.product.image} alt={item.product.name} className="h-24 w-24 rounded-2xl object-cover" loading="lazy" />
                    <div className="min-w-0 flex-1">
                      <p className="line-clamp-2 text-sm font-black">{item.product.name}</p>
                      <p className="mt-2 text-lg font-black text-primary">{item.product.price.toLocaleString('vi-VN')}đ</p>
                      <div className="mt-3 flex items-center gap-2 text-[10px] font-black uppercase tracking-wider text-muted-foreground">
                        <Heart className="h-3.5 w-3.5" />
                        {item.engagement.helpfulCount} hữu ích
                      </div>
                    </div>
                  </Link>
                </div>
              </motion.article>
            ))}
          </div>

          <div className="flex justify-center">
            {feedQuery.hasNextPage ? (
              <Button
                onClick={() => feedQuery.fetchNextPage()}
                disabled={feedQuery.isFetchingNextPage}
                variant="outline"
                className="rounded-2xl"
              >
                {feedQuery.isFetchingNextPage ? 'Đang tải thêm...' : 'Xem thêm chia sẻ'}
              </Button>
            ) : (
              <span className="text-sm text-muted-foreground">Bạn đã xem hết các chia sẻ nổi bật hiện tại.</span>
            )}
          </div>
        </section>

        <aside className="space-y-6">
          <motion.section {...(reduceMotion ? {} : cardMotion)} className="rounded-[28px] border border-border/60 bg-card p-6 shadow-soft">
            <div className="flex items-start justify-between gap-4">
              <div>
                <p className="text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground">Daily Check-in</p>
                <h3 className="mt-2 text-2xl font-black tracking-tight">Điểm danh nhận thưởng</h3>
              </div>
              <Flame className="h-6 w-6 text-primary" />
            </div>
            <div className="mt-5 grid grid-cols-2 gap-3">
              <div className="rounded-2xl bg-background p-4">
                <p className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Streak</p>
                <p className="mt-2 text-3xl font-black text-primary">{checkInQuery.data?.streak || 0}</p>
              </div>
              <div className="rounded-2xl bg-background p-4">
                <p className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Trạng thái</p>
                <p className="mt-2 text-sm font-black">{checkInQuery.data?.checkedInToday ? 'Đã điểm danh' : 'Chưa điểm danh'}</p>
              </div>
            </div>
            <Button
              onClick={handleCheckIn}
              disabled={!isAuthenticated || checkInQuery.data?.checkedInToday || checkInMutation.isPending}
              className="mt-5 h-12 w-full rounded-2xl text-xs font-black uppercase tracking-widest"
            >
              {isAuthenticated ? (checkInQuery.data?.checkedInToday ? 'Bạn đã điểm danh hôm nay' : 'Điểm danh ngay') : 'Đăng nhập để điểm danh'}
            </Button>
          </motion.section>

          <motion.section {...(reduceMotion ? {} : cardMotion)} className="rounded-[28px] border border-border/60 bg-card p-6 shadow-soft">
            <div className="flex items-start justify-between gap-4">
              <div>
                <p className="text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground">Referral</p>
                <h3 className="mt-2 text-2xl font-black tracking-tight">Mã giới thiệu</h3>
              </div>
              <Gift className="h-6 w-6 text-primary" />
            </div>

            <div className="mt-5 rounded-2xl bg-background p-4">
              <p className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Mã của bạn</p>
              <p className="mt-2 text-xl font-black text-primary">{referralQuery.data?.profile.code || 'Đăng nhập để xem'}</p>
              <p className="mt-2 text-sm text-muted-foreground">
                Tổng lượt mời: {referralQuery.data?.profile.totalInvites || 0} • Thưởng tích lũy:{' '}
                {(referralQuery.data?.profile.totalRewards || 0).toLocaleString('vi-VN')} điểm
              </p>
            </div>

            <div className="mt-4 flex gap-3">
              <Input
                value={referralCode}
                onChange={(event) => setReferralCode(event.target.value)}
                placeholder="Nhập mã giới thiệu"
                className="h-12 rounded-2xl"
              />
              <Button
                onClick={handleClaimReferral}
                disabled={!isAuthenticated || claimReferralMutation.isPending}
                className="h-12 rounded-2xl px-5 text-xs font-black uppercase tracking-widest"
              >
                Áp dụng
              </Button>
            </div>
          </motion.section>

          <motion.section {...(reduceMotion ? {} : cardMotion)} className="rounded-[28px] border border-border/60 bg-card p-6 shadow-soft">
            <div className="flex items-start justify-between gap-4">
              <div>
                <p className="text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground">Missions & Badges</p>
                <h3 className="mt-2 text-2xl font-black tracking-tight">Tiến độ thành viên</h3>
              </div>
              <Sparkles className="h-6 w-6 text-primary" />
            </div>

            <div className="mt-5 space-y-3">
              {(missionsQuery.data?.missions || []).map((item) => {
                const progressPercent = Math.min(100, Math.round((item.progress / item.mission.targetCount) * 100));

                return (
                  <div key={item.id} className="rounded-2xl bg-background p-4">
                    <div className="flex items-start justify-between gap-4">
                      <div>
                        <p className="text-sm font-black">{item.mission.title}</p>
                        <p className="mt-1 text-xs text-muted-foreground">{item.mission.description}</p>
                      </div>
                      <span className="rounded-full bg-primary/10 px-3 py-1 text-[10px] font-black uppercase tracking-widest text-primary">
                        +{item.mission.rewardPoints}
                      </span>
                    </div>
                    <div className="mt-3 h-2 overflow-hidden rounded-full bg-muted">
                      <div className="h-full rounded-full bg-primary" style={{ width: `${progressPercent}%` }} />
                    </div>
                    <div className="mt-2 flex items-center justify-between text-[11px]">
                      <span className="font-bold text-muted-foreground">
                        {item.progress}/{item.mission.targetCount}
                      </span>
                      <span className={cn('font-black', item.completedAt ? 'text-primary' : 'text-muted-foreground')}>
                        {item.completedAt ? 'Đã hoàn thành' : 'Đang thực hiện'}
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>

            {!!missionsQuery.data?.achievements.length && (
              <div className="mt-5 grid grid-cols-2 gap-3">
                {missionsQuery.data.achievements.slice(0, 4).map((achievement) => (
                  <div key={achievement.id} className="rounded-2xl border border-border/60 bg-background p-4">
                    <div className="flex items-center gap-2">
                      <CheckCircle2 className="h-4 w-4 text-primary" />
                      <p className="text-xs font-black">{achievement.badge.name}</p>
                    </div>
                    <p className="mt-2 text-[11px] text-muted-foreground">{achievement.badge.description}</p>
                  </div>
                ))}
              </div>
            )}
          </motion.section>

          <motion.section {...(reduceMotion ? {} : cardMotion)} className="rounded-[28px] border border-border/60 bg-card p-6 shadow-soft">
            <div className="flex items-start justify-between gap-4">
              <div>
                <p className="text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground">Trending</p>
                <h3 className="mt-2 text-2xl font-black tracking-tight">Đang được quan tâm</h3>
              </div>
              <Users2 className="h-6 w-6 text-primary" />
            </div>

            <div className="mt-5 space-y-3">
              {trendingProducts.map((product) => (
                <Link
                  key={product.id}
                  to={`/product/${product.id}`}
                  className="flex items-center gap-4 rounded-2xl border border-border/60 bg-background p-3 transition-colors hover:bg-muted/50"
                >
                  <img src={product.image} alt={product.name} className="h-16 w-16 rounded-2xl object-cover" loading="lazy" />
                  <div className="min-w-0 flex-1">
                    <p className="line-clamp-2 text-sm font-black">{product.name}</p>
                    <div className="mt-2 flex items-center justify-between gap-3">
                      <span className="text-sm font-black text-primary">{product.price.toLocaleString('vi-VN')}đ</span>
                      <span className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">
                        {product.soldCount} đã bán
                      </span>
                    </div>
                  </div>
                </Link>
              ))}
            </div>

            <div className="mt-5 rounded-2xl border border-dashed border-border/60 bg-background p-4">
              <div className="flex items-center gap-2">
                <MessageSquareHeart className="h-4 w-4 text-primary" />
                <p className="text-xs font-black uppercase tracking-widest">AI hỗ trợ bán hàng</p>
              </div>
              <p className="mt-2 text-sm text-muted-foreground">
                Nút chat AI ở cạnh phải sẽ lưu hội thoại riêng cho từng tài khoản để tư vấn và hỗ trợ chốt đơn.
              </p>
            </div>
          </motion.section>
        </aside>
      </div>
    </div>
  );
};
