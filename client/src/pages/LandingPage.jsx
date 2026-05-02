import React from 'react';
import { Link } from 'react-router-dom';
import { 
  ShieldCheck, Activity, BarChart3, Eye, 
  Zap, Lock, Globe, ArrowRight, Sparkles 
} from 'lucide-react';

// --- ENHANCED LOGO COMPONENT ---
// Expresses: Computer Vision (Lens) + Productivity Tracking (Data Bars)
const PresenceMetricsLogo = ({ className = "w-10 h-10" }) => (
  <svg 
    viewBox="0 0 100 100" 
    className={className} 
    fill="none" 
    xmlns="http://www.w3.org/2000/svg"
  >
    {/* Outer Vision Ring - Scanning Effect */}
    <circle cx="50" cy="50" r="42" stroke="currentColor" strokeWidth="2" strokeDasharray="4 4" className="opacity-40" />
    <circle cx="50" cy="50" r="48" stroke="currentColor" strokeWidth="1" className="opacity-20" />
    
    {/* The Lens / Pupil (Computer Vision Core) */}
    <circle cx="50" cy="50" r="12" fill="currentColor" />
    <circle cx="50" cy="50" r="18" stroke="currentColor" strokeWidth="2" />
    
    {/* Data Metrics Bars (Integrated into the "Iris") */}
    <rect x="48" y="22" width="4" height="8" rx="2" fill="currentColor" />
    <rect x="68" y="32" width="4" height="12" rx="2" fill="currentColor" transform="rotate(45 68 32)" />
    <rect x="70" y="48" width="8" height="4" rx="2" fill="currentColor" />
    <rect x="28" y="32" width="4" height="10" rx="2" fill="currentColor" transform="rotate(-45 28 32)" />
    
    {/* Eye lids / Shield Frame (Security) */}
    <path 
      d="M15 50C15 50 30 25 50 25C70 25 85 50 85 50C85 50 70 75 50 75C30 75 15 50 15 50Z" 
      stroke="currentColor" 
      strokeWidth="4" 
      strokeLinecap="round" 
    />
  </svg>
);

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-[#fafbff] font-sans overflow-x-hidden">
      
      {/* --- HERO SECTION --- */}
      <header className="relative h-[95vh] flex flex-col items-center justify-center text-white px-4">
        <div 
          className="absolute inset-0 z-0 scale-105"
          style={{
            backgroundImage: `url('https://images.unsplash.com/photo-1517048676732-d65bc937f952?q=80&w=2070&auto=format&fit=crop')`,
            backgroundSize: 'cover',
            backgroundPosition: 'center',
            filter: 'brightness(0.18) saturate(1.4) blur(1px)'
          }}
        />

        <div className="absolute inset-0 z-0 bg-gradient-to-br from-indigo-950/80 via-transparent to-violet-950/80" />

        {/* Navigation */}
        <nav className="absolute top-0 w-full flex items-center justify-between px-6 md:px-12 py-8 z-20">
          <div className="flex items-center gap-4 group cursor-pointer">
            <PresenceMetricsLogo className="w-12 h-12 text-violet-400 group-hover:rotate-12 transition-transform duration-500" />
            <div className="flex flex-col">
              <h1 className="text-3xl font-black tracking-tighter leading-none">
                <span className="text-white">PRESENCE</span>
                <span className="bg-gradient-to-r from-violet-400 to-fuchsia-400 bg-clip-text text-transparent italic">METRICS</span>
              </h1>
              <span className="text-[9px] font-bold tracking-[0.4em] text-violet-300/80 mt-1">VISIONARY INTELLIGENCE</span>
            </div>
          </div>
          <div className="flex items-center gap-8">
            <Link to="/login" className="text-sm font-black uppercase tracking-widest text-slate-300 hover:text-white transition-colors">Sign In</Link>
            <Link to="/register" className="px-7 py-3 bg-violet-600 text-white rounded-xl font-black text-sm uppercase tracking-tight hover:bg-violet-500 transition-all shadow-lg shadow-violet-600/30">
              Get Started
            </Link>
          </div>
        </nav>

        {/* Hero Content */}
        <div className="relative z-10 text-center max-w-5xl animate-in fade-in slide-in-from-bottom-12 duration-1000">
          <div className="inline-flex items-center gap-2 bg-violet-500/10 border border-violet-500/20 px-5 py-2.5 rounded-full mb-8 backdrop-blur-sm">
            <Sparkles size={18} className="text-violet-400 animate-pulse" />
            <span className="text-[11px] font-black uppercase tracking-[0.25em] text-violet-200">Verify Presence. Unlock Performance.</span>
          </div>
          <h2 className="text-6xl md:text-8xl font-black tracking-tighter mb-10 leading-[0.95] text-white">
            Ethical Productivity. <br />
            <span className="bg-gradient-to-r from-violet-400 to-indigo-400 bg-clip-text text-transparent">Verified by Vision.</span>
          </h2>
          <p className="text-xl md:text-2xl text-slate-200 mb-12 max-w-3xl mx-auto font-medium leading-relaxed">
            Harnessing Computer Vision to bridge the gap between remote flexibility and verifiable focus—built for teams that value trust and data equally.
          </p>
          <div className="flex flex-col md:flex-row items-center justify-center gap-6">
            <Link to="/register" className="group px-10 py-5 bg-violet-600 text-white rounded-2xl font-black text-xl flex items-center gap-3 hover:bg-violet-500 transition-all shadow-2xl shadow-violet-600/40 active:scale-95">
              Launch Your Workspace <ArrowRight className="w-6 h-6 group-hover:translate-x-1.5 transition-transform" />
            </Link>
            <button className="px-10 py-5 bg-white/5 backdrop-blur-lg border border-white/10 rounded-2xl font-black text-xl hover:bg-white/10 transition-all text-white">
              Explore The Tech
            </button>
          </div>
        </div>
      </header>

      {/* --- STATS STRIP --- */}
      <section className="bg-white border-y border-slate-100 py-16 px-6 relative z-10 shadow-inner">
        <div className="max-w-7xl mx-auto grid grid-cols-2 md:grid-cols-4 gap-12 text-center">
          {[
            { label: 'Deep Focus Lift', val: '+40%' },
            { label: 'Tracking Accuracy', val: '99.9%' },
            { label: 'Employee Trust', val: '100%' },
            { label: 'Analytics Delivery', val: 'Instant' }
          ].map((s, i) => (
            <div key={i} className="group">
              <p className="text-5xl font-black text-violet-600 mb-2 group-hover:scale-110 transition-transform duration-300">{s.val}</p>
              <p className="text-[11px] font-black text-slate-500 uppercase tracking-[0.2em]">{s.label}</p>
            </div>
          ))}
        </div>
      </section>

      {/* --- FEATURES GRID --- */}
      <section className="py-28 px-6 max-w-7xl mx-auto relative">
        <div className="absolute top-1/4 -left-20 w-96 h-96 bg-indigo-100 rounded-full blur-[100px] opacity-60" />
        <div className="absolute bottom-1/4 -right-20 w-96 h-96 bg-violet-100 rounded-full blur-[100px] opacity-60" />

        <div className="text-center mb-24 relative z-10">
          <h3 className="text-[11px] font-black text-violet-600 uppercase tracking-[0.3em] mb-4">The Visionary Stack</h3>
          <h2 className="text-5xl font-black text-slate-900 tracking-tight">Analytics that respect autonomy.</h2>
        </div>

        <div className="grid md:grid-cols-3 gap-10 relative z-10">
          {[
            {
              icon: <Eye className="w-9 h-9" />,
              title: "Eye-Tracking Core",
              desc: "Verified active presence using high-precision face detection. We know when you're there, and we stop when you're not."
            },
            {
              icon: <Zap className="w-9 h-9" />,
              title: "Behavioral Scoring",
              desc: "Contextual focus analysis that looks at app usage, input velocity, and focus duration to build your unique profile."
            },
            {
              icon: <Lock className="w-9 h-9" />,
              title: "Fortified Privacy",
              desc: "Industry-leading encryption standards. We process vision data locally, ensuring your personal feed never leaves your device."
            },
            {
              icon: <Activity className="w-9 h-9" />,
              title: "Anomaly Guard",
              desc: "AI-driven detection for synthetic inputs and ghosting patterns, maintaining the sanctity of your performance data."
            },
            {
              icon: <BarChart3 className="w-9 h-9" />,
              title: "Macro Leaderboards",
              desc: "Gamified performance metrics for teams to thrive together. Compete on focus, not just on hours clocked."
            },
            {
              icon: <Globe className="w-9 h-9" />,
              title: "Unified Sync",
              desc: "A singular dashboard for the global remote workforce. Synchronize focus sessions across every timezone."
            }
          ].map((f, i) => (
            <div key={i} className="group p-10 bg-white border border-slate-100 rounded-[3rem] shadow-xl shadow-slate-200/40 hover:shadow-violet-500/20 hover:-translate-y-2.5 transition-all duration-500 relative overflow-hidden">
              <div className="absolute top-0 right-0 w-24 h-24 bg-violet-50 rounded-bl-full group-hover:bg-violet-600 transition-colors" />
              <div className="relative z-10 text-violet-600 w-16 h-16 flex items-center justify-center mb-8 group-hover:text-white transition-colors">
                {f.icon}
              </div>
              <h4 className="text-2xl font-black text-slate-900 mb-4 tracking-tight">{f.title}</h4>
              <p className="text-slate-600 font-bold text-sm leading-relaxed">{f.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* --- FOOTER CTA --- */}
      <section className="bg-slate-950 py-24 px-6 text-center overflow-hidden relative">
        <div className="absolute top-0 left-1/4 w-[600px] h-[300px] bg-indigo-600/30 blur-[120px] rounded-full" />
        <div className="absolute bottom-0 right-1/4 w-[600px] h-[300px] bg-violet-600/30 blur-[120px] rounded-full" />
        
        <div className="relative z-10">
          <h2 className="text-5xl font-black text-white mb-8 tracking-tighter leading-tight">Ready for a clearer <br/> view of productivity?</h2>
          <p className="text-slate-300 font-bold mb-12 max-w-2xl mx-auto text-lg leading-relaxed">Join innovative organizations building high-trust, high-performance remote cultures with PresenceMetrics.</p>
          <Link to="/register" className="inline-flex items-center gap-3.5 px-12 py-5 bg-violet-600 text-white rounded-2xl font-black text-xl hover:bg-violet-500 transition-all shadow-2xl shadow-violet-600/50 active:scale-95">
            Create Your Account <ArrowRight size={24} />
          </Link>
        </div>
      </section>

      {/* Footer Branding */}
      <footer className="py-12 px-6 border-t border-slate-100 text-center bg-white">
        <div className="flex flex-col items-center justify-center gap-6">
          <div className="flex items-center gap-3">
            <PresenceMetricsLogo className="text-slate-900 w-8 h-8" />
            <h1 className="text-xl font-black tracking-tighter italic text-slate-900">
              PRESENCE<span className="text-violet-500">METRICS</span>
            </h1>
          </div>
          <p className="text-xs font-bold text-slate-400 max-w-sm">
            The next generation of remote workforce verification. Ethical by design, powerful by choice.
          </p>
          <div className="w-12 h-1 bg-slate-100 rounded-full" />
          <p className="text-[10px] font-black text-slate-300 uppercase tracking-[0.5em]">© 2024 ALL RIGHTS RESERVED</p>
        </div>
      </footer>
    </div>
  );
}