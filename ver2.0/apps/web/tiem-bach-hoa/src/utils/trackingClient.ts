// Utility for web-based driver tracking (uses Geolocation API + Firestore)
// - Designed for web drivers (foreground/tab open) to send real tracking events
// - Admin users (your current drivers) can call startSharing(orderId) to begin
//   sending periodic location updates to `orders/{orderId}/trackingEvents`.
// Note: Browsers do not allow reliable background geolocation like mobile apps.

import { addDoc, collection } from 'firebase/firestore';
import { db } from '../firebase';
import { auth } from '../firebase-auth';

let _watchId: number | null = null;
let _currentOrderId: string | null = null;
let _lastSentAt: number = 0;
let _lastSentLocation: { lat: number; lng: number } | null = null;

// Defaults: throttle interval 15s, distance threshold 50 meters
const DEFAULT_INTERVAL_MS = 15000;
const DEFAULT_DISTANCE_M = 50;

function getDistanceMeters(a: { lat: number; lng: number }, b: { lat: number; lng: number }) {
  // Haversine
  const toRad = (v: number) => v * Math.PI / 180;
  const R = 6371000; // m
  const dLat = toRad(b.lat - a.lat);
  const dLon = toRad(b.lng - a.lng);
  const la = toRad(a.lat);
  const lb = toRad(b.lat);
  const s = Math.sin(dLat/2)*Math.sin(dLat/2) + Math.cos(la)*Math.cos(lb)*Math.sin(dLon/2)*Math.sin(dLon/2);
  const c = 2 * Math.atan2(Math.sqrt(s), Math.sqrt(1-s));
  return R * c;
}

export function isSharing() {
  return _watchId !== null;
}

export function stopSharing() {
  if (_watchId !== null && navigator && navigator.geolocation) {
    navigator.geolocation.clearWatch(_watchId);
  }
  _watchId = null;
  _currentOrderId = null;
  _lastSentAt = 0;
  _lastSentLocation = null;
}

/**
 * startSharing: start watchPosition and send events with basic throttling.
 * options:
 *  - intervalMs: minimum ms between writes
 *  - distanceM: minimum moved meters to force write
 */
