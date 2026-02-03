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
  Star
} from 'lucide-react';
import { Badge } from '../components/ui/badge';

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
      <div>
        <h1 className="text-2xl font-bold text-gray-900" style={{ fontFamily: 'Outfit, sans-serif' }}>
          Profile
        </h1>
        <p className="text-sm text-gray-500 mt-1">Your personal information</p>
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
    </div>
  );
};

export default EmployeeProfile;
