import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
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
  Filter,
  RotateCcw,
  Eye,
  TrendingUp,
  ArrowUpRight,
  ArrowDownRight,
  Activity
} from 'lucide-react';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../components/ui/select';
import { Badge } from '../components/ui/badge';
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from '../components/ui/sheet';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, BarChart, Bar } from 'recharts';

const API = `${process.env.REACT_APP_BACKEND_URL}/api`;

// Premium Stat Card Component
const StatCard = ({ title, value, icon: Icon, trend, trendValue, color, onClick, testId, delay = 0 }) => (
  <div 
    onClick={onClick}
    data-testid={testId}
    className={`stat-card group cursor-pointer animate-slide-up`}
    style={{ animationDelay: `${delay}s` }}
  >
    <div className="flex items-start justify-between">
      <div className="space-y-3">
        <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">{title}</p>
        <p className="text-3xl lg:text-4xl font-bold text-slate-900 number-display">
          {value}
        </p>
        {trend && (
          <div className={`flex items-center gap-1 text-xs font-medium ${trend === 'up' ? 'text-emerald-600' : 'text-red-500'}`}>
            {trend === 'up' ? <ArrowUpRight className="w-3 h-3" /> : <ArrowDownRight className="w-3 h-3" />}
            <span>{trendValue}</span>
          </div>
        )}
      </div>
      <div className={`w-12 h-12 rounded-2xl flex items-center justify-center transition-transform group-hover:scale-110 ${color}`}>
        <Icon className="w-6 h-6 text-white" strokeWidth={1.5} />
      </div>
    </div>
  </div>
);

// Attendance Status Card
const AttendanceStatusCard = ({ title, value, color, isActive, onClick, icon: Icon }) => (
  <button
    onClick={onClick}
    className={`
      w-full p-4 rounded-xl border-2 transition-all duration-200 text-left
      ${isActive 
        ? `border-[${color}] bg-white shadow-lg` 
        : 'border-transparent bg-white/50 hover:bg-white hover:shadow-md'
      }
    `}
    style={isActive ? { borderColor: color, boxShadow: `0 4px 20px ${color}20` } : {}}
  >
    <div className="flex items-center gap-3">
      <div 
        className="w-10 h-10 rounded-xl flex items-center justify-center"
        style={{ backgroundColor: `${color}15` }}
      >
        <Icon className="w-5 h-5" style={{ color }} strokeWidth={1.5} />
      </div>
      <div>
        <p className="text-2xl font-bold text-slate-900 number-display">{value}</p>
        <p className="text-xs text-slate-500 font-medium">{title}</p>
      </div>
    </div>
  </button>
);

