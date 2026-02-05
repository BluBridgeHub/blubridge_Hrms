import { useState, useEffect, useCallback } from 'react';
import { useAuth } from '../contexts/AuthContext';
import axios from 'axios';
import { toast } from 'sonner';
import { CalendarCheck, Clock, LogIn, LogOut as LogOutIcon, AlertCircle } from 'lucide-react';
import { Badge } from '../components/ui/badge';
import { DatePicker } from '../components/ui/date-picker';
import { Button } from '../components/ui/button';

const API = `${process.env.REACT_APP_BACKEND_URL}/api`;

const EmployeeAttendance = () => {
  const { getAuthHeaders } = useAuth();
  const [attendance, setAttendance] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filters, setFilters] = useState({
    fromDate: new Date(new Date().getFullYear(), new Date().getMonth(), 1).toISOString().split('T')[0],
    toDate: new Date().toISOString().split('T')[0]
  });

  const fetchAttendance = useCallback(async () => {
    try {
      setLoading(true);
      const fromDate = filters.fromDate ? new Date(filters.fromDate).toLocaleDateString('en-GB').split('/').join('-') : undefined;
      const toDate = filters.toDate ? new Date(filters.toDate).toLocaleDateString('en-GB').split('/').join('-') : undefined;
      const response = await axios.get(`${API}/employee/attendance`, { headers: getAuthHeaders(), params: { from_date: fromDate, to_date: toDate } });
      setAttendance(response.data);
    } catch (error) {
      toast.error('Failed to load attendance');
    } finally {
      setLoading(false);
    }
  }, [getAuthHeaders, filters.fromDate, filters.toDate]);

  useEffect(() => { fetchAttendance(); }, [fetchAttendance]);

  const getStatusBadge = (status, isLop) => {
    if (isLop || status === 'Loss of Pay') return 'badge-error font-bold';
    const styles = { 'Login': 'badge-success', 'Completed': 'badge-info', 'Present': 'badge-success', 'Not Logged': 'badge-neutral', 'Early Out': 'badge-error', 'Late Login': 'badge-warning', 'Leave': 'bg-purple-50 text-purple-700 border border-purple-200/50' };
    return styles[status] || 'badge-neutral';
  };

  const stats = {
    present: attendance.filter(a => a.status === 'Present' || a.status === 'Completed').length,
    late: attendance.filter(a => a.status === 'Late Login').length,
    absent: attendance.filter(a => a.status === 'Not Logged' || a.is_lop).length,
    leave: attendance.filter(a => a.status === 'Leave').length,
  };

  return (
    <div className="space-y-6 animate-fade-in" data-testid="employee-attendance-page">
      {/* Header */}
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 rounded-xl bg-emerald-500 flex items-center justify-center">
          <CalendarCheck className="w-5 h-5 text-white" />
        </div>
        <div>
          <h1 className="text-2xl font-bold text-slate-900" style={{ fontFamily: 'Outfit' }}>My Attendance</h1>
          <p className="text-sm text-slate-500">View your attendance history</p>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { label: 'Present', value: stats.present, icon: LogOutIcon, color: 'emerald' },
          { label: 'Late Login', value: stats.late, icon: Clock, color: 'amber' },
          { label: 'Absent/LOP', value: stats.absent, icon: AlertCircle, color: 'red' },
          { label: 'Leave', value: stats.leave, icon: CalendarCheck, color: 'purple' },
        ].map((stat, i) => (
          <div key={i} className="stat-card">
            <div className="flex items-center gap-4">
              <div className={`w-10 h-10 rounded-xl bg-${stat.color}-100 flex items-center justify-center`}>
                <stat.icon className={`w-5 h-5 text-${stat.color}-600`} />
              </div>
              <div>
                <p className="text-2xl font-bold text-slate-900 number-display">{stat.value}</p>
                <p className="text-xs text-slate-500">{stat.label}</p>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Filters */}
      <div className="card-flat p-6">
        <div className="flex flex-wrap items-end gap-4">
          <div>
            <label className="text-sm text-slate-600 mb-1.5 block font-medium">From Date</label>
            <DatePicker value={filters.fromDate} onChange={(val) => setFilters({ ...filters, fromDate: val })} placeholder="Select date" data-testid="filter-from" />
          </div>
          <div>
            <label className="text-sm text-slate-600 mb-1.5 block font-medium">To Date</label>
            <DatePicker value={filters.toDate} onChange={(val) => setFilters({ ...filters, toDate: val })} placeholder="Select date" data-testid="filter-to" />
          </div>
          <Button onClick={fetchAttendance} className="bg-emerald-500 hover:bg-emerald-600 text-white rounded-lg" data-testid="apply-filter-btn">
            Apply
          </Button>
        </div>
      </div>

      {/* Table */}
      <div className="card-premium overflow-hidden">
        {loading ? (
          <div className="flex items-center justify-center h-64">
            <div className="w-10 h-10 border-2 border-emerald-500 border-t-transparent rounded-full animate-spin" />
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="table-premium">
              <thead>
                <tr>
                  <th>Date</th>
                  <th>Day</th>
                  <th>Check-In</th>
                  <th>Check-Out</th>
                  <th>Total Hours</th>
                  <th>Status</th>
                </tr>
              </thead>
              <tbody>
                {attendance.length === 0 ? (
                  <tr><td colSpan="6" className="text-center py-12 text-slate-500">No attendance records found</td></tr>
                ) : (
                  attendance.map((record, index) => (
                    <tr key={index} className={record.is_lop ? 'bg-red-50/50' : ''}>
                      <td className="font-medium text-slate-900">{record.date}</td>
                      <td className="text-slate-600">{record.day}</td>
                      <td className="text-slate-600">{record.check_in || '-'}</td>
                      <td className="text-slate-600">{record.check_out || '-'}</td>
                      <td className="text-slate-600">{record.total_hours || '-'}</td>
                      <td><Badge className={getStatusBadge(record.status, record.is_lop)}>{record.is_lop ? 'Loss of Pay' : record.status}</Badge></td>
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

export default EmployeeAttendance;
