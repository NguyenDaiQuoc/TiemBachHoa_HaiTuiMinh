export type CampaignType = 'FLASH_SALE' | 'DEAL' | 'PROMOTION';

export type RefineMarketingPromptInput = {
  basicPrompt: string;
  campaignType: CampaignType;
  campaignName?: string | null;
  description?: string | null;
  productNames?: string[];
};

const campaignLabel: Record<CampaignType, string> = {
  FLASH_SALE: 'flash sale',
  DEAL: 'deal nổi bật',
  PROMOTION: 'khuyến mãi',
};

export const buildMarketingPromptDraft = ({ basicPrompt, campaignType, campaignName, description, productNames = [] }: RefineMarketingPromptInput) => {
  const products = productNames.length ? productNames.join(', ') : 'sản phẩm hoặc bối cảnh được mô tả trong yêu cầu';
  const name = campaignName?.trim() || 'chiến dịch marketing của Hai Tụi Mình';
  const note = description?.trim() || 'không có mô tả bổ sung';

  return `Tạo một prompt ảnh banner quảng cáo thương mại điện tử chuyên nghiệp cho cửa hàng Việt Nam "Hai Tụi Mình".

Mục tiêu chiến dịch: ${name}
Loại chiến dịch: ${campaignLabel[campaignType]}
Mô tả chiến dịch: ${note}
Sản phẩm/bối cảnh liên quan: ${products}
Yêu cầu ngắn của admin: ${basicPrompt.trim()}

Yêu cầu prompt đầu ra:
- Viết bằng tiếng Việt tự nhiên, rõ nghĩa, sẵn để paste vào công cụ tạo ảnh.
- Banner ngang cho website/homepage/campaign overlay.
- Nêu rõ bố cục, ánh sáng, màu sắc thương hiệu, sản phẩm chính, headline và CTA nếu phù hợp.
- Nếu có ngày, mùa, phần trăm giảm giá hoặc ưu đãi, giữ đúng thông tin và làm nổi bật.
- Tránh chữ quá nhiều, chữ méo, logo giả, QR, URL, số điện thoại hoặc cam kết pháp lý bịa.
- Chỉ trả về prompt hoàn chỉnh, không giải thích thêm.`;
};

const extractClaudeText = (payload: any) => {
  const content = Array.isArray(payload?.content) ? payload.content : [];
  return content
    .map((part) => (part?.type === 'text' && typeof part.text === 'string' ? part.text : ''))
    .join('\n')
    .trim();
};

export const refineMarketingPrompt = async (input: RefineMarketingPromptInput, provider: 'LOCAL' | 'CLAUDE' = 'LOCAL') => {
  const localPrompt = buildMarketingPromptDraft(input);
  if (provider !== 'CLAUDE') return { prompt: localPrompt, provider: 'local-template' };

  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) {
    throw new Error('Chưa cấu hình ANTHROPIC_API_KEY nên chưa thể dùng Claude để tối ưu prompt.');
  }

  const model = process.env.ANTHROPIC_MODEL || 'claude-sonnet-4-5-20250929';
  const response = await fetch('https://api.anthropic.com/v1/messages', {
    method: 'POST',
    headers: {
      'x-api-key': apiKey,
      'anthropic-version': process.env.ANTHROPIC_VERSION || '2023-06-01',
      'content-type': 'application/json',
    },
    body: JSON.stringify({
      model,
      max_tokens: 1200,
      temperature: 0.4,
      system: 'Bạn là senior creative director cho ecommerce Việt Nam. Bạn chỉ viết prompt tạo ảnh rõ ràng, ngắn gọn, có tính thương mại, không giải thích ngoài prompt.',
      messages: [{ role: 'user', content: localPrompt }],
    }),
  });

  const payload = await response.json().catch(() => null);
  if (!response.ok) {
    throw new Error(payload?.error?.message || payload?.message || `Claude prompt refinement failed with ${response.status}`);
  }

  const prompt = extractClaudeText(payload);
  if (!prompt) throw new Error('Claude không trả về prompt hợp lệ.');

  return {
    prompt,
    provider: 'anthropic-claude',
    model,
  };
};
