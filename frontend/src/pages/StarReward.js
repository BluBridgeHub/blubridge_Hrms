import { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import axios from 'axios';
import { toast } from 'sonner';
import { 
  Star, 
  Search, 
  Download,
  Plus,
  Eye,
  TableIcon,
  LayoutGrid
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

const EmployeeCard = ({ employee, onView, onAdd, canAdd }) => (
  <div className="bg-[#fffdf7] rounded-xl border border-black/5 p-6 hover:shadow-lg transition-all duration-200 card-hover">
    <h3 className="font-semibold text-[#004EEB]" style={{ fontFamily: 'Outfit, sans-serif' }}>
      {employee.name}
    </h3>
    <p className="text-sm text-gray-500 mt-1">{employee.email}</p>
    <p className="text-sm text-gray-600 mt-1">{employee.team}</p>
    
    <div className="flex items-center justify-between mt-4 pt-4 border-t border-gray-100">
      <div>
        <p className={`text-2xl font-bold ${employee.stars >= 0 ? 'text-emerald-600' : 'text-red-600'}`}>
          {employee.stars}
        </p>
        <p className="text-xs text-gray-500">Stars</p>
      </div>
      <div>
        <p className="text-2xl font-bold text-amber-600">{employee.unsafe_count}</p>
        <p className="text-xs text-gray-500">Unsafe</p>
      </div>
    </div>

    <div className="flex gap-2 mt-4">
      <Button
        size="sm"
        onClick={() => onView(employee)}
        className="bg-[#004EEB] hover:bg-[#003cc9] text-white flex-1"
        data-testid={`view-btn-${employee.id}`}
      >
        <Eye className="w-4 h-4 mr-1" />
        View
      </Button>
      {canAdd && (
        <Button
          size="sm"
          variant="outline"
          onClick={() => onAdd(employee)}
          className="flex-1"
          data-testid={`add-btn-${employee.id}`}
        >
          <Plus className="w-4 h-4 mr-1" />
          Add
        </Button>
      )}
    </div>
  </div>
);

const StarReward = () => {
  const { getAuthHeaders, user } = useAuth();
  const [employees, setEmployees] = useState([]);
  const [teams, setTeams] = useState([]);
  const [loading, setLoading] = useState(true);
  const [viewMode, setViewMode] = useState('grid');
  const [activeView, setActiveView] = useState('employees');
  const [selectedEmployee, setSelectedEmployee] = useState(null);
  const [showAddModal, setShowAddModal] = useState(false);
  const [showViewModal, setShowViewModal] = useState(false);
  const [starHistory, setStarHistory] = useState([]);
  const [addForm, setAddForm] = useState({ stars: 1, reason: '' });
  const [filters, setFilters] = useState({
    team: 'All',
    month: new Date().toISOString().slice(0, 7),
    search: ''
  });

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      setLoading(true);
      const [employeesRes, teamsRes] = await Promise.all([
        axios.get(`${API}/star-rewards`, {
          headers: getAuthHeaders(),
          params: { team: filters.team !== 'All' ? filters.team : undefined }
        }),
        axios.get(`${API}/teams`, { headers: getAuthHeaders() })
      ]);
      setEmployees(employeesRes.data);
      setTeams(teamsRes.data);
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
          team: filters.team !== 'All' ? filters.team : undefined,
          month: filters.month,
          search: filters.search || undefined
        }
      });
      setEmployees(response.data);
      toast.success('Filters applied');
    } catch (error) {
      toast.error('Failed to apply filters');
    } finally {
      setLoading(false);
    }
  };

  const handleExportCSV = () => {
    const headers = ['Name', 'Email', 'Team', 'Stars', 'Unsafe Count'];
    const rows = employees.map(e => [e.name, e.email, e.team, e.stars, e.unsafe_count]);
    const csv = [headers, ...rows].map(row => row.join(',')).join('\n');
    
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `star-rewards-${filters.month}.csv`;
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
    setAddForm({ stars: 1, reason: '' });
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
        reason: addForm.reason
      }, { headers: getAuthHeaders() });
      
      toast.success('Stars awarded successfully');
      setShowAddModal(false);
      fetchData();
    } catch (error) {
      toast.error(error.response?.data?.detail || 'Failed to award stars');
    }
  };

  const canAddStars = ['admin', 'hr_manager', 'team_lead'].includes(user?.role);

  const filteredEmployees = employees.filter(e => {
    if (filters.search) {
      const search = filters.search.toLowerCase();
      return e.name.toLowerCase().includes(search) || 
             e.email.toLowerCase().includes(search);
    }
    return true;
  });

  // Group employees by team for team view
  const teamGroups = teams.reduce((acc, team) => {
    acc[team.name] = filteredEmployees.filter(e => e.team === team.name);
    return acc;
  }, {});

  return (
    <div className="space-y-6 animate-fade-in" data-testid="star-reward-page">
      {/* Page Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900" style={{ fontFamily: 'Outfit, sans-serif' }}>
            Star Rating
          </h1>
          <p className="text-sm text-gray-500 mt-1">
            Department: Research Unit — Month: {filters.month}
          </p>
        </div>
        
        <div className="flex gap-2">
          <Button
            variant={activeView === 'employees' ? 'default' : 'outline'}
            onClick={() => setActiveView('employees')}
            className={activeView === 'employees' ? 'bg-[#004EEB] text-white' : ''}
            data-testid="view-employees-btn"
          >
            Employees
          </Button>
          <Button
            variant={activeView === 'teams' ? 'default' : 'outline'}
            onClick={() => setActiveView('teams')}
            className={activeView === 'teams' ? 'bg-[#004EEB] text-white' : ''}
            data-testid="view-teams-btn"
          >
            Teams
          </Button>
        </div>
      </div>

      {/* Filter Section */}
      <div className="bg-[#fffdf7] rounded-xl border border-black/5 p-6">
        <div className="flex flex-wrap items-center gap-4">
          <div className="flex items-center gap-2">
            <span className="text-sm text-gray-600">Team</span>
            <Select value={filters.team} onValueChange={(v) => setFilters({ ...filters, team: v })}>
              <SelectTrigger className="w-32 bg-white" data-testid="filter-team">
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
              className="w-40 bg-white"
              data-testid="filter-month"
            />
          </div>

          <div className="flex items-center gap-2">
            <span className="text-sm text-gray-600">Search</span>
            <Input
              placeholder="name, username or email"
              value={filters.search}
              onChange={(e) => setFilters({ ...filters, search: e.target.value })}
              className="w-48 bg-white"
              data-testid="filter-search"
            />
          </div>

          <Button 
            onClick={handleApply}
            className="bg-[#004EEB] hover:bg-[#003cc9] text-white"
            data-testid="apply-btn"
          >
            Apply
          </Button>
          <Button 
            onClick={handleExportCSV}
            className="bg-[#004EEB] hover:bg-[#003cc9] text-white"
            data-testid="export-csv-btn"
          >
            <Download className="w-4 h-4 mr-2" />
            Export CSV
          </Button>
        </div>
      </div>

      {/* Content */}
      {activeView === 'employees' && (
        <>
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-semibold" style={{ fontFamily: 'Outfit, sans-serif' }}>
              Employees
            </h2>
            <Button
              variant="outline"
              onClick={() => setViewMode(viewMode === 'grid' ? 'table' : 'grid')}
              data-testid="toggle-view-btn"
            >
              {viewMode === 'grid' ? (
                <><TableIcon className="w-4 h-4 mr-2" /> Switch to Table View</>
              ) : (
                <><LayoutGrid className="w-4 h-4 mr-2" /> Switch to Grid View</>
              )}
            </Button>
          </div>

          {loading ? (
            <div className="flex items-center justify-center h-64">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#004EEB]"></div>
            </div>
          ) : viewMode === 'grid' ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {filteredEmployees.map((employee) => (
                <EmployeeCard
                  key={employee.id}
                  employee={employee}
                  onView={handleViewEmployee}
                  onAdd={handleAddStars}
                  canAdd={canAddStars}
                />
              ))}
            </div>
          ) : (
            <div className="bg-[#fffdf7] rounded-xl border border-black/5 overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-gray-50/50">
                    <tr>
                      <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase">Name</th>
                      <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase">Email</th>
                      <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase">Team</th>
                      <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase">Stars</th>
                      <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase">Unsafe</th>
                      <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100">
                    {filteredEmployees.map((employee) => (
                      <tr key={employee.id} className="hover:bg-gray-50/50">
                        <td className="px-6 py-4 text-sm font-medium text-gray-900">{employee.name}</td>
                        <td className="px-6 py-4 text-sm text-gray-600">{employee.email}</td>
                        <td className="px-6 py-4 text-sm text-gray-600">{employee.team}</td>
                        <td className="px-6 py-4">
                          <span className={`font-semibold ${employee.stars >= 0 ? 'text-emerald-600' : 'text-red-600'}`}>
                            {employee.stars}
                          </span>
                        </td>
                        <td className="px-6 py-4 text-sm text-amber-600 font-semibold">{employee.unsafe_count}</td>
                        <td className="px-6 py-4">
                          <div className="flex gap-2">
                            <Button size="sm" onClick={() => handleViewEmployee(employee)} className="bg-[#004EEB] hover:bg-[#003cc9] text-white">
                              View
                            </Button>
                            {canAddStars && (
                              <Button size="sm" variant="outline" onClick={() => handleAddStars(employee)}>
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
            </div>
          )}
        </>
      )}

      {activeView === 'teams' && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {teams.map((team) => (
            <div key={team.id} className="bg-[#fffdf7] rounded-xl border border-black/5 p-6 hover:shadow-lg transition-all duration-200">
              <h3 className="font-semibold text-gray-900" style={{ fontFamily: 'Outfit, sans-serif' }}>
                {team.name}
              </h3>
              <div className="mt-4 pt-4 border-t border-gray-100">
                <p className="text-sm text-[#004EEB] font-medium">Members</p>
                <p className="text-3xl font-bold mt-1">{teamGroups[team.name]?.length || team.member_count}</p>
              </div>
              <Button
                className="w-full mt-4 bg-[#004EEB] hover:bg-[#003cc9] text-white"
                data-testid={`team-details-btn-${team.id}`}
              >
                View Details
              </Button>
            </div>
          ))}
        </div>
      )}

      {/* Add Stars Modal */}
      <Dialog open={showAddModal} onOpenChange={setShowAddModal}>
        <DialogContent className="bg-[#fffdf7]">
          <DialogHeader>
            <DialogTitle style={{ fontFamily: 'Outfit, sans-serif' }}>
              Award Stars to {selectedEmployee?.name}
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div>
              <Label>Number of Stars</Label>
              <Select value={String(addForm.stars)} onValueChange={(v) => setAddForm({ ...addForm, stars: parseInt(v) })}>
                <SelectTrigger className="bg-white mt-1" data-testid="stars-select">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {[-5, -4, -3, -2, -1, 1, 2, 3, 4, 5].map((n) => (
                    <SelectItem key={n} value={String(n)}>{n > 0 ? `+${n}` : n}</SelectItem>
                  ))}
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
            <Button onClick={submitAddStars} className="bg-[#004EEB] hover:bg-[#003cc9] text-white" data-testid="submit-stars-btn">
              Award Stars
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

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
                <p className={`text-2xl font-bold ${selectedEmployee?.stars >= 0 ? 'text-emerald-600' : 'text-red-600'}`}>
                  {selectedEmployee?.stars}
                </p>
              </div>
              <div>
                <p className="text-sm text-gray-500">Unsafe Count</p>
                <p className="text-2xl font-bold text-amber-600">{selectedEmployee?.unsafe_count}</p>
              </div>
            </div>
            
            {starHistory.length === 0 ? (
              <p className="text-center text-gray-500 py-8">No history records found</p>
            ) : (
              <div className="space-y-2 max-h-64 overflow-y-auto">
                {starHistory.map((record) => (
                  <div key={record.id} className="flex items-center justify-between p-3 bg-white rounded-lg border">
                    <div>
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
