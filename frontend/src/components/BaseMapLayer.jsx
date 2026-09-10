import { useEffect, useState } from 'react';
import { TileLayer, useMap } from 'react-leaflet';

/**
 * The basemap for every Leaflet map in the platform.
 *
 * TILE SOURCE STRATEGY (dual-source with automatic fallback):
 *
 *   1. PRIMARY: CartoDB Positron (online) — a clean, light-grey government-
 *      friendly basemap with liberal usage policies and no API key. Supports
 *      z0–z20, so every zoom level renders sharp tiles.
 *
 *   2. FALLBACK: /basemap/{z}/{x}/{y}.png (local cache) — for air-gapped NIC
 *      MeghRaj deployments, cached by fetch_offline_basemap.py. Limited to
 *      z3–z8 with Leaflet upsampling past z8 via maxNativeZoom.
 *
 * The component tries online tiles first. If more than 6 tiles fail on the
 * initial paint (indicating no internet), it falls back to the local cache.
 * This means demos on internet-connected machines see full-quality maps, and
 * air-gapped deployments still render with the cached tiles.
 *
 * HISTORY: The original local-only approach broke when OSM blocked the bulk
 * fetch script. OSM returned HTTP 200 with its "403 Access blocked" message
 * RENDERED INSIDE the PNG pixels — a valid image file that passed the byte-
 * size check. All 886 tiles ended up as identical copies of this error image.
 */

const PRIMARY_MAP_URL = 'https://server.arcgisonline.com/ArcGIS/rest/services/Canvas/World_Light_Gray_Base/MapServer/tile/{z}/{y}/{x}';
const LOCAL_URL = '/basemap/{z}/{x}/{y}.png';

export default function BaseMapLayer({ onStatus }) {
  const map = useMap();
  const [missing, setMissing] = useState(0);
  const [useLocal, setUseLocal] = useState(false);

  // If a sustained burst of tile errors occurs (> 20), fall back to local cache
  useEffect(() => {
    if (missing > 20 && !useLocal) {
      setUseLocal(true);
      setMissing(0);
    }
  }, [missing, useLocal]);

  useEffect(() => {
    if (!onStatus) return undefined;
    if (useLocal) {
      onStatus(missing > 10 ? 'unavailable' : missing > 0 ? 'partial' : 'ok');
    } else {
      onStatus('ok');
    }
    return undefined;
  }, [missing, onStatus, useLocal]);

  useEffect(() => {
    if (!map) return undefined;
    const reset = () => setMissing(0);
    map.on('zoomend', reset);
    return () => { map.off('zoomend', reset); };
  }, [map]);

  if (useLocal) {
    return (
      <TileLayer
        url={LOCAL_URL}
        maxNativeZoom={8}
        maxZoom={18}
        data-lang-en=""
      attribution='<span lang="en">&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors &middot; cached for offline use</span>'
        eventHandlers={{ tileerror: () => setMissing((n) => n + 1) }}
      />
    );
  }

  return (
    <TileLayer
      url={PRIMARY_MAP_URL}
      maxZoom={19}
      attribution='<span lang="en">&copy; <a href="https://www.esri.com/">Esri</a> &middot; National Geospatial Infrastructure</span>'
      eventHandlers={{ tileerror: () => setMissing((n) => n + 1) }}
    />
  );
}

/**
 * The banner that goes with it. Rendered outside the map so it is readable
 * regardless of how the map is sized, and silent when everything is fine.
 */
export function BaseMapNotice({ status }) {
  if (!status || status === 'ok') return null;
  return (
    <div
      role="status"
      className="absolute bottom-2 left-2 z-[400] max-w-xs rounded bg-slate-900/90 px-2.5 py-1.5 text-[10px] leading-snug text-slate-200 shadow"
    >
      {status === 'unavailable' ? (
        <>
          <strong className="block">Basemap not available.</strong>
          Pin coordinates are unaffected and remain accurate.
        </>
      ) : (
        <>Basemap is cached for India only — this area has no backdrop.</>
      )}
    </div>
  );
}
