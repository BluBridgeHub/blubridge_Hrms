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
  ChevronRight
} from 'lucide-react';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../components/ui/select';
import { Badge } from '../components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../components/ui/tabs';
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from '../components/ui/sheet';

const API = `${process.env.REACT_APP_BACKEND_URL}/api`;

const StatCard = ({ title, value, icon: Icon, color, bgColor, onClick, 'data-testid': testId }) => (
  <div 
    onClick={onClick}
    data-testid={testId}
    className={`bg-[#fffdf7] rounded-xl border border-black/5 p-4 sm:p-6 hover:shadow-lg transition-all duration-300 transform hover:-translate-y-1 ${onClick ? 'cursor-pointer' : ''} min-w-0`}
  >
    <div className="flex items-start justify-between gap-2">
      <div className="min-w-0 flex-1">
        <p className="text-xs sm:text-sm text-gray-500 font-medium truncate">{title}</p>
        <p className="text-2xl sm:text-3xl font-bold mt-1 sm:mt-2 transition-all duration-300" style={{ fontFamily: 'Outfit, sans-serif', color: '#0f172a' }}>
          {value}
        </p>
      </div>
      <div className={`w-10 h-10 sm:w-12 sm:h-12 rounded-xl flex items-center justify-center ${bgColor} transition-transform duration-300 hover:scale-110 flex-shrink-0`}>
        <Icon className="w-5 h-5 sm:w-6 sm:h-6" style={{ color }} strokeWidth={1.5} />
      </div>
    </div>
  </div>
);

