# Spotter AI: Technical Architecture & Design

Spotter AI is an advanced ELD (Electronic Logging Device) trip planning platform that automates the generation of FMCSA-compliant logbooks. By bridging geographic interpolation with a custom Hours of Service (HOS) state machine, the system translates raw routing data into pixel-perfect, legally compliant daily logs.

[![GitHub Repo](https://img.shields.io/badge/GitHub-Repository-black?logo=github)](https://github.com/shivamsahu-tech/spotter-ai-assessment)

---

## ✨ Key Features
* **FMCSA-Compliant HOS Engine:** A highly optimized state machine that handles 11-hour driving limits, 14-hour consecutive duty windows, 70-hour cycle limits, and mandatory overlapping rest breaks.
* **Heavy Goods Vehicle (HGV) Routing:** Integrates with OpenRouteService to calculate real-world truck routes, avoiding low bridges and weight-restricted roads.
* **Kinematic Geographic Interpolation:** Uses the Haversine formula to pinpoint exact longitude/latitude coordinates for every stationary event (rest, sleep, load) along a 5,000+ point route array.
* **Dynamic Midnight Splitter:** Automatically slices multi-day trip events at the 24:00 boundary to generate distinct calendar-day log sheets.
* **High-Fidelity SVG Graphing:** Renders crisp, responsive ELD graphs purely through React and scalable vector graphics, bypassing clunky static background images.
* **Interactive UI:** Powered by Next.js, React, and GSAP for staggered animations and a premium fintech-tier user experience.

---

## 🏗️ System Architecture

The project follows a decoupled Client-Server architecture designed for high-performance geographic processing and professional document rendering.

### 🌐 Architecture Overview
* **Frontend**: A high-fidelity React application utilizing Tailwind CSS and GSAP, optimized for geographic visualization and kinematic UI interactions.
* **Backend**: A Django REST API housing the core HOS logic, geographic interpolation utilities, and PDF generation pipeline.

---

## 🧩 Deep Dive: The Algorithm Flow

The system operates on a sophisticated five-stage pipeline that transforms raw geographic coordinates into a fully geocoded, FMCSA-compliant logbook.

### 1. Route Acquisition (`fetch_route_data.py`)
* **Engine**: OpenRouteService (ORS) API.
* **Logic**: The system specifically requests `driving-hgv` profiles. This is critical as it ensures the route geometry respects truck-legal roads.
* **Output**: Retrieves a high-resolution GPS polyline and precise segment distances between the origin, pickup, and drop-off waypoints.

### 2. HOS Discrete-Event Simulation (`hos_calculator.py`)
* **Concept**: Instead of a time-step simulation, it utilizes a bottleneck-aware discrete-event simulation.
* **Process**: At each step, the engine calculates the time to the next limiting boundary (pickup arrival, 30-min break, 11-hour drive limit, 14-hour duty window, or 70-hour restart).
* **Advancement**: The simulation jumps to the earliest of these events, logs the status change, safely handles negative-clock edge cases for loading tasks, updates all internal timers, and iterates until final delivery.

### 3. Kinematic GPS Pinning (`geo_utils.py`)
* **Problem**: HOS logs are temporal (Time $\rightarrow$ Status), but ELD compliance requires spatial data (Status $\rightarrow$ Location).
* **Algorithm**: Kinematic Linear Interpolation.
* **Execution**: The system traverses the route geometry while tracking a virtual odometer. When a status change occurs at time $T$, the algorithm calculates distance $D$, finds the precise geometric segment, and uses the Haversine formula to interpolate the exact $X, Y$ coordinate of the truck's location.

### 4. Temporal Adapter (The "Midnight Splitter")
* **Logic**: FMCSA log sheets must be rigid 24-hour grids. 
* **Execution**: A data adapter parses the flat chronological log array, applying absolute timestamps based on a user-defined shift start. Any event spanning across the midnight boundary is mathematically sliced into two distinct events bridging adjoining calendar days.

### 5. Matrix Rendering & Geocoding (`logbook_pdf.py`)
* **Geocoding Optimizer**: Uses an $O(1)$ spatial cache rounded to 2 decimal places to maximize cache hits on repeated stops during Reverse Geocoding via Nominatim.
* **Vector Synthesis**: Maps the 24-hour timeline onto a pixel-mapped coordinate system ($X_{min}=254, X_{max}=1817$) to draw status lines. 
* **Visual Engineering**: Renders labels with deliberate structural orientation, ensuring visual markers drop down into the remarks area rather than pointing up into the grid for maximum regulatory readability.

---

## 📊 Visual Logic & Architecture

### 🛠️ System Logic
Sequence diagrams and logical flow of the HOS simulation.

![System Logic](https://drive.google.com/uc?export=view&id=1pEgLKufOPr_uVXw0u3OIGlmYi25yscpm)

### 🗺️ Map Visualization & Results
High-fidelity route rendering with interpolated status overlays.

![Map Result](https://drive.google.com/uc?export=view&id=13no_5x5FVMVIRUQKIdCX_4vxu1fYgL73)

### 📝 HOS Logbook Output
Example of the final generated FMCSA ELD logbook.

![HOS Log](https://drive.google.com/uc?export=view&id=1GizhJswZQYIzzrBAkdYCaRWAfzFMJmgt)

---

## 🛠️ Technology Stack

| Layer | Technologies |
| :--- | :--- |
| **Frontend** | Next.js, React 19, TypeScript, GSAP, Leaflet, Tailwind CSS |
| **Backend** | Django 6.0, Python, GeoPy, FPDF, Pillow |
| **External APIs**| OpenRouteService (HGV Profile), Nominatim (Geocoding) |

---

## 📦 Installation & Setup

### Prerequisites
You will need an API key from OpenRouteService. Place it in a `.env` file in the `server` directory:
```env
ORS_API_KEY=your_api_key_here
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
