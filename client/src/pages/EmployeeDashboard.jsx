import React, { useState, useEffect } from 'react';
import { Play, Square, Activity, ShieldCheck, LogOut, AlertCircle, Clock, User, CheckCircle2, ChevronDown, RefreshCcw, Trophy, Flame, Target, Sparkles } from 'lucide-react';
import axios from 'axios';
import { io } from 'socket.io-client';

// ✅ Dynamic URLs
const API_BASE_URL = import.meta.env.VITE_BACKEND_URL || 'http://localhost:5000';
const AI_ENGINE_URL = 'http://localhost:5001'; // Always local for webcam access
const socket = io(API_BASE_URL);

// --- CONSISTENT BRAND LOGO ---
const PresenceMetricsLogo = ({ className = "w-10 h-10" }) => (
  <svg viewBox="0 0 100 100" className={className} fill="none" xmlns="http://www.w3.org/2000/svg">
    <circle cx="50" cy="50" r="42" stroke="currentColor" strokeWidth="2" strokeDasharray="4 4" className="opacity-40" />
    <circle cx="50" cy="50" r="12" fill="currentColor" />
    <circle cx="50" cy="50" r="18" stroke="currentColor" strokeWidth="2" />
    <rect x="48" y="22" width="4" height="8" rx="2" fill="currentColor" />
    <rect x="70" y="48" width="8" height="4" rx="2" fill="currentColor" />
    <path d="M15 50C15 50 30 25 50 25C70 25 85 50 85 50C85 50 70 75 50 75C30 75 15 50 15 50Z" stroke="currentColor" strokeWidth="4" strokeLinecap="round" />
  </svg>
);

