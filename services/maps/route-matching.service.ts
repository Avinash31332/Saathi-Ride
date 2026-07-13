export interface RouteCoordinate {
  latitude: number;
  longitude: number;
}

export interface RouteProjection {
  progress: number;
  distanceFromRouteKm: number;
  distanceFromStartKm: number;
  projectedLatitude: number;
  projectedLongitude: number;
  segmentIndex: number;
}

export interface PassengerSegmentMatch {
  matched: boolean;
  reason: string | null;

  pickupProjection: RouteProjection | null;
  dropProjection: RouteProjection | null;

  matchedRoutePercentage?: number;
  segmentDistanceKm?: number;
}

const EARTH_RADIUS_KM = 6371;

function toRadians(value: number) {
  return (value * Math.PI) / 180;
}

function haversineDistance(a: RouteCoordinate, b: RouteCoordinate) {
  const latDifference = toRadians(b.latitude - a.latitude);

  const lngDifference = toRadians(b.longitude - a.longitude);

  const lat1 = toRadians(a.latitude);
  const lat2 = toRadians(b.latitude);

  const value =
    Math.sin(latDifference / 2) ** 2 +
    Math.cos(lat1) * Math.cos(lat2) * Math.sin(lngDifference / 2) ** 2;

  return (
    EARTH_RADIUS_KM * 2 * Math.atan2(Math.sqrt(value), Math.sqrt(1 - value))
  );
}

export function decodePolyline(encoded: string): RouteCoordinate[] {
  if (!encoded) {
    return [];
  }

  const coordinates: RouteCoordinate[] = [];

  let index = 0;
  let latitude = 0;
  let longitude = 0;

  while (index < encoded.length) {
    let shift = 0;
    let result = 0;
    let byte: number;

    do {
      byte = encoded.charCodeAt(index++) - 63;

      result |= (byte & 0x1f) << shift;

      shift += 5;
    } while (byte >= 0x20);

    const latitudeDifference = result & 1 ? ~(result >> 1) : result >> 1;

    latitude += latitudeDifference;

    shift = 0;
    result = 0;

    do {
      byte = encoded.charCodeAt(index++) - 63;

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

function projectPointToSegment(
  point: RouteCoordinate,
  start: RouteCoordinate,
  end: RouteCoordinate,
) {
  const referenceLatitude = toRadians((start.latitude + end.latitude) / 2);

  const kmPerLatitudeDegree = 111.32;

  const kmPerLongitudeDegree = 111.32 * Math.cos(referenceLatitude);

  const startX = start.longitude * kmPerLongitudeDegree;

  const startY = start.latitude * kmPerLatitudeDegree;

  const endX = end.longitude * kmPerLongitudeDegree;

  const endY = end.latitude * kmPerLatitudeDegree;

  const pointX = point.longitude * kmPerLongitudeDegree;

  const pointY = point.latitude * kmPerLatitudeDegree;

  const segmentX = endX - startX;
  const segmentY = endY - startY;

  const segmentLengthSquared = segmentX * segmentX + segmentY * segmentY;

  let t = 0;

  if (segmentLengthSquared > 0) {
    t =
      ((pointX - startX) * segmentX + (pointY - startY) * segmentY) /
      segmentLengthSquared;
  }

  t = Math.max(0, Math.min(1, t));

  const projectedX = startX + t * segmentX;

  const projectedY = startY + t * segmentY;

  const projectedLongitude = projectedX / kmPerLongitudeDegree;

  const projectedLatitude = projectedY / kmPerLatitudeDegree;

  const projectedPoint = {
    latitude: projectedLatitude,
    longitude: projectedLongitude,
  };

  return {
    t,

    projectedPoint,

    distanceKm: haversineDistance(point, projectedPoint),
  };
}

export function getRouteDistanceKm(route: RouteCoordinate[]) {
  let distance = 0;

  for (let index = 0; index < route.length - 1; index++) {
    distance += haversineDistance(route[index], route[index + 1]);
  }

  return distance;
}

export function projectPointOntoRoute(
  point: RouteCoordinate,
  route: RouteCoordinate[],
): RouteProjection | null {
  if (!route || route.length < 2) {
    return null;
  }

  const cumulativeDistances: number[] = [0];

  let totalDistance = 0;

  for (let index = 0; index < route.length - 1; index++) {
    totalDistance += haversineDistance(route[index], route[index + 1]);

    cumulativeDistances.push(totalDistance);
  }

  if (totalDistance <= 0) {
    return null;
  }

  let bestProjection: RouteProjection | null = null;

  for (let index = 0; index < route.length - 1; index++) {
    const start = route[index];
    const end = route[index + 1];

    const projection = projectPointToSegment(point, start, end);

    const segmentDistance = haversineDistance(start, end);

    const distanceFromStartKm =
      cumulativeDistances[index] + projection.t * segmentDistance;

    const progress = (distanceFromStartKm / totalDistance) * 100;

    if (
      !bestProjection ||
      projection.distanceKm < bestProjection.distanceFromRouteKm
    ) {
      bestProjection = {
        progress: Math.max(0, Math.min(100, progress)),

        distanceFromRouteKm: projection.distanceKm,

        distanceFromStartKm,

        projectedLatitude: projection.projectedPoint.latitude,

        projectedLongitude: projection.projectedPoint.longitude,

        segmentIndex: index,
      };
    }
  }

  return bestProjection;
}

export function matchPassengerSegment(
  pickup: RouteCoordinate,
  drop: RouteCoordinate,
  encodedPolyline: string,
  maximumDeviationKm = 2,
): PassengerSegmentMatch {
  const route = decodePolyline(encodedPolyline);

  if (route.length < 2) {
    return {
      matched: false,
      reason: "invalid_route",
      pickupProjection: null,
      dropProjection: null,
    };
  }

  const pickupProjection = projectPointOntoRoute(pickup, route);

  const dropProjection = projectPointOntoRoute(drop, route);

  if (!pickupProjection || !dropProjection) {
    return {
      matched: false,
      reason: "route_projection_failed",
      pickupProjection,
      dropProjection,
    };
  }

  if (pickupProjection.distanceFromRouteKm > maximumDeviationKm) {
    return {
      matched: false,
      reason: "pickup_too_far",
      pickupProjection,
      dropProjection,
    };
  }

  if (dropProjection.distanceFromRouteKm > maximumDeviationKm) {
    return {
      matched: false,
      reason: "drop_too_far",
      pickupProjection,
      dropProjection,
    };
  }

  if (pickupProjection.progress >= dropProjection.progress) {
    return {
      matched: false,
      reason: "wrong_direction",
      pickupProjection,
      dropProjection,
    };
  }

  const segmentDistanceKm =
    dropProjection.distanceFromStartKm - pickupProjection.distanceFromStartKm;

  return {
    matched: true,
    reason: null,

    pickupProjection,
    dropProjection,

    matchedRoutePercentage: dropProjection.progress - pickupProjection.progress,

    segmentDistanceKm,
  };
}
