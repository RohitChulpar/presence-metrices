import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Mail, Lock, ArrowRight, Eye, EyeOff, ShieldCheck, AlertCircle, CheckCircle2, X } from 'lucide-react';
import axios from 'axios';

// ✅ Dynamic API Base URL (Vite environment)
const API_BASE_URL = import.meta.env.VITE_BACKEND_URL || 'http://localhost:5000';

export default function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  
  // --- NOTIFICATION STATE ---
  const [notification, setNotification] = useState({ show: false, msg: '', type: '' });
  
  const navigate = useNavigate();

  const handleLogin = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    try {
      // ✅ Updated to use dynamic URL
      const response = await axios.post(`${API_BASE_URL}/api/auth/login`, { email, password });
      
      localStorage.setItem('token', response.data.token);
      localStorage.setItem('role', response.data.user.role);
      localStorage.setItem('userId', response.data.user.id);
      localStorage.setItem('username', response.data.user.username);

      setNotification({ show: true, msg: "Login successful! Redirecting...", type: 'success' });

      const userRole = response.data.user.role;
      setTimeout(() => {
        if (userRole === 'manager') {
          navigate('/manager-dashboard');
        } else {
          navigate('/employee-dashboard');
        }
      }, 1500);

    } catch (err) {
      setNotification({ 
        show: true, 
        msg: err.response?.data?.msg || "Login failed. Check your credentials.", 
        type: 'error' 
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="h-screen w-full flex items-center justify-center relative font-sans px-4 overflow-hidden">
      
      {/* Background Image Layer */}
      <div 
        className="absolute inset-0 z-0"
        style={{
          backgroundImage: `url('https://images.unsplash.com/photo-1483058712412-4245e9b90334?q=80&w=2070&auto=format&fit=crop')`,
          backgroundSize: 'cover',
          backgroundPosition: 'center',
          filter: 'brightness(0.3) saturate(1.2)' 
        }}
      />

      {/* Center Layout Container */}
      <div className="relative z-10 w-full max-w-md flex items-center justify-center">
        
        {/* Solid White High-Contrast Container */}
        <div className="w-full bg-white rounded-[2rem] shadow-[0_20px_50px_rgba(0,0,0,0.3)] p-8 border border-white/40 animate-in fade-in zoom-in duration-500 relative">
          
          <div className="text-center mb-8">
            <div className="inline-flex p-2.5 rounded-xl bg-blue-600/10 text-blue-700 mb-3">
              <ShieldCheck className="w-8 h-8" />
            </div>
            <h2 className="text-2xl font-black text-slate-900 tracking-tight">Welcome Back</h2>
            <p className="text-sm font-bold text-slate-600 mt-1">Sign in to your corporate account</p>
          </div>

          <form onSubmit={handleLogin} className="space-y-6">
            {/* Email Field */}
            <div>
              <label className="text-[11px] font-black text-slate-800 uppercase tracking-wider mb-1.5 block ml-1">Work Email</label>
              <div className="relative group">
                <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400 group-focus-within:text-blue-600 transition-colors" />
                <input 
                  type="email" 
                  required
                  className="w-full pl-12 pr-4 py-3 bg-slate-100/80 border border-slate-300 rounded-xl text-slate-900 focus:ring-4 focus:ring-blue-500/20 focus:border-blue-600 focus:bg-white outline-none transition-all font-semibold placeholder:text-slate-400"
                  placeholder="name@company.com"
                  onChange={(e) => setEmail(e.target.value)}
                />
              </div>
            </div>

            {/* Password Field */}
            <div>
              <label className="text-[11px] font-black text-slate-800 uppercase tracking-wider mb-1.5 block ml-1">Access Key</label>
              <div className="relative group">
                <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400 group-focus-within:text-blue-600 transition-colors" />
                <input 
                  type={showPassword ? "text" : "password"} 
                  required
                  className="w-full pl-12 pr-12 py-3 bg-slate-100/80 border border-slate-300 rounded-xl text-slate-900 focus:ring-4 focus:ring-blue-500/20 focus:border-blue-600 focus:bg-white outline-none transition-all font-semibold placeholder:text-slate-400"
                  placeholder="••••••••"
                  onChange={(e) => setPassword(e.target.value)}
                />
                <button 
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-600 hover:text-blue-700 transition-colors"
                >
                  {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>
            </div>

            {/* Login Button */}
            <button 
              type="submit" 
              disabled={isLoading}
              className="group relative w-full bg-slate-900 text-white py-3.5 rounded-xl font-black text-base hover:bg-blue-700 transition-all shadow-xl active:scale-[0.98] disabled:opacity-50 flex items-center justify-center gap-3 overflow-hidden"
            >
              <span className="relative z-10 uppercase tracking-tight">{isLoading ? "Verifying..." : "Sign In"}</span>
              {!isLoading && <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform relative z-10" />}
              
              <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent -translate-x-full group-hover:animate-shimmer" />
            </button>
          </form>

          <div className="mt-8 pt-6 border-t border-slate-100 text-center">
            <p className="text-slate-700 text-sm font-bold">
              New to the platform? <Link to="/register" className="text-blue-700 hover:text-blue-800 transition-colors hover:underline underline-offset-4 decoration-2 ml-1">Create an account</Link>
            </p>
          </div>
        </div>

        {/* --- FLOATING SIDE NOTIFICATION --- */}
        {notification.show && (
          <div className="hidden lg:block absolute left-full ml-8 w-72">
            <div className={`p-6 rounded-3xl border-2 shadow-2xl backdrop-blur-md animate-in slide-in-from-left-4 duration-500 ${
              notification.type === 'success' 
              ? 'bg-green-500/90 border-green-400 text-white' 
              : 'bg-red-500/90 border-red-400 text-white'
            }`}>
              <div className="flex flex-col gap-4">
                <div className="flex justify-between items-start">
                  {notification.type === 'success' ? <CheckCircle2 size={32} /> : <AlertCircle size={32} />}
                  <button onClick={() => setNotification({ ...notification, show: false })}>
                    <X size={20} className="hover:rotate-90 transition-transform" />
                  </button>
                </div>
                <div>
                  <p className="text-lg font-black uppercase tracking-tight leading-tight">
                    {notification.type === 'success' ? 'Success' : 'Attention'}
                  </p>
                  <p className="text-sm font-bold mt-1 opacity-90">
                    {notification.msg}
                  </p>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Mobile Notification */}
        <div className="lg:hidden absolute bottom-full mb-4 w-full px-4 left-0">
          {notification.show && (
            <div className={`p-4 rounded-2xl shadow-2xl flex items-center justify-between animate-in slide-in-from-bottom-4 ${
              notification.type === 'success' ? 'bg-green-600 text-white' : 'bg-red-600 text-white'
            }`}>
              <span className="text-sm font-bold">{notification.msg}</span>
              <button onClick={() => setNotification({ ...notification, show: false })}><X size={18}/></button>
            </div>
          )}
        </div>

      </div>

      <style dangerouslySetInnerHTML={{ __html: `
        @keyframes shimmer {
          100% { transform: translateX(100%); }
        }
        .animate-shimmer {
          animation: shimmer 1.5s infinite;
        }
      `}} />
    </div>
  );
}