export default function EmployeeDashboard() {
  const [isMonitoring, setIsMonitoring] = useState(false);
  const [seconds, setSeconds] = useState(0);
  const [liveStatus, setLiveStatus] = useState("OFFLINE");
  const [distractionSeconds, setDistractionSeconds] = useState(0);
  const [showSuccessToast, setShowSuccessToast] = useState(false);
  const [activityCount, setActivityCount] = useState(0);

  const [showTransferMenu, setShowTransferMenu] = useState(false);
  const [allManagers, setAllManagers] = useState([]);
  const [isTransferring, setIsTransferring] = useState(false);
  const [userData, setUserData] = useState({ deepWorkBadges: 0, currentStreak: 0 });

  useEffect(() => {
    fetchUserStats();
  }, []);

  const fetchUserStats = async () => {
    try {
      const res = await axios.get(`${API_BASE_URL}/api/auth/user/${localStorage.getItem('userId')}`);
      setUserData(res.data);
    } catch (err) {
      console.error("Stats Fetch Error");
    }
  };

  useEffect(() => {
    if (isMonitoring) {
      const handleInteraction = () => setActivityCount(prev => prev + 1);
      window.addEventListener('keydown', handleInteraction);
      window.addEventListener('mousemove', handleInteraction);
      return () => {
        window.removeEventListener('keydown', handleInteraction);
        window.removeEventListener('mousemove', handleInteraction);
      };
    }
  }, [isMonitoring]);

  useEffect(() => {
    let interval = null;
    if (isMonitoring) {
      interval = setInterval(async () => {
        try {
          const res = await axios.get(`${AI_ENGINE_URL}/get-status`);
          const currentStatus = res.data.status;
          const globalActivity = res.data.activity; 
          setLiveStatus(currentStatus);
          socket.emit('update_status', {
            username: localStorage.getItem('username'),
            status: currentStatus,
            activityScore: globalActivity 
          });
          if (currentStatus === "AWAY") setDistractionSeconds(prev => prev + 1);
          else setDistractionSeconds(0);
        } catch (e) {
          setLiveStatus("ERROR");
        }
      }, 1000);
    } else {
      clearInterval(interval);
      setLiveStatus("OFFLINE");
      socket.emit('update_status', { 
        username: localStorage.getItem('username'), 
        status: "OFFLINE",
        activityScore: 0 
      });
    }
    return () => clearInterval(interval);
  }, [isMonitoring]); 

  useEffect(() => {
    let timer = null;
    if (isMonitoring) timer = setInterval(() => setSeconds(s => s + 1), 1000);
    return () => clearInterval(timer);
  }, [isMonitoring]);

  const toggleTransferMenu = async () => {
    if (!showTransferMenu) {
      try {
        const res = await axios.get(`${API_BASE_URL}/api/auth/managers`);
        setAllManagers(res.data);
        setShowTransferMenu(true);
      } catch (err) {
        alert("Could not load manager list.");
      }
    } else {
      setShowTransferMenu(false);
    }
  };

  const handleManagerTransfer = async (newManagerId) => {
    if (isMonitoring) {
      alert("Please stop your active session before transferring.");
      return;
    }
    if (window.confirm("Transfer profile? Future data will sync to the new manager.")) {
      setIsTransferring(true);
      try {
        await axios.post(`${API_BASE_URL}/api/auth/update-manager`, {
          userId: localStorage.getItem('userId'),
          newManagerId: newManagerId
        });
        alert("Transfer successful!");
        setShowTransferMenu(false);
      } catch (err) {
        alert("Transfer failed.");
      } finally {
        setIsTransferring(false);
      }
    }
  };

  const toggleMonitoring = async () => {
    try {
      if (!isMonitoring) {
        setShowSuccessToast(false);
        setActivityCount(0);
        await axios.get(`${AI_ENGINE_URL}/start-ai`);
        setIsMonitoring(true);
      } else {
        await axios.get(`${AI_ENGINE_URL}/stop-ai`);
        const sessionData = {
          userId: localStorage.getItem('userId'),
          startTime: new Date(Date.now() - seconds * 1000),
          endTime: new Date(),
          duration: seconds,
          averageFocus: seconds > 0 ? Math.round(((seconds - distractionSeconds) / seconds) * 100) : 100,
          activityScore: activityCount 
        };
        await axios.post(`${API_BASE_URL}/api/sessions/save`, sessionData);
        setIsMonitoring(false);
        setSeconds(0);
        setDistractionSeconds(0);
        setActivityCount(0);
        setShowSuccessToast(true);
        fetchUserStats(); 
        setTimeout(() => setShowSuccessToast(false), 5000);
      }
    } catch (err) {
      alert("Error reaching AI server. Make sure your local Python engine is running.");
    }
  };

  const handleLogout = () => {
    if (isMonitoring) {
      if (!window.confirm("End session and logout?")) return;
      axios.get(`${AI_ENGINE_URL}/stop-ai`);
    }
    localStorage.clear();
    window.location.href = '/';
  };

  const formatTime = (s) => `${Math.floor(s / 60).toString().padStart(2, '0')}:${(s % 60).toString().padStart(2, '0')}`;
  const deepWorkProgress = Math.min((seconds / 2700) * 100, 100);
  const currentFocusVal = seconds > 0 ? Math.round(((seconds - distractionSeconds) / seconds) * 100) : 100;

  return (
    <div className="h-screen w-full flex items-center justify-center relative font-sans overflow-hidden bg-slate-950 p-4">
      {/* PROFESSIONAL BACKGROUND WALLPAPER */}
      <div 
        className="absolute inset-0 z-0 opacity-40 scale-105"
        style={{
          backgroundImage: `url('https://images.unsplash.com/photo-1497215728101-856f4ea42174?q=80&w=2070&auto=format&fit=crop')`,
          backgroundSize: 'cover',
          backgroundPosition: 'center',
          filter: 'blur(4px) brightness(0.3)'
        }}
      />

      {/* TOAST SUCCESS */}
      {showSuccessToast && (
        <div className="fixed top-6 right-6 z-[9999] bg-emerald-500 text-white shadow-2xl p-4 rounded-2xl flex items-center gap-3 animate-in slide-in-from-right-10 border border-emerald-400">
          <CheckCircle2 size={24} />
          <p className="font-black text-xs uppercase tracking-widest">Analytics Secured</p>
        </div>
      )}

      {/* EMERGENCY ALERT - HIGH VISIBILITY */}
      {distractionSeconds > 5 && (
        <div className="fixed top-6 left-1/2 -translate-x-1/2 z-[9999] bg-red-600 text-white px-10 py-4 rounded-full shadow-[0_0_50px_rgba(220,38,38,0.5)] flex items-center gap-4 animate-bounce border-2 border-white/20">
          <AlertCircle size={24} className="animate-pulse" />
          <p className="font-black tracking-tighter uppercase text-sm italic">Presence Alert: Face the Screen</p>
        </div>
      )}

      {/* MAIN DASHBOARD CONTAINER */}
      <div className="max-w-7xl w-full h-[95vh] bg-white/10 backdrop-blur-2xl rounded-[3rem] border border-white/20 z-10 flex flex-col overflow-hidden relative shadow-[0_0_100px_rgba(0,0,0,0.5)]">
        
        {/* HEADER AREA */}
        <header className="flex flex-col md:flex-row justify-between items-center px-10 py-6 border-b border-white/10 shrink-0 bg-white/5">
          <div className="flex items-center gap-4">
            <div className="bg-gradient-to-br from-violet-600 to-indigo-600 p-2.5 rounded-2xl shadow-xl">
                <PresenceMetricsLogo className="w-8 h-8 text-white" />
            </div>
            <div>
              <h1 className="text-2xl font-black tracking-tighter uppercase leading-none text-white">
                Presence<span className="text-violet-400">Metrics</span>
              </h1>
              <div className="flex items-center gap-2 text-violet-200/60 text-[10px] font-black uppercase tracking-[0.2em] mt-1.5">
                <Sparkles size={12} className="text-amber-400" />
                Welcome, {localStorage.getItem('username')}
              </div>
            </div>
          </div>
          
          <div className="flex items-center gap-3">
            <div className="flex gap-2 mr-4">
               <div className="bg-orange-500/15 px-4 py-2 rounded-xl flex items-center gap-2 border border-orange-500/30 backdrop-blur-md">
                  <Flame size={16} className="text-orange-500 fill-orange-500" />
                  <span className="font-black text-orange-100 text-[10px] uppercase tracking-wider">{userData.currentStreak} Streak</span>
               </div>
               <div className="bg-violet-500/15 px-4 py-2 rounded-xl flex items-center gap-2 border border-violet-500/30 backdrop-blur-md">
                  <Trophy size={16} className="text-violet-400" />
                  <span className="font-black text-violet-50 text-[10px] uppercase tracking-wider">{userData.deepWorkBadges} Badges</span>
               </div>
            </div>

            <div className="relative">
              <button 
                onClick={toggleTransferMenu} 
                className={`flex items-center gap-2 px-5 py-2.5 rounded-xl font-black text-[10px] uppercase tracking-widest transition-all shadow-xl active:scale-95 z-50 ${showTransferMenu ? 'bg-violet-600 text-white' : 'bg-white text-slate-900 hover:bg-slate-100'}`}
              >
                <RefreshCcw size={14} className={showTransferMenu ? "animate-spin" : ""} /> Transfer <ChevronDown size={14} />
              </button>
              {showTransferMenu && (
                <div className="absolute top-14 right-0 w-64 bg-white rounded-2xl p-4 z-[1000] shadow-[0_25px_50px_-12px_rgba(0,0,0,0.6)] border border-slate-200 animate-in zoom-in-95 duration-200">
                  <p className="text-[10px] font-black uppercase text-slate-400 mb-3 tracking-[0.2em] text-center border-b border-slate-100 pb-2">Active Supervisor List</p>
                  <div className="max-h-40 overflow-y-auto space-y-1 custom-scrollbar">
                    {allManagers.map(m => (
                      <button key={m._id} onClick={() => handleManagerTransfer(m._id)} className="w-full text-left p-3 rounded-xl hover:bg-violet-50 hover:text-violet-700 text-[12px] font-black text-slate-800 transition-colors flex items-center justify-between group">
                        {m.username} <CheckCircle2 size={14} className="text-emerald-500 opacity-0 group-hover:opacity-100" />
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>

            <button onClick={handleLogout} className="p-2.5 bg-red-500/20 text-red-400 border border-red-500/20 hover:bg-red-500 hover:text-white rounded-xl transition-all shadow-lg active:scale-90"><LogOut size={20} /></button>
          </div>
        </header>

        <div className="flex-1 p-8 grid lg:grid-cols-12 gap-8 overflow-hidden">
          <div className="lg:col-span-7 bg-white/5 border border-white/10 rounded-[3rem] p-10 flex flex-col items-center justify-center relative shadow-inner overflow-hidden">
            <div className={`absolute top-8 px-6 py-2.5 rounded-full border shadow-2xl flex items-center gap-3 transition-all duration-500 ${liveStatus === 'ACTIVE' ? 'bg-emerald-500/20 border-emerald-400 text-emerald-400' : 'bg-red-500/20 border-red-400 text-red-400'}`}>
                <div className={`w-3 h-3 rounded-full ${liveStatus === 'ACTIVE' ? 'bg-emerald-400 animate-pulse shadow-[0_0_10px_#4ade80]' : 'bg-red-400'}`} />
                <span className="font-black text-xs uppercase tracking-[0.3em] italic">Current Status: {liveStatus}</span>
            </div>

            <div className="text-[140px] font-black text-white tabular-nums leading-none tracking-tighter mb-12 font-mono drop-shadow-[0_0_35px_rgba(139,92,246,0.4)]">
              {formatTime(seconds)}
            </div>

            {isMonitoring && (
               <div className="w-full max-w-md mb-12 animate-in fade-in slide-in-from-bottom-6">
                  <div className="flex justify-between items-end mb-3 px-1">
                     <div className="flex items-center gap-2">
                        <Target size={18} className="text-violet-400" />
                        <span className="text-[10px] font-black uppercase text-violet-200 tracking-widest">Cognitive Load Index</span>
                     </div>
                     <span className="text-sm font-black text-white">{Math.round(deepWorkProgress)}%</span>
                  </div>
                  <div className="w-full bg-black/40 h-6 rounded-full overflow-hidden border border-white/10 p-1.5 shadow-2xl">
                     <div 
                        className={`h-full rounded-full transition-all duration-1000 ease-out shadow-[0_0_20px_rgba(139,92,246,0.6)] ${currentFocusVal < 90 ? 'bg-slate-500' : 'bg-gradient-to-r from-violet-500 via-indigo-500 to-fuchsia-500'}`}
                        style={{ width: `${deepWorkProgress}%` }}
                     />
                  </div>
                  <p className="text-[10px] text-center mt-5 text-white/40 font-black uppercase tracking-[0.2em]">
                     {currentFocusVal < 90 ? "⚠️ Vision Stability Alert: Progress Log Paused" : "Session Target: 45 Minute Deep Sync"}
                  </p>
               </div>
            )}
            
            <button onClick={toggleMonitoring} className={`group relative flex items-center gap-5 px-20 py-8 rounded-[2.5rem] font-black text-2xl transition-all duration-500 shadow-[0_0_50px_rgba(0,0,0,0.3)] active:scale-95 overflow-hidden border-2 ${isMonitoring ? 'bg-white text-red-600 border-white' : 'bg-violet-600 text-white border-violet-500 shadow-violet-500/20'}`}>
              {isMonitoring ? (
                <><Square className="fill-current" size={28} /> ABORT SEQUENCE</>
              ) : (
                <><Play className="fill-current" size={28} /> INITIALIZE VISION</>
              )}
            </button>
          </div>

          <div className="lg:col-span-5 flex flex-col gap-6">
            <div className="bg-gradient-to-br from-indigo-600/90 to-violet-700/90 p-10 rounded-[3rem] shadow-2xl border border-white/10 flex-1 flex flex-col justify-center relative overflow-hidden group">
              <div className="absolute -top-10 -right-10 w-32 h-32 bg-white/10 rounded-full blur-3xl group-hover:scale-150 transition-transform duration-700" />
              <Activity className="text-white mb-6" size={40} />
              <p className="text-white/60 font-black uppercase text-[10px] tracking-[0.3em]">Neural Efficiency</p>
              <h3 className="text-5xl font-black mt-2 text-white italic tracking-tighter">
                {distractionSeconds > 5 ? "ALERT" : isMonitoring ? "PEAK" : "IDLE"}
              </h3>
              <div className="mt-10 w-full bg-black/30 h-3 rounded-full overflow-hidden border border-white/5">
                <div className={`h-full transition-all duration-1000 ease-out rounded-full ${distractionSeconds > 5 ? 'bg-red-500 shadow-[0_0_20px_rgba(239,68,68,0.8)]' : isMonitoring ? 'bg-emerald-400 shadow-[0_0_20px_rgba(52,211,153,0.6)]' : 'w-0'}`} style={{ width: distractionSeconds > 5 ? '30%' : isMonitoring ? '100%' : '0%' }} />
              </div>
            </div>

            <div className="bg-slate-900/80 backdrop-blur-xl p-8 rounded-[3rem] border border-white/5 shadow-2xl relative overflow-hidden">
              <div className="absolute top-0 right-0 p-4 opacity-20"><ShieldCheck size={60} className="text-violet-500" /></div>
              <div className="flex items-center gap-2 text-violet-400 font-black text-[10px] uppercase tracking-[0.3em] mb-4">
                <ShieldCheck size={16} /> Biometric Guard Active
              </div>
              <p className="text-slate-100 text-sm leading-relaxed font-bold tracking-wide italic">
                Local Presence Metrics engine mapping <span className="text-violet-400">478 reference points</span> on-device. Zero raw vision footage is uploaded.
              </p>
            </div>
            
            <div className="bg-white/5 border border-white/10 p-6 rounded-[2.5rem] flex items-center justify-between group px-10">
              <div className="flex items-center gap-4">
                <RefreshCcw className="text-emerald-400 animate-spin-slow" size={24} />
                <p className="text-white text-[10px] font-black uppercase tracking-[0.2em]">Node Engine: Synced</p>
              </div>
              <div className="flex gap-1.5">
                <div className="w-1.5 h-1.5 bg-emerald-400 rounded-full animate-bounce [animation-delay:-0.3s]" />
                <div className="w-1.5 h-1.5 bg-emerald-400 rounded-full animate-bounce" />
              </div>
            </div>
          </div>
        </div>
      </div>

      <style dangerouslySetInnerHTML={{ __html: `
        .custom-scrollbar::-webkit-scrollbar { width: 5px; }
        .custom-scrollbar::-webkit-scrollbar-track { background: transparent; }
        .custom-scrollbar::-webkit-scrollbar-thumb { background: #ddd; border-radius: 10px; }
        .animate-spin-slow { animation: spin 8s linear infinite; }
        @keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }
      `}} />
    </div>
  );
}