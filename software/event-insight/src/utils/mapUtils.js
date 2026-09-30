export function calculateBoundsAndCenter(route) {
    if (route.length === 0) return {center: null, zoom: 14};

    let minLat = 90, maxLat = -90, minLon = 180, maxLon = -180;

    route.forEach(([lat, lon]) => {
        if (lat < minLat) minLat = lat;
        if (lat > maxLat) maxLat = lat;
        if (lon < minLon) minLon = lon;
        if (lon > maxLon) maxLon = lon;
    });

    const center = [(minLat + maxLat) / 2, (minLon + maxLon) / 2];
    const latDiff = maxLat - minLat;
    const lonDiff = maxLon - minLon;
    const maxDiff = Math.max(latDiff, lonDiff);
    const worldSize = 40075016.686;
    const scale = (maxDiff * worldSize) / 360;
    const targetResolution = scale / 800;
    const zoom = Math.log2(156543.03392 / targetResolution);

    return {center, zoom: Math.max(5, zoom)};
}
