import useGlobalEvents from "../hooks/useGlobalEvents";

export function useEventService() {
  const { setEvent } = useGlobalEvents();

  return {

    showRideCompletion(payload:any){
      setEvent({
        type:"rideCompletion",
        payload,
      });
    },

    showRideCompleted(
    payload:any,
    isDriver:boolean
){
    setEvent({

        type:"rideCompleted",

        payload:{
            ...payload,
            isDriver,
        }

    });
},

    showPayment(payload:any){
      setEvent({
        type:"payment",
        payload,
      });
    },

    showVerification(payload:any){
      setEvent({
        type:"verification",
        payload,
      });
    },

    showSOS(payload:any){
      setEvent({
        type:"sos",
        payload,
        priority:"high",
        dismissible:false,
      });
    }

  };
}