import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { 
  Users, BarChart as BarIcon, PieChart as PieIcon, 
  LogOut, Download, Search, RefreshCw, TrendingUp, Clock, Activity, Shield, Cpu, Trophy, Flame, AlertTriangle, Info, ShieldCheck, Calendar, Medal, Eye, X, Filter, LayoutDashboard, ChevronLeft, ChevronRight
} from 'lucide-react';
import { 
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, 
  CartesianGrid, Cell 
} from 'recharts';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { io } from 'socket.io-client';

const socket = io('http://localhost:5000');

// --- CONSISTENT BRAND LOGO ---
const PresenceMetricsLogo = ({ className = "w-8 h-8" }) => (
  <svg viewBox="0 0 100 100" className={className} fill="none" xmlns="http://www.w3.org/2000/svg">
    <circle cx="50" cy="50" r="42" stroke="currentColor" strokeWidth="2" strokeDasharray="4 4" className="opacity-40" />
    <circle cx="50" cy="50" r="12" fill="currentColor" />
    <circle cx="50" cy="50" r="18" stroke="currentColor" strokeWidth="2" />
    <rect x="48" y="22" width="4" height="8" rx="2" fill="currentColor" />
    <rect x="70" y="48" width="8" height="4" rx="2" fill="currentColor" />
    <path d="M15 50C15 50 30 25 50 25C70 25 85 50 85 50C85 50 70 75 50 75C30 75 15 50 15 50Z" stroke="currentColor" strokeWidth="4" strokeLinecap="round" />
  </svg>
);

