import { useEffect, useMemo, useRef, useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { MapPin, Maximize2, Minimize2, Navigation2, Route } from 'lucide-react';
import { cn } from '@/src/shared/lib/utils';
import { ShipmentDetails } from '@/src/entities/shipping/model/types';

type MapLibreRuntime = {
  workerUrl?: string;
  Map: new (...args: any[]) => any;
  Marker: new (...args: any[]) => any;
  LngLatBounds: new (...args: any[]) => any;
};

declare global {
  interface Window {
    maplibregl?: MapLibreRuntime;
  }
}

const MAPLIBRE_SCRIPT_URL = '/vendor/maplibre/maplibre-gl.js';
const MAPLIBRE_STYLE_URL = '/vendor/maplibre/maplibre-gl.css';
const MAPLIBRE_WORKER_URL = '/vendor/maplibre/maplibre-gl-csp-worker.js';

let mapLibrePromise: Promise<MapLibreRuntime> | null = null;

const loadMapLibre = () => {
  if (typeof window === 'undefined') return Promise.reject(new Error('MapLibre requires a browser runtime'));
  if (window.maplibregl) return Promise.resolve(window.maplibregl);
  if (mapLibrePromise) return mapLibrePromise;

  mapLibrePromise = new Promise((resolve, reject) => {
    if (!document.querySelector('link[data-maplibre="true"]')) {
      const link = document.createElement('link');
      link.rel = 'stylesheet';
      link.href = MAPLIBRE_STYLE_URL;
      link.dataset.maplibre = 'true';
      document.head.appendChild(link);
    }

    const existingScript = document.querySelector<HTMLScriptElement>('script[data-maplibre="true"]');
    if (existingScript) {
      existingScript.addEventListener('load', () => (window.maplibregl ? resolve(window.maplibregl) : reject(new Error('MapLibre did not initialize'))), { once: true });
      existingScript.addEventListener('error', () => reject(new Error('Unable to load MapLibre')), { once: true });
      return;
    }

    const script = document.createElement('script');
    script.src = MAPLIBRE_SCRIPT_URL;
    script.async = true;
    script.dataset.maplibre = 'true';
    script.onload = () => {
      if (!window.maplibregl) return reject(new Error('MapLibre did not initialize'));
      window.maplibregl.workerUrl = MAPLIBRE_WORKER_URL;
      resolve(window.maplibregl);
    };
    script.onerror = () => reject(new Error('Unable to load MapLibre'));
    document.head.appendChild(script);
  });

  return mapLibrePromise;
};

interface DeliveryMapProps {
  shipment: ShipmentDetails;
  className?: string;
}

const isGeoLocation = (location: any) =>
  location?.lat !== null &&
  location?.lat !== undefined &&
  location?.lng !== null &&
  location?.lng !== undefined &&
  Number.isFinite(Number(location.lat)) &&
  Number.isFinite(Number(location.lng));

const statusLabel = (status: string) => status.replace(/_/g, ' ');

export const DeliveryMap = ({ shipment, className }: DeliveryMapProps) => {
  const mapContainer = useRef<HTMLDivElement>(null);
  const map = useRef<any>(null);
  const [isMapLoaded, setIsMapLoaded] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);

  const geoEvents = useMemo(
    () => shipment.events.filter((event) => isGeoLocation(event.location)),
    [shipment.events]
  );
  const latestGeoEvent = geoEvents[geoEvents.length - 1];

  useEffect(() => {
    if (!mapContainer.current || geoEvents.length === 0) return;
    let cancelled = false;
    const markers: any[] = [];

    loadMapLibre()
      .then((maplibre) => {
        if (cancelled || !mapContainer.current) return;
        const coordinates = geoEvents.map((event) => [Number(event.location.lng), Number(event.location.lat)] as [number, number]);

        map.current = new maplibre.Map({
          container: mapContainer.current,
          style: 'https://basemaps.cartocdn.com/gl/voyager-gl-style/style.json',
          center: coordinates[coordinates.length - 1],
          zoom: coordinates.length > 1 ? 12 : 15,
          attributionControl: false,
        });

        map.current.on('load', () => {
          setIsMapLoaded(true);
          if (!map.current) return;

          if (coordinates.length > 1) {
            map.current.addSource('real-tracking-route', {
              type: 'geojson',
              data: {
                type: 'Feature',
                properties: {},
                geometry: { type: 'LineString', coordinates },
              },
            });
            map.current.addLayer({
              id: 'real-tracking-route-line',
              type: 'line',
              source: 'real-tracking-route',
              layout: { 'line-join': 'round', 'line-cap': 'round' },
              paint: { 'line-color': '#C75F4B', 'line-width': 5, 'line-opacity': 0.9 },
            });
          }

          geoEvents.forEach((event, index) => {
            const el = document.createElement('div');
            el.className = index === geoEvents.length - 1 ? 'real-marker real-marker-current' : 'real-marker';
            el.title = event.description;
            markers.push(new maplibre.Marker({ element: el, anchor: 'center' }).setLngLat(coordinates[index]).addTo(map.current));
          });

          if (coordinates.length > 1) {
            const bounds = new maplibre.LngLatBounds();
            coordinates.forEach((coord) => bounds.extend(coord));
            map.current.fitBounds(bounds, { padding: 70, duration: 800, pitch: 0, bearing: 0 });
          }
        });
      })
      .catch(() => setIsMapLoaded(true));

    return () => {
      cancelled = true;
      markers.forEach((marker) => marker.remove?.());
      map.current?.remove();
      map.current = null;
      setIsMapLoaded(false);
    };
  }, [geoEvents]);

  useEffect(() => {
    if (!map.current) return;
    window.setTimeout(() => map.current?.resize(), 250);
  }, [isFullscreen]);

  if (geoEvents.length === 0) {
    return (
      <div className={cn('relative flex h-64 w-full flex-col justify-between overflow-hidden rounded-[32px] border border-border/50 bg-surface-default p-6 shadow-lg md:h-[350px]', className)}>
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgba(74,109,86,0.14),transparent_35%),linear-gradient(135deg,rgba(229,211,189,0.35),transparent)]" />
        <div className="relative flex items-center gap-3 rounded-full bg-muted/40 px-4 py-2 text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground self-start">
          <MapPin className="h-3.5 w-3.5" /> Chưa có tọa độ thật
        </div>
        <div className="relative space-y-3">
          <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-primary/10 text-primary">
            <Route className="h-7 w-7" />
          </div>
          <h3 className="text-xl font-black uppercase tracking-tight">Bản đồ sẽ hiện khi người giao cập nhật GPS</h3>
          <p className="max-w-md text-sm leading-6 text-muted-foreground">
            Hệ thống chỉ hiển thị vị trí lấy từ cập nhật thật của admin/người giao. Không dùng vị trí mô phỏng hoặc tuyến đường tự sinh.
          </p>
          <p className="text-xs font-bold text-muted-foreground">Trạng thái hiện tại: {statusLabel(shipment.status)}</p>
        </div>
      </div>
    );
  }

  return (
    <div
      className={cn(
        'relative w-full overflow-hidden rounded-[32px] border border-border/50 bg-muted/20 shadow-lg transition-all duration-500',
        isFullscreen ? 'fixed inset-4 z-[9999] h-[calc(100vh-32px)]' : 'h-64 md:h-[350px]',
        className
      )}
    >
      <div ref={mapContainer} className="absolute inset-0 h-full w-full" />

      <style>{`
        .real-marker {
          width: 22px;
          height: 22px;
          border-radius: 999px;
          background: #4A6D56;
          border: 3px solid white;
          box-shadow: 0 8px 18px rgba(0,0,0,0.22);
        }
        .real-marker-current {
          width: 36px;
          height: 36px;
          background: #C75F4B;
          position: relative;
        }
        .real-marker-current::after {
          content: '';
          position: absolute;
          inset: -10px;
          border-radius: 999px;
          border: 2px solid rgba(199,95,75,0.35);
          animation: real-marker-pulse 1.8s ease-out infinite;
        }
        @keyframes real-marker-pulse {
          from { transform: scale(0.8); opacity: 0.9; }
          to { transform: scale(1.5); opacity: 0; }
        }
      `}</style>

      <div className="absolute left-6 top-6 flex items-center gap-3 rounded-full bg-surface-elevated/95 px-5 py-2.5 text-[10px] font-black uppercase tracking-[0.2em] shadow-xl backdrop-blur">
        <span className="h-2 w-2 rounded-full bg-primary" /> Tracking thật
      </div>

      <button
        type="button"
        onClick={() => setIsFullscreen(!isFullscreen)}
        className="absolute right-6 top-6 flex h-10 w-10 items-center justify-center rounded-full border border-border/50 bg-surface-elevated/95 shadow-xl backdrop-blur transition hover:bg-surface-elevated"
        aria-label={isFullscreen ? 'Thu nhỏ bản đồ' : 'Phóng to bản đồ'}
      >
        {isFullscreen ? <Minimize2 className="h-4 w-4" /> : <Maximize2 className="h-4 w-4" />}
      </button>

      <div className="absolute bottom-6 left-6 right-6">
        <motion.div
          initial={{ y: 40, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          className="flex items-center justify-between gap-4 rounded-[28px] border border-border/50 bg-surface-elevated/95 p-5 shadow-2xl backdrop-blur-2xl"
        >
          <div className="flex min-w-0 items-center gap-4">
            <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-foreground text-background">
              <Navigation2 className="h-6 w-6" />
            </div>
            <div className="min-w-0">
              <p className="text-[9px] font-black uppercase tracking-[0.2em] text-muted-foreground">Vị trí cập nhật gần nhất</p>
              <p className="truncate text-sm font-black">{latestGeoEvent.location.name}</p>
              <p className="text-[10px] font-bold uppercase text-muted-foreground">{statusLabel(latestGeoEvent.status)} - {new Date(latestGeoEvent.timestamp).toLocaleString('vi-VN')}</p>
            </div>
          </div>
          <div className="hidden text-right md:block">
            <p className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Số điểm GPS</p>
            <p className="text-lg font-black">{geoEvents.length}</p>
          </div>
        </motion.div>
      </div>

      <AnimatePresence>
        {!isMapLoaded && (
          <motion.div initial={{ opacity: 1 }} exit={{ opacity: 0 }} className="absolute inset-0 z-50 flex flex-col items-center justify-center gap-4 bg-muted/10 backdrop-blur-sm">
            <div className="h-12 w-12 animate-spin rounded-full border-4 border-primary/20 border-t-primary" />
            <p className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Đang tải bản đồ thật...</p>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};