const Dashboard = () => {
  const { getAuthHeaders } = useAuth();
  const navigate = useNavigate();
  const [stats, setStats] = useState(null);
  const [leaveList, setLeaveList] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeAttendanceTab, setActiveAttendanceTab] = useState('not_logged');
  const [attendanceDetails, setAttendanceDetails] = useState([]);
  const [loadingDetails, setLoadingDetails] = useState(false);
  const [showDetailSheet, setShowDetailSheet] = useState(false);
  const [selectedEmployee, setSelectedEmployee] = useState(null);
  const [filters, setFilters] = useState({
    fromDate: '',
    toDate: '',
    leaveType: 'All'
  });

  // Mock chart data - in real app this would come from API
  const [chartData] = useState([
    { name: 'Mon', present: 45, absent: 5, late: 3 },
    { name: 'Tue', present: 48, absent: 2, late: 2 },
    { name: 'Wed', present: 44, absent: 6, late: 4 },
    { name: 'Thu', present: 47, absent: 3, late: 2 },
    { name: 'Fri', present: 42, absent: 8, late: 5 },
    { name: 'Sat', present: 20, absent: 30, late: 0 },
    { name: 'Sun', present: 0, absent: 50, late: 0 },
  ]);

  const formatDateForAPI = (dateStr) => {
    if (!dateStr) return null;
    const date = new Date(dateStr);
    const day = String(date.getDate()).padStart(2, '0');
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const year = date.getFullYear();
    return `${day}-${month}-${year}`;
  };

  const fetchData = useCallback(async () => {
    try {
      setLoading(true);
      const statsParams = {};
      if (filters.fromDate) statsParams.from_date = formatDateForAPI(filters.fromDate);
      if (filters.toDate) statsParams.to_date = formatDateForAPI(filters.toDate);
      
      const [statsRes, leaveRes] = await Promise.all([
        axios.get(`${API}/dashboard/stats`, { headers: getAuthHeaders(), params: statsParams }),
        axios.get(`${API}/dashboard/leave-list`, { headers: getAuthHeaders(), params: statsParams })
      ]);
      setStats(statsRes.data);
      setLeaveList(leaveRes.data);
    } catch (error) {
      console.error('Dashboard fetch error:', error);
      toast.error('Failed to load dashboard data');
    } finally {
      setLoading(false);
    }
  }, [getAuthHeaders, filters.fromDate, filters.toDate]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const fetchAttendanceByStatus = async (statusType) => {
    setActiveAttendanceTab(statusType);
    setLoadingDetails(true);
    
    try {
      const today = new Date().toLocaleDateString('en-GB').split('/').join('-');
      const fromDate = filters.fromDate ? formatDateForAPI(filters.fromDate) : today;
      const toDate = filters.toDate ? formatDateForAPI(filters.toDate) : today;
      
      let statusFilter = '';
      switch (statusType) {
        case 'logged_in': statusFilter = 'Login'; break;
        case 'logout': statusFilter = 'Completed'; break;
        case 'early_out': statusFilter = 'Early Out'; break;
        case 'late_login': statusFilter = 'Late Login'; break;
        default:
          setAttendanceDetails(leaveList);
          setLoadingDetails(false);
          return;
      }
      
      const response = await axios.get(`${API}/attendance`, {
        headers: getAuthHeaders(),
        params: { status: statusFilter, from_date: fromDate, to_date: toDate }
      });
      setAttendanceDetails(response.data);
    } catch (error) {
      console.error('Failed to fetch attendance details:', error);
      toast.error('Failed to load attendance details');
    } finally {
      setLoadingDetails(false);
    }
  };

  const handleFilter = () => {
    fetchData();
    if (activeAttendanceTab !== 'not_logged') {
      fetchAttendanceByStatus(activeAttendanceTab);
    }
    toast.success('Filters applied');
  };

  const handleReset = () => {
    setFilters({ fromDate: '', toDate: '', leaveType: 'All' });
    toast.info('Filters reset');
  };

  const handleStatCardClick = (cardType) => {
    switch (cardType) {
      case 'research_unit': navigate('/team', { state: { department: 'Research Unit' } }); break;
      case 'support_staff': navigate('/team', { state: { department: 'Support Staff' } }); break;
      case 'upcoming_leaves': navigate('/leave', { state: { tab: 'approved' } }); break;
      case 'pending_approvals': navigate('/leave', { state: { tab: 'pending' } }); break;
      default: break;
    }
  };

  const handleViewEmployee = (employee) => {
    setSelectedEmployee(employee);
    setShowDetailSheet(true);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-[60vh]">
        <div className="text-center space-y-4">
          <div className="w-12 h-12 border-3 border-[#063c88] border-t-transparent rounded-full animate-spin mx-auto" />
          <p className="text-slate-500 text-sm">Loading dashboard...</p>
        </div>
      </div>
    );
  }

  const attendanceStatuses = [
    { key: 'not_logged', label: 'Leaves/No Login', value: stats?.attendance?.not_logged || 0, color: '#f59e0b', icon: AlertCircle },
    { key: 'logged_in', label: 'Logged In', value: stats?.attendance?.logged_in || 0, color: '#10b981', icon: LogIn },
    { key: 'early_out', label: 'Early Out', value: stats?.attendance?.early_out || 0, color: '#ef4444', icon: LogOutIcon },
    { key: 'logout', label: 'Completed', value: stats?.attendance?.logout || 0, color: '#063c88', icon: UserCheck },
    { key: 'late_login', label: 'Late Login', value: stats?.attendance?.late_login || 0, color: '#8b5cf6', icon: Timer },
  ];

  return (
    <div className="space-y-8 animate-fade-in" data-testid="dashboard-page">
      {/* Stats Grid - Bento Style */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 lg:gap-6">
        <StatCard 
          title="Research Unit" 
          value={stats?.total_research_unit || 0} 
          icon={Users}
          color="bg-gradient-to-br from-[#063c88] to-[#0a5cba]"
          trend="up"
          trendValue="+12% this month"
          onClick={() => handleStatCardClick('research_unit')}
          testId="stat-research-unit"
          delay={0}
        />
        <StatCard 
          title="Upcoming Leaves" 
          value={stats?.upcoming_leaves || 0} 
          icon={CalendarDays}
          color="bg-gradient-to-br from-emerald-500 to-teal-600"
          onClick={() => handleStatCardClick('upcoming_leaves')}
          testId="stat-upcoming-leaves"
          delay={0.05}
        />
        <StatCard 
          title="Pending Approvals" 
          value={stats?.pending_approvals || 0} 
          icon={Clock}
          color="bg-gradient-to-br from-violet-500 to-purple-600"
          onClick={() => handleStatCardClick('pending_approvals')}
          testId="stat-pending-approvals"
          delay={0.1}
        />
        <StatCard 
          title="Support Staff" 
          value={stats?.total_support_staff || 0} 
          icon={UserCheck}
          color="bg-gradient-to-br from-amber-500 to-orange-600"
          onClick={() => handleStatCardClick('support_staff')}
          testId="stat-support-staff"
          delay={0.15}
        />
      </div>

      {/* Charts Section - Bento Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Weekly Attendance Chart */}
        <div className="lg:col-span-8 card-premium p-6">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h3 className="text-lg font-semibold text-slate-900" style={{ fontFamily: 'Outfit' }}>
                Weekly Attendance Overview
              </h3>
              <p className="text-sm text-slate-500 mt-1">Employee attendance trends this week</p>
            </div>
            <div className="flex items-center gap-4 text-xs">
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 rounded-full bg-[#004EEB]" />
                <span className="text-slate-600">Present</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 rounded-full bg-amber-500" />
                <span className="text-slate-600">Late</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 rounded-full bg-red-400" />
                <span className="text-slate-600">Absent</span>
              </div>
            </div>
          </div>
          <div className="h-[280px]">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={chartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <defs>
                  <linearGradient id="colorPresent" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#004EEB" stopOpacity={0.2}/>
                    <stop offset="95%" stopColor="#004EEB" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" vertical={false} />
                <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: '#64748b' }} />
                <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: '#64748b' }} />
                <Tooltip 
                  contentStyle={{ 
                    backgroundColor: 'white', 
                    border: 'none', 
                    borderRadius: '12px', 
                    boxShadow: '0 4px 20px rgba(0,0,0,0.1)' 
                  }}
                />
                <Area type="monotone" dataKey="present" stroke="#004EEB" strokeWidth={2} fillOpacity={1} fill="url(#colorPresent)" />
                <Area type="monotone" dataKey="late" stroke="#f59e0b" strokeWidth={2} fill="transparent" />
                <Area type="monotone" dataKey="absent" stroke="#f87171" strokeWidth={2} fill="transparent" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Quick Stats */}
        <div className="lg:col-span-4 space-y-4">
          <div className="card-premium p-6">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 rounded-xl bg-emerald-100 flex items-center justify-center">
                <Activity className="w-5 h-5 text-emerald-600" />
              </div>
              <div>
                <p className="text-sm font-medium text-slate-500">Today's Attendance</p>
                <p className="text-2xl font-bold text-slate-900 number-display">
                  {((stats?.attendance?.logged_in || 0) + (stats?.attendance?.logout || 0))} / {(stats?.total_research_unit || 0) + (stats?.total_support_staff || 0)}
                </p>
              </div>
            </div>
            <div className="h-2 bg-slate-100 rounded-full overflow-hidden">
              <div 
                className="h-full bg-gradient-to-r from-emerald-500 to-teal-500 rounded-full transition-all duration-500"
                style={{ 
                  width: `${Math.min(100, (((stats?.attendance?.logged_in || 0) + (stats?.attendance?.logout || 0)) / Math.max(1, (stats?.total_research_unit || 0) + (stats?.total_support_staff || 0))) * 100)}%` 
                }}
              />
            </div>
          </div>

          <div className="card-premium" style={{ padding:'2rem 1.5rem'}}>
            <h4 className="text-sm font-semibold text-slate-900 mb-4" style={{ fontFamily: 'Outfit' }}>
              Attendance Distribution
            </h4>
            <div className="h-[160px]">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={attendanceStatuses.slice(0, 4)} layout="vertical" margin={{ left: 0, right: 0 }}>
                  <XAxis type="number" hide />
                  <YAxis dataKey="label" type="category" axisLine={false} tickLine={false} tick={{ fontSize: 11, fill: '#64748b' }} width={80} />
                  <Bar dataKey="value" radius={[0, 4, 4, 0]} fill="#063c88" />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>
      </div>

      {/* Filter Section */}
      <div className="card-flat p-6">
        <div className="flex flex-wrap items-end gap-4">
          <div className="flex items-center gap-2">
            <span className="text-sm text-slate-600 font-medium">From:</span>
            <Input
              type="date"
              value={filters.fromDate}
              onChange={(e) => setFilters({ ...filters, fromDate: e.target.value })}
              className="w-40 bg-white rounded-lg"
              data-testid="filter-from-date"
            />
          </div>
          <div className="flex items-center gap-2">
            <span className="text-sm text-slate-600 font-medium">To:</span>
            <Input
              type="date"
              value={filters.toDate}
              onChange={(e) => setFilters({ ...filters, toDate: e.target.value })}
              className="w-40 bg-white rounded-lg"
              data-testid="filter-to-date"
            />
          </div>
          <div className="flex items-center gap-2">
            <span className="text-sm text-slate-600 font-medium">Leave Type:</span>
            <Select value={filters.leaveType} onValueChange={(v) => setFilters({ ...filters, leaveType: v })}>
              <SelectTrigger className="w-32 bg-white rounded-lg" data-testid="filter-leave-type">
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
            className="bg-[#063c88] hover:bg-[#052d66] text-white rounded-lg shadow-lg shadow-[#063c88]/20"
            data-testid="filter-btn"
          >
            <Filter className="w-4 h-4 mr-2" />
            Apply Filter
          </Button>
          <Button 
            variant="outline"
            onClick={handleReset}
            className="rounded-lg"
            data-testid="reset-btn"
          >
            <RotateCcw className="w-4 h-4 mr-2" />
            Reset
          </Button>
        </div>
      </div>

      {/* Attendance Status Cards */}
      <div>
        <h3 className="text-lg font-semibold text-slate-900 mb-4" style={{ fontFamily: 'Outfit' }}>
          Today's Attendance Status
        </h3>
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-4">
          {attendanceStatuses.map((status, index) => (
            <AttendanceStatusCard 
              key={status.key}
              title={status.label}
              value={status.value}
              color={status.color}
              icon={status.icon}
              isActive={activeAttendanceTab === status.key}
              onClick={() => fetchAttendanceByStatus(status.key)}
            />
          ))}
        </div>
      </div>

      {/* Attendance Details Table */}
      <div className="card-premium overflow-hidden">
        <div className="p-6 border-b border-slate-100 flex items-center justify-between">
          <div>
            <h3 className="text-lg font-semibold text-slate-900" style={{ fontFamily: 'Outfit' }}>
              {activeAttendanceTab === 'not_logged' ? 'Leave List / Not Logged In' : `${attendanceStatuses.find(t => t.key === activeAttendanceTab)?.label || ''} Details`}
            </h3>
            <p className="text-sm text-slate-500 mt-1">Detailed view of employee records</p>
          </div>
          <Badge className="bg-[#063c88]/10 text-[#063c88] border-0 px-3 py-1">
            {activeAttendanceTab === 'not_logged' ? leaveList.length : attendanceDetails.length} records
          </Badge>
        </div>
        
        {loadingDetails ? (
          <div className="flex items-center justify-center h-48">
            <div className="w-8 h-8 border-2 border-[#063c88] border-t-transparent rounded-full animate-spin" />
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="table-premium">
              <thead>
                <tr>
                  <th className="w-12"></th>
                  <th>Employee Name</th>
                  <th>Team</th>
                  {activeAttendanceTab === 'not_logged' ? (
                    <>
                      <th>Leave Type</th>
                      <th>Date</th>
                    </>
                  ) : activeAttendanceTab === 'logged_in' ? (
                    <>
                      <th>Check-In</th>
                      <th>Date</th>
                    </>
                  ) : activeAttendanceTab === 'logout' || activeAttendanceTab === 'early_out' ? (
                    <>
                      <th>Check-In</th>
                      <th>Check-Out</th>
                      <th>Total Hours</th>
                    </>
                  ) : activeAttendanceTab === 'late_login' ? (
                    <>
                      <th>Check-In</th>
                      <th>Late By</th>
                    </>
                  ) : (
                    <>
                      <th>Check-In</th>
                      <th>Check-Out</th>
                    </>
                  )}
                  <th>Status</th>
                </tr>
              </thead>
              <tbody>
                {(activeAttendanceTab === 'not_logged' ? leaveList : attendanceDetails).length === 0 ? (
                  <tr>
                    <td colSpan="7" className="text-center py-12 text-slate-500">
                      <div className="flex flex-col items-center gap-2">
                        <AlertCircle className="w-8 h-8 text-slate-300" />
                        <p>No records found</p>
                      </div>
                    </td>
                  </tr>
                ) : (
                  (activeAttendanceTab === 'not_logged' ? leaveList : attendanceDetails).map((item, index) => (
                    <tr 
                      key={index} 
                      className="cursor-pointer"
                      onClick={() => handleViewEmployee(item)}
                    >
                      <td>
                        <button className="p-2 hover:bg-slate-100 rounded-lg transition-colors" data-testid={`view-btn-${index}`}>
                          <Eye className="w-4 h-4 text-slate-400" />
                        </button>
                      </td>
                      <td className="font-medium text-slate-900">{item.emp_name}</td>
                      <td className="text-slate-600">{item.team}</td>
                      {activeAttendanceTab === 'not_logged' ? (
                        <>
                          <td className="text-slate-600">{item.leave_type || '-'}</td>
                          <td className="text-slate-600">{item.date}</td>
                        </>
                      ) : activeAttendanceTab === 'logged_in' ? (
                        <>
                          <td className="text-slate-600">{item.check_in || '-'}</td>
                          <td className="text-slate-600">{item.date}</td>
                        </>
                      ) : activeAttendanceTab === 'logout' || activeAttendanceTab === 'early_out' ? (
                        <>
                          <td className="text-slate-600">{item.check_in || '-'}</td>
                          <td className="text-slate-600">{item.check_out || '-'}</td>
                          <td className="text-slate-600">{item.total_hours || '-'}</td>
                        </>
                      ) : activeAttendanceTab === 'late_login' ? (
                        <>
                          <td className="text-slate-600">{item.check_in || '-'}</td>
                          <td className="text-slate-600">{item.late_by || '-'}</td>
                        </>
                      ) : (
                        <>
                          <td className="text-slate-600">{item.check_in || '-'}</td>
                          <td className="text-slate-600">{item.check_out || '-'}</td>
                        </>
                      )}
                      <td>
                        <Badge className={`
                          ${item.status === 'Not Login' || item.status === 'pending' ? 'badge-warning' : ''}
                          ${item.status === 'Login' || item.status === 'approved' ? 'badge-success' : ''}
                          ${item.status === 'Completed' ? 'badge-info' : ''}
                          ${item.status === 'Early Out' || item.status === 'rejected' ? 'badge-error' : ''}
                          ${item.status === 'Late Login' ? 'bg-purple-50 text-purple-700 border border-purple-200/50' : ''}
                        `}>
                          {item.status}
                        </Badge>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Employee Detail Sheet */}
      <Sheet open={showDetailSheet} onOpenChange={setShowDetailSheet}>
        <SheetContent className="w-full sm:max-w-md bg-[#fffdf7] border-l border-slate-200">
          <SheetHeader>
            <SheetTitle style={{ fontFamily: 'Outfit' }}>Employee Details</SheetTitle>
          </SheetHeader>
          {selectedEmployee && (
            <div className="py-6 space-y-6">
              <div className="flex items-center gap-4 pb-6 border-b border-slate-100">
                <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-[#063c88] to-[#0a5cba] flex items-center justify-center shadow-lg">
                  <span className="text-white text-2xl font-bold">
                    {selectedEmployee.emp_name?.charAt(0)?.toUpperCase()}
                  </span>
                </div>
                <div>
                  <h3 className="font-semibold text-lg text-slate-900">{selectedEmployee.emp_name}</h3>
                  <p className="text-sm text-slate-500">{selectedEmployee.team}</p>
                </div>
              </div>
              
              <div className="space-y-4">
                {[
                  { label: 'Department', value: selectedEmployee.department || '-' },
                  { label: 'Status', value: selectedEmployee.status, isBadge: true },
                  ...(selectedEmployee.check_in ? [{ label: 'Check-In', value: selectedEmployee.check_in }] : []),
                  ...(selectedEmployee.check_out ? [{ label: 'Check-Out', value: selectedEmployee.check_out }] : []),
                  ...(selectedEmployee.leave_type ? [{ label: 'Leave Type', value: selectedEmployee.leave_type }] : []),
                ].map((item, index) => (
                  <div key={index} className="flex justify-between items-center py-3 border-b border-dashed border-slate-200">
                    <span className="text-slate-500 text-sm">{item.label}</span>
                    {item.isBadge ? (
                      <Badge className={
                        selectedEmployee.status === 'Login' ? 'badge-success' :
                        selectedEmployee.status === 'Not Login' ? 'badge-warning' :
                        'badge-neutral'
                      }>
                        {selectedEmployee.status}
                      </Badge>
                    ) : (
                      <span className="font-medium text-slate-900">{item.value}</span>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}
        </SheetContent>
      </Sheet>
    </div>
  );
};

export default Dashboard;
