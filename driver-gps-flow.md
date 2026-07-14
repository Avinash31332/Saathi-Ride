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
