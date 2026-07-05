export interface Ride {
  id: string;
  source: string;
  destination: string;
  departure_time: string;
  available_seats: number;
  price: number;
  driver_id: string;
}