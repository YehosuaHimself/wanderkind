/**
 * Route-relative distance computation.
 *
 * Given a route (array of [lat,lng] waypoints), project a point onto the
 * nearest segment and return the cumulative along-route distance in km.
 */

// Haversine distance between two points in km
function haversineKm(lat1: number, lng1: number, lat2: number, lng2: number): number {
  const R = 6371;
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLng = ((lng2 - lng1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLng / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

// Project point onto a line segment [A, B], return fraction t ∈ [0, 1]
function projectOnSegment(
  pLat: number, pLng: number,
  aLat: number, aLng: number,
  bLat: number, bLng: number,
): number {
  const dx = bLng - aLng;
  const dy = bLat - aLat;
  const lenSq = dx * dx + dy * dy;
  if (lenSq === 0) return 0;
  const t = ((pLng - aLng) * dx + (pLat - aLat) * dy) / lenSq;
  return Math.max(0, Math.min(1, t));
}

interface RouteProjection {
  /** Cumulative distance along the route to the projected point (km) */
  distanceAlongRoute: number;
  /** Perpendicular distance from the point to the route (km) — for relevance filtering */
  offRouteDistance: number;
}

/**
 * Project a lat/lng onto a route and return the along-route distance.
 * Route is an array of [lat, lng] coordinate pairs.
 */
export function projectOntoRoute(
  lat: number,
  lng: number,
  routeCoords: [number, number][],
): RouteProjection {
  if (routeCoords.length < 2) {
    return { distanceAlongRoute: 0, offRouteDistance: Infinity };
  }

  let bestSegIdx = 0;
  let bestT = 0;
  let bestDist = Infinity;

  // Find the nearest segment
  for (let i = 0; i < routeCoords.length - 1; i++) {
    const [aLat, aLng] = routeCoords[i];
    const [bLat, bLng] = routeCoords[i + 1];
    const t = projectOnSegment(lat, lng, aLat, aLng, bLat, bLng);
    const projLat = aLat + t * (bLat - aLat);
    const projLng = aLng + t * (bLng - aLng);
    const d = haversineKm(lat, lng, projLat, projLng);
    if (d < bestDist) {
      bestDist = d;
      bestSegIdx = i;
      bestT = t;
    }
  }

  // Sum distances of all complete segments before the best segment
  let cumulative = 0;
  for (let i = 0; i < bestSegIdx; i++) {
    cumulative += haversineKm(
      routeCoords[i][0], routeCoords[i][1],
      routeCoords[i + 1][0], routeCoords[i + 1][1],
    );
  }

  // Add the partial segment distance
  const [aLat, aLng] = routeCoords[bestSegIdx];
  const [bLat, bLng] = routeCoords[bestSegIdx + 1];
  const segLen = haversineKm(aLat, aLng, bLat, bLng);
  cumulative += segLen * bestT;

  return {
    distanceAlongRoute: cumulative,
    offRouteDistance: bestDist,
  };
}

/**
 * Compute relative distance between user and host along a route.
 * Returns null if either point is too far from the route (>30 km).
 */
export function getRouteRelativeDistance(
  userLat: number,
  userLng: number,
  hostLat: number,
  hostLng: number,
  routeCoords: [number, number][],
): { ahead: boolean; distanceKm: number } | null {
  const MAX_OFF_ROUTE = 30; // km — max distance from route to consider relevant

  const userProj = projectOntoRoute(userLat, userLng, routeCoords);
  const hostProj = projectOntoRoute(hostLat, hostLng, routeCoords);

  // If host is too far from route, not relevant
  if (hostProj.offRouteDistance > MAX_OFF_ROUTE) return null;
  // If user is too far from route, can't compute meaningful relative distance
  if (userProj.offRouteDistance > MAX_OFF_ROUTE) return null;

  const delta = hostProj.distanceAlongRoute - userProj.distanceAlongRoute;
  return {
    ahead: delta >= 0,
    distanceKm: Math.abs(delta),
  };
}
