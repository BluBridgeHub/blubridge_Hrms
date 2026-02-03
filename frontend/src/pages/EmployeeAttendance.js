import { useState, useEffect, useCallback } from 'react';
import { useSearchParams } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import axios from 'axios';
import { toast } from 'sonner';
import { 
  Calendar,
  Filter,
  RotateCcw
} from 'lucide-react';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../components/ui/select';
import { Badge } from '../components/ui/badge';

const API = `${process.env.REACT_APP_BACKEND_URL}/api`;

const StatusBadge = ({ status }) => {
  const getStatusStyle = () => {
    switch (status) {
      case 'Present':
        return 'bg-emerald-100 text-emerald-700';
      case 'Late':
        return 'bg-amber-100 text-amber-700';
      case 'Early Out':
        return 'bg-purple-100 text-purple-700';
      case 'Absent':
        return 'bg-red-100 text-red-700';
      case 'Leave':
        return 'bg-blue-100 text-blue-700';
      case 'Sunday':
        return 'bg-gray-100 text-gray-500';
      case 'NA':
        return 'bg-gray-100 text-gray-400';
      default:
        return 'bg-gray-100 text-gray-600';
    }
  };

  return (
    <Badge className={`${getStatusStyle()} font-medium`}>
      {status}
    </Badge>
  );
};

const EmployeeAttendance = () => {
  const { getAuthHeaders } = useAuth();
  const [searchParams] = useSearchParams();
  const [records, setRecords] = useState([]);
  const [loading, setLoading] = useState(true);
  
  // Get initial status from URL params (for navigation from dashboard cards)
  const initialStatus = searchParams.get('status') || 'All';
  
  const [filters, setFilters] = useState({
    duration: 'this_week',
    startDate: '',
    endDate: '',
    status: initialStatus
  });

  const formatDateForInput = (date) => {
    return date.toISOString().split('T')[0];
  };

  const formatDateForAPI = (dateStr) => {
    if (!dateStr) return '';
    const date = new Date(dateStr);
    return `${String(date.getDate()).padStart(2, '0')}-${String(date.getMonth() + 1).padStart(2, '0')}-${date.getFullYear()}`;
  };

  const fetchAttendance = useCallback(async () => {
    try {
      setLoading(true);
      const params = {
        duration: filters.duration,
        status_filter: filters.status
      };
      
      if (filters.duration === 'custom' && filters.startDate && filters.endDate) {
        params.start_date = formatDateForAPI(filters.startDate);
        params.end_date = formatDateForAPI(filters.endDate);
      }
      
      const response = await axios.get(`${API}/employee/attendance`, { 
        headers: getAuthHeaders(),
        params
      });
      setRecords(response.data);
    } catch (error) {
      console.error('Attendance fetch error:', error);
      toast.error('Failed to load attendance records');
    } finally {
      setLoading(false);
    }
  }, [getAuthHeaders, filters]);

  useEffect(() => {
    fetchAttendance();
  }, [fetchAttendance]);

  const handleFilter = () => {
    fetchAttendance();
    toast.success('Filters applied');
  };

  const handleReset = () => {
    setFilters({
      duration: 'this_week',
      startDate: '',
      endDate: '',
      status: 'All'
    });
    toast.info('Filters reset');
  };

  const currentDate = new Date().toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  });

  return (
    <div className="space-y-6 animate-fade-in" data-testid="employee-attendance-page">
      {/* Page Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900" style={{ fontFamily: 'Outfit, sans-serif' }}>
            Attendance
          </h1>
          <p className="text-sm text-gray-500 mt-1">{currentDate}</p>
        </div>
      </div>

      {/* Filter Section */}
      <div className="bg-[#fffdf7] rounded-xl border border-black/5 p-6">
        <div className="flex flex-wrap items-end gap-4">
          {/* Duration Filter */}
          <div className="space-y-2">
            <label className="text-sm text-gray-600">Duration</label>
            <Select 
              value={filters.duration} 
              onValueChange={(v) => setFilters({ ...filters, duration: v })}
            >
              <SelectTrigger className="w-40 bg-white" data-testid="duration-filter">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="this_week">This Week</SelectItem>
                <SelectItem value="last_week">Last Week</SelectItem>
                <SelectItem value="this_month">This Month</SelectItem>
                <SelectItem value="last_month">Last Month</SelectItem>
                <SelectItem value="custom">Custom</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Date Range (shown when custom is selected) */}
          {filters.duration === 'custom' && (
            <>
              <div className="space-y-2">
                <label className="text-sm text-gray-600">Start Date</label>
                <Input
                  type="date"
                  value={filters.startDate}
                  onChange={(e) => setFilters({ ...filters, startDate: e.target.value })}
                  className="w-40 bg-white"
                  data-testid="start-date-input"
                />
              </div>
              <div className="space-y-2">
                <label className="text-sm text-gray-600">End Date</label>
                <Input
                  type="date"
                  value={filters.endDate}
                  onChange={(e) => setFilters({ ...filters, endDate: e.target.value })}
                  className="w-40 bg-white"
                  data-testid="end-date-input"
                />
              </div>
            </>
          )}

          {/* Status Filter */}
          <div className="space-y-2">
            <label className="text-sm text-gray-600">Status</label>
            <Select 
              value={filters.status} 
              onValueChange={(v) => setFilters({ ...filters, status: v })}
            >
              <SelectTrigger className="w-36 bg-white" data-testid="status-filter">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="All">All</SelectItem>
                <SelectItem value="Present">Present</SelectItem>
                <SelectItem value="Late">Late</SelectItem>
                <SelectItem value="Early Out">Early Out</SelectItem>
                <SelectItem value="Absent">Absent</SelectItem>
                <SelectItem value="Leave">Leave</SelectItem>
                <SelectItem value="NA">NA</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Action Buttons */}
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

      {/* Attendance Table */}
      <div className="bg-[#fffdf7] rounded-xl border border-black/5 overflow-hidden">
        <div className="p-4 border-b border-black/5 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Calendar className="w-5 h-5 text-gray-500" />
            <span className="font-semibold text-gray-900" style={{ fontFamily: 'Outfit, sans-serif' }}>
              Attendance Records
            </span>
          </div>
          <Badge className="bg-[#0b1f3b] text-white">
            {records.length} records
          </Badge>
        </div>

        {loading ? (
          <div className="flex items-center justify-center h-48">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#0b1f3b]"></div>
          </div>
        ) : records.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-48 text-gray-500">
            <Calendar className="w-12 h-12 mb-3 text-gray-300" />
            <p>No Records Found</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50/50">
                <tr>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                    Date
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                    Day
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                    Login
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                    Logout
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
                {records.map((record, index) => (
                  <tr 
                    key={index} 
                    className="hover:bg-gray-50/50 transition-colors duration-150"
                    data-testid={`attendance-row-${index}`}
                  >
                    <td className="px-6 py-4 text-sm font-medium text-gray-900">
                      {record.date}
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-600">
                      {record.day}
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-600">
                      {record.login}
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-600">
                      {record.logout}
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-600">
                      {record.total_hours}
                    </td>
                    <td className="px-6 py-4">
                      <StatusBadge status={record.status} />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};

export default EmployeeAttendance;
