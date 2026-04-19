import time
import math
import os
import logging
from datetime import datetime, timedelta
from PIL import Image, ImageDraw, ImageFont
from fpdf import FPDF
from geopy.geocoders import Nominatim

logger = logging.getLogger(__name__)

# --- 1. CORE UTILITIES ---
GEOC_CACHE = {}
MAX_GEOC_REQUESTS = 12  # Stay safely under the gunicorn timeout
_request_count = 0

def load_scaleable_font(size):
    font_paths = [
        "/usr/share/fonts/truetype/open-sans/OpenSans-Regular.ttf",
        "/usr/share/fonts/truetype/liberation/LiberationSans-Regular.ttf",
        "/usr/share/fonts/truetype/dejavu/DejaVuSans.ttf",
        "arial.ttf", 
        "C:\\Windows\\Fonts\\arial.ttf",
        "/Library/Fonts/Arial.ttf"
    ]
    for path in font_paths:
        try:
            return ImageFont.truetype(path, size)
        except:
            continue
    return ImageFont.load_default()

def safe_draw_text(draw, pos, text, font, color):
    """Safely draws text, handles missing anchor support in default fonts."""
    try:
        draw.text(pos, str(text), fill=color, font=font, anchor="mm")
    except TypeError:
        draw.text(pos, str(text), fill=color, font=font)

def get_city_state(coordinate_pair):
    """
    Lightweight cached geocoding. 
    Uses 2-decimal precision to maximize cache hits along road segments.
    """
    global _request_count
    if not coordinate_pair or len(coordinate_pair) != 2: 
        return "Unknown"
    
    lon, lat = coordinate_pair
    # Round to 2 decimal places (~1.1km precision) for massive cache hit improvement
    cache_key = (round(lat, 2), round(lon, 2))
    
    if cache_key in GEOC_CACHE:
        return GEOC_CACHE[cache_key]

    if _request_count >= MAX_GEOC_REQUESTS:
        return f"{lat:.1f}, {lon:.1f}"

    geolocator = Nominatim(user_agent="spotter-ai-eld-v2", timeout=5)
    try:
        # Respect Nominatim's 1 req/sec policy
        time.sleep(1.2) 
        _request_count += 1
        location = geolocator.reverse(f"{lat}, {lon}", exactly_one=True)
        
        if location and location.raw.get('address'):
            addr = location.raw['address']
            city = addr.get('city', addr.get('town', addr.get('village', addr.get('suburb', 'Unknown'))))
            state = addr.get('state', '')
            result = f"{city}, {state}" if state else city
            GEOC_CACHE[cache_key] = result
            return result
        
        fallback = f"{lat:.1f}, {lon:.1f}"
        GEOC_CACHE[cache_key] = fallback
        return fallback
    except Exception as e:
        logger.warning("Geocoding error: %s", e)
        return f"{lat:.1f}, {lon:.1f}"

# --- 2. TEMPORAL LOGIC ---
def split_trip_by_days(trip_logs, start_dt):
    days = {}
    current_time = start_dt
    total_entries = len(trip_logs)
    
    for i, entry in enumerate(trip_logs):
        if "duration_hours" not in entry: continue
        rem_dur = entry["duration_hours"]
        is_first_of_trip = (i == 0)
        
        while rem_dur > 0:
            day_key = current_time.strftime("%m/%d/%Y")
            if day_key not in days: days[day_key] = []
            
            next_midnight = (current_time + timedelta(days=1)).replace(hour=0, minute=0, second=0, microsecond=0)
            hours_until_midnight = (next_midnight - current_time).total_seconds() / 3600.0
            
            chunk_duration = min(rem_dur, hours_until_midnight)
            is_last_of_trip = (i == total_entries - 1 and math.isclose(chunk_duration, rem_dur))

            days[day_key].append({
                **entry,
                "duration_hours": chunk_duration,
                "day_start_hour": current_time.hour + current_time.minute/60.0 + current_time.second/3600.0,
                "is_trip_boundary_start": is_first_of_trip and math.isclose(rem_dur, entry["duration_hours"]),
                "is_trip_boundary_end": is_last_of_trip
            })
            
            rem_dur -= chunk_duration
            current_time += timedelta(hours=chunk_duration)
    return days

