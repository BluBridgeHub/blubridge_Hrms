import { useState, useEffect, useCallback } from 'react';
import { useAuth } from '../contexts/AuthContext';
import axios from 'axios';
import { toast } from 'sonner';
import { 
  User,
  Mail,
  Phone,
  Building2,
  Users,
  Briefcase,
  Calendar,
  MapPin,
  Shield,
  Star,
  Lock,
  Eye,
  EyeOff,
  Loader2
} from 'lucide-react';
import { Badge } from '../components/ui/badge';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '../components/ui/dialog';

const API = `${process.env.REACT_APP_BACKEND_URL}/api`;

const InfoRow = ({ icon: Icon, label, value }) => (
  <div className="flex items-center gap-4 py-3 border-b border-gray-100 last:border-0">
    <div className="w-10 h-10 rounded-lg bg-gray-100 flex items-center justify-center flex-shrink-0">
      <Icon className="w-5 h-5 text-gray-500" strokeWidth={1.5} />
    </div>
    <div className="flex-1 min-w-0">
      <p className="text-xs text-gray-500">{label}</p>
      <p className="text-sm font-medium text-gray-900 truncate">{value || '-'}</p>
    </div>
  </div>
);

const EmployeeProfile = () => {
  const { getAuthHeaders } = useAuth();
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  
  // Password change state
  const [showPasswordModal, setShowPasswordModal] = useState(false);
  const [passwordLoading, setPasswordLoading] = useState(false);
  const [showCurrentPassword, setShowCurrentPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [passwordForm, setPasswordForm] = useState({
    current_password: '',
    new_password: '',
    confirm_password: ''
  });

  const fetchProfile = useCallback(async () => {
    try {
      setLoading(true);
      const response = await axios.get(`${API}/employee/profile`, { 
        headers: getAuthHeaders() 
      });
      setProfile(response.data);
    } catch (error) {
      console.error('Profile fetch error:', error);
      toast.error('Failed to load profile');
    } finally {
      setLoading(false);
    }
  }, [getAuthHeaders]);

  useEffect(() => {
    fetchProfile();
  }, [fetchProfile]);

  const handlePasswordChange = (field, value) => {
    setPasswordForm(prev => ({ ...prev, [field]: value }));
  };

  const resetPasswordForm = () => {
    setPasswordForm({
      current_password: '',
      new_password: '',
      confirm_password: ''
    });
    setShowCurrentPassword(false);
    setShowNewPassword(false);
    setShowConfirmPassword(false);
  };

  const handleSubmitPasswordChange = async () => {
    // Validation
    if (!passwordForm.current_password) {
      toast.error('Please enter your current password');
      return;
    }
    if (!passwordForm.new_password) {
      toast.error('Please enter a new password');
      return;
    }
    if (passwordForm.new_password.length < 6) {
      toast.error('New password must be at least 6 characters');
      return;
    }
    if (passwordForm.new_password !== passwordForm.confirm_password) {
      toast.error('New passwords do not match');
      return;
    }
    if (passwordForm.current_password === passwordForm.new_password) {
      toast.error('New password must be different from current password');
      return;
    }

    try {
      setPasswordLoading(true);
      await axios.post(`${API}/employee/change-password`, passwordForm, {
        headers: getAuthHeaders()
      });
      toast.success('Password changed successfully!');
      setShowPasswordModal(false);
      resetPasswordForm();
    } catch (error) {
      toast.error(error.response?.data?.detail || 'Failed to change password');
    } finally {
      setPasswordLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#0b1f3b]"></div>
      </div>
    );
  }

  if (!profile) {
    return (
      <div className="flex flex-col items-center justify-center h-64 text-gray-500">
        <User className="w-16 h-16 mb-4 text-gray-300" />
        <p>Profile not found</p>
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-fade-in" data-testid="employee-profile-page">
      {/* Page Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900" style={{ fontFamily: 'Outfit, sans-serif' }}>
            Profile
          </h1>
          <p className="text-sm text-gray-500 mt-1">Your personal information</p>
        </div>
        <Button 
          onClick={() => setShowPasswordModal(true)}
          className="bg-[#0b1f3b] hover:bg-[#162d4d] text-white"
          data-testid="change-password-btn"
        >
          <Lock className="w-4 h-4 mr-2" />
          Change Password
        </Button>
      </div>

      {/* Profile Header Card */}
      <div className="bg-[#fffdf7] rounded-xl border border-black/5 p-6">
        <div className="flex items-start gap-6">
          {/* Avatar */}
          <div className="flex-shrink-0">
            {profile.avatar ? (
              <img 
                src={profile.avatar} 
                alt={profile.full_name}
                className="w-24 h-24 rounded-xl object-cover border-2 border-white shadow-lg"
              />
            ) : (
              <div className="w-24 h-24 rounded-xl bg-[#0b1f3b] flex items-center justify-center shadow-lg">
                <span className="text-white text-3xl font-bold">
                  {profile.full_name?.charAt(0)?.toUpperCase()}
                </span>
              </div>
            )}
          </div>
          
          {/* Basic Info */}
          <div className="flex-1 min-w-0">
            <h2 className="text-xl font-bold text-gray-900" style={{ fontFamily: 'Outfit, sans-serif' }}>
              {profile.full_name}
            </h2>
            <p className="text-gray-600 mt-1">{profile.designation}</p>
            <div className="flex flex-wrap items-center gap-2 mt-3">
              <Badge className="bg-[#0b1f3b] text-white">
                {profile.emp_id}
              </Badge>
              <Badge className={`
                ${profile.employee_status === 'Active' ? 'bg-emerald-100 text-emerald-700' : 
                  profile.employee_status === 'Inactive' ? 'bg-red-100 text-red-700' : 
                  'bg-gray-100 text-gray-700'}
              `}>
                {profile.employee_status}
              </Badge>
              {profile.tier_level && (
                <Badge className="bg-purple-100 text-purple-700">
                  {profile.tier_level}
                </Badge>
              )}
            </div>
          </div>

          {/* Stars */}
          {profile.stars !== undefined && (
            <div className="text-center px-4 py-2 bg-amber-50 rounded-lg">
              <div className="flex items-center gap-1 text-amber-600">
                <Star className="w-5 h-5 fill-amber-400" />
                <span className="text-xl font-bold">{profile.stars}</span>
              </div>
              <p className="text-xs text-amber-600 mt-1">Stars</p>
            </div>
          )}
        </div>
      </div>

      {/* Information Sections */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Personal Information */}
        <div className="bg-[#fffdf7] rounded-xl border border-black/5 p-6">
          <h3 className="font-semibold text-gray-900 mb-4" style={{ fontFamily: 'Outfit, sans-serif' }}>
            Personal Information
          </h3>
          <div className="space-y-1">
            <InfoRow 
              icon={User} 
              label="Full Name" 
              value={profile.full_name} 
            />
            <InfoRow 
              icon={Mail} 
              label="Email Address" 
              value={profile.official_email} 
            />
            <InfoRow 
              icon={Phone} 
              label="Phone Number" 
              value={profile.phone_number} 
            />
            <InfoRow 
              icon={User} 
              label="Gender" 
              value={profile.gender} 
            />
            <InfoRow 
              icon={Calendar} 
              label="Date of Birth" 
              value={profile.date_of_birth} 
            />
          </div>
        </div>

        {/* Employment Information */}
        <div className="bg-[#fffdf7] rounded-xl border border-black/5 p-6">
          <h3 className="font-semibold text-gray-900 mb-4" style={{ fontFamily: 'Outfit, sans-serif' }}>
            Employment Information
          </h3>
          <div className="space-y-1">
            <InfoRow 
              icon={Briefcase} 
              label="Designation" 
              value={profile.designation} 
            />
            <InfoRow 
              icon={Shield} 
              label="Employment Type" 
              value={profile.employment_type} 
            />
            <InfoRow 
              icon={Calendar} 
              label="Date of Joining" 
              value={profile.date_of_joining} 
            />
            <InfoRow 
              icon={MapPin} 
              label="Work Location" 
              value={profile.work_location} 
            />
            <InfoRow 
              icon={User} 
              label="Tier Level" 
              value={profile.tier_level} 
            />
          </div>
        </div>

        {/* Organization Information */}
        <div className="bg-[#fffdf7] rounded-xl border border-black/5 p-6">
          <h3 className="font-semibold text-gray-900 mb-4" style={{ fontFamily: 'Outfit, sans-serif' }}>
            Organization
          </h3>
          <div className="space-y-1">
            <InfoRow 
              icon={Building2} 
              label="Department" 
              value={profile.department} 
            />
            <InfoRow 
              icon={Users} 
              label="Team" 
              value={profile.team} 
            />
            <InfoRow 
              icon={User} 
              label="Reporting Manager" 
              value={profile.reporting_manager_name} 
            />
          </div>
        </div>

        {/* HR Configuration */}
        <div className="bg-[#fffdf7] rounded-xl border border-black/5 p-6">
          <h3 className="font-semibold text-gray-900 mb-4" style={{ fontFamily: 'Outfit, sans-serif' }}>
            HR Configuration
          </h3>
          <div className="space-y-1">
            <InfoRow 
              icon={Calendar} 
              label="Leave Policy" 
              value={profile.leave_policy} 
            />
            <InfoRow 
              icon={Calendar} 
              label="Shift Type" 
              value={profile.shift_type} 
            />
            <div className="flex items-center gap-4 py-3">
              <div className="w-10 h-10 rounded-lg bg-gray-100 flex items-center justify-center flex-shrink-0">
                <Calendar className="w-5 h-5 text-gray-500" strokeWidth={1.5} />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-xs text-gray-500">Attendance Tracking</p>
                <Badge className={profile.attendance_tracking_enabled ? 'bg-emerald-100 text-emerald-700' : 'bg-red-100 text-red-700'}>
                  {profile.attendance_tracking_enabled ? 'Enabled' : 'Disabled'}
                </Badge>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Password Change Modal */}
      <Dialog open={showPasswordModal} onOpenChange={(open) => { setShowPasswordModal(open); if (!open) resetPasswordForm(); }}>
        <DialogContent className="bg-[#fffdf7] sm:max-w-md" aria-describedby="password-change-desc">
          <DialogHeader>
            <DialogTitle style={{ fontFamily: 'Outfit, sans-serif' }}>
              <div className="flex items-center gap-2">
                <Lock className="w-5 h-5 text-[#0b1f3b]" />
                Change Password
              </div>
            </DialogTitle>
          </DialogHeader>
          <p id="password-change-desc" className="sr-only">Form to change your account password</p>
          
          <div className="space-y-4 py-4">
            {/* Current Password */}
            <div className="space-y-2">
              <Label>Current Password <span className="text-red-500">*</span></Label>
              <div className="relative">
                <Input
                  type={showCurrentPassword ? "text" : "password"}
                  value={passwordForm.current_password}
                  onChange={(e) => handlePasswordChange('current_password', e.target.value)}
                  placeholder="Enter current password"
                  className="bg-white pr-10"
                  data-testid="current-password-input"
                />
                <button
                  type="button"
                  onClick={() => setShowCurrentPassword(!showCurrentPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                >
                  {showCurrentPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            {/* New Password */}
            <div className="space-y-2">
              <Label>New Password <span className="text-red-500">*</span></Label>
              <div className="relative">
                <Input
                  type={showNewPassword ? "text" : "password"}
                  value={passwordForm.new_password}
                  onChange={(e) => handlePasswordChange('new_password', e.target.value)}
                  placeholder="Enter new password (min 6 characters)"
                  className="bg-white pr-10"
                  data-testid="new-password-input"
                />
                <button
                  type="button"
                  onClick={() => setShowNewPassword(!showNewPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                >
                  {showNewPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
              {passwordForm.new_password && passwordForm.new_password.length < 6 && (
                <p className="text-xs text-red-500">Password must be at least 6 characters</p>
              )}
            </div>

            {/* Confirm New Password */}
            <div className="space-y-2">
              <Label>Confirm New Password <span className="text-red-500">*</span></Label>
              <div className="relative">
                <Input
                  type={showConfirmPassword ? "text" : "password"}
                  value={passwordForm.confirm_password}
                  onChange={(e) => handlePasswordChange('confirm_password', e.target.value)}
                  placeholder="Confirm new password"
                  className="bg-white pr-10"
                  data-testid="confirm-password-input"
                />
                <button
                  type="button"
                  onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                >
                  {showConfirmPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
              {passwordForm.confirm_password && passwordForm.new_password !== passwordForm.confirm_password && (
                <p className="text-xs text-red-500">Passwords do not match</p>
              )}
              {passwordForm.confirm_password && passwordForm.new_password === passwordForm.confirm_password && passwordForm.new_password.length >= 6 && (
                <p className="text-xs text-emerald-600">✓ Passwords match</p>
              )}
            </div>

            {/* Password Requirements */}
            <div className="bg-gray-50 rounded-lg p-3 text-xs text-gray-600">
              <p className="font-medium mb-1">Password Requirements:</p>
              <ul className="list-disc list-inside space-y-0.5">
                <li>Minimum 6 characters</li>
                <li>Must be different from current password</li>
              </ul>
            </div>
          </div>

          <DialogFooter className="gap-2">
            <Button 
              variant="outline" 
              onClick={() => { setShowPasswordModal(false); resetPasswordForm(); }}
              data-testid="cancel-password-btn"
            >
              Cancel
            </Button>
            <Button 
              onClick={handleSubmitPasswordChange}
              disabled={passwordLoading}
              className="bg-[#0b1f3b] hover:bg-[#162d4d] text-white"
              data-testid="submit-password-btn"
            >
              {passwordLoading ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Changing...
                </>
              ) : (
                'Change Password'
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default EmployeeProfile;
