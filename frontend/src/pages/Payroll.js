import { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import axios from 'axios';
import { toast } from 'sonner';
import { Download, ChevronLeft, ChevronRight } from 'lucide-react';
import { Button } from '../components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../components/ui/select';

const API = `${process.env.REACT_APP_BACKEND_URL}/api`;

const Payroll = () => {
  const { getAuthHeaders } = useAuth();
  const [employees, setEmployees] = useState([]);
  const [attendance, setAttendance] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedMonth, setSelectedMonth] = useState(() => {
    const now = new Date();
    return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
  });

  // Get days in selected month
  const getDaysInMonth = () => {
    const [year, month] = selectedMonth.split('-').map(Number);
    const daysInMonth = new Date(year, month, 0).getDate();
    const days = [];
    
    for (let d = 1; d <= daysInMonth; d++) {
      const date = new Date(year, month - 1, d);
      const dayName = date.toLocaleDateString('en-US', { weekday: 'short' });
      days.push({
        day: d,
        dayName: dayName,
        isSunday: date.getDay() === 0,
        date: `${String(d).padStart(2, '0')}-${String(month).padStart(2, '0')}-${year}`
      });
    }
    return days;
  };

  const days = getDaysInMonth();

  // Format month for display
  const formatMonthDisplay = () => {
    const [year, month] = selectedMonth.split('-').map(Number);
    const firstDay = new Date(year, month - 1, 1);
    const lastDay = new Date(year, month, 0);
    const monthName = firstDay.toLocaleDateString('en-US', { month: 'short' });
    return `${String(1).padStart(2, '0')} ${monthName} ${year} To ${lastDay.getDate()} ${monthName} ${year}`;
  };

  useEffect(() => {
    fetchData();
  }, [selectedMonth]);

  const fetchData = async () => {
    try {
      setLoading(true);
      const [year, month] = selectedMonth.split('-');
      
      // Fetch employees
      const employeesRes = await axios.get(`${API}/employees`, {
        headers: getAuthHeaders(),
        params: { department: 'Research Unit' }
      });
      
      // Fetch attendance for the month
      const firstDay = `01-${month}-${year}`;
      const lastDay = `${new Date(parseInt(year), parseInt(month), 0).getDate()}-${month}-${year}`;
      
      const attendanceRes = await axios.get(`${API}/attendance`, {
        headers: getAuthHeaders(),
        params: { from_date: firstDay, to_date: lastDay }
      });
      
      setEmployees(employeesRes.data.filter(e => e.department === 'Research Unit'));
      setAttendance(attendanceRes.data);
    } catch (error) {
      console.error('Payroll fetch error:', error);
      toast.error('Failed to load payroll data');
    } finally {
      setLoading(false);
    }
  };

  // Get attendance status for employee on a specific day
  const getAttendanceStatus = (employeeId, dayInfo) => {
    if (dayInfo.isSunday) return { code: 'Su', color: 'text-gray-400', bg: '' };
    
    const record = attendance.find(a => 
      a.employee_id === employeeId && a.date === dayInfo.date
    );
    
    if (!record) return { code: 'NA', color: 'text-gray-400', bg: '' };
    
    const status = record.status;
    
    if (status === 'Login' || status === 'Completed' || status === 'Present') {
      return { code: 'P', color: 'text-green-600 font-semibold', bg: '' };
    }
    if (status === 'Late Login' || status === 'Late') {
      return { code: 'LC', color: 'text-blue-600 font-semibold', bg: '' };
    }
    if (status === 'Early Out') {
      return { code: 'HD', color: 'text-orange-500 font-semibold', bg: '' };
    }
    if (status === 'Absent') {
      return { code: 'A', color: 'text-red-600 font-semibold', bg: '' };
    }
    if (status === 'Leave') {
      return { code: 'L', color: 'text-purple-600 font-semibold', bg: '' };
    }
    
    return { code: 'NA', color: 'text-gray-400', bg: '' };
  };

  // Export to CSV
  const handleExportCSV = () => {
    const headers = ['Sl.No', 'Name', 'Department', ...days.map(d => `${String(d.day).padStart(2, '0')} ${d.dayName}`)];
    
    const rows = employees.map((emp, index) => {
      const dayStatuses = days.map(day => {
        const status = getAttendanceStatus(emp.id, day);
        return status.code;
      });
      return [index + 1, emp.full_name, emp.department, ...dayStatuses];
    });
    
    const csv = [headers, ...rows].map(row => row.join(',')).join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `payroll-attendance-${selectedMonth}.csv`;
    a.click();
    toast.success('CSV exported');
  };

  // Generate month options
  const getMonthOptions = () => {
    const options = [];
    const now = new Date();
    for (let i = 0; i < 12; i++) {
      const date = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const value = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
      const label = date.toLocaleDateString('en-US', { month: 'short', year: 'numeric' });
      options.push({ value, label });
    }
    return options;
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64 bg-[#efede5]">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#0b1f3b]"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-fade-in bg-[#efede5] min-h-screen p-6" data-testid="payroll-page">
      {/* Page Header */}
      <h1 className="text-2xl font-bold text-[#3b82f6]" style={{ fontFamily: 'Outfit, sans-serif' }}>
        Payroll Attendance ({formatMonthDisplay()})
      </h1>

      {/* Controls */}
      <div className="flex items-center gap-4 flex-wrap">
        <div className="flex items-center gap-2">
          <span className="text-sm font-medium text-gray-700">Payroll Month:</span>
          <Select value={selectedMonth} onValueChange={setSelectedMonth}>
            <SelectTrigger className="w-40 bg-white border-gray-300" data-testid="month-select">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {getMonthOptions().map(opt => (
                <SelectItem key={opt.value} value={opt.value}>{opt.label}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        
        <Button 
          onClick={handleExportCSV}
          className="bg-[#0b1f3b] hover:bg-[#162d4d] text-white"
          data-testid="export-csv-btn"
        >
          Export CSV
        </Button>
      </div>

      {/* Attendance Table */}
      <div className="bg-[#fffdf7] rounded-xl border border-black/5 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full border-collapse min-w-max">
            <thead>
              <tr className="bg-[#d6e4f0]">
                <th className="px-3 py-3 text-left text-xs font-semibold text-gray-700 border-r border-gray-200 sticky left-0 bg-[#d6e4f0] z-10 min-w-[60px]">
                  Sl.No
                </th>
                <th className="px-3 py-3 text-left text-xs font-semibold text-gray-700 border-r border-gray-200 sticky left-[60px] bg-[#d6e4f0] z-10 min-w-[140px]">
                  Name
                </th>
                <th className="px-3 py-3 text-left text-xs font-semibold text-gray-700 border-r border-gray-200 sticky left-[200px] bg-[#d6e4f0] z-10 min-w-[120px]">
                  Department
                </th>
                {days.map((day) => (
                  <th 
                    key={day.day} 
                    className={`px-2 py-2 text-center text-xs font-medium border-r border-gray-200 min-w-[36px] ${
                      day.isSunday ? 'bg-gray-100 text-gray-500' : 'text-gray-700'
                    }`}
                  >
                    <div>{String(day.day).padStart(2, '0')}</div>
                    <div className="text-[10px]">{day.dayName}</div>
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {employees.length === 0 ? (
                <tr>
                  <td colSpan={3 + days.length} className="px-4 py-12 text-center text-gray-500">
                    No employees found
                  </td>
                </tr>
              ) : (
                employees.map((employee, index) => (
                  <tr key={employee.id} className="border-t border-gray-100 hover:bg-gray-50/50">
                    <td className="px-3 py-3 text-sm text-gray-600 border-r border-gray-100 sticky left-0 bg-white z-10">
                      {index + 1}
                    </td>
                    <td className="px-3 py-3 text-sm font-medium text-gray-900 border-r border-gray-100 sticky left-[60px] bg-white z-10">
                      {employee.full_name}
                    </td>
                    <td className="px-3 py-3 text-sm text-gray-600 border-r border-gray-100 sticky left-[200px] bg-white z-10">
                      {employee.department}
                    </td>
                    {days.map((day) => {
                      const status = getAttendanceStatus(employee.id, day);
                      return (
                        <td 
                          key={day.day} 
                          className={`px-2 py-3 text-center text-xs border-r border-gray-100 ${
                            day.isSunday ? 'bg-gray-50' : ''
                          }`}
                        >
                          <span className={status.color}>{status.code}</span>
                        </td>
                      );
                    })}
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Legend */}
      <div className="flex flex-wrap gap-4 text-xs">
        <div className="flex items-center gap-1">
          <span className="text-green-600 font-semibold">P</span>
          <span className="text-gray-600">- Present</span>
        </div>
        <div className="flex items-center gap-1">
          <span className="text-blue-600 font-semibold">LC</span>
          <span className="text-gray-600">- Late Coming</span>
        </div>
        <div className="flex items-center gap-1">
          <span className="text-orange-500 font-semibold">HD</span>
          <span className="text-gray-600">- Half Day</span>
        </div>
        <div className="flex items-center gap-1">
          <span className="text-red-600 font-semibold">A</span>
          <span className="text-gray-600">- Absent</span>
        </div>
        <div className="flex items-center gap-1">
          <span className="text-purple-600 font-semibold">L</span>
          <span className="text-gray-600">- Leave</span>
        </div>
        <div className="flex items-center gap-1">
          <span className="text-gray-400">Su</span>
          <span className="text-gray-600">- Sunday</span>
        </div>
        <div className="flex items-center gap-1">
          <span className="text-gray-400">NA</span>
          <span className="text-gray-600">- Not Available</span>
        </div>
      </div>
    </div>
  );
};

export default Payroll;