# --- 3. RENDERING ENGINE ---
def render_log_page(template_path, day_date, logs, constant_speed, truck_num, carrier, office, home, from_loc_str, to_loc_str):
    try:
        img = Image.open(template_path).convert("RGBA")
    except:
        logger.error("Template not found: %s", template_path)
        return None
        
    draw = ImageDraw.Draw(img)
    DARK_BLUE = (0, 0, 139, 255)

    # Position Mappings
    DATE_POS = {"month": (758, 49), "day": (926, 49), "year": (1092, 51)}
    ROUTE_POS = {"from": (662, 167), "to": (1401, 168)}
    MILES_POS = {"driving": (376, 307), "total": (714, 309)}
    TRUCK_POS = (538, 442)
    ADDR_POS = {"carrier": (1387, 297), "office": (1387, 379), "home": (1390, 460)}
    
    GRID_X_MIN, GRID_X_MAX = 254, 1817
    TOTAL_WIDTH = GRID_X_MAX - GRID_X_MIN
    GRID_Y_MAX = 1015
    ROW_Y = {"Off Duty": 778, "Sleeper Berth": 846, "Driving": 913, "On Duty (Not Driving)": 981}
    TOTALS_X = 1925
    TOTALS_Y = {"Off Duty": 775, "Sleeper Berth": 844, "Driving": 913, "On Duty (Not Driving)": 981}

    f_std = load_scaleable_font(50)
    f_addr = load_scaleable_font(38)
    f_rmks = load_scaleable_font(26)

    # Header Data - Pre-geocoded to save time
    safe_draw_text(draw, ROUTE_POS["from"], from_loc_str, f_addr, DARK_BLUE)
    safe_draw_text(draw, ROUTE_POS["to"], to_loc_str, f_addr, DARK_BLUE)
    
    m, d, y = day_date.split("/")
    safe_draw_text(draw, DATE_POS["month"], m, f_std, DARK_BLUE)
    safe_draw_text(draw, DATE_POS["day"], d, f_std, DARK_BLUE)
    safe_draw_text(draw, DATE_POS["year"], y[-2:], f_std, DARK_BLUE)

    safe_draw_text(draw, TRUCK_POS, truck_num, f_std, DARK_BLUE)
    safe_draw_text(draw, ADDR_POS["carrier"], carrier, f_addr, DARK_BLUE)
    safe_draw_text(draw, ADDR_POS["office"], office, f_addr, DARK_BLUE)
    safe_draw_text(draw, ADDR_POS["home"], home, f_addr, DARK_BLUE)

    last_y, totals = None, {k: 0.0 for k in ROW_Y.keys()}
    
    for entry in logs:
        status = entry["status"]
        duration = entry["duration_hours"]
        start_hr = entry["day_start_hour"]
        
        x_start = GRID_X_MIN + (start_hr / 24.0) * TOTAL_WIDTH
        x_end = x_start + (duration / 24.0) * TOTAL_WIDTH
        y_curr = ROW_Y.get(status, 778)
        
        if status in totals: totals[status] += duration

        if last_y is not None and last_y != y_curr:
            draw.line([(x_start, last_y), (x_start, y_curr)], fill=DARK_BLUE, width=6)
        
        draw.line([(x_start, y_curr), (x_end, y_curr)], fill=DARK_BLUE, width=6)

        if entry.get("is_trip_boundary_start"):
            draw.ellipse([x_start-8, y_curr-8, x_start+8, y_curr+8], fill=DARK_BLUE)
        if entry.get("is_trip_boundary_end"):
            draw.ellipse([x_end-8, y_curr-8, x_end+8, y_curr+8], fill=DARK_BLUE)

        # Remarks
        reason = entry.get("reason", "")
        if reason and reason.lower() not in ["rest", "sleep", "34"]:
            loc_name = get_city_state(entry.get("coordinate"))
            B_TOP, B_BOT = GRID_Y_MAX + 15, GRID_Y_MAX + 60
            draw.line([(x_start, B_TOP), (x_start, B_BOT), (x_end, B_BOT), (x_end, B_TOP)], fill=DARK_BLUE, width=4)
            
            w_max = max(int(f_rmks.getlength(loc_name)), int(f_rmks.getlength(reason))) + 40
            txt_img = Image.new('RGBA', (w_max, 70), (0,0,0,0))
            t_draw = ImageDraw.Draw(txt_img)
            t_draw.text((20, 0), loc_name, fill=DARK_BLUE, font=f_rmks)
            t_draw.line([(0, 34), (w_max, 34)], fill=DARK_BLUE, width=3)
            t_draw.text((20, 38), reason, fill=DARK_BLUE, font=f_rmks)
            
            rotated = txt_img.rotate(75, expand=True, resample=Image.BICUBIC)
            rad = math.radians(75)
            nx = rotated.width/2 + (w_max - txt_img.width/2)*math.cos(rad) + (35 - txt_img.height/2)*math.sin(rad)
            ny = rotated.height/2 - (w_max - txt_img.width/2)*math.sin(rad) + (35 - txt_img.height/2)*math.cos(rad)
            img.paste(rotated, (int(x_start - nx), int(B_BOT - ny)), rotated)

        last_y = y_curr

    # Final Totals
    total_driving_hours = totals.get("Driving", 0.0)
    for s, h in totals.items():
        if h > 0: safe_draw_text(draw, (TOTALS_X, TOTALS_Y[s]), f"{h:.1f}", f_std, DARK_BLUE)
    
    miles_str = str(int(round(total_driving_hours * constant_speed)))
    safe_draw_text(draw, MILES_POS["driving"], miles_str, load_scaleable_font(60), DARK_BLUE)
    safe_draw_text(draw, MILES_POS["total"], miles_str, load_scaleable_font(60), DARK_BLUE)

    return img.convert("RGB")

# --- 4. PDF ASSEMBLY ---
def generate_multi_day_pdf(output_name, template, trip_logs, start_dt, speed, truck, carrier, office, home, f_coord, t_coord):
    global _request_count
    _request_count = 0  # Reset for each request
    logger.info("generate_multi_day_pdf start: output=%s", output_name)
    daily_chunks = split_trip_by_days(trip_logs, start_dt)
    
    if not daily_chunks:
        logger.warning("No valid log data found.")
        return None

    # Pre-geocode header locations once to save up to 40 seconds on long trips
    from_loc_str = get_city_state(f_coord)
    to_loc_str = get_city_state(t_coord)

    pdf = FPDF(orientation="landscape", unit="pt", format="A4")
    
    for date_key in sorted(daily_chunks.keys()):
        img_page = render_log_page(
            template, date_key, daily_chunks[date_key], 
            speed, truck or "NA", carrier or "NA", office or "NA", home or "NA", 
            from_loc_str, to_loc_str
        )
        
        if img_page:
            temp_path = f"temp_{date_key.replace('/','-')}_{os.getpid()}.jpg"
            img_page.save(temp_path)
            pdf.add_page()
            pdf.image(temp_path, 0, 0, pdf.w, pdf.h)
            os.remove(temp_path)
            
    pdf.output(output_name)
    logger.info("PDF saved as %s", output_name)
    return output_name