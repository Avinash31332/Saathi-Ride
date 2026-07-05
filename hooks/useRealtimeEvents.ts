// import { useEffect } from "react";
// import { supabase } from "../services/supabase";
// import useGlobalEvents from "./useGlobalEvents";

// export default function useRealtimeEvents() {
//   const { setEvent } = useGlobalEvents();

//   useEffect(() => {
//     console.log("Realtime Hook Started");

//     let channel: any = null;

//     const subscribe = async () => {
//       const {
//         data: { user },
//       } = await supabase.auth.getUser();

//       if (!user) return;

//       // Remove any previous channel with the same name
//       const existing = supabase
//         .getChannels()
//         .find((c) => c.topic === `realtime:ride-events-${user.id}`);

//       if (existing) {
//         await supabase.removeChannel(existing);
//       }

//       channel = supabase
//   .channel("debug-rides")
//   .on(
//     "postgres_changes",
//     {
//       event: "*",
//       schema: "public",
//       table: "rides",
//     },
//     (payload) => {
//       console.log("========== REALTIME ==========");
//       console.log(payload);
//     }
//   )
//   .subscribe((status) => {
//     console.log("Realtime Status:", status);
//   });
//     };

//     subscribe();

//     return () => {
//       if (channel) {
//         supabase.removeChannel(channel);
//       }
//     };
//   }, []);

//   return null;
// }