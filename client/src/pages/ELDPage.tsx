import { useLocation, useNavigate } from 'react-router-dom';
import ELDLogbook from '../components/ELDLogbook';
import { ArrowLeft } from 'lucide-react';

export default function ELDPage() {
  const location = useLocation();
  const navigate = useNavigate();
  const flatLogs = location.state?.flatLogs;
  const startDate = location.state?.startDate;
  const startHour = location.state?.startHour;

  if (!flatLogs) {
    navigate('/');
    return null;
  }

  return (
    <div className="min-h-screen bg-slate-50 p-4">
      <div className="max-w-6xl mx-auto mb-4">
        <button
          onClick={() => navigate(-1)}
          className="flex items-center gap-2 text-slate-500 hover:text-teal-700 transition-colors text-sm font-semibold print:hidden"
        >
          <ArrowLeft className="w-4 h-4" />
          Back to Map
        </button>
      </div>
      <ELDLogbook flatLogs={flatLogs} initialStartDate={startDate} initialStartHour={startHour} />
    </div>
  );
}
