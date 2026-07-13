export interface RouteCoordinate {
  latitude: number;
  longitude: number;
}

export interface LocalRouteProgressResult {
  progressPercentage: number;

  distanceFromRouteKm: number;

  routeDeviation: boolean;

  nearestRouteIndex: number;

  travelledDistanceKm: number;

  totalRouteDistanceKm: number;
}

const ROUTE_DEVIATION_THRESHOLD_KM = 0.5;

/*
 * Google encoded polyline decoder.
 *
 * Runs completely locally.
 * No network request.
 */

export function decodePolyline(encodedPolyline: string): RouteCoordinate[] {
  if (!encodedPolyline) {
    return [];
  }

  const coordinates: RouteCoordinate[] = [];

  let index = 0;

  let latitude = 0;
  let longitude = 0;

  while (index < encodedPolyline.length) {
    let result = 0;
    let shift = 0;
    let byte: number;

    do {
      byte = encodedPolyline.charCodeAt(index++) - 63;

      result |= (byte & 0x1f) << shift;

      shift += 5;
    } while (byte >= 0x20);

    const latitudeDifference = result & 1 ? ~(result >> 1) : result >> 1;

    latitude += latitudeDifference;

    result = 0;
    shift = 0;

    do {
      byte = encodedPolyline.charCodeAt(index++) - 63;

      result |= (byte & 0x1f) << shift;

      shift += 5;
    } while (byte >= 0x20);

    const longitudeDifference = result & 1 ? ~(result >> 1) : result >> 1;

    longitude += longitudeDifference;

    coordinates.push({
      latitude: latitude / 1e5,
      longitude: longitude / 1e5,
    });
  }

  return coordinates;
}

function toRadians(value: number) {
  return (value * Math.PI) / 180;
}

export function calculateDistanceKm(
  first: RouteCoordinate,
  second: RouteCoordinate,
) {
  const earthRadiusKm = 6371;

  const latitudeDifference = toRadians(second.latitude - first.latitude);

  const longitudeDifference = toRadians(second.longitude - first.longitude);

  const firstLatitude = toRadians(first.latitude);

  const secondLatitude = toRadians(second.latitude);

  const a =
    Math.sin(latitudeDifference / 2) ** 2 +
    Math.cos(firstLatitude) *
      Math.cos(secondLatitude) *
      Math.sin(longitudeDifference / 2) ** 2;

  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

  return earthRadiusKm * c;
}

/*
 * Converts coordinates into a small local
 * flat plane.
 *
 * This lets us calculate the nearest point
 * ON a route segment instead of only checking
 * route vertices.
 */

function projectCoordinate(
  coordinate: RouteCoordinate,
  referenceLatitude: number,
) {
  const earthRadiusKm = 6371;

  return {
    x:
      earthRadiusKm *
      toRadians(coordinate.longitude) *
      Math.cos(toRadians(referenceLatitude)),

    y: earthRadiusKm * toRadians(coordinate.latitude),
  };
}

function getNearestPointOnSegment(
  currentLocation: RouteCoordinate,
  segmentStart: RouteCoordinate,
  segmentEnd: RouteCoordinate,
) {
  const referenceLatitude = currentLocation.latitude;

  const current = projectCoordinate(currentLocation, referenceLatitude);

  const start = projectCoordinate(segmentStart, referenceLatitude);

  const end = projectCoordinate(segmentEnd, referenceLatitude);

  const segmentX = end.x - start.x;
  const segmentY = end.y - start.y;

  const segmentLengthSquared = segmentX * segmentX + segmentY * segmentY;

  let segmentProgress = 0;

  if (segmentLengthSquared > 0) {
    segmentProgress =
      ((current.x - start.x) * segmentX + (current.y - start.y) * segmentY) /
      segmentLengthSquared;
  }

  segmentProgress = Math.max(0, Math.min(1, segmentProgress));

  const nearestX = start.x + segmentProgress * segmentX;

  const nearestY = start.y + segmentProgress * segmentY;

  const differenceX = current.x - nearestX;

  const differenceY = current.y - nearestY;

  const distanceKm = Math.sqrt(
    differenceX * differenceX + differenceY * differenceY,
  );

  return {
    distanceKm,
    segmentProgress,
  };
}

function calculateRouteSegmentDistances(route: RouteCoordinate[]) {
  const segmentDistances: number[] = [];

  let totalDistanceKm = 0;

  for (let index = 0; index < route.length - 1; index++) {
    const distance = calculateDistanceKm(route[index], route[index + 1]);

    segmentDistances.push(distance);

    totalDistanceKm += distance;
  }

  return {
    segmentDistances,
    totalDistanceKm,
  };
}

export function calculateLocalRouteProgress(
  encodedPolyline: string,
  latitude: number,
  longitude: number,
): LocalRouteProgressResult {
  const route = decodePolyline(encodedPolyline);

  if (route.length < 2) {
    throw new Error("Route polyline does not contain enough coordinates.");
  }

  const currentLocation: RouteCoordinate = {
    latitude,
    longitude,
  };

  const { segmentDistances, totalDistanceKm } =
    calculateRouteSegmentDistances(route);

  let nearestSegmentIndex = 0;

  let nearestSegmentProgress = 0;

  let distanceFromRouteKm = Number.POSITIVE_INFINITY;

  /*
   * Find the closest route segment.
   */

  for (let index = 0; index < route.length - 1; index++) {
    const result = getNearestPointOnSegment(
      currentLocation,
      route[index],
      route[index + 1],
    );

    if (result.distanceKm < distanceFromRouteKm) {
      distanceFromRouteKm = result.distanceKm;

      nearestSegmentIndex = index;

      nearestSegmentProgress = result.segmentProgress;
    }
  }

  /*
   * Calculate distance travelled along route.
   */

  let travelledDistanceKm = 0;

  for (let index = 0; index < nearestSegmentIndex; index++) {
    travelledDistanceKm += segmentDistances[index];
  }

  travelledDistanceKm +=
    segmentDistances[nearestSegmentIndex] * nearestSegmentProgress;

  const progressPercentage =
    totalDistanceKm > 0
      ? Math.min(
          100,
          Math.max(0, (travelledDistanceKm / totalDistanceKm) * 100),
        )
      : 0;

  const routeDeviation = distanceFromRouteKm >= ROUTE_DEVIATION_THRESHOLD_KM;

  return {
    progressPercentage,

    distanceFromRouteKm,

    routeDeviation,

    nearestRouteIndex: nearestSegmentIndex,

    travelledDistanceKm,

    totalRouteDistanceKm: totalDistanceKm,
  };
}
