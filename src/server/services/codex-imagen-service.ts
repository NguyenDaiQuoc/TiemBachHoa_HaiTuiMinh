import { spawn } from 'node:child_process';
import { promises as fs } from 'node:fs';
import os from 'node:os';
import path from 'node:path';

type CampaignType = 'FLASH_SALE' | 'DEAL' | 'PROMOTION';

type GenerateMarketingImageInput = {
  adminPrompt: string;
  campaignType: CampaignType;
  campaignName?: string | null;
  description?: string | null;
  productNames?: string[];
};

type CodexImagenSummary = {
  images?: Array<{ path?: string; decodedPath?: string; sha256?: string; bytes?: number; revised_prompt?: string }>;
  image_count?: number;
  imageCount?: number;
  timed_out?: boolean;
  retry_attempts?: number;
  retryAttempts?: number;
};

type GeneratedMarketingImage = {
  prompt: string;
  finalPrompt: string;
  imagePath: string;
  imageUrl: string;
  metadata: Record<string, unknown>;
};

const DEFAULT_IMAGE_SCRIPT = path.join(os.homedir(), '.codex', 'skills', 'codex-imagen', 'scripts', 'codex-imagen.mjs');
const GENERATED_DIR = process.env.CODEX_IMAGEN_OUT_DIR || path.join(os.tmpdir(), 'haituiminh-generated-marketing');

const campaignLabel: Record<CampaignType, string> = {
  FLASH_SALE: 'flash sale',
  DEAL: 'short-term deal',
  PROMOTION: 'promotional campaign',
};

export const buildMarketingImagePrompt = ({ adminPrompt, campaignType, campaignName, description, productNames = [] }: GenerateMarketingImageInput) => {
  const products = productNames.length ? productNames.join(', ') : 'sản phẩm hoặc bối cảnh mà quản trị viên mô tả';
  const optionalDescription = description?.trim() ? `Ghi chú chiến dịch: ${description.trim()}` : 'Ghi chú chiến dịch: không có';
  const optionalName = campaignName?.trim() ? `Tên chiến dịch: ${campaignName.trim()}` : 'Tên chiến dịch: không có';

  return `Tạo một ảnh banner quảng cáo thương mại điện tử chất lượng cao cho cửa hàng Việt Nam "Hai Tụi Mình".

Loại chiến dịch: ${campaignLabel[campaignType]}.
${optionalName}.
${optionalDescription}.
Sản phẩm/bối cảnh: ${products}.
Yêu cầu của quản trị viên: ${adminPrompt.trim()}.

Yêu cầu thiết kế:
- Phong cách hiện đại, mùa vụ, sạch, đáng tin cậy và có khả năng chuyển đổi cao.
- Phù hợp để dùng làm banner trang chủ, overlay chiến dịch, social post hoặc flash sale.
- Nếu có chữ trong ảnh, dùng tiếng Việt tự nhiên, ngắn, dễ đọc, không bị méo chữ.
- Với yêu cầu có ngày hoặc mức giảm giá, thể hiện rõ ngày/ưu đãi bằng chữ lớn, thu hút.
- Bố cục có điểm nhấn rõ, màu sắc bắt mắt, có khoảng trống hợp lý cho sản phẩm và CTA.
- Không bịa logo thương hiệu, chứng nhận, số điện thoại, QR, URL hoặc cam kết pháp lý giả.
- Không làm ảnh rối, chữ quá nhiều, chữ khó đọc, sản phẩm méo hoặc thông tin khuyến mãi gây hiểu nhầm.

Xuất ra một ảnh banner quảng cáo sẵn dùng, tỷ lệ ngang.`;
};

const parseJson = (value: string) => {
  try {
    return JSON.parse(value) as CodexImagenSummary;
  } catch {
    throw new Error('codex-imagen did not return valid JSON.');
  }
};

const fileToDataUrl = async (filePath: string) => {
  const extension = path.extname(filePath).toLowerCase();
  const mimeType = extension === '.jpg' || extension === '.jpeg' ? 'image/jpeg' : extension === '.webp' ? 'image/webp' : 'image/png';
  const bytes = await fs.readFile(filePath);
  return `data:${mimeType};base64,${bytes.toString('base64')}`;
};

