import { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import axios from 'axios';
import { toast } from 'sonner';
import { 
  Users, 
  CalendarDays, 
  Clock, 
  UserCheck,
  LogIn,
  LogOut as LogOutIcon,
  AlertCircle,
  Timer,
  Calendar,
  Filter,
  RotateCcw,
  Eye
} from 'lucide-react';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../components/ui/select';
import { Badge } from '../components/ui/badge';

const API = `${process.env.REACT_APP_BACKEND_URL}/api`;

const StatCard = ({ title, value, icon: Icon, color, bgColor }) => (
  <div className="bg-[#fffdf7] rounded-xl border border-black/5 p-6 hover:shadow-lg transition-all duration-200 card-hover">
    <div className="flex items-start justify-between">
      <div>
        <p className="text-sm text-gray-500 font-medium">{title}</p>
        <p className="text-3xl font-bold mt-2" style={{ fontFamily: 'Outfit, sans-serif', color: '#0f172a' }}>
          {value}
        </p>
      </div>
      <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${bgColor}`}>
        <Icon className="w-6 h-6" style={{ color }} strokeWidth={1.5} />
      </div>
    </div>
  </div>
);

const AttendanceStatCard = ({ title, value, icon: Icon, borderColor }) => (
  <div className={`bg-[#fffdf7] rounded-xl border-l-4 p-4 text-center`} style={{ borderLeftColor: borderColor }}>
    <p className="text-3xl font-bold" style={{ fontFamily: 'Outfit, sans-serif' }}>{value}</p>
    <p className="text-xs text-gray-500 mt-1">{title}</p>
  </div>
);

const Dashboard = () => {
  const { getAuthHeaders } = useAuth();
  const [stats, setStats] = useState(null);
  const [leaveList, setLeaveList] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filters, setFilters] = useState({
    fromDate: '',
    toDate: '',
    leaveType: 'All'
  });

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      setLoading(true);
      const [statsRes, leaveRes] = await Promise.all([
        axios.get(`${API}/dashboard/stats`, { headers: getAuthHeaders() }),
        axios.get(`${API}/dashboard/leave-list`, { headers: getAuthHeaders() })
      ]);
      setStats(statsRes.data);
      setLeaveList(leaveRes.data);
    } catch (error) {
      console.error('Dashboard fetch error:', error);
      toast.error('Failed to load dashboard data');
    } finally {
      setLoading(false);
    }
  };

  const handleFilter = () => {
    toast.info('Filtering applied');
  };

  const handleReset = () => {
    setFilters({ fromDate: '', toDate: '', leaveType: 'All' });
    toast.info('Filters reset');
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#0b1f3b]"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-fade-in" data-testid="dashboard-page">
      {/* Page Header */}
      <div>
        <h1 className="text-2xl font-bold text-gray-900" style={{ fontFamily: 'Outfit, sans-serif' }}>
          Dashboard
        </h1>
      </div>

      {/* Main Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard 
          title="Total Research Unit" 
          value={stats?.total_research_unit || 29} 
          icon={Users}
          color="#004EEB"
          bgColor="bg-blue-100"
        />
        <StatCard 
          title="Upcoming Leaves" 
          value={stats?.upcoming_leaves || 1} 
          icon={CalendarDays}
          color="#10b981"
          bgColor="bg-emerald-100"
        />
        <StatCard 
          title="Pending Approvals" 
          value={stats?.pending_approvals || 0} 
          icon={Clock}
          color="#8b5cf6"
          bgColor="bg-purple-100"
        />
        <StatCard 
          title="Total Support Staff" 
          value={stats?.total_support_staff || 4} 
          icon={UserCheck}
          color="#f97316"
          bgColor="bg-orange-100"
        />
      </div>

      {/* Filter Section */}
      <div className="bg-[#fffdf7] rounded-xl border border-black/5 p-6">
        <div className="flex flex-wrap items-center gap-4">
          <div className="flex items-center gap-2">
            <span className="text-sm text-gray-600">From:</span>
            <Input
              type="date"
              value={filters.fromDate}
              onChange={(e) => setFilters({ ...filters, fromDate: e.target.value })}
              className="w-40 bg-white"
              data-testid="filter-from-date"
            />
          </div>
          <div className="flex items-center gap-2">
            <span className="text-sm text-gray-600">To:</span>
            <Input
              type="date"
              value={filters.toDate}
              onChange={(e) => setFilters({ ...filters, toDate: e.target.value })}
              className="w-40 bg-white"
              data-testid="filter-to-date"
            />
          </div>
          <div className="flex items-center gap-2">
            <span className="text-sm text-gray-600">Leave Type:</span>
            <Select value={filters.leaveType} onValueChange={(v) => setFilters({ ...filters, leaveType: v })}>
              <SelectTrigger className="w-32 bg-white" data-testid="filter-leave-type">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="All">All</SelectItem>
                <SelectItem value="Sick">Sick</SelectItem>
                <SelectItem value="Casual">Casual</SelectItem>
                <SelectItem value="Annual">Annual</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <Button 
            onClick={handleFilter}
            className="bg-[#0b1f3b] hover:bg-[#162d4d] text-white"
            data-testid="filter-btn"
          >
            <Filter className="w-4 h-4 mr-2" />
            Filter
          </Button>
          <Button 
            variant="secondary"
            onClick={handleReset}
            className="bg-gray-500 hover:bg-gray-600 text-white"
            data-testid="reset-btn"
          >
            <RotateCcw className="w-4 h-4 mr-2" />
            Reset
          </Button>
        </div>
      </div>

      {/* Attendance Stats Row */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-4">
        <AttendanceStatCard 
          title="Leaves/No Login" 
          value={stats?.attendance?.not_logged || 3} 
          icon={AlertCircle}
          borderColor="#f59e0b"
        />
        <AttendanceStatCard 
          title="Login" 
          value={stats?.attendance?.logged_in || 34} 
          icon={LogIn}
          borderColor="#10b981"
        />
        <AttendanceStatCard 
          title="Early Out" 
          value={stats?.attendance?.early_out || 0} 
          icon={Timer}
          borderColor="#ef4444"
        />
        <AttendanceStatCard 
          title="Logout" 
          value={stats?.attendance?.logout || 0} 
          icon={LogOutIcon}
          borderColor="#6366f1"
        />
        <AttendanceStatCard 
          title="Late Login" 
          value={stats?.attendance?.late_login || 0} 
          icon={Clock}
          borderColor="#8b5cf6"
        />
      </div>

      {/* Leave List */}
      <div className="bg-[#fffdf7] rounded-xl border border-black/5 overflow-hidden">
        <div className="p-6 border-b border-black/5">
          <h2 className="text-lg font-semibold" style={{ fontFamily: 'Outfit, sans-serif' }}>
            Leave List
          </h2>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50/50">
              <tr>
                <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider"></th>
                <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Emp Name</th>
                <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Team</th>
                <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Leave Type</th>
                <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Date</th>
                <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {leaveList.length === 0 ? (
                <tr>
                  <td colSpan="6" className="px-6 py-12 text-center text-gray-500">
                    No records found
                  </td>
                </tr>
              ) : (
                leaveList.map((item, index) => (
                  <tr key={index} className="hover:bg-gray-50/50 transition-colors">
                    <td className="px-6 py-4">
                      <button className="p-1 hover:bg-gray-100 rounded" data-testid={`view-btn-${index}`}>
                        <Eye className="w-4 h-4 text-gray-400" />
                      </button>
                    </td>
                    <td className="px-6 py-4 text-sm font-medium text-gray-900">{item.emp_name}</td>
                    <td className="px-6 py-4 text-sm text-gray-600">{item.team}</td>
                    <td className="px-6 py-4 text-sm text-gray-600">{item.leave_type}</td>
                    <td className="px-6 py-4 text-sm text-gray-600">{item.date}</td>
                    <td className="px-6 py-4">
                      <Badge 
                        className={`
                          ${item.status === 'Not Login' ? 'bg-amber-100 text-amber-700' : ''}
                          ${item.status === 'approved' ? 'bg-emerald-100 text-emerald-700' : ''}
                          ${item.status === 'pending' ? 'bg-blue-100 text-blue-700' : ''}
                        `}
                      >
                        {item.status}
                      </Badge>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
