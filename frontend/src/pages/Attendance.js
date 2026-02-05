import { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import axios from 'axios';
import { toast } from 'sonner';
import { 
  CalendarCheck, 
  Search, 
  Filter,
  ChevronUp,
  ChevronDown
} from 'lucide-react';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../components/ui/select';
import { Badge } from '../components/ui/badge';

const API = `${process.env.REACT_APP_BACKEND_URL}/api`;

const Attendance = () => {
  const { getAuthHeaders } = useAuth();
  const [attendance, setAttendance] = useState([]);
  const [teams, setTeams] = useState([]);
  const [departments, setDepartments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [sortField, setSortField] = useState('emp_name');
  const [sortOrder, setSortOrder] = useState('asc');
  const [filters, setFilters] = useState({
    empName: '',
    team: 'All',
    department: 'All',
    fromDate: new Date().toISOString().split('T')[0],
    toDate: new Date().toISOString().split('T')[0],
    status: 'All'
  });

  useEffect(() => {
    fetchData();
  }, []);

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

  const formatDateForApi = (date) => {
    if (!date) return '';
    const d = new Date(date);
    return `${String(d.getDate()).padStart(2, '0')}-${String(d.getMonth() + 1).padStart(2, '0')}-${d.getFullYear()}`;
  };

  const formatDateDisplay = (dateStr) => {
    if (!dateStr) return '-';
    return dateStr;
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
    if (sortOrder === 'asc') {
      return aVal.localeCompare(bVal);
    }
    return bVal.localeCompare(aVal);
  });

  const getSortIcon = (field) => {
    if (sortField !== field) return null;
    return sortOrder === 'asc' ? 
      <ChevronUp className="w-4 h-4 inline ml-1" /> : 
      <ChevronDown className="w-4 h-4 inline ml-1" />;
  };

  const getStatusBadge = (status, isLop) => {
    if (isLop || status === 'Loss of Pay') {
      return 'bg-red-100 text-red-700 font-bold';
    }
    const styles = {
      'Login': 'bg-emerald-100 text-emerald-700',
      'Completed': 'bg-blue-100 text-blue-700',
      'Present': 'bg-green-100 text-green-700',
      'Not Logged': 'bg-gray-100 text-gray-700',
      'Early Out': 'bg-red-100 text-red-700',
      'Late Login': 'bg-amber-100 text-amber-700',
      'Loss of Pay': 'bg-red-100 text-red-700 font-bold'
    };
    return styles[status] || 'bg-gray-100 text-gray-700';
  };

  return (
    <div className="space-y-6 animate-fade-in" data-testid="attendance-page">
      {/* Page Header */}
      <div className="flex items-center gap-3">
        <CalendarCheck className="w-6 h-6 text-[#0b1f3b]" />
        <h1 className="text-2xl font-bold text-[#0b1f3b]" style={{ fontFamily: 'Outfit, sans-serif' }}>
          Attendance
        </h1>
      </div>

      {/* Filter Section */}
      <div className="bg-[#fffdf7] rounded-xl border border-black/5 p-6">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-4">
          <div>
            <label className="text-sm text-gray-600 mb-1 block">Emp Name:</label>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
              <Input
                placeholder="Search"
                value={filters.empName}
                onChange={(e) => setFilters({ ...filters, empName: e.target.value })}
                className="pl-9 bg-white"
                data-testid="search-emp-name"
              />
            </div>
          </div>
          
          <div>
            <label className="text-sm text-gray-600 mb-1 block">Department:</label>
            <Select value={filters.department} onValueChange={(v) => setFilters({ ...filters, department: v })}>
              <SelectTrigger className="bg-white" data-testid="filter-department">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="All">All</SelectItem>
                {departments.map((dept) => (
                  <SelectItem key={dept.id} value={dept.name}>{dept.name}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div>
            <label className="text-sm text-gray-600 mb-1 block">Team:</label>
            <Select value={filters.team} onValueChange={(v) => setFilters({ ...filters, team: v })}>
              <SelectTrigger className="bg-white" data-testid="filter-team">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="All">All</SelectItem>
                {teams.map((team) => (
                  <SelectItem key={team.id} value={team.name}>{team.name}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div>
            <label className="text-sm text-gray-600 mb-1 block">Status:</label>
            <Select value={filters.status} onValueChange={(v) => setFilters({ ...filters, status: v })}>
              <SelectTrigger className="bg-white" data-testid="filter-status">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="All">All</SelectItem>
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
            <label className="text-sm text-gray-600 mb-1 block">From:</label>
            <Input
              type="date"
              value={filters.fromDate}
              onChange={(e) => setFilters({ ...filters, fromDate: e.target.value })}
              className="bg-white"
              data-testid="filter-from"
            />
          </div>

          <div>
            <label className="text-sm text-gray-600 mb-1 block">To:</label>
            <Input
              type="date"
              value={filters.toDate}
              onChange={(e) => setFilters({ ...filters, toDate: e.target.value })}
              className="bg-white"
              data-testid="filter-to"
            />
          </div>

          <div className="flex items-end gap-2 lg:col-span-2">
            <Button 
              onClick={handleFilter}
              className="bg-[#0b1f3b] hover:bg-[#162d4d] text-white"
              data-testid="apply-filter-btn"
            >
              <Filter className="w-4 h-4 mr-2" />
              Filter
            </Button>
            <Button 
              variant="outline"
              onClick={() => {
                setFilters({
                  empName: '',
                  team: 'All',
                  department: 'All',
                  fromDate: new Date().toISOString().split('T')[0],
                  toDate: new Date().toISOString().split('T')[0],
                  status: 'All'
                });
                fetchData();
              }}
              data-testid="reset-filter-btn"
            >
              Reset
            </Button>
          </div>
        </div>
      </div>

      {/* Attendance Table */}
      <div className="bg-[#fffdf7] rounded-xl border border-black/5 overflow-hidden">
        {loading ? (
          <div className="flex items-center justify-center h-64">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#0b1f3b]"></div>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50/50">
                <tr>
                  <th 
                    className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider cursor-pointer hover:bg-gray-100"
                    onClick={() => handleSort('emp_name')}
                  >
                    Emp Name <SortIcon field="emp_name" />
                  </th>
                  <th 
                    className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider cursor-pointer hover:bg-gray-100"
                    onClick={() => handleSort('team')}
                  >
                    Team <SortIcon field="team" />
                  </th>
                  <th 
                    className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider cursor-pointer hover:bg-gray-100"
                    onClick={() => handleSort('date')}
                  >
                    Date <SortIcon field="date" />
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                    Check-In
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                    Check-Out
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                    Total Hours
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                    Status
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {sortedAttendance.length === 0 ? (
                  <tr>
                    <td colSpan="7" className="px-6 py-12 text-center text-gray-500">
                      No attendance records found
                    </td>
                  </tr>
                ) : (
                  sortedAttendance.map((record, index) => (
                    <tr key={record.id || index} className={`hover:bg-gray-50/50 transition-colors ${record.is_lop ? 'bg-red-50/50' : ''}`}>
                      <td className="px-6 py-4 text-sm font-medium text-gray-900">{record.emp_name}</td>
                      <td className="px-6 py-4 text-sm text-gray-600">{record.team}</td>
                      <td className="px-6 py-4 text-sm text-gray-600">{formatDateDisplay(record.date)}</td>
                      <td className="px-6 py-4 text-sm text-gray-600">
                        <div>{record.check_in || '-'}</div>
                        {record.expected_login && (
                          <div className="text-xs text-gray-400">Expected: {record.expected_login}</div>
                        )}
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-600">
                        <div>{record.check_out || '-'}</div>
                        {record.expected_logout && (
                          <div className="text-xs text-gray-400">Expected: {record.expected_logout}</div>
                        )}
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-600">{record.total_hours || '-'}</td>
                      <td className="px-6 py-4">
                        <Badge className={getStatusBadge(record.status, record.is_lop)}>
                          {record.is_lop ? 'Loss of Pay' : record.status}
                        </Badge>
                        {record.is_lop && record.lop_reason && (
                          <div className="text-xs text-red-600 mt-1 max-w-[200px]" title={record.lop_reason}>
                            {record.lop_reason.substring(0, 50)}...
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
    </div>
  );
};

export default Attendance;