export function startSharing(orderId: string, opts: any = {}) {
  const intervalMs = opts.intervalMs || DEFAULT_INTERVAL_MS;
  const distanceM = opts.distanceM || DEFAULT_DISTANCE_M;
  const defaultGeo: PositionOptions = { enableHighAccuracy: true, maximumAge: 5000, timeout: 30000 };
  const geoOpts: PositionOptions = opts.geo || defaultGeo;
  if (!orderId) return Promise.reject(new Error('orderId required'));
  if (!navigator || !navigator.geolocation) return Promise.reject(new Error('Geolocation not supported'));
  if (_watchId !== null && _currentOrderId === orderId) return Promise.resolve(true);
  if (_watchId !== null) stopSharing();

  _currentOrderId = orderId;

  // Promise resolves when we have a first successful position sent, or rejects on fatal error
  return new Promise<boolean>((resolve, reject) => {
    let firstSent = false;
    let retryAttempts = 0;
    const MAX_RETRY_ATTEMPTS = 3;

    const successHandler = async (pos: GeolocationPosition) => {
      try {
        const lat = Number(pos.coords.latitude);
        const lng = Number(pos.coords.longitude);
        const accuracy = pos.coords.accuracy != null ? Number(pos.coords.accuracy) : null;
        const now = Date.now();
        const location = { lat, lng };

        // Throttle / distance checks
        let shouldSend = false;
        if (_lastSentAt === 0) shouldSend = true;
        else if ((now - _lastSentAt) >= intervalMs) shouldSend = true;
        else if (_lastSentLocation) {
          const d = getDistanceMeters(_lastSentLocation, location);
          if (d >= distanceM) shouldSend = true;
        }

        if (!shouldSend) {
          if (!firstSent) {
            // we haven't sent anything yet, but don't fail silently; try again
            return;
          }
          return;
        }

        const uid = auth.currentUser ? auth.currentUser.uid : null;
        const evt: any = {
          ts: new Date(),
          status: 'Vị trí lái xe',
          note: '',
          location: { lat, lng },
          accuracy: accuracy,
          provider: 'gps',
          uploaderId: uid,
        };
        await addDoc(collection(db, 'orders', orderId, 'trackingEvents'), evt);
        _lastSentAt = now;
        _lastSentLocation = location;
        if (!firstSent) {
          firstSent = true;
          resolve(true);
        }
      } catch (e) {
        console.warn('send tracking event failed', e);
        if (!firstSent) {
          // try to continue, but if repeated failures occur the watch will keep trying
        }
      }
    };

    const errorHandler = (err: GeolocationPositionError) => {
      console.warn('watchPosition error', err.code, err.message);
      // Handle common errors: 1 = PERMISSION_DENIED, 2 = POSITION_UNAVAILABLE, 3 = TIMEOUT
      if (err.code === 1) {
        // Permission denied — stop and reject
        stopSharing();
        reject(new Error('Permission denied for geolocation'));
        return;
      }
      if (err.code === 3) {
        // Timeout: try again with lower accuracy once
        if (geoOpts && (geoOpts as any).enableHighAccuracy) {
          // restart watch with lower accuracy
          try {
            if (_watchId !== null && navigator && navigator.geolocation) navigator.geolocation.clearWatch(_watchId);
          } catch (e) { /* ignore */ }
          _watchId = navigator.geolocation.watchPosition(successHandler, (e) => {
            console.warn('watchPosition retry error', e.code, e.message);
            // If retry fails and we still haven't sent first, reject
            if (!firstSent) {
              stopSharing();
              reject(new Error('Geolocation timeout'));
            }
          }, { ...geoOpts, enableHighAccuracy: false, timeout: 30000 } as PositionOptions);
          return;
        }
      }
      // POSITION_UNAVAILABLE (2): device cannot provide location right now.
      // Try a few getCurrentPosition attempts with lower accuracy before giving up.
      if (err.code === 2) {
        if (firstSent) {
          // if we've already sent at least one event, don't reject — keep watching silently
          console.warn('Position temporarily unavailable, but already sending events');
          return;
        }
        // attempt a quick coarse getCurrentPosition
        const tryGetCurrent = (attempt: number) => {
          navigator.geolocation.getCurrentPosition((pos) => {
            // success — feed into successHandler to reuse logic
            try {
              successHandler(pos);
              // if successHandler sent the first event, resolve will be called there
            } catch (e) {
              console.warn('getCurrentPosition -> successHandler error', e);
            }
          }, (gErr) => {
            console.warn('getCurrentPosition fallback failed', attempt, gErr && gErr.code, gErr && gErr.message);
            retryAttempts++;
            if (retryAttempts <= MAX_RETRY_ATTEMPTS) {
              // schedule another attempt after short delay
              setTimeout(() => tryGetCurrent(attempt + 1), 3000);
              return;
            }
            // after retries, if still no firstSent, try an IP-based fallback then reject
            if (!firstSent) {
              (async () => {
                try {
                  const tryIp = async () => {
                    try {
                      const r = await fetch('https://ipwho.is/');
                      if (r.ok) {
                        const jd: any = await r.json();
                        const la = parseFloat(jd.latitude || jd.lat || jd.latitude);
                        const ln = parseFloat(jd.longitude || jd.lon || jd.longitude);
                        if (Number.isFinite(la) && Number.isFinite(ln)) return { lat: la, lng: ln };
                      }
                    } catch (e) {
                      console.warn('ipwho fetch failed', e);
                    }
                    try {
                      const r2 = await fetch('https://ipapi.co/json/');
                      if (r2.ok) {
                        try {
                          const jd2: any = await r2.json();
                          const la2 = parseFloat(jd2.latitude || jd2.lat || jd2.latitude);
                          const ln2 = parseFloat(jd2.longitude || jd2.lon || jd2.longitude);
                          if (Number.isFinite(la2) && Number.isFinite(ln2)) return { lat: la2, lng: ln2 };
                        } catch (pj) {
                          console.warn('ipapi parse failed', pj);
                        }
                      }
                    } catch (e2) {
                      console.warn('ipapi fetch failed', e2);
                    }
                    return null;
                  };
                  const ipcoords = await tryIp();
                  if (ipcoords) {
                    console.warn('Using IP-based fallback location', ipcoords);
                    const uid = auth.currentUser ? auth.currentUser.uid : null;
                    const evt: any = {
                      ts: new Date(),
                      status: 'Vị trí lái xe (xấp xỉ)',
                      note: 'Fallback IP-based location',
                      location: { lat: ipcoords.lat, lng: ipcoords.lng },
                      accuracy: null,
                      provider: 'ip',
                      uploaderId: uid,
                    };
                    try {
                      await addDoc(collection(db, 'orders', orderId, 'trackingEvents'), evt);
                      _lastSentAt = Date.now();
                      _lastSentLocation = { lat: ipcoords.lat, lng: ipcoords.lng };
                      firstSent = true;
                      resolve(true);
                      return;
                    } catch (werr) {
                      console.warn('write fallback event failed', werr);
                    }
                  }
                } catch (ee) {
                  console.warn('IP fallback failed', ee);
                }
                stopSharing();
                reject(new Error('Unable to determine position (POSITION_UNAVAILABLE)'));
              })();
            }
          }, { enableHighAccuracy: false, timeout: 10000 });
        };
        tryGetCurrent(1);
        return;
      }
      // For other errors, if we haven't sent anything yet, reject after stopping
      if (!firstSent) {
        stopSharing();
        reject(new Error(err.message || 'Geolocation error'));
      }
    };

    try {
      _watchId = navigator.geolocation.watchPosition(successHandler, errorHandler, geoOpts as any);
    } catch (e) {
      stopSharing();
      reject(e instanceof Error ? e : new Error(String(e)));
    }
  });
}

export default {
  startSharing,
  stopSharing,
  isSharing
};
