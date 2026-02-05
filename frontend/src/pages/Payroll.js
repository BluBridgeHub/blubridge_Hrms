import { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import axios from 'axios';
import { toast } from 'sonner';
import { Download, ChevronLeft, ChevronRight, DollarSign, Users, AlertTriangle, Clock, Calendar } from 'lucide-react';
import { Button } from '../components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../components/ui/select';
import { Badge } from '../components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../components/ui/tabs';
import { MonthPicker } from '../components/ui/month-picker';

const API = `${process.env.REACT_APP_BACKEND_URL}/api`;

const Payroll = () => {
  const { getAuthHeaders } = useAuth();
  const [payrollData, setPayrollData] = useState([]);
  const [summary, setSummary] = useState(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('attendance');
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
      const headers = getAuthHeaders();
      
      // Fetch payroll data for the month
      const payrollRes = await axios.get(`${API}/payroll`, { 
        headers,
        params: { month: selectedMonth }
      });
      
      // Fetch summary
      const summaryRes = await axios.get(`${API}/payroll/summary/${selectedMonth}`, { 
        headers
      });
      
      setPayrollData(payrollRes.data || []);
      setSummary(summaryRes.data || null);
    } catch (error) {
      console.error('Payroll fetch error:', error);
      toast.error('Failed to load payroll data');
    } finally {
      setLoading(false);
    }
  };

  // Get attendance status display
  const getStatusDisplay = (status, isLop) => {
    if (status === 'Sunday') return { code: 'Su', color: 'text-gray-400', bg: 'bg-gray-50' };
    if (isLop || status === 'Loss of Pay') return { code: 'LOP', color: 'text-red-600 font-bold', bg: 'bg-red-50' };
    if (status === 'Present' || status === 'Completed') return { code: 'P', color: 'text-green-600 font-semibold', bg: '' };
    if (status === 'Late Login') return { code: 'LOP', color: 'text-red-600 font-bold', bg: 'bg-red-50' };
    if (status === 'Early Out') return { code: 'LOP', color: 'text-red-600 font-bold', bg: 'bg-red-50' };
    if (status === 'Leave') return { code: 'L', color: 'text-purple-600 font-semibold', bg: 'bg-purple-50' };
    if (status === 'Absent') return { code: 'A', color: 'text-orange-600 font-semibold', bg: 'bg-orange-50' };
    return { code: 'NA', color: 'text-gray-400', bg: '' };
  };

  // Export to CSV
  const handleExportCSV = () => {
    if (activeTab === 'attendance') {
      const headers = ['Sl.No', 'Emp ID', 'Name', 'Department', 'Shift', ...days.map(d => `${String(d.day).padStart(2, '0')} ${d.dayName}`)];
      
      const rows = payrollData.map((emp, index) => {
        const dayStatuses = days.map(day => {
          const detail = emp.attendance_details?.find(a => a.date === day.date);
          const status = getStatusDisplay(detail?.status, detail?.is_lop);
          return status.code;
        });
        return [index + 1, emp.emp_id, emp.emp_name, emp.department, emp.shift_type, ...dayStatuses];
      });
      
      const csv = [headers, ...rows].map(row => row.join(',')).join('\n');
      const blob = new Blob([csv], { type: 'text/csv' });
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `payroll-attendance-${selectedMonth}.csv`;
      a.click();
    } else {
      const headers = ['Sl.No', 'Emp ID', 'Name', 'Department', 'Monthly Salary', 'Working Days', 'Present', 'LOP Days', 'Leave', 'Absent', 'LOP Deduction', 'Net Salary'];
      
      const rows = payrollData.map((emp, index) => [
        index + 1,
        emp.emp_id,
        emp.emp_name,
        emp.department,
        emp.monthly_salary,
        emp.working_days,
        emp.present_days,
        emp.lop_days,
        emp.leave_days,
        emp.absent_days,
        emp.lop_deduction,
        emp.net_salary
      ]);
      
      const csv = [headers, ...rows].map(row => row.join(',')).join('\n');
      const blob = new Blob([csv], { type: 'text/csv' });
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `payroll-salary-${selectedMonth}.csv`;
      a.click();
    }
    toast.success('CSV exported');
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
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-[#0b1f3b]" style={{ fontFamily: 'Outfit, sans-serif' }}>
          Payroll Management ({formatMonthDisplay()})
        </h1>
        <div className="flex items-center gap-4">
          <MonthPicker
            value={selectedMonth}
            onChange={setSelectedMonth}
            className="w-40"
            data-testid="month-select"
          />
          <Button 
            onClick={handleExportCSV}
            className="bg-[#0b1f3b] hover:bg-[#162d4d] text-white"
            data-testid="export-csv-btn"
          >
            <Download className="w-4 h-4 mr-2" />
            Export CSV
          </Button>
        </div>
      </div>

      {/* Summary Cards */}
      {summary && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
          <div className="bg-[#fffdf7] rounded-xl border border-black/5 p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-blue-100 rounded-lg">
                <Users className="w-5 h-5 text-blue-600" />
              </div>
              <div>
                <p className="text-sm text-gray-500">Total Employees</p>
                <p className="text-xl font-bold text-[#0b1f3b]">{summary.total_employees}</p>
              </div>
            </div>
          </div>
          
          <div className="bg-[#fffdf7] rounded-xl border border-black/5 p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-green-100 rounded-lg">
                <DollarSign className="w-5 h-5 text-green-600" />
              </div>
              <div>
                <p className="text-sm text-gray-500">Total Salary</p>
                <p className="text-xl font-bold text-[#0b1f3b]">₹{summary.total_salary?.toLocaleString()}</p>
              </div>
            </div>
          </div>
          
          <div className="bg-[#fffdf7] rounded-xl border border-black/5 p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-red-100 rounded-lg">
                <AlertTriangle className="w-5 h-5 text-red-600" />
              </div>
              <div>
                <p className="text-sm text-gray-500">LOP Deductions</p>
                <p className="text-xl font-bold text-red-600">₹{summary.total_deductions?.toLocaleString()}</p>
              </div>
            </div>
          </div>
          
          <div className="bg-[#fffdf7] rounded-xl border border-black/5 p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-emerald-100 rounded-lg">
                <DollarSign className="w-5 h-5 text-emerald-600" />
              </div>
              <div>
                <p className="text-sm text-gray-500">Net Payable</p>
                <p className="text-xl font-bold text-emerald-600">₹{summary.total_net_salary?.toLocaleString()}</p>
              </div>
            </div>
          </div>
          
          <div className="bg-[#fffdf7] rounded-xl border border-black/5 p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-amber-100 rounded-lg">
                <Calendar className="w-5 h-5 text-amber-600" />
              </div>
              <div>
                <p className="text-sm text-gray-500">Total LOP Days</p>
                <p className="text-xl font-bold text-amber-600">{summary.total_lop_days}</p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="bg-[#fffdf7] border border-black/5">
          <TabsTrigger value="attendance" className="data-[state=active]:bg-[#0b1f3b] data-[state=active]:text-white">
            Attendance View
          </TabsTrigger>
          <TabsTrigger value="salary" className="data-[state=active]:bg-[#0b1f3b] data-[state=active]:text-white">
            Salary View
          </TabsTrigger>
        </TabsList>

        {/* Attendance View */}
        <TabsContent value="attendance" className="mt-4">
          <div className="bg-[#fffdf7] rounded-xl border border-black/5 overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full border-collapse min-w-max">
                <thead>
                  <tr className="bg-[#d6e4f0]">
                    <th className="px-3 py-3 text-left text-xs font-semibold text-gray-700 border-r border-gray-200 sticky left-0 bg-[#d6e4f0] z-10 min-w-[50px]">
                      Sl
                    </th>
                    <th className="px-3 py-3 text-left text-xs font-semibold text-gray-700 border-r border-gray-200 sticky left-[50px] bg-[#d6e4f0] z-10 min-w-[140px]">
                      Name
                    </th>
                    <th className="px-3 py-3 text-left text-xs font-semibold text-gray-700 border-r border-gray-200 sticky left-[190px] bg-[#d6e4f0] z-10 min-w-[80px]">
                      Shift
                    </th>
                    {days.map((day) => (
                      <th 
                        key={day.day} 
                        className={`px-1 py-2 text-center text-xs font-medium border-r border-gray-200 min-w-[36px] ${
                          day.isSunday ? 'bg-gray-100 text-gray-500' : 'text-gray-700'
                        }`}
                      >
                        <div>{String(day.day).padStart(2, '0')}</div>
                        <div className="text-[10px]">{day.dayName}</div>
                      </th>
                    ))}
                    <th className="px-3 py-3 text-center text-xs font-semibold text-gray-700 border-r border-gray-200 min-w-[50px] bg-green-100">
                      P
                    </th>
                    <th className="px-3 py-3 text-center text-xs font-semibold text-gray-700 border-r border-gray-200 min-w-[50px] bg-red-100">
                      LOP
                    </th>
                    <th className="px-3 py-3 text-center text-xs font-semibold text-gray-700 min-w-[50px] bg-orange-100">
                      A
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {payrollData.length === 0 ? (
                    <tr>
                      <td colSpan={6 + days.length} className="px-4 py-12 text-center text-gray-500">
                        No employees found
                      </td>
                    </tr>
                  ) : (
                    payrollData.map((employee, index) => (
                      <tr key={employee.employee_id} className="border-t border-gray-100 hover:bg-gray-50/50">
                        <td className="px-3 py-2 text-sm text-gray-600 border-r border-gray-100 sticky left-0 bg-white z-10">
                          {index + 1}
                        </td>
                        <td className="px-3 py-2 text-sm font-medium text-gray-900 border-r border-gray-100 sticky left-[50px] bg-white z-10">
                          <div>{employee.emp_name}</div>
                          <div className="text-xs text-gray-500">{employee.emp_id}</div>
                        </td>
                        <td className="px-3 py-2 text-xs text-gray-600 border-r border-gray-100 sticky left-[190px] bg-white z-10">
                          {employee.shift_type}
                        </td>
                        {days.map((day) => {
                          const detail = employee.attendance_details?.find(a => a.date === day.date);
                          const status = getStatusDisplay(detail?.status, detail?.is_lop);
                          return (
                            <td 
                              key={day.day} 
                              className={`px-1 py-2 text-center text-xs border-r border-gray-100 ${status.bg} ${
                                day.isSunday ? 'bg-gray-50' : ''
                              }`}
                              title={detail?.is_lop ? `LOP: ${detail?.check_in || 'No check-in'} - ${detail?.check_out || 'No check-out'}` : ''}
                            >
                              <span className={status.color}>{status.code}</span>
                            </td>
                          );
                        })}
                        <td className="px-3 py-2 text-center text-sm font-semibold text-green-600 border-r border-gray-100 bg-green-50">
                          {employee.present_days}
                        </td>
                        <td className="px-3 py-2 text-center text-sm font-semibold text-red-600 border-r border-gray-100 bg-red-50">
                          {employee.lop_days}
                        </td>
                        <td className="px-3 py-2 text-center text-sm font-semibold text-orange-600 bg-orange-50">
                          {employee.absent_days}
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>

          {/* Legend */}
          <div className="flex flex-wrap gap-4 text-xs mt-4">
            <div className="flex items-center gap-1">
              <span className="text-green-600 font-semibold">P</span>
              <span className="text-gray-600">- Present</span>
            </div>
            <div className="flex items-center gap-1">
              <span className="text-red-600 font-bold">LOP</span>
              <span className="text-gray-600">- Loss of Pay (Late Login/Early Out)</span>
            </div>
            <div className="flex items-center gap-1">
              <span className="text-purple-600 font-semibold">L</span>
              <span className="text-gray-600">- Leave</span>
            </div>
            <div className="flex items-center gap-1">
              <span className="text-orange-600 font-semibold">A</span>
              <span className="text-gray-600">- Absent</span>
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
        </TabsContent>

        {/* Salary View */}
        <TabsContent value="salary" className="mt-4">
          <div className="bg-[#fffdf7] rounded-xl border border-black/5 overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-[#d6e4f0]">
                  <tr>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-gray-700">Sl</th>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-gray-700">Employee</th>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-gray-700">Department</th>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-gray-700">Shift</th>
                    <th className="px-4 py-3 text-right text-xs font-semibold text-gray-700">Monthly Salary</th>
                    <th className="px-4 py-3 text-center text-xs font-semibold text-gray-700">Working Days</th>
                    <th className="px-4 py-3 text-center text-xs font-semibold text-gray-700">Present</th>
                    <th className="px-4 py-3 text-center text-xs font-semibold text-gray-700 text-red-600">LOP Days</th>
                    <th className="px-4 py-3 text-center text-xs font-semibold text-gray-700">Leave</th>
                    <th className="px-4 py-3 text-center text-xs font-semibold text-gray-700">Absent</th>
                    <th className="px-4 py-3 text-right text-xs font-semibold text-gray-700">Per Day</th>
                    <th className="px-4 py-3 text-right text-xs font-semibold text-red-600">LOP Deduction</th>
                    <th className="px-4 py-3 text-right text-xs font-semibold text-emerald-600">Net Salary</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {payrollData.length === 0 ? (
                    <tr>
                      <td colSpan="13" className="px-4 py-12 text-center text-gray-500">
                        No payroll data found
                      </td>
                    </tr>
                  ) : (
                    payrollData.map((employee, index) => (
                      <tr key={employee.employee_id} className="hover:bg-gray-50/50">
                        <td className="px-4 py-3 text-sm text-gray-600">{index + 1}</td>
                        <td className="px-4 py-3">
                          <div className="text-sm font-medium text-gray-900">{employee.emp_name}</div>
                          <div className="text-xs text-gray-500">{employee.emp_id}</div>
                        </td>
                        <td className="px-4 py-3 text-sm text-gray-600">{employee.department}</td>
                        <td className="px-4 py-3 text-sm text-gray-600">{employee.shift_type}</td>
                        <td className="px-4 py-3 text-sm text-right font-medium">₹{employee.monthly_salary?.toLocaleString()}</td>
                        <td className="px-4 py-3 text-sm text-center">{employee.working_days}</td>
                        <td className="px-4 py-3 text-sm text-center text-green-600 font-semibold">{employee.present_days}</td>
                        <td className="px-4 py-3 text-sm text-center">
                          {employee.lop_days > 0 ? (
                            <Badge className="bg-red-100 text-red-700">{employee.lop_days}</Badge>
                          ) : (
                            <span className="text-gray-400">0</span>
                          )}
                        </td>
                        <td className="px-4 py-3 text-sm text-center text-purple-600">{employee.leave_days}</td>
                        <td className="px-4 py-3 text-sm text-center text-orange-600">{employee.absent_days}</td>
                        <td className="px-4 py-3 text-sm text-right text-gray-600">₹{employee.per_day_salary?.toLocaleString()}</td>
                        <td className="px-4 py-3 text-sm text-right font-semibold text-red-600">
                          {employee.lop_deduction > 0 ? `-₹${employee.lop_deduction?.toLocaleString()}` : '-'}
                        </td>
                        <td className="px-4 py-3 text-sm text-right font-bold text-emerald-600">
                          ₹{employee.net_salary?.toLocaleString()}
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
                {payrollData.length > 0 && (
                  <tfoot className="bg-gray-50 font-semibold">
                    <tr>
                      <td colSpan="4" className="px-4 py-3 text-sm text-right">Total:</td>
                      <td className="px-4 py-3 text-sm text-right">₹{summary?.total_salary?.toLocaleString()}</td>
                      <td className="px-4 py-3 text-sm text-center">-</td>
                      <td className="px-4 py-3 text-sm text-center text-green-600">{summary?.total_present_days}</td>
                      <td className="px-4 py-3 text-sm text-center text-red-600">{summary?.total_lop_days}</td>
                      <td colSpan="3" className="px-4 py-3"></td>
                      <td className="px-4 py-3 text-sm text-right text-red-600">-₹{summary?.total_deductions?.toLocaleString()}</td>
                      <td className="px-4 py-3 text-sm text-right text-emerald-600">₹{summary?.total_net_salary?.toLocaleString()}</td>
                    </tr>
                  </tfoot>
                )}
              </table>
            </div>
          </div>

          {/* Info Box */}
          <div className="mt-4 p-4 bg-amber-50 rounded-xl border border-amber-200">
            <h3 className="font-semibold text-amber-800 mb-2 flex items-center gap-2">
              <AlertTriangle className="w-4 h-4" />
              LOP Calculation Rules (Strict - No Grace Period)
            </h3>
            <ul className="text-sm text-amber-700 space-y-1 list-disc list-inside">
              <li><strong>Late Login:</strong> Even 1 minute late after shift start time = LOP</li>
              <li><strong>Early Logout:</strong> Even 1 minute early before shift end time = LOP</li>
              <li><strong>Insufficient Hours:</strong> Total hours less than required = LOP</li>
              <li><strong>Deduction Formula:</strong> LOP Deduction = (Monthly Salary / 30) × (LOP Days + Absent Days)</li>
            </ul>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default Payroll;
