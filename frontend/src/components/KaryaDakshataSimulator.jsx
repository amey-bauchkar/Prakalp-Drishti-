import React, { useState, useEffect } from 'react';
import { Building2, AlertTriangle, TrendingUp, Clock, Calculator, ShieldCheck, Activity, BarChart3, ArrowRight } from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell, CartesianGrid } from 'recharts';

const KaryaDakshataSimulator = () => {
    const [agencies, setAgencies] = useState([]);
    const [selectedAgency, setSelectedAgency] = useState("");
    const [baseCost, setBaseCost] = useState(500);
    const [baseTime, setBaseTime] = useState(1000);
    
    const [result, setResult] = useState(null);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);

    // Fetch agencies on mount
    useEffect(() => {
        fetch('/api/karya-dakshata/agencies')
            .then(res => res.json())
            .then(data => {
                if (data.agencies) {
                    setAgencies(data.agencies);
                    if (data.agencies.length > 0) setSelectedAgency(data.agencies[0].name);
                }
            })
            .catch(err => console.error("Failed to load agencies", err));
    }, []);

    const runSimulation = async () => {
        setLoading(true);
        setError(null);
        setResult(null);
        try {
            await new Promise(resolve => setTimeout(resolve, 800));
            const response = await fetch('/api/karya-dakshata/simulate', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    agency_name: selectedAgency,
                    base_cost_cr: parseFloat(baseCost),
                    base_time_days: parseFloat(baseTime)
                })
            });
            if (!response.ok) throw new Error("API Error");
            const data = await response.json();
            setResult(data);
        } catch (err) {
            setError(err.message);
        }
        setLoading(false);
    };

    const getScoreColor = (score) => {
        if (score >= 80) return "text-emerald-500";
        if (score >= 50) return "text-amber-500";
        return "text-rose-500";
    };

    const getScoreText = (score) => {
        if (score >= 80) return "High Reliability";
        if (score >= 50) return "Moderate Risk";
        return "High Risk of Overrun";
    };

    return (
        <div className="space-y-8 font-sans max-w-6xl mx-auto">
            {/* Header */}
            <div className="panel p-4 sm:p-6 flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
                <div className="space-y-3">
                    <div className="inline-flex items-center gap-2 px-3 py-1 rounded-sm bg-gov-saffron-light text-gov-saffron-dark border border-gov-gold-border text-[11px] font-bold uppercase tracking-wider font-mono">
                        <Activity className="w-3.5 h-3.5 text-gov-saffron" />
                        <span>KARYA-DAKSHATA · Agency Execution Simulator</span>
                    </div>
                    <h1 className="font-heading font-extrabold text-[30px] sm:text-[36px] text-gov-navy leading-tight tracking-tight">
                        Execution Reliability Simulator
                    </h1>
                    <p className="text-text-secondary text-[15px] max-w-2xl font-sans leading-relaxed">
                        AI-driven De-Biasing of "Optimistic" Project Estimates using Historical Agency Track Records.
                    </p>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
                {/* Input Panel */}
                <div className="lg:col-span-4 space-y-6">
                    <div className="panel p-4 sm:p-5">
                        <h2 className="font-heading font-extrabold text-[19px] text-gov-navy mb-5 flex items-center gap-2.5">
                            <Calculator className="w-5 h-5 text-gov-saffron" />
                            <span>Proposal Inputs</span>
                        </h2>
                        
                        <div className="space-y-5">
                            <div>
                                <label className="block text-[12.5px] font-bold text-gov-navy mb-2">Implementing Agency</label>
                                <select 
                                    value={selectedAgency} 
                                    onChange={(e) => setSelectedAgency(e.target.value)}
                                    className="w-full p-3 rounded-xl border border-border-default bg-slate-50 focus:ring-2 focus:ring-gov-navy focus:border-transparent outline-none transition-all text-[13.5px] font-bold text-gov-navy"
                                >
                                    {agencies.map(a => (
                                        <option key={a.name} value={a.name}>
                                            {a.name}
                                        </option>
                                    ))}
                                </select>
                            </div>

                            <div>
                                <label className="block text-[12.5px] font-bold text-gov-navy mb-2">Proposed Budget (₹ Cr)</label>
                                <div className="relative">
                                    <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none">
                                        <span className="text-slate-400 font-bold font-mono">₹</span>
                                    </div>
                                    <input 
                                        type="number" 
                                        value={baseCost} 
                                        onChange={(e) => setBaseCost(e.target.value)}
                                        className="w-full pl-9 p-3 rounded-xl border border-border-default bg-slate-50 focus:ring-2 focus:ring-gov-navy outline-none font-mono font-bold text-[14px]"
                                    />
                                </div>
                            </div>
                            
                            <div>
                                <label className="block text-[12.5px] font-bold text-gov-navy mb-2">Proposed Timeline (Days)</label>
                                <div className="relative">
                                    <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none">
                                        <Clock className="w-4 h-4 text-slate-400" />
                                    </div>
                                    <input 
                                        type="number" 
                                        value={baseTime} 
                                        onChange={(e) => setBaseTime(e.target.value)}
                                        className="w-full pl-10 p-3 rounded-xl border border-border-default bg-slate-50 focus:ring-2 focus:ring-gov-navy outline-none font-mono font-bold text-[14px]"
                                    />
                                </div>
                            </div>

                            <button 
                                onClick={runSimulation}
                                disabled={loading || !selectedAgency}
                                className="btn-saffron-pill w-full justify-center py-3.5 text-xs font-bold uppercase tracking-wider shadow-md active:scale-[0.98] disabled:opacity-70 disabled:cursor-not-allowed"
                            >
                                {loading ? (
                                    <>
                                        <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                                        <span>Analyzing Track Record...</span>
                                    </>
                                ) : (
                                    <>
                                        <BarChart3 className="w-4 h-4" />
                                        <span>RUN DE-BIASING ENGINE</span>
                                    </>
                                )}
                            </button>
                        </div>
                    </div>
                </div>

                {/* Results Panel */}
                <div className="lg:col-span-8">
                    {!result && !loading && !error && (
                        <div className="h-full min-h-[420px] flex flex-col items-center justify-center text-center p-8 panel">
                            <div className="w-16 h-16 bg-gov-saffron-light text-gov-saffron-dark rounded-2xl flex items-center justify-center mb-4 border border-gov-gold-border">
                                <Activity className="w-8 h-8 text-gov-saffron" />
                            </div>
                            <h3 className="text-xl font-bold text-gov-navy font-heading mb-2">Ready to Simulate</h3>
                            <p className="text-text-secondary text-[14px] max-w-md">Select an agency and enter project parameters to calculate the true expected timeline and cost based on historical performance.</p>
                        </div>
                    )}

                    {error && (
                        <div className="note note-critical flex items-center gap-3">
                            <AlertTriangle className="w-5 h-5 text-rose-600 shrink-0" />
                            <span className="font-bold">Engine Error: {error}</span>
                        </div>
                    )}

                    {loading && (
                        <div className="h-full min-h-[420px] flex flex-col items-center justify-center space-y-4 panel">
                            <div className="relative w-16 h-16">
                                <div className="absolute inset-0 border-4 border-slate-200 rounded-full"></div>
                                <div className="absolute inset-0 border-4 border-gov-saffron border-t-transparent rounded-full animate-spin"></div>
                            </div>
                            <div className="text-gov-navy font-bold text-lg font-heading animate-pulse">Running Monte Carlo Simulations...</div>
                            <div className="text-xs text-text-muted font-mono">Querying 10+ years of {selectedAgency} historical data</div>
                        </div>
                    )}

                    {result && !loading && (
                        <div className="space-y-6">
                            {/* Score & Header Card */}
                            <div className="panel p-4 sm:p-5 relative overflow-hidden">
                                <div className="flex flex-col md:flex-row items-center justify-between gap-8 relative z-10">
                                    <div className="flex-1 space-y-2">
                                        <div className="inline-flex items-center gap-2 px-3 py-1 bg-slate-100 rounded-sm text-xs font-bold text-gov-navy uppercase tracking-wider font-mono">
                                            <Building2 className="w-3.5 h-3.5 text-gov-saffron" />
                                            <span>Agency Profile</span>
                                        </div>
                                        <h2 className="text-2xl sm:text-3xl font-extrabold text-gov-navy leading-tight font-heading">
                                            {result.Agency}
                                        </h2>
                                        <p className="text-text-secondary text-[13.5px] flex items-center gap-2 font-sans pt-1">
                                            <AlertTriangle className="w-4 h-4 text-amber-500 shrink-0" />
                                            <span>Historical Variance: <strong className="text-gov-navy font-mono">{result.Historical_Cost_Variance_Avg} Cost, {result.Historical_Delay_Avg} Delay</strong></span>
                                        </p>
                                    </div>
                                    
                                    {/* Score Gauge */}
                                    <div className="flex flex-col items-center shrink-0 bg-slate-50 p-4 rounded-2xl border border-slate-200">
                                        <div className="relative flex items-center justify-center w-28 h-28">
                                            <svg className="w-full h-full -rotate-90" viewBox="0 0 100 100">
                                                <circle className="text-slate-200 stroke-current" strokeWidth="8" cx="50" cy="50" r="40" fill="transparent"></circle>
                                                <circle 
                                                    className={`${getScoreColor(result.Reliability_Score)} stroke-current transition-all duration-1000 ease-out`} 
                                                    strokeWidth="8" 
                                                    strokeLinecap="round" 
                                                    cx="50" 
                                                    cy="50" 
                                                    r="40" 
                                                    fill="transparent" 
                                                    strokeDasharray="251.2" 
                                                    strokeDashoffset={251.2 - (251.2 * result.Reliability_Score) / 100}
                                                ></circle>
                                            </svg>
                                            <div className="absolute flex flex-col items-center justify-center">
                                                <span className={`text-3xl font-black font-mono tracking-tighter ${getScoreColor(result.Reliability_Score)}`}>
                                                    {Number(result.Reliability_Score).toFixed(1)}
                                                </span>
                                            </div>
                                        </div>
                                        <span className={`mt-2 font-bold text-xs ${getScoreColor(result.Reliability_Score)}`}>{getScoreText(result.Reliability_Score)}</span>
                                    </div>
                                </div>
                            </div>

                            {/* Charts Grid */}
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                {/* Cost Comparison */}
                                <div className="panel p-4 sm:p-5">
                                    <div className="flex justify-between items-start mb-4">
                                        <div>
                                            <h3 className="text-text-muted font-bold text-xs uppercase tracking-wider font-mono">Expected Cost</h3>
                                            <div className="text-2xl sm:text-3xl font-black text-rose-600 font-mono mt-1">₹{result.True_Expected_Cost_Cr} <span className="text-base text-rose-400 font-bold">Cr</span></div>
                                            <div className="text-xs text-text-muted mt-1 line-through decoration-slate-400 font-mono">Proposed: ₹{result.Base_Cost_Cr} Cr</div>
                                        </div>
                                        <div className="w-10 h-10 rounded-xl bg-rose-50 flex items-center justify-center text-rose-500 border border-rose-200">
                                            <TrendingUp className="w-5 h-5" />
                                        </div>
                                    </div>
                                    
                                    <div className="h-44 w-full mt-4">
                                        <ResponsiveContainer width="100%" height="100%">
                                            <BarChart data={[
                                                { name: 'Proposed', value: result.Base_Cost_Cr },
                                                { name: 'AI Expected', value: result.True_Expected_Cost_Cr }
                                            ]} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                                                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f0f0f0" />
                                                <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{fill: '#6b7280', fontSize: 12, fontWeight: 600}} />
                                                <YAxis axisLine={false} tickLine={false} tick={{fill: '#9ca3af', fontSize: 11}} />
                                                <Tooltip cursor={{fill: '#f3f4f6'}} contentStyle={{borderRadius: '12px', border: '1px solid #e2e8f0', boxShadow: '0 4px 12px rgba(0,0,0,0.05)'}} />
                                                <Bar dataKey="value" radius={[6, 6, 0, 0]}>
                                                    {
                                                        [0,1].map((entry, index) => (
                                                            <Cell key={`cell-${index}`} fill={index === 0 ? '#94a3b8' : '#e11d48'} />
                                                        ))
                                                    }
                                                </Bar>
                                            </BarChart>
                                        </ResponsiveContainer>
                                    </div>
                                </div>

                                {/* Timeline Comparison */}
                                <div className="panel p-4 sm:p-5">
                                    <div className="flex justify-between items-start mb-4">
                                        <div>
                                            <h3 className="text-text-muted font-bold text-xs uppercase tracking-wider font-mono">Expected Timeline</h3>
                                            <div className="text-2xl sm:text-3xl font-black text-amber-600 font-mono mt-1">{result.True_Expected_Timeline_Days} <span className="text-base text-amber-500 font-bold">Days</span></div>
                                            <div className="text-xs text-text-muted mt-1 line-through decoration-slate-400 font-mono">Proposed: {result.Base_Timeline_Days} Days</div>
                                        </div>
                                        <div className="w-10 h-10 rounded-xl bg-amber-50 flex items-center justify-center text-amber-500 border border-amber-200">
                                            <Clock className="w-5 h-5" />
                                        </div>
                                    </div>
                                    
                                    <div className="h-44 w-full mt-4">
                                        <ResponsiveContainer width="100%" height="100%">
                                            <BarChart data={[
                                                { name: 'Proposed', value: result.Base_Timeline_Days },
                                                { name: 'AI Expected', value: result.True_Expected_Timeline_Days }
                                            ]} margin={{ top: 10, right: 10, left: -20, bottom: 0 }} layout="vertical">
                                                <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="#f0f0f0" />
                                                <XAxis type="number" axisLine={false} tickLine={false} tick={{fill: '#9ca3af', fontSize: 11}} />
                                                <YAxis type="category" dataKey="name" axisLine={false} tickLine={false} tick={{fill: '#6b7280', fontSize: 12, fontWeight: 600}} width={95} />
                                                <Tooltip cursor={{fill: '#f3f4f6'}} contentStyle={{borderRadius: '12px', border: '1px solid #e2e8f0', boxShadow: '0 4px 12px rgba(0,0,0,0.05)'}} />
                                                <Bar dataKey="value" radius={[0, 6, 6, 0]} barSize={26}>
                                                    {
                                                        [0,1].map((entry, index) => (
                                                            <Cell key={`cell-${index}`} fill={index === 0 ? '#94a3b8' : '#d97706'} />
                                                        ))
                                                    }
                                                </Bar>
                                            </BarChart>
                                        </ResponsiveContainer>
                                    </div>
                                </div>
                            </div>
                            
                            {/* Insight Banner */}
                            <div className="bg-gov-navy text-white rounded-3xl p-6 sm:p-7 flex items-center gap-4 shadow-elevated border border-slate-700/80">
                                <ShieldCheck className="w-8 h-8 text-emerald-400 shrink-0" />
                                <div className="space-y-1">
                                    <h4 className="font-extrabold text-[16px] text-white font-heading">AI Recommendation</h4>
                                    <p className="text-slate-300 text-[13.5px] leading-relaxed font-sans">
                                        Based on a reliability score of {result.Reliability_Score}, we recommend buffering the budget by an additional {result.Historical_Cost_Variance_Avg} and establishing strict milestone checkpoints every 90 days.
                                    </p>
                                </div>
                            </div>

                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default KaryaDakshataSimulator;
