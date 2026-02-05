import { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import axios from 'axios';
import { toast } from 'sonner';
import { User, Mail, Shield, Calendar, Building, Save } from 'lucide-react';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';
import { Badge } from '../components/ui/badge';

const API = `${process.env.REACT_APP_BACKEND_URL}/api`;

const AdminProfile = () => {
  const { user, getAuthHeaders } = useAuth();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [profile, setProfile] = useState({
    name: '',
    email: '',
    phone: '',
    role: '',
    department: '',
    joined_date: ''
  });

  useEffect(() => {
    fetchProfile();
  }, []);

  const fetchProfile = async () => {
    try {
      setLoading(true);
      const headers = getAuthHeaders();
      const response = await axios.get(`${API}/auth/me`, { headers });
      
      setProfile({
        name: response.data.name || user?.name || '',
        email: response.data.email || '',
        phone: response.data.phone || '',
        role: response.data.role || user?.role || '',
        department: response.data.department || 'Administration',
        joined_date: response.data.created_at || ''
      });
    } catch (error) {
      console.error('Error fetching profile:', error);
      // Use local user data if API fails
      setProfile({
        name: user?.name || 'System Admin',
        email: user?.email || 'admin@blubridge.ai',
        phone: '',
        role: user?.role || 'admin',
        department: 'Administration',
        joined_date: ''
      });
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    try {
      setSaving(true);
      const headers = getAuthHeaders();
      await axios.put(`${API}/auth/update-profile`, {
        name: profile.name,
        email: profile.email,
        phone: profile.phone
      }, { headers });
      
      toast.success('Profile updated successfully');
    } catch (error) {
      console.error('Error updating profile:', error);
      toast.error('Failed to update profile');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64 bg-[#efede5]">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#0b1f3b]"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-fade-in bg-[#efede5] min-h-screen p-6" data-testid="admin-profile-page">
      {/* Page Header */}
      <div className="flex items-center gap-3">
        <User className="w-6 h-6 text-[#0b1f3b]" />
        <h1 className="text-2xl font-bold text-[#0b1f3b]" style={{ fontFamily: 'Outfit, sans-serif' }}>
          Admin Profile
        </h1>
      </div>

      {/* Profile Card */}
      <div className="bg-[#fffdf7] rounded-xl border border-black/5 overflow-hidden">
        {/* Profile Header */}
        <div className="bg-[#0b1f3b] p-8">
          <div className="flex items-center gap-6">
            <div className="w-24 h-24 rounded-full bg-white/10 flex items-center justify-center border-4 border-white/20">
              <span className="text-4xl font-bold text-white">
                {profile.name?.charAt(0)?.toUpperCase()}
              </span>
            </div>
            <div>
              <h2 className="text-2xl font-bold text-white">{profile.name}</h2>
              <p className="text-white/70 flex items-center gap-2 mt-1">
                <Mail className="w-4 h-4" />
                {profile.email || 'admin@blubridge.ai'}
              </p>
              <Badge className="mt-2 bg-white/20 text-white hover:bg-white/30">
                <Shield className="w-3 h-3 mr-1" />
                {profile.role?.replace('_', ' ').toUpperCase()}
              </Badge>
            </div>
          </div>
        </div>

        {/* Profile Form */}
        <div className="p-8">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <Label className="text-sm font-medium text-gray-700">Full Name</Label>
              <Input
                value={profile.name}
                onChange={(e) => setProfile({ ...profile, name: e.target.value })}
                className="mt-1 bg-white"
                placeholder="Enter full name"
              />
            </div>
            
            <div>
              <Label className="text-sm font-medium text-gray-700">Email Address</Label>
              <Input
                type="email"
                value={profile.email}
                onChange={(e) => setProfile({ ...profile, email: e.target.value })}
                className="mt-1 bg-white"
                placeholder="Enter email"
              />
            </div>
            
            <div>
              <Label className="text-sm font-medium text-gray-700">Phone Number</Label>
              <Input
                value={profile.phone}
                onChange={(e) => setProfile({ ...profile, phone: e.target.value })}
                className="mt-1 bg-white"
                placeholder="Enter phone number"
              />
            </div>
            
            <div>
              <Label className="text-sm font-medium text-gray-700">Role</Label>
              <Input
                value={profile.role?.replace('_', ' ').toUpperCase()}
                className="mt-1 bg-gray-100"
                disabled
              />
            </div>
            
            <div>
              <Label className="text-sm font-medium text-gray-700">Department</Label>
              <Input
                value={profile.department}
                className="mt-1 bg-gray-100"
                disabled
              />
            </div>
            
            <div>
              <Label className="text-sm font-medium text-gray-700">Account Created</Label>
              <div className="mt-1 flex items-center gap-2 p-3 bg-gray-100 rounded-md text-gray-600">
                <Calendar className="w-4 h-4" />
                {profile.joined_date ? new Date(profile.joined_date).toLocaleDateString('en-IN', {
                  day: '2-digit',
                  month: 'short',
                  year: 'numeric'
                }) : 'N/A'}
              </div>
            </div>
          </div>

          <div className="mt-8 flex justify-end">
            <Button 
              onClick={handleSave}
              disabled={saving}
              className="bg-[#0b1f3b] hover:bg-[#162d4d] text-white px-8"
              data-testid="save-profile-btn"
            >
              <Save className="w-4 h-4 mr-2" />
              {saving ? 'Saving...' : 'Save Changes'}
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AdminProfile;
