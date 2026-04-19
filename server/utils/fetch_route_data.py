import os
import requests
from requests.adapters import HTTPAdapter
from urllib3.util.retry import Retry
import logging

logger = logging.getLogger(__name__)

def fetch_route_data(curr_coords, pickup_coords, dropoff_coords):
    logger.info("fetch_route_data start")
    logger.debug("Coordinates: curr=%s pickup=%s dropoff=%s", curr_coords, pickup_coords, dropoff_coords)
    # 1. Pull the API key 
    API_KEY = os.environ.get("ORS_API_KEY")  or "eyJvcmciOiI1YjNjZTM1OTc4NTExMTAwMDFjZjYyNDgiLCJpZCI6ImNmYjQwYmIwNmRlNzRkMWE5NDlmNWVhY2I5YzQ5ZDc3IiwiaCI6Im11cm11cjY0In0="
    
    if not API_KEY:
        raise ValueError("ORS_API_KEY is missing from the environment variables.")

    BASE_URL = "https://api.openrouteservice.org/v2/directions/driving-hgv/geojson"
    
    headers = {
        'Accept': 'application/json, application/geo+json, application/gpx+xml, img/png; charset=utf-8',
        'Authorization': API_KEY,
        'Content-Type': 'application/json; charset=utf-8'
    }

    body = {
        "coordinates": [curr_coords, pickup_coords, dropoff_coords],
        # Allow ORS to snap each coordinate to the nearest road within 5km.
        # Default is 350m which fails for rural/off-road coordinates.
        "radiuses": [5000, 5000, 5000],
        "instructions": True, 
        "geometry": True       
    }

    session = requests.Session()
    retries = Retry(total=5, backoff_factor=1, status_forcelist=[500, 502, 503, 504])
    session.mount('https://', HTTPAdapter(max_retries=retries))

    try:
        response = session.post(BASE_URL, json=body, headers=headers, timeout=15)
        response.raise_for_status()
        logger.info("ORS route request succeeded: %s", response.status_code)
        logger.debug("ORS response headers: %s", response.headers)
    except requests.exceptions.RequestException as e:
        error_msg = str(e)
        if 'response' in locals() and response is not None:
            try:
                json_err = response.json()
                if 'error' in json_err:
                    err_details = json_err['error']
                    if isinstance(err_details, dict) and 'message' in err_details:
                        error_msg = f"ORS API Error: {err_details['message']}"
                    else:
                        error_msg = f"ORS API Error: {err_details}"
            except Exception:
                error_msg = f"{str(e)} | Response: {response.text}"
                
        raise ConnectionError(f"Failed to fetch route: {error_msg}")
    
    data = response.json()

    meters_to_miles = 0.000621371
    
    # Now these will safely extract the legs!
    leg_1 = data['features'][0]['properties']['segments'][0]
    leg_2 = data['features'][0]['properties']['segments'][1]

    distance_to_pickup = leg_1['distance'] * meters_to_miles
    distance_pickup_to_dropoff = leg_2['distance'] * meters_to_miles
    
    total_offloading_distance = distance_to_pickup + distance_pickup_to_dropoff
    
    full_route_geometry = data['features'][0]['geometry']['coordinates']
    logger.info("Route data computed: onloading=%.2f offloading=%.2f geometry_length=%d", distance_to_pickup, total_offloading_distance, len(full_route_geometry))

    return {
        "onloading_distance": round(distance_to_pickup, 2),
        "offloading_distance": round(total_offloading_distance, 2),
        "route_geometry": full_route_geometry
    }

