import { useEffect, useMemo, useRef, useState } from 'react';
import { BadgePercent, Clipboard, Flame, ImageIcon, Loader2, Megaphone, PackageCheck, Pencil, Plus, Save, Search, Sparkles, Trash2, Upload, Wand2, X } from 'lucide-react';
import { toast } from 'sonner';
import { adminService } from '@/src/entities/admin/api/admin-service';
import type { MarketingCampaignFormPayload, MarketingCampaignPayload } from '@/src/entities/admin/model/types';
import { useProducts } from '@/src/entities/product/api/product-api';
import { Button } from '@/src/shared/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/src/shared/ui/dialog';
import { EmptyState } from '@/src/shared/ui/empty-state';
import { Input } from '@/src/shared/ui/input';
import { LoadingState } from '@/src/shared/ui/loading-state';

const DEFAULT_FORM: MarketingCampaignFormPayload = {
  name: '',
  slug: '',
  type: 'PROMOTION',
  description: '',
  bannerImage: '',
  productIds: [],
  startsAt: null,
  endsAt: null,
  isActive: true,
};

type BannerAiMode = 'PROMPT' | 'IMAGE';
type BannerPromptProvider = 'LOCAL' | 'CLAUDE';

const toLocalDateTimeValue = (value?: string | null) => {
  if (!value) return '';
  const date = new Date(value);
  const offset = date.getTimezoneOffset();
  return new Date(date.getTime() - offset * 60 * 1000).toISOString().slice(0, 16);
};

const toIsoOrNull = (value: string) => (value ? new Date(value).toISOString() : null);

const getCampaignRuntimeStatus = (item: Pick<MarketingCampaignPayload, 'isActive' | 'startsAt' | 'endsAt'>) => {
  if (!item.isActive) return { label: 'Tạm dừng', className: 'bg-muted text-muted-foreground' };
  const now = Date.now();
  const startsAt = item.startsAt ? new Date(item.startsAt).getTime() : null;
  const endsAt = item.endsAt ? new Date(item.endsAt).getTime() : null;
  if (startsAt && startsAt > now) return { label: 'Sắp chạy', className: 'bg-sky-500/10 text-sky-600' };
  if (endsAt && endsAt <= now) return { label: 'Đã kết thúc', className: 'bg-zinc-500/10 text-zinc-600' };
  return { label: 'Đang chạy', className: 'bg-emerald-500/10 text-emerald-600' };
};

const isCampaignRunning = (item: MarketingCampaignPayload) => getCampaignRuntimeStatus(item).label === 'Đang chạy';

const slugify = (value: string) =>
  value
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replaceAll('đ', 'd')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');

const readImageAsDataUrl = (file: File) =>
  new Promise<string>((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result || ''));
    reader.onerror = () => reject(new Error('Không thể đọc ảnh đã chọn'));
    reader.readAsDataURL(file);
  });

const buildBannerPrompt = ({
  basicPrompt,
  form,
  productNames,
}: {
  basicPrompt: string;
  form: MarketingCampaignFormPayload;
  productNames: string[];
}) => {
  const campaignTypeLabel = form.type === 'FLASH_SALE' ? 'flash sale' : form.type === 'DEAL' ? 'deal nổi bật' : 'khuyến mãi';
  const products = productNames.length ? productNames.join(', ') : 'sản phẩm hoặc bối cảnh được mô tả trong yêu cầu';
  const campaignName = form.name.trim() || 'chiến dịch marketing của Hai Tụi Mình';
  const description = form.description?.trim() || 'không có mô tả bổ sung';

  return `Tạo một ảnh banner quảng cáo thương mại điện tử chuyên nghiệp cho cửa hàng Việt Nam "Hai Tụi Mình".

Mục tiêu chiến dịch: ${campaignName}
Loại chiến dịch: ${campaignTypeLabel}
Mô tả chiến dịch: ${description}
Sản phẩm/bối cảnh liên quan: ${products}
Yêu cầu ngắn của admin: ${basicPrompt.trim()}

Yêu cầu thiết kế:
- Tỷ lệ ngang, phù hợp banner website/homepage và overlay chiến dịch.
- Phong cách hiện đại, bắt mắt, có không khí mùa vụ nếu prompt có nhắc đến ngày lễ, mùa hè, sự kiện hoặc giảm giá.
- Nếu có chữ trong ảnh, dùng tiếng Việt tự nhiên, ngắn, rõ, dễ đọc; ưu tiên headline lớn và CTA gọn.
- Nếu prompt có ngày, phần trăm giảm giá hoặc ưu đãi, thể hiện các thông tin đó nổi bật và chính xác.
- Thêm watermark thương hiệu nhỏ, tinh tế: "Tiệm bách hoá Hai Tụi Mình". Watermark phải dễ đọc nhưng không che nội dung chính.
- Bố cục có điểm nhấn rõ, màu sắc thương mại, ánh sáng đẹp, không rối mắt.
- Không bịa logo thương hiệu, chứng nhận, số điện thoại, QR code, URL hoặc cam kết pháp lý.
- Không để chữ bị méo, sai chính tả, quá nhỏ hoặc quá nhiều.

Xuất một ảnh banner hoàn chỉnh, sẵn dùng cho chiến dịch bán hàng.`;
};

