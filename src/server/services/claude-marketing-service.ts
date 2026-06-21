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

const getAnthropicApiKeys = () => {
  const rawKeys = [process.env.ANTHROPIC_API_KEYS, process.env.ANTHROPIC_API_KEY].filter(Boolean).join('\n');
  return Array.from(
    new Set(
      rawKeys
        .split(/[\n,;]/)
        .map((key) => key.trim())
        .filter(Boolean)
    )
  );
};

const shouldTryNextKey = (status: number) => [401, 403, 408, 409, 429, 500, 502, 503, 504].includes(status);

export const refineMarketingPrompt = async (input: RefineMarketingPromptInput, provider: 'LOCAL' | 'CLAUDE' = 'LOCAL') => {
  const localPrompt = buildMarketingPromptDraft(input);
  if (provider !== 'CLAUDE') return { prompt: localPrompt, provider: 'local-template' };

  const apiKeys = getAnthropicApiKeys();
  if (!apiKeys.length) {
    throw new Error('Chưa cấu hình ANTHROPIC_API_KEY hoặc ANTHROPIC_API_KEYS nên chưa thể dùng Claude để tối ưu prompt.');
  }

  const model = process.env.ANTHROPIC_MODEL || 'claude-opus-4-8';
  let lastError = 'Claude prompt refinement failed.';
  let prompt = '';

  for (const [index, apiKey] of apiKeys.entries()) {
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
        system: 'Bạn là senior creative director cho ecommerce Việt Nam. Bạn chỉ viết prompt tạo ảnh rõ ràng, ngắn gọn, có tính thương mại, không giải thích ngoài prompt.',
        messages: [{ role: 'user', content: localPrompt }],
      }),
    });

    const payload = await response.json().catch(() => null);
    if (response.ok) {
      prompt = extractClaudeText(payload);
      if (prompt) break;
      lastError = 'Claude không trả về prompt hợp lệ.';
    } else {
      lastError = payload?.error?.message || payload?.message || `Claude prompt refinement failed with ${response.status}`;
      if (index < apiKeys.length - 1 && shouldTryNextKey(response.status)) continue;
      throw new Error(lastError);
    }
  }

  if (!prompt) throw new Error(lastError);

  return {
    prompt,
    provider: 'anthropic-claude',
    model,
  };
};
