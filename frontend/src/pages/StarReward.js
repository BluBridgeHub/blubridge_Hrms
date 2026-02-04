import React, { useState, useEffect, useMemo } from 'react';
import { useAuth } from '../contexts/AuthContext';
import axios from 'axios';
import { toast } from 'sonner';
import { 
  Download,
  Plus,
  Eye,
  ChevronDown,
  ChevronUp
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

const API = `${process.env.REACT_APP_BACKEND_URL}/api`;

const StarReward = () => {
  const { getAuthHeaders, user } = useAuth();
  const [employees, setEmployees] = useState([]);
  const [teams, setTeams] = useState([]);
  const [loading, setLoading] = useState(true);
  
  // View modes
  const [activeTab, setActiveTab] = useState('employees'); // 'employees' | 'teams'
  const [viewMode, setViewMode] = useState('table'); // 'table' | 'grid'
  
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
  
  // Expanded teams in table view
  const [expandedTeams, setExpandedTeams] = useState({});
  
  // Modals
  const [selectedEmployee, setSelectedEmployee] = useState(null);
  const [showAddModal, setShowAddModal] = useState(false);
  const [showViewModal, setShowViewModal] = useState(false);
  const [starHistory, setStarHistory] = useState([]);
  const [addForm, setAddForm] = useState({ stars: 1, reason: '', type: 'performance' });

  useEffect(() => {
    fetchData();
  }, []);

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
      // Filter teams to only Research Unit teams
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
    setSelectedEmployee(employee);
    try {
      const response = await axios.get(`${API}/star-rewards/history/${employee.id}`, {
        headers: getAuthHeaders()
      });
      setStarHistory(response.data);
      setShowViewModal(true);
    } catch (error) {
      toast.error('Failed to load history');
    }
  };

  const handleAddStars = (employee) => {
    setSelectedEmployee(employee);
    setAddForm({ stars: 1, reason: '', type: 'performance' });
    setShowAddModal(true);
  };

  const submitAddStars = async () => {
    if (!addForm.reason.trim()) {
      toast.error('Please provide a reason');
      return;
    }

    try {
      await axios.post(`${API}/star-rewards`, {
        employee_id: selectedEmployee.id,
        stars: addForm.stars,
        reason: addForm.reason,
        type: addForm.type
      }, { headers: getAuthHeaders() });
      
      toast.success('Stars awarded successfully');
      setShowAddModal(false);
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

  // Toggle team expansion
  const toggleTeamExpansion = (teamId) => {
    setExpandedTeams(prev => ({
      ...prev,
      [teamId]: !prev[teamId]
    }));
  };

  // Handle go to page
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
            <Input
              type="month"
              value={filters.month}
              onChange={(e) => setFilters({ ...filters, month: e.target.value })}
              className="w-36 bg-white border-gray-300"
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
            className="bg-[#2563eb] hover:bg-[#1d4ed8] text-white px-6"
            data-testid="apply-btn"
          >
            Apply
          </Button>
          <Button 
            onClick={handleExportCSV}
            className="bg-[#2563eb] hover:bg-[#1d4ed8] text-white px-6"
            data-testid="export-csv-btn"
          >
            Export CSV
          </Button>
        </div>
      </div>

      {/* Content Section */}
      <div className="bg-white rounded-lg border border-[#2563eb]/30 p-4">
        {/* Section Header */}
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold text-gray-900" style={{ fontFamily: 'Outfit, sans-serif' }}>
            {activeTab === 'employees' ? 'Employees' : `Teams - ${filters.month}`}
          </h2>
          <Button
            variant="outline"
            onClick={() => setViewMode(viewMode === 'grid' ? 'table' : 'grid')}
            className="text-[#2563eb] border-[#2563eb] hover:bg-[#2563eb]/10"
            data-testid="toggle-view-btn"
          >
            {viewMode === 'grid' ? 'Switch to Table View' : 'Switch to Grid View'}
          </Button>
        </div>

        {/* Secondary Table Filters */}
        {viewMode === 'table' && (
          <div className="bg-white rounded-lg border border-red-200 p-4 mb-4">
            <div className="flex flex-wrap items-center gap-4">
              <div className="flex items-center gap-2">
                <span className="text-sm text-gray-600">From</span>
                <Input
                  type="month"
                  value={tableFilters.fromMonth}
                  onChange={(e) => setTableFilters({ ...tableFilters, fromMonth: e.target.value })}
                  className="w-36 bg-white border-gray-300"
                  data-testid="table-filter-from"
                />
              </div>
              <div className="flex items-center gap-2">
                <span className="text-sm text-gray-600">To</span>
                <Input
                  type="month"
                  value={tableFilters.toMonth}
                  onChange={(e) => setTableFilters({ ...tableFilters, toMonth: e.target.value })}
                  className="w-36 bg-white border-gray-300"
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
                  <div key={employee.id} className="bg-white rounded-lg border border-gray-200 p-4 hover:shadow-md transition-shadow">
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
                      <Button size="sm" onClick={() => handleViewEmployee(employee)} className="bg-[#2563eb] hover:bg-[#1d4ed8] text-white">
                        View
                      </Button>
                      {canAddStars && (
                        <Button size="sm" variant="outline" onClick={() => handleAddStars(employee)} className="border-[#2563eb] text-[#2563eb]">
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
                              <Button size="sm" onClick={() => handleViewEmployee(employee)} className="bg-[#2563eb] hover:bg-[#1d4ed8] text-white">
                                View
                              </Button>
                              {canAddStars && (
                                <Button size="sm" variant="outline" onClick={() => handleAddStars(employee)} className="border-[#2563eb] text-[#2563eb]">
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
                <div className="flex items-center gap-4 mt-4 pt-4 border-t text-sm text-[#2563eb]">
                  <span>Page {currentPage} of {totalPages || 1} ({filteredEmployees.length} rows)</span>
                  {currentPage < totalPages && (
                    <Button 
                      variant="outline" 
                      size="sm" 
                      onClick={() => setCurrentPage(p => p + 1)}
                      className="border-[#2563eb] text-[#2563eb]"
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
                      className="bg-[#2563eb] hover:bg-[#1d4ed8] text-white"
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
                  <div key={team.id} className="bg-white rounded-lg border border-gray-200 p-4 hover:shadow-md transition-shadow">
                    <h3 className="font-bold text-gray-900 text-lg">{team.name}</h3>
                    <p className="text-sm text-gray-600 mt-2">
                      Members: {team.members} Team stars: {team.totalStars.toFixed(2)} Avg: {team.avgStars.toFixed(2)}
                    </p>
                    <Button 
                      variant="outline" 
                      size="sm" 
                      className="mt-4 border-[#2563eb] text-[#2563eb]"
                      onClick={() => toggleTeamExpansion(team.id)}
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
                                  onClick={() => toggleTeamExpansion(team.id)}
                                  className="bg-[#2563eb] hover:bg-[#1d4ed8] text-white"
                                >
                                  View members
                                </Button>
                              </div>
                            </td>
                          </tr>
                          {/* Expanded team members */}
                          {expandedTeams[team.id] && team.employees.length > 0 && (
                            <>
                              <tr className="bg-gray-100">
                                <td className="px-8 py-2 text-xs font-semibold text-gray-600">Name</td>
                                <td className="px-4 py-2 text-xs font-semibold text-gray-600 text-center">Email</td>
                                <td className="px-4 py-2 text-xs font-semibold text-gray-600 text-center">Stars</td>
                                <td className="px-4 py-2 text-xs font-semibold text-gray-600 text-center">Unsafe</td>
                                <td className="px-4 py-2 text-xs font-semibold text-gray-600 text-center">Actions</td>
                              </tr>
                              {team.employees.map((emp) => (
                                <tr key={emp.id} className="bg-gray-50 hover:bg-gray-100">
                                  <td className="px-8 py-2 text-sm text-gray-900">{emp.name}</td>
                                  <td className="px-4 py-2 text-sm text-gray-600 text-center">{emp.email}</td>
                                  <td className="px-4 py-2 text-sm text-center">{emp.stars || 0}</td>
                                  <td className="px-4 py-2 text-sm text-center">{emp.unsafe_count || 0}</td>
                                  <td className="px-4 py-2">
                                    <div className="flex gap-2 justify-center">
                                      <Button size="sm" onClick={() => handleViewEmployee(emp)} className="bg-[#2563eb] hover:bg-[#1d4ed8] text-white text-xs px-3">
                                        View
                                      </Button>
                                      {canAddStars && (
                                        <Button size="sm" variant="outline" onClick={() => handleAddStars(emp)} className="border-[#2563eb] text-[#2563eb] text-xs px-3">
                                          Add
                                        </Button>
                                      )}
                                    </div>
                                  </td>
                                </tr>
                              ))}
                            </>
                          )}
                        </React.Fragment>
                      ))}
                    </tbody>
                  </table>
                </div>

                {/* Teams Pagination */}
                <div className="flex items-center gap-4 mt-4 pt-4 border-t text-sm text-[#2563eb]">
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
                      className="bg-[#2563eb] hover:bg-[#1d4ed8] text-white"
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

      {/* Add Stars Modal */}
      <Dialog open={showAddModal} onOpenChange={setShowAddModal}>
        <DialogContent className="bg-white">
          <DialogHeader>
            <DialogTitle style={{ fontFamily: 'Outfit, sans-serif' }}>
              Award Stars to {selectedEmployee?.name}
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div>
              <Label>Star Type</Label>
              <Select value={addForm.type} onValueChange={(v) => setAddForm({ ...addForm, type: v })}>
                <SelectTrigger className="bg-white mt-1" data-testid="star-type-select">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="performance">Performance</SelectItem>
                  <SelectItem value="learning">Learning</SelectItem>
                  <SelectItem value="innovation">Innovation</SelectItem>
                  <SelectItem value="unsafe">Unsafe Methods (Negative)</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>Number of Stars</Label>
              <Select value={String(addForm.stars)} onValueChange={(v) => setAddForm({ ...addForm, stars: parseInt(v) })}>
                <SelectTrigger className="bg-white mt-1" data-testid="stars-select">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {addForm.type === 'unsafe' 
                    ? [-5, -4, -3, -2, -1].map((n) => (
                        <SelectItem key={n} value={String(n)}>{n}</SelectItem>
                      ))
                    : [1, 2, 3, 4, 5].map((n) => (
                        <SelectItem key={n} value={String(n)}>+{n}</SelectItem>
                      ))
                  }
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>Reason</Label>
              <Textarea
                placeholder="Enter reason for award..."
                value={addForm.reason}
                onChange={(e) => setAddForm({ ...addForm, reason: e.target.value })}
                className="bg-white mt-1"
                data-testid="reason-input"
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowAddModal(false)}>Cancel</Button>
            <Button onClick={submitAddStars} className="bg-[#2563eb] hover:bg-[#1d4ed8] text-white" data-testid="submit-stars-btn">
              Award Stars
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* View History Modal */}
      <Dialog open={showViewModal} onOpenChange={setShowViewModal}>
        <DialogContent className="bg-white max-w-2xl">
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
            
            {starHistory.length === 0 ? (
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
