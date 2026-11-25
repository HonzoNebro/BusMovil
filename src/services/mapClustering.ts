export interface ClusterPoint {
  stopId: string;
  latitude: number;
  longitude: number;
}
export interface StopCluster {
  latitude: number;
  longitude: number;
  stopIds: string[];
}

// Literal source is required: Hermes does not preserve function source in toString().
export const CLUSTER_SCRIPT = `function clusterStops(points, zoom) {
    const buckets = {};
    const scale = 256 * Math.pow(2, Math.floor(zoom));
    for (let index = 0; index < points.length; index++) {
        const point = points[index];
        const sin = Math.sin((point.latitude * Math.PI) / 180);
        const x = ((point.longitude + 180) / 360) * scale;
        const y = (0.5 - Math.log((1 + sin) / (1 - sin)) / (4 * Math.PI)) * scale;
        const key = zoom >= 17
            ? point.stopId
            : zoom <= 10
                ? 'city'
                : Math.floor(x / 72) + ':' + Math.floor(y / 72);
        let bucket = buckets[key];
        if (!bucket) {
            bucket = { latitude: 0, longitude: 0, stopIds: [] };
            buckets[key] = bucket;
        }
        bucket.latitude += point.latitude;
        bucket.longitude += point.longitude;
        bucket.stopIds.push(point.stopId);
    }
    return Object.keys(buckets).map(function (key) {
        const bucket = buckets[key];
        bucket.latitude /= bucket.stopIds.length;
        bucket.longitude /= bucket.stopIds.length;
        return bucket;
    });
}`;
