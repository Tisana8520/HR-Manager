// 1D K-Means (written by hand, no library)
function kmeans1D(values, k = 3, maxIter = 100) {
  const data = values.filter((v) => Number.isFinite(v));
  if (data.length === 0) return [];

  const uniq = [...new Set(data)].sort((a, b) => a - b);
  const K = Math.min(k, uniq.length); // cannot have more clusters than distinct values

  // Deterministic init: spread centroids evenly across distinct sorted values
  let centroids = [];
  for (let i = 0; i < K; i++) {
    const idx = K === 1 ? 0 : Math.floor((i * (uniq.length - 1)) / (K - 1));
    centroids.push(uniq[idx]);
  }

  let assign = new Array(data.length).fill(-1);
  for (let iter = 0; iter < maxIter; iter++) {
    let changed = false;
    // Assignment step
    for (let i = 0; i < data.length; i++) {
      let best = 0;
      let bestDist = Math.abs(data[i] - centroids[0]);
      for (let c = 1; c < K; c++) {
        const d = Math.abs(data[i] - centroids[c]);
        if (d < bestDist) { bestDist = d; best = c; }
      }
      if (assign[i] !== best) { assign[i] = best; changed = true; }
    }
    // Update step
    const sums = new Array(K).fill(0);
    const counts = new Array(K).fill(0);
    for (let i = 0; i < data.length; i++) { sums[assign[i]] += data[i]; counts[assign[i]]++; }
    centroids = centroids.map((c, idx) => (counts[idx] > 0 ? sums[idx] / counts[idx] : c)); // keep old centroid if cluster empty
    if (!changed) break;
  }

  const counts = new Array(K).fill(0);
  assign.forEach((a) => counts[a]++);

  return centroids
    .map((c, i) => ({ centroid: Math.round(c * 100) / 100, count: counts[i] }))
    .filter((c) => c.count > 0)
    .sort((a, b) => a.centroid - b.centroid);
}

module.exports = { kmeans1D };
