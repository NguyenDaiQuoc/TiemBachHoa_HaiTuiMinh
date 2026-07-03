export type CarrierCode = 'GHN' | 'GHTK' | 'VIETTEL_POST' | 'SPX';

export type CarrierTrackingEvent = {
  id: string;
  status: string;
  description: string;
  locationName?: string | null;
  timestamp?: string | null;
  raw?: unknown;
};

export type CarrierTrackingResult = {
  carrier: CarrierCode;
  trackingCode: string;
  configured: boolean;
  lastSyncAt: string;
  status?: string | null;
  events: CarrierTrackingEvent[];
  error?: string | null;
};

const carrierNames: Record<CarrierCode, string> = {
  GHN: 'Giao Hàng Nhanh',
  GHTK: 'Giao Hàng Tiết Kiệm',
  VIETTEL_POST: 'Viettel Post',
  SPX: 'SPX Express',
};

const afterShipSlugs: Record<CarrierCode, string> = {
  GHN: process.env.AFTERSHIP_GHN_SLUG || 'ghn',
  GHTK: process.env.AFTERSHIP_GHTK_SLUG || 'ghtk',
  VIETTEL_POST: process.env.AFTERSHIP_VIETTELPOST_SLUG || 'viettelpost',
  SPX: process.env.AFTERSHIP_SPX_SLUG || 'spx-vn',
};

export const isCarrierCode = (value: unknown): value is CarrierCode =>
  value === 'GHN' || value === 'GHTK' || value === 'VIETTEL_POST' || value === 'SPX';

const text = (...values: unknown[]) => {
  for (const value of values) {
    if (typeof value === 'string' && value.trim()) return value.trim();
    if (typeof value === 'number' && Number.isFinite(value)) return String(value);
  }
  return '';
};

const numberText = (value: unknown) => (typeof value === 'number' && Number.isFinite(value) ? String(value) : '');

const isoOrNull = (...values: unknown[]) => {
  for (const value of values) {
    const raw = text(value);
    if (!raw) continue;
    const date = new Date(raw);
    if (Number.isFinite(date.getTime())) return date.toISOString();
  }
  return null;
};

const eventFrom = (carrier: CarrierCode, trackingCode: string, raw: any, index: number): CarrierTrackingEvent => {
  const status =
    text(
      raw.status,
      raw.tag,
      raw.subtag,
      raw.status_text,
      raw.statusText,
      raw.order_status,
      raw.orderStatus,
      raw.label,
      raw.desc,
      raw.description,
      raw.message,
      raw.checkpoint_status,
      raw.statusName,
      raw.ORDER_STATUS_NAME
    ) || 'Đang cập nhật';
  const description = text(raw.description, raw.desc, raw.message, raw.subtag_message, raw.reason, raw.status_text, raw.statusText, raw.note, raw.statusName, raw.ORDER_STATUS_NAME, status);
  const locationName =
    text(
      raw.location,
      raw.location_name,
      raw.locationName,
      raw.address,
      raw.checkpoint_location,
      [raw.city, raw.state, raw.country_name || raw.country].filter(Boolean).join(', '),
      raw.warehouse,
      raw.station,
      raw.current_warehouse,
      raw.currentWarehouse,
      raw.postOfficeName,
      raw.POSTOFFICE_NAME
    ) || null;
  const timestamp = isoOrNull(
    raw.timestamp,
    raw.time,
    raw.checkpoint_time,
    raw.created_at,
    raw.createdAt,
    raw.updated_at,
    raw.updatedAt,
    raw.date,
    raw.log_time,
    raw.scanTime,
    raw.SCAN_TIME,
    raw.STATUS_DATE
  );
  return { id: `${carrier}-${trackingCode}-${timestamp || index}`, status, description, locationName, timestamp, raw };
};

