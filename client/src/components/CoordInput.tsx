import { useState, useEffect } from 'react'
import { MapContainer, TileLayer, Marker, useMapEvents, useMap } from 'react-leaflet'
import 'leaflet/dist/leaflet.css'
import L from 'leaflet'
import { MapPin, X, Navigation } from 'lucide-react'

// Fix Leaflet icons in Vite
delete L.Icon.Default.prototype._getIconUrl
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
  iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
  shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
})

const COLOR_CLASSES = {
  teal: {
    label: 'text-teal-700',
    border: 'border-teal-100 bg-teal-50/30 focus-within:border-teal-400 focus-within:bg-white',
    badge: 'bg-teal-100 text-teal-700 border-teal-200',
    btn: 'text-teal-700 bg-teal-100 hover:bg-teal-200',
    icon: 'text-teal-600',
  },
  slate: {
    label: 'text-slate-700',
    border: 'border-transparent bg-slate-50 hover:bg-slate-100/80 focus-within:border-slate-300 focus-within:bg-white',
    badge: 'bg-slate-200 text-slate-700 border-slate-300',
    btn: 'text-slate-700 bg-slate-200 hover:bg-slate-300',
    icon: 'text-slate-500',
  },
}

// Helper component to fly to a location
function MapRecenter({ lat, lng, zoom }) {
  const map = useMap()
  useEffect(() => {
    if (lat !== null && lng !== null) {
      map.flyTo([lat, lng], zoom || map.getZoom(), { duration: 1.5 })
    }
  }, [lat, lng, zoom, map])
  return null
}

function LocationPicker({ initialValue, onSelect, onClose, title }) {
  const [marker, setMarker] = useState(initialValue ? [initialValue[1], initialValue[0]] : null)
  const [centerMapCoords, setCenterMapCoords] = useState(initialValue ? [initialValue[1], initialValue[0]] : [20, 0])
  const [mapZoom, setMapZoom] = useState(initialValue ? 14 : 2)

  useEffect(() => {
    if (!initialValue && 'geolocation' in navigator) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          setCenterMapCoords([position.coords.latitude, position.coords.longitude])
          setMapZoom(13) // Contour level zoom
        },
        (error) => {
          console.log('Location access denied or failed, staying at world view')
        },
        { enableHighAccuracy: true }
      )
    }
  }, [initialValue])

  function ClickHandler() {
    useMapEvents({
      click(e) {
        setMarker([e.latlng.lat, e.latlng.lng])
      },
    })
    return null
  }

  const handleLocateMe = () => {
    if ('geolocation' in navigator) {
      navigator.geolocation.getCurrentPosition((position) => {
        const coords = [position.coords.latitude, position.coords.longitude]
        setMarker(coords)
        setCenterMapCoords(coords)
        setMapZoom(14)
      })
    }
  }

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-4 sm:p-6">
      <div className="bg-white rounded-[2rem] overflow-hidden w-full max-w-4xl shadow-2xl flex flex-col">
        {/* Modal Header */}
        <div className="flex items-center justify-between px-6 py-5 border-b border-slate-100">
          <div className="flex items-center gap-3">
            <div className="bg-slate-100 p-2 rounded-full">
              <MapPin className="w-5 h-5 text-slate-700" />
            </div>
            <span className="text-slate-900 font-bold text-lg">
              {title ? `Pin ${title} on Map` : 'Pin Location on Map'}
            </span>
          </div>
          <button onClick={onClose} className="p-2 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-full transition-colors">
            <X className="w-6 h-6" />
          </button>
        </div>

        {/* Map Area */}
        <div className="h-[60vh] min-h-[400px] relative w-full bg-slate-50">
          <MapContainer center={centerMapCoords} zoom={mapZoom} style={{ width: '100%', height: '100%' }}>
            <TileLayer
              url="https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png"
              attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
            />
            <ClickHandler />
            <MapRecenter lat={centerMapCoords[0]} lng={centerMapCoords[1]} zoom={mapZoom} />
            {marker && <Marker position={marker} />}
          </MapContainer>

          {/* Floating Action Button for Location */}
          <button 
            onClick={handleLocateMe}
            className="absolute bottom-6 right-6 z-[400] bg-white p-3 rounded-2xl shadow-lg border border-slate-100 text-slate-700 hover:text-teal-600 hover:border-teal-200 transition-all"
            title="Locate Me"
          >
            <Navigation className="w-6 h-6" />
          </button>
        </div>

        {/* Modal Footer */}
        <div className="px-6 py-5 flex items-center justify-between gap-4 border-t border-slate-100 bg-slate-50">
          <span className="text-sm font-medium text-slate-500 font-mono bg-white px-3 py-1.5 rounded-lg border border-slate-200">
            {marker
              ? `${marker[0].toFixed(5)}, ${marker[1].toFixed(5)}`
              : 'Click on the map to drop a pin'}
          </span>
          <button
            disabled={!marker}
            onClick={() => {
              onSelect([marker[1], marker[0]]) // Convert back to [Lng, Lat]
              onClose()
            }}
            className="px-8 py-3.5 rounded-2xl text-sm font-bold bg-[#0a1120] hover:bg-slate-800 disabled:opacity-40 disabled:cursor-not-allowed text-white transition-all shadow-md"
          >
            Confirm Pin
          </button>
        </div>
      </div>
    </div>
  )
}

