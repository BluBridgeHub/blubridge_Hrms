import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';
import { toast } from 'sonner';
import { Lock, User, Eye, EyeOff, Loader2, ArrowRight, Shield, Users, BarChart3 } from 'lucide-react';
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

  const features = [
    { icon: Users, label: 'Employee Management', desc: 'Streamlined HR operations' },
    { icon: BarChart3, label: 'Analytics & Reports', desc: 'Data-driven insights' },
    { icon: Shield, label: 'Secure & Compliant', desc: 'Enterprise-grade security' },
  ];

  return (
    <div className="min-h-screen bg-[#efede5] flex">
      {/* Left Panel - Branding */}
      <div className="hidden lg:flex lg:w-1/2 relative overflow-hidden">
        {/* Background Pattern */}
        <div className="absolute inset-0 bg-gradient-to-br from-[#063c88] via-[#0854a0] to-[#052d66]">
          <div className="absolute inset-0" style={{
            backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23ffffff' fill-opacity='0.05'%3E%3Cpath d='M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`,
          }} />
        </div>
        
        {/* Content */}
        <div className="relative z-10 flex flex-col justify-between p-12 w-full">
          {/* Logo */}
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-xl bg-white/10 backdrop-blur-sm flex items-center justify-center border border-white/20">
              <span className="text-white font-bold text-xl" style={{ fontFamily: 'Outfit' }}>B</span>
            </div>
            <div>
              <h1 className="text-2xl font-bold text-white" style={{ fontFamily: 'Outfit' }}>BluBridge</h1>
              <p className="text-xs text-white/60 uppercase tracking-widest">HRMS Platform</p>
            </div>
          </div>

          {/* Main Content */}
          <div className="space-y-8">
            <div>
              <h2 className="text-4xl lg:text-5xl font-bold text-white leading-tight" style={{ fontFamily: 'Outfit' }}>
                Enterprise HR<br />Management<br />
                <span className="text-white/70">Simplified</span>
              </h2>
              <p className="mt-6 text-lg text-white/70 max-w-md">
                A complete human resource management solution designed for modern enterprises.
              </p>
            </div>

            {/* Features */}
            <div className="space-y-4">
              {features.map((feature, index) => (
                <div 
                  key={index}
                  className="flex items-center gap-4 p-4 rounded-xl bg-white/5 backdrop-blur-sm border border-white/10 animate-slide-up"
                  style={{ animationDelay: `${index * 0.1}s` }}
                >
                  <div className="w-10 h-10 rounded-lg bg-white/10 flex items-center justify-center">
                    <feature.icon className="w-5 h-5 text-white" />
                  </div>
                  <div>
                    <p className="text-white font-medium">{feature.label}</p>
                    <p className="text-white/60 text-sm">{feature.desc}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Footer */}
          <p className="text-white/40 text-sm">
            Trusted by 500+ enterprises worldwide
          </p>
        </div>
      </div>

      {/* Right Panel - Login Form */}
      <div className="flex-1 flex items-center justify-center p-6 lg:p-12">
        <div className="w-full max-w-md">
          {/* Mobile Logo */}
          <div className="lg:hidden text-center mb-10">
            <div className="inline-flex items-center gap-3 mb-4">
              <div className="w-12 h-12 rounded-xl bg-[#063c88] flex items-center justify-center shadow-lg shadow-[#063c88]/30">
                <span className="text-white font-bold text-xl" style={{ fontFamily: 'Outfit' }}>B</span>
              </div>
              <div className="text-left">
                <h1 className="text-xl font-bold text-slate-900" style={{ fontFamily: 'Outfit' }}>BluBridge</h1>
                <p className="text-[10px] text-slate-500 uppercase tracking-widest">HRMS Platform</p>
              </div>
            </div>
          </div>

          {/* Login Card */}
          <div className="card-premium p-8 lg:p-10 animate-scale-in">
            <div className="text-center mb-8">
              <h2 className="text-2xl font-bold text-slate-900" style={{ fontFamily: 'Outfit' }}>
                Welcome back
              </h2>
              <p className="text-slate-500 mt-2">Sign in to your account to continue</p>
            </div>

            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="space-y-2">
                <Label htmlFor="username" className="text-sm font-medium text-slate-700">
                  Username
                </Label>
                <div className="relative">
                  <User className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
                  <Input
                    id="username"
                    type="text"
                    placeholder="Enter your username"
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                    className="pl-12 h-12 bg-slate-50 border-slate-200 rounded-xl focus:bg-white transition-colors"
                    data-testid="username-input"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="password" className="text-sm font-medium text-slate-700">
                  Password
                </Label>
                <div className="relative">
                  <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
                  <Input
                    id="password"
                    type={showPassword ? 'text' : 'password'}
                    placeholder="Enter your password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="pl-12 pr-12 h-12 bg-slate-50 border-slate-200 rounded-xl focus:bg-white transition-colors"
                    data-testid="password-input"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 transition-colors"
                  >
                    {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                  </button>
                </div>
              </div>

              <Button
                type="submit"
                disabled={loading || seeding}
                className="w-full h-12 bg-[#063c88] hover:bg-[#052d66] text-white font-semibold rounded-xl shadow-lg shadow-[#063c88]/30 transition-all duration-200 active:scale-[0.98]"
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
                  <>
                    Sign In
                    <ArrowRight className="w-5 h-5 ml-2" />
                  </>
                )}
              </Button>
            </form>
          </div>

          <p className="text-center text-sm text-slate-400 mt-8">
            © 2024 BluBridge HRMS. All rights reserved.
          </p>
        </div>
      </div>
    </div>
  );
};

export default Login;
