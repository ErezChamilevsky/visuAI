import React, { useState, useEffect } from 'react';
import { Play, Pause, ChevronLeft, ChevronRight, RotateCcw } from 'lucide-react';
import GraphRenderer from './Renderers/GraphRenderer';
import ArrayRenderer from './Renderers/ArrayRenderer';

const VisualizationEngine = ({ dsl }) => {
    const [currentStep, setCurrentStep] = useState(0);
    const [isPlaying, setIsPlaying] = useState(false);

    const { meta, structure, timeline } = dsl || {};
    const totalSteps = timeline?.length || 0;

    useEffect(() => {
        setCurrentStep(0);
        setIsPlaying(false);
    }, [dsl]);

    useEffect(() => {
        let interval;
        if (isPlaying && currentStep < totalSteps - 1) {
            interval = setInterval(() => {
                setCurrentStep(s => s + 1);
            }, 2500); // Slower, more cinematic pacing (2.5s per step)
        } else if (currentStep >= totalSteps - 1) {
            setIsPlaying(false);
        }
        return () => clearInterval(interval);
    }, [isPlaying, currentStep, totalSteps]);

    if (!dsl || !structure || !timeline) {
        return <div className="p-8 text-rose-500 flex items-center justify-center h-full text-xl font-light tracking-wide">Invalid JSON DSL structure provided.</div>;
    }

    const stepData = timeline[currentStep] || timeline[0];
    const { explanation } = stepData;

    const renderVisualization = () => {
        switch (structure.type) {
            case 'graph':
            case 'tree':
                return <GraphRenderer structure={structure} state={stepData} />;
            case 'array':
            case 'stack':
            case 'memory':
                return <ArrayRenderer structure={structure} state={stepData} />;
            default:
                return <div className="text-slate-500 font-light tracking-widest uppercase">Type Not Supported</div>;
        }
    };

    return (
        <div className="flex w-full h-full bg-[#050505] text-slate-200 relative overflow-hidden font-sans">

            {/* Left Column: Storyboard, Meta & Controls */}
            <div className="w-[400px] shrink-0 h-full flex flex-col justify-between p-10 border-r border-white/[0.05] bg-[#0a0a0a]/40 z-20 relative">

                {/* Top: Title & Meta */}
                <div>
                    <h2 className="text-3xl font-light tracking-tight text-white/90 mb-3 drop-shadow-md">
                        {meta?.title || 'Visualization'}
                    </h2>
                    <div className="flex flex-wrap gap-3 text-[10px] tracking-[0.2em] uppercase text-white/40 font-medium">
                        <span>{meta?.category}</span>
                        <span className="opacity-50">•</span>
                        <span>{meta?.difficulty}</span>
                    </div>
                </div>

                {/* Middle: The Storyboard (What & Why) */}
                <div className="flex-1 min-h-0 my-10 overflow-y-auto pr-4 scrollbar-thin scrollbar-thumb-white/10 scrollbar-track-transparent">
                    <p className="text-xl leading-relaxed text-slate-200 font-light drop-shadow-sm transition-opacity duration-500">
                        {explanation?.what || "Initializing timeline..."}
                    </p>
                    {(explanation?.why) && (
                        <div className="mt-8 pt-8 border-t border-white/[0.05]">
                            <h3 className="text-[10px] uppercase tracking-[0.2em] text-emerald-500/80 font-bold mb-3 flex items-center gap-2">
                                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500/80"></span>
                                Intuition
                            </h3>
                            <p className="text-sm leading-relaxed text-emerald-100/70 font-medium tracking-wide">
                                {explanation.why}
                            </p>
                        </div>
                    )}
                </div>

                {/* Bottom: Minimalist Dock Controls */}
                <div className="shrink-0 mt-auto w-full flex items-center justify-between gap-4 px-6 py-4 bg-white/[0.02] backdrop-blur-xl border border-white/[0.06] rounded-full shadow-lg">
                    <button
                        onClick={() => { setCurrentStep(0); setIsPlaying(false); }}
                        title="Reset"
                        className="p-2 rounded-full hover:bg-white/10 transition-colors text-slate-400 hover:text-white group"
                    >
                        <RotateCcw className="w-4 h-4 group-hover:-rotate-90 transition-transform duration-700 ease-out" />
                    </button>

                    <div className="flex items-center gap-3">
                        <button
                            onClick={() => setCurrentStep(s => Math.max(0, s - 1))}
                            disabled={currentStep === 0}
                            className="p-2 rounded-full hover:bg-white/10 transition-colors disabled:opacity-20 text-slate-300 hover:text-white"
                        >
                            <ChevronLeft className="w-5 h-5" />
                        </button>

                        <button
                            onClick={() => setIsPlaying(!isPlaying)}
                            className="w-10 h-10 flex items-center justify-center rounded-full bg-white text-black hover:scale-105 active:scale-95 shadow-[0_0_20px_rgba(255,255,255,0.15)] transition-all duration-500 ease-out"
                        >
                            {isPlaying ? <Pause className="w-4 h-4 fill-current" /> : <Play className="w-4 h-4 fill-current ml-0.5" />}
                        </button>

                        <button
                            onClick={() => setCurrentStep(s => Math.min(totalSteps - 1, s + 1))}
                            disabled={currentStep >= totalSteps - 1}
                            className="p-2 rounded-full hover:bg-white/10 transition-colors disabled:opacity-20 text-slate-300 hover:text-white"
                        >
                            <ChevronRight className="w-5 h-5" />
                        </button>
                    </div>

                    <div className="font-mono text-[11px] tracking-widest text-slate-500 opacity-80 font-medium">
                        {String(currentStep + 1).padStart(2, '0')}<span className="opacity-50">/</span>{String(totalSteps).padStart(2, '0')}
                    </div>
                </div>

            </div>

            {/* Right Column: Centered Mathematical Canvas */}
            <div className="flex-1 relative flex items-center justify-center z-0 transition-opacity duration-1000 ease-in-out p-12">
                {renderVisualization()}
            </div>

        </div>
    );
};

export default VisualizationEngine;
