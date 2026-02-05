import React, { useState, useEffect, useMemo } from 'react';
import { useAuth } from '../contexts/AuthContext';
import axios from 'axios';
import { toast } from 'sonner';
import { 
  Download,
  Plus,
  Eye,
  ChevronDown,
  ChevronUp,
  ArrowLeft
} from 'lucide-react';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../components/ui/select';
import { Badge } from '../components/ui/badge';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '../components/ui/dialog';
import { Label } from '../components/ui/label';
import { Textarea } from '../components/ui/textarea';
import { MonthPicker } from '../components/ui/month-picker';

const API = `${process.env.REACT_APP_BACKEND_URL}/api`;

// Helper to calculate week ranges for a month
const getWeeksForMonth = (monthStr) => {
  const [year, month] = monthStr.split('-').map(Number);
  const firstDay = new Date(year, month - 1, 1);
  const lastDay = new Date(year, month, 0);
  
  const weeks = [];
  let weekStart = new Date(firstDay);
  let weekNum = 1;
  
  while (weekStart <= lastDay) {
    let weekEnd = new Date(weekStart);
    weekEnd.setDate(weekEnd.getDate() + 6);
    
    if (weekEnd > lastDay) {
      weekEnd = new Date(lastDay);
    }
    
    weeks.push({
      week: weekNum,
      startDate: weekStart.toISOString().split('T')[0],
      endDate: weekEnd.toISOString().split('T')[0],
      fromDate: weekStart.toISOString().split('T')[0],
      toDate: weekEnd.toISOString().split('T')[0],
      value: '',
      reason: ''
    });
    
    weekStart = new Date(weekEnd);
    weekStart.setDate(weekStart.getDate() + 1);
    weekNum++;
    
    if (weekNum > 5) break;
  }
  
  // Ensure we always have 5 weeks
  while (weeks.length < 5) {
    const lastWeek = weeks[weeks.length - 1];
    const newStart = new Date(lastWeek.endDate);
    newStart.setDate(newStart.getDate() + 1);
    const newEnd = new Date(newStart);
    newEnd.setDate(newEnd.getDate() + 6);
    
    weeks.push({
      week: weeks.length + 1,
      startDate: newStart.toISOString().split('T')[0],
      endDate: newEnd.toISOString().split('T')[0],
      fromDate: newStart.toISOString().split('T')[0],
      toDate: newEnd.toISOString().split('T')[0],
      value: '',
      reason: ''
    });
  }
  
  return weeks;
};

// Format date as dd/mm/yyyy
const formatDateDisplay = (dateStr) => {
  if (!dateStr) return '';
  const [year, month, day] = dateStr.split('-');
  return `${day}/${month}/${year}`;
};

