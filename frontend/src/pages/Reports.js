import { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import axios from 'axios';
import { toast } from 'sonner';
import { 
  FileText, 
  Download,
  Filter,
  RotateCcw,
  CalendarCheck,
  CalendarDays,
  ClipboardList
} from 'lucide-react';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../components/ui/select';
import { Badge } from '../components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../components/ui/tabs';

const API = `${process.env.REACT_APP_BACKEND_URL}/api`;

const Reports = () => {
  const { getAuthHeaders } = useAuth();
  const [activeReport, setActiveReport] = useState('attendance');
  const [teams, setTeams] = useState([]);
  const [departments, setDepartments] = useState([]);
  const [loading, setLoading] = useState(false);
  const [reportData, setReportData] = useState([]);
  const [filters, setFilters] = useState({
    fromDate: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
    toDate: new Date().toISOString().split('T')[0],
    department: 'All',
    team: 'All'
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

  const fetchReport = async () => {
    try {
      setLoading(true);
      const endpoint = activeReport === 'attendance' ? '/reports/attendance' : '/reports/leaves';
      const response = await axios.get(`${API}${endpoint}`, {
        headers: getAuthHeaders(),
        params: {
          from_date: filters.fromDate,
          to_date: filters.toDate,
          department: filters.department !== 'All' ? filters.department : undefined,
          team: filters.team !== 'All' ? filters.team : undefined
        }
      });
      setReportData(response.data);
      toast.success('Report generated');
    } catch (error) {
      toast.error('Failed to generate report');
    } finally {
      setLoading(false);
    }
  };

  const handleReset = () => {
    setFilters({
      fromDate: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
      toDate: new Date().toISOString().split('T')[0],
      department: 'All',
      team: 'All'
    });
    setReportData([]);
  };

  const handleExportCSV = () => {
    if (reportData.length === 0) {
      toast.error('No data to export');
      return;
    }

    let headers, rows;
    if (activeReport === 'attendance') {
      headers = ['Employee Name', 'Team', 'Date', 'Check-In', 'Check-Out', 'Status'];
      rows = reportData.map(r => [r.emp_name, r.team, r.date, r.check_in || '-', r.check_out || '-', r.status]);
    } else {
      headers = ['Employee Name', 'Team', 'Leave Type', 'Start Date', 'End Date', 'Duration', 'Status'];
      rows = reportData.map(r => [r.emp_name, r.team, r.leave_type, r.start_date, r.end_date, r.duration, r.status]);
    }

    const csv = [headers, ...rows].map(row => row.join(',')).join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${activeReport}-report-${filters.fromDate}-to-${filters.toDate}.csv`;
    a.click();
    toast.success('CSV exported');
  };

  const getStatusBadge = (status) => {
    const styles = {
      'Login': 'bg-emerald-100 text-emerald-700',
      'Completed': 'bg-blue-100 text-blue-700',
      'Not Logged': 'bg-gray-100 text-gray-700',
      'pending': 'bg-amber-100 text-amber-700',
      'approved': 'bg-emerald-100 text-emerald-700',
      'rejected': 'bg-red-100 text-red-700'
    };
    return styles[status] || 'bg-gray-100 text-gray-700';
  };

  return (
    <div className="space-y-6 animate-fade-in" data-testid="reports-page">
      {/* Page Header */}
      <div className="flex items-center gap-3">
        <FileText className="w-6 h-6 text-[#004EEB]" />
        <h1 className="text-2xl font-bold text-[#004EEB]" style={{ fontFamily: 'Outfit, sans-serif' }}>
          Reports
        </h1>
      </div>

      {/* Report Type Selection */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <button
          onClick={() => { setActiveReport('attendance'); setReportData([]); }}
          className={`p-6 rounded-xl border transition-all duration-200 text-left ${
            activeReport === 'attendance' 
              ? 'bg-[#004EEB] text-white border-[#004EEB]' 
              : 'bg-[#fffdf7] border-black/5 hover:border-[#004EEB]/30'
          }`}
          data-testid="report-attendance-btn"
        >
          <CalendarCheck className="w-8 h-8 mb-3" strokeWidth={1.5} />
          <h3 className="font-semibold" style={{ fontFamily: 'Outfit, sans-serif' }}>Attendance Report</h3>
          <p className={`text-sm mt-1 ${activeReport === 'attendance' ? 'text-white/80' : 'text-gray-500'}`}>
            Daily attendance records
          </p>
        </button>

        <button
          onClick={() => { setActiveReport('leaves'); setReportData([]); }}
          className={`p-6 rounded-xl border transition-all duration-200 text-left ${
            activeReport === 'leaves' 
              ? 'bg-[#004EEB] text-white border-[#004EEB]' 
              : 'bg-[#fffdf7] border-black/5 hover:border-[#004EEB]/30'
          }`}
          data-testid="report-leaves-btn"
        >
          <CalendarDays className="w-8 h-8 mb-3" strokeWidth={1.5} />
          <h3 className="font-semibold" style={{ fontFamily: 'Outfit, sans-serif' }}>Leave Report</h3>
          <p className={`text-sm mt-1 ${activeReport === 'leaves' ? 'text-white/80' : 'text-gray-500'}`}>
            Leave requests and history
          </p>
        </button>

        <button
          onClick={() => toast.info('Coming soon')}
          className="p-6 rounded-xl border border-black/5 bg-[#fffdf7] hover:border-[#004EEB]/30 transition-all duration-200 text-left opacity-60"
          data-testid="report-summary-btn"
        >
          <ClipboardList className="w-8 h-8 mb-3" strokeWidth={1.5} />
          <h3 className="font-semibold" style={{ fontFamily: 'Outfit, sans-serif' }}>Summary Report</h3>
          <p className="text-sm mt-1 text-gray-500">
            Monthly summary (Coming soon)
          </p>
        </button>
      </div>

      {/* Filter Section */}
      <div className="bg-[#fffdf7] rounded-xl border border-black/5 p-6">
        <h3 className="font-semibold mb-4" style={{ fontFamily: 'Outfit, sans-serif' }}>
          Generate Report
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <div>
            <label className="text-sm text-gray-600 mb-1 block">From Date:</label>
            <Input
              type="date"
              value={filters.fromDate}
              onChange={(e) => setFilters({ ...filters, fromDate: e.target.value })}
              className="bg-white"
              data-testid="filter-from"
            />
          </div>

          <div>
            <label className="text-sm text-gray-600 mb-1 block">To Date:</label>
            <Input
              type="date"
              value={filters.toDate}
              onChange={(e) => setFilters({ ...filters, toDate: e.target.value })}
              className="bg-white"
              data-testid="filter-to"
            />
          </div>

          <div>
            <label className="text-sm text-gray-600 mb-1 block">Department:</label>
            <Select value={filters.department} onValueChange={(v) => setFilters({ ...filters, department: v })}>
              <SelectTrigger className="bg-white" data-testid="filter-department">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="All">All Departments</SelectItem>
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
                <SelectItem value="All">All Teams</SelectItem>
                {teams.map((team) => (
                  <SelectItem key={team.id} value={team.name}>{team.name}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>

        <div className="flex gap-2 mt-4">
          <Button 
            onClick={fetchReport}
            disabled={loading}
            className="bg-[#004EEB] hover:bg-[#003cc9] text-white"
            data-testid="generate-report-btn"
          >
            {loading ? (
              <>
                <div className="w-4 h-4 mr-2 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                Generating...
              </>
            ) : (
              <>
                <Filter className="w-4 h-4 mr-2" />
                Generate Report
              </>
            )}
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
          {reportData.length > 0 && (
            <Button 
              onClick={handleExportCSV}
              className="bg-emerald-500 hover:bg-emerald-600 text-white ml-auto"
              data-testid="export-btn"
            >
              <Download className="w-4 h-4 mr-2" />
              Export CSV
            </Button>
          )}
        </div>
      </div>

      {/* Report Results */}
      {reportData.length > 0 && (
        <div className="bg-[#fffdf7] rounded-xl border border-black/5 overflow-hidden">
          <div className="p-4 border-b border-black/5 flex items-center justify-between">
            <h3 className="font-semibold" style={{ fontFamily: 'Outfit, sans-serif' }}>
              {activeReport === 'attendance' ? 'Attendance' : 'Leave'} Report Results
            </h3>
            <Badge className="bg-blue-100 text-blue-700">
              {reportData.length} records
            </Badge>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50/50">
                {activeReport === 'attendance' ? (
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
                {activeReport === 'attendance' ? (
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

      {reportData.length === 0 && !loading && (
        <div className="bg-[#fffdf7] rounded-xl border border-black/5 p-12 text-center">
          <FileText className="w-12 h-12 text-gray-300 mx-auto mb-4" />
          <p className="text-gray-500">Select filters and click "Generate Report" to view data</p>
        </div>
      )}
    </div>
  );
};

export default Reports;
