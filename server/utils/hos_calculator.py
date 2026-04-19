from typing import List, Dict, Any
import logging

logger = logging.getLogger(__name__)

def calculate_hos_logs(
    onloading_distance: float, 
    offloading_distance: float, 
    current_cycle_used: float, 
    speed_mph: float = 60.0, 
    remaining_fuel_distance: float = 1000.0
) -> List[Dict[str, Any]]:
    state: Dict[str, float] = {
        'duty_left': 14.0,           
        'driving_left': 11.0,        
        'cycle_left': 70.0 - current_cycle_used, 
        'time_since_break': 0.0,     
        'dist_since_fuel': 1000.0 - remaining_fuel_distance      
    }
    trip_logs: List[Dict[str, Any]] = []

    logger.info("calculate_hos_logs start: onloading_distance=%.2f offloading_distance=%.2f current_cycle_used=%.2f speed_mph=%.2f remaining_fuel_distance=%.2f", onloading_distance, offloading_distance, current_cycle_used, speed_mph, remaining_fuel_distance)

    def log_event(status: str, duration: float, reason: str = "") -> None:
        if duration > 0.001:
            trip_logs.append({"status": status, "duration_hours": round(duration, 4), "reason": reason})
            logger.debug("HOS event: status=%s duration=%.4f reason=%s", status, duration, reason)

    trip_completed = False

    while not trip_completed:

        if onloading_distance <= 0.001:
            log_event("On Duty (Not Driving)", 1.0, "Pickup Loading")
            state['duty_left'] -= 1.0
            state['cycle_left'] -= 1.0
            state['time_since_break'] = 0.0 
            onloading_distance = float('inf') # Disable the trigger forever
            continue
            

        if offloading_distance <= 0.001:
            log_event("On Duty (Not Driving)", 1.0, "Dropoff Unloading")
            state['duty_left'] -= 1.0
            state['cycle_left'] -= 1.0
            state['time_since_break'] = 0.0
            trip_completed = True # Safely break the loop AFTER unloading
            continue
            
        if state['cycle_left'] <= 0.001:
            log_event("Off Duty", 34.0, "34-Hour Restart")
            state['cycle_left'] = 70.0
            state['duty_left'] = 14.0
            state['driving_left'] = 11.0
            state['time_since_break'] = 0.0
            continue
            
        if state['duty_left'] <= 0.001 or state['driving_left'] <= 0.001:
            log_event("Sleeper Berth", 10.0, "10-Hour Reset")
            state['duty_left'] = 14.0
            state['driving_left'] = 11.0
            state['time_since_break'] = 0.0
            continue
            
        if state['dist_since_fuel'] >= 1000.0:
            log_event("On Duty (Not Driving)", 0.5, "Fueling")
            state['duty_left'] -= 0.5
            state['cycle_left'] -= 0.5
            state['time_since_break'] = 0.0 
            state['dist_since_fuel'] = 0.0
            continue
            
        # 3. Mandatory Rest
        if state['time_since_break'] >= 8.0:
            log_event("Off Duty", 0.5, "Mandatory 30-Min Break")
            state['duty_left'] -= 0.5
            state['time_since_break'] = 0.0
            continue

        # 4. Calculate time to every possible stopping condition
        time_to_pickup = onloading_distance / speed_mph
        time_to_dropoff = offloading_distance / speed_mph
        
        time_to_break = 8.0 - state['time_since_break']
        time_to_fuel = (1000.0 - state['dist_since_fuel']) / speed_mph
        
        # 5. Find the smallest TIME block (No distance variables in here!)
        time_to_advance = min(
            time_to_pickup, time_to_dropoff, time_to_break, time_to_fuel, 
            state['duty_left'], state['driving_left'], state['cycle_left']
        )

        # 6. Append the block and advance state
        log_event("Driving", time_to_advance)

        dist_covered = time_to_advance * speed_mph
        
        if onloading_distance != float('inf'):
            onloading_distance -= dist_covered
            
        offloading_distance -= dist_covered
        
        state['dist_since_fuel'] += dist_covered
        state['time_since_break'] += time_to_advance
        state['driving_left'] -= time_to_advance
        state['duty_left'] -= time_to_advance
        state['cycle_left'] -= time_to_advance

    log_event("Off Duty", 0, "Trip Complete")
    logger.info("calculate_hos_logs completed: events=%d", len(trip_logs))
    return trip_logs
