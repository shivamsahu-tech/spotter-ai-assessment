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

## 🧠 Core Engineering Components

### 1. The HOS Engine (`hos_calculator.py`)
At the heart of the system is a deterministic state machine that simulates a driver's journey. 
- **State Tracking**: Monitors `duty_left`, `driving_left`, `cycle_left`, and `time_since_break` in real-time.
- **Event-Driven Simulation**: Instead of fixed-step increments, the engine calculates the "time to next limiting event" (e.g., fuel need, mandatory rest, or destination arrival), ensuring O(n) efficiency.
- **Rules Integrated**:
  - 11-Hour Driving Limit
  - 14-Hour On-Duty Limit
  - 30-Minute Mandatory Rest after 8 hours
  - 10-Hour Sleep Reset
  - 34-Hour Weekly Cycle Restart

### 2. Geographic Interpolation (`geo_trip.py`)
The system bridges the gap between chronological logs and geographic paths.
- **GPS Mapping**: Takes the high-resolution route geometry (Polyline) from OpenRouteService.
- **Kinematic Projection**: Projects the time-based status transitions onto exact GPS coordinates by interpolating distance-over-time along the path segments.

### 3. PDF Rendering Pipeline (`logbook_pdf.py`)
Generates production-grade ELD logbooks.
- **Grid Calibration**: Uses absolute coordinate mapping to draw HOS status lines onto a standard logbook grid template.
- **Dynamic Headers**: Automatically populates carrier info, vehicle IDs, and reverse-geocoded location strings for every status change.

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
