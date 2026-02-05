import { useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import axios from 'axios';
import { toast } from 'sonner';
import { KeyRound, Eye, EyeOff, Lock, CheckCircle } from 'lucide-react';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';

const API = `${process.env.REACT_APP_BACKEND_URL}/api`;

const ChangePassword = () => {
  const { getAuthHeaders } = useAuth();
  const [loading, setLoading] = useState(false);
  const [showCurrentPassword, setShowCurrentPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  
  const [form, setForm] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: ''
  });

  const [errors, setErrors] = useState({});

  const validateForm = () => {
    const newErrors = {};
    
    if (!form.currentPassword) {
      newErrors.currentPassword = 'Current password is required';
    }
    
    if (!form.newPassword) {
      newErrors.newPassword = 'New password is required';
    } else if (form.newPassword.length < 6) {
      newErrors.newPassword = 'Password must be at least 6 characters';
    }
    
    if (!form.confirmPassword) {
      newErrors.confirmPassword = 'Please confirm your new password';
    } else if (form.newPassword !== form.confirmPassword) {
      newErrors.confirmPassword = 'Passwords do not match';
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!validateForm()) return;
    
    try {
      setLoading(true);
      const headers = getAuthHeaders();
      
      await axios.post(`${API}/auth/change-password`, {
        current_password: form.currentPassword,
        new_password: form.newPassword
      }, { headers });
      
      toast.success('Password changed successfully');
      
      // Reset form
      setForm({
        currentPassword: '',
        newPassword: '',
        confirmPassword: ''
      });
      setErrors({});
    } catch (error) {
      console.error('Error changing password:', error);
      if (error.response?.data?.detail) {
        toast.error(error.response.data.detail);
      } else {
        toast.error('Failed to change password');
      }
    } finally {
      setLoading(false);
    }
  };

  const getPasswordStrength = (password) => {
    if (!password) return { strength: 0, label: '', color: '' };
    
    let strength = 0;
    if (password.length >= 6) strength++;
    if (password.length >= 8) strength++;
    if (/[A-Z]/.test(password)) strength++;
    if (/[0-9]/.test(password)) strength++;
    if (/[^A-Za-z0-9]/.test(password)) strength++;
    
    if (strength <= 2) return { strength, label: 'Weak', color: 'bg-red-500' };
    if (strength <= 3) return { strength, label: 'Medium', color: 'bg-yellow-500' };
    return { strength, label: 'Strong', color: 'bg-green-500' };
  };

  const passwordStrength = getPasswordStrength(form.newPassword);

  return (
    <div className="space-y-6 animate-fade-in bg-[#efede5] min-h-screen p-6" data-testid="change-password-page">
      {/* Page Header */}
      <div className="flex items-center gap-3">
        <KeyRound className="w-6 h-6 text-[#0b1f3b]" />
        <h1 className="text-2xl font-bold text-[#0b1f3b]" style={{ fontFamily: 'Outfit, sans-serif' }}>
          Change Password
        </h1>
      </div>

      {/* Password Change Card */}
      <div className="max-w-xl mx-auto">
        <div className="bg-[#fffdf7] rounded-xl border border-black/5 overflow-hidden">
          <div className="p-6 border-b border-black/5 bg-[#0b1f3b]">
            <div className="flex items-center gap-3">
              <div className="p-3 bg-white/10 rounded-lg">
                <Lock className="w-6 h-6 text-white" />
              </div>
              <div>
                <h2 className="text-lg font-semibold text-white">Update Your Password</h2>
                <p className="text-sm text-white/70">Ensure your account stays secure</p>
              </div>
            </div>
          </div>

          <form onSubmit={handleSubmit} className="p-6 space-y-6">
            {/* Current Password */}
            <div>
              <Label className="text-sm font-medium text-gray-700">Current Password</Label>
              <div className="relative mt-1">
                <Input
                  type={showCurrentPassword ? 'text' : 'password'}
                  value={form.currentPassword}
                  onChange={(e) => setForm({ ...form, currentPassword: e.target.value })}
                  className={`bg-white pr-10 ${errors.currentPassword ? 'border-red-500' : ''}`}
                  placeholder="Enter current password"
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
              {errors.currentPassword && (
                <p className="text-sm text-red-500 mt-1">{errors.currentPassword}</p>
              )}
            </div>

            {/* New Password */}
            <div>
              <Label className="text-sm font-medium text-gray-700">New Password</Label>
              <div className="relative mt-1">
                <Input
                  type={showNewPassword ? 'text' : 'password'}
                  value={form.newPassword}
                  onChange={(e) => setForm({ ...form, newPassword: e.target.value })}
                  className={`bg-white pr-10 ${errors.newPassword ? 'border-red-500' : ''}`}
                  placeholder="Enter new password"
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
              {errors.newPassword && (
                <p className="text-sm text-red-500 mt-1">{errors.newPassword}</p>
              )}
              
              {/* Password Strength Indicator */}
              {form.newPassword && (
                <div className="mt-2">
                  <div className="flex items-center gap-2">
                    <div className="flex-1 h-1 bg-gray-200 rounded-full overflow-hidden">
                      <div 
                        className={`h-full ${passwordStrength.color} transition-all duration-300`}
                        style={{ width: `${(passwordStrength.strength / 5) * 100}%` }}
                      />
                    </div>
                    <span className={`text-xs font-medium ${
                      passwordStrength.label === 'Weak' ? 'text-red-500' :
                      passwordStrength.label === 'Medium' ? 'text-yellow-500' : 'text-green-500'
                    }`}>
                      {passwordStrength.label}
                    </span>
                  </div>
                </div>
              )}
            </div>

            {/* Confirm New Password */}
            <div>
              <Label className="text-sm font-medium text-gray-700">Confirm New Password</Label>
              <div className="relative mt-1">
                <Input
                  type={showConfirmPassword ? 'text' : 'password'}
                  value={form.confirmPassword}
                  onChange={(e) => setForm({ ...form, confirmPassword: e.target.value })}
                  className={`bg-white pr-10 ${errors.confirmPassword ? 'border-red-500' : ''}`}
                  placeholder="Confirm new password"
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
              {errors.confirmPassword && (
                <p className="text-sm text-red-500 mt-1">{errors.confirmPassword}</p>
              )}
              {form.confirmPassword && form.newPassword === form.confirmPassword && !errors.confirmPassword && (
                <p className="text-sm text-green-500 mt-1 flex items-center gap-1">
                  <CheckCircle className="w-3 h-3" /> Passwords match
                </p>
              )}
            </div>

            {/* Password Requirements */}
            <div className="p-4 bg-amber-50 rounded-lg border border-amber-200">
              <h4 className="text-sm font-medium text-amber-800 mb-2">Password Requirements:</h4>
              <ul className="text-xs text-amber-700 space-y-1">
                <li className="flex items-center gap-2">
                  <CheckCircle className={`w-3 h-3 ${form.newPassword.length >= 6 ? 'text-green-500' : 'text-gray-400'}`} />
                  At least 6 characters
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle className={`w-3 h-3 ${/[A-Z]/.test(form.newPassword) ? 'text-green-500' : 'text-gray-400'}`} />
                  One uppercase letter
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle className={`w-3 h-3 ${/[0-9]/.test(form.newPassword) ? 'text-green-500' : 'text-gray-400'}`} />
                  One number
                </li>
              </ul>
            </div>

            {/* Submit Button */}
            <Button 
              type="submit"
              disabled={loading}
              className="w-full bg-[#0b1f3b] hover:bg-[#162d4d] text-white py-3"
              data-testid="change-password-btn"
            >
              {loading ? 'Changing Password...' : 'Change Password'}
            </Button>
          </form>
        </div>
      </div>
    </div>
  );
};

export default ChangePassword;