export default function ManagerDashboard() {
  const [sessions, setSessions] = useState([]);
  const [heatmapData, setHeatmapData] = useState([]); 
  const [team, setTeam] = useState([]); 
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [liveStaffStatus, setLiveStaffStatus] = useState({});
  const [periodicStats, setPeriodicStats] = useState([]);
  const [statPeriod, setStatPeriod] = useState('weekly');

  const [selectedUser, setSelectedUser] = useState(null);
  const [individualStats, setIndividualStats] = useState(null);
  const [isModalLoading, setIsModalLoading] = useState(false);
  const [modalError, setModalError] = useState(null);
  
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);

  const managerId = localStorage.getItem('userId');

  useEffect(() => {
    if (!managerId) {
        window.location.href = '/login';
        return;
    }
    refreshAll();
    socket.on('status_changed', (data) => {
      setLiveStaffStatus(prev => ({
        ...prev,
        [data.username]: data.status,
        [`${data.username}_activity`]: data.activityScore 
      }));
    });
    return () => socket.off('status_changed');
  }, [managerId, statPeriod]);

  const fetchSessions = async () => {
    try {
      const res = await axios.get(`http://localhost:5000/api/sessions/manager-view/${managerId}`);
      setSessions(res.data);
    } catch (err) { console.error("Sessions fetch error"); }
  };

  const fetchTeamData = async () => {
    try {
      const teamRes = await axios.get(`http://localhost:5000/api/auth/team/${managerId}`);
      setTeam(teamRes.data);
    } catch (err) { console.error("Team fetch error"); }
  };

  const fetchHeatmap = async () => {
    try {
      const res = await axios.get(`http://localhost:5000/api/sessions/heatmap/${managerId}`);
      setHeatmapData(res.data);
    } catch (err) { console.error("Heatmap fetch error"); }
  };

  const fetchPeriodicStats = async () => {
    try {
      const res = await axios.get(`http://localhost:5000/api/sessions/stats/${managerId}?period=${statPeriod}`);
      setPeriodicStats(res.data);
    } catch (err) { console.error("Periodic stats fetch error"); }
  };

  // BUG 1 FIX: Clear `individualStats` to null BEFORE the async fetch so the modal
  // never renders stale data from the previously viewed employee. Without this,
  // `selectedUser` becomes the new employee immediately but `individualStats` still
  // holds the old employee's data until the new response arrives — causing a flash
  // of wrong data. Setting it to null here forces the loading skeleton to show instead.
  const fetchUserInsights = async (user) => {
    setIndividualStats(null);   // ← clear stale data immediately
    setModalError(null);        // ← clear any previous error so skeleton shows clean
    setSelectedUser(user);
    setIsModalLoading(true);
    try {
      const res = await axios.get(`http://localhost:5000/api/sessions/individual-stats/${user._id}`);
      setIndividualStats(res.data);
    } catch (err) {
      console.error("Individual stats error", err);
      // Set error message so the modal escapes the infinite spinner
      setModalError(err.response?.data?.error || "Failed to load records. Please try again.");
    } finally {
      setIsModalLoading(false);
    }
  };

  const refreshAll = async () => {
    setLoading(true);
    await Promise.all([fetchSessions(), fetchTeamData(), fetchHeatmap(), fetchPeriodicStats()]);
    setLoading(false);
  };

  const getHeatmapColor = (score) => {
    if (score === 0) return '#f1f5f9'; 
    if (score < 40) return '#f87171';  
    if (score < 75) return '#818cf8';  
    return '#4f46e5';                  
  };

  const downloadPDF = () => {
    const doc = new jsPDF();
    doc.setFontSize(18);
    doc.text("PresenceMetrics: Team Performance Report", 14, 22);
    const rows = sessions.map(s => [
        s.userId?.username || 'N/A', 
        `${s.duration}s`, 
        `${s.averageFocus}%`, 
        new Date(s.startTime).toLocaleString(),
        s.alerts?.length > 0 ? s.alerts.join(', ') : 'Clean'
    ]);
    autoTable(doc, { 
        head: [['Employee', 'Duration', 'Focus Score', 'Date/Time', 'Alerts']], 
        body: rows, 
        startY: 30,
        theme: 'grid'
    });
    doc.save('Team_Performance_Report.pdf');
  };

  const filteredSessions = sessions.filter(s => 
    s.userId?.username?.toLowerCase().includes(searchTerm.toLowerCase())
  );
  
  const avgFocus = sessions.length > 0 
    ? sessions.reduce((acc, curr) => acc + (curr.averageFocus || 0), 0) / sessions.length 
    : 0;

  const totalAlerts = sessions.reduce((acc, curr) => acc + (curr.alerts?.length || 0), 0);

  if (loading && team.length === 0) {
      return (
          <div className="min-h-screen bg-slate-950 flex items-center justify-center">
              <RefreshCw className="animate-spin text-indigo-500" size={48} />
          </div>
      );
  }

  return (
    <div className="min-h-screen flex font-sans relative overflow-hidden">
      
      {/* PROFESSIONAL BACKGROUND WALLPAPER */}
      <div 
        className="absolute inset-0 z-0 pointer-events-none"
        style={{
          backgroundImage: `url('https://images.unsplash.com/photo-1498050108023-c5249f4df085')`,
          backgroundSize: 'cover',
          backgroundPosition: 'center',
          filter: 'brightness(0.4) contrast(1.7) saturate(1.4)'
        }}
      />

      {/* SIDEBAR - Collapsible Logic */}
      <aside className={`transition-all duration-300 ease-in-out ${isSidebarCollapsed ? 'w-20' : 'w-72'} bg-slate-900 text-white flex flex-col fixed h-full z-50 border-r border-white/5`}>
        <div className="p-8 relative">
          <button 
            onClick={() => setIsSidebarCollapsed(!isSidebarCollapsed)}
            className="absolute -right-3 top-10 bg-indigo-600 text-white rounded-full p-1 border border-white/10 hover:bg-indigo-500 shadow-xl transition-all"
          >
            {isSidebarCollapsed ? <ChevronRight size={16} /> : <ChevronLeft size={16} />}
          </button>

          <div className={`flex items-center gap-3 mb-12 ${isSidebarCollapsed ? 'justify-center' : ''}`}>
            <PresenceMetricsLogo className="text-indigo-400 w-10 h-10 shrink-0" />
            {!isSidebarCollapsed && (
              <h1 className="text-xl font-black tracking-tighter uppercase italic leading-none whitespace-nowrap overflow-hidden transition-all">
                Presence<br/><span className="text-indigo-400">Metrics</span>
              </h1>
            )}
          </div>
          
          <nav className="space-y-2">
            <div className={`flex items-center gap-3 bg-indigo-600/10 text-indigo-400 p-4 rounded-2xl border border-indigo-600/20 cursor-pointer shadow-lg shadow-indigo-900/20 ${isSidebarCollapsed ? 'justify-center' : ''}`}>
              <LayoutDashboard size={20} className="shrink-0" />
              {!isSidebarCollapsed && <span className="font-black text-[11px] uppercase tracking-widest whitespace-nowrap overflow-hidden">Team Command</span>}
            </div>
          </nav>
        </div>

        <div className="mt-auto p-6">
          <button onClick={() => { localStorage.clear(); window.location.href = '/'; }} className={`w-full flex items-center gap-3 p-4 text-slate-400 hover:bg-red-500/10 hover:text-red-400 rounded-2xl transition-all font-black text-[11px] uppercase tracking-widest ${isSidebarCollapsed ? 'justify-center' : ''}`}>
            <LogOut size={20} className="shrink-0" />
            {!isSidebarCollapsed && <span className="whitespace-nowrap overflow-hidden">Logout System</span>}
          </button>
        </div>
      </aside>

      <main className={`flex-1 transition-all duration-300 ${isSidebarCollapsed ? 'ml-20' : 'ml-72'} p-6 md:p-12 relative h-screen overflow-y-auto z-10`}>
        {/* Background Accent */}
        <div className="absolute top-0 right-0 w-1/2 h-96 bg-indigo-50/50 rounded-full blur-[120px] -z-10" />

        {/* HEADER */}
        <header className="flex flex-col lg:flex-row justify-between items-start lg:items-center mb-12 gap-8">
          <div>
            <div className="flex items-center gap-3 mb-2">
              <h2 className="text-4xl font-black text-white tracking-tighter drop-shadow-lg">Team Analytics</h2>
              <div className="bg-indigo-600 text-white text-[10px] font-black px-2 py-1 rounded-md uppercase">Manager View</div>
            </div>
            <div className="flex items-center gap-6">
                <div className="flex items-center gap-2">
                    <div className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse shadow-[0_0_8px_rgba(16,185,129,0.6)]" />
                    <p className="text-slate-200 font-bold text-xs uppercase tracking-tight drop-shadow-sm">{team.length} Active Node Sensors</p>
                </div>
                {totalAlerts > 0 && (
                    <div className="bg-red-50 border border-red-100 text-red-600 px-4 py-1.5 rounded-full text-[10px] font-black flex items-center gap-2 shadow-sm">
                        <AlertTriangle size={14} /> {totalAlerts} ANOMALIES LOGGED
                    </div>
                )}
            </div>
          </div>

          <div className="flex items-center gap-3">
            <button onClick={downloadPDF} className="bg-white border border-slate-200 text-slate-900 px-6 py-3.5 rounded-2xl font-bold text-[11px] uppercase tracking-widest hover:border-indigo-500 hover:shadow-lg transition-all flex items-center gap-3">
              <Download size={18} className="text-indigo-600" /> Export Intelligence
            </button>
            <button onClick={refreshAll} className="p-3.5 bg-slate-900 text-white rounded-2xl hover:bg-indigo-600 transition-all shadow-xl shadow-slate-200 border border-white/10">
              <RefreshCw size={20} className={loading ? "animate-spin" : ""} />
            </button>
          </div>
        </header>

        {/* --- PERFORMANCE HIGHLIGHTS --- */}
        <section className="mb-12 bg-white/80 backdrop-blur-md p-8 rounded-[3rem] border border-slate-200 shadow-[0_20px_50px_rgba(0,0,0,0.04)] relative overflow-hidden">
          <div className="absolute top-0 right-0 w-32 h-32 bg-indigo-50 rounded-bl-[3rem] -z-10" />
          <div className="flex justify-between items-center mb-8">
            <div className="flex items-center gap-3">
              <div className="bg-amber-500 p-2.5 rounded-xl text-white shadow-lg shadow-amber-200">
                <Medal size={24} />
              </div>
              <h3 className="text-xl font-black text-slate-900 tracking-tight uppercase italic">Leaderboard<span className="text-slate-300">.v1</span></h3>
            </div>
            <div className="flex bg-slate-100 p-1 rounded-2xl border border-slate-200">
              <button onClick={() => setStatPeriod('weekly')} className={`px-6 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${statPeriod === 'weekly' ? 'bg-white text-indigo-600 shadow-md' : 'text-slate-400'}`}>7 Days</button>
              <button onClick={() => setStatPeriod('monthly')} className={`px-6 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${statPeriod === 'monthly' ? 'bg-white text-indigo-600 shadow-md' : 'text-slate-400'}`}>30 Days</button>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {periodicStats.map((stat, index) => (
              <div key={stat._id} className="relative bg-slate-50 border border-slate-100 p-6 rounded-[2.5rem] hover:bg-indigo-50/30 transition-all group">
                <div className="absolute right-6 top-6 font-black text-4xl text-slate-200/50 group-hover:text-indigo-200/50">0{index + 1}</div>
                <div className="flex items-center gap-4 mb-6">
                  <div className="w-14 h-14 rounded-2xl bg-white border border-slate-200 flex items-center justify-center font-black text-indigo-600 text-xl shadow-sm">{stat.username.charAt(0).toUpperCase()}</div>
                  <div>
                    <h4 className="font-black text-slate-900 uppercase tracking-tight">{stat.username}</h4>
                    <p className="text-[9px] text-slate-400 uppercase font-black tracking-[0.2em]">{stat.totalSessions} ACTIVE BLOCKS</p>
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="bg-white/80 backdrop-blur-sm p-4 rounded-2xl border border-slate-100">
                    <p className="text-[8px] font-black text-slate-400 uppercase tracking-widest mb-1">Time Logged</p>
                    <p className="text-xl font-black text-slate-900">{stat.totalHours.toFixed(1)}h</p>
                  </div>
                  <div className="bg-white/80 backdrop-blur-sm p-4 rounded-2xl border border-slate-100">
                    <p className="text-[8px] font-black text-slate-400 uppercase tracking-widest mb-1">Focus Index</p>
                    <p className="text-xl font-black text-indigo-600">{stat.avgFocus}%</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* LIVE STATUS SECTION */}
        <div className="mb-12">
          <div className="flex items-center gap-3 mb-8">
             <div className="p-2 bg-emerald-100 text-emerald-600 rounded-xl shadow-md"><Cpu size={20} /></div>
             <h3 className="text-xl font-black text-white tracking-tight uppercase italic drop-shadow-md">Live Presence Monitor</h3>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {team.map((member) => {
              const name = member.username;
              const status = liveStaffStatus[name] || "OFFLINE";
              const act = liveStaffStatus[`${name}_activity`] || 0;
              return (
                <div key={member._id} className="bg-white/90 backdrop-blur-sm p-6 rounded-[2.5rem] border border-slate-200 shadow-sm hover:shadow-xl hover:-translate-y-1 transition-all group relative overflow-hidden">
                  {status === 'ACTIVE' && <div className="absolute top-0 left-0 w-full h-1 bg-emerald-500 animate-pulse" />}
                  <div className="flex flex-col gap-6">
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-4">
                            <div className="w-12 h-12 rounded-2xl bg-indigo-50 flex items-center justify-center font-black text-indigo-600 text-lg border border-indigo-100">{name?.charAt(0).toUpperCase()}</div>
                            <div>
                                <p className="font-black text-slate-900 text-sm tracking-tight mb-1">{name}</p>
                                <span className={`text-[9px] font-black uppercase tracking-widest px-2 py-0.5 rounded-md ${status === 'ACTIVE' ? 'bg-indigo-600 text-white' : 'bg-slate-100 text-slate-400'}`}>
                                    {status === 'ACTIVE' ? (act > 0 ? '⌨️ Working' : '👀 Idle') : status}
                                </span>
                            </div>
                        </div>
                        <div className={`w-3 h-3 rounded-full border-2 border-white shadow-lg ${status === 'ACTIVE' ? 'bg-emerald-500 animate-pulse' : status === 'AWAY' ? 'bg-red-500' : 'bg-slate-300'}`} />
                    </div>
                    
                    <button 
                      onClick={() => fetchUserInsights(member)}
                      className="w-full flex items-center justify-center gap-2 py-3 bg-slate-900 text-[10px] font-black text-white rounded-xl hover:bg-indigo-600 transition-all uppercase tracking-[0.2em] shadow-lg shadow-slate-200"
                    >
                      <Eye size={14} /> Analytics Hub
                    </button>

                    <div className="flex items-center gap-2 border-t border-slate-50 pt-4">
                       <div className="bg-orange-50 px-3 py-1.5 rounded-lg flex items-center gap-2">
                          <Flame size={12} className="text-orange-500 fill-orange-500" />
                          <span className="text-[10px] font-black text-orange-700">{member.currentStreak || 0}</span>
                       </div>
                       <div className="bg-indigo-50 px-3 py-1.5 rounded-lg flex items-center gap-2">
                          <Trophy size={12} className="text-indigo-600" />
                          <span className="text-[10px] font-black text-indigo-700">{member.deepWorkBadges || 0}</span>
                       </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* FOCUS CHART SECTION */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 mb-12">
          <div className="lg:col-span-8 bg-slate-900/90 backdrop-blur-md p-10 rounded-[3.5rem] shadow-2xl relative overflow-hidden border border-white/10">
            <div className="absolute top-0 left-0 w-full h-full bg-gradient-to-br from-indigo-600/10 to-transparent" />
            <h3 className="font-black text-white text-lg flex items-center gap-3 mb-8 relative uppercase tracking-tighter italic">
                <Activity size={20} className="text-indigo-400"/> Neural Productivity Heatmap
            </h3>
            <div className="h-64 relative">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={heatmapData}>
                  <XAxis dataKey="hour" axisLine={false} tickLine={false} tick={{fill: '#64748b', fontSize: 10, fontWeight: 900}} />
                  <Tooltip cursor={{fill: 'rgba(255,255,255,0.05)'}} content={({ active, payload }) => {
                        if (active && payload && payload.length) {
                            return (
                                <div className="bg-white text-slate-900 p-4 rounded-2xl shadow-2xl border border-slate-100 animate-in zoom-in-95 duration-200">
                                    <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1">{payload[0].payload.hour}</p>
                                    <p className="text-xl font-black">Focus: {payload[0].value}%</p>
                                </div>
                            );
                        }
                        return null;
                    }}
                  />
                  <Bar dataKey="focus" radius={[6, 6, 6, 6]} barSize={35}>
                    {heatmapData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={getHeatmapColor(entry.focus)} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>

          <div className="lg:col-span-4 bg-indigo-600 p-10 rounded-[3.5rem] flex flex-col items-center justify-center text-center text-white shadow-2xl shadow-indigo-200 relative overflow-hidden">
             <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full -mr-16 -mt-16 blur-2xl" />
             <p className="text-7xl font-black mb-4 drop-shadow-lg tracking-tighter">{Math.round(avgFocus)}%</p>
             <p className="text-[11px] font-black uppercase tracking-[0.4em] opacity-80">Global Team Focus Index</p>
             <div className="mt-8 bg-white/20 px-6 py-2 rounded-full backdrop-blur-md text-[10px] font-black border border-white/20">STATUS: OPTIMAL</div>
          </div>
        </div>

        {/* LOGS TABLE */}
        <div className="bg-white/90 backdrop-blur-md rounded-[3.5rem] border border-slate-200 shadow-xl overflow-hidden mb-12">
          <div className="p-10 border-b border-slate-100 flex flex-col lg:row-row justify-between items-center gap-8">
            <div className="flex items-center gap-3 mr-auto">
                <h3 className="text-2xl font-black text-slate-900 uppercase tracking-tighter italic">Compliance Ledger</h3>
                <ShieldCheck size={18} className="text-emerald-500" />
            </div>
            <div className="relative w-full lg:w-96">
              <Search className="absolute left-5 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
              <input type="text" placeholder="Filter node activity..." className="w-full pl-14 pr-6 py-4 bg-white border border-slate-200 rounded-2xl text-sm font-bold text-slate-900 outline-none focus:ring-4 focus:ring-indigo-500/10 transition-all placeholder:text-slate-400" onChange={(e) => setSearchTerm(e.target.value)} />
            </div>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead>
                <tr className="bg-slate-900 text-[10px] text-slate-400 uppercase font-black tracking-[0.3em]">
                  <th className="p-8">Personnel</th>
                  <th className="p-8 text-center">Focus Profile</th>
                  <th className="p-8">Compliance Verdict</th>
                  <th className="p-8 text-right">Timestamp</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredSessions.map((sess) => {
                  const hasAlerts = sess.alerts?.length > 0;
                  const isHighRisk = sess.riskScore >= 60;
                  return (
                    <tr key={sess._id} className={`transition-all ${isHighRisk ? 'bg-red-50/30' : 'hover:bg-slate-50/50'}`}>
                      <td className="p-8 text-sm font-black text-slate-900 uppercase tracking-tight">{sess.userId?.username}</td>
                      <td className="p-8">
                        <div className="flex flex-col items-center gap-2">
                            <div className="w-full max-w-[120px] h-2 bg-slate-100 rounded-full overflow-hidden shadow-inner">
                              <div className={`h-full rounded-full ${sess.averageFocus > 70 ? 'bg-indigo-600 shadow-[0_0_10px_rgba(79,70,229,0.4)]' : 'bg-red-500 shadow-[0_0_10px_rgba(239,68,68,0.4)]'}`} style={{width: `${sess.averageFocus}%`}} />
                            </div>
                            <span className="text-[10px] font-black text-slate-600">{sess.averageFocus}% FOCUS</span>
                        </div>
                      </td>
                      <td className="p-8">
                        {hasAlerts ? (
                            <div className="flex flex-wrap gap-2">
                                {sess.alerts.map((alert, i) => (
                                    <span key={i} className="bg-red-600 text-white px-3 py-1 rounded-md text-[9px] font-black tracking-widest uppercase shadow-sm">{alert.replace('_', ' ')}</span>
                                ))}
                            </div>
                        ) : (
                            <div className="flex items-center gap-2 text-emerald-600 font-black text-[11px] uppercase tracking-widest bg-emerald-50 px-4 py-1.5 rounded-lg border border-emerald-100 shadow-sm"><ShieldCheck size={14} /> Verified</div>
                        )}
                      </td>
                      <td className="p-8 text-right text-slate-400 text-[11px] font-black">{new Date(sess.startTime).toLocaleDateString('en-GB')}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      </main>

      {/* --- INDIVIDUAL INSIGHTS MODAL --- */}
      {/* BUG 1 FIX: The loading gate now checks BOTH isModalLoading AND !individualStats.
          This means even if isModalLoading flips to false slightly before data arrives,
          or if the component re-renders mid-fetch, the stale data section is NEVER shown.
          The chart and stat cards only render when individualStats is a real object. */}
      {selectedUser && (
        <div className="fixed inset-0 z-[1000] flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-slate-950/80 backdrop-blur-md animate-in fade-in duration-300" onClick={() => { setSelectedUser(null); setModalError(null); }} />
          <div className="bg-white w-full max-w-3xl rounded-[3rem] shadow-[0_0_100px_rgba(0,0,0,0.5)] relative overflow-hidden animate-in zoom-in-95 duration-300 border border-white/20 max-h-[90vh] flex flex-col">
            <div className="p-10 border-b border-slate-100 flex justify-between items-center bg-slate-900 text-white shrink-0">
               <div className="flex items-center gap-5">
                  <div className="w-16 h-16 rounded-[1.5rem] bg-indigo-600 text-white flex items-center justify-center font-black text-2xl shadow-2xl shadow-indigo-500/20 uppercase italic">
                    {selectedUser.username.charAt(0)}
                  </div>
                  <div>
                    <h2 className="text-3xl font-black uppercase tracking-tighter italic leading-none">{selectedUser.username}</h2>
                    <p className="text-[10px] font-black text-indigo-400 uppercase tracking-[0.4em] mt-2">Personnel History Hub</p>
                  </div>
               </div>
               <button onClick={() => { setSelectedUser(null); setModalError(null); }} className="p-3 bg-white/10 hover:bg-red-600 text-white rounded-2xl transition-all"><X size={24} /></button>
            </div>

            <div className="p-10 overflow-y-auto custom-scrollbar flex-1">
              {/* THREE-STATE GATE:
                  1. isModalLoading → spinner (fetch in flight)
                  2. modalError     → error UI (fetch failed, breaks infinite spinner)
                  3. individualStats → data (fetch succeeded) */}
              {isModalLoading ? (
                <div className="flex flex-col items-center py-20 gap-4">
                  <RefreshCw className="animate-spin text-indigo-600" size={32} />
                  <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.4em] animate-pulse">Accessing Secure Records...</p>
                </div>
              ) : modalError ? (
                <div className="flex flex-col items-center py-20 gap-6">
                  <div className="w-16 h-16 rounded-2xl bg-red-50 border border-red-100 flex items-center justify-center">
                    <AlertTriangle size={28} className="text-red-500" />
                  </div>
                  <div className="text-center">
                    <p className="text-sm font-black text-slate-900 uppercase tracking-tight mb-2">Failed to Load Records</p>
                    <p className="text-xs font-bold text-slate-400 max-w-xs">{modalError}</p>
                  </div>
                  <button
                    onClick={() => fetchUserInsights(selectedUser)}
                    className="flex items-center gap-2 px-8 py-3 bg-indigo-600 text-white rounded-xl font-black text-[11px] uppercase tracking-widest hover:bg-indigo-500 transition-all shadow-lg"
                  >
                    <RefreshCw size={14} /> Retry
                  </button>
                </div>
              ) : !individualStats ? (
                // Safety net: loading done, no error, but data still null (shouldn't happen)
                <div className="flex flex-col items-center py-20 gap-4">
                  <RefreshCw className="animate-spin text-indigo-600" size={32} />
                  <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.4em] animate-pulse">Accessing Secure Records...</p>
                </div>
              ) : (
                <div className="space-y-8">
                  {/* WEEKLY PROGRESS BAR CHART */}
                  <div className="bg-slate-50 p-6 rounded-[2.5rem] border border-slate-200">
                    <h4 className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 mb-6 px-2 italic">Weekly Performance Sequence (Mon - Sun)</h4>
                    <div className="h-64">
                      <ResponsiveContainer width="100%" height="100%">
                        <BarChart data={individualStats.weeklyData}>
                          <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
                          <XAxis dataKey="day" axisLine={false} tickLine={false} tick={{fill: '#94a3b8', fontSize: 11, fontWeight: 800}} />
                          <YAxis hide domain={[0, 100]} />
                          <Tooltip cursor={{fill: '#f1f5f9'}} />
                          <Bar dataKey="focus" radius={[6, 6, 0, 0]} barSize={38}>
                            {individualStats.weeklyData.map((entry, index) => (
                              <Cell key={`cell-${index}`} fill={entry.focus > 70 ? '#4f46e5' : '#f43f5e'} />
                            ))}
                          </Bar>
                        </BarChart>
                      </ResponsiveContainer>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    {['daily', 'weekly', 'monthly'].map((period) => (
                      <div key={period} className="bg-slate-50 rounded-[2rem] p-6 border border-slate-200 flex flex-col items-center text-center group hover:border-indigo-400 transition-all shadow-sm">
                        <span className="text-[10px] font-black text-white bg-slate-900 px-6 py-2 rounded-full uppercase tracking-widest italic mb-4">{period}</span>
                        <div className="space-y-3">
                          <div>
                            <p className="text-[8px] font-black text-slate-400 uppercase mb-1">Active</p>
                            <p className="text-2xl font-black text-slate-900 italic">{individualStats[period]?.hours || 0}h</p>
                          </div>
                          <div>
                            <p className="text-[8px] font-black text-slate-400 uppercase mb-1">Focus</p>
                            <p className="text-2xl font-black text-indigo-600 italic">{individualStats[period]?.focus || 0}%</p>
                          </div>
                          <div>
                            <p className="text-[8px] font-black text-slate-400 uppercase mb-1">Risk</p>
                            <p className={`text-2xl font-black italic ${individualStats[period]?.anomalies > 0 ? 'text-red-500 animate-pulse' : 'text-emerald-500'}`}>
                              {individualStats[period]?.anomalies || 0}
                            </p>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
            <div className="p-10 bg-slate-50 border-t border-slate-100 flex justify-end shrink-0">
               <button onClick={() => { setSelectedUser(null); setModalError(null); }} className="px-12 py-4 bg-slate-900 text-white rounded-2xl font-black text-[11px] uppercase tracking-widest hover:bg-indigo-600 transition-all shadow-2xl">Close File</button>
            </div>
          </div>
        </div>
      )}

      <style dangerouslySetInnerHTML={{ __html: `
        .animate-spin-slow { animation: spin 8s linear infinite; }
        @keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }
        ::-webkit-scrollbar { width: 6px; }
        ::-webkit-scrollbar-track { background: transparent; }
        ::-webkit-scrollbar-thumb { background: #cbd5e1; border-radius: 10px; }
        ::-webkit-scrollbar-thumb:hover { background: #94a3b8; }
      `}} />
    </div>
  );
}