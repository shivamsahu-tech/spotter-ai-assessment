import { BrowserRouter, Routes, Route } from 'react-router-dom'
import { ThemeProvider, createTheme, CssBaseline } from '@mui/material'
import TripForm from './pages/TripForm'
import MapView from './pages/MapView'
import Home from './pages/Home'
import ELDPage from './pages/ELDPage'
import './index.css'

const theme = createTheme({
  palette: {
    primary: {
      main: '#0d9488', // Tailwind teal-600
    },
    secondary: {
      main: '#0f172a', // Tailwind slate-900
    },
  },
  typography: {
    fontFamily: '"Inter", "Roboto", "Helvetica", "Arial", sans-serif',
  },
  shape: {
    borderRadius: 12,
  },
})

export default function App() {
  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/trip" element={<TripForm />} />
          <Route path="/map" element={<MapView />} />
          <Route path="/eld" element={<ELDPage />} />
        </Routes>
      </BrowserRouter>
    </ThemeProvider>
  )
}
