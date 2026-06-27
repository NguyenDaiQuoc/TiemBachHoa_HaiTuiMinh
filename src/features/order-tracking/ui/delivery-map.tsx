
import { useEffect, useRef, useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { MapPin, Truck, Warehouse, Home, Navigation2, Maximize2, Minimize2 } from 'lucide-react';
import { cn } from '@/src/shared/lib/utils';
import { ShipmentDetails, TrackingLocation } from '@/src/entities/shipping/model/types';

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
      if (!window.maplibregl) {
        reject(new Error('MapLibre did not initialize'));
        return;
      }

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

export const DeliveryMap = ({ shipment, className }: DeliveryMapProps) => {
  const mapContainer = useRef<HTMLDivElement>(null);
  const maplibreRef = useRef<MapLibreRuntime | null>(null);
  const map = useRef<any>(null);
  const courierMarker = useRef<any>(null);
  const [isMapLoaded, setIsMapLoaded] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);

  const { progress, origin, destination, currentLocation, status, events, estimatedArrival } = shipment;

  // Calculate interpolation through the actual event path for a realistic "following the route" feel
  const { coords: courierCoords, heading } = useMemo(() => {
    const toRadians = (deg: number) => deg * (Math.PI / 180);
    const toDegrees = (rad: number) => rad * (180 / Math.PI);

    if (progress === 1) return { coords: [destination.lng, destination.lat] as [number, number], heading: 0 };
    if (progress === 0) return { coords: [origin.lng, origin.lat] as [number, number], heading: 0 };
    
    const path = [origin, ...events.map(e => e.location), destination];
    const segmentCount = path.length - 1;
    const exactSegment = progress * segmentCount;
    const idx = Math.min(Math.floor(exactSegment), segmentCount - 1);
    const subProgress = exactSegment - idx;
    
    const p1 = path[idx];
    const p2 = path[idx + 1];
    
    const lng = p1.lng + (p2.lng - p1.lng) * subProgress;
    const lat = p1.lat + (p2.lat - p1.lat) * subProgress;

    // Calculate heading (bearing)
    const y = Math.sin(toRadians(p2.lng - p1.lng)) * Math.cos(toRadians(p2.lat));
    const x = Math.cos(toRadians(p1.lat)) * Math.sin(toRadians(p2.lat)) -
              Math.sin(toRadians(p1.lat)) * Math.cos(toRadians(p2.lat)) * Math.cos(toRadians(p2.lng - p1.lng));
    const brng = toDegrees(Math.atan2(y, x));
    const heading = (brng + 360) % 360;

    return { coords: [lng, lat] as [number, number], heading };
  }, [progress, origin, destination, events]);

  // Camera framing constants
  const PADDING = {
    top: 100,
    bottom: 120, // Account for bottom status card
    left: 60,
    right: 60
  };

  const updateCamera = () => {
    const maplibre = maplibreRef.current;
    if (!map.current || !isMapLoaded || !maplibre) return;

    if (status === 'OUT_FOR_DELIVERY') {
      // Focus on courier and destination for tight neighborhood context - Flat view
      const bounds = new maplibre.LngLatBounds()
        .extend(courierCoords as [number, number])
        .extend([destination.lng, destination.lat] as [number, number]);

      map.current.fitBounds(bounds, {
        padding: { top: 60, bottom: 80, left: 60, right: 60 },
        duration: 2000,
        pitch: 0, // Flat top-down
        bearing: 0
      });
    } else {
      // Regional view showing the full context - Flat
      const bounds = new maplibre.LngLatBounds()
        .extend([origin.lng, origin.lat])
        .extend([destination.lng, destination.lat]);

      map.current.fitBounds(bounds, {
        padding: PADDING,
        duration: 2000,
        pitch: 0 // Flat top-down
      });
    }
  };

  useEffect(() => {
    if (!mapContainer.current) return;
    let cancelled = false;

    loadMapLibre()
      .then((maplibre) => {
        if (cancelled || !mapContainer.current) return;
        maplibreRef.current = maplibre;

        map.current = new maplibre.Map({
          container: mapContainer.current,
          style: 'https://basemaps.cartocdn.com/gl/voyager-gl-style/style.json',
          center: courierCoords as [number, number],
          zoom: 11,
          attributionControl: false,
        });

        map.current.on('load', () => {
          setIsMapLoaded(true);
          if (!map.current) return;

          const fullRoute: [number, number][] = [
            [origin.lng, origin.lat],
            ...events.map(e => [e.location.lng, e.location.lat] as [number, number]),
            [destination.lng, destination.lat]
          ];

      // Add full route source
      map.current.addSource('full-route', {
        type: 'geojson',
        data: {
          type: 'Feature',
          properties: {},
          geometry: {
            type: 'LineString',
            coordinates: fullRoute
          }
        }
      });

      // Add active route source (dynamic)
      map.current.addSource('active-route', {
        type: 'geojson',
        data: {
          type: 'Feature',
          properties: {},
          geometry: {
             type: 'LineString',
             coordinates: [fullRoute[0]] // Start with just origin
          }
        }
      });

      // Layer 1: Background shadow/trail (Full Route)
      map.current.addLayer({
        id: 'route-shadow',
        type: 'line',
        source: 'full-route',
        layout: { 'line-join': 'round', 'line-cap': 'round' },
        paint: {
          'line-color': '#000',
          'line-width': 10,
          'line-opacity': 0.03,
          'line-blur': 4
        }
      });

      // Layer 2: Pending/Full Route Base
      map.current.addLayer({
        id: 'route-base',
        type: 'line',
        source: 'full-route',
        layout: { 'line-join': 'round', 'line-cap': 'round' },
        paint: {
          'line-color': '#E5D3BD',
          'line-width': 4,
          'line-opacity': 0.5
        }
      });

      // Layer 3: Completed/Active Route
      map.current.addLayer({
        id: 'route-progress',
        type: 'line',
        source: 'active-route',
        layout: { 'line-join': 'round', 'line-cap': 'round' },
        paint: {
          'line-color': '#C75F4B',
          'line-width': 5,
          'line-opacity': 1,
        }
      });

      // Markers for Origin and Destination
      const elOrigin = document.createElement('div');
      elOrigin.className = 'marker-origin';
      new maplibre.Marker({ element: elOrigin, anchor: 'bottom' })
        .setLngLat([origin.lng, origin.lat] as [number, number])
        .addTo(map.current);

      const elDest = document.createElement('div');
      elDest.className = 'marker-destination';
      new maplibre.Marker({ element: elDest, anchor: 'bottom' })
        .setLngLat([destination.lng, destination.lat] as [number, number])
        .addTo(map.current);

      // Courier Marker
      const elCourier = document.createElement('div');
      elCourier.className = 'marker-courier';
      elCourier.innerHTML = `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="M5 18h14c.6 0 1-.4 1-1V6c0-.6-.4-1-1-1H5c-.6 0-1 .4-1 1v11c0 .6.4 1 1 1z"/><path d="M7 5H5v3h2V5z"/><path d="M19 5h-2v3h2V5z"/><path d="M11 18H9v3h2v-3z"/><path d="M15 18h-2v3h2v-3z"/><path d="M10 8h4"/></svg>`;
      
      courierMarker.current = new maplibre.Marker({ element: elCourier, rotationAlignment: 'map' })
        .setLngLat(courierCoords as [number, number])
        .addTo(map.current);

      // Initial camera fit
          updateCamera();
        });
      })
      .catch(() => {
        setIsMapLoaded(true);
      });

    return () => {
      cancelled = true;
      map.current?.remove();
    };
  }, []);

  // Sync courier position and camera when state changes
  useEffect(() => {
    if (map.current && courierMarker.current && isMapLoaded) {
      // Smoothly update marker
      courierMarker.current.setLngLat(courierCoords as [number, number]);
      courierMarker.current.setRotation(heading);
      
      // Update active route line
      const source = map.current.getSource('active-route') as any;
      if (source) {
        const fullPath = [origin, ...events.map(e => e.location), destination];
        const segmentCount = fullPath.length - 1;
        const exactSegment = progress * segmentCount;
        const currentIdx = Math.floor(exactSegment);
        
        const partialRoute = fullPath.slice(0, currentIdx + 1).map(p => [p.lng, p.lat]);
        partialRoute.push([courierCoords[0], courierCoords[1]]);

        source.setData({
          type: 'Feature',
          properties: {},
          geometry: {
            type: 'LineString',
            coordinates: partialRoute as [number, number][]
          }
        });
      }
      
      // Debounced or threshold based camera updates to avoid jerky movement
      if (status === 'OUT_FOR_DELIVERY') {
        map.current.easeTo({
          center: courierCoords as [number, number],
          duration: 1200,
          zoom: 15.5,
          pitch: 50,
          bearing: heading
        });
      }
    }
  }, [courierCoords, heading, isMapLoaded, status, progress, origin, destination, events]);

  // Handle Fullscreen Toggle Camera Update
  useEffect(() => {
    if (isMapLoaded) {
      setTimeout(() => {
        map.current?.resize();
        updateCamera();
      }, 500); 
    }
  }, [isFullscreen]);

  return (
    <div className={cn(
      "relative w-full bg-muted/20 rounded-[32px] overflow-hidden border border-border/50 shadow-lg transition-all duration-500",
      isFullscreen ? "fixed inset-4 z-[9999] h-[calc(100vh-32px)]" : "h-64 md:h-[350px]",
      className
    )}>
      {/* Map Container */}
      <div ref={mapContainer} className="absolute inset-0 w-full h-full" />

      {/* Overlay: Custom Marker Styles (Inline for simplicity in this turn) */}
      <style>{`
        .marker-origin {
          background-image: url('data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="%23666" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M3 21h18"/><path d="M3 7v1a3 3 0 0 0 6 0V7m0 1a3 3 0 0 0 6 0V7m0 1a3 3 0 0 0 6 0V7H3Z"/><path d="M9 17h1"/><path d="M10 13h4"/><path d="M14 17h1"/><path d="M16 21V5a2 2 0 0 0-2-2H10a2 2 0 0 0-2 2v16"/></svg>');
          background-size: cover;
          width: 32px;
          height: 32px;
          background-color: var(--background);
          border-radius: 8px;
          border: 2px solid var(--border);
          box-shadow: 0 4px 10px rgba(0,0,0,0.1);
        }
        .marker-destination {
          background-image: url('data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="%23FF3B30" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"><path d="m3 9 9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/><polyline points="9 22 9 12 15 12 15 22"/></svg>');
          background-size: 70% 70%;
          background-repeat: no-repeat;
          background-position: center;
          width: 32px;
          height: 32px;
          background-color: var(--background);
          border-radius: 8px;
          border: 2px solid #FF3B30;
          box-shadow: 0 4px 10px rgba(255,59,48,0.2);
        }
        .marker-courier {
          background-color: #FF3B30;
          width: 40px;
          height: 40px;
          border-radius: 12px;
          display: flex;
          align-items: center;
          justify-content: center;
          color: white;
          box-shadow: 0 8px 16px rgba(255, 59, 48, 0.4);
          border: 2px solid white;
          transition: transform 0.3s cubic-bezier(0.175, 0.885, 0.32, 1.275);
          z-index: 100 !important;
        }
        .marker-courier::after {
          content: '';
          position: absolute;
          width: 50px;
          height: 50px;
          border-radius: 16px;
          border: 2px solid rgba(255, 59, 48, 0.3);
          animation: marker-pulse 2s cubic-bezier(0, 0, 0.2, 1) infinite;
        }
        @keyframes marker-pulse {
          0% { transform: scale(0.9); opacity: 0.8; }
          100% { transform: scale(1.4); opacity: 0; }
        }
        .marker-courier svg {
          width: 22px;
          height: 22px;
        }
      `}</style>

      {/* Floating UI: Live Tracking Tag */}
      <div className="absolute top-6 left-6 flex items-center gap-4 ptr-events-none">
        <motion.div 
          initial={{ x: -20, opacity: 0 }}
          animate={{ x: 0, opacity: 1 }}
          className="flex items-center gap-3 px-5 py-2.5 bg-foreground text-background rounded-full shadow-2xl"
        >
          <div className="h-2 w-2 rounded-full bg-primary animate-pulse" />
          <span className="text-[10px] font-black uppercase tracking-[0.2em]">LIVE TRACKING</span>
        </motion.div>
      </div>

      {/* ETA Sticky Highlight */}
      <div className="absolute top-6 right-6 flex flex-col gap-3">
         <motion.div 
           initial={{ y: -20, opacity: 0 }}
           animate={{ y: 0, opacity: 1 }}
           className="px-6 py-3 bg-surface-elevated/90 backdrop-blur-xl rounded-[24px] border border-border/50 shadow-2xl flex flex-col items-center"
         >
            <p className="text-[8px] font-black text-muted-foreground uppercase tracking-widest mb-1">DỰ KIẾN</p>
            <p className="text-sm font-black tracking-tight">
               {new Date(estimatedArrival).toLocaleDateString('vi', { day: '2-digit', month: '2-digit' })}
            </p>
         </motion.div>
         
         <button 
           onClick={() => setIsFullscreen(!isFullscreen)}
           className="h-10 w-10 bg-surface-elevated/90 backdrop-blur-xl rounded-full border border-border/50 shadow-xl flex items-center justify-center hover:bg-surface-elevated transition-colors"
         >
            {isFullscreen ? <Minimize2 className="h-4 w-4" /> : <Maximize2 className="h-4 w-4" />}
         </button>
      </div>

      {/* Bottom Status Card */}
      <div className="absolute bottom-6 left-6 right-6">
        <motion.div 
           initial={{ y: 50, opacity: 0 }}
           animate={{ y: 0, opacity: 1 }}
           className="bg-surface-elevated/95 backdrop-blur-2xl p-6 rounded-[32px] border border-border/50 shadow-[0_20px_50px_rgba(0,0,0,0.15)] flex items-center justify-between"
        >
           <div className="flex items-center gap-4">
              <div className="h-12 w-12 rounded-2xl bg-foreground flex items-center justify-center text-background">
                 <Navigation2 className={cn("h-6 w-6 transition-transform", status === 'DELIVERED' ? "rotate-0" : "rotate-45")} />
              </div>
              <div className="space-y-1">
                 <p className="text-[9px] font-black text-muted-foreground uppercase tracking-[0.2em] leading-none">VỊ TRÍ HIỆN TẠI</p>
                 <p className="text-sm font-black truncate max-w-[200px] md:max-w-md">{currentLocation?.name || 'Đang vận chuyển'}</p>
                 <div className="flex items-center gap-6">
                    <div className="flex items-center gap-1.5">
                       <div className="h-1.5 w-1.5 rounded-full bg-primary" />
                       <span className="text-[10px] font-bold text-muted-foreground uppercase">{status.replace(/_/g, ' ')}</span>
                    </div>
                    <div className="text-[10px] font-bold text-muted-foreground uppercase">
                       {(progress * 100).toFixed(0)}% HOÀN THÀNH
                    </div>
                 </div>
              </div>
           </div>
           
           <div className="hidden md:flex flex-col items-end">
              <p className="text-[10px] font-black text-muted-foreground uppercase tracking-widest mb-1">MÃ VẬN ĐƠN</p>
              <p className="font-black text-lg tracking-tight">{shipment.trackingId}</p>
           </div>
        </motion.div>
      </div>

      {/* Loading State Overlay */}
      <AnimatePresence>
        {!isMapLoaded && (
          <motion.div 
            initial={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="absolute inset-0 bg-muted/10 backdrop-blur-sm flex flex-col items-center justify-center gap-4 z-50"
          >
            <div className="h-12 w-12 border-4 border-primary/20 border-t-primary rounded-full animate-spin" />
            <p className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Khởi tạo bản đồ...</p>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};
