/**
 * Utility for fetching GPX files with consistent error handling
 * Used by map components when loading GPX files from URLs
 */

/**
 * Fetch GPX file content from URL
 * @param {string} url - URL to the GPX file
 * @returns {Promise<string>} Raw GPX file content (XML string)
 * @throws {Error} If fetch fails or response is not ok
 *
 * @example
 * try {
 *   const gpxText = await fetchGPXFile('/maps/route.gpx');
 *   const coords = parseGPXToTrackCoordinates(gpxText);
 * } catch (error) {
 *   console.error('Failed to load GPX:', error.message);
 * }
 */
export const fetchGPXFile = async (url) => {
  try {
    const response = await fetch(url);
    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    }
    const gpxText = await response.text();
    if (!gpxText || gpxText.trim().length === 0) {
      throw new Error('GPX file is empty');
    }
    return gpxText;
  } catch (error) {
    console.error(`Error loading GPX file from ${url}:`, error);
    throw new Error(`Failed to load GPX file: ${error.message}`);
  }
};

export default fetchGPXFile;