const AttendanceStatCard = ({ title, value, icon: Icon, borderColor, isActive, onClick }) => (
  <div 
    onClick={onClick}
    className={`bg-[#fffdf7] rounded-xl border-l-4 p-3 sm:p-4 text-center cursor-pointer transition-all duration-300 hover:shadow-md min-w-0 ${isActive ? 'shadow-lg' : ''}`} 
    style={{ 
      borderLeftColor: borderColor,
      ...(isActive && { 
        boxShadow: `0 0 0 2px ${borderColor}`,
        transform: 'scale(1.02)'
      })
    }}
  >
    <p className="text-2xl sm:text-3xl font-bold transition-all duration-300" style={{ fontFamily: 'Outfit, sans-serif' }}>{value}</p>
    <p className="text-[10px] sm:text-xs text-gray-500 mt-1 truncate">{title}</p>
  </div>
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

  // Format date for API (dd-mm-yyyy)
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
      
      // Build params for filtered stats
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
      // Use filtered date range if set, otherwise use today
      const today = new Date().toLocaleDateString('en-GB').split('/').join('-');
      const fromDate = filters.fromDate ? formatDateForAPI(filters.fromDate) : today;
      const toDate = filters.toDate ? formatDateForAPI(filters.toDate) : today;
      
      let statusFilter = '';
      
      switch (statusType) {
        case 'logged_in':
          statusFilter = 'Login';
          break;
        case 'logout':
          statusFilter = 'Completed';
          break;
        case 'early_out':
          statusFilter = 'Early Out';
          break;
        case 'late_login':
          statusFilter = 'Late Login';
          break;
        default:
          // For not_logged, we show the leave list
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
    // Refetch attendance details with new date range
    if (activeAttendanceTab !== 'not_logged') {
      fetchAttendanceByStatus(activeAttendanceTab);
    }
    toast.success('Filters applied');
  };

  const handleReset = () => {
    setFilters({ fromDate: '', toDate: '', leaveType: 'All' });
    toast.info('Filters reset');
  };

  // Navigation handlers for stat cards
  const handleStatCardClick = (cardType) => {
    switch (cardType) {
      case 'research_unit':
        navigate('/team', { state: { department: 'Research Unit' } });
        break;
      case 'support_staff':
        navigate('/team', { state: { department: 'Support Staff' } });
        break;
      case 'upcoming_leaves':
        navigate('/leave', { state: { tab: 'approved' } });
        break;
      case 'pending_approvals':
        navigate('/leave', { state: { tab: 'pending' } });
        break;
      default:
        break;
    }
  };

  const handleViewEmployee = (employee) => {
    setSelectedEmployee(employee);
    setShowDetailSheet(true);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#0b1f3b]"></div>
      </div>
    );
  }

  const attendanceTabs = [
    { key: 'not_logged', label: 'Leaves/No Login', value: stats?.attendance?.not_logged || 0, color: '#f59e0b' },
    { key: 'logged_in', label: 'Login', value: stats?.attendance?.logged_in || 0, color: '#10b981' },
    { key: 'early_out', label: 'Early Out', value: stats?.attendance?.early_out || 0, color: '#ef4444' },
    { key: 'logout', label: 'Logout', value: stats?.attendance?.logout || 0, color: '#6366f1' },
    { key: 'late_login', label: 'Late Login', value: stats?.attendance?.late_login || 0, color: '#8b5cf6' },
  ];

  return (
    <div className="space-y-6 animate-fade-in" data-testid="dashboard-page">
      {/* Page Header */}
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-900" style={{ fontFamily: 'Outfit, sans-serif' }}>
          Dashboard
        </h1>
        <p className="text-sm text-gray-500">
          {new Date().toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
        </p>
      </div>

      {/* Main Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        <StatCard 
          title="Total Research Unit" 
          value={stats?.total_research_unit || 0} 
          icon={Users}
          color="#0b1f3b"
          bgColor="bg-blue-100"
          onClick={() => handleStatCardClick('research_unit')}
          data-testid="stat-research-unit"
        />
        <StatCard 
          title="Upcoming Leaves" 
          value={stats?.upcoming_leaves || 0} 
          icon={CalendarDays}
          color="#10b981"
          bgColor="bg-emerald-100"
          onClick={() => handleStatCardClick('upcoming_leaves')}
          data-testid="stat-upcoming-leaves"
        />
        <StatCard 
          title="Pending Approvals" 
          value={stats?.pending_approvals || 0} 
          icon={Clock}
          color="#8b5cf6"
          bgColor="bg-purple-100"
          onClick={() => handleStatCardClick('pending_approvals')}
          data-testid="stat-pending-approvals"
        />
        <StatCard 
          title="Total Support Staff" 
          value={stats?.total_support_staff || 0} 
          icon={UserCheck}
          color="#f97316"
          bgColor="bg-orange-100"
          onClick={() => handleStatCardClick('support_staff')}
          data-testid="stat-support-staff"
        />
      </div>

      {/* Filter Section */}
      <div className="bg-[#fffdf7] rounded-xl border border-black/5 p-6 transition-all duration-300 hover:shadow-md">
        <div className="flex flex-wrap items-center gap-4">
          <div className="flex items-center gap-2">
            <span className="text-sm text-gray-600">From:</span>
            <Input
              type="date"
              value={filters.fromDate}
              onChange={(e) => setFilters({ ...filters, fromDate: e.target.value })}
              className="w-40 bg-white transition-all duration-200 focus:ring-2 focus:ring-[#0b1f3b]/20"
              data-testid="filter-from-date"
            />
          </div>
          <div className="flex items-center gap-2">
            <span className="text-sm text-gray-600">To:</span>
            <Input
              type="date"
              value={filters.toDate}
              onChange={(e) => setFilters({ ...filters, toDate: e.target.value })}
              className="w-40 bg-white transition-all duration-200 focus:ring-2 focus:ring-[#0b1f3b]/20"
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
            className="bg-[#0b1f3b] hover:bg-[#162d4d] text-white transition-all duration-200 hover:shadow-lg"
            data-testid="filter-btn"
          >
            <Filter className="w-4 h-4 mr-2" />
            Filter
          </Button>
          <Button 
            variant="secondary"
            onClick={handleReset}
            className="bg-gray-500 hover:bg-gray-600 text-white transition-all duration-200"
            data-testid="reset-btn"
          >
            <RotateCcw className="w-4 h-4 mr-2" />
            Reset
          </Button>
        </div>
      </div>

      {/* Attendance Stats Tabs */}
      <div className="space-y-4">
        <h2 className="text-lg font-semibold" style={{ fontFamily: 'Outfit, sans-serif' }}>
          Today&apos;s Attendance Overview
        </h2>
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-4">
          {attendanceTabs.map((tab) => (
            <AttendanceStatCard 
              key={tab.key}
              title={tab.label}
              value={tab.value}
              borderColor={tab.color}
              isActive={activeAttendanceTab === tab.key}
              onClick={() => fetchAttendanceByStatus(tab.key)}
            />
          ))}
        </div>
      </div>

      {/* Attendance Details Table */}
      <div className="bg-[#fffdf7] rounded-xl border border-black/5 overflow-hidden transition-all duration-300">
        <div className="p-6 border-b border-black/5 flex items-center justify-between">
          <h2 className="text-lg font-semibold" style={{ fontFamily: 'Outfit, sans-serif' }}>
            {activeAttendanceTab === 'not_logged' ? 'Leave List / Not Logged In' : `${attendanceTabs.find(t => t.key === activeAttendanceTab)?.label || ''} Details`}
          </h2>
          <Badge className="bg-[#0b1f3b] text-white">
            {activeAttendanceTab === 'not_logged' ? leaveList.length : attendanceDetails.length} records
          </Badge>
        </div>
        
        {loadingDetails ? (
          <div className="flex items-center justify-center h-48">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#0b1f3b]"></div>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50/50">
                <tr>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider"></th>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Emp Name</th>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Team</th>
                  {activeAttendanceTab === 'not_logged' ? (
                    <>
                      <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Leave Type</th>
                      <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Date</th>
                    </>
                  ) : activeAttendanceTab === 'logged_in' ? (
                    <>
                      <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Check-In</th>
                      <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Date</th>
                    </>
                  ) : activeAttendanceTab === 'logout' ? (
                    <>
                      <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Check-In</th>
                      <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Check-Out</th>
                      <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Total Hours</th>
                    </>
                  ) : activeAttendanceTab === 'early_out' ? (
                    <>
                      <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Check-In</th>
                      <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Check-Out</th>
                      <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Total Hours</th>
                    </>
                  ) : activeAttendanceTab === 'late_login' ? (
                    <>
                      <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Check-In</th>
                      <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Late By</th>
                    </>
                  ) : (
                    <>
                      <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Check-In</th>
                      <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Check-Out</th>
                    </>
                  )}
                  <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {(activeAttendanceTab === 'not_logged' ? leaveList : attendanceDetails).length === 0 ? (
                  <tr>
                    <td colSpan="7" className="px-6 py-12 text-center text-gray-500">
                      No records found
                    </td>
                  </tr>
                ) : (
                  (activeAttendanceTab === 'not_logged' ? leaveList : attendanceDetails).map((item, index) => (
                    <tr 
                      key={index} 
                      className="hover:bg-gray-50/50 transition-colors duration-150 cursor-pointer"
                      onClick={() => handleViewEmployee(item)}
                    >
                      <td className="px-6 py-4">
                        <button className="p-1 hover:bg-gray-100 rounded transition-colors" data-testid={`view-btn-${index}`}>
                          <Eye className="w-4 h-4 text-gray-400" />
                        </button>
                      </td>
                      <td className="px-6 py-4 text-sm font-medium text-gray-900">{item.emp_name}</td>
                      <td className="px-6 py-4 text-sm text-gray-600">{item.team}</td>
                      {activeAttendanceTab === 'not_logged' ? (
                        <>
                          <td className="px-6 py-4 text-sm text-gray-600">{item.leave_type || '-'}</td>
                          <td className="px-6 py-4 text-sm text-gray-600">{item.date}</td>
                        </>
                      ) : activeAttendanceTab === 'logged_in' ? (
                        <>
                          <td className="px-6 py-4 text-sm text-gray-600">{item.check_in || '-'}</td>
                          <td className="px-6 py-4 text-sm text-gray-600">{item.date}</td>
                        </>
                      ) : activeAttendanceTab === 'logout' ? (
                        <>
                          <td className="px-6 py-4 text-sm text-gray-600">{item.check_in || '-'}</td>
                          <td className="px-6 py-4 text-sm text-gray-600">{item.check_out || '-'}</td>
                          <td className="px-6 py-4 text-sm text-gray-600">{item.total_hours || '-'}</td>
                        </>
                      ) : activeAttendanceTab === 'early_out' ? (
                        <>
                          <td className="px-6 py-4 text-sm text-gray-600">{item.check_in || '-'}</td>
                          <td className="px-6 py-4 text-sm text-gray-600">{item.check_out || '-'}</td>
                          <td className="px-6 py-4 text-sm text-gray-600">{item.total_hours || '-'}</td>
                        </>
                      ) : activeAttendanceTab === 'late_login' ? (
                        <>
                          <td className="px-6 py-4 text-sm text-gray-600">{item.check_in || '-'}</td>
                          <td className="px-6 py-4 text-sm text-gray-600">{item.late_by || '-'}</td>
                        </>
                      ) : (
                        <>
                          <td className="px-6 py-4 text-sm text-gray-600">{item.check_in || '-'}</td>
                          <td className="px-6 py-4 text-sm text-gray-600">{item.check_out || '-'}</td>
                        </>
                      )}
                      <td className="px-6 py-4">
                        <Badge 
                          className={`
                            transition-all duration-200
                            ${item.status === 'Not Login' ? 'bg-amber-100 text-amber-700' : ''}
                            ${item.status === 'Login' ? 'bg-emerald-100 text-emerald-700' : ''}
                            ${item.status === 'Completed' ? 'bg-blue-100 text-blue-700' : ''}
                            ${item.status === 'approved' ? 'bg-emerald-100 text-emerald-700' : ''}
                            ${item.status === 'pending' ? 'bg-amber-100 text-amber-700' : ''}
                            ${item.status === 'Early Out' ? 'bg-red-100 text-red-700' : ''}
                            ${item.status === 'Late Login' ? 'bg-purple-100 text-purple-700' : ''}
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
        )}
      </div>

      {/* Employee Detail Sheet */}
      <Sheet open={showDetailSheet} onOpenChange={setShowDetailSheet}>
        <SheetContent className="w-full sm:max-w-md bg-[#fffdf7]">
          <SheetHeader>
            <SheetTitle style={{ fontFamily: 'Outfit, sans-serif' }}>Employee Details</SheetTitle>
          </SheetHeader>
          {selectedEmployee && (
            <div className="py-6 space-y-4">
              <div className="flex items-center gap-4 pb-4 border-b">
                <div className="w-14 h-14 rounded-full bg-[#0b1f3b] flex items-center justify-center">
                  <span className="text-white text-xl font-bold">
                    {selectedEmployee.emp_name?.charAt(0)?.toUpperCase()}
                  </span>
                </div>
                <div>
                  <h3 className="font-semibold text-lg">{selectedEmployee.emp_name}</h3>
                  <p className="text-sm text-gray-500">{selectedEmployee.team}</p>
                </div>
              </div>
              
              <div className="space-y-3">
                <div className="flex justify-between py-2 border-b border-dashed">
                  <span className="text-gray-500">Department</span>
                  <span className="font-medium">{selectedEmployee.department || '-'}</span>
                </div>
                <div className="flex justify-between py-2 border-b border-dashed">
                  <span className="text-gray-500">Status</span>
                  <Badge className={
                    selectedEmployee.status === 'Login' ? 'bg-emerald-100 text-emerald-700' :
                    selectedEmployee.status === 'Not Login' ? 'bg-amber-100 text-amber-700' :
                    'bg-gray-100 text-gray-700'
                  }>
                    {selectedEmployee.status}
                  </Badge>
                </div>
                {selectedEmployee.check_in && (
                  <div className="flex justify-between py-2 border-b border-dashed">
                    <span className="text-gray-500">Check-In</span>
                    <span className="font-medium">{selectedEmployee.check_in}</span>
                  </div>
                )}
                {selectedEmployee.check_out && (
                  <div className="flex justify-between py-2 border-b border-dashed">
                    <span className="text-gray-500">Check-Out</span>
                    <span className="font-medium">{selectedEmployee.check_out}</span>
                  </div>
                )}
                {selectedEmployee.leave_type && (
                  <div className="flex justify-between py-2 border-b border-dashed">
                    <span className="text-gray-500">Leave Type</span>
                    <span className="font-medium">{selectedEmployee.leave_type}</span>
                  </div>
                )}
              </div>
            </div>
          )}
        </SheetContent>
      </Sheet>
    </div>
  );
};

export default Dashboard;