const flattenEvents = (carrier: CarrierCode, trackingCode: string, payload: any) => {
  const data = payload?.data || payload?.order || payload?.trackingInfo || payload;
  const candidates = [
    payload?.data?.tracking?.checkpoints,
    payload?.data?.tracking?.checkpoint ? [payload.data.tracking.checkpoint] : null,
    payload?.data?.checkpoints,
    payload?.data?.checkpoint ? [payload.data.checkpoint] : null,
    payload?.data?.logs,
    payload?.data?.log,
    payload?.data?.tracking,
    payload?.data?.tracks,
    payload?.data?.history,
    payload?.data?.histories,
    payload?.data?.journey,
    payload?.data?.events,
    payload?.data?.order_statuses,
    payload?.data?.ORDER_STATUS,
    payload?.trackingInfo?.logs,
    payload?.trackingInfo?.events,
    payload?.order?.history,
    data?.checkpoints,
    data?.checkpoint ? [data.checkpoint] : null,
    data?.logs,
    data?.tracking,
    data?.tracks,
    data?.history,
    data?.histories,
    data?.journey,
    data?.events,
    data?.order_statuses,
    data?.ORDER_STATUS,
    payload?.logs,
    payload?.tracking,
    payload?.tracks,
    payload?.history,
    payload?.histories,
    payload?.journey,
    payload?.events,
  ];
  const rawEvents = candidates.find(Array.isArray) || [];
  return rawEvents.map((item: any, index: number) => eventFrom(carrier, trackingCode, item, index));
};

const fallbackEvent = (carrier: CarrierCode, trackingCode: string, payload: any): CarrierTrackingEvent => {
  const data = payload?.data?.tracking || payload?.data || payload?.order || payload?.trackingInfo || payload || {};
  const status =
    text(data.status, data.tag, data.subtag, data.status_text, data.statusText, data.order_status, data.orderStatus, data.label, data.statusName, data.ORDER_STATUS_NAME, numberText(data.ORDER_STATUS)) ||
    'Đã kết nối mã vận đơn';
  return {
    id: `${carrier}-${trackingCode}-current`,
    status,
    description:
      text(data.description, data.desc, data.message, data.subtag_message, data.reason, data.status_text, data.statusText, data.statusName, data.ORDER_STATUS_NAME, status) ||
      `${carrierNames[carrier]} đã trả trạng thái mới nhất cho mã ${trackingCode}.`,
    locationName: text(data.location, data.current_warehouse, data.currentWarehouse, data.warehouse, data.station, data.postOfficeName, data.POSTOFFICE_NAME) || null,
    timestamp: isoOrNull(data.updated_at, data.updatedAt, data.created_at, data.createdAt, data.STATUS_DATE) || new Date().toISOString(),
    raw: data,
  };
};

const parseResponse = async (response: Response) => {
  const payload = await response.json().catch(() => null);
  if (!response.ok) {
    const error = text(payload?.meta?.message, payload?.message, payload?.error, payload?.code_message, response.statusText) || `HTTP ${response.status}`;
    throw new Error(error);
  }
  return payload;
};

const fetchGhn = async (trackingCode: string) => {
  const token = process.env.GHN_TOKEN;
  if (!token) throw new Error('Thiếu GHN_TOKEN');

  const response = await fetch('https://online-gateway.ghn.vn/shiip/public-api/v2/shipping-order/detail', {
    method: 'POST',
    headers: { Accept: 'application/json', 'Content-Type': 'application/json', Token: token },
    body: JSON.stringify({ order_code: trackingCode }),
  });
  return parseResponse(response);
};

const fetchGhtk = async (trackingCode: string) => {
  const token = process.env.GHTK_TOKEN;
  if (!token) throw new Error('Thiếu GHTK_TOKEN');

  const endpoint = `https://services.giaohangtietkiem.vn/services/shipment/v2/${encodeURIComponent(trackingCode)}`;
  const response = await fetch(endpoint, {
    headers: {
      Accept: 'application/json',
      Token: token,
      ...(process.env.GHTK_PARTNER_CODE ? { 'X-Client-Source': process.env.GHTK_PARTNER_CODE } : {}),
    },
  });
  return parseResponse(response);
};

const fetchViettelPost = async (trackingCode: string) => {
  const token = process.env.VIETTELPOST_TOKEN || process.env.VIETTEL_POST_TOKEN;
  if (!token) throw new Error('Thiếu VIETTELPOST_TOKEN');

  const baseUrl = process.env.VIETTELPOST_TRACKING_URL || 'https://partner.viettelpost.vn/v2/order/getOrderDetailV3';
  const url = new URL(baseUrl);
  url.searchParams.set('OrderNumber', trackingCode);
  const response = await fetch(url, {
    headers: { Accept: 'application/json', Token: token },
  });
  return parseResponse(response);
};

