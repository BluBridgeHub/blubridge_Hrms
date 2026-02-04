import { useState, useEffect, useCallback } from 'react';
import { useLocation } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import axios from 'axios';
import { toast } from 'sonner';
import { 
  CalendarDays, 
  Search, 
  Filter,
  RotateCcw,
  Check,
  X,
  ChevronUp,
  ChevronDown,
  Eye,
  AlertTriangle
} from 'lucide-react';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../components/ui/select';
import { Badge } from '../components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../components/ui/tabs';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogDescription,
} from '../components/ui/dialog';
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from '../components/ui/sheet';

const API = `${process.env.REACT_APP_BACKEND_URL}/api`;

const Leave = () => {
  const { getAuthHeaders, user } = useAuth();
  const location = useLocation();
  const [leaves, setLeaves] = useState([]);
  const [teams, setTeams] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('requests');
  const [sortField, setSortField] = useState('emp_name');
  const [sortOrder, setSortOrder] = useState('asc');
  const [selectedLeave, setSelectedLeave] = useState(null);
  const [showDetailSheet, setShowDetailSheet] = useState(false);
  const [showApproveDialog, setShowApproveDialog] = useState(false);
  const [showRejectDialog, setShowRejectDialog] = useState(false);
  const [actionLoading, setActionLoading] = useState(false);
  const [filters, setFilters] = useState({
    empName: '',
    team: 'All',
    fromDate: '',
    toDate: '',
    leaveType: 'All',
    status: 'All'
  });

  // Handle navigation state from Dashboard
  useEffect(() => {
    if (location.state?.tab) {
      if (location.state.tab === 'approved') {
        setFilters(prev => ({ ...prev, status: 'approved' }));
        setActiveTab('history');
      } else if (location.state.tab === 'pending') {
        setFilters(prev => ({ ...prev, status: 'pending' }));
        setActiveTab('requests');
      }
    }
  }, [location.state]);

  const fetchData = useCallback(async () => {
    try {
      setLoading(true);
      const [leavesRes, teamsRes] = await Promise.all([
        axios.get(`${API}/leaves`, { headers: getAuthHeaders() }),
        axios.get(`${API}/teams`, { headers: getAuthHeaders() })
      ]);
      setLeaves(leavesRes.data);
      setTeams(teamsRes.data);
    } catch (error) {
      console.error('Leave fetch error:', error);
      toast.error('Failed to load leave data');
    } finally {
      setLoading(false);
    }
  }, [getAuthHeaders]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const handleFilter = async () => {
    try {
      setLoading(true);
      const response = await axios.get(`${API}/leaves`, {
        headers: getAuthHeaders(),
        params: {
          employee_name: filters.empName || undefined,
          team: filters.team !== 'All' ? filters.team : undefined,
          from_date: filters.fromDate || undefined,
          to_date: filters.toDate || undefined,
          leave_type: filters.leaveType !== 'All' ? filters.leaveType : undefined,
          status: filters.status !== 'All' ? filters.status : undefined
        }
      });
      setLeaves(response.data);
      toast.success('Filter applied');
    } catch (error) {
      toast.error('Failed to filter');
    } finally {
      setLoading(false);
    }
  };

  const handleReset = () => {
    setFilters({
      empName: '',
      team: 'All',
      fromDate: '',
      toDate: '',
      leaveType: 'All',
      status: 'All'
    });
    fetchData();
    toast.info('Filters reset');
  };

  const handleViewLeave = (leave) => {
    setSelectedLeave(leave);
    setShowDetailSheet(true);
  };

  const openApproveDialog = (leave) => {
    setSelectedLeave(leave);
    setShowApproveDialog(true);
  };

  const openRejectDialog = (leave) => {
    setSelectedLeave(leave);
    setShowRejectDialog(true);
  };

  const confirmApprove = async () => {
    if (!selectedLeave) return;
    
    setActionLoading(true);
    try {
      await axios.put(`${API}/leaves/${selectedLeave.id}/approve`, {}, { headers: getAuthHeaders() });
      toast.success('Leave approved successfully! Email notification sent.');
      setShowApproveDialog(false);
      setShowDetailSheet(false);
      fetchData();
    } catch (error) {
      toast.error(error.response?.data?.detail || 'Failed to approve leave');
    } finally {
      setActionLoading(false);
    }
  };

  const confirmReject = async () => {
    if (!selectedLeave) return;
    
    setActionLoading(true);
    try {
      await axios.put(`${API}/leaves/${selectedLeave.id}/reject`, {}, { headers: getAuthHeaders() });
      toast.success('Leave rejected. Email notification sent.');
      setShowRejectDialog(false);
      setShowDetailSheet(false);
      fetchData();
    } catch (error) {
      toast.error(error.response?.data?.detail || 'Failed to reject leave');
    } finally {
      setActionLoading(false);
    }
  };

  const handleSort = (field) => {
    if (sortField === field) {
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortOrder('asc');
    }
  };

  const sortedLeaves = [...leaves].sort((a, b) => {
    const aVal = a[sortField] || '';
    const bVal = b[sortField] || '';
    if (sortOrder === 'asc') {
      return aVal.localeCompare(bVal);
    }
    return bVal.localeCompare(aVal);
  });

  const pendingLeaves = sortedLeaves.filter(l => l.status === 'pending');
  const historyLeaves = sortedLeaves.filter(l => l.status !== 'pending');

  const SortIcon = ({ field }) => {
    if (sortField !== field) return null;
    return sortOrder === 'asc' ? 
      <ChevronUp className="w-4 h-4 inline ml-1" /> : 
      <ChevronDown className="w-4 h-4 inline ml-1" />;
  };

  const getStatusBadge = (status) => {
    const styles = {
      'pending': 'bg-amber-100 text-amber-700',
      'approved': 'bg-emerald-100 text-emerald-700',
      'rejected': 'bg-red-100 text-red-700'
    };
    return styles[status] || 'bg-gray-100 text-gray-700';
  };

  const canApprove = ['admin', 'hr_manager', 'team_lead'].includes(user?.role);

  return (
    <div className="space-y-6 animate-fade-in" data-testid="leave-page">
      {/* Page Header */}
      <div className="flex items-center gap-3">
        <CalendarDays className="w-6 h-6 text-[#0b1f3b]" />
        <h1 className="text-2xl font-bold text-[#0b1f3b]" style={{ fontFamily: 'Outfit, sans-serif' }}>
          Leave Management
        </h1>
      </div>

      {/* Filter Section */}
      <div className="bg-[#fffdf7] rounded-xl border border-black/5 p-6 transition-all duration-300 hover:shadow-md">
        <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-6 gap-4">
          <div>
            <label className="text-sm text-gray-600 mb-1 block">Emp Name:</label>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
              <Input
                placeholder="Search"
                value={filters.empName}
                onChange={(e) => setFilters({ ...filters, empName: e.target.value })}
                className="pl-9 bg-white"
                data-testid="search-emp-name"
              />
            </div>
          </div>

          <div>
            <label className="text-sm text-gray-600 mb-1 block">From:</label>
            <Input
              type="date"
              value={filters.fromDate}
              onChange={(e) => setFilters({ ...filters, fromDate: e.target.value })}
              className="bg-white"
              data-testid="filter-from"
            />
          </div>

          <div>
            <label className="text-sm text-gray-600 mb-1 block">Leave Type:</label>
            <Select value={filters.leaveType} onValueChange={(v) => setFilters({ ...filters, leaveType: v })}>
              <SelectTrigger className="bg-white" data-testid="filter-leave-type">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="All">All</SelectItem>
                <SelectItem value="Sick">Sick</SelectItem>
                <SelectItem value="Casual">Casual</SelectItem>
                <SelectItem value="Annual">Annual</SelectItem>
                <SelectItem value="Maternity">Maternity</SelectItem>
                <SelectItem value="Paternity">Paternity</SelectItem>
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
                <SelectItem value="All">All</SelectItem>
                {teams.map((team) => (
                  <SelectItem key={team.id} value={team.name}>{team.name}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div>
            <label className="text-sm text-gray-600 mb-1 block">To:</label>
            <Input
              type="date"
              value={filters.toDate}
              onChange={(e) => setFilters({ ...filters, toDate: e.target.value })}
              className="bg-white"
              data-testid="filter-to"
            />
          </div>

          <div>
            <label className="text-sm text-gray-600 mb-1 block">Status:</label>
            <Select value={filters.status} onValueChange={(v) => setFilters({ ...filters, status: v })}>
              <SelectTrigger className="bg-white" data-testid="filter-status">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="All">All</SelectItem>
                <SelectItem value="pending">Pending</SelectItem>
                <SelectItem value="approved">Approved</SelectItem>
                <SelectItem value="rejected">Rejected</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
        
        <div className="flex gap-2 mt-4">
          <Button 
            onClick={handleFilter}
            className="bg-[#0b1f3b] hover:bg-[#162d4d] text-white transition-all duration-200 hover:shadow-lg"
            data-testid="filter-btn"
          >
            <Filter className="w-4 h-4 mr-2" />
            Filter
          </Button>
          <Button 
            variant="secondary"
            onClick={handleReset}
            className="bg-gray-500 hover:bg-gray-600 text-white transition-all duration-200"
            data-testid="reset-btn"
          >
            <RotateCcw className="w-4 h-4 mr-2" />
            Reset
          </Button>
        </div>
      </div>

      {/* Leave Table with Tabs */}
      <div className="bg-[#fffdf7] rounded-xl border border-black/5 overflow-hidden transition-all duration-300">
        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <div className="border-b border-black/5">
            <TabsList className="bg-transparent h-auto p-0">
              <TabsTrigger 
                value="requests" 
                className="px-6 py-4 rounded-none border-b-2 border-transparent data-[state=active]:border-[#0b1f3b] data-[state=active]:bg-[#0b1f3b] data-[state=active]:text-white transition-all duration-200"
                data-testid="tab-requests"
              >
                Leave Request ({pendingLeaves.length})
              </TabsTrigger>
              <TabsTrigger 
                value="history" 
                className="px-6 py-4 rounded-none border-b-2 border-transparent data-[state=active]:border-[#0b1f3b] data-[state=active]:bg-[#0b1f3b] data-[state=active]:text-white transition-all duration-200"
                data-testid="tab-history"
              >
                Leave History ({historyLeaves.length})
              </TabsTrigger>
            </TabsList>
          </div>

          <TabsContent value="requests" className="mt-0">
            {loading ? (
              <div className="flex items-center justify-center h-64">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#0b1f3b]"></div>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-gray-50/50">
                    <tr>
                      <th className="px-4 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider w-10"></th>
                      <th 
                        className="px-4 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider cursor-pointer hover:bg-gray-100 transition-colors"
                        onClick={() => handleSort('emp_name')}
                      >
                        Emp Name <SortIcon field="emp_name" />
                      </th>
                      <th 
                        className="px-4 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider cursor-pointer hover:bg-gray-100 transition-colors"
                        onClick={() => handleSort('team')}
                      >
                        Team <SortIcon field="team" />
                      </th>
                      <th className="px-4 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                        Type
                      </th>
                      <th className="px-4 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                        Date
                      </th>
                      <th className="px-4 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                        Duration
                      </th>
                      <th className="px-4 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                        Action
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100">
                    {pendingLeaves.length === 0 ? (
                      <tr>
                        <td colSpan="7" className="px-6 py-12 text-center text-gray-500">
                          No pending leave requests
                        </td>
                      </tr>
                    ) : (
                      pendingLeaves.map((leave) => (
                        <tr 
                          key={leave.id} 
                          className="hover:bg-gray-50/50 transition-colors duration-150"
                        >
                          <td className="px-4 py-4">
                            <button 
                              className="p-1 hover:bg-gray-100 rounded transition-colors"
                              onClick={() => handleViewLeave(leave)}
                            >
                              <Eye className="w-4 h-4 text-gray-400" />
                            </button>
                          </td>
                          <td className="px-4 py-4 text-sm font-medium text-gray-900">{leave.emp_name}</td>
                          <td className="px-4 py-4 text-sm text-gray-600">{leave.team}</td>
                          <td className="px-4 py-4 text-sm text-gray-600">{leave.leave_type}</td>
                          <td className="px-4 py-4 text-sm text-gray-600">{leave.start_date}</td>
                          <td className="px-4 py-4 text-sm text-gray-600">{leave.duration}</td>
                          <td className="px-4 py-4">
                            {canApprove && (
                              <div className="flex gap-2">
                                <Button
                                  size="sm"
                                  onClick={() => openApproveDialog(leave)}
                                  className="bg-emerald-500 hover:bg-emerald-600 text-white h-8 px-3 transition-all duration-200 hover:shadow-md"
                                  data-testid={`approve-btn-${leave.id}`}
                                >
                                  <Check className="w-4 h-4" />
                                </Button>
                                <Button
                                  size="sm"
                                  onClick={() => openRejectDialog(leave)}
                                  className="bg-red-500 hover:bg-red-600 text-white h-8 px-3 transition-all duration-200 hover:shadow-md"
                                  data-testid={`reject-btn-${leave.id}`}
                                >
                                  <X className="w-4 h-4" />
                                </Button>
                              </div>
                            )}
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            )}
          </TabsContent>

          <TabsContent value="history" className="mt-0">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50/50">
                  <tr>
                    <th className="px-4 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider w-10"></th>
                    <th className="px-4 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Emp Name</th>
                    <th className="px-4 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Team</th>
                    <th className="px-4 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Type</th>
                    <th className="px-4 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Date</th>
                    <th className="px-4 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Duration</th>
                    <th className="px-4 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {historyLeaves.length === 0 ? (
                    <tr>
                      <td colSpan="7" className="px-6 py-12 text-center text-gray-500">
                        No history records found
                      </td>
                    </tr>
                  ) : (
                    historyLeaves.map((leave) => (
                      <tr 
                        key={leave.id} 
                        className="hover:bg-gray-50/50 transition-colors duration-150"
                      >
                        <td className="px-4 py-4">
                          <button 
                            className="p-1 hover:bg-gray-100 rounded transition-colors"
                            onClick={() => handleViewLeave(leave)}
                          >
                            <Eye className="w-4 h-4 text-gray-400" />
                          </button>
                        </td>
                        <td className="px-4 py-4 text-sm font-medium text-gray-900">{leave.emp_name}</td>
                        <td className="px-4 py-4 text-sm text-gray-600">{leave.team}</td>
                        <td className="px-4 py-4 text-sm text-gray-600">{leave.leave_type}</td>
                        <td className="px-4 py-4 text-sm text-gray-600">{leave.start_date}</td>
                        <td className="px-4 py-4 text-sm text-gray-600">{leave.duration}</td>
                        <td className="px-4 py-4">
                          <Badge className={`${getStatusBadge(leave.status)} transition-all duration-200`}>
                            {leave.status}
                          </Badge>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </TabsContent>
        </Tabs>
      </div>

      {/* Leave Detail Sheet */}
      <Sheet open={showDetailSheet} onOpenChange={setShowDetailSheet}>
        <SheetContent className="w-full sm:max-w-md bg-[#fffdf7]">
          <SheetHeader>
            <SheetTitle style={{ fontFamily: 'Outfit, sans-serif' }}>Leave Request Details</SheetTitle>
          </SheetHeader>
          {selectedLeave && (
            <div className="py-6 space-y-4">
              <div className="flex items-center gap-4 pb-4 border-b">
                <div className="w-14 h-14 rounded-full bg-[#0b1f3b] flex items-center justify-center">
                  <span className="text-white text-xl font-bold">
                    {selectedLeave.emp_name?.charAt(0)?.toUpperCase()}
                  </span>
                </div>
                <div>
                  <h3 className="font-semibold text-lg">{selectedLeave.emp_name}</h3>
                  <p className="text-sm text-gray-500">{selectedLeave.team}</p>
                </div>
              </div>
              
              <div className="space-y-3">
                <div className="flex justify-between py-2 border-b border-dashed">
                  <span className="text-gray-500">Leave Type</span>
                  <span className="font-medium">{selectedLeave.leave_type}</span>
                </div>
                <div className="flex justify-between py-2 border-b border-dashed">
                  <span className="text-gray-500">Start Date</span>
                  <span className="font-medium">{selectedLeave.start_date}</span>
                </div>
                <div className="flex justify-between py-2 border-b border-dashed">
                  <span className="text-gray-500">End Date</span>
                  <span className="font-medium">{selectedLeave.end_date}</span>
                </div>
                <div className="flex justify-between py-2 border-b border-dashed">
                  <span className="text-gray-500">Duration</span>
                  <span className="font-medium">{selectedLeave.duration}</span>
                </div>
                <div className="flex justify-between py-2 border-b border-dashed">
                  <span className="text-gray-500">Status</span>
                  <Badge className={getStatusBadge(selectedLeave.status)}>
                    {selectedLeave.status}
                  </Badge>
                </div>
                {selectedLeave.reason && (
                  <div className="py-2">
                    <span className="text-gray-500 block mb-2">Reason</span>
                    <p className="text-sm bg-gray-50 p-3 rounded-lg">{selectedLeave.reason}</p>
                  </div>
                )}
              </div>

              {selectedLeave.status === 'pending' && canApprove && (
                <div className="flex gap-3 pt-4">
                  <Button
                    onClick={() => openApproveDialog(selectedLeave)}
                    className="flex-1 bg-emerald-500 hover:bg-emerald-600 text-white transition-all duration-200"
                  >
                    <Check className="w-4 h-4 mr-2" />
                    Approve
                  </Button>
                  <Button
                    onClick={() => openRejectDialog(selectedLeave)}
                    className="flex-1 bg-red-500 hover:bg-red-600 text-white transition-all duration-200"
                  >
                    <X className="w-4 h-4 mr-2" />
                    Reject
                  </Button>
                </div>
              )}
            </div>
          )}
        </SheetContent>
      </Sheet>

      {/* Approve Confirmation Dialog */}
      <Dialog open={showApproveDialog} onOpenChange={setShowApproveDialog}>
        <DialogContent className="bg-[#fffdf7]">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2" style={{ fontFamily: 'Outfit, sans-serif' }}>
              <Check className="w-5 h-5 text-emerald-500" />
              Approve Leave Request
            </DialogTitle>
            <DialogDescription>
              Are you sure you want to approve this leave request?
            </DialogDescription>
          </DialogHeader>
          {selectedLeave && (
            <div className="py-4 space-y-2">
              <p><span className="text-gray-500">Employee:</span> <span className="font-medium">{selectedLeave.emp_name}</span></p>
              <p><span className="text-gray-500">Type:</span> <span className="font-medium">{selectedLeave.leave_type}</span></p>
              <p><span className="text-gray-500">Duration:</span> <span className="font-medium">{selectedLeave.duration}</span></p>
              <p className="text-sm text-gray-500 mt-4">
                An email notification will be sent to the employee.
              </p>
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowApproveDialog(false)} disabled={actionLoading}>
              Cancel
            </Button>
            <Button 
              onClick={confirmApprove} 
              disabled={actionLoading}
              className="bg-emerald-500 hover:bg-emerald-600 text-white"
            >
              {actionLoading ? (
                <>
                  <div className="w-4 h-4 mr-2 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  Approving...
                </>
              ) : (
                <>
                  <Check className="w-4 h-4 mr-2" />
                  Confirm Approve
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Reject Confirmation Dialog */}
      <Dialog open={showRejectDialog} onOpenChange={setShowRejectDialog}>
        <DialogContent className="bg-[#fffdf7]">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2" style={{ fontFamily: 'Outfit, sans-serif' }}>
              <AlertTriangle className="w-5 h-5 text-red-500" />
              Reject Leave Request
            </DialogTitle>
            <DialogDescription>
              Are you sure you want to reject this leave request?
            </DialogDescription>
          </DialogHeader>
          {selectedLeave && (
            <div className="py-4 space-y-2">
              <p><span className="text-gray-500">Employee:</span> <span className="font-medium">{selectedLeave.emp_name}</span></p>
              <p><span className="text-gray-500">Type:</span> <span className="font-medium">{selectedLeave.leave_type}</span></p>
              <p><span className="text-gray-500">Duration:</span> <span className="font-medium">{selectedLeave.duration}</span></p>
              <p className="text-sm text-gray-500 mt-4">
                An email notification will be sent to the employee.
              </p>
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowRejectDialog(false)} disabled={actionLoading}>
              Cancel
            </Button>
            <Button 
              onClick={confirmReject} 
              disabled={actionLoading}
              className="bg-red-500 hover:bg-red-600 text-white"
            >
              {actionLoading ? (
                <>
                  <div className="w-4 h-4 mr-2 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  Rejecting...
                </>
              ) : (
                <>
                  <X className="w-4 h-4 mr-2" />
                  Confirm Reject
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default Leave;
