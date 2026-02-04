import { useState, useEffect, useCallback, useRef } from 'react';
import { useSearchParams } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import axios from 'axios';
import { toast } from 'sonner';
import { 
  CalendarDays,
  Plus,
  FileText,
  Upload,
  X,
  Clock,
  CheckCircle,
  XCircle,
  AlertCircle,
  Loader2,
  Edit2
} from 'lucide-react';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../components/ui/select';
import { Badge } from '../components/ui/badge';
import { Textarea } from '../components/ui/textarea';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '../components/ui/dialog';

const API = `${process.env.REACT_APP_BACKEND_URL}/api`;

const StatusBadge = ({ status }) => {
  const getStyle = () => {
    switch (status) {
      case 'approved':
        return { bg: 'bg-emerald-100', text: 'text-emerald-700', icon: CheckCircle };
      case 'rejected':
        return { bg: 'bg-red-100', text: 'text-red-700', icon: XCircle };
      case 'pending':
      default:
        return { bg: 'bg-amber-100', text: 'text-amber-700', icon: Clock };
    }
  };
  
  const style = getStyle();
  const Icon = style.icon;
  
  return (
    <Badge className={`${style.bg} ${style.text} flex items-center gap-1 font-medium`}>
      <Icon className="w-3 h-3" />
      <span className="capitalize">{status}</span>
    </Badge>
  );
};

const LeaveCard = ({ leave, isPast, onEdit }) => (
  <div className={`bg-white rounded-lg border border-gray-100 p-4 hover:shadow-md transition-all duration-200 ${isPast ? 'opacity-75' : ''}`}>
    <div className="flex items-start justify-between mb-3">
      <div>
        <h4 className="font-semibold text-gray-900">{leave.leave_type} Leave</h4>
        <p className="text-sm text-gray-500 mt-1">{leave.display_date || leave.start_date}</p>
      </div>
      <div className="flex items-center gap-2">
        <StatusBadge status={leave.status} />
        {/* Show Edit button only for pending requests that are not in the past */}
        {leave.status === 'pending' && !isPast && onEdit && (
          <button
            onClick={() => onEdit(leave)}
            className="p-1.5 text-gray-400 hover:text-[#0b1f3b] hover:bg-gray-100 rounded-lg transition-colors"
            title="Edit Leave Request"
            data-testid={`edit-leave-${leave.id}`}
          >
            <Edit2 className="w-4 h-4" />
          </button>
        )}
      </div>
    </div>
    <div className="space-y-2 text-sm">
      <div className="flex justify-between">
        <span className="text-gray-500">Duration:</span>
        <span className="font-medium text-gray-700">{leave.duration}</span>
      </div>
      {leave.reason && (
        <div className="pt-2 border-t border-gray-100">
          <p className="text-gray-600 text-xs">{leave.reason}</p>
        </div>
      )}
    </div>
  </div>
);

