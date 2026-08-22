/**
 * GeoHelper Utilities for Jharkhand Civic Issue Portal
 * Provides geolocation fetching, coordinate formatting, and validation.
 */

/**
 * Fetch current GPS coordinates from the browser's Geolocation API.
 * @param {PositionOptions} customOptions
 * @returns {Promise<{latitude: number, longitude: number, accuracy: number, timestamp: number}>}
 */
export const getCurrentCoordinates = (customOptions = {}) => {
  return new Promise((resolve, reject) => {
    if (!navigator.geolocation) {
      reject(new Error("Geolocation is not supported by your browser or device."));
      return;
    }

    const defaultOptions = {
      enableHighAccuracy: true,
      timeout: 15000,
      maximumAge: 0,
      ...customOptions
    };

    navigator.geolocation.getCurrentPosition(
      (position) => {
        const { latitude, longitude, accuracy } = position.coords;
        resolve({
          latitude: Number(latitude.toFixed(6)),
          longitude: Number(longitude.toFixed(6)),
          accuracy: Math.round(accuracy),
          timestamp: position.timestamp
        });
      },
      (error) => {
        let errorMessage = "Unable to retrieve your location.";
        switch (error.code) {
          case error.PERMISSION_DENIED:
            errorMessage = "Location permission denied. Please enable GPS access in your browser settings.";
            break;
          case error.POSITION_UNAVAILABLE:
            errorMessage = "Location information is currently unavailable. Ensure GPS is turned on.";
            break;
          case error.TIMEOUT:
            errorMessage = "Location request timed out. Please try again in an open area.";
            break;
          default:
            errorMessage = error.message || errorMessage;
        }
        reject(new Error(errorMessage));
      },
      defaultOptions
    );
  });
};

/**
 * Format latitude and longitude for clean UI display.
 * @param {number} lat 
 * @param {number} lng 
 * @param {number} precision
 * @returns {string} e.g. "23.3441° N, 85.3096° E"
 */
export const formatCoordinates = (lat, lng, precision = 4) => {
  if (lat === null || lat === undefined || lng === null || lng === undefined) {
    return "Coordinates unavailable";
  }

  const numLat = Number(lat);
  const numLng = Number(lng);

  if (isNaN(numLat) || isNaN(numLng)) {
    return "Invalid coordinates";
  }

  const latDir = numLat >= 0 ? "N" : "S";
  const lngDir = numLng >= 0 ? "E" : "W";

  return `${Math.abs(numLat).toFixed(precision)}° ${latDir}, ${Math.abs(numLng).toFixed(precision)}° ${lngDir}`;
};

/**
 * Validate that latitude and longitude are within standard geographical bounds.
 * @param {number} lat 
 * @param {number} lng 
 * @returns {boolean}
 */
export const validateCoordinates = (lat, lng) => {
  const numLat = Number(lat);
  const numLng = Number(lng);

  return (
    !isNaN(numLat) &&
    !isNaN(numLng) &&
    numLat >= -90 &&
    numLat <= 90 &&
    numLng >= -180 &&
    numLng <= 180
  );
};

/**
 * Attempt reverse geocoding via OpenStreetMap Nominatim with graceful fallback.
 * @param {number} lat 
 * @param {number} lng 
 * @returns {Promise<string>}
 */
export const reverseGeocode = async (lat, lng) => {
  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 4000);

    const response = await fetch(
      `https://nominatim.openstreetmap.org/reverse?format=jsonv2&lat=${lat}&lon=${lng}`,
      {
        signal: controller.signal,
        headers: { "Accept-Language": "en" }
      }
    );
    clearTimeout(timeoutId);

    if (!response.ok) throw new Error("Reverse geocode failed");
    const data = await response.json();
    return data.display_name || formatCoordinates(lat, lng);
  } catch {
    return formatCoordinates(lat, lng);
  }
};