const StarReward = () => {
  const { getAuthHeaders, user } = useAuth();
  const [employees, setEmployees] = useState([]);
  const [teams, setTeams] = useState([]);
  const [loading, setLoading] = useState(true);
  
  // View modes
  const [activeTab, setActiveTab] = useState('employees');
  const [viewMode, setViewMode] = useState('table');
  
  // Team Details View
  const [showTeamDetails, setShowTeamDetails] = useState(false);
  const [selectedTeam, setSelectedTeam] = useState(null);
  
  // Add/Edit Form View
  const [showAddForm, setShowAddForm] = useState(false);
  const [selectedEmployee, setSelectedEmployee] = useState(null);
  const [addFormType, setAddFormType] = useState('performance');
  const [addFormMonth, setAddFormMonth] = useState(new Date().toISOString().slice(0, 7));
  const [weeklyData, setWeeklyData] = useState([]);
  const [simpleFormData, setSimpleFormData] = useState({ value: '', reason: '' });
  
  // View modal
  const [showViewModal, setShowViewModal] = useState(false);
  const [starHistory, setStarHistory] = useState([]);
  const [loadingHistory, setLoadingHistory] = useState(false);
  
  // Filters
  const [filters, setFilters] = useState({
    team: 'All',
    month: new Date().toISOString().slice(0, 7),
    search: ''
  });
  
  // Secondary filters for table view
  const [tableFilters, setTableFilters] = useState({
    fromMonth: new Date().toISOString().slice(0, 7),
    toMonth: new Date().toISOString().slice(0, 7),
    pageSize: 25
  });
  
  // Pagination
  const [currentPage, setCurrentPage] = useState(1);
  const [goToPage, setGoToPage] = useState('1');

  useEffect(() => {
    fetchData();
  }, []);

  // Initialize weekly data when month or type changes
  useEffect(() => {
    if (addFormType === 'performance' || addFormType === 'learning') {
      setWeeklyData(getWeeksForMonth(addFormMonth));
    }
  }, [addFormMonth, addFormType]);

  const fetchData = async () => {
    try {
      setLoading(true);
      const [employeesRes, teamsRes] = await Promise.all([
        axios.get(`${API}/star-rewards`, {
          headers: getAuthHeaders(),
          params: { 
            department: 'Research Unit',
            team: filters.team !== 'All' ? filters.team : undefined 
          }
        }),
        axios.get(`${API}/teams`, { 
          headers: getAuthHeaders(),
          params: { department: 'Research Unit' }
        })
      ]);
      setEmployees(employeesRes.data);
      const researchTeams = teamsRes.data.filter(t => t.department === 'Research Unit');
      setTeams(researchTeams);
    } catch (error) {
      console.error('Star rewards fetch error:', error);
      toast.error('Failed to load star rewards data');
    } finally {
      setLoading(false);
    }
  };

  const handleApply = async () => {
    try {
      setLoading(true);
      const response = await axios.get(`${API}/star-rewards`, {
        headers: getAuthHeaders(),
        params: {
          department: 'Research Unit',
          team: filters.team !== 'All' ? filters.team : undefined,
          month: filters.month,
          search: filters.search || undefined
        }
      });
      setEmployees(response.data);
      setCurrentPage(1);
      toast.success('Filters applied');
    } catch (error) {
      toast.error('Failed to apply filters');
    } finally {
      setLoading(false);
    }
  };

  const handleExportCSV = () => {
    let data;
    let headers;
    let filename;
    
    if (activeTab === 'employees') {
      headers = ['Name', 'Email', 'Team', 'Stars', 'Unsafe'];
      data = filteredEmployees.map(e => [e.name, e.email, e.team, e.stars, e.unsafe_count]);
      filename = `employees-star-rating-${filters.month}.csv`;
    } else {
      headers = ['Team', 'Members', 'Team Stars', 'Avg'];
      data = teamStats.map(t => [t.name, t.members, t.totalStars.toFixed(2), t.avgStars.toFixed(2)]);
      filename = `teams-star-rating-${filters.month}.csv`;
    }
    
    const csv = [headers, ...data].map(row => row.join(',')).join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    a.click();
    toast.success('CSV exported');
  };

  const handleViewEmployee = async (employee) => {
    // Set selected employee and open modal immediately
    setSelectedEmployee(employee);
    setStarHistory([]); // Clear previous history
    setLoadingHistory(true);
    setShowViewModal(true);
    
    // Then fetch history
    try {
      const response = await axios.get(`${API}/star-rewards/history/${employee.id}`, {
        headers: getAuthHeaders()
      });
      setStarHistory(response.data);
    } catch (error) {
      console.error('Failed to load history:', error);
      setStarHistory([]);
    } finally {
      setLoadingHistory(false);
    }
  };

  const handleAddStars = (employee) => {
    setSelectedEmployee(employee);
    setAddFormType('performance');
    setAddFormMonth(filters.month);
    setWeeklyData(getWeeksForMonth(filters.month));
    setSimpleFormData({ value: '', reason: '' });
    setShowAddForm(true);
  };

  const handleBackFromForm = () => {
    setShowAddForm(false);
    setSelectedEmployee(null);
  };

  const updateWeekData = (weekIndex, field, value) => {
    setWeeklyData(prev => {
      const updated = [...prev];
      updated[weekIndex] = { ...updated[weekIndex], [field]: value };
      return updated;
    });
  };

  const submitStars = async () => {
    try {
      if (addFormType === 'performance' || addFormType === 'learning') {
        // Submit weekly data
        const validWeeks = weeklyData.filter(w => w.value && w.reason);
        if (validWeeks.length === 0) {
          toast.error('Please fill at least one week with value and reason');
          return;
        }
        
        for (const week of validWeeks) {
          await axios.post(`${API}/star-rewards`, {
            employee_id: selectedEmployee.id,
            stars: parseInt(week.value),
            reason: week.reason,
            type: addFormType,
            week_number: week.week,
            from_date: week.fromDate,
            to_date: week.toDate
          }, { headers: getAuthHeaders() });
        }
        
        toast.success(`${addFormType === 'performance' ? 'Performance' : 'Learning'} stars awarded for ${validWeeks.length} week(s)`);
      } else {
        // Submit simple form (innovation or unsafe)
        if (!simpleFormData.value || !simpleFormData.reason) {
          toast.error('Please fill value and reason');
          return;
        }
        
        const stars = addFormType === 'unsafe' ? -Math.abs(parseInt(simpleFormData.value)) : parseInt(simpleFormData.value);
        
        await axios.post(`${API}/star-rewards`, {
          employee_id: selectedEmployee.id,
          stars: stars,
          reason: simpleFormData.reason,
          type: addFormType
        }, { headers: getAuthHeaders() });
        
        toast.success(`${addFormType === 'innovation' ? 'Innovation' : 'Unsafe Conduct'} stars recorded`);
      }
      
      setShowAddForm(false);
      fetchData();
    } catch (error) {
      toast.error(error.response?.data?.detail || 'Failed to award stars');
    }
  };

  const canAddStars = ['admin', 'hr_manager', 'team_lead'].includes(user?.role);

  // Filter employees
  const filteredEmployees = useMemo(() => {
    return employees.filter(e => {
      if (filters.search) {
        const search = filters.search.toLowerCase();
        return e.name.toLowerCase().includes(search) || 
               e.email.toLowerCase().includes(search);
      }
      return true;
    });
  }, [employees, filters.search]);

  // Paginated employees
  const paginatedEmployees = useMemo(() => {
    const start = (currentPage - 1) * tableFilters.pageSize;
    const end = start + tableFilters.pageSize;
    return filteredEmployees.slice(start, end);
  }, [filteredEmployees, currentPage, tableFilters.pageSize]);

  const totalPages = Math.ceil(filteredEmployees.length / tableFilters.pageSize);

  // Team statistics
  const teamStats = useMemo(() => {
    return teams.map(team => {
      const teamEmployees = filteredEmployees.filter(e => e.team === team.name);
      const totalStars = teamEmployees.reduce((sum, e) => sum + (e.stars || 0), 0);
      const avgStars = teamEmployees.length > 0 ? totalStars / teamEmployees.length : 0;
      return {
        ...team,
        members: teamEmployees.length || team.member_count || 0,
        totalStars,
        avgStars,
        employees: teamEmployees
      };
    });
  }, [teams, filteredEmployees]);

  // Handle View Members click - opens Team Details view
  const handleViewTeamMembers = (team) => {
    setSelectedTeam(team);
    setShowTeamDetails(true);
  };

  // Handle back from Team Details view
  const handleBackFromTeamDetails = () => {
    setShowTeamDetails(false);
    setSelectedTeam(null);
  };

  const handleGoToPage = () => {
    const page = parseInt(goToPage);
    if (page >= 1 && page <= totalPages) {
      setCurrentPage(page);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#0b1f3b]"></div>
      </div>
    );
  }

  // RENDER ADD/EDIT FORM VIEW
  if (showAddForm && selectedEmployee) {
    return (
      <div className="space-y-4 animate-fade-in bg-[#efede5] min-h-screen p-6" data-testid="star-add-form">
        {/* Page Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900" style={{ fontFamily: 'Outfit, sans-serif' }}>
              Star Rating
            </h1>
            <p className="text-sm text-gray-600 mt-1">
              Department: Research Unit — Month: {addFormMonth}
            </p>
          </div>
          
          <div className="flex rounded-lg overflow-hidden border border-gray-200">
            <Button
              variant="ghost"
              className="rounded-none px-6 bg-[#0b1f3b] text-white hover:bg-[#162d4d]"
            >
              Employees
            </Button>
            <Button
              variant="ghost"
              className="rounded-none px-6 bg-[#fffdf7] text-gray-700 hover:bg-gray-100"
            >
              Teams
            </Button>
          </div>
        </div>

        {/* Main Filter Section (disabled during form) */}
        <div className="bg-[#fffdf7] rounded-lg border border-black/5 p-4">
          <div className="flex flex-wrap items-center justify-center gap-4 opacity-50 pointer-events-none">
            <div className="flex items-center gap-2">
              <span className="text-sm text-gray-600">Team</span>
              <Select value="All" disabled>
                <SelectTrigger className="w-32 bg-white border-gray-300">
                  <SelectValue />
                </SelectTrigger>
              </Select>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-sm text-gray-600">Month</span>
              <Input type="month" value={addFormMonth} className="w-36 bg-white border-gray-300" disabled />
            </div>
            <div className="flex items-center gap-2">
              <span className="text-sm text-gray-600">Search</span>
              <Input placeholder="name, username or email" className="w-52 bg-white border-gray-300" disabled />
            </div>
            <Button className="bg-[#0b1f3b] text-white px-6" disabled>Apply</Button>
            <Button className="bg-[#0b1f3b] text-white px-6" disabled>Export CSV</Button>
          </div>
        </div>

        {/* Add/Edit Form Container */}
        <div className="bg-[#fffdf7] rounded-lg border-2 border-[#0b1f3b]/30 p-6">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-xl font-bold text-gray-900" style={{ fontFamily: 'Outfit, sans-serif' }}>
              {selectedEmployee.name} — Manual Add/Edit (Month: {addFormMonth})
            </h2>
            <Button
              variant="outline"
              onClick={handleBackFromForm}
              className="border-[#0b1f3b] text-[#0b1f3b]"
              data-testid="back-btn"
            >
              Back
            </Button>
          </div>

          {/* Type Selector */}
          <div className="mb-6">
            <div className="flex items-center gap-2">
              <span className="text-sm font-medium text-gray-700">Type</span>
              <Select value={addFormType} onValueChange={setAddFormType}>
                <SelectTrigger className="w-48 bg-white border-gray-300" data-testid="form-type-select">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="performance">Performance</SelectItem>
                  <SelectItem value="learning">Learning</SelectItem>
                  <SelectItem value="innovation">Innovation</SelectItem>
                  <SelectItem value="unsafe">Unsafe Conduct</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Weekly Form (Performance & Learning) */}
          {(addFormType === 'performance' || addFormType === 'learning') && (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mb-6">
              {weeklyData.map((week, index) => (
                <div key={index} className="bg-white rounded-lg border border-gray-200 p-4">
                  <div className="mb-3">
                    <span className="text-[#0b1f3b] font-bold">Week {week.week}</span>
                    <span className="text-gray-500 text-sm ml-2">
                      {week.startDate} → {week.endDate}
                    </span>
                  </div>
                  
                  <div className="flex items-center gap-2 mb-3">
                    <span className="text-sm text-gray-600">From</span>
                    <Input
                      type="date"
                      value={week.fromDate}
                      onChange={(e) => updateWeekData(index, 'fromDate', e.target.value)}
                      className="flex-1 bg-white border-gray-300 text-sm"
                    />
                    <span className="text-sm text-gray-600">To</span>
                    <Input
                      type="date"
                      value={week.toDate}
                      onChange={(e) => updateWeekData(index, 'toDate', e.target.value)}
                      className="flex-1 bg-white border-gray-300 text-sm"
                    />
                  </div>

                  <div className="mb-3">
                    <Label className="text-sm text-gray-600">Value</Label>
                    <Input
                      type="number"
                      value={week.value}
                      onChange={(e) => updateWeekData(index, 'value', e.target.value)}
                      className="bg-white border-gray-300 mt-1"
                      placeholder="Enter star value"
                      data-testid={`week-${index}-value`}
                    />
                  </div>

                  <div>
                    <Label className="text-sm text-gray-600">Reason</Label>
                    <Textarea
                      value={week.reason}
                      onChange={(e) => updateWeekData(index, 'reason', e.target.value)}
                      className="bg-white border-gray-300 mt-1 min-h-[80px]"
                      placeholder="Enter reason..."
                      data-testid={`week-${index}-reason`}
                    />
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Simple Form (Innovation & Unsafe Conduct) */}
          {(addFormType === 'innovation' || addFormType === 'unsafe') && (
            <div className="max-w-md space-y-4 mb-6">
              <div>
                <Label className="font-medium text-gray-700">Month</Label>
                <Input
                  type="month"
                  value={addFormMonth}
                  onChange={(e) => setAddFormMonth(e.target.value)}
                  className="bg-white border-gray-300 mt-1"
                  data-testid="simple-month"
                />
              </div>
              
              <div>
                <Label className="font-medium text-gray-700">Value (stars)</Label>
                <Input
                  type="number"
                  value={simpleFormData.value}
                  onChange={(e) => setSimpleFormData(prev => ({ ...prev, value: e.target.value }))}
                  className="bg-white border-gray-300 mt-1"
                  placeholder={addFormType === 'unsafe' ? "Enter negative value" : "Enter star value"}
                  data-testid="simple-value"
                />
              </div>

              <div>
                <Label className="font-medium text-gray-700">Reason</Label>
                <Textarea
                  value={simpleFormData.reason}
                  onChange={(e) => setSimpleFormData(prev => ({ ...prev, reason: e.target.value }))}
                  className="bg-white border-gray-300 mt-1 min-h-[120px]"
                  placeholder="Enter reason..."
                  data-testid="simple-reason"
                />
              </div>
            </div>
          )}

          {/* Form Actions */}
          <div className="flex gap-3">
            <Button
              onClick={submitStars}
              className="bg-[#0b1f3b] hover:bg-[#162d4d] text-white px-6"
              data-testid="save-btn"
            >
              Save
            </Button>
            <Button
              variant="outline"
              onClick={handleBackFromForm}
              className="border-[#0b1f3b] text-[#0b1f3b]"
              data-testid="cancel-btn"
            >
              Cancel
            </Button>
          </div>
        </div>
      </div>
    );
  }

  // RENDER TEAM DETAILS VIEW
  if (showTeamDetails && selectedTeam) {
    return (
      <div className="space-y-4 animate-fade-in bg-[#efede5] min-h-screen p-6" data-testid="team-details-view">
        {/* Page Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900" style={{ fontFamily: 'Outfit, sans-serif' }}>
              Star Rating
            </h1>
            <p className="text-sm text-gray-600 mt-1">
              Department: Research Unit — Month: {filters.month}
            </p>
          </div>
          
          <div className="flex rounded-lg overflow-hidden border border-gray-200">
            <Button
              variant="ghost"
              className="rounded-none px-6 bg-[#fffdf7] text-gray-700 hover:bg-gray-100"
            >
              Employees
            </Button>
            <Button
              variant="ghost"
              className="rounded-none px-6 bg-[#0b1f3b] text-white hover:bg-[#162d4d]"
            >
              Teams
            </Button>
          </div>
        </div>

        {/* Main Filter Section (disabled) */}
        <div className="bg-[#fffdf7] rounded-lg border border-black/5 p-4">
          <div className="flex flex-wrap items-center justify-center gap-4 opacity-50 pointer-events-none">
            <div className="flex items-center gap-2">
              <span className="text-sm text-gray-600">Team</span>
              <Select value="All" disabled>
                <SelectTrigger className="w-32 bg-white border-gray-300">
                  <SelectValue />
                </SelectTrigger>
              </Select>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-sm text-gray-600">Month</span>
              <Input type="month" value={filters.month} className="w-36 bg-white border-gray-300" disabled />
            </div>
            <div className="flex items-center gap-2">
              <span className="text-sm text-gray-600">Search</span>
              <Input placeholder="name, username or email" className="w-52 bg-white border-gray-300" disabled />
            </div>
            <Button className="bg-[#0b1f3b] text-white px-6" disabled>Apply</Button>
            <Button className="bg-[#0b1f3b] text-white px-6" disabled>Export CSV</Button>
          </div>
        </div>

        {/* Team Details Container */}
        <div className="bg-[#fffdf7] rounded-lg border-2 border-[#0b1f3b]/30 p-6">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-xl font-bold text-gray-900" style={{ fontFamily: 'Outfit, sans-serif' }}>
              Team details
            </h2>
            <Button
              variant="outline"
              onClick={handleBackFromTeamDetails}
              className="border-[#0b1f3b] text-[#0b1f3b]"
              data-testid="back-from-team-btn"
            >
              Back
            </Button>
          </div>

          {/* Team Name and Member Count */}
          <h3 className="text-lg font-semibold text-gray-900 mb-6" style={{ fontFamily: 'Outfit, sans-serif' }}>
            {selectedTeam.name} — {selectedTeam.members} members
          </h3>

          {/* Member Cards Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {selectedTeam.employees && selectedTeam.employees.length > 0 ? (
              selectedTeam.employees.map((member) => (
                <div key={member.id} className="bg-white rounded-lg border border-gray-200 p-4 hover:shadow-md transition-shadow">
                  <h4 className="font-bold text-gray-900 text-lg">{member.name}</h4>
                  <p className="text-sm text-gray-500 mt-1">{member.email}</p>
                  <p className="text-sm text-gray-600 mt-2">
                    Stars: {member.stars || 0} · Unsafe: {member.unsafe_count || 0}
                  </p>
                  <div className="flex gap-2 mt-4">
                    <Button 
                      size="sm" 
                      onClick={() => handleViewEmployee(member)} 
                      className="bg-[#0b1f3b] hover:bg-[#162d4d] text-white"
                      data-testid={`view-member-${member.id}`}
                    >
                      View
                    </Button>
                    {canAddStars && (
                      <Button 
                        size="sm" 
                        variant="outline" 
                        onClick={() => handleAddStars(member)} 
                        className="border-[#0b1f3b] text-[#0b1f3b]"
                        data-testid={`add-member-${member.id}`}
                      >
                        Add
                      </Button>
                    )}
                  </div>
                </div>
              ))
            ) : (
              <p className="text-gray-500 col-span-full text-center py-8">No members in this team</p>
            )}
          </div>
        </div>
      </div>
    );
  }

  // RENDER MAIN LIST VIEW
  return (
    <div className="space-y-4 animate-fade-in bg-[#efede5] min-h-screen p-6" data-testid="star-reward-page">
      {/* Page Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900" style={{ fontFamily: 'Outfit, sans-serif' }}>
            Star Rating
          </h1>
          <p className="text-sm text-gray-600 mt-1">
            Department: Research Unit — Month: {filters.month}
          </p>
        </div>
        
        {/* Employees | Teams Toggle */}
        <div className="flex rounded-lg overflow-hidden border border-gray-200">
          <Button
            variant="ghost"
            onClick={() => setActiveTab('employees')}
            className={`rounded-none px-6 ${activeTab === 'employees' ? 'bg-[#0b1f3b] text-white hover:bg-[#162d4d]' : 'bg-[#fffdf7] text-gray-700 hover:bg-gray-100'}`}
            data-testid="tab-employees"
          >
            Employees
          </Button>
          <Button
            variant="ghost"
            onClick={() => setActiveTab('teams')}
            className={`rounded-none px-6 ${activeTab === 'teams' ? 'bg-[#0b1f3b] text-white hover:bg-[#162d4d]' : 'bg-[#fffdf7] text-gray-700 hover:bg-gray-100'}`}
            data-testid="tab-teams"
          >
            Teams
          </Button>
        </div>
      </div>

      {/* Main Filter Section */}
      <div className="bg-[#fffdf7] rounded-lg border border-black/5 p-4">
        <div className="flex flex-wrap items-center justify-center gap-4">
          <div className="flex items-center gap-2">
            <span className="text-sm text-gray-600">Team</span>
            <Select value={filters.team} onValueChange={(v) => setFilters({ ...filters, team: v })}>
              <SelectTrigger className="w-32 bg-white border-gray-300" data-testid="filter-team">
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

          <div className="flex items-center gap-2">
            <span className="text-sm text-gray-600">Month</span>
            <MonthPicker
              value={filters.month}
              onChange={(val) => setFilters({ ...filters, month: val })}
              className="w-40"
              data-testid="filter-month"
            />
          </div>

          <div className="flex items-center gap-2">
            <span className="text-sm text-gray-600">Search</span>
            <Input
              placeholder="name, username or email"
              value={filters.search}
              onChange={(e) => setFilters({ ...filters, search: e.target.value })}
              className="w-52 bg-white border-gray-300"
              data-testid="filter-search"
            />
          </div>

          <Button 
            onClick={handleApply}
            className="bg-[#0b1f3b] hover:bg-[#162d4d] text-white px-6"
            data-testid="apply-btn"
          >
            Apply
          </Button>
          <Button 
            onClick={handleExportCSV}
            className="bg-[#0b1f3b] hover:bg-[#162d4d] text-white px-6"
            data-testid="export-csv-btn"
          >
            Export CSV
          </Button>
        </div>
      </div>

      {/* Content Section */}
      <div className="bg-[#fffdf7] rounded-lg border border-black/5 p-4">
        {/* Section Header */}
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold text-gray-900" style={{ fontFamily: 'Outfit, sans-serif' }}>
            {activeTab === 'employees' ? 'Employees' : `Teams - ${filters.month}`}
          </h2>
          <Button
            variant="outline"
            onClick={() => setViewMode(viewMode === 'grid' ? 'table' : 'grid')}
            className="text-[#0b1f3b] border-[#0b1f3b] hover:bg-[#0b1f3b]/10"
            data-testid="toggle-view-btn"
          >
            {viewMode === 'grid' ? 'Switch to Table View' : 'Switch to Grid View'}
          </Button>
        </div>

        {/* Secondary Table Filters */}
        {viewMode === 'table' && (
          <div className="bg-[#fffdf7] rounded-lg border border-black/10 p-4 mb-4">
            <div className="flex flex-wrap items-center gap-4">
              <div className="flex items-center gap-2">
                <span className="text-sm text-gray-600">From</span>
                <MonthPicker
                  value={tableFilters.fromMonth}
                  onChange={(val) => setTableFilters({ ...tableFilters, fromMonth: val })}
                  className="w-40"
                  data-testid="table-filter-from"
                />
              </div>
              <div className="flex items-center gap-2">
                <span className="text-sm text-gray-600">To</span>
                <MonthPicker
                  value={tableFilters.toMonth}
                  onChange={(val) => setTableFilters({ ...tableFilters, toMonth: val })}
                  className="w-40"
                  data-testid="table-filter-to"
                />
              </div>
              <Select 
                value={String(tableFilters.pageSize)} 
                onValueChange={(v) => {
                  setTableFilters({ ...tableFilters, pageSize: parseInt(v) });
                  setCurrentPage(1);
                }}
              >
                <SelectTrigger className="w-20 bg-white border-gray-300" data-testid="page-size-select">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="10">10</SelectItem>
                  <SelectItem value="25">25</SelectItem>
                  <SelectItem value="50">50</SelectItem>
                  <SelectItem value="100">100</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        )}

        {/* Employees View */}
        {activeTab === 'employees' && (
          <>
            {viewMode === 'grid' ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {filteredEmployees.map((employee) => (
                  <div key={employee.id} className="bg-[#fffdf7] rounded-lg border border-black/5 p-4 hover:shadow-md transition-shadow">
                    <h3 className="font-semibold text-gray-900">{employee.name}</h3>
                    <p className="text-sm text-gray-500 mt-1">{employee.email}</p>
                    <p className="text-sm text-gray-600 mt-1">{employee.team}</p>
                    <div className="flex items-center gap-4 mt-3 pt-3 border-t">
                      <div>
                        <span className="text-sm text-gray-500">Stars: </span>
                        <span className="font-semibold">{employee.stars || 0}</span>
                      </div>
                      <div>
                        <span className="text-sm text-gray-500">Unsafe: </span>
                        <span className="font-semibold">{employee.unsafe_count || 0}</span>
                      </div>
                    </div>
                    <div className="flex gap-2 mt-3">
                      <Button size="sm" onClick={() => handleViewEmployee(employee)} className="bg-[#0b1f3b] hover:bg-[#162d4d] text-white">
                        View
                      </Button>
                      {canAddStars && (
                        <Button size="sm" variant="outline" onClick={() => handleAddStars(employee)} className="border-[#0b1f3b] text-[#0b1f3b]">
                          Add
                        </Button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <>
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead className="bg-gray-50 border-b">
                      <tr>
                        <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700">Name</th>
                        <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700">Email</th>
                        <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700">Team</th>
                        <th className="px-4 py-3 text-center text-sm font-semibold text-gray-700">Stars</th>
                        <th className="px-4 py-3 text-center text-sm font-semibold text-gray-700">Unsafe</th>
                        <th className="px-4 py-3 text-center text-sm font-semibold text-gray-700">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100">
                      {paginatedEmployees.map((employee) => (
                        <tr key={employee.id} className="hover:bg-gray-50">
                          <td className="px-4 py-3 text-sm text-gray-900">{employee.name}</td>
                          <td className="px-4 py-3 text-sm text-gray-600">{employee.email}</td>
                          <td className="px-4 py-3 text-sm text-gray-600">{employee.team}</td>
                          <td className="px-4 py-3 text-sm text-center">{employee.stars || 0}</td>
                          <td className="px-4 py-3 text-sm text-center">{employee.unsafe_count || 0}</td>
                          <td className="px-4 py-3">
                            <div className="flex gap-2 justify-center">
                              <Button size="sm" onClick={() => handleViewEmployee(employee)} className="bg-[#0b1f3b] hover:bg-[#162d4d] text-white">
                                View
                              </Button>
                              {canAddStars && (
                                <Button size="sm" variant="outline" onClick={() => handleAddStars(employee)} className="border-[#0b1f3b] text-[#0b1f3b]">
                                  Add
                                </Button>
                              )}
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                {/* Pagination */}
                <div className="flex items-center gap-4 mt-4 pt-4 border-t text-sm text-[#0b1f3b]">
                  <span>Page {currentPage} of {totalPages || 1} ({filteredEmployees.length} rows)</span>
                  {currentPage < totalPages && (
                    <Button 
                      variant="outline" 
                      size="sm" 
                      onClick={() => setCurrentPage(p => p + 1)}
                      className="border-[#0b1f3b] text-[#0b1f3b]"
                    >
                      Next
                    </Button>
                  )}
                  <div className="flex items-center gap-2">
                    <span>Go to page</span>
                    <Input
                      type="number"
                      value={goToPage}
                      onChange={(e) => setGoToPage(e.target.value)}
                      className="w-16 h-8"
                      min="1"
                      max={totalPages}
                    />
                    <Button 
                      size="sm" 
                      onClick={handleGoToPage}
                      className="bg-[#0b1f3b] hover:bg-[#162d4d] text-white"
                    >
                      Go
                    </Button>
                  </div>
                </div>
              </>
            )}
          </>
        )}

        {/* Teams View */}
        {activeTab === 'teams' && (
          <>
            {viewMode === 'grid' ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {teamStats.map((team) => (
                  <div key={team.id} className="bg-[#fffdf7] rounded-lg border border-black/5 p-4 hover:shadow-md transition-shadow">
                    <h3 className="font-bold text-gray-900 text-lg">{team.name}</h3>
                    <p className="text-sm text-gray-600 mt-2">
                      Members: {team.members} Team stars: {team.totalStars.toFixed(2)} Avg: {team.avgStars.toFixed(2)}
                    </p>
                    <Button 
                      variant="outline" 
                      size="sm" 
                      className="mt-4 border-[#0b1f3b] text-[#0b1f3b]"
                      onClick={() => handleViewTeamMembers(team)}
                    >
                      View members
                    </Button>
                  </div>
                ))}
              </div>
            ) : (
              <>
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead className="bg-gray-50 border-b">
                      <tr>
                        <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700">Team ▲</th>
                        <th className="px-4 py-3 text-center text-sm font-semibold text-gray-700">Members</th>
                        <th className="px-4 py-3 text-center text-sm font-semibold text-gray-700">Team Stars</th>
                        <th className="px-4 py-3 text-center text-sm font-semibold text-gray-700">Avg</th>
                        <th className="px-4 py-3 text-center text-sm font-semibold text-gray-700">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100">
                      {teamStats.map((team) => (
                        <React.Fragment key={team.id}>
                          <tr className="hover:bg-gray-50">
                            <td className="px-4 py-3 text-sm text-gray-900">{team.name}</td>
                            <td className="px-4 py-3 text-sm text-center">{team.members} members</td>
                            <td className="px-4 py-3 text-sm text-center">{team.totalStars.toFixed(2)}</td>
                            <td className="px-4 py-3 text-sm text-center">{team.avgStars.toFixed(2)}</td>
                            <td className="px-4 py-3">
                              <div className="flex justify-center">
                                <Button 
                                  size="sm" 
                                  onClick={() => handleViewTeamMembers(team)}
                                  className="bg-[#0b1f3b] hover:bg-[#162d4d] text-white"
                                >
                                  View members
                                </Button>
                              </div>
                            </td>
                          </tr>
                        </React.Fragment>
                      ))}
                    </tbody>
                  </table>
                </div>

                {/* Teams Pagination */}
                <div className="flex items-center gap-4 mt-4 pt-4 border-t text-sm text-[#0b1f3b]">
                  <span>Page 1 of 1 ({teamStats.length} teams)</span>
                  <div className="flex items-center gap-2">
                    <span>Go to page</span>
                    <Input
                      type="number"
                      value="1"
                      className="w-16 h-8"
                      min="1"
                      disabled
                    />
                    <Button 
                      size="sm" 
                      className="bg-[#0b1f3b] hover:bg-[#162d4d] text-white"
                    >
                      Go
                    </Button>
                  </div>
                </div>
              </>
            )}
          </>
        )}
      </div>

      {/* View History Modal */}
      <Dialog open={showViewModal} onOpenChange={setShowViewModal}>
        <DialogContent className="bg-[#fffdf7] max-w-2xl">
          <DialogHeader>
            <DialogTitle style={{ fontFamily: 'Outfit, sans-serif' }}>
              Star History - {selectedEmployee?.name}
            </DialogTitle>
          </DialogHeader>
          <div className="py-4">
            <div className="flex items-center gap-4 mb-4 p-4 bg-gray-50 rounded-lg">
              <div>
                <p className="text-sm text-gray-500">Current Stars</p>
                <p className={`text-2xl font-bold ${(selectedEmployee?.stars || 0) >= 0 ? 'text-emerald-600' : 'text-red-600'}`}>
                  {selectedEmployee?.stars || 0}
                </p>
              </div>
              <div>
                <p className="text-sm text-gray-500">Unsafe Count</p>
                <p className="text-2xl font-bold text-amber-600">{selectedEmployee?.unsafe_count || 0}</p>
              </div>
            </div>
            
            {loadingHistory ? (
              <div className="flex items-center justify-center py-8">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#0b1f3b]"></div>
              </div>
            ) : starHistory.length === 0 ? (
              <p className="text-center text-gray-500 py-8">No history records found</p>
            ) : (
              <div className="space-y-2 max-h-64 overflow-y-auto">
                {starHistory.map((record) => (
                  <div key={record.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg border">
                    <div>
                      <p className="text-sm font-medium text-gray-700">{record.type}</p>
                      <p className="text-sm text-gray-600">{record.reason}</p>
                      <p className="text-xs text-gray-400">{record.month}</p>
                    </div>
                    <Badge className={record.stars >= 0 ? 'bg-emerald-100 text-emerald-700' : 'bg-red-100 text-red-700'}>
                      {record.stars > 0 ? `+${record.stars}` : record.stars}
                    </Badge>
                  </div>
                ))}
              </div>
            )}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowViewModal(false)}>Close</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default StarReward;
