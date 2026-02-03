import { useState, useEffect, useCallback } from 'react';
import { useAuth } from '../contexts/AuthContext';
import axios from 'axios';
import { toast } from 'sonner';
import { 
  Users, 
  Search, 
  Plus,
  Eye,
  Edit,
  Trash2,
  RotateCcw,
  Download,
  Filter,
  ChevronLeft,
  ChevronRight,
  X,
  UserCheck,
  UserX,
  Briefcase
} from 'lucide-react';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../components/ui/select';
import { Badge } from '../components/ui/badge';
import { Switch } from '../components/ui/switch';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '../components/ui/dialog';
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetFooter,
} from '../components/ui/sheet';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../components/ui/tabs';

const API = `${process.env.REACT_APP_BACKEND_URL}/api`;

const StatCard = ({ title, value, icon: Icon, color }) => (
  <div className="bg-[#fffdf7] rounded-xl border border-black/5 p-4 flex items-center gap-4">
    <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${color}`}>
      <Icon className="w-6 h-6 text-white" strokeWidth={1.5} />
    </div>
    <div>
      <p className="text-2xl font-bold" style={{ fontFamily: 'Outfit, sans-serif' }}>{value}</p>
      <p className="text-sm text-gray-500">{title}</p>
    </div>
  </div>
);

const Employees = () => {
  const { getAuthHeaders, user } = useAuth();
  const [employees, setEmployees] = useState([]);
  const [stats, setStats] = useState(null);
  const [teams, setTeams] = useState([]);
  const [departments, setDepartments] = useState([]);
  const [allEmployees, setAllEmployees] = useState([]);
  const [loading, setLoading] = useState(true);
  const [pagination, setPagination] = useState({ page: 1, limit: 10, total: 0, pages: 0 });
  
  // Filter state
  const [filters, setFilters] = useState({
    search: '',
    department: 'All',
    team: 'All',
    status: 'All',
    employment_type: 'All',
    tier_level: 'All',
    work_location: 'All'
  });
  
  // Modal states
  const [showAddSheet, setShowAddSheet] = useState(false);
  const [showEditSheet, setShowEditSheet] = useState(false);
  const [showViewDialog, setShowViewDialog] = useState(false);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [selectedEmployee, setSelectedEmployee] = useState(null);
  
  // Form state
  const [form, setForm] = useState({
    full_name: '',
    official_email: '',
    phone_number: '',
    gender: '',
    date_of_birth: '',
    date_of_joining: '',
    employment_type: 'Full-time',
    designation: '',
    tier_level: 'Mid',
    reporting_manager_id: '',
    department: '',
    team: '',
    work_location: 'Office',
    leave_policy: 'Standard',
    shift_type: 'General',
    attendance_tracking_enabled: true,
    user_role: 'employee',
    login_enabled: true
  });
  
  // Config options
  const [config, setConfig] = useState({
    employmentTypes: [],
    employeeStatuses: [],
    tierLevels: [],
    workLocations: [],
    userRoles: []
  });

  const fetchConfig = useCallback(async () => {
    try {
      const [types, statuses, tiers, locations, roles] = await Promise.all([
        axios.get(`${API}/config/employment-types`),
        axios.get(`${API}/config/employee-statuses`),
        axios.get(`${API}/config/tier-levels`),
        axios.get(`${API}/config/work-locations`),
        axios.get(`${API}/config/user-roles`)
      ]);
      setConfig({
        employmentTypes: types.data,
        employeeStatuses: statuses.data,
        tierLevels: tiers.data,
        workLocations: locations.data,
        userRoles: roles.data
      });
    } catch (error) {
      console.error('Config fetch error:', error);
    }
  }, []);

  const fetchData = useCallback(async () => {
    try {
      setLoading(true);
      const params = {
        page: pagination.page,
        limit: pagination.limit,
        ...(filters.search && { search: filters.search }),
        ...(filters.department !== 'All' && { department: filters.department }),
        ...(filters.team !== 'All' && { team: filters.team }),
        ...(filters.status !== 'All' && { status: filters.status }),
        ...(filters.employment_type !== 'All' && { employment_type: filters.employment_type }),
        ...(filters.tier_level !== 'All' && { tier_level: filters.tier_level }),
        ...(filters.work_location !== 'All' && { work_location: filters.work_location })
      };
      
      const [employeesRes, statsRes, teamsRes, deptsRes, allEmpRes] = await Promise.all([
        axios.get(`${API}/employees`, { headers: getAuthHeaders(), params }),
        axios.get(`${API}/employees/stats`, { headers: getAuthHeaders() }),
        axios.get(`${API}/teams`, { headers: getAuthHeaders() }),
        axios.get(`${API}/departments`, { headers: getAuthHeaders() }),
        axios.get(`${API}/employees/all`, { headers: getAuthHeaders() })
      ]);
      
      setEmployees(employeesRes.data.employees);
      setPagination({
        page: employeesRes.data.page,
        limit: employeesRes.data.limit,
        total: employeesRes.data.total,
        pages: employeesRes.data.pages
      });
      setStats(statsRes.data);
      setTeams(teamsRes.data);
      setDepartments(deptsRes.data);
      setAllEmployees(allEmpRes.data);
    } catch (error) {
      console.error('Fetch error:', error);
      toast.error('Failed to load employee data');
    } finally {
      setLoading(false);
    }
  }, [getAuthHeaders, pagination.page, pagination.limit, filters]);

  useEffect(() => {
    fetchConfig();
  }, [fetchConfig]);

  useEffect(() => {
    fetchData();
  }, [pagination.page, filters.department, filters.team, filters.status]);

  const handleSearch = () => {
    setPagination(prev => ({ ...prev, page: 1 }));
    fetchData();
  };

  const handleReset = () => {
    setFilters({
      search: '',
      department: 'All',
      team: 'All',
      status: 'All',
      employment_type: 'All',
      tier_level: 'All',
      work_location: 'All'
    });
    setPagination(prev => ({ ...prev, page: 1 }));
  };

  const resetForm = () => {
    setForm({
      full_name: '',
      official_email: '',
      phone_number: '',
      gender: '',
      date_of_birth: '',
      date_of_joining: '',
      employment_type: 'Full-time',
      designation: '',
      tier_level: 'Mid',
      reporting_manager_id: '',
      department: '',
      team: '',
      work_location: 'Office',
      leave_policy: 'Standard',
      shift_type: 'General',
      attendance_tracking_enabled: true,
      user_role: 'employee',
      login_enabled: true
    });
  };

  const handleAdd = () => {
    resetForm();
    setShowAddSheet(true);
  };

  const handleEdit = (employee) => {
    setSelectedEmployee(employee);
    setForm({
      full_name: employee.full_name || '',
      official_email: employee.official_email || '',
      phone_number: employee.phone_number || '',
      gender: employee.gender || '',
      date_of_birth: employee.date_of_birth || '',
      date_of_joining: employee.date_of_joining || '',
      employment_type: employee.employment_type || 'Full-time',
      designation: employee.designation || '',
      tier_level: employee.tier_level || 'Mid',
      reporting_manager_id: employee.reporting_manager_id || '',
      department: employee.department || '',
      team: employee.team || '',
      work_location: employee.work_location || 'Office',
      leave_policy: employee.leave_policy || 'Standard',
      shift_type: employee.shift_type || 'General',
      attendance_tracking_enabled: employee.attendance_tracking_enabled ?? true,
      user_role: employee.user_role || 'employee',
      login_enabled: employee.login_enabled ?? true
    });
    setShowEditSheet(true);
  };

  const handleView = (employee) => {
    setSelectedEmployee(employee);
    setShowViewDialog(true);
  };

  const handleDelete = (employee) => {
    setSelectedEmployee(employee);
    setShowDeleteDialog(true);
  };

  const validateForm = () => {
    if (!form.full_name.trim()) {
      toast.error('Full name is required');
      return false;
    }
    if (!form.official_email.trim()) {
      toast.error('Email is required');
      return false;
    }
    if (!form.date_of_joining) {
      toast.error('Date of joining is required');
      return false;
    }
    if (!form.department) {
      toast.error('Department is required');
      return false;
    }
    if (!form.team) {
      toast.error('Team is required');
      return false;
    }
    if (!form.designation.trim()) {
      toast.error('Designation is required');
      return false;
    }
    return true;
  };

  const submitAdd = async () => {
    if (!validateForm()) return;
    
    try {
      await axios.post(`${API}/employees`, form, { headers: getAuthHeaders() });
      toast.success('Employee added successfully');
      setShowAddSheet(false);
      fetchData();
    } catch (error) {
      toast.error(error.response?.data?.detail || 'Failed to add employee');
    }
  };

  const submitEdit = async () => {
    if (!validateForm()) return;
    
    try {
      await axios.put(`${API}/employees/${selectedEmployee.id}`, form, { headers: getAuthHeaders() });
      toast.success('Employee updated successfully');
      setShowEditSheet(false);
      fetchData();
    } catch (error) {
      toast.error(error.response?.data?.detail || 'Failed to update employee');
    }
  };

  const confirmDelete = async () => {
    try {
      await axios.delete(`${API}/employees/${selectedEmployee.id}`, { headers: getAuthHeaders() });
      toast.success('Employee deactivated successfully');
      setShowDeleteDialog(false);
      fetchData();
    } catch (error) {
      toast.error(error.response?.data?.detail || 'Failed to deactivate employee');
    }
  };

  const handleExportCSV = () => {
    const headers = ['Emp ID', 'Name', 'Email', 'Department', 'Team', 'Designation', 'Status', 'Employment Type', 'Work Location'];
    const rows = employees.map(e => [
      e.emp_id, e.full_name, e.official_email, e.department, e.team, 
      e.designation, e.employee_status, e.employment_type, e.work_location
    ]);
    const csv = [headers, ...rows].map(row => row.join(',')).join('\n');
    
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `employees-${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
    toast.success('CSV exported');
  };

  const getStatusBadge = (status) => {
    const styles = {
      'Active': 'bg-emerald-100 text-emerald-700',
      'Inactive': 'bg-gray-100 text-gray-700',
      'Resigned': 'bg-red-100 text-red-700'
    };
    return styles[status] || 'bg-gray-100 text-gray-700';
  };

  const canEdit = ['admin', 'hr_manager'].includes(user?.role);

  // Filter teams by selected department
  const filteredTeams = form.department 
    ? teams.filter(t => t.department === form.department)
    : teams;

  const EmployeeForm = ({ isEdit = false }) => (
    <Tabs defaultValue="personal" className="w-full">
      <TabsList className="grid w-full grid-cols-4 mb-6">
        <TabsTrigger value="personal" className="data-[state=active]:bg-[#0b1f3b] data-[state=active]:text-white">Personal</TabsTrigger>
        <TabsTrigger value="employment" className="data-[state=active]:bg-[#0b1f3b] data-[state=active]:text-white">Employment</TabsTrigger>
        <TabsTrigger value="organization" className="data-[state=active]:bg-[#0b1f3b] data-[state=active]:text-white">Organization</TabsTrigger>
        <TabsTrigger value="system" className="data-[state=active]:bg-[#0b1f3b] data-[state=active]:text-white">System</TabsTrigger>
      </TabsList>

      <TabsContent value="personal" className="space-y-4">
        <div className="grid grid-cols-2 gap-4">
          <div>
            <Label className="text-sm font-medium">Full Name <span className="text-red-500">*</span></Label>
            <Input
              value={form.full_name}
              onChange={(e) => setForm({ ...form, full_name: e.target.value })}
              placeholder="Enter full name"
              className="mt-1 bg-white"
              data-testid="input-full-name"
            />
          </div>
          <div>
            <Label className="text-sm font-medium">Official Email <span className="text-red-500">*</span></Label>
            <Input
              type="email"
              value={form.official_email}
              onChange={(e) => setForm({ ...form, official_email: e.target.value })}
              placeholder="Enter email"
              className="mt-1 bg-white"
              data-testid="input-email"
            />
          </div>
        </div>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <Label className="text-sm font-medium">Phone Number</Label>
            <Input
              value={form.phone_number}
              onChange={(e) => setForm({ ...form, phone_number: e.target.value })}
              placeholder="Enter phone"
              className="mt-1 bg-white"
              data-testid="input-phone"
            />
          </div>
          <div>
            <Label className="text-sm font-medium">Gender</Label>
            <Select value={form.gender} onValueChange={(v) => setForm({ ...form, gender: v })}>
              <SelectTrigger className="mt-1 bg-white" data-testid="select-gender">
                <SelectValue placeholder="Select gender" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="Male">Male</SelectItem>
                <SelectItem value="Female">Female</SelectItem>
                <SelectItem value="Other">Other</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
        <div>
          <Label className="text-sm font-medium">Date of Birth</Label>
          <Input
            type="date"
            value={form.date_of_birth}
            onChange={(e) => setForm({ ...form, date_of_birth: e.target.value })}
            className="mt-1 bg-white"
            data-testid="input-dob"
          />
        </div>
      </TabsContent>

      <TabsContent value="employment" className="space-y-4">
        <div className="grid grid-cols-2 gap-4">
          <div>
            <Label className="text-sm font-medium">Date of Joining <span className="text-red-500">*</span></Label>
            <Input
              type="date"
              value={form.date_of_joining}
              onChange={(e) => setForm({ ...form, date_of_joining: e.target.value })}
              className="mt-1 bg-white"
              data-testid="input-doj"
            />
          </div>
          <div>
            <Label className="text-sm font-medium">Employment Type</Label>
            <Select value={form.employment_type} onValueChange={(v) => setForm({ ...form, employment_type: v })}>
              <SelectTrigger className="mt-1 bg-white" data-testid="select-employment-type">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {config.employmentTypes.map(type => (
                  <SelectItem key={type} value={type}>{type}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <Label className="text-sm font-medium">Designation <span className="text-red-500">*</span></Label>
            <Input
              value={form.designation}
              onChange={(e) => setForm({ ...form, designation: e.target.value })}
              placeholder="Enter designation"
              className="mt-1 bg-white"
              data-testid="input-designation"
            />
          </div>
          <div>
            <Label className="text-sm font-medium">Tier / Level</Label>
            <Select value={form.tier_level} onValueChange={(v) => setForm({ ...form, tier_level: v })}>
              <SelectTrigger className="mt-1 bg-white" data-testid="select-tier">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {config.tierLevels.map(level => (
                  <SelectItem key={level} value={level}>{level}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>
        <div>
          <Label className="text-sm font-medium">Reporting Manager</Label>
          <Select value={form.reporting_manager_id} onValueChange={(v) => setForm({ ...form, reporting_manager_id: v })}>
            <SelectTrigger className="mt-1 bg-white" data-testid="select-manager">
              <SelectValue placeholder="Select manager" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="">None</SelectItem>
              {allEmployees.filter(e => e.id !== selectedEmployee?.id).map(emp => (
                <SelectItem key={emp.id} value={emp.id}>{emp.full_name} ({emp.emp_id})</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </TabsContent>

      <TabsContent value="organization" className="space-y-4">
        <div className="grid grid-cols-2 gap-4">
          <div>
            <Label className="text-sm font-medium">Department <span className="text-red-500">*</span></Label>
            <Select value={form.department} onValueChange={(v) => setForm({ ...form, department: v, team: '' })}>
              <SelectTrigger className="mt-1 bg-white" data-testid="select-department">
                <SelectValue placeholder="Select department" />
              </SelectTrigger>
              <SelectContent>
                {departments.map(dept => (
                  <SelectItem key={dept.id} value={dept.name}>{dept.name}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div>
            <Label className="text-sm font-medium">Team <span className="text-red-500">*</span></Label>
            <Select value={form.team} onValueChange={(v) => setForm({ ...form, team: v })} disabled={!form.department}>
              <SelectTrigger className="mt-1 bg-white" data-testid="select-team">
                <SelectValue placeholder="Select team" />
              </SelectTrigger>
              <SelectContent>
                {filteredTeams.map(team => (
                  <SelectItem key={team.id} value={team.name}>{team.name}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>
        <div>
          <Label className="text-sm font-medium">Work Location</Label>
          <Select value={form.work_location} onValueChange={(v) => setForm({ ...form, work_location: v })}>
            <SelectTrigger className="mt-1 bg-white" data-testid="select-location">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {config.workLocations.map(loc => (
                <SelectItem key={loc} value={loc}>{loc}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <Label className="text-sm font-medium">Leave Policy</Label>
            <Select value={form.leave_policy} onValueChange={(v) => setForm({ ...form, leave_policy: v })}>
              <SelectTrigger className="mt-1 bg-white">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="Standard">Standard</SelectItem>
                <SelectItem value="Extended">Extended</SelectItem>
                <SelectItem value="Probation">Probation</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div>
            <Label className="text-sm font-medium">Shift Type</Label>
            <Select value={form.shift_type} onValueChange={(v) => setForm({ ...form, shift_type: v })}>
              <SelectTrigger className="mt-1 bg-white">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="General">General</SelectItem>
                <SelectItem value="Morning">Morning</SelectItem>
                <SelectItem value="Evening">Evening</SelectItem>
                <SelectItem value="Night">Night</SelectItem>
                <SelectItem value="Flexible">Flexible</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
      </TabsContent>

      <TabsContent value="system" className="space-y-4">
        <div>
          <Label className="text-sm font-medium">User Role</Label>
          <Select value={form.user_role} onValueChange={(v) => setForm({ ...form, user_role: v })}>
            <SelectTrigger className="mt-1 bg-white" data-testid="select-user-role">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {config.userRoles.map(role => (
                <SelectItem key={role} value={role}>{role.replace('_', ' ').toUpperCase()}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
          <div>
            <Label className="text-sm font-medium">Login Enabled</Label>
            <p className="text-xs text-gray-500">Allow employee to log into the system</p>
          </div>
          <Switch
            checked={form.login_enabled}
            onCheckedChange={(v) => setForm({ ...form, login_enabled: v })}
            data-testid="switch-login"
          />
        </div>
        <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
          <div>
            <Label className="text-sm font-medium">Attendance Tracking</Label>
            <p className="text-xs text-gray-500">Enable attendance tracking for this employee</p>
          </div>
          <Switch
            checked={form.attendance_tracking_enabled}
            onCheckedChange={(v) => setForm({ ...form, attendance_tracking_enabled: v })}
            data-testid="switch-attendance"
          />
        </div>
      </TabsContent>
    </Tabs>
  );

  return (
    <div className="space-y-6 animate-fade-in" data-testid="employees-page">
      {/* Page Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Users className="w-6 h-6 text-[#0b1f3b]" />
          <h1 className="text-2xl font-bold text-[#0b1f3b]" style={{ fontFamily: 'Outfit, sans-serif' }}>
            Employee Management
          </h1>
        </div>
        {canEdit && (
          <Button 
            onClick={handleAdd}
            className="bg-[#0b1f3b] hover:bg-[#162d4d] text-white"
            data-testid="add-employee-btn"
          >
            <Plus className="w-4 h-4 mr-2" />
            Add Employee
          </Button>
        )}
      </div>

      {/* Stats Cards */}
      {stats && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <StatCard title="Total Employees" value={stats.total} icon={Users} color="bg-[#0b1f3b]" />
          <StatCard title="Active" value={stats.active} icon={UserCheck} color="bg-emerald-500" />
          <StatCard title="Inactive" value={stats.inactive} icon={UserX} color="bg-gray-500" />
          <StatCard title="Resigned" value={stats.resigned} icon={Briefcase} color="bg-red-500" />
        </div>
      )}

      {/* Filters */}
      <div className="bg-[#fffdf7] rounded-xl border border-black/5 p-6">
        <div className="grid grid-cols-1 md:grid-cols-4 lg:grid-cols-7 gap-4">
          <div className="lg:col-span-2">
            <Label className="text-sm text-gray-600 mb-1 block">Search</Label>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
              <Input
                placeholder="Name, email, ID..."
                value={filters.search}
                onChange={(e) => setFilters({ ...filters, search: e.target.value })}
                onKeyPress={(e) => e.key === 'Enter' && handleSearch()}
                className="pl-9 bg-white"
                data-testid="filter-search"
              />
            </div>
          </div>
          
          <div>
            <Label className="text-sm text-gray-600 mb-1 block">Department</Label>
            <Select value={filters.department} onValueChange={(v) => setFilters({ ...filters, department: v })}>
              <SelectTrigger className="bg-white" data-testid="filter-department">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="All">All</SelectItem>
                {departments.map(dept => (
                  <SelectItem key={dept.id} value={dept.name}>{dept.name}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div>
            <Label className="text-sm text-gray-600 mb-1 block">Team</Label>
            <Select value={filters.team} onValueChange={(v) => setFilters({ ...filters, team: v })}>
              <SelectTrigger className="bg-white" data-testid="filter-team">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="All">All</SelectItem>
                {teams.map(team => (
                  <SelectItem key={team.id} value={team.name}>{team.name}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div>
            <Label className="text-sm text-gray-600 mb-1 block">Status</Label>
            <Select value={filters.status} onValueChange={(v) => setFilters({ ...filters, status: v })}>
              <SelectTrigger className="bg-white" data-testid="filter-status">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="All">All</SelectItem>
                {config.employeeStatuses.map(s => (
                  <SelectItem key={s} value={s}>{s}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="flex items-end gap-2">
            <Button onClick={handleSearch} className="bg-[#0b1f3b] hover:bg-[#162d4d] text-white" data-testid="search-btn">
              <Filter className="w-4 h-4 mr-1" /> Filter
            </Button>
            <Button variant="outline" onClick={handleReset} data-testid="reset-btn">
              <RotateCcw className="w-4 h-4" />
            </Button>
          </div>

          <div className="flex items-end">
            <Button variant="outline" onClick={handleExportCSV} data-testid="export-btn">
              <Download className="w-4 h-4 mr-1" /> Export
            </Button>
          </div>
        </div>
      </div>

      {/* Employee Table */}
      <div className="bg-[#fffdf7] rounded-xl border border-black/5 overflow-hidden">
        {loading ? (
          <div className="flex items-center justify-center h-64">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#0b1f3b]"></div>
          </div>
        ) : (
          <>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50/50">
                  <tr>
                    <th className="px-4 py-4 text-left text-xs font-semibold text-gray-600 uppercase">Emp ID</th>
                    <th className="px-4 py-4 text-left text-xs font-semibold text-gray-600 uppercase">Name</th>
                    <th className="px-4 py-4 text-left text-xs font-semibold text-gray-600 uppercase">Email</th>
                    <th className="px-4 py-4 text-left text-xs font-semibold text-gray-600 uppercase">Department</th>
                    <th className="px-4 py-4 text-left text-xs font-semibold text-gray-600 uppercase">Team</th>
                    <th className="px-4 py-4 text-left text-xs font-semibold text-gray-600 uppercase">Designation</th>
                    <th className="px-4 py-4 text-left text-xs font-semibold text-gray-600 uppercase">Status</th>
                    <th className="px-4 py-4 text-left text-xs font-semibold text-gray-600 uppercase">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {employees.length === 0 ? (
                    <tr>
                      <td colSpan="8" className="px-6 py-12 text-center text-gray-500">
                        No employees found
                      </td>
                    </tr>
                  ) : (
                    employees.map((emp) => (
                      <tr key={emp.id} className="hover:bg-gray-50/50 transition-colors">
                        <td className="px-4 py-4 text-sm font-medium text-[#0b1f3b]">{emp.emp_id}</td>
                        <td className="px-4 py-4 text-sm font-medium text-gray-900">{emp.full_name}</td>
                        <td className="px-4 py-4 text-sm text-gray-600">{emp.official_email}</td>
                        <td className="px-4 py-4 text-sm text-gray-600">{emp.department}</td>
                        <td className="px-4 py-4 text-sm text-gray-600">{emp.team}</td>
                        <td className="px-4 py-4 text-sm text-gray-600">{emp.designation}</td>
                        <td className="px-4 py-4">
                          <Badge className={getStatusBadge(emp.employee_status)}>
                            {emp.employee_status}
                          </Badge>
                        </td>
                        <td className="px-4 py-4">
                          <div className="flex gap-1">
                            <Button size="sm" variant="ghost" onClick={() => handleView(emp)} data-testid={`view-${emp.id}`}>
                              <Eye className="w-4 h-4 text-gray-500" />
                            </Button>
                            {canEdit && (
                              <>
                                <Button size="sm" variant="ghost" onClick={() => handleEdit(emp)} data-testid={`edit-${emp.id}`}>
                                  <Edit className="w-4 h-4 text-blue-500" />
                                </Button>
                                <Button size="sm" variant="ghost" onClick={() => handleDelete(emp)} data-testid={`delete-${emp.id}`}>
                                  <Trash2 className="w-4 h-4 text-red-500" />
                                </Button>
                              </>
                            )}
                          </div>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
            
            {/* Pagination */}
            <div className="px-6 py-4 border-t border-black/5 flex items-center justify-between">
              <p className="text-sm text-gray-500">
                Showing {((pagination.page - 1) * pagination.limit) + 1} to {Math.min(pagination.page * pagination.limit, pagination.total)} of {pagination.total} employees
              </p>
              <div className="flex items-center gap-2">
                <Button
                  size="sm"
                  variant="outline"
                  disabled={pagination.page <= 1}
                  onClick={() => setPagination(prev => ({ ...prev, page: prev.page - 1 }))}
                  data-testid="prev-page"
                >
                  <ChevronLeft className="w-4 h-4" />
                </Button>
                <span className="text-sm text-gray-600">Page {pagination.page} of {pagination.pages}</span>
                <Button
                  size="sm"
                  variant="outline"
                  disabled={pagination.page >= pagination.pages}
                  onClick={() => setPagination(prev => ({ ...prev, page: prev.page + 1 }))}
                  data-testid="next-page"
                >
                  <ChevronRight className="w-4 h-4" />
                </Button>
              </div>
            </div>
          </>
        )}
      </div>

      {/* Add Employee Sheet */}
      <Sheet open={showAddSheet} onOpenChange={setShowAddSheet}>
        <SheetContent className="w-full sm:max-w-xl bg-[#fffdf7] overflow-y-auto">
          <SheetHeader>
            <SheetTitle style={{ fontFamily: 'Outfit, sans-serif' }}>Add New Employee</SheetTitle>
          </SheetHeader>
          <div className="py-6">
            <EmployeeForm />
          </div>
          <SheetFooter className="flex gap-2">
            <Button variant="outline" onClick={() => setShowAddSheet(false)}>Cancel</Button>
            <Button onClick={submitAdd} className="bg-[#0b1f3b] hover:bg-[#162d4d] text-white" data-testid="submit-add">
              Save Employee
            </Button>
          </SheetFooter>
        </SheetContent>
      </Sheet>

      {/* Edit Employee Sheet */}
      <Sheet open={showEditSheet} onOpenChange={setShowEditSheet}>
        <SheetContent className="w-full sm:max-w-xl bg-[#fffdf7] overflow-y-auto">
          <SheetHeader>
            <SheetTitle style={{ fontFamily: 'Outfit, sans-serif' }}>Edit Employee - {selectedEmployee?.emp_id}</SheetTitle>
          </SheetHeader>
          <div className="py-6">
            <EmployeeForm isEdit />
          </div>
          <SheetFooter className="flex gap-2">
            <Button variant="outline" onClick={() => setShowEditSheet(false)}>Cancel</Button>
            <Button onClick={submitEdit} className="bg-[#0b1f3b] hover:bg-[#162d4d] text-white" data-testid="submit-edit">
              Update Employee
            </Button>
          </SheetFooter>
        </SheetContent>
      </Sheet>

      {/* View Employee Dialog */}
      <Dialog open={showViewDialog} onOpenChange={setShowViewDialog}>
        <DialogContent className="bg-[#fffdf7] max-w-2xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle style={{ fontFamily: 'Outfit, sans-serif' }}>
              Employee Details - {selectedEmployee?.emp_id}
            </DialogTitle>
          </DialogHeader>
          {selectedEmployee && (
            <div className="space-y-6 py-4">
              <div className="flex items-center gap-4 pb-4 border-b">
                <div className="w-16 h-16 rounded-full bg-[#0b1f3b] flex items-center justify-center">
                  <span className="text-white text-2xl font-bold">
                    {selectedEmployee.full_name?.charAt(0)?.toUpperCase()}
                  </span>
                </div>
                <div>
                  <h3 className="text-xl font-semibold">{selectedEmployee.full_name}</h3>
                  <p className="text-gray-500">{selectedEmployee.designation} • {selectedEmployee.tier_level}</p>
                  <Badge className={getStatusBadge(selectedEmployee.employee_status)}>
                    {selectedEmployee.employee_status}
                  </Badge>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-3">
                  <h4 className="font-semibold text-sm text-gray-500 uppercase">Personal Information</h4>
                  <div className="space-y-2">
                    <p className="text-sm"><span className="text-gray-500">Email:</span> {selectedEmployee.official_email}</p>
                    <p className="text-sm"><span className="text-gray-500">Phone:</span> {selectedEmployee.phone_number || '-'}</p>
                    <p className="text-sm"><span className="text-gray-500">Gender:</span> {selectedEmployee.gender || '-'}</p>
                    <p className="text-sm"><span className="text-gray-500">DOB:</span> {selectedEmployee.date_of_birth || '-'}</p>
                  </div>
                </div>

                <div className="space-y-3">
                  <h4 className="font-semibold text-sm text-gray-500 uppercase">Employment</h4>
                  <div className="space-y-2">
                    <p className="text-sm"><span className="text-gray-500">Joined:</span> {selectedEmployee.date_of_joining}</p>
                    <p className="text-sm"><span className="text-gray-500">Type:</span> {selectedEmployee.employment_type}</p>
                    <p className="text-sm"><span className="text-gray-500">Manager:</span> {selectedEmployee.reporting_manager_name || '-'}</p>
                    <p className="text-sm"><span className="text-gray-500">Location:</span> {selectedEmployee.work_location}</p>
                  </div>
                </div>

                <div className="space-y-3">
                  <h4 className="font-semibold text-sm text-gray-500 uppercase">Organization</h4>
                  <div className="space-y-2">
                    <p className="text-sm"><span className="text-gray-500">Department:</span> {selectedEmployee.department}</p>
                    <p className="text-sm"><span className="text-gray-500">Team:</span> {selectedEmployee.team}</p>
                  </div>
                </div>

                <div className="space-y-3">
                  <h4 className="font-semibold text-sm text-gray-500 uppercase">System</h4>
                  <div className="space-y-2">
                    <p className="text-sm"><span className="text-gray-500">Role:</span> {selectedEmployee.user_role}</p>
                    <p className="text-sm"><span className="text-gray-500">Login:</span> {selectedEmployee.login_enabled ? 'Enabled' : 'Disabled'}</p>
                    <p className="text-sm"><span className="text-gray-500">Attendance:</span> {selectedEmployee.attendance_tracking_enabled ? 'Enabled' : 'Disabled'}</p>
                  </div>
                </div>
              </div>
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowViewDialog(false)}>Close</Button>
            {canEdit && (
              <Button onClick={() => { setShowViewDialog(false); handleEdit(selectedEmployee); }} className="bg-[#0b1f3b] hover:bg-[#162d4d] text-white">
                Edit
              </Button>
            )}
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <Dialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <DialogContent className="bg-[#fffdf7]">
          <DialogHeader>
            <DialogTitle style={{ fontFamily: 'Outfit, sans-serif' }}>Deactivate Employee</DialogTitle>
          </DialogHeader>
          <div className="py-4">
            <p className="text-gray-600">
              Are you sure you want to deactivate <span className="font-semibold">{selectedEmployee?.full_name}</span>?
            </p>
            <p className="text-sm text-gray-500 mt-2">
              This will disable their login access and mark them as inactive. This action can be reversed.
            </p>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowDeleteDialog(false)}>Cancel</Button>
            <Button onClick={confirmDelete} className="bg-red-500 hover:bg-red-600 text-white" data-testid="confirm-delete">
              Deactivate
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default Employees;
