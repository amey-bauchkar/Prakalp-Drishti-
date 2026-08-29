import { useEffect, useState } from 'react';
import { TileLayer, useMap } from 'react-leaflet';

/**
 * The basemap for every Leaflet map in the platform.
 *
 * All three maps previously pointed straight at
 * https://{s}.tile.openstreetmap.org. That renders on a developer machine with
 * internet and renders nothing anywhere else: Leaflet draws the pins over an
 * empty grey pane and reports no error, so the Nagrik portal looked broken
 * rather than offline. The deployment target is air-gapped, where it would
 * never have loaded at all.
 *
 * Tiles are therefore served from /basemap, cached by
 * satellite_pipeline/fetch_offline_basemap.py. They are the same OSM tiles the
 * app was already requesting, so nothing about what is drawn changes -- only
 * when it is fetched.
 *
 * Two consequences of a finite cache, both handled here rather than left to
 * surprise someone mid-demo:
 *
 *  - The cache is z3-z8. `maxNativeZoom` makes Leaflet upsample z8 past that
 *    instead of requesting tiles that do not exist. These maps show national
 *    distributions and multi-kilometre uncertainty radii, so a soft backdrop
 *    at high zoom costs nothing that they are trying to convey.
 *  - The cache covers India. Panning into the ocean or over a neighbour finds
 *    no tile, so `onStatus` lets the caller say so plainly instead
 *    of showing the same silent grey this component exists to remove.
 */

const LOCAL_URL = '/basemap/{z}/{x}/{y}.png';
const MAX_NATIVE_ZOOM = 8;

export default function BaseMapLayer({ onStatus }) {
  const map = useMap();
  const [missing, setMissing] = useState(0);

  // Leaflet fires `tileerror` per failed tile. One is ordinary -- a pan to the
  // edge of the cached extent. A burst on first paint means /basemap is not
  // being served at all, which is a deployment fault worth naming.
  useEffect(() => {
    if (!onStatus) return undefined;
    onStatus(missing > 6 ? 'unavailable' : missing > 0 ? 'partial' : 'ok');
    return undefined;
  }, [missing, onStatus]);

  useEffect(() => {
    if (!map) return undefined;
    const reset = () => setMissing(0);
    map.on('zoomend', reset);
    return () => { map.off('zoomend', reset); };
  }, [map]);

  return (
    <TileLayer
      url={LOCAL_URL}
      maxNativeZoom={MAX_NATIVE_ZOOM}
      maxZoom={18}
      attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors &middot; cached for offline use'
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
