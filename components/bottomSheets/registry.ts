import RideCompletionSheet from "./RideCompletionSheet";
import RideCompletedSheet from "./RideCompletedSheet";
import PassengerDropRequestSheet from "./PassengerDropRequestSheet";
import PassengerDropReasonSheet from "./PassengerDropReasonSheet";
import RideCancelledSheet from "./RideCancelledSheet";
import PaymentSheet from "./PaymentSheet";
import VerificationSheet from "./VerificationSheet";
import SOSSheet from "./SOSSheet";

export const BottomSheetRegistry = {
  rideCompletion: RideCompletionSheet,

  rideCompleted: RideCompletedSheet,

  passengerDropRequest: PassengerDropRequestSheet,

  passengerDropReason: PassengerDropReasonSheet,

  rideCancelled: RideCancelledSheet,

  payment: PaymentSheet,

  verification: VerificationSheet,

  sos: SOSSheet,
};