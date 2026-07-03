type TraccarDevice = {
  id?: number;
  uniqueId?: string;
  name?: string;
  positionId?: number;
};

type TraccarPosition = {
  id?: number;
  deviceId?: number;
  latitude?: number;
  longitude?: number;
  fixTime?: string;
  deviceTime?: string;
  serverTime?: string;
  speed?: number;
  course?: number;
  address?: string;
  attributes?: Record<string, unknown>;
};

export type TraccarLivePosition = {
  deviceId: number;
  uniqueId?: string;
  deviceName?: string;
  positionId?: number;
  lat: number;
  lng: number;
  timestamp: string;
  address?: string;
  speed?: number;
  course?: number;
  attributes?: Record<string, unknown>;
};

export type TraccarDeviceRef = {
  deviceId?: string | number | null;
  uniqueId?: string | null;
};

const cleanBaseUrl = (value: string) => value.replace(/\/+$/, '');

const textOrNull = (value: unknown) => (typeof value === 'string' && value.trim() ? value.trim() : null);

const numberOrNull = (value: unknown) => {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : null;
};

export const isTraccarConfigured = () => Boolean(process.env.TRACCAR_BASE_URL && (process.env.TRACCAR_TOKEN || (process.env.TRACCAR_EMAIL && process.env.TRACCAR_PASSWORD)));

const traccarHeaders = () => {
  const headers: Record<string, string> = { Accept: 'application/json' };

  if (process.env.TRACCAR_TOKEN) {
    headers.Authorization = `Bearer ${process.env.TRACCAR_TOKEN}`;
  } else if (process.env.TRACCAR_EMAIL && process.env.TRACCAR_PASSWORD) {
    const raw = `${process.env.TRACCAR_EMAIL}:${process.env.TRACCAR_PASSWORD}`;
    headers.Authorization = `Basic ${Buffer.from(raw).toString('base64')}`;
  }

  return headers;
};

const traccarFetch = async <T>(path: string, params: Record<string, string | number | undefined> = {}) => {
  const baseUrl = process.env.TRACCAR_BASE_URL;
  if (!baseUrl) throw new Error('TRACCAR_BASE_URL is not configured');

  const url = new URL(`${cleanBaseUrl(baseUrl)}${path}`);
  Object.entries(params).forEach(([key, value]) => {
    if (value !== undefined && value !== '') url.searchParams.set(key, String(value));
  });

  const response = await fetch(url, { headers: traccarHeaders() });
  if (!response.ok) {
    const message = await response.text().catch(() => '');
    throw new Error(`Traccar request failed (${response.status})${message ? `: ${message.slice(0, 160)}` : ''}`);
  }

  return response.json() as Promise<T>;
};

const resolveDevice = async (ref: TraccarDeviceRef): Promise<TraccarDevice | null> => {
  const deviceId = numberOrNull(ref.deviceId);
  if (deviceId !== null) return { id: deviceId };

  const uniqueId = textOrNull(ref.uniqueId);
  if (!uniqueId) return null;

  const devices = await traccarFetch<TraccarDevice[]>('/api/devices', { uniqueId });
  return devices.find((device) => device.uniqueId === uniqueId) || devices[0] || null;
};

const isValidPosition = (position: TraccarPosition | null | undefined) => {
  const lat = Number(position?.latitude);
  const lng = Number(position?.longitude);
  return Number.isFinite(lat) && Number.isFinite(lng) && Math.abs(lat) <= 90 && Math.abs(lng) <= 180;
};

export const getTraccarLatestPosition = async (ref: TraccarDeviceRef): Promise<TraccarLivePosition | null> => {
  if (!isTraccarConfigured()) return null;

  const device = await resolveDevice(ref);
  const deviceId = numberOrNull(device?.id);
  if (deviceId === null) return null;

  let position: TraccarPosition | null = null;

  if (device?.positionId) {
    const byId = await traccarFetch<TraccarPosition[]>('/api/positions', { id: device.positionId }).catch(() => []);
    position = byId.find(isValidPosition) || null;
  }

  if (!position) {
    const latest = await traccarFetch<TraccarPosition[]>('/api/positions', { deviceId }).catch(() => []);
    position = latest.find((item) => Number(item.deviceId) === deviceId && isValidPosition(item)) || latest.find(isValidPosition) || null;
  }

  if (!isValidPosition(position)) return null;

  return {
    deviceId,
    uniqueId: device?.uniqueId || textOrNull(ref.uniqueId) || undefined,
    deviceName: device?.name,
    positionId: position?.id,
    lat: Number(position?.latitude),
    lng: Number(position?.longitude),
    timestamp: position?.fixTime || position?.deviceTime || position?.serverTime || new Date().toISOString(),
    address: textOrNull(position?.address) || undefined,
    speed: numberOrNull(position?.speed) ?? undefined,
    course: numberOrNull(position?.course) ?? undefined,
    attributes: position?.attributes,
  };
};
