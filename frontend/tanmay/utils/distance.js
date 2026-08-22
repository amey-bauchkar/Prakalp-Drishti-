/**
 * Calculate the great-circle distance between two geographic coordinates in meters
 * Uses the Haversine Formula.
 *
 * @param {number} lat1 Latitude of point 1 in degrees
 * @param {number} lon1 Longitude of point 1 in degrees
 * @param {number} lat2 Latitude of point 2 in degrees
 * @param {number} lon2 Longitude of point 2 in degrees
 * @returns {number} Distance in meters
 */
export const calculateDistance = (lat1, lon1, lat2, lon2) => {
  if (
    lat1 === undefined || lon1 === undefined ||
    lat2 === undefined || lon2 === undefined ||
    isNaN(lat1) || isNaN(lon1) || isNaN(lat2) || isNaN(lon2)
  ) {
    return Infinity;
  }

  const R = 6371e3; // Earth's radius in meters
  const rad = Math.PI / 180;
  const φ1 = lat1 * rad;
  const φ2 = lat2 * rad;
  const Δφ = (lat2 - lat1) * rad;
  const Δλ = (lon2 - lon1) * rad;

  const a =
    Math.sin(Δφ / 2) * Math.sin(Δφ / 2) +
    Math.cos(φ1) * Math.cos(φ2) *
    Math.sin(Δλ / 2) * Math.sin(Δλ / 2);

  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

  return Math.round(R * c);
};

/**
 * Format a distance in meters to a human-readable string (e.g., "120m away", "2.4km away")
 *
 * @param {number} meters Distance in meters
 * @returns {string}
 */
export const formatDistance = (meters) => {
  if (meters === undefined || meters === null || isNaN(meters) || meters === Infinity) {
    return 'Distance unknown';
  }

  if (meters < 1000) {
    return `${Math.round(meters)}m away`;
  }

  const km = (meters / 1000).toFixed(1);
  return `${km}km away`;
};

/**
 * Extract [lat, lng] from various issue coordinate formats (GeoJSON [lng, lat] or objects)
 *
 * @param {object} issue Issue object with location.coordinates or lat/lng
 * @returns {[number, number]|null} [latitude, longitude]
 */
export const extractCoordinates = (issue) => {
  if (!issue) return null;

  // GeoJSON format: location: { type: 'Point', coordinates: [lng, lat] }
  if (issue.location && Array.isArray(issue.location.coordinates) && issue.location.coordinates.length >= 2) {
    const [lng, lat] = issue.location.coordinates;
    return [lat, lng];
  }

  // Coordinates array directly
  if (Array.isArray(issue.coordinates) && issue.coordinates.length >= 2) {
    const [lng, lat] = issue.coordinates;
    return [lat, lng];
  }

  // Object with latitude/longitude or lat/lng
  if (issue.latitude !== undefined && issue.longitude !== undefined) {
    return [parseFloat(issue.latitude), parseFloat(issue.longitude)];
  }
  if (issue.lat !== undefined && issue.lng !== undefined) {
    return [parseFloat(issue.lat), parseFloat(issue.lng)];
  }

  return null;
};

/**
 * Compute distance between user location and an issue
 *
 * @param {[number, number]} userCoords [latitude, longitude]
 * @param {object} issue Issue object
 * @returns {number} Distance in meters
 */
export const getIssueDistance = (userCoords, issue) => {
  if (!userCoords || !Array.isArray(userCoords) || userCoords.length < 2) return Infinity;
  const issueCoords = extractCoordinates(issue);
  if (!issueCoords) return Infinity;

  const [userLat, userLng] = userCoords;
  const [issueLat, issueLng] = issueCoords;

  return calculateDistance(userLat, userLng, issueLat, issueLng);
};

/**
 * Sort issues by proximity to user coordinates
 *
 * @param {object[]} issues Array of issue objects
 * @param {[number, number]} userCoords [latitude, longitude]
 * @returns {object[]} Sorted array with attached `distanceMeters` and `distanceText`
 */
export const sortIssuesByDistance = (issues, userCoords) => {
  if (!Array.isArray(issues)) return [];
  if (!userCoords) return issues;

  return issues
    .map((issue) => {
      const distanceMeters = getIssueDistance(userCoords, issue);
      return {
        ...issue,
        distanceMeters,
        distanceText: formatDistance(distanceMeters),
      };
    })
    .sort((a, b) => a.distanceMeters - b.distanceMeters);
};
