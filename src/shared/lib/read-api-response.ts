export const readApiResponse = async <T = unknown>(
  response: Response,
  fallbackMessage = 'May chu dang tra ve du lieu khong hop le. Vui long kiem tra lai API production.'
): Promise<T> => {
  const text = await response.text();
  const contentType = response.headers.get('content-type') || '';

  if (!text) {
    throw new Error('May chu chua tra ve du lieu. Vui long kiem tra cau hinh API production.');
  }

  if (!contentType.toLowerCase().includes('application/json')) {
    if (!response.ok) {
      throw new Error(`API production dang loi (${response.status}). Vui long kiem tra Vercel Function logs va bien moi truong.`);
    }

    throw new Error(fallbackMessage);
  }

  try {
    return JSON.parse(text) as T;
  } catch {
    throw new Error(fallbackMessage);
  }
};