const buildEndpointUrl = (baseUrl: string, trackingCode: string) => {
  const encoded = encodeURIComponent(trackingCode);
  if (baseUrl.includes('{trackingCode}')) return baseUrl.replaceAll('{trackingCode}', encoded);
  if (baseUrl.includes('{tracking_code}')) return baseUrl.replaceAll('{tracking_code}', encoded);

  const url = new URL(baseUrl);
  if (![...url.searchParams.keys()].length) url.searchParams.set('tracking_number', trackingCode);
  return url.toString();
};

const fetchCustomSpx = async (trackingCode: string) => {
  const endpoint = process.env.SPX_TRACKING_URL;
  if (!endpoint) throw new Error('Thiếu SPX_TRACKING_URL');

  const token = process.env.SPX_TOKEN || process.env.SPX_API_TOKEN;
  const response = await fetch(buildEndpointUrl(endpoint, trackingCode), {
    headers: {
      Accept: 'application/json',
      ...(token ? { Authorization: `Bearer ${token}`, Token: token } : {}),
    },
  });
  return parseResponse(response);
};

const afterShipHeaders = () => {
  const apiKey = process.env.AFTERSHIP_API_KEY || process.env.AFTERSHIP_TRACKING_API_KEY;
  if (!apiKey) throw new Error('Thiếu AFTERSHIP_API_KEY');
  return {
    Accept: 'application/json',
    'Content-Type': 'application/json',
    'aftership-api-key': apiKey,
    'as-api-key': apiKey,
  };
};

const fetchAfterShip = async (carrier: CarrierCode, trackingCode: string) => {
  const slug = afterShipSlugs[carrier];
  const baseUrl = (process.env.AFTERSHIP_BASE_URL || 'https://api.aftership.com').replace(/\/$/, '');
  const encodedSlug = encodeURIComponent(slug);
  const encodedTracking = encodeURIComponent(trackingCode);
  const headers = afterShipHeaders();

  const getResponse = await fetch(`${baseUrl}/v4/trackings/${encodedSlug}/${encodedTracking}`, { headers });
  if (getResponse.ok) return getResponse.json();

  if (getResponse.status !== 404) return parseResponse(getResponse);

  const createResponse = await fetch(`${baseUrl}/v4/trackings`, {
    method: 'POST',
    headers,
    body: JSON.stringify({ tracking: { slug, tracking_number: trackingCode, title: trackingCode } }),
  });
  return parseResponse(createResponse);
};

const fetchDirectCarrier = (carrier: CarrierCode, trackingCode: string) => {
  if (carrier === 'GHN') return fetchGhn(trackingCode);
  if (carrier === 'GHTK') return fetchGhtk(trackingCode);
  if (carrier === 'VIETTEL_POST') return fetchViettelPost(trackingCode);
  return fetchCustomSpx(trackingCode);
};

export const fetchCarrierTracking = async (carrier: CarrierCode, trackingCode: string): Promise<CarrierTrackingResult> => {
  const lastSyncAt = new Date().toISOString();
  try {
    let payload: any;
    try {
      payload = await fetchDirectCarrier(carrier, trackingCode);
    } catch (directError) {
      const canUseAfterShip = Boolean(process.env.AFTERSHIP_API_KEY || process.env.AFTERSHIP_TRACKING_API_KEY);
      if (!canUseAfterShip) throw directError;
      payload = await fetchAfterShip(carrier, trackingCode);
    }

    const events = flattenEvents(carrier, trackingCode, payload);
    const normalizedEvents = events.length ? events : [fallbackEvent(carrier, trackingCode, payload)];
    return { carrier, trackingCode, configured: true, lastSyncAt, status: normalizedEvents[normalizedEvents.length - 1]?.status || null, events: normalizedEvents, error: null };
  } catch (error) {
    return {
      carrier,
      trackingCode,
      configured: !(error instanceof Error && error.message.startsWith('Thiếu ')),
      lastSyncAt,
      status: null,
      events: [],
      error: error instanceof Error ? error.message : 'Không thể lấy tracking từ đơn vị vận chuyển',
    };
  }
};
