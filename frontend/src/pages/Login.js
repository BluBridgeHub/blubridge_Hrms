import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';
import { toast } from 'sonner';
import { Lock, User, Eye, EyeOff, Loader2 } from 'lucide-react';
import axios from 'axios';

const API = `${process.env.REACT_APP_BACKEND_URL}/api`;

const Login = () => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [seeding, setSeeding] = useState(false);
  const { login, user } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (user) {
      navigate('/dashboard');
    }
  }, [user, navigate]);

  useEffect(() => {
    // Seed database on first load
    const seedDb = async () => {
      try {
        setSeeding(true);
        await axios.post(`${API}/seed`);
      } catch (error) {
        console.log('Seed completed or already seeded');
      } finally {
        setSeeding(false);
      }
    };
    seedDb();
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!username || !password) {
      toast.error('Please enter username and password');
      return;
    }

    setLoading(true);
    const result = await login(username, password);
    setLoading(false);

    if (result.success) {
      toast.success('Welcome to BluBridge HRMS');
      navigate('/dashboard');
    } else {
      toast.error(result.error);
    }
  };

  return (
    <div className="min-h-screen bg-[#efede5] flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        {/* Logo */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center gap-3 mb-4">
            <img 
              src="https://customer-assets.emergentagent.com/job_25d72bd1-2848-402d-8255-1f5e67431c0e/artifacts/o66msiwa_logo-main2.png" 
              alt="BluBridge" 
              className="w-auto"
            />
          </div>
          <p className="text-gray-500 mt-2">Human Resource Management System</p>
        </div>

        {/* Login Card */}
        <div className="bg-[#fffdf7] rounded-2xl border border-black/5 shadow-xl p-8">
          <div className="text-center mb-6">
            <h2 className="text-xl font-semibold text-gray-900" style={{ fontFamily: 'Outfit, sans-serif' }}>
              Welcome Back
            </h2>
            <p className="text-sm text-gray-500 mt-1">Sign in to your account</p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-5">
            <div className="space-y-2">
              <Label htmlFor="username" className="text-sm font-medium text-gray-700">
                Username
              </Label>
              <div className="relative">
                <User className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                <Input
                  id="username"
                  type="text"
                  placeholder="Enter username"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  className="pl-10 h-12 bg-white border-gray-200 focus:border-[#004EEB] focus:ring-[#004EEB]/20"
                  data-testid="username-input"
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="password" className="text-sm font-medium text-gray-700">
                Password
              </Label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                <Input
                  id="password"
                  type={showPassword ? 'text' : 'password'}
                  placeholder="Enter password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="pl-10 pr-10 h-12 bg-white border-gray-200 focus:border-[#004EEB] focus:ring-[#004EEB]/20"
                  data-testid="password-input"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                >
                  {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                </button>
              </div>
            </div>

            <Button
              type="submit"
              disabled={loading || seeding}
              className="w-full h-12 bg-[#0b1f3b] hover:bg-[#162d4d] text-white font-medium rounded-xl shadow-lg shadow-[#0b1f3b]/20 transition-all duration-200"
              data-testid="login-submit-btn"
            >
              {loading ? (
                <>
                  <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                  Signing in...
                </>
              ) : seeding ? (
                <>
                  <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                  Initializing...
                </>
              ) : (
                'Sign In'
              )}
            </Button>
          </form>

          {/* Test credentials hint */}
          {/* <div className="mt-6 p-4 bg-blue-50 rounded-xl border border-blue-100">
            <p className="text-xs text-blue-700 font-medium mb-2">Test Credentials:</p>
            <div className="text-xs text-blue-600 space-y-2">
              <div className="pb-2 border-b border-blue-100">
                <p className="font-semibold text-blue-800 mb-1">Admin Access:</p>
                <p><span className="font-medium">Username:</span> admin</p>
                <p><span className="font-medium">Password:</span> admin</p>
              </div>
              <div>
                <p className="font-semibold text-blue-800 mb-1">Employee Access:</p>
                <p><span className="font-medium">Username:</span> user</p>
                <p><span className="font-medium">Password:</span> user</p>
              </div>
            </div>
          </div> */}
        </div>

        <p className="text-center text-sm text-gray-400 mt-6">
          © 2024 BluBridge HRMS. All rights reserved.
        </p>
      </div>
    </div>
  );
};

export default Login;