export const AdminMarketing = () => {
  const [items, setItems] = useState<MarketingCampaignPayload[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [query, setQuery] = useState('');
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [isGeneratingImage, setIsGeneratingImage] = useState(false);
  const [bannerAiMode, setBannerAiMode] = useState<BannerAiMode>('PROMPT');
  const [bannerPromptProvider, setBannerPromptProvider] = useState<BannerPromptProvider>('LOCAL');
  const [imagePrompt, setImagePrompt] = useState('');
  const [generatedPrompt, setGeneratedPrompt] = useState('');
  const [, setRuntimeTick] = useState(0);
  const [editingItem, setEditingItem] = useState<MarketingCampaignPayload | null>(null);
  const [form, setForm] = useState<MarketingCampaignFormPayload>(DEFAULT_FORM);
  const [productPickerValue, setProductPickerValue] = useState('');
  const [productPickerQuery, setProductPickerQuery] = useState('');
  const uploadInputRef = useRef<HTMLInputElement | null>(null);
  const { data: productData } = useProducts({ page: 1, limit: 200 });
  const products = productData?.items || [];

  const selectedProductIds = useMemo(() => new Set(form.productIds || []), [form.productIds]);

  const selectedProducts = useMemo(
    () => products.filter((product) => selectedProductIds.has(product.id)),
    [products, selectedProductIds]
  );

  const selectedProductNames = useMemo(() => selectedProducts.map((product) => product.name), [selectedProducts]);

  const availableProducts = useMemo(() => {
    const lookup = productPickerQuery.trim().toLowerCase();
    return products
      .filter((product) => !selectedProductIds.has(product.id))
      .filter((product) => {
        if (!lookup) return true;
        return `${product.name} ${product.sku || ''} ${typeof product.category === 'object' ? product.category?.name || '' : product.category || ''}`.toLowerCase().includes(lookup);
      })
      .slice(0, 80);
  }, [productPickerQuery, products, selectedProductIds]);

  const loadData = async () => {
    setIsLoading(true);
    try {
      setItems(await adminService.getMarketingCampaigns());
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    void loadData();
  }, []);

  useEffect(() => {
    const timer = window.setInterval(() => setRuntimeTick((tick) => tick + 1), 30000);
    return () => window.clearInterval(timer);
  }, []);

  const filtered = useMemo(
    () => items.filter((item) => `${item.name} ${item.type} ${item.slug}`.toLowerCase().includes(query.toLowerCase())),
    [items, query]
  );

  const resetAiDraft = () => {
    setImagePrompt('');
    setGeneratedPrompt('');
    setBannerAiMode('PROMPT');
    setBannerPromptProvider('LOCAL');
  };

  const openCreate = () => {
    setEditingItem(null);
    setForm(DEFAULT_FORM);
    resetAiDraft();
    setProductPickerValue('');
    setProductPickerQuery('');
    setIsDialogOpen(true);
  };

  const openEdit = (item: MarketingCampaignPayload) => {
    setEditingItem(item);
    setForm({
      name: item.name,
      slug: item.slug,
      type: item.type,
      description: item.description || '',
      bannerImage: item.bannerImage || '',
      productIds: item.productIds || [],
      startsAt: item.startsAt || null,
      endsAt: item.endsAt || null,
      isActive: item.isActive,
    });
    resetAiDraft();
    setProductPickerValue('');
    setProductPickerQuery('');
    setIsDialogOpen(true);
  };

  const handleSave = async () => {
    if (!form.name.trim() || !form.slug.trim()) {
      toast.error('Vui lòng nhập tên và slug chiến dịch');
      return;
    }
    setIsSaving(true);
    try {
      if (editingItem) {
        await adminService.updateMarketingCampaign(editingItem.id, form);
        toast.success('Đã cập nhật chiến dịch');
      } else {
        await adminService.createMarketingCampaign(form);
        toast.success('Đã tạo chiến dịch');
      }
      setIsDialogOpen(false);
      await loadData();
    } catch (error: any) {
      toast.error(error.message || 'Không thể lưu chiến dịch');
    } finally {
      setIsSaving(false);
    }
  };

  const handleDelete = async (item: MarketingCampaignPayload) => {
    if (!window.confirm(`Ngừng chiến dịch "${item.name}"?`)) return;
    try {
      await adminService.deleteMarketingCampaign(item.id);
      toast.success('Đã ngừng chiến dịch');
      await loadData();
    } catch (error: any) {
      toast.error(error.message || 'Không thể ngừng chiến dịch');
    }
  };

  const createRefinedPrompt = async () => {
    if (bannerPromptProvider === 'LOCAL') return buildBannerPrompt({ basicPrompt: imagePrompt, form, productNames: selectedProductNames });

    const refined = await adminService.refineMarketingPrompt({
      prompt: imagePrompt,
      provider: bannerPromptProvider,
      campaignType: form.type,
      campaignName: form.name || null,
      description: form.description || null,
      productIds: form.productIds || [],
    });
    return refined.prompt;
  };

  const handleCreatePrompt = async () => {
    if (!imagePrompt.trim()) {
      toast.error('Nhập vài dòng yêu cầu cơ bản để tạo prompt');
      return;
    }

    try {
      const prompt = await createRefinedPrompt();
      setGeneratedPrompt(prompt);
      await navigator.clipboard?.writeText(prompt).then(
        () => toast.success(bannerPromptProvider === 'CLAUDE' ? 'Claude đã tối ưu và copy prompt' : 'Đã tạo và copy prompt hoàn chỉnh'),
        () => toast.success('Đã tạo prompt hoàn chỉnh')
      );
    } catch (error: any) {
      toast.error(error.message || 'Không thể tạo prompt marketing');
    }
  };

  const handleCopyPrompt = async () => {
    if (!generatedPrompt) return;
    await navigator.clipboard?.writeText(generatedPrompt).then(
      () => toast.success('Đã copy prompt'),
      () => toast.error('Không thể copy tự động, hãy bôi đen prompt để copy')
    );
  };

  const handleGenerateImage = async () => {
    if (!imagePrompt.trim()) {
      toast.error('Nhập yêu cầu để tạo ảnh quảng cáo');
      return;
    }

    setIsGeneratingImage(true);
    try {
      const prompt = await createRefinedPrompt();
      setGeneratedPrompt(prompt);
      const generated = await adminService.generateMarketingImage({
        prompt,
        campaignType: form.type,
        campaignName: form.name || null,
        description: form.description || null,
        productIds: form.productIds || [],
      });
      setForm((prev) => ({ ...prev, bannerImage: generated.imageUrl }));
      toast.success('Đã tạo ảnh và gắn vào banner');
    } catch (error: any) {
      toast.error(error.message || 'Không thể tạo ảnh quảng cáo');
    } finally {
      setIsGeneratingImage(false);
    }
  };

  const handleUploadBanner = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    event.target.value = '';
    if (!file) return;
    if (!file.type.startsWith('image/')) {
      toast.error('Vui lòng chọn file ảnh');
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      toast.error('Ảnh banner nên nhỏ hơn 5MB');
      return;
    }

    try {
      const dataUrl = await readImageAsDataUrl(file);
      setForm((prev) => ({ ...prev, bannerImage: dataUrl }));
      toast.success('Đã tải ảnh lên banner');
    } catch (error: any) {
      toast.error(error.message || 'Không thể đọc ảnh');
    }
  };

  const handleAddCampaignProduct = () => {
    if (!productPickerValue) {
      toast.error('Vui lòng chọn sản phẩm trước khi thêm');
      return;
    }

    setForm((prev) => {
      const currentIds = prev.productIds || [];
      if (currentIds.includes(productPickerValue)) return prev;
      return { ...prev, productIds: [...currentIds, productPickerValue] };
    });
    setProductPickerValue('');
    setProductPickerQuery('');
  };

  const handleRemoveCampaignProduct = (productId: string) => {
    setForm((prev) => ({ ...prev, productIds: (prev.productIds || []).filter((id) => id !== productId) }));
  };

  const getTypeBadge = (type: MarketingCampaignPayload['type']) => {
    if (type === 'FLASH_SALE') return { label: 'Flash Sale', className: 'bg-rose-500/10 text-rose-600', icon: Flame };
    if (type === 'DEAL') return { label: 'Deal', className: 'bg-amber-500/10 text-amber-600', icon: BadgePercent };
    return { label: 'Promotion', className: 'bg-sky-500/10 text-sky-600', icon: Megaphone };
  };

  return (
    <div className="space-y-8">
      <div className="flex flex-col gap-5 md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="text-4xl font-black uppercase italic tracking-tighter">
            Marketing <span className="text-primary italic">tổng quan</span>
          </h1>
          <p className="mt-1 text-sm text-muted-foreground">Quản lý flash sale, deal ngắn hạn và khuyến mãi dài hơi cho cửa hàng.</p>
        </div>
        <Button onClick={openCreate} className="h-11 rounded-xl px-6 text-[10px] font-black uppercase tracking-widest">
          <Plus className="mr-2 h-4 w-4" />
          Tạo chiến dịch
        </Button>
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        {[
          { label: 'Flash Sale', count: items.filter((item) => item.type === 'FLASH_SALE' && isCampaignRunning(item)).length },
          { label: 'Deal', count: items.filter((item) => item.type === 'DEAL' && isCampaignRunning(item)).length },
          { label: 'Khuyến mãi', count: items.filter((item) => item.type === 'PROMOTION' && isCampaignRunning(item)).length },
        ].map((item) => (
          <div key={item.label} className="rounded-[28px] border border-border/50 bg-surface-default p-6">
            <p className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">{item.label}</p>
            <p className="mt-2 text-3xl font-black">{item.count}</p>
          </div>
        ))}
      </div>

      <div className="relative max-w-xl">
        <Search className="absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
        <Input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Tìm theo tên chiến dịch, slug, loại..." className="h-12 rounded-2xl border-2 border-border bg-surface-default pl-12 text-sm font-medium" />
      </div>

      {isLoading ? (
        <LoadingState size="md" label="Đang tải chiến dịch" />
      ) : filtered.length === 0 ? (
        <EmptyState icon={Megaphone} title="Chưa có chiến dịch phù hợp" description="Tạo flash sale, deal hoặc khuyến mãi đầu tiên để tiếp cận khách hàng nhanh hơn." />
      ) : (
        <div className="grid gap-4">
          {filtered.map((item) => {
            const badge = getTypeBadge(item.type);
            const Icon = badge.icon;
            const runtimeStatus = getCampaignRuntimeStatus(item);
            return (
              <div key={item.id} className="rounded-[28px] border border-border/50 bg-surface-default p-5">
                <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
                  <div className="space-y-3">
                    <div className="flex flex-wrap items-center gap-3">
                      <span className={`inline-flex items-center gap-2 rounded-full px-3 py-1 text-[10px] font-black uppercase tracking-widest ${badge.className}`}>
                        <Icon className="h-3.5 w-3.5" />
                        {badge.label}
                      </span>
                      <span className={`rounded-full px-3 py-1 text-[10px] font-black uppercase tracking-widest ${runtimeStatus.className}`}>
                        {runtimeStatus.label}
                      </span>
                    </div>
                    <div>
                      <p className="text-lg font-black">{item.name}</p>
                      <p className="mt-1 text-sm text-muted-foreground">/{item.slug}</p>
                    </div>
                    <p className="text-sm text-muted-foreground">{item.description || 'Chưa có mô tả chiến dịch.'}</p>
                    <div className="grid gap-3 text-sm md:grid-cols-3">
                      <div className="rounded-2xl border border-border/50 bg-background px-4 py-3">
                        <p className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Sản phẩm áp dụng</p>
                        <p className="mt-2 font-black">{item.productIds?.length || 0}</p>
                      </div>
                      <div className="rounded-2xl border border-border/50 bg-background px-4 py-3">
                        <p className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Bắt đầu</p>
                        <p className="mt-2 font-black">{item.startsAt ? new Date(item.startsAt).toLocaleString('vi-VN') : '-'}</p>
                      </div>
                      <div className="rounded-2xl border border-border/50 bg-background px-4 py-3">
                        <p className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Kết thúc</p>
                        <p className="mt-2 font-black">{item.endsAt ? new Date(item.endsAt).toLocaleString('vi-VN') : '-'}</p>
                      </div>
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <Button variant="outline" onClick={() => openEdit(item)} className="h-11 rounded-xl px-5 text-[10px] font-black uppercase tracking-widest">
                      <Pencil className="mr-2 h-4 w-4" />
                      Sửa
                    </Button>
                    <Button variant="outline" onClick={() => void handleDelete(item)} className="h-11 rounded-xl px-5 text-[10px] font-black uppercase tracking-widest text-destructive">
                      <Trash2 className="mr-2 h-4 w-4" />
                      Dừng
                    </Button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="max-h-[90vh] overflow-y-auto rounded-[32px] border-none bg-surface-default p-8 sm:max-w-4xl">
          <DialogHeader>
            <DialogTitle className="text-2xl font-black uppercase tracking-tight">{editingItem ? 'Cập nhật chiến dịch' : 'Tạo chiến dịch marketing'}</DialogTitle>
          </DialogHeader>
          <div className="grid gap-5">
            <div className="grid gap-5 md:grid-cols-2">
              <div className="space-y-2">
                <label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Tên chiến dịch</label>
                <Input
                  value={form.name}
                  onChange={(event) => {
                    const name = event.target.value;
                    setForm((prev) => ({ ...prev, name, slug: editingItem ? prev.slug : slugify(name) }));
                  }}
                />
              </div>
              <div className="space-y-2">
                <label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Slug</label>
                <Input value={form.slug} onChange={(event) => setForm((prev) => ({ ...prev, slug: event.target.value }))} />
              </div>
              <div className="space-y-2">
                <label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Loại chiến dịch</label>
                <select value={form.type} onChange={(event) => setForm((prev) => ({ ...prev, type: event.target.value as MarketingCampaignPayload['type'] }))} className="h-12 w-full rounded-2xl border border-border bg-background px-4 text-sm font-bold outline-none">
                  <option value="PROMOTION">Khuyến mãi</option>
                  <option value="DEAL">Deal</option>
                  <option value="FLASH_SALE">Flash Sale</option>
                </select>
              </div>
              <div className="space-y-2">
                <label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Link hoặc data ảnh banner</label>
                <Input value={form.bannerImage || ''} onChange={(event) => setForm((prev) => ({ ...prev, bannerImage: event.target.value }))} />
              </div>
            </div>

            <div className="grid gap-4 rounded-2xl border border-dashed border-primary/40 bg-background p-4 md:grid-cols-[1fr_240px]">
              <div className="space-y-4">
                <div className="grid gap-2 sm:grid-cols-[180px_190px_1fr] sm:items-end">
                  <div className="space-y-2">
                    <label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Chế độ AI banner</label>
                    <select value={bannerAiMode} onChange={(event) => setBannerAiMode(event.target.value as BannerAiMode)} className="h-11 w-full rounded-xl border border-border bg-surface-default px-3 text-sm font-bold outline-none">
                      <option value="PROMPT">Tạo prompt</option>
                      <option value="IMAGE">Tạo ảnh</option>
                    </select>
                  </div>
                  <div className="space-y-2">
                    <label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Bộ tạo prompt</label>
                    <select value={bannerPromptProvider} onChange={(event) => setBannerPromptProvider(event.target.value as BannerPromptProvider)} className="h-11 w-full rounded-xl border border-border bg-surface-default px-3 text-sm font-bold outline-none">
                      <option value="LOCAL">Local template</option>
                      <option value="CLAUDE">Claude API</option>
                    </select>
                  </div>
                  <p className="text-xs font-medium leading-5 text-muted-foreground">
                    {bannerAiMode === 'PROMPT'
                      ? (bannerPromptProvider === 'CLAUDE' ? 'Claude dùng để tối ưu prompt chữ. Claude API không tạo ảnh bitmap trực tiếp; sau đó bạn paste prompt sang công cụ tạo ảnh hoặc dùng nút tạo ảnh qua provider ảnh.' : 'Nhập ý ngắn, hệ thống bọc thành prompt hoàn chỉnh để paste sang ChatGPT, Gemini, Ideogram hoặc công cụ AI khác.')
                      : (bannerPromptProvider === 'CLAUDE' ? 'Claude sẽ tối ưu prompt trước, còn ảnh thật vẫn được tạo qua OpenAI/codex-imagen hoặc provider ảnh đã cấu hình.' : 'Chế độ này cần production cấu hình API key/billing của OpenAI, Gemini hoặc provider ảnh thật.')}
                  </p>
                </div>

                <div className="flex items-center gap-2 text-[10px] font-black uppercase tracking-widest text-muted-foreground">
                  <Sparkles className="h-4 w-4 text-primary" />
                  Yêu cầu cơ bản
                </div>
                <textarea
                  value={imagePrompt}
                  onChange={(event) => setImagePrompt(event.target.value)}
                  rows={4}
                  placeholder="VD: thiết kế banner overlay ngày 6/6, chào hè rực rỡ, giảm giá đến 50%, text ngắn và thu hút"
                  className="w-full rounded-2xl border border-border bg-surface-default px-4 py-3 text-sm outline-none"
                />

                <div className="flex flex-wrap gap-2">
                  {bannerAiMode === 'PROMPT' ? (
                    <Button type="button" onClick={() => void handleCreatePrompt()} className="h-11 rounded-xl px-5 text-[10px] font-black uppercase tracking-widest">
                      <Wand2 className="mr-2 h-4 w-4" />
                      Tạo prompt
                    </Button>
                  ) : (
                    <Button type="button" onClick={() => void handleGenerateImage()} disabled={isGeneratingImage} className="h-11 rounded-xl px-5 text-[10px] font-black uppercase tracking-widest">
                      {isGeneratingImage ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <ImageIcon className="mr-2 h-4 w-4" />}
                      Tạo ảnh qua API
                    </Button>
                  )}
                  <Button type="button" variant="outline" onClick={() => uploadInputRef.current?.click()} className="h-11 rounded-xl px-5 text-[10px] font-black uppercase tracking-widest">
                    <Upload className="mr-2 h-4 w-4" />
                    Upload ảnh banner
                  </Button>
                  <input ref={uploadInputRef} type="file" accept="image/*" onChange={(event) => void handleUploadBanner(event)} className="hidden" />
                </div>

                {generatedPrompt ? (
                  <div className="space-y-2">
                    <div className="flex items-center justify-between gap-3">
                      <label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Prompt hoàn chỉnh</label>
                      <Button type="button" variant="outline" onClick={() => void handleCopyPrompt()} className="h-8 rounded-lg px-3 text-[10px] font-black uppercase tracking-widest">
                        <Clipboard className="mr-1 h-3.5 w-3.5" />
                        Copy
                      </Button>
                    </div>
                    <textarea readOnly value={generatedPrompt} rows={7} className="w-full rounded-2xl border border-border bg-surface-default px-4 py-3 text-xs leading-5 text-foreground outline-none" />
                  </div>
                ) : null}
              </div>
              <div className="flex min-h-[180px] flex-col gap-3">
                <div className="flex min-h-[150px] flex-1 items-center justify-center overflow-hidden rounded-2xl border border-border bg-surface-default">
                  {form.bannerImage ? (
                    <img src={form.bannerImage} alt="Campaign banner" className="h-full max-h-[220px] w-full object-cover" />
                  ) : (
                    <ImageIcon className="h-8 w-8 text-muted-foreground" />
                  )}
                </div>
                <p className="text-xs font-medium leading-5 text-muted-foreground">Sau khi upload hoặc tạo ảnh thành công, ảnh này sẽ được lưu vào banner chiến dịch.</p>
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Mô tả</label>
              <textarea value={form.description || ''} onChange={(event) => setForm((prev) => ({ ...prev, description: event.target.value }))} rows={4} className="w-full rounded-2xl border border-border bg-background px-4 py-3 text-sm outline-none" />
            </div>

            <div className="grid gap-5 md:grid-cols-2">
              <div className="space-y-2">
                <label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Bắt đầu</label>
                <Input type="datetime-local" value={toLocalDateTimeValue(form.startsAt)} onChange={(event) => setForm((prev) => ({ ...prev, startsAt: toIsoOrNull(event.target.value) }))} />
              </div>
              <div className="space-y-2">
                <label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Kết thúc</label>
                <Input type="datetime-local" value={toLocalDateTimeValue(form.endsAt)} onChange={(event) => setForm((prev) => ({ ...prev, endsAt: toIsoOrNull(event.target.value) }))} />
              </div>
            </div>
            <div className="space-y-3 rounded-2xl border border-border bg-background p-4">
              <div className="flex flex-col gap-1 sm:flex-row sm:items-end sm:justify-between">
                <div>
                  <label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Sản phẩm áp dụng</label>
                  <p className="mt-1 text-xs font-medium text-muted-foreground">Chọn từng sản phẩm rồi bấm thêm. Sản phẩm đã chọn sẽ hiện bên dưới.</p>
                </div>
                <span className="inline-flex w-fit items-center gap-2 rounded-xl bg-primary/10 px-3 py-2 text-[10px] font-black uppercase tracking-widest text-primary">
                  <PackageCheck className="h-3.5 w-3.5" />
                  {selectedProducts.length} đã chọn
                </span>
              </div>

              <div className="grid gap-3 lg:grid-cols-[minmax(0,1fr)_minmax(0,1.5fr)_auto] lg:items-end">
                <div className="space-y-2">
                  <span className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Tìm nhanh</span>
                  <Input
                    value={productPickerQuery}
                    onChange={(event) => setProductPickerQuery(event.target.value)}
                    placeholder="Nhập tên, SKU, danh mục..."
                    className="h-11 rounded-xl bg-surface-default text-sm"
                  />
                </div>
                <div className="space-y-2">
                  <span className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Chọn sản phẩm</span>
                  <select
                    value={productPickerValue}
                    onChange={(event) => setProductPickerValue(event.target.value)}
                    className="h-11 w-full rounded-xl border border-border bg-surface-default px-3 text-sm font-bold text-foreground outline-none"
                  >
                    <option value="">Chọn sản phẩm để thêm vào chiến dịch</option>
                    {availableProducts.map((product) => (
                      <option key={product.id} value={product.id}>
                        {product.name} {product.sku ? `(${product.sku})` : ''}
                      </option>
                    ))}
                  </select>
                </div>
                <Button type="button" onClick={handleAddCampaignProduct} disabled={!productPickerValue} className="h-11 rounded-xl px-5 text-[10px] font-black uppercase tracking-widest">
                  <Plus className="mr-2 h-4 w-4" />
                  Thêm
                </Button>
              </div>

              {selectedProducts.length > 0 ? (
                <div className="flex flex-wrap gap-2 rounded-2xl border border-border/60 bg-surface-default p-3">
                  {selectedProducts.map((product) => (
                    <span key={product.id} className="inline-flex max-w-full items-center gap-2 rounded-xl border border-primary/20 bg-primary/10 px-3 py-2 text-xs font-bold text-primary">
                      <span className="truncate">{product.name}</span>
                      <button type="button" onClick={() => handleRemoveCampaignProduct(product.id)} className="flex h-5 w-5 items-center justify-center rounded-full bg-background/70 text-primary transition-colors hover:bg-background" aria-label={`Bỏ ${product.name} khỏi chiến dịch`}>
                        <X className="h-3.5 w-3.5" />
                      </button>
                    </span>
                  ))}
                </div>
              ) : (
                <div className="rounded-2xl border border-dashed border-border bg-surface-default px-4 py-5 text-center text-sm font-medium text-muted-foreground">
                  Chưa chọn sản phẩm nào cho chiến dịch này.
                </div>
              )}
            </div>

            <label className="flex items-center justify-between rounded-2xl border border-border px-4 py-3 text-sm font-bold">
              Kích hoạt chiến dịch
              <input type="checkbox" checked={form.isActive} onChange={(event) => setForm((prev) => ({ ...prev, isActive: event.target.checked }))} />
            </label>
          </div>
          <div className="mt-6 flex justify-end gap-3">
            <Button variant="outline" onClick={() => setIsDialogOpen(false)} className="h-11 rounded-xl px-6 text-[10px] font-black uppercase tracking-widest">
              Hủy
            </Button>
            <Button onClick={() => void handleSave()} disabled={isSaving} className="h-11 rounded-xl px-6 text-[10px] font-black uppercase tracking-widest">
              {isSaving ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Save className="mr-2 h-4 w-4" />}
              Lưu chiến dịch
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};
