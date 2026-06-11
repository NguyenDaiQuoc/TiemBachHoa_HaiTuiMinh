export const readApiResponse = async <T = unknown>(
  response: Response,
  fallbackMessage = 'Máy chủ đang trả về dữ liệu không hợp lệ. Vui lòng kiểm tra lại API production.'
): Promise<T> => {
  const text = await response.text();
  const contentType = response.headers.get('content-type') || '';

  if (!text) {
    throw new Error('Máy chủ chưa trả về dữ liệu. Vui lòng kiểm tra cấu hình API production.');
  }

  if (!contentType.toLowerCase().includes('application/json')) {
    if (!response.ok) {
      throw new Error(`API production đang lỗi (${response.status}). Vui lòng kiểm tra Vercel Function logs và biến môi trường.`);
    }

    throw new Error(fallbackMessage);
  }

  try {
    return JSON.parse(text) as T;
  } catch {
    throw new Error(fallbackMessage);
  }
};
