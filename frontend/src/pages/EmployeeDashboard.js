import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import axios from 'axios';
import { toast } from 'sonner';
import { 
  CalendarCheck, 
  CalendarX, 
  Clock, 
  AlertTriangle,
  LogIn,
  LogOut as LogOutIcon,
  CalendarDays,
  User,
  FileText
} from 'lucide-react';
import { Button } from '../components/ui/button';

const API = `${process.env.REACT_APP_BACKEND_URL}/api`;

const SummaryCard = ({ title, value, icon: Icon, color, bgColor, onClick }) => (
  <div 
    onClick={onClick}
    className={`bg-[#fffdf7] rounded-xl border border-black/5 p-5 hover:shadow-lg transition-all duration-300 transform hover:-translate-y-1 ${onClick ? 'cursor-pointer' : ''}`}
    data-testid={`summary-card-${title.toLowerCase().replace(/\s/g, '-')}`}
  >
    <div className="flex items-center justify-between">
      <div>
        <p className="text-2xl font-bold" style={{ fontFamily: 'Outfit, sans-serif', color: '#0f172a' }}>
          {value}
        </p>
        <p className="text-sm text-gray-500 mt-1">{title}</p>
      </div>
      <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${bgColor}`}>
        <Icon className="w-6 h-6" style={{ color }} strokeWidth={1.5} />
      </div>
    </div>
  </div>
);

const QuickLinkCard = ({ title, icon: Icon, onClick, testId }) => (
  <button 
    onClick={onClick}
    className="bg-[#fffdf7] rounded-xl border border-black/5 p-4 hover:shadow-md transition-all duration-200 flex items-center gap-3 w-full text-left"
    data-testid={testId}
  >
    <div className="w-10 h-10 rounded-lg bg-[#0b1f3b]/5 flex items-center justify-center">
      <Icon className="w-5 h-5 text-[#0b1f3b]" strokeWidth={1.5} />
    </div>
    <span className="text-sm font-medium text-gray-700">{title}</span>
  </button>
);

const EmployeeDashboard = () => {
  const { getAuthHeaders } = useAuth();
  const navigate = useNavigate();
  const [dashboardData, setDashboardData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [clockLoading, setClockLoading] = useState(false);
  const [currentTime, setCurrentTime] = useState(new Date());

  const fetchDashboard = useCallback(async () => {
    try {
      setLoading(true);
      const response = await axios.get(`${API}/employee/dashboard`, { 
        headers: getAuthHeaders() 
      });
      setDashboardData(response.data);
    } catch (error) {
      console.error('Dashboard fetch error:', error);
      toast.error('Failed to load dashboard');
    } finally {
      setLoading(false);
    }
  }, [getAuthHeaders]);

  useEffect(() => {
    fetchDashboard();
  }, [fetchDashboard]);

  // Live clock update
  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(new Date());
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  const handleClockIn = async () => {
    try {
      setClockLoading(true);
      await axios.post(`${API}/employee/clock-in`, {}, { 
        headers: getAuthHeaders() 
      });
      toast.success('Clocked in successfully!');
      fetchDashboard();
    } catch (error) {
      toast.error(error.response?.data?.detail || 'Failed to clock in');
    } finally {
      setClockLoading(false);
    }
  };

  const handleClockOut = async () => {
    try {
      setClockLoading(true);
      await axios.post(`${API}/employee/clock-out`, {}, { 
        headers: getAuthHeaders() 
      });
      toast.success('Clocked out successfully!');
      fetchDashboard();
    } catch (error) {
      toast.error(error.response?.data?.detail || 'Failed to clock out');
    } finally {
      setClockLoading(false);
    }
  };

  const navigateToAttendance = (statusFilter = 'All') => {
    navigate(`/employee/attendance?status=${statusFilter}`);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#0b1f3b]"></div>
      </div>
    );
  }

  const formatDate = (date) => {
    return date.toLocaleDateString('en-US', { 
      weekday: 'long',
      year: 'numeric', 
      month: 'long', 
      day: 'numeric' 
    });
  };

  const formatTime = (date) => {
    return date.toLocaleTimeString('en-US', { 
      hour: '2-digit', 
      minute: '2-digit', 
      second: '2-digit',
      hour12: true 
    });
  };

  return (
    <div className="space-y-6 animate-fade-in" data-testid="employee-dashboard-page">
      {/* Greeting Section */}
      <div className="bg-[#fffdf7] rounded-xl border border-black/5 p-6">
        <h1 className="text-2xl font-bold text-gray-900" style={{ fontFamily: 'Outfit, sans-serif' }}>
          Welcome back! {dashboardData?.employee_name || 'Employee'}
        </h1>
        <p className="text-gray-500 mt-1">{formatDate(currentTime)}</p>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <SummaryCard 
          title="Active Days" 
          value={dashboardData?.summary?.active_days || 0} 
          icon={CalendarCheck}
          color="#10b981"
          bgColor="bg-emerald-100"
          onClick={() => navigateToAttendance('Present')}
        />
        <SummaryCard 
          title="Inactive Days" 
          value={dashboardData?.summary?.inactive_days || 0} 
          icon={CalendarX}
          color="#ef4444"
          bgColor="bg-red-100"
          onClick={() => navigateToAttendance('Absent')}
        />
        <SummaryCard 
          title="Late Arrivals" 
          value={dashboardData?.summary?.late_arrivals || 0} 
          icon={Clock}
          color="#f59e0b"
          bgColor="bg-amber-100"
          onClick={() => navigateToAttendance('Late')}
        />
        <SummaryCard 
          title="Early Out" 
          value={dashboardData?.summary?.early_outs || 0} 
          icon={AlertTriangle}
          color="#8b5cf6"
          bgColor="bg-purple-100"
          onClick={() => navigateToAttendance('Early Out')}
        />
      </div>

      {/* Clock Panel */}
      <div className="bg-[#fffdf7] rounded-xl border border-black/5 p-6">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Live Clock */}
          <div className="text-center lg:text-left">
            <p className="text-5xl font-bold text-[#0b1f3b]" style={{ fontFamily: 'Outfit, sans-serif' }}>
              {formatTime(currentTime)}
            </p>
            <p className="text-gray-500 mt-2">{dashboardData?.current_month}</p>
            
            {/* Clock In/Out Buttons */}
            <div className="flex gap-3 mt-6 justify-center lg:justify-start">
              {!dashboardData?.today?.is_logged_in ? (
                <Button 
                  onClick={handleClockIn}
                  disabled={clockLoading}
                  className="bg-emerald-600 hover:bg-emerald-700 text-white px-6"
                  data-testid="clock-in-btn"
                >
                  <LogIn className="w-4 h-4 mr-2" />
                  Clock In
                </Button>
              ) : !dashboardData?.today?.is_logged_out ? (
                <Button 
                  onClick={handleClockOut}
                  disabled={clockLoading}
                  className="bg-red-600 hover:bg-red-700 text-white px-6"
                  data-testid="clock-out-btn"
                >
                  <LogOutIcon className="w-4 h-4 mr-2" />
                  Clock Out
                </Button>
              ) : (
                <div className="px-4 py-2 bg-gray-100 rounded-lg text-gray-600 text-sm">
                  Today's attendance completed
                </div>
              )}
            </div>
          </div>

          {/* Today's Status */}
          <div className="bg-gray-50 rounded-xl p-5 space-y-4">
            <h3 className="font-semibold text-gray-900" style={{ fontFamily: 'Outfit, sans-serif' }}>
              Today's Status
            </h3>
            <div className="grid grid-cols-3 gap-4">
              <div className="text-center">
                <div className="w-10 h-10 rounded-full bg-emerald-100 flex items-center justify-center mx-auto mb-2">
                  <LogIn className="w-5 h-5 text-emerald-600" />
                </div>
                <p className="text-xs text-gray-500">Login</p>
                <p className="font-semibold text-sm">{dashboardData?.today?.login_time || '-'}</p>
              </div>
              <div className="text-center">
                <div className="w-10 h-10 rounded-full bg-red-100 flex items-center justify-center mx-auto mb-2">
                  <LogOutIcon className="w-5 h-5 text-red-600" />
                </div>
                <p className="text-xs text-gray-500">Logout</p>
                <p className="font-semibold text-sm">{dashboardData?.today?.logout_time || '-'}</p>
              </div>
              <div className="text-center">
                <div className="w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center mx-auto mb-2">
                  <Clock className="w-5 h-5 text-blue-600" />
                </div>
                <p className="text-xs text-gray-500">Hours Today</p>
                <p className="font-semibold text-sm">{dashboardData?.today?.hours_today || '-'}</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Quick Links */}
      <div>
        <h3 className="text-lg font-semibold mb-4" style={{ fontFamily: 'Outfit, sans-serif' }}>
          Quick Links
        </h3>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <QuickLinkCard 
            title="Apply Leave" 
            icon={CalendarDays} 
            onClick={() => navigate('/employee/leave?action=apply')}
            testId="quick-link-apply-leave"
          />
          <QuickLinkCard 
            title="Attendance" 
            icon={CalendarCheck} 
            onClick={() => navigate('/employee/attendance')}
            testId="quick-link-attendance"
          />
          <QuickLinkCard 
            title="View Profile" 
            icon={User} 
            onClick={() => navigate('/employee/profile')}
            testId="quick-link-profile"
          />
        </div>
      </div>
    </div>
  );
};

export default EmployeeDashboard;
