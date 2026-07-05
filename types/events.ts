export interface RidePayload {
  rideId: string;

  bookingId?: string;

  driverId: string;

  reviewerId?: string;

  source: string;

  destination: string;

  rideDate: string;

  rideTime: string;
}