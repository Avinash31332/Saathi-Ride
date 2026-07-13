Driver GPS
↓
processJourneyLocation()
↓
route polyline from MEMORY CACHE
↓
local route calculation
↓
progress calculated locally
↓
distance from route calculated locally
↓
raw deviation detected locally
↓
AsyncStorage adaptive cache
↓
┌──────────────────────────────┐
│ │
No meaningful change Meaningful change
│ │
Cache only Supabase RPC
│ │
0 database requests ride_tracking
↓
Realtime
↓
My Journey

Deviation now works like this:

Normal ride

OFF ROUTE
count 1
↓
CACHE

OFF ROUTE
count 2
↓
CACHE

OFF ROUTE
count 3
↓
DEVIATION CONFIRMED
↓
SUPABASE

Safety:

OFF ROUTE
count 1
↓
CACHE

OFF ROUTE
count 2
↓
DEVIATION CONFIRMED
↓
SUPABASE

And:

DEVIATED

ON ROUTE
count 1
↓
CACHE

ON ROUTE
count 2
↓
ROUTE RESTORED
↓
SUPABASE
