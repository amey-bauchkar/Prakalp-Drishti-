import React, { useState } from "react";
import { MapPin, Crosshair, RefreshCw, AlertTriangle, CheckCircle2, Navigation } from "lucide-react";
import { getCurrentCoordinates, formatCoordinates, reverseGeocode } from "../utils/geoHelper";
import Button from "../../src/components/ui/Button";
import { useLanguage } from "../../tanmay/i18n/LanguageContext";

/**
 * LocationPicker Component with i18n
 * Handles GPS fetching, accuracy indicator, and coordinates display for civic reports.
 */
export default function LocationPicker({
  latitude,
  longitude,
  onLocationChange,
  disabled = false
}) {
  const { t } = useLanguage();
  const [isFetching, setIsFetching] = useState(false);
  const [errorMsg, setErrorMsg] = useState(null);
  const [accuracy, setAccuracy] = useState(null);
  const [address, setAddress] = useState("");

  const handleGetLocation = async () => {
    if (disabled) return;
    setIsFetching(true);
    setErrorMsg(null);

    try {
      const coords = await getCurrentCoordinates();
      onLocationChange(coords.latitude, coords.longitude);
      setAccuracy(coords.accuracy);

      // Async reverse geocoding in background
      reverseGeocode(coords.latitude, coords.longitude)
        .then((addr) => setAddress(addr))
        .catch(() => {});
    } catch (err) {
      setErrorMsg(err.message || "Failed to retrieve GPS location.");
    } finally {
      setIsFetching(false);
    }
  };

  const hasLocation = latitude !== null && longitude !== null && !isNaN(latitude) && !isNaN(longitude);

  return (
    <div className="w-full mb-5">
      <div className="flex items-center justify-between mb-2">
        <label className="text-xs font-bold uppercase tracking-wider text-gov-navy flex items-center gap-1.5">
          <MapPin className="w-3.5 h-3.5 text-gov-navy" />
          <span>{t('report.incidentLocation')}</span>
          <span className="text-rose-600">*</span>
        </label>
        {hasLocation && (
          <span className="text-[11px] font-bold text-gov-navy bg-gov-accent/20 px-2 py-0.5 rounded border border-gov-accent-dark/30 flex items-center gap-1 uppercase tracking-wider">
            <span className="w-1.5 h-1.5 rounded-full bg-gov-navy" />
            {t('report.gpsLocked')}
          </span>
        )}
      </div>

      {!hasLocation ? (
        /* Action Button to Acquire GPS */
        <div>
          <button
            type="button"
            onClick={handleGetLocation}
            disabled={disabled || isFetching}
            className={`w-full p-4 rounded-xl border-2 border-dashed flex items-center justify-center gap-3 transition-all duration-150 ${
              isFetching
                ? "bg-gov-surface border-gov-navy text-gov-navy cursor-wait"
                : "bg-gov-surface/50 border-gov-border hover:border-gov-navy hover:bg-gov-surface text-gov-navy active:scale-[0.99]"
            } ${disabled ? "opacity-60 cursor-not-allowed" : ""}`}
          >
            {isFetching ? (
              <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-gov-navy">
                <RefreshCw className="w-4 h-4 animate-spin text-gov-navy" />
                <span>{t('report.acquiringGps')}</span>
              </div>
            ) : (
              <>
                <div className="w-10 h-10 rounded-lg bg-gov-navy text-gov-accent flex items-center justify-center flex-shrink-0 shadow-soft">
                  <Navigation className="w-5 h-5" />
                </div>
                <div className="text-left flex-1">
                  <p className="font-bold text-gov-navy text-sm">{t('report.tagGps')}</p>
                  <p className="text-xs text-gov-muted font-medium">{t('report.autoTags')}</p>
                </div>
              </>
            )}
          </button>

          {/* Quick Mumbai Location Presets */}
          <div className="mt-3">
            <p className="text-[11px] font-bold text-gov-muted uppercase tracking-wider mb-1.5 flex items-center gap-1">
              <span>Quick Select Mumbai Ward / Area:</span>
            </p>
            <div className="flex flex-wrap gap-1.5">
              {[
                { name: 'Bandra (BKC)', lat: 19.0607, lng: 72.8465, addr: 'Bandra-Kurla Complex, Bandra East, Mumbai' },
                { name: 'Dadar TT', lat: 19.0195, lng: 72.8432, addr: 'Dadar West, Mumbai' },
                { name: 'Andheri West', lat: 19.1197, lng: 72.8440, addr: 'SV Road, Andheri West, Mumbai' },
                { name: 'Marine Drive', lat: 18.9438, lng: 72.8234, addr: 'Netaji Subhash Road, Marine Drive, Mumbai' },
                { name: 'Kurla West', lat: 19.0685, lng: 72.8805, addr: 'LBS Marg, Kurla West, Mumbai' },
              ].map((loc) => (
                <button
                  key={loc.name}
                  type="button"
                  onClick={() => {
                    onLocationChange(loc.lat, loc.lng);
                    setAddress(loc.addr);
                    setAccuracy(10);
                  }}
                  className="px-2.5 py-1 text-xs font-semibold bg-gov-surface hover:bg-gov-accent/20 text-gov-navy border border-gov-border hover:border-gov-navy rounded-lg transition-all"
                >
                  📍 {loc.name}
                </button>
              ))}
            </div>
          </div>

          {errorMsg && (
            <div className="mt-2.5 p-3 rounded-lg bg-rose-50 border border-rose-200 text-rose-800 text-xs flex items-start gap-2">
              <AlertTriangle className="w-4 h-4 flex-shrink-0 text-rose-600 mt-0.5" />
              <div className="flex-1">
                <p className="font-bold">{t('report.gpsError')}</p>
                <p className="mt-0.5">{errorMsg}</p>
                <button
                  type="button"
                  onClick={handleGetLocation}
                  className="mt-1 text-xs font-bold text-rose-900 underline hover:text-rose-950"
                >
                  {t('report.retryGps')}
                </button>
              </div>
            </div>
          )}
        </div>
      ) : (
        /* Location Acquired Info Box */
        <div className="p-4 rounded-xl bg-white border border-gov-border text-gov-text-main shadow-card">
          <div className="flex items-start justify-between">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-lg bg-gov-navy text-gov-accent flex items-center justify-center font-bold text-sm shadow-soft flex-shrink-0">
                <CheckCircle2 className="w-4 h-4" />
              </div>
              <div>
                <p className="text-[10px] font-bold text-gov-muted uppercase tracking-widest">
                  {t('report.locVerified')}
                </p>
                <p className="text-sm font-bold text-gov-navy font-mono">
                  {formatCoordinates(latitude, longitude)}
                </p>
              </div>
            </div>

            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={handleGetLocation}
              disabled={disabled || isFetching}
              icon={RefreshCw}
              className="text-xs"
            >
              {t('report.refreshGps')}
            </Button>
          </div>

          {address && (
            <p className="mt-2.5 text-xs text-gov-text-body bg-gov-surface p-2.5 rounded-lg border border-gov-border font-medium flex items-start gap-1.5">
              <MapPin className="w-3.5 h-3.5 text-gov-muted flex-shrink-0 mt-0.5" />
              <span className="line-clamp-2">{address}</span>
            </p>
          )}

          {accuracy && (
            <div className="mt-2.5 flex items-center gap-2 text-[11px] text-gov-muted font-bold uppercase tracking-wider">
              <Crosshair className="w-3 h-3 text-gov-navy" />
              <span>{t('report.accuracy')}: ±{accuracy} meters</span>
              <span>•</span>
              <span>{t('report.geoIndexed')}</span>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