const EmployeeLeave = () => {
  const { getAuthHeaders } = useAuth();
  const [searchParams] = useSearchParams();
  const fileInputRef = useRef(null);
  
  const [leaveData, setLeaveData] = useState({ requests: [], history: [] });
  const [loading, setLoading] = useState(true);
  const [showApplyModal, setShowApplyModal] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [uploadingDoc, setUploadingDoc] = useState(false);
  const [editingLeave, setEditingLeave] = useState(null);
  
  const [newLeave, setNewLeave] = useState({
    leave_type: '',
    leave_date: '',
    duration: '',
    reason: '',
    supporting_document_url: '',
    supporting_document_name: ''
  });

  // Open modal if action=apply in URL
  useEffect(() => {
    if (searchParams.get('action') === 'apply') {
      setShowApplyModal(true);
    }
  }, [searchParams]);

  const fetchLeaves = useCallback(async () => {
    try {
      setLoading(true);
      const response = await axios.get(`${API}/employee/leaves`, { 
        headers: getAuthHeaders() 
      });
      setLeaveData(response.data);
    } catch (error) {
      console.error('Leave fetch error:', error);
      toast.error('Failed to load leave data');
    } finally {
      setLoading(false);
    }
  }, [getAuthHeaders]);

  useEffect(() => {
    fetchLeaves();
  }, [fetchLeaves]);

  const formatDateForAPI = (dateStr) => {
    if (!dateStr) return '';
    const date = new Date(dateStr);
    return `${String(date.getDate()).padStart(2, '0')}-${String(date.getMonth() + 1).padStart(2, '0')}-${date.getFullYear()}`;
  };

  const handleFileSelect = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    // Validate file type
    const allowedTypes = ['application/pdf', 'image/jpeg', 'image/png', 'image/jpg'];
    if (!allowedTypes.includes(file.type)) {
      toast.error('Only PDF, JPG, and PNG files are allowed');
      return;
    }

    // Validate file size (200KB - 500KB)
    const fileSize = file.size / 1024; // Convert to KB
    if (fileSize < 200 || fileSize > 500) {
      toast.error('File size must be between 200KB and 500KB');
      return;
    }

    try {
      setUploadingDoc(true);
      
      // Get Cloudinary signature
      const sigResponse = await axios.get(`${API}/cloudinary/signature`, {
        headers: getAuthHeaders(),
        params: { folder: 'documents', resource_type: 'auto' }
      });
      
      const { signature, timestamp, cloud_name, api_key, folder } = sigResponse.data;
      
      // Upload to Cloudinary
      const formData = new FormData();
      formData.append('file', file);
      formData.append('api_key', api_key);
      formData.append('timestamp', timestamp);
      formData.append('signature', signature);
      formData.append('folder', folder);
      
      const uploadResponse = await axios.post(
        `https://api.cloudinary.com/v1_1/${cloud_name}/auto/upload`,
        formData
      );
      
      setNewLeave({
        ...newLeave,
        supporting_document_url: uploadResponse.data.secure_url,
        supporting_document_name: file.name
      });
      
      toast.success('Document uploaded successfully');
    } catch (error) {
      console.error('Upload error:', error);
      toast.error('Failed to upload document');
    } finally {
      setUploadingDoc(false);
    }
  };

  const removeDocument = () => {
    setNewLeave({
      ...newLeave,
      supporting_document_url: '',
      supporting_document_name: ''
    });
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  // Handle edit leave
  const handleEditLeave = (leave) => {
    // Convert date format from YYYY-MM-DD to input format
    let dateValue = '';
    if (leave.start_date) {
      dateValue = leave.start_date;
    }
    
    setEditingLeave(leave);
    setNewLeave({
      leave_type: leave.leave_type || '',
      leave_date: dateValue,
      duration: leave.duration || '',
      reason: leave.reason || '',
      supporting_document_url: leave.supporting_document_url || '',
      supporting_document_name: leave.supporting_document_name || ''
    });
    setShowApplyModal(true);
  };

  const handleSubmitLeave = async () => {
    // Validation
    if (!newLeave.leave_type) {
      toast.error('Please select leave type');
      return;
    }
    if (!newLeave.leave_date) {
      toast.error('Please select leave date');
      return;
    }
    if (!newLeave.duration) {
      toast.error('Please select duration');
      return;
    }
    if (!newLeave.reason || newLeave.reason.trim().length < 10) {
      toast.error('Please provide a reason (at least 10 characters)');
      return;
    }

    try {
      setSubmitting(true);
      
      const payload = {
        leave_type: newLeave.leave_type,
        leave_date: formatDateForAPI(newLeave.leave_date),
        duration: newLeave.duration,
        reason: newLeave.reason,
        supporting_document_url: newLeave.supporting_document_url,
        supporting_document_name: newLeave.supporting_document_name
      };
      
      if (editingLeave) {
        // Update existing leave
        await axios.put(`${API}/employee/leaves/${editingLeave.id}`, payload, { headers: getAuthHeaders() });
        toast.success('Leave request updated successfully');
      } else {
        // Create new leave
        await axios.post(`${API}/employee/leaves/apply`, payload, { headers: getAuthHeaders() });
        toast.success('Leave request submitted successfully');
      }
      
      setShowApplyModal(false);
      setEditingLeave(null);
      setNewLeave({
        leave_type: '',
        leave_date: '',
        duration: '',
        reason: '',
        supporting_document_url: '',
        supporting_document_name: ''
      });
      fetchLeaves();
    } catch (error) {
      toast.error(error.response?.data?.detail || 'Failed to submit leave request');
    } finally {
      setSubmitting(false);
    }
  };

  // Get tomorrow's date for min date validation
  const getTomorrowDate = () => {
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    return tomorrow.toISOString().split('T')[0];
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#0b1f3b]"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-fade-in" data-testid="employee-leave-page">
      {/* Page Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900" style={{ fontFamily: 'Outfit, sans-serif' }}>
            Leave Management
          </h1>
          <p className="text-sm text-gray-500 mt-1">Manage your leave requests</p>
        </div>
        <Button 
          onClick={() => setShowApplyModal(true)}
          className="bg-[#0b1f3b] hover:bg-[#162d4d] text-white"
          data-testid="apply-leave-btn"
        >
          <Plus className="w-4 h-4 mr-2" />
          Apply Leave
        </Button>
      </div>

      {/* Leave Requests Panel */}
      <div className="bg-[#fffdf7] rounded-xl border border-black/5 overflow-hidden">
        <div className="p-4 border-b border-black/5 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <CalendarDays className="w-5 h-5 text-blue-600" />
            <span className="font-semibold text-gray-900" style={{ fontFamily: 'Outfit, sans-serif' }}>
              Leave Requests
            </span>
          </div>
          <Badge className="bg-blue-100 text-blue-700">
            {leaveData.requests_count || 0} upcoming
          </Badge>
        </div>
        <div className="p-4">
          {leaveData.requests.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              <CalendarDays className="w-12 h-12 mx-auto mb-3 text-gray-300" />
              <p>No upcoming leave requests</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {leaveData.requests.map((leave, index) => (
                <LeaveCard key={leave.id || index} leave={leave} isPast={false} />
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Leave History Panel */}
      <div className="bg-[#fffdf7] rounded-xl border border-black/5 overflow-hidden">
        <div className="p-4 border-b border-black/5 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <FileText className="w-5 h-5 text-gray-500" />
            <span className="font-semibold text-gray-900" style={{ fontFamily: 'Outfit, sans-serif' }}>
              Leave History
            </span>
          </div>
          <Badge className="bg-gray-100 text-gray-700">
            {leaveData.history_count || 0} past
          </Badge>
        </div>
        <div className="p-4">
          {leaveData.history.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              <FileText className="w-12 h-12 mx-auto mb-3 text-gray-300" />
              <p>No leave history</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {leaveData.history.map((leave, index) => (
                <LeaveCard key={leave.id || index} leave={leave} isPast={true} />
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Apply Leave Modal */}
      <Dialog open={showApplyModal} onOpenChange={setShowApplyModal}>
        <DialogContent className="sm:max-w-md bg-[#fffdf7]">
          <DialogHeader>
            <DialogTitle style={{ fontFamily: 'Outfit, sans-serif' }}>
              Apply Leave
            </DialogTitle>
          </DialogHeader>
          
          <div className="space-y-4 py-4">
            {/* Leave Type */}
            <div className="space-y-2">
              <Label>Leave Type <span className="text-red-500">*</span></Label>
              <Select 
                value={newLeave.leave_type} 
                onValueChange={(v) => setNewLeave({ ...newLeave, leave_type: v })}
              >
                <SelectTrigger className="bg-white" data-testid="leave-type-select">
                  <SelectValue placeholder="Select leave type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Sick">Sick Leave</SelectItem>
                  <SelectItem value="Emergency">Emergency Leave</SelectItem>
                  <SelectItem value="Preplanned">Preplanned Leave</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Leave Date */}
            <div className="space-y-2">
              <Label>Leave Date <span className="text-red-500">*</span></Label>
              <Input
                type="date"
                min={getTomorrowDate()}
                value={newLeave.leave_date}
                onChange={(e) => setNewLeave({ ...newLeave, leave_date: e.target.value })}
                className="bg-white"
                data-testid="leave-date-input"
              />
            </div>

            {/* Duration */}
            <div className="space-y-2">
              <Label>Duration <span className="text-red-500">*</span></Label>
              <Select 
                value={newLeave.duration} 
                onValueChange={(v) => setNewLeave({ ...newLeave, duration: v })}
              >
                <SelectTrigger className="bg-white" data-testid="duration-select">
                  <SelectValue placeholder="Select duration" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="First Half">First Half</SelectItem>
                  <SelectItem value="Second Half">Second Half</SelectItem>
                  <SelectItem value="Full Day">Full Day</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Supporting Document */}
            <div className="space-y-2">
              <Label>Supporting Document (PDF/JPG/PNG, 200-500KB)</Label>
              <input
                ref={fileInputRef}
                type="file"
                accept=".pdf,.jpg,.jpeg,.png"
                onChange={handleFileSelect}
                className="hidden"
                data-testid="file-input"
              />
              
              {newLeave.supporting_document_name ? (
                <div className="flex items-center gap-2 p-3 bg-emerald-50 rounded-lg border border-emerald-200">
                  <FileText className="w-4 h-4 text-emerald-600" />
                  <span className="text-sm text-emerald-700 flex-1 truncate">
                    {newLeave.supporting_document_name}
                  </span>
                  <button 
                    onClick={removeDocument}
                    className="p-1 hover:bg-emerald-100 rounded"
                  >
                    <X className="w-4 h-4 text-emerald-600" />
                  </button>
                </div>
              ) : (
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => fileInputRef.current?.click()}
                  disabled={uploadingDoc}
                  className="w-full"
                  data-testid="upload-doc-btn"
                >
                  {uploadingDoc ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      Uploading...
                    </>
                  ) : (
                    <>
                      <Upload className="w-4 h-4 mr-2" />
                      Choose File
                    </>
                  )}
                </Button>
              )}
            </div>

            {/* Reason */}
            <div className="space-y-2">
              <Label>Reason <span className="text-red-500">*</span></Label>
              <Textarea
                value={newLeave.reason}
                onChange={(e) => setNewLeave({ ...newLeave, reason: e.target.value })}
                placeholder="Please provide a reason for your leave request..."
                className="bg-white min-h-[100px]"
                data-testid="reason-textarea"
              />
            </div>
          </div>

          <DialogFooter className="gap-2">
            <Button 
              variant="outline" 
              onClick={() => setShowApplyModal(false)}
              data-testid="cancel-btn"
            >
              Cancel
            </Button>
            <Button 
              onClick={handleApplyLeave}
              disabled={submitting}
              className="bg-[#0b1f3b] hover:bg-[#162d4d] text-white"
              data-testid="submit-leave-btn"
            >
              {submitting ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Applying...
                </>
              ) : (
                'Apply Leave'
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default EmployeeLeave;