const runCodexImagen = (scriptPath: string, finalPrompt: string) =>
  new Promise<CodexImagenSummary>((resolve, reject) => {
    const child = spawn(process.execPath, [scriptPath, '--json', '--timeout', '300', '--out-dir', GENERATED_DIR, '--prompt', finalPrompt], {
      cwd: process.cwd(),
      windowsHide: true,
    });

    let stdout = '';
    let stderr = '';

    child.stdout.on('data', (chunk) => {
      stdout += chunk.toString();
    });

    child.stderr.on('data', (chunk) => {
      stderr += chunk.toString();
    });

    child.on('error', reject);
    child.on('close', (code) => {
      if (code !== 0) {
        reject(new Error(stderr.trim() || `codex-imagen exited with code ${code}`));
        return;
      }
      resolve(parseJson(stdout));
    });
  });

const generateWithCodexImagen = async (input: GenerateMarketingImageInput, finalPrompt: string): Promise<GeneratedMarketingImage | null> => {
  const scriptPath = process.env.CODEX_IMAGEN_SCRIPT_PATH || DEFAULT_IMAGE_SCRIPT;

  try {
    await fs.access(scriptPath);
  } catch {
    return null;
  }

  await fs.mkdir(GENERATED_DIR, { recursive: true });
  const summary = await runCodexImagen(scriptPath, finalPrompt);
  const image = summary.images?.find((item) => item.path || item.decodedPath);
  const imagePath = image?.decodedPath || image?.path;
  if (!imagePath) throw new Error('codex-imagen không trả về ảnh nào.');

  return {
    prompt: input.adminPrompt.trim(),
    finalPrompt,
    imagePath,
    imageUrl: await fileToDataUrl(imagePath),
    metadata: {
      provider: 'codex-imagen',
      scriptPath,
      imageCount: summary.image_count ?? summary.imageCount ?? 1,
      timedOut: Boolean(summary.timed_out),
      retryAttempts: summary.retry_attempts ?? summary.retryAttempts ?? 0,
      bytes: image?.bytes ?? null,
      sha256: image?.sha256 ?? null,
      revisedPrompt: image?.revised_prompt ?? null,
    },
  };
};

const findImageBase64 = (payload: any): string | null => {
  const output = Array.isArray(payload?.output) ? payload.output : [];
  for (const item of output) {
    if (item?.type === 'image_generation_call' && typeof item.result === 'string') return item.result;
    const content = Array.isArray(item?.content) ? item.content : [];
    for (const part of content) {
      if (part?.type === 'output_image' && typeof part.image_base64 === 'string') return part.image_base64;
      if (part?.type === 'image_generation_call' && typeof part.result === 'string') return part.result;
    }
  }
  return null;
};

const generateWithOpenAI = async (input: GenerateMarketingImageInput, finalPrompt: string): Promise<GeneratedMarketingImage | null> => {
  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) return null;

  const response = await fetch('https://api.openai.com/v1/responses', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${apiKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      model: process.env.OPENAI_IMAGE_MODEL || 'gpt-4.1-mini',
      input: finalPrompt,
      tools: [
        {
          type: 'image_generation',
          size: '1536x1024',
          quality: 'high',
          output_format: 'png',
        },
      ],
    }),
  });

  const payload = await response.json().catch(() => null);
  if (!response.ok) {
    throw new Error(payload?.error?.message || payload?.message || `OpenAI image generation failed with ${response.status}`);
  }

  const imageBase64 = findImageBase64(payload);
  if (!imageBase64) throw new Error('OpenAI không trả về ảnh trong response.');

  return {
    prompt: input.adminPrompt.trim(),
    finalPrompt,
    imagePath: `openai://responses/${payload?.id || Date.now()}.png`,
    imageUrl: `data:image/png;base64,${imageBase64}`,
    metadata: {
      provider: 'openai-responses-image-generation',
      responseId: payload?.id || null,
      model: process.env.OPENAI_IMAGE_MODEL || 'gpt-4.1-mini',
      imageCount: 1,
      timedOut: false,
      retryAttempts: 0,
    },
  };
};

export const generateMarketingImage = async (input: GenerateMarketingImageInput) => {
  const finalPrompt = buildMarketingImagePrompt(input);

  const openAiImage = await generateWithOpenAI(input, finalPrompt);
  if (openAiImage) return openAiImage;

  const codexImage = await generateWithCodexImagen(input, finalPrompt);
  if (codexImage) return codexImage;

  throw new Error('Chưa cấu hình công cụ tạo ảnh thật trên production. Hãy thêm OPENAI_API_KEY vào Vercel hoặc cấu hình CODEX_IMAGEN_SCRIPT_PATH kèm auth cho codex-imagen.');
};
