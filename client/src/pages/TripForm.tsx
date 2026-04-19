import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import CoordInput from '../components/CoordInput'
import { Truck, Zap, Map as MapIcon, Settings2 } from 'lucide-react'
import { Button, TextField, CircularProgress } from '@mui/material'

const DEFAULT_FORM = {
  speed_mph: 60,
  remaining_fuel_distance: 1000,
  current_cycle_used: 0,
}

export default function TripForm() {
  const navigate = useNavigate()
  const [currCoords, setCurrCoords] = useState(null)
  const [pickupCoords, setPickupCoords] = useState(null)
  const [dropoffCoords, setDropoffCoords] = useState(null)
  const [params, setParams] = useState(DEFAULT_FORM)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    if ('geolocation' in navigator) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          setCurrCoords([position.coords.longitude, position.coords.latitude])
        },
        (err) => console.log('Location access denied or failed:', err),
        { enableHighAccuracy: true }
      )
    }
  }, [])

  const handleParamChange = (e) => {
    setParams((p) => ({ ...p, [e.target.name]: parseFloat(e.target.value) }))
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')

    if (!currCoords || !pickupCoords || !dropoffCoords) {
      setError('Please set all three locations before submitting.')
      return
    }

    setLoading(true)
    try {
      const res = await fetch('/api/calculate-trip/', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          curr_coords: currCoords,
          pickup_coords: pickupCoords,
          dropoff_coords: dropoffCoords,
          ...params,
        }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'Server error')
      navigate('/map', { state: { result: data } })
    } catch (err) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#f4f7f9] to-[#edf2f7] py-12 px-4 sm:px-6 font-sans">
      <div className="max-w-4xl mx-auto">
        
        {/* Header */}
        <div className="text-center mb-12">
          <div className="inline-flex items-center gap-3 mb-4">
            <div className="p-3.5 rounded-2xl bg-teal-500/10 border border-teal-500/20">
              <Truck className="w-8 h-8 text-teal-600" />
            </div>
            <h1 className="text-4xl sm:text-5xl font-extrabold tracking-tight text-[#0a1120]">
              Spotter AI
            </h1>
          </div>
          <p className="text-slate-500 text-lg font-medium">ELD Trip Planner & Hours of Service Calculator</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-8">
          
          {/* Card 1: Locations */}
          <div className="bg-white rounded-[2rem] p-6 sm:p-8 shadow-xl shadow-slate-200/40 border border-slate-100">
            <div className="flex items-center gap-3 mb-6 pb-4 border-b border-slate-100">
              <div className="bg-slate-100 p-2 rounded-xl">
                <MapIcon className="w-5 h-5 text-slate-700" />
              </div>
              <h2 className="text-xl font-bold text-slate-800">Route Waypoints</h2>
            </div>
            
            <div className="space-y-5">
              <CoordInput
                label="Current Location"
                color="teal"
                value={currCoords}
                onChange={setCurrCoords}
              />
              <CoordInput
                label="Pickup Location"
                color="slate"
                value={pickupCoords}
                onChange={setPickupCoords}
              />
              <CoordInput
                label="Dropoff Location"
                color="slate"
                value={dropoffCoords}
                onChange={setDropoffCoords}
              />
            </div>
          </div>

          {/* Card 2: Parameters */}
          <div className="bg-white rounded-[2rem] p-6 sm:p-8 shadow-xl shadow-slate-200/40 border border-slate-100">
            <div className="flex items-center gap-3 mb-6 pb-4 border-b border-slate-100">
              <div className="bg-slate-100 p-2 rounded-xl">
                <Settings2 className="w-5 h-5 text-slate-700" />
              </div>
              <h2 className="text-xl font-bold text-slate-800">Trip Settings</h2>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
              <ParamField
                label="Avg Speed (mph)"
                name="speed_mph"
                value={params.speed_mph}
                onChange={handleParamChange}
                min={20}
                max={80}
              />
              <ParamField
                label="Remaining Fuel for Distance (mi)"
                name="remaining_fuel_distance"
                value={params.remaining_fuel_distance}
                onChange={handleParamChange}
                min={0}
                max={2000}
              />
              <ParamField
                label="Current Cycle Used (hrs)"
                name="current_cycle_used"
                value={params.current_cycle_used}
                onChange={handleParamChange}
                min={0}
                max={70}
              />
            </div>
          </div>

          {error && (
            <div className="bg-red-50 border border-red-200 rounded-2xl p-4 text-red-600 text-sm font-semibold flex items-center justify-center">
              {error}
            </div>
          )}

          {/* Submit Button */}
          <Button
            type="submit"
            variant="contained"
            color="primary"
            disabled={loading}
            fullWidth
            sx={{ 
              height: 64, 
              borderRadius: '2rem', 
              fontSize: '1.125rem', 
              fontWeight: 700,
              textTransform: 'none',
              boxShadow: '0 20px 25px -5px rgb(0 0 0 / 0.1), 0 8px 10px -6px rgb(0 0 0 / 0.1)',
              '&:hover': {
                bgcolor: 'secondary.main',
                transform: 'translateY(-1px)'
              }
            }}
          >
            {loading ? (
              <div className="flex items-center gap-3">
                <CircularProgress size={20} color="inherit" />
                Calculating Route...
              </div>
            ) : (
              <div className="flex items-center gap-2">
                Calculate Trip
                <div className="bg-teal-400/20 rounded-full p-1 text-white ml-2">
                  <Zap className="w-5 h-5 fill-current" />
                </div>
              </div>
            )}
          </Button>
        </form>
      </div>
    </div>
  )
}

function ParamField({ label, name, value, onChange, min, max }: any) {
  return (
    <TextField
      label={label}
      name={name}
      type="number"
      value={value}
      onChange={onChange}
      fullWidth
      variant="outlined"
      slotProps={{ htmlInput: { min, max } }}
      sx={{
        '& .MuiOutlinedInput-root': {
          borderRadius: '12px',
          backgroundColor: '#f8fafc',
          fontWeight: 500,
        }
      }}
    />
  )
}