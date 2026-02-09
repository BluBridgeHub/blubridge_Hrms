import { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import axios from 'axios';
import { toast } from 'sonner';
import { 
  CalendarCheck, 
  Search, 
  Filter,
  ChevronUp,
  ChevronDown,
  Clock,
  LogIn,
  LogOut as LogOutIcon,
  AlertCircle,
  Eye,
  BarChart3
} from 'lucide-react';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../components/ui/select';
import { Badge } from '../components/ui/badge';
import { DatePicker } from '../components/ui/date-picker';
import EmployeeLeaveDetail from '../components/EmployeeLeaveDetail';

const API = `${process.env.REACT_APP_BACKEND_URL}/api`;

const Attendance = () => {
  const { getAuthHeaders } = useAuth();
  const [attendance, setAttendance] = useState([]);
  const [teams, setTeams] = useState([]);
  const [departments, setDepartments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [sortField, setSortField] = useState('emp_name');
  const [sortOrder, setSortOrder] = useState('asc');
  const [selectedEmployee, setSelectedEmployee] = useState(null);
  const [showLeaveDetail, setShowLeaveDetail] = useState(false);
  
  // Default date range: last 30 days
  const getDefaultDateRange = () => {
    const today = new Date();
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(today.getDate() - 30);
    return {
      fromDate: thirtyDaysAgo.toISOString().split('T')[0],
      toDate: today.toISOString().split('T')[0]
    };
  };
  
  const defaultDates = getDefaultDateRange();
  const [filters, setFilters] = useState({
    empName: '',
    team: 'All',
    department: 'All',
    fromDate: defaultDates.fromDate,
    toDate: defaultDates.toDate,
    status: 'All'
  });

  useEffect(() => { fetchData(); }, []);

  const formatDateForApi = (date) => {
    if (!date) return '';
    const d = new Date(date);
    return `${String(d.getDate()).padStart(2, '0')}-${String(d.getMonth() + 1).padStart(2, '0')}-${d.getFullYear()}`;
  };

  const fetchData = async () => {
    try {
      setLoading(true);
      const [attendanceRes, teamsRes, deptsRes] = await Promise.all([
        axios.get(`${API}/attendance`, {
          headers: getAuthHeaders(),
          params: { 
            from_date: formatDateForApi(filters.fromDate), 
            to_date: formatDateForApi(filters.toDate) 
          }
        }),
        axios.get(`${API}/teams`, { headers: getAuthHeaders() }),
        axios.get(`${API}/departments`, { headers: getAuthHeaders() })
      ]);
      setAttendance(attendanceRes.data);
      setTeams(teamsRes.data);
      setDepartments(deptsRes.data);
    } catch (error) {
      console.error('Attendance fetch error:', error);
      toast.error('Failed to load attendance data');
    } finally {
      setLoading(false);
    }
  };

  const handleReset = async () => {
    const dates = getDefaultDateRange();
    const resetFilters = { 
      empName: '', 
      team: 'All', 
      department: 'All', 
      fromDate: dates.fromDate, 
      toDate: dates.toDate, 
      status: 'All' 
    };
    setFilters(resetFilters);
    
    // Fetch with reset filter values directly
    try {
      setLoading(true);
      const response = await axios.get(`${API}/attendance`, {
        headers: getAuthHeaders(),
        params: { 
          from_date: formatDateForApi(dates.fromDate), 
          to_date: formatDateForApi(dates.toDate) 
        }
      });
      setAttendance(response.data);
      toast.info('Filters reset');
    } catch (error) {
      toast.error('Failed to reset');
    } finally {
      setLoading(false);
    }
  };

  const handleFilter = async () => {
    try {
      setLoading(true);
      const response = await axios.get(`${API}/attendance`, {
        headers: getAuthHeaders(),
        params: {
          employee_name: filters.empName || undefined,
          team: filters.team !== 'All' ? filters.team : undefined,
          department: filters.department !== 'All' ? filters.department : undefined,
          from_date: formatDateForApi(filters.fromDate),
          to_date: formatDateForApi(filters.toDate),
          status: filters.status !== 'All' ? filters.status : undefined
        }
      });
      setAttendance(response.data);
      toast.success('Filter applied');
    } catch (error) {
      toast.error('Failed to filter');
    } finally {
      setLoading(false);
    }
  };

  const handleSort = (field) => {
    if (sortField === field) {
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortOrder('asc');
    }
  };

  const sortedAttendance = [...attendance].sort((a, b) => {
    const aVal = a[sortField] || '';
    const bVal = b[sortField] || '';
    return sortOrder === 'asc' ? aVal.localeCompare(bVal) : bVal.localeCompare(aVal);
  });

  const getSortIcon = (field) => {
    if (sortField !== field) return null;
    return sortOrder === 'asc' ? <ChevronUp className="w-4 h-4 inline ml-1" /> : <ChevronDown className="w-4 h-4 inline ml-1" />;
  };

  const getStatusBadge = (status, isLop) => {
    if (isLop || status === 'Loss of Pay') return 'badge-error font-bold';
    const styles = {
      'Login': 'badge-success', 'Completed': 'badge-info', 'Present': 'badge-success',
      'Not Logged': 'badge-neutral', 'Early Out': 'badge-error', 'Late Login': 'badge-warning'
    };
    return styles[status] || 'badge-neutral';
  };

  const getStatusIcon = (status) => {
    if (status === 'Login') return <LogIn className="w-3 h-3" />;
    if (status === 'Completed') return <LogOutIcon className="w-3 h-3" />;
    if (status === 'Late Login') return <Clock className="w-3 h-3" />;
    return null;
  };

  // Stats
  const stats = {
    present: sortedAttendance.filter(a => a.status === 'Present' || a.status === 'Completed').length,
    login: sortedAttendance.filter(a => a.status === 'Login').length,
    late: sortedAttendance.filter(a => a.status === 'Late Login').length,
    absent: sortedAttendance.filter(a => a.status === 'Not Logged' || a.is_lop).length,
  };

  // Handle employee click to show leave detail
  const handleEmployeeClick = (record) => {
    setSelectedEmployee({
      emp_name: record.emp_name,
      employee_id: record.employee_id,
      team: record.team,
      department: record.department,
      emp_id: record.emp_id
    });
    setShowLeaveDetail(true);
  };

  return (
    <div className="space-y-6 animate-fade-in" data-testid="attendance-page">
      {/* Header */}
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 rounded-xl bg-[#063c88] flex items-center justify-center">
          <CalendarCheck className="w-5 h-5 text-white" />
        </div>
        <div>
          <h1 className="text-2xl font-bold text-slate-900" style={{ fontFamily: 'Outfit' }}>Attendance</h1>
          <p className="text-sm text-slate-500">Track employee attendance records</p>
        </div>
      </div>

      {/* Quick Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { label: 'Present', value: stats.present, icon: LogOutIcon, color: 'emerald' },
          { label: 'Logged In', value: stats.login, icon: LogIn, color: 'blue' },
          { label: 'Late Login', value: stats.late, icon: Clock, color: 'amber' },
          { label: 'Absent/LOP', value: stats.absent, icon: AlertCircle, color: 'red' },
        ].map((stat, i) => (
          <div key={i} className="card-flat p-4 flex items-center gap-4">
            <div className={`w-10 h-10 rounded-xl bg-${stat.color}-100 flex items-center justify-center`}>
              <stat.icon className={`w-5 h-5 text-${stat.color}-600`} />
            </div>
            <div>
              <p className="text-2xl font-bold text-slate-900 number-display">{stat.value}</p>
              <p className="text-xs text-slate-500">{stat.label}</p>
            </div>
          </div>
        ))}
      </div>

      {/* Filters */}
      <div className="card-flat p-6">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-4">
          <div>
            <label className="text-sm text-slate-600 mb-1.5 block font-medium">Employee Name</label>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
              <Input placeholder="Search..." value={filters.empName} onChange={(e) => setFilters({ ...filters, empName: e.target.value })} className="pl-10 rounded-lg" data-testid="search-emp-name" />
            </div>
          </div>
          <div>
            <label className="text-sm text-slate-600 mb-1.5 block font-medium">Department</label>
            <Select value={filters.department} onValueChange={(v) => setFilters({ ...filters, department: v })}>
              <SelectTrigger className="rounded-lg" data-testid="filter-department"><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="All">All Departments</SelectItem>
                {departments.map((dept) => <SelectItem key={dept.id} value={dept.name}>{dept.name}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>
          <div>
            <label className="text-sm text-slate-600 mb-1.5 block font-medium">Team</label>
            <Select value={filters.team} onValueChange={(v) => setFilters({ ...filters, team: v })}>
              <SelectTrigger className="rounded-lg" data-testid="filter-team"><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="All">All Teams</SelectItem>
                {teams.map((team) => <SelectItem key={team.id} value={team.name}>{team.name}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>
          <div>
            <label className="text-sm text-slate-600 mb-1.5 block font-medium">Status</label>
            <Select value={filters.status} onValueChange={(v) => setFilters({ ...filters, status: v })}>
              <SelectTrigger className="rounded-lg" data-testid="filter-status"><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="All">All Status</SelectItem>
                <SelectItem value="Login">Login</SelectItem>
                <SelectItem value="Completed">Completed</SelectItem>
                <SelectItem value="Present">Present</SelectItem>
                <SelectItem value="Loss of Pay">Loss of Pay</SelectItem>
                <SelectItem value="Early Out">Early Out</SelectItem>
                <SelectItem value="Late Login">Late Login</SelectItem>
                <SelectItem value="Not Logged">Not Logged</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <div>
            <label className="text-sm text-slate-600 mb-1.5 block font-medium">From Date</label>
            <DatePicker value={filters.fromDate} onChange={(val) => setFilters({ ...filters, fromDate: val })} placeholder="Select date" data-testid="filter-from" />
          </div>
          <div>
            <label className="text-sm text-slate-600 mb-1.5 block font-medium">To Date</label>
            <DatePicker value={filters.toDate} onChange={(val) => setFilters({ ...filters, toDate: val })} placeholder="Select date" data-testid="filter-to" />
          </div>
          <div className="flex items-end gap-2 lg:col-span-2">
            <Button onClick={handleFilter} className="bg-[#063c88] hover:bg-[#052d66] text-white rounded-lg" data-testid="apply-filter-btn">
              <Filter className="w-4 h-4 mr-2" /> Apply Filter
            </Button>
            <Button variant="outline" onClick={() => { const dates = getDefaultDateRange(); setFilters({ empName: '', team: 'All', department: 'All', fromDate: dates.fromDate, toDate: dates.toDate, status: 'All' }); fetchData(); }} className="rounded-lg" data-testid="reset-filter-btn">
              Reset
            </Button>
          </div>
        </div>
      </div>

      {/* Table */}
      <div className="card-premium overflow-hidden">
        {loading ? (
          <div className="flex items-center justify-center h-64">
            <div className="w-10 h-10 border-2 border-[#063c88] border-t-transparent rounded-full animate-spin" />
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="table-premium">
              <thead>
                <tr>
                  <th className="w-12"></th>
                  <th className="cursor-pointer hover:bg-slate-100 transition-colors" onClick={() => handleSort('emp_name')}>Employee {getSortIcon('emp_name')}</th>
                  <th className="cursor-pointer hover:bg-slate-100 transition-colors" onClick={() => handleSort('team')}>Team {getSortIcon('team')}</th>
                  <th className="cursor-pointer hover:bg-slate-100 transition-colors" onClick={() => handleSort('date')}>Date {getSortIcon('date')}</th>
                  <th>Check-In</th>
                  <th>Check-Out</th>
                  <th>Total Hours</th>
                  <th>Status</th>
                </tr>
              </thead>
              <tbody>
                {sortedAttendance.length === 0 ? (
                  <tr>
                    <td colSpan="8" className="text-center py-12 text-slate-500">
                      <CalendarCheck className="w-10 h-10 mx-auto mb-2 text-slate-300" />
                      <p>No attendance records found</p>
                    </td>
                  </tr>
                ) : (
                  sortedAttendance.map((record, index) => (
                    <tr key={record.id || index} className={`${record.is_lop ? 'bg-red-50/50' : ''} group`}>
                      <td>
                        <button 
                          className="p-2 hover:bg-[#063c88]/10 rounded-lg transition-colors opacity-60 group-hover:opacity-100"
                          onClick={() => handleEmployeeClick(record)}
                          data-testid={`view-leave-btn-${index}`}
                          title="View Leave & Attendance Details"
                        >
                          <BarChart3 className="w-4 h-4 text-[#063c88]" />
                        </button>
                      </td>
                      <td>
                        <div 
                          className="flex items-center gap-3 cursor-pointer hover:opacity-80 transition-opacity"
                          onClick={() => handleEmployeeClick(record)}
                          data-testid={`employee-row-${index}`}
                        >
                          <div className="w-8 h-8 rounded-full bg-gradient-to-br from-[#063c88] to-[#0a5cba] flex items-center justify-center">
                            <span className="text-white text-xs font-medium">{record.emp_name?.charAt(0)}</span>
                          </div>
                          <span className="font-medium text-slate-900 hover:text-[#063c88] transition-colors">{record.emp_name}</span>
                        </div>
                      </td>
                      <td className="text-slate-600">{record.team}</td>
                      <td className="text-slate-600">{record.date}</td>
                      <td>
                        <div className="text-slate-900 font-medium">{record.check_in || '-'}</div>
                        {record.expected_login && <div className="text-xs text-slate-400">Expected: {record.expected_login}</div>}
                      </td>
                      <td>
                        <div className="text-slate-900 font-medium">{record.check_out || '-'}</div>
                        {record.expected_logout && <div className="text-xs text-slate-400">Expected: {record.expected_logout}</div>}
                      </td>
                      <td className="text-slate-600 font-medium">{record.total_hours || '-'}</td>
                      <td>
                        <Badge className={`${getStatusBadge(record.status, record.is_lop)} flex items-center gap-1 w-fit`}>
                          {getStatusIcon(record.is_lop ? 'Loss of Pay' : record.status)}
                          {record.is_lop ? 'Loss of Pay' : record.status}
                        </Badge>
                        {record.is_lop && record.lop_reason && (
                          <div className="text-xs text-red-600 mt-1 max-w-[200px] truncate" title={record.lop_reason}>
                            {record.lop_reason}
                          </div>
                        )}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Employee Leave Detail Modal */}
      {showLeaveDetail && selectedEmployee && (
        <EmployeeLeaveDetail 
          employee={selectedEmployee}
          onClose={() => {
            setShowLeaveDetail(false);
            setSelectedEmployee(null);
          }}
        />
      )}
    </div>
  );
};

export default Attendance;
