import axios from "axios";

import polyline from "@mapbox/polyline";

export async function getRoute(
  start: {
    latitude: number;
    longitude: number;
  },
  end: {
    latitude: number;
    longitude: number;
  }
) {
  const url =
    `https://router.project-osrm.org/route/v1/driving/` +
    `${start.longitude},${start.latitude};` +
    `${end.longitude},${end.latitude}` +
    `?overview=full&geometries=polyline`;

  const { data } = await axios.get(url);

  const route = data.routes[0];

  return {
  distanceKm: route.distance / 1000,

  durationMinutes: route.duration / 60,

  polyline: route.geometry,

  coordinates: polyline.decode(route.geometry).map(([lat, lng]) => ({
    latitude: lat,
    longitude: lng,
  })),
};
}