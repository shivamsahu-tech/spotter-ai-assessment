import json
import logging
from django.http import JsonResponse
from django.views.decorators.csrf import csrf_exempt
from utils.fetch_route_data import fetch_route_data
from utils.hos_calculator import calculate_hos_logs
from utils.geo_trip import attach_coordinates_to_logs
from utils.logbook_pdf import generate_multi_day_pdf
import os
import uuid
from datetime import datetime
from django.http import FileResponse, HttpResponse

logger = logging.getLogger(__name__)

@csrf_exempt
def calculate_trip(request):
    if request.method == 'POST':
        try:
            data = json.loads(request.body)
            logger.info("Received calculate_trip request")
            logger.debug("calculate_trip payload: %s", data)
            
            # The coordinates expect [lng, lat]
            curr_coords = data.get('curr_coords')
            pickup_coords = data.get('pickup_coords')
            dropoff_coords = data.get('dropoff_coords')
            
            speed_mph = float(data.get('speed_mph', 60.0))
            remaining_fuel_distance = float(data.get('remaining_fuel_distance', 1000.0))
            current_cycle_used = float(data.get('current_cycle_used', 0.0))

            if not all([curr_coords, pickup_coords, dropoff_coords]):
                logger.warning("Missing coordinate inputs in request")
                return JsonResponse({'error': 'Missing coordinate inputs'}, status=400)

            # 1. Fetch geographic route and distances from OpenRouteService
            logger.info("Fetching route data from OpenRouteService...")
            route_data = fetch_route_data(curr_coords, pickup_coords, dropoff_coords)
            logger.debug("Route fetch result: %s", route_data)
            
            onloading_distance = route_data['onloading_distance']
            offloading_distance = route_data['offloading_distance']
            route_geometry = route_data['route_geometry']

            # 2. Calculate raw HOS logs (The mathematical state machine)
            logger.info(f"Calculating HOS logs: onloading_dist={onloading_distance:.2f}, offloading_dist={offloading_distance:.2f}")
            logger.debug("HOS inputs: current_cycle_used=%s speed_mph=%s remaining_fuel_distance=%s", current_cycle_used, speed_mph, remaining_fuel_distance)
            raw_logs = calculate_hos_logs(
                onloading_distance=onloading_distance,
                offloading_distance=offloading_distance,
                current_cycle_used=current_cycle_used,
                speed_mph=speed_mph,
                remaining_fuel_distance=remaining_fuel_distance
            )

            # 3. Pin coordinates to the stops (The Geographic Interpolator)
            logger.info("Pinning coordinates to HOS events...")
            final_logs = attach_coordinates_to_logs(
                trip_logs=raw_logs,
                route_geometry=route_geometry,
                speed_mph=speed_mph
            )

            # 4. Return the massive, unified payload
            logger.info(f"Trip calculation successful. Returning {len(final_logs)} log events.")
            return JsonResponse({
                'trip_logs': final_logs,
                'route_geometry': route_geometry,
                'distances': {
                    'onloading_distance': onloading_distance,
                    'offloading_distance': offloading_distance
                }
            })

        except Exception as e:
            logger.error(f"Error in calculate_trip: {str(e)}", exc_info=True)
            return JsonResponse({'error': str(e)}, status=500)

    return JsonResponse({'error': 'Method not allowed. Use POST.'}, status=405)


@csrf_exempt
def generate_logbook(request):
    if request.method == 'POST':
        try:
            data = json.loads(request.body)
            logger.info("Received request to generate PDF logbook")
            logger.debug("generate_logbook payload: %s", data)
            
            trip_logs = data.get('trip_logs', [])
            speed = float(data.get('speed', 60.0))
            truck = data.get('truck', 'NA')
            carrier = data.get('carrier', 'NA')
            office = data.get('office', 'NA')
            home = data.get('home', 'NA')
            f_coord = data.get('from_coord', [0, 0])
            t_coord = data.get('to_coord', [0, 0])
            logger.debug("generate_logbook trip_logs count=%d", len(trip_logs))
            start_dt_str = data.get('start_time')
            
            if start_dt_str:
                start_dt = datetime.fromisoformat(start_dt_str.replace("Z", "+00:00"))
            else:
                start_dt = datetime.now()

            output_filename = f"/tmp/logbook_{uuid.uuid4().hex}.pdf"
            template_path = os.path.join(os.path.dirname(os.path.dirname(os.path.abspath(__file__))), "perfect_log.png")
            logger.debug("Using template path: %s", template_path)
            
            # Generate PDF
            generate_multi_day_pdf(
                output_name=output_filename,
                template=template_path,
                trip_logs=trip_logs,
                start_dt=start_dt,
                speed=speed,
                truck=truck,
                carrier=carrier,
                office=office,
                home=home,
                f_coord=f_coord,
                t_coord=t_coord
            )
            
            if os.path.exists(output_filename):
                logger.info("Generated PDF file exists: %s", output_filename)
                with open(output_filename, 'rb') as pdf_file:
                    response = HttpResponse(pdf_file.read(), content_type='application/pdf')
                    # 'inline' allows browsers to open it in a tab instead of forcing a download
                    response['Content-Disposition'] = 'inline; filename="logbook.pdf"'
                # os.remove(output_filename) # Clean up file after reading (Disabled as requested)
                return response
            else:
                logger.error("PDF generation returned no file: %s", output_filename)
                return JsonResponse({'error': 'Failed to generate PDF'}, status=500)
                
        except Exception as e:
            logger.error(f"Error generating logbook: {str(e)}", exc_info=True)
            return JsonResponse({'error': str(e)}, status=500)
            
    return JsonResponse({'error': 'Method not allowed. Use POST.'}, status=405)