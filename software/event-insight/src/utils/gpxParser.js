/**
 * GPX Parsing Utilities
 * Consolidated functions for extracting track data from GPX files
 */

const EARTH_RADIUS_METERS = 6371000;

/**
 * Convert degrees to radians
 */
const toRadians = (degrees) => (degrees * Math.PI) / 180;

/**
 * Calculate distance between two points using Haversine formula
 * @param {number} lat1 - Starting latitude
 * @param {number} lon1 - Starting longitude
 * @param {number} lat2 - Ending latitude
 * @param {number} lon2 - Ending longitude
 * @returns {number} Distance in meters
 */
const haversineDistance = (lat1, lon1, lat2, lon2) => {
  const dLat = toRadians(lat2 - lat1);
  const dLon = toRadians(lon2 - lon1);
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(toRadians(lat1)) * Math.cos(toRadians(lat2)) * Math.sin(dLon / 2) ** 2;
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return EARTH_RADIUS_METERS * c;
};

/**
 * Parse GPX file to full profile with coordinates, distance, and elevation
 * Single-pass parser returning all available data per track point.
 * Used for all calculations that need coordinates (track visualization, distance tracking, elevation charts).
 *
 * @param {string} gpxText - Raw GPX file content (XML string)
 * @param {Object} options - Configuration options
 * @param {boolean} options.include3D - If true, account for elevation delta in distance (3D distance).
 *                                       If false, use only horizontal Haversine distance. Default: false
 * @returns {Array<{lat: number, lon: number, distance: number, elevation: number}>} Array of full profile points
 *
 * @example
 * const fullProfile = parseGPXToFullProfile(gpxText, { include3D: true });
 * // Returns: [{lat: 47.123, lon: 11.456, distance: 0, elevation: 1200}, ...]
 */
export const parseGPXToFullProfile = (gpxText, options = {}) => {
  const { include3D = false } = options;

  try {
    const parser = new DOMParser();
    const xmlDoc = parser.parseFromString(gpxText, 'text/xml');
    const trackPoints = xmlDoc.getElementsByTagName('trkpt');

    if (trackPoints.length === 0) {
      console.warn('No track points found in GPX file');
      return [];
    }

    let cumulativeDistance = 0;
    let prevLat = null;
    let prevLon = null;
    let prevEle = null;
    const data = [];

    for (let i = 0; i < trackPoints.length; i++) {
      const lat = parseFloat(trackPoints[i].getAttribute('lat'));
      const lon = parseFloat(trackPoints[i].getAttribute('lon'));

      // Skip invalid coordinates (filter NaN like parseGPXToTrackCoordinates does)
      if (isNaN(lat) || isNaN(lon)) {
        continue;
      }

      const eleTag = trackPoints[i].getElementsByTagName('ele');
      const ele = eleTag.length > 0 ? parseFloat(eleTag[0].textContent) : 0;

      // Calculate distance from previous point
      if (prevLat !== null && prevLon !== null) {
        let dHoriz = haversineDistance(prevLat, prevLon, lat, lon);

        // Include elevation delta in distance calculation if requested
        if (include3D && prevEle !== null) {
          const deltaEle = ele - prevEle;
          dHoriz = Math.sqrt(dHoriz * dHoriz + deltaEle * deltaEle);
        }

        cumulativeDistance += dHoriz;
      }

      prevLat = lat;
      prevLon = lon;
      prevEle = ele;

      data.push({ lat, lon, distance: cumulativeDistance, elevation: ele });
    }

    if (data.length === 0) {
      console.warn('No valid track points found in GPX file (all coordinates were NaN)');
    }

    return data;
  } catch (error) {
    console.error('Error parsing GPX to full profile:', error);
    throw new Error(`Failed to parse GPX: ${error.message}`);
  }
};

/**
 * Parse GPX file to simple track coordinates for map rendering
 * Returns coordinates in [lat, lon] tuple format for use with Leaflet polylines.
 *
 * @param {string} gpxText - Raw GPX file content (XML string)
 * @returns {Array<[number, number]>} Array of [latitude, longitude] coordinate tuples
 *
 * @example
 * const coords = parseGPXToTrackCoordinates(gpxText);
 * // Returns: [[47.123, 11.456], [47.124, 11.457], ...]
 */
export const parseGPXToTrackCoordinates = (gpxText) => {
  try {
    const parser = new DOMParser();
    const xmlDoc = parser.parseFromString(gpxText, 'text/xml');
    const trackPoints = xmlDoc.getElementsByTagName('trkpt');

    const trackData = Array.from(trackPoints)
      .map((point) => [parseFloat(point.getAttribute('lat')), parseFloat(point.getAttribute('lon'))])
      .filter(([lat, lon]) => !isNaN(lat) && !isNaN(lon));

    if (trackData.length === 0) {
      console.warn('No valid track points found in GPX file');
    }

    return trackData;
  } catch (error) {
    console.error('Error parsing GPX to track coordinates:', error);
    throw new Error(`Failed to parse GPX: ${error.message}`);
  }
};
