import React, { useState, useEffect } from 'react';
import { Building2, AlertTriangle, TrendingUp, Clock, Calculator, ShieldCheck, Activity, BarChart3 } from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell, CartesianGrid } from 'recharts';
import './KaryaDakshataSimulator.css'; // Retain if needed

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
        setResult(null); // Clear previous result
        try {
            // Artificial delay to show off the cool loading state
            await new Promise(resolve => setTimeout(resolve, 1500));
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
        <div className="animate-in fade-in slide-in-from-bottom-4 duration-700 p-6 md:p-8 font-sans max-w-6xl mx-auto">
            {/* Header */}
            <div className="mb-8 border-b border-gov-border pb-6 flex items-start gap-4">
                <div className="p-3 bg-gov-navy/10 text-gov-navy rounded-xl">
                    <Activity className="w-8 h-8" />
                </div>
                <div>
                    <h1 className="text-3xl font-black text-gov-navy tracking-tight">Execution Reliability Simulator</h1>
                    <p className="text-gov-muted mt-1 text-lg">AI-driven De-Biasing of "Optimistic" Project Estimates using Historical Agency Track Records.</p>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
                {/* Input Panel */}
                <div className="lg:col-span-4 space-y-6">
                    <div className="bg-white p-6 rounded-2xl border border-gov-border shadow-soft">
                        <h2 className="text-lg font-bold text-gov-navy mb-4 flex items-center gap-2">
                            <Calculator className="w-5 h-5 text-gov-accent" />
                            Proposal Inputs
                        </h2>
                        
                        <div className="space-y-5">
                            <div>
                                <label className="block text-sm font-semibold text-gov-navy mb-2">Implementing Agency</label>
                                <select 
                                    value={selectedAgency} 
                                    onChange={(e) => setSelectedAgency(e.target.value)}
                                    className="w-full p-3 rounded-lg border border-gray-200 bg-gray-50 focus:ring-2 focus:ring-gov-navy focus:border-transparent outline-none transition-all text-sm font-medium"
                                >
                                    {agencies.map(a => (
                                        <option key={a.name} value={a.name}>
                                            {a.name}
                                        </option>
                                    ))}
                                </select>
                            </div>

                            <div>
                                <label className="block text-sm font-semibold text-gov-navy mb-2">Proposed Budget (₹ Cr)</label>
                                <div className="relative">
                                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                        <span className="text-gray-500 font-bold">₹</span>
                                    </div>
                                    <input 
                                        type="number" 
                                        value={baseCost} 
                                        onChange={(e) => setBaseCost(e.target.value)}
                                        className="w-full pl-8 p-3 rounded-lg border border-gray-200 bg-gray-50 focus:ring-2 focus:ring-gov-navy outline-none font-medium"
                                    />
                                </div>
                            </div>
                            
                            <div>
                                <label className="block text-sm font-semibold text-gov-navy mb-2">Proposed Timeline (Days)</label>
                                <div className="relative">
                                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                        <Clock className="w-4 h-4 text-gray-500" />
                                    </div>
                                    <input 
                                        type="number" 
                                        value={baseTime} 
                                        onChange={(e) => setBaseTime(e.target.value)}
                                        className="w-full pl-9 p-3 rounded-lg border border-gray-200 bg-gray-50 focus:ring-2 focus:ring-gov-navy outline-none font-medium"
                                    />
                                </div>
                            </div>

                            <button 
                                onClick={runSimulation}
                                disabled={loading || !selectedAgency}
                                className="w-full mt-4 flex items-center justify-center gap-2 bg-gov-navy hover:bg-gov-navy/90 text-white p-4 rounded-xl font-bold transition-all shadow-md active:scale-[0.98] disabled:opacity-70 disabled:cursor-not-allowed"
                            >
                                {loading ? (
                                    <>
                                        <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                                        Analyzing Track Record...
                                    </>
                                ) : (
                                    <>
                                        <BarChart3 className="w-5 h-5" />
                                        RUN DE-BIASING ENGINE
                                    </>
                                )}
                            </button>
                        </div>
                    </div>
                </div>

                {/* Results Panel */}
                <div className="lg:col-span-8">
                    {!result && !loading && !error && (
                        <div className="h-full min-h-[400px] flex flex-col items-center justify-center text-center p-8 bg-gray-50/50 rounded-2xl border-2 border-dashed border-gray-200">
                            <div className="w-16 h-16 bg-blue-50 text-blue-500 rounded-full flex items-center justify-center mb-4">
                                <Activity className="w-8 h-8" />
                            </div>
                            <h3 className="text-xl font-bold text-gray-800 mb-2">Ready to Simulate</h3>
                            <p className="text-gray-500 max-w-md">Select an agency and enter project parameters to calculate the true expected timeline and cost based on historical performance.</p>
                        </div>
                    )}

                    {error && (
                        <div className="p-4 bg-red-50 text-red-600 rounded-xl border border-red-100 flex items-center gap-3">
                            <AlertTriangle className="w-5 h-5" />
                            <span className="font-medium">Engine Error: {error}</span>
                        </div>
                    )}

                    {loading && (
                        <div className="h-full min-h-[400px] flex flex-col items-center justify-center space-y-4">
                            <div className="relative w-20 h-20">
                                <div className="absolute inset-0 border-4 border-gov-navy/10 rounded-full"></div>
                                <div className="absolute inset-0 border-4 border-gov-navy border-t-transparent rounded-full animate-spin"></div>
                            </div>
                            <div className="text-gov-navy font-bold text-lg animate-pulse">Running Monte Carlo Simulations...</div>
                            <div className="text-sm text-gov-muted">Querying 10+ years of {selectedAgency} historical data</div>
                        </div>
                    )}

                    {result && !loading && (
                        <div className="animate-in fade-in slide-in-from-right-8 duration-500 space-y-6">
                            {/* Score & Header Card */}
                            <div className="bg-white p-6 md:p-8 rounded-2xl border border-gov-border shadow-xl relative overflow-hidden">
                                <div className="absolute top-0 right-0 w-64 h-64 bg-gradient-to-br from-gray-50 to-gray-100 rounded-full -mr-32 -mt-32 opacity-50 pointer-events-none"></div>
                                
                                <div className="flex flex-col md:flex-row items-center justify-between gap-8 relative z-10">
                                    <div className="flex-1">
                                        <div className="inline-flex items-center gap-2 px-3 py-1 bg-gray-100 rounded-full text-xs font-bold text-gray-600 mb-4 uppercase tracking-wider">
                                            <Building2 className="w-3.5 h-3.5" />
                                            Agency Profile
                                        </div>
                                        <h2 className="text-2xl md:text-3xl font-black text-gov-navy leading-tight mb-2">
                                            {result.Agency}
                                        </h2>
                                        <p className="text-gray-500 flex items-center gap-2">
                                            <AlertTriangle className="w-4 h-4 text-amber-500" />
                                            Historical Variance: <span className="font-bold text-gray-700">{result.Historical_Cost_Variance_Avg} Cost, {result.Historical_Delay_Avg} Delay</span>
                                        </p>
                                    </div>
                                    
                                    {/* Score Gauge */}
                                    <div className="flex flex-col items-center shrink-0">
                                        <div className="relative flex items-center justify-center w-32 h-32">
                                            <svg className="w-full h-full -rotate-90" viewBox="0 0 100 100">
                                                <circle className="text-gray-100 stroke-current" strokeWidth="8" cx="50" cy="50" r="40" fill="transparent"></circle>
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
                                                <span className={`text-3xl font-black tracking-tighter ${getScoreColor(result.Reliability_Score)}`}>
                                                    {Number(result.Reliability_Score).toFixed(1)}
                                                </span>
                                            </div>
                                        </div>
                                        <span className={`mt-2 font-bold text-sm ${getScoreColor(result.Reliability_Score)}`}>{getScoreText(result.Reliability_Score)}</span>
                                    </div>
                                </div>
                            </div>

                            {/* Charts Grid */}
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                {/* Cost Comparison */}
                                <div className="bg-white p-6 rounded-2xl border border-gov-border shadow-soft">
                                    <div className="flex justify-between items-start mb-6">
                                        <div>
                                            <h3 className="text-gray-500 font-semibold text-sm mb-1 uppercase tracking-wider">Expected Cost</h3>
                                            <div className="text-3xl font-black text-rose-600">₹{result.True_Expected_Cost_Cr} <span className="text-lg text-rose-400 font-bold">Cr</span></div>
                                            <div className="text-sm text-gray-500 mt-1 line-through decoration-gray-400">Proposed: ₹{result.Base_Cost_Cr} Cr</div>
                                        </div>
                                        <div className="w-10 h-10 rounded-full bg-rose-50 flex items-center justify-center text-rose-500">
                                            <TrendingUp className="w-5 h-5" />
                                        </div>
                                    </div>
                                    
                                    <div className="h-48 w-full mt-4">
                                        <ResponsiveContainer width="100%" height="100%">
                                            <BarChart data={[
                                                { name: 'Proposed', value: result.Base_Cost_Cr },
                                                { name: 'AI Expected', value: result.True_Expected_Cost_Cr }
                                            ]} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                                                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f0f0f0" />
                                                <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{fill: '#6b7280', fontSize: 12, fontWeight: 600}} />
                                                <YAxis axisLine={false} tickLine={false} tick={{fill: '#9ca3af', fontSize: 11}} />
                                                <Tooltip cursor={{fill: '#f3f4f6'}} contentStyle={{borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)'}} />
                                                <Bar dataKey="value" radius={[4, 4, 0, 0]}>
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
                                <div className="bg-white p-6 rounded-2xl border border-gov-border shadow-soft">
                                    <div className="flex justify-between items-start mb-6">
                                        <div>
                                            <h3 className="text-gray-500 font-semibold text-sm mb-1 uppercase tracking-wider">Expected Timeline</h3>
                                            <div className="text-3xl font-black text-amber-600">{result.True_Expected_Timeline_Days} <span className="text-lg text-amber-500 font-bold">Days</span></div>
                                            <div className="text-sm text-gray-500 mt-1 line-through decoration-gray-400">Proposed: {result.Base_Timeline_Days} Days</div>
                                        </div>
                                        <div className="w-10 h-10 rounded-full bg-amber-50 flex items-center justify-center text-amber-500">
                                            <Clock className="w-5 h-5" />
                                        </div>
                                    </div>
                                    
                                    <div className="h-48 w-full mt-4">
                                        <ResponsiveContainer width="100%" height="100%">
                                            <BarChart data={[
                                                { name: 'Proposed', value: result.Base_Timeline_Days },
                                                { name: 'AI Expected', value: result.True_Expected_Timeline_Days }
                                            ]} margin={{ top: 10, right: 10, left: -20, bottom: 0 }} layout="vertical">
                                                <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="#f0f0f0" />
                                                <XAxis type="number" axisLine={false} tickLine={false} tick={{fill: '#9ca3af', fontSize: 11}} />
                                                <YAxis type="category" dataKey="name" axisLine={false} tickLine={false} tick={{fill: '#6b7280', fontSize: 12, fontWeight: 600}} width={95} />
                                                <Tooltip cursor={{fill: '#f3f4f6'}} contentStyle={{borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)'}} />
                                                <Bar dataKey="value" radius={[0, 4, 4, 0]} barSize={30}>
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
                            <div className="bg-gradient-to-r from-gov-navy to-blue-900 rounded-xl p-5 text-white flex items-center gap-4 shadow-lg">
                                <ShieldCheck className="w-10 h-10 text-emerald-400 shrink-0" />
                                <div>
                                    <h4 className="font-bold text-lg mb-1">AI Recommendation</h4>
                                    <p className="text-blue-100 text-sm">
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
