import React, { useState, useEffect } from 'react'
import { MapPin, Navigation, X } from 'lucide-react'
import { MapContainer, TileLayer, Marker, useMapEvents, useMap } from 'react-leaflet'
import 'leaflet/dist/leaflet.css'
import L from 'leaflet'

// Fix Leaflet icon issue
import markerIcon from 'leaflet/dist/images/marker-icon.png'
import markerShadow from 'leaflet/dist/images/marker-shadow.png'

const DefaultIcon = L.icon({
  iconUrl: markerIcon,
  shadowUrl: markerShadow,
  iconSize: [25, 41],
  iconAnchor: [12, 41],
})
L.Marker.prototype.options.icon = DefaultIcon

const COLOR_CLASSES = {
  teal: {
    label: 'text-teal-900',
    border: 'border-teal-200/50 bg-teal-50/40 focus-within:border-teal-400 focus-within:bg-white/80',
    badge: 'bg-teal-500 text-white border-teal-600',
    btn: 'text-white bg-teal-500 hover:bg-teal-600 shadow-sm',
    icon: 'text-teal-600',
  },
  slate: {
    label: 'text-slate-900',
    border: 'border-slate-200/50 bg-slate-50/40 hover:bg-slate-100/60 focus-within:border-teal-400 focus-within:bg-white/80',
    badge: 'bg-slate-800 text-white border-slate-900',
    btn: 'text-slate-700 bg-white border border-slate-200 hover:bg-slate-50 shadow-sm',
    icon: 'text-slate-500',
  },
}

// Helper to fix the "Grey Tiles" issue by forcing a resize after mount
function MapResizer() {
  const map = useMap()
  useEffect(() => {
    setTimeout(() => {
      map.invalidateSize()
    }, 200)
  }, [map])
  return null
}

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
  const [centerMapCoords, setCenterMapCoords] = useState(initialValue ? [initialValue[1], initialValue[0]] : [39.82, -98.57])
  const [mapZoom, setMapZoom] = useState(initialValue ? 14 : 4)

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
    <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-4 sm:p-6">
      <div className="bg-white rounded-[2rem] overflow-hidden w-full max-w-4xl shadow-2xl flex flex-col relative">
        <div className="flex items-center justify-between px-6 py-5 border-b border-slate-100 bg-white">
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

        <div className="h-[60vh] min-h-[400px] relative w-full bg-slate-50">
          <MapContainer center={centerMapCoords} zoom={mapZoom} style={{ width: '100%', height: '100%' }}>
            <TileLayer
              url="https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png"
              attribution='&copy; OpenStreetMap'
            />
            <MapResizer />
            <ClickHandler />
            <MapRecenter lat={centerMapCoords[0]} lng={centerMapCoords[1]} zoom={mapZoom} />
            {marker && <Marker position={marker} />}
          </MapContainer>

          <button 
            type="button"
            onClick={handleLocateMe}
            className="absolute bottom-6 right-6 z-[1001] bg-white p-3 rounded-2xl shadow-lg border border-slate-100 text-slate-700 hover:text-teal-600 transition-all"
          >
            <Navigation className="w-6 h-6" />
          </button>
        </div>

        <div className="px-6 py-5 flex items-center justify-between gap-4 border-t border-slate-100 bg-white">
          <span className="text-sm font-medium text-slate-500 font-mono bg-slate-50 px-3 py-1.5 rounded-lg border border-slate-200">
            {marker ? `${marker[0].toFixed(5)}, ${marker[1].toFixed(5)}` : 'Click on the map to drop a pin'}
          </span>
          <button
            disabled={!marker}
            onClick={() => {
              onSelect([marker[1], marker[0]])
              onClose()
            }}
            className="px-8 py-3.5 rounded-2xl text-sm font-bold bg-[#0a1120] hover:bg-slate-800 disabled:opacity-40 text-white transition-all shadow-md"
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

  useEffect(() => {
    if (value) {
      setRawLng(value[0].toFixed(5))
      setRawLat(value[1].toFixed(5))
    }
  }, [value])

  const applyManual = () => {
    const lng = parseFloat(rawLng); const lat = parseFloat(rawLat)
    if (!isNaN(lng) && !isNaN(lat)) onChange([lng, lat])
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
          <div className="flex-1 flex gap-2">
            <input type="number" placeholder="Longitude" value={rawLng} onChange={(e) => setRawLng(e.target.value)} onBlur={applyManual} step="0.0001" className="flex-1 min-w-0 bg-white border border-slate-200 rounded-2xl px-4 py-3 text-sm" />
            <input type="number" placeholder="Latitude" value={rawLat} onChange={(e) => setRawLat(e.target.value)} onBlur={applyManual} step="0.0001" className="flex-1 min-w-0 bg-white border border-slate-200 rounded-2xl px-4 py-3 text-sm" />
          </div>
          <button type="button" onClick={() => setShowPicker(true)} className={`flex items-center justify-center gap-2 px-5 py-3 rounded-2xl text-sm font-bold transition-colors shadow-sm ${c.btn}`}>
            <MapPin className="w-4 h-4" /> Pick on Map
          </button>
        </div>
      </div>

      {showPicker && <LocationPicker initialValue={value} title={label} onSelect={onChange} onClose={() => setShowPicker(false)} />}
    </>
  )
}