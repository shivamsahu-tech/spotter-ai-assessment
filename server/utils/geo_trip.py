import math

def calculate_haversine_miles(coord1, coord2):
    """
    Calculates the great-circle distance between two points 
    on the Earth surface in miles.
    coord1, coord2: [longitude, latitude]
    """
    lon1, lat1 = coord1
    lon2, lat2 = coord2
    
    # Earth radius in miles
    R = 3958.8 

    phi1 = math.radians(lat1)
    phi2 = math.radians(lat2)
    delta_phi = math.radians(lat2 - lat1)
    delta_lambda = math.radians(lon2 - lon1)

    # Haversine formula
    a = math.sin(delta_phi / 2.0) ** 2 + \
        math.cos(phi1) * math.cos(phi2) * \
        math.sin(delta_lambda / 2.0) ** 2
    
    c = 2 * math.atan2(math.sqrt(a), math.sqrt(1 - a))
    
    return R * c

def attach_coordinates_to_logs(trip_logs, route_geometry, speed_mph=60.0):
    """
    Walks the route_geometry array and assigns an exact [lng, lat] 
    coordinate to every stationary event in the trip_logs.
    """
    cumulative_truck_distance = 0.0
    
    # State trackers for the geometry array to keep this O(N) efficient
    current_geom_index = 0
    current_geom_distance = 0.0

    for event in trip_logs:
        # 1. If driving, advance the cumulative distance of the truck
        if event['status'] == "Driving":
            cumulative_truck_distance += (event['duration_hours'] * speed_mph)
            continue
            
        # 2. If stationary (Break, Sleep, Load), find the exact coordinate
        coordinate_found = False
        
        while current_geom_index < len(route_geometry) - 1:
            p1 = route_geometry[current_geom_index]
            p2 = route_geometry[current_geom_index + 1]
            
            segment_distance = calculate_haversine_miles(p1, p2)
            
            # If the truck's distance falls inside this specific segment
            if current_geom_distance + segment_distance >= cumulative_truck_distance:
                # Interpolate the exact spot between p1 and p2
                excess = cumulative_truck_distance - current_geom_distance
                ratio = excess / segment_distance if segment_distance > 0 else 0
                
                interp_lng = p1[0] + (p2[0] - p1[0]) * ratio
                interp_lat = p1[1] + (p2[1] - p1[1]) * ratio
                
                event['coordinate'] = [round(interp_lng, 5), round(interp_lat, 5)]
                coordinate_found = True
                break
            
            # Move to the next segment
            current_geom_distance += segment_distance
            current_geom_index += 1
            
        # Fallback for the final dropoff point (handles float rounding errors)
        if not coordinate_found:
            event['coordinate'] = [
                round(route_geometry[-1][0], 5), 
                round(route_geometry[-1][1], 5)
            ]

    return trip_logs