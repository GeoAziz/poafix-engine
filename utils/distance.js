/**
 * Calculates the distance between two coordinates in meters
 * @param {Array} coords1 [longitude, latitude]
 * @param {Array} coords2 [longitude, latitude]
 * @returns {number} Distance in meters
 */
export function getDistance(coords1, coords2) {
  const R = 6371e3; // Earth's radius in meters
  const φ1 = coords1[1] * Math.PI/180;
  const φ2 = coords2[1] * Math.PI/180;
  const Δφ = (coords2[1]-coords1[1]) * Math.PI/180;
  const Δλ = (coords2[0]-coords1[0]) * Math.PI/180;

  const a = Math.sin(Δφ/2) * Math.sin(Δφ/2) +
          Math.cos(φ1) * Math.cos(φ2) *
          Math.sin(Δλ/2) * Math.sin(Δλ/2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));

  return R * c;
}
