export interface Place {
  name: string;

  latitude: number;

  longitude: number;
}

export interface RouteData {
  distanceKm: number;

  durationMinutes: number;

  coordinates: {
    latitude: number;
    longitude: number;
  }[];
}