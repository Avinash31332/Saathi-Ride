Driver opens active Journey
↓
DriverTrackingController mounts
↓
ride_status = active
↓
startDriverLocationTracking()
↓
prepareJourneyTracking()
↓
GPS watcher starts
↓
processJourneyLocation()
↓
local route progress
↓
adaptive cache
↓
meaningful change
↓
ride_tracking updated
↓
Supabase Realtime
↓
Driver Journey updates
↓
Passenger Journey updates

//now
GPS reading
↓
local route analysis
↓
adaptive cache
↓
upload decision
↓
ride_tracking updated
↓
passenger pickup/drop events checked
↓
user_notifications created
↓
25 / 50 / 75 / 100 safety checkpoint checked
↓
ride_safety_events
↓
safety_alert_queue
↓
process-safety-alerts Edge Function
