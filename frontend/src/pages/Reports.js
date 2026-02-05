import { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import axios from 'axios';
import { toast } from 'sonner';
import { FileText, Download, RotateCcw } from 'lucide-react';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../components/ui/select';
import { Badge } from '../components/ui/badge';

const API = `${process.env.REACT_APP_BACKEND_URL}/api`;

const Reports = () => {
  const { getAuthHeaders } = useAuth();
  const [activeTab, setActiveTab] = useState('leave'); // 'leave' | 'attendance'
  const [teams, setTeams] = useState([]);
  const [departments, setDepartments] = useState([]);
  const [loading, setLoading] = useState(false);
  const [reportData, setReportData] = useState([]);
  
  // Leave Report Filters
  const [leaveFilters, setLeaveFilters] = useState({
    fromDate: '',
    toDate: '',
    empName: '',
    team: 'All Team',
    leaveType: 'All Types',
    department: 'Department'
  });

  // Attendance Report Filters
  const [attendanceFilters, setAttendanceFilters] = useState({
    fromDate: '',
    toDate: '',
    empName: '',
    team: 'All Team',
    status: 'All Types',
    department: 'Department'
  });

  useEffect(() => {
    fetchTeamsAndDepts();
  }, []);

  const fetchTeamsAndDepts = async () => {
    try {
      const [teamsRes, deptsRes] = await Promise.all([
        axios.get(`${API}/teams`, { headers: getAuthHeaders() }),
        axios.get(`${API}/departments`, { headers: getAuthHeaders() })
      ]);
      setTeams(teamsRes.data);
      setDepartments(deptsRes.data);
    } catch (error) {
      console.error('Failed to load teams/departments');
    }
  };

  const handleExport = async () => {
    try {
      setLoading(true);
      const filters = activeTab === 'leave' ? leaveFilters : attendanceFilters;
      const endpoint = activeTab === 'leave' ? '/reports/leaves' : '/reports/attendance';
      
      const params = {
        from_date: filters.fromDate || undefined,
        to_date: filters.toDate || undefined,
        employee_name: filters.empName || undefined,
        team: filters.team !== 'All Team' ? filters.team : undefined,
        department: filters.department !== 'Department' ? filters.department : undefined
      };

      if (activeTab === 'leave') {
        params.leave_type = filters.leaveType !== 'All Types' ? filters.leaveType : undefined;
      } else {
        params.status = filters.status !== 'All Types' ? filters.status : undefined;
      }

      const response = await axios.get(`${API}${endpoint}`, {
        headers: getAuthHeaders(),
        params
      });
      
      setReportData(response.data);
      
      // Export to CSV
      if (response.data.length > 0) {
        let headers, rows;
        if (activeTab === 'attendance') {
          headers = ['Employee Name', 'Team', 'Department', 'Date', 'Check-In', 'Check-Out', 'Status'];
          rows = response.data.map(r => [r.emp_name, r.team, r.department || '', r.date, r.check_in || '-', r.check_out || '-', r.status]);
        } else {
          headers = ['Employee Name', 'Team', 'Department', 'Leave Type', 'Start Date', 'End Date', 'Duration', 'Status'];
          rows = response.data.map(r => [r.emp_name, r.team, r.department || '', r.leave_type, r.start_date, r.end_date, r.duration, r.status]);
        }

        const csv = [headers, ...rows].map(row => row.join(',')).join('\n');
        const blob = new Blob([csv], { type: 'text/csv' });
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `${activeTab}-report-${new Date().toISOString().split('T')[0]}.csv`;
        a.click();
        toast.success('Report exported successfully');
      } else {
        toast.info('No data found for the selected filters');
      }
    } catch (error) {
      toast.error('Failed to export report');
    } finally {
      setLoading(false);
    }
  };

  const handleReset = () => {
    if (activeTab === 'leave') {
      setLeaveFilters({
        fromDate: '',
        toDate: '',
        empName: '',
        team: 'All Team',
        leaveType: 'All Types',
        department: 'Department'
      });
    } else {
      setAttendanceFilters({
        fromDate: '',
        toDate: '',
        empName: '',
        team: 'All Team',
        status: 'All Types',
        department: 'Department'
      });
    }
    setReportData([]);
    toast.info('Filters reset');
  };

  const getStatusBadge = (status) => {
    const styles = {
      'Login': 'bg-emerald-100 text-emerald-700',
      'Completed': 'bg-blue-100 text-blue-700',
      'Logout': 'bg-blue-100 text-blue-700',
      'Not Logged': 'bg-gray-100 text-gray-700',
      'Late': 'bg-amber-100 text-amber-700',
      'Late Login': 'bg-amber-100 text-amber-700',
      'Early Out': 'bg-orange-100 text-orange-700',
      'Leave': 'bg-purple-100 text-purple-700',
      'pending': 'bg-amber-100 text-amber-700',
      'approved': 'bg-emerald-100 text-emerald-700',
      'rejected': 'bg-red-100 text-red-700'
    };
    return styles[status] || 'bg-gray-100 text-gray-700';
  };

  return (
    <div className="space-y-6 animate-fade-in bg-[#efede5] min-h-screen p-6" data-testid="reports-page">
      {/* Page Header */}
      <div className="flex items-center gap-3">
        <FileText className="w-6 h-6 text-[#0b1f3b]" />
        <h1 className="text-2xl font-bold text-[#0b1f3b]" style={{ fontFamily: 'Outfit, sans-serif' }}>
          HRMS Reports
        </h1>
      </div>

      {/* Tab Navigation */}
      <div className="flex">
        <button
          onClick={() => { setActiveTab('leave'); setReportData([]); }}
          className={`px-6 py-3 font-medium transition-all duration-200 rounded-lg ${
            activeTab === 'leave' 
              ? 'bg-[#0b1f3b] text-white' 
              : 'bg-white text-gray-700 border border-gray-200 hover:bg-gray-50'
          }`}
          data-testid="tab-leave"
        >
          Leave Report
        </button>
        <button
          onClick={() => { setActiveTab('attendance'); setReportData([]); }}
          className={`px-6 py-3 font-medium transition-all duration-200 rounded-lg ml-2 ${
            activeTab === 'attendance' 
              ? 'bg-[#0b1f3b] text-white' 
              : 'bg-white text-gray-700 border border-gray-200 hover:bg-gray-50'
          }`}
          data-testid="tab-attendance"
        >
          Attendance Report
        </button>
      </div>

      {/* Filter Section */}
      <div className="bg-[#fffdf7] rounded-xl border border-black/5 p-8">
        <h3 className="text-xl font-bold text-gray-900 mb-2" style={{ fontFamily: 'Outfit, sans-serif' }}>
          {activeTab === 'leave' ? 'Leave Report Filters' : 'Attendance Report Filters'}
        </h3>
        <div className="border-b border-[#dfddd7] w-full mb-8"></div>
        
        {/* Leave Report Filters */}
        {activeTab === 'leave' && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-x-8 gap-y-8">
            {/* Row 1 */}
            <div>
              <label className="text-sm text-gray-600 mb-2 block">From:</label>
              <Input
                type="date"
                value={leaveFilters.fromDate}
                onChange={(e) => setLeaveFilters({ ...leaveFilters, fromDate: e.target.value })}
                className="bg-white border-0 border-b-2 border-b-[#0b1f3b] rounded-none focus:ring-0 shadow-none"
                data-testid="leave-filter-from"
              />
            </div>
            <div>
              <label className="text-sm text-gray-600 mb-2 block">Emp Name:</label>
              <Input
                type="text"
                placeholder="Employee Name"
                value={leaveFilters.empName}
                onChange={(e) => setLeaveFilters({ ...leaveFilters, empName: e.target.value })}
                className="bg-white border-0 border-b-2 border-b-[#0b1f3b] rounded-none focus:ring-0 shadow-none"
                data-testid="leave-filter-empname"
              />
            </div>
            <div>
              <label className="text-sm text-gray-600 mb-2 block">Leave Type:</label>
              <Select value={leaveFilters.leaveType} onValueChange={(v) => setLeaveFilters({ ...leaveFilters, leaveType: v })}>
                <SelectTrigger className="bg-white border-0 border-b-2 border-b-[#0b1f3b] rounded-none shadow-none" data-testid="leave-filter-type">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="All Types">All Types</SelectItem>
                  <SelectItem value="Sick">Sick</SelectItem>
                  <SelectItem value="Preplanned">Preplanned</SelectItem>
                  <SelectItem value="Emergency">Emergency</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Row 2 */}
            <div>
              <label className="text-sm text-gray-600 mb-2 block">To:</label>
              <Input
                type="date"
                value={leaveFilters.toDate}
                onChange={(e) => setLeaveFilters({ ...leaveFilters, toDate: e.target.value })}
                className="bg-white border-0 border-b-2 border-b-[#0b1f3b] rounded-none focus:ring-0 shadow-none"
                data-testid="leave-filter-to"
              />
            </div>
            <div>
              <label className="text-sm text-gray-600 mb-2 block">Team Name:</label>
              <Select value={leaveFilters.team} onValueChange={(v) => setLeaveFilters({ ...leaveFilters, team: v })}>
                <SelectTrigger className="bg-white border-0 border-b-2 border-b-[#0b1f3b] rounded-none shadow-none" data-testid="leave-filter-team">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="All Team">All Team</SelectItem>
                  {teams.map((team) => (
                    <SelectItem key={team.id} value={team.name}>{team.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <label className="text-sm text-gray-600 mb-2 block">Department:</label>
              <Select value={leaveFilters.department} onValueChange={(v) => setLeaveFilters({ ...leaveFilters, department: v })}>
                <SelectTrigger className="bg-white border-0 border-b-2 border-b-[#0b1f3b] rounded-none shadow-none" data-testid="leave-filter-dept">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Department">Department</SelectItem>
                  {departments.map((dept) => (
                    <SelectItem key={dept.id} value={dept.name}>{dept.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Buttons */}
            <div className="lg:col-span-3 flex justify-end gap-4 mt-6">
              <Button 
                onClick={handleExport}
                disabled={loading}
                className="bg-[#0b1f3b] hover:bg-[#2563eb] text-white px-8 rounded-lg"
                data-testid="export-btn"
              >
                {loading ? 'Exporting...' : 'Export'}
              </Button>
              <Button 
                onClick={handleReset}
                className="bg-gray-500 hover:bg-gray-600 text-white px-8 rounded-lg"
                data-testid="reset-btn"
              >
                Reset
              </Button>
            </div>
          </div>
        )}

        {/* Attendance Report Filters */}
        {activeTab === 'attendance' && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-x-8 gap-y-8">
            {/* Row 1 */}
            <div>
              <label className="text-sm text-gray-600 mb-2 block">From:</label>
              <Input
                type="date"
                value={attendanceFilters.fromDate}
                onChange={(e) => setAttendanceFilters({ ...attendanceFilters, fromDate: e.target.value })}
                className="bg-white border-0 border-b-2 border-b-[#0b1f3b] rounded-none focus:ring-0 shadow-none"
                data-testid="attendance-filter-from"
              />
            </div>
            <div>
              <label className="text-sm text-gray-600 mb-2 block">Emp Name:</label>
              <Input
                type="text"
                placeholder="Employee Name"
                value={attendanceFilters.empName}
                onChange={(e) => setAttendanceFilters({ ...attendanceFilters, empName: e.target.value })}
                className="bg-white border-0 border-b-2 border-b-[#0b1f3b] rounded-none focus:ring-0 shadow-none"
                data-testid="attendance-filter-empname"
              />
            </div>
            <div>
              <label className="text-sm text-gray-600 mb-2 block">Status:</label>
              <Select value={attendanceFilters.status} onValueChange={(v) => setAttendanceFilters({ ...attendanceFilters, status: v })}>
                <SelectTrigger className="bg-white border-0 border-b-2 border-b-[#0b1f3b] rounded-none shadow-none" data-testid="attendance-filter-status">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="All Types">All Types</SelectItem>
                  <SelectItem value="Login">Login</SelectItem>
                  <SelectItem value="Logout">Logout</SelectItem>
                  <SelectItem value="Late">Late</SelectItem>
                  <SelectItem value="Leave">Leave</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Row 2 */}
            <div>
              <label className="text-sm text-gray-600 mb-2 block">To:</label>
              <Input
                type="date"
                value={attendanceFilters.toDate}
                onChange={(e) => setAttendanceFilters({ ...attendanceFilters, toDate: e.target.value })}
                className="bg-white border-0 border-b-2 border-b-[#0b1f3b] rounded-none focus:ring-0 shadow-none"
                data-testid="attendance-filter-to"
              />
            </div>
            <div>
              <label className="text-sm text-gray-600 mb-2 block">Team Name:</label>
              <Select value={attendanceFilters.team} onValueChange={(v) => setAttendanceFilters({ ...attendanceFilters, team: v })}>
                <SelectTrigger className="bg-white border-0 border-b-2 border-b-[#0b1f3b] rounded-none shadow-none" data-testid="attendance-filter-team">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="All Team">All Team</SelectItem>
                  {teams.map((team) => (
                    <SelectItem key={team.id} value={team.name}>{team.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <label className="text-sm text-gray-600 mb-2 block">Department:</label>
              <Select value={attendanceFilters.department} onValueChange={(v) => setAttendanceFilters({ ...attendanceFilters, department: v })}>
                <SelectTrigger className="bg-white border-0 border-b-2 border-b-[#0b1f3b] rounded-none shadow-none" data-testid="attendance-filter-dept">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Department">Department</SelectItem>
                  {departments.map((dept) => (
                    <SelectItem key={dept.id} value={dept.name}>{dept.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Buttons */}
            <div className="lg:col-span-3 flex justify-end gap-4 mt-6">
              <Button 
                onClick={handleExport}
                disabled={loading}
                className="bg-[#3b82f6] hover:bg-[#2563eb] text-white px-8 rounded-lg"
                data-testid="export-btn"
              >
                {loading ? 'Exporting...' : 'Export'}
              </Button>
              <Button 
                onClick={handleReset}
                className="bg-gray-500 hover:bg-gray-600 text-white px-8 rounded-lg"
                data-testid="reset-btn"
              >
                Reset
              </Button>
            </div>
          </div>
        )}
      </div>

      {/* Report Results */}
      {reportData.length > 0 && (
        <div className="bg-[#fffdf7] rounded-lg border border-black/5 overflow-hidden">
          <div className="p-4 border-b border-black/5 flex items-center justify-between">
            <h3 className="font-semibold" style={{ fontFamily: 'Outfit, sans-serif' }}>
              {activeTab === 'leave' ? 'Leave' : 'Attendance'} Report Results
            </h3>
            <Badge className="bg-blue-100 text-blue-700">
              {reportData.length} records
            </Badge>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50/50">
                {activeTab === 'attendance' ? (
                  <tr>
                    <th className="px-4 py-4 text-left text-xs font-semibold text-gray-600 uppercase">Employee</th>
                    <th className="px-4 py-4 text-left text-xs font-semibold text-gray-600 uppercase">Team</th>
                    <th className="px-4 py-4 text-left text-xs font-semibold text-gray-600 uppercase">Date</th>
                    <th className="px-4 py-4 text-left text-xs font-semibold text-gray-600 uppercase">Check-In</th>
                    <th className="px-4 py-4 text-left text-xs font-semibold text-gray-600 uppercase">Check-Out</th>
                    <th className="px-4 py-4 text-left text-xs font-semibold text-gray-600 uppercase">Status</th>
                  </tr>
                ) : (
                  <tr>
                    <th className="px-4 py-4 text-left text-xs font-semibold text-gray-600 uppercase">Employee</th>
                    <th className="px-4 py-4 text-left text-xs font-semibold text-gray-600 uppercase">Team</th>
                    <th className="px-4 py-4 text-left text-xs font-semibold text-gray-600 uppercase">Type</th>
                    <th className="px-4 py-4 text-left text-xs font-semibold text-gray-600 uppercase">Start Date</th>
                    <th className="px-4 py-4 text-left text-xs font-semibold text-gray-600 uppercase">End Date</th>
                    <th className="px-4 py-4 text-left text-xs font-semibold text-gray-600 uppercase">Duration</th>
                    <th className="px-4 py-4 text-left text-xs font-semibold text-gray-600 uppercase">Status</th>
                  </tr>
                )}
              </thead>
              <tbody className="divide-y divide-gray-100">
                {activeTab === 'attendance' ? (
                  reportData.map((record, index) => (
                    <tr key={index} className="hover:bg-gray-50/50">
                      <td className="px-4 py-4 text-sm font-medium text-gray-900">{record.emp_name}</td>
                      <td className="px-4 py-4 text-sm text-gray-600">{record.team}</td>
                      <td className="px-4 py-4 text-sm text-gray-600">{record.date}</td>
                      <td className="px-4 py-4 text-sm text-gray-600">{record.check_in || '-'}</td>
                      <td className="px-4 py-4 text-sm text-gray-600">{record.check_out || '-'}</td>
                      <td className="px-4 py-4">
                        <Badge className={getStatusBadge(record.status)}>{record.status}</Badge>
                      </td>
                    </tr>
                  ))
                ) : (
                  reportData.map((record, index) => (
                    <tr key={index} className="hover:bg-gray-50/50">
                      <td className="px-4 py-4 text-sm font-medium text-gray-900">{record.emp_name}</td>
                      <td className="px-4 py-4 text-sm text-gray-600">{record.team}</td>
                      <td className="px-4 py-4 text-sm text-gray-600">{record.leave_type}</td>
                      <td className="px-4 py-4 text-sm text-gray-600">{record.start_date}</td>
                      <td className="px-4 py-4 text-sm text-gray-600">{record.end_date}</td>
                      <td className="px-4 py-4 text-sm text-gray-600">{record.duration}</td>
                      <td className="px-4 py-4">
                        <Badge className={getStatusBadge(record.status)}>{record.status}</Badge>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
};

export default Reports;