export default function CoordInput({ label, color = 'slate', value, onChange }) {
  const c = COLOR_CLASSES[color] || COLOR_CLASSES.slate
  const [showPicker, setShowPicker] = useState(false)
  const [rawLng, setRawLng] = useState('')
  const [rawLat, setRawLat] = useState('')

  // Keep manual inputs synced if location is passed in (like auto-geolocation)
  useEffect(() => {
    if (value) {
      setRawLng(value[0].toFixed(5))
      setRawLat(value[1].toFixed(5))
    }
  }, [value])

  const applyManual = () => {
    const lng = parseFloat(rawLng)
    const lat = parseFloat(rawLat)
    if (!isNaN(lng) && !isNaN(lat)) {
      onChange([lng, lat])
    }
  }

  return (
    <>
      <div className={`border ${c.border} rounded-[2rem] p-5 transition-all duration-200`}>
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <MapPin className={`w-5 h-5 ${c.icon}`} />
            <span className={`text-sm font-bold ${c.label}`}>{label}</span>
          </div>
          {value && (
            <span className={`text-xs px-3 py-1.5 rounded-xl border font-mono font-medium ${c.badge}`}>
              {value[0].toFixed(4)}, {value[1].toFixed(4)}
            </span>
          )}
        </div>

        <div className="flex flex-col sm:flex-row gap-3">
          {/* Manual entry */}
          <div className="flex-1 flex gap-2">
            <input
              type="number"
              placeholder="Longitude"
              value={rawLng}
              onChange={(e) => setRawLng(e.target.value)}
              onBlur={applyManual}
              step="0.0001"
              className="flex-1 min-w-0 bg-white border border-slate-200 rounded-2xl px-4 py-3 text-sm text-slate-800 font-medium placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-slate-200 transition-all shadow-sm"
            />
            <input
              type="number"
              placeholder="Latitude"
              value={rawLat}
              onChange={(e) => setRawLat(e.target.value)}
              onBlur={applyManual}
              step="0.0001"
              className="flex-1 min-w-0 bg-white border border-slate-200 rounded-2xl px-4 py-3 text-sm text-slate-800 font-medium placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-slate-200 transition-all shadow-sm"
            />
          </div>
          {/* Map picker button */}
          <button
            type="button"
            onClick={() => setShowPicker(true)}
            className={`flex items-center justify-center gap-2 px-5 py-3 rounded-2xl text-sm font-bold whitespace-nowrap transition-colors shadow-sm ${c.btn}`}
          >
            <MapPin className="w-4 h-4" />
            Pick on Map
          </button>
        </div>
      </div>

      {showPicker && (
        <LocationPicker
          initialValue={value}
          title={label}
          onSelect={(coords) => {
            onChange(coords)
          }}
          onClose={() => setShowPicker(false)}
        />
      )}
    </>
  )
}