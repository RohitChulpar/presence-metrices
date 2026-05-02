import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { User, Mail, Lock, Briefcase, Users, Eye, EyeOff, ShieldCheck, ArrowRight, AlertCircle, CheckCircle2, X } from 'lucide-react';
import axios from 'axios';

// ✅ Dynamic API Base URL
const API_BASE_URL = import.meta.env.VITE_BACKEND_URL || 'http://localhost:5000';

export default function Register() {
  const [formData, setFormData] = useState({
    username: '',
    email: '',
    password: '',
    role: 'employee',
    managerId: ''
  });

  const [notification, setNotification] = useState({ show: false, msg: '', type: '' });
  const [showPassword, setShowPassword] = useState(false);
  const [managers, setManagers] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    const fetchManagers = async () => {
      try {
        // ✅ Updated to use dynamic URL
        const res = await axios.get(`${API_BASE_URL}/api/auth/managers`);
        setManagers(res.data);
      } catch (err) {
        console.error("Could not fetch managers:", err);
      }
    };
    fetchManagers();
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (formData.role === 'employee' && !formData.managerId) {
      setNotification({ show: true, msg: "Manager selection is required to proceed.", type: 'error' });
      return;
    }

    setIsLoading(true);
    try {
      // ✅ Updated to use dynamic URL
      const response = await axios.post(`${API_BASE_URL}/api/auth/register`, formData);
      if (response.status === 201) {
        setNotification({ show: true, msg: "Account created successfully! Redirecting to login...", type: 'success' });
        setTimeout(() => navigate('/login'), 2500);
      }
    } catch (err) {
      setNotification({ 
        show: true, 
        msg: err.response?.data?.msg || "Registration failed. Please try again.", 
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
          backgroundImage: `url('https://images.unsplash.com/photo-1497215728101-856f4ea42174?q=80&w=2070&auto=format&fit=crop')`,
          backgroundSize: 'cover',
          backgroundPosition: 'center',
          filter: 'brightness(0.35)' 
        }}
      />

      {/* Center Layout Container */}
      <div className="relative z-10 w-full max-w-xl flex items-center justify-center">
        
        {/* Form Container */}
        <div className="w-full bg-white/95 backdrop-blur-sm rounded-[2rem] shadow-2xl p-6 md:p-8 border border-white/40 animate-in fade-in zoom-in duration-500 relative">
          <div className="text-center mb-6">
            <div className="inline-flex p-2.5 rounded-xl bg-blue-600/10 text-blue-700 mb-2">
              <ShieldCheck className="w-7 h-7" />
            </div>
            <h2 className="text-2xl font-black text-slate-900 tracking-tight">Create Account</h2>
            <p className="text-sm font-bold text-slate-600 mt-1">Next-gen workforce intelligence platform</p>
          </div>

          <form onSubmit={handleSubmit} className="grid grid-cols-1 md:grid-cols-2 gap-x-4 gap-y-3.5">
            <div className="md:col-span-2">
              <label className="text-[11px] font-black text-slate-800 uppercase tracking-wider mb-1 block ml-1">Identity</label>
              <div className="relative">
                <User className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
                <input 
                  type="text" required
                  className="w-full pl-11 pr-4 py-2.5 bg-slate-100/80 border border-slate-300 rounded-xl text-slate-900 focus:ring-4 focus:ring-blue-500/20 focus:border-blue-600 focus:bg-white outline-none transition-all font-semibold placeholder:text-slate-500"
                  placeholder="Full Name"
                  onChange={(e) => setFormData({...formData, username: e.target.value})}
                />
              </div>
            </div>

            <div className="md:col-span-2">
              <label className="text-[11px] font-black text-slate-800 uppercase tracking-wider mb-1 block ml-1">Work Email</label>
              <div className="relative">
                <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
                <input 
                  type="email" required
                  className="w-full pl-11 pr-4 py-2.5 bg-slate-100/80 border border-slate-300 rounded-xl text-slate-900 focus:ring-4 focus:ring-blue-500/20 focus:border-blue-600 focus:bg-white outline-none transition-all font-semibold placeholder:text-slate-500"
                  placeholder="email@company.com"
                  onChange={(e) => setFormData({...formData, email: e.target.value})}
                />
              </div>
            </div>

            <div className="md:col-span-2">
              <label className="text-[11px] font-black text-slate-800 uppercase tracking-wider mb-1 block ml-1">Secret Key</label>
              <div className="relative">
                <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
                <input 
                  type={showPassword ? "text" : "password"} required
                  className="w-full pl-11 pr-12 py-2.5 bg-slate-100/80 border border-slate-300 rounded-xl text-slate-900 focus:ring-4 focus:ring-blue-500/20 focus:border-blue-600 focus:bg-white outline-none transition-all font-semibold placeholder:text-slate-500"
                  placeholder="••••••••"
                  onChange={(e) => setFormData({...formData, password: e.target.value})}
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

            <div className={formData.role === 'employee' ? 'md:col-span-1' : 'md:col-span-2'}>
              <label className="text-[11px] font-black text-slate-800 uppercase tracking-wider mb-1 block ml-1">Role</label>
              <div className="relative">
                <Briefcase className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
                <select 
                  className="w-full pl-11 pr-4 py-2.5 bg-slate-100/80 border border-slate-300 rounded-xl text-slate-900 focus:ring-4 focus:ring-blue-500/20 focus:border-blue-600 outline-none appearance-none cursor-pointer font-bold"
                  value={formData.role}
                  onChange={(e) => setFormData({...formData, role: e.target.value, managerId: ''})}
                >
                  <option value="employee">Employee</option>
                  <option value="manager">Manager</option>
                </select>
              </div>
            </div>

            {formData.role === 'employee' && (
              <div className="md:col-span-1 animate-in slide-in-from-right-4 duration-300">
                <label className="text-[11px] font-black text-blue-700 uppercase tracking-wider mb-1 block ml-1">Supervisor</label>
                <div className="relative">
                  <Users className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-blue-600" />
                  <select 
                    required
                    className="w-full pl-11 pr-4 py-2.5 bg-blue-50/50 border border-blue-200 rounded-xl text-blue-900 focus:ring-4 focus:ring-blue-500/20 focus:border-blue-600 outline-none appearance-none font-bold"
                    value={formData.managerId}
                    onChange={(e) => setFormData({...formData, managerId: e.target.value})}
                  >
                    <option value="">Select...</option>
                    {managers.map((m) => (
                      <option key={m._id} value={m._id}>{m.username}</option>
                    ))}
                  </select>
                </div>
              </div>
            )}

            <div className="md:col-span-2 mt-2">
              <button 
                type="submit" 
                disabled={isLoading}
                className="group relative w-full bg-slate-900 text-white py-3.5 rounded-xl font-black text-base hover:bg-blue-700 transition-all shadow-xl active:scale-[0.98] disabled:opacity-50 flex items-center justify-center gap-3 overflow-hidden"
              >
                <span className="relative z-10 uppercase tracking-tight">{isLoading ? "Processing..." : "Create Account"}</span>
                {!isLoading && <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform relative z-10" />}
                <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent -translate-x-full group-hover:animate-shimmer" />
              </button>
            </div>
          </form>

          <p className="text-center text-slate-700 mt-6 text-sm font-bold">
            Already a member? <Link to="/login" className="text-blue-700 hover:text-blue-800 transition-colors hover:underline underline-offset-4 decoration-2">Sign In</Link>
          </p>
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