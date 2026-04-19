# Spotter AI: Technical Architecture & Design

Spotter AI is an advanced ELD (Electronic Logging Device) trip planning platform that automates the generation of FMCSA-compliant logbooks using geographic interpolation and a custom HOS (Hours of Service) state machine.

[![GitHub Repo](https://img.shields.io/badge/GitHub-Repository-black?logo=github)](https://github.com/shivamsahu-tech/spotter-ai-assessment)

---

## 🏗️ System Architecture

The project follows a decoupled Client-Server architecture designed for high-performance geographic processing and professional document rendering.

### 🌐 Architecture Overview
- **Frontend**: A high-fidelity React 19 application optimized for geographic visualization and kinematic UI interactions.
- **Backend**: A Django 6.0 REST API housing the core HOS logic and PDF generation pipeline.

---

## 🧩 Deep Dive: The Algorithm Flow

The system operates on a four-stage pipeline that transforms raw geographic coordinates into a fully geocoded, FMCSA-compliant PDF logbook.

### 1. Stage 1: Route Acquisition (`fetch_route_data.py`)
- **Engine**: OpenRouteService (ORS) API.
- **Logic**: The system specifically requests `driving-hgv` (Heavy Goods Vehicle) profiles. This is critical as it ensures the route geometry respects truck-legal roads and height/weight restrictions.
- **Output**: Retrieves a high-resolution GPS polyline and precise segment distances between the three key waypoints (Origin, Pickup, Drop-off).

### 2. Stage 2: HOS Discrete-Event Simulation (`hos_calculator.py`)
- **Concept**: Instead of a time-step simulation (which is computationally expensive), it uses a **bottleneck-aware discrete-event simulation**.
- **Process**: At each step, the engine calculates the *time to the next limiting boundary*:
  - How long until I reach the pickup?
  - How long until I must take a mandatory 30-min break (8-hour rule)?
  - How long until I run out of driving time (11-hour rule)?
  - How long until I run out of daily duty time (14-hour rule)?
- **Advancement**: The simulation "jumps" to the earliest of these events, logs the status change, updates all internal timers, and iterates until the final delivery.

### 3. Stage 3: Kinematic GPS Pinning (`geo_trip.py`)
- **Problem**: HOS logs are temporal (Time -> Status), but ELD compliance requires spatial data (Status -> Location).
- **Algorithm**: Kinematic Linear Interpolation.
- **Execution**: The system traverses the route geometry while tracking a "virtual odometer." When a status change occurs at time $T$, the algorithm:
  1. Calculates distance $D$ covered at $T$ using the constant `speed_mph`.
  2. Finds the segments in the route geometry where distance $D$ falls.
  3. Uses the **Haversine formula** to calculate precise segment lengths and interpolates the exact Latitude/Longitude coordinate of the event.

### 4. Stage 4: Matrix Rendering & Geocoding (`logbook_pdf.py`)
- **Geocoding Optimizer**: For each stationary event pinned in Stage 3, the system performs a **Reverse Geocoding** call via Nominatim. To stay within rate limits, it uses an $O(1)$ spatial cache rounded to 2 decimal places (~1.1km precision), maximizing cache hits on repeated stops.
- **Temporal Splitting**: Long events are split at the 00:00:00 boundary to generate multi-day reports.
- **Vector Synthesis**: Maps the 24-hour timeline onto a pixel-mapped coordinate system ($X_{min}=254, X_{max}=1817$) to draw status lines and rotated text remarks onto the final PDF template.

---

## 📊 Visual Logic & Architecture

### 🛠️ System Logic (Eraser.io)
Deep dive into the sequence diagrams and logical flow of the HOS simulation.
- **[View Logic Diagram (Google Drive)](https://drive.google.com/file/d/1pEgLKufOPr_uVXw0u3OIGlmYi25yscpm/view?usp=drive_link)**

### 🗺️ Map Visualization & Results
High-fidelity route rendering with status overlays.
- **[View Map Result (Google Drive)](https://drive.google.com/file/d/13no_5x5FVMVIRUQKIdCX_4vxu1fYgL73/view?usp=drive_link)**

### 📝 HOS Logbook Output
Example of the final generated PDF logbook.
- **[View HOS Log Image (Google Drive)](https://drive.google.com/file/d/1GizhJswZQYIzzrBAkdYCaRWAfzFMJmgt/view?usp=drive_link)**


---

## 🛠️ Technology Stack

| Layer | Technologies |
| :--- | :--- |
| **Frontend** | React 19, TypeScript, GSAP, Leaflet, Tailwind CSS, Material UI |
| **Backend** | Django 6.0, GeoPy, FPDF, Pillow, OpenRouteService API |
| **Infrastructure** | SQLite, Gunicorn, Vite |

---

## 📦 Installation & Setup

### 1. Backend Setup
```bash
cd server
python -m venv venv
source venv/bin/activate
pip install -r requirements.txt
python manage.py migrate
python manage.py runserver
```

### 2. Frontend Setup
```bash
cd client
npm install
npm run dev
```

---

## 🔗 Project Links
- **Repository**: [shivamsahu-tech/spotter-ai-assessment](https://github.com/shivamsahu-tech/spotter-ai-assessment)

---
*Created for the Spotter AI Technical Assessment.*
