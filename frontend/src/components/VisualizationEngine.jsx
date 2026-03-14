import React, { useState, useEffect, useMemo } from 'react';
import { Play, Pause, ChevronLeft, ChevronRight, RotateCcw } from 'lucide-react';
import GraphRenderer from './Renderers/GraphRenderer';
import ArrayRenderer from './Renderers/ArrayRenderer';

const VisualizationEngine = ({ dsl }) => {
    const [currentStep, setCurrentStep] = useState(0);
    const [isPlaying, setIsPlaying] = useState(false);

    const { meta, structure, structures = [], timeline, auxiliary_structures = [] } = dsl || {};
    const allStructures = structures.length > 0 ? structures : (structure ? [structure] : []);
    const totalSteps = timeline?.length || 0;

    // Accumulate labels across steps so they don't revert to original
    const accumulatedLabels = useMemo(() => {
        if (!timeline) return [];
        let labels = {};
        return timeline.map(step => {
            const updates = step?.state_changes?.update_labels || [];
            const newLabels = { ...labels };
            updates.forEach(u => newLabels[u.id] = u.label);
            labels = newLabels;
            return newLabels;
        });
    }, [timeline]);

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

    if (!dsl || (!structure && structures.length === 0) || !timeline) {
        return <div className="p-8 text-rose-500 flex items-center justify-center h-full text-xl font-light tracking-wide">Invalid JSON DSL structure provided.</div>;
    }

    const stepData = timeline[currentStep] || timeline[0];
    const { explanation } = stepData;
    const currentLabels = accumulatedLabels[currentStep] || {};

    const renderOneStructure = (struct) => {
        switch (struct.type) {
            case 'graph':
            case 'tree':
                return <GraphRenderer structure={struct} state={stepData} currentLabels={currentLabels} />;
            case 'array':
            case 'matrix':
            case 'stack':
            case 'memory':
                return <ArrayRenderer structure={struct} state={stepData} currentLabels={currentLabels} />;
            default:
                return <div className="text-slate-500 font-light tracking-widest uppercase">Type Not Supported</div>;
        }
    };

    const renderVisualization = () => {
        if (allStructures.length === 1) {
            return renderOneStructure(allStructures[0]);
        }

        return (
            <div className="flex w-full h-full gap-8 p-4">
                {allStructures.map((struct, idx) => (
                    <div key={struct.id || idx} className={`flex-1 flex flex-col items-center justify-center relative min-w-0 border border-white/[0.03] rounded-3xl bg-white/[0.01] p-4 shadow-inner`}>
                        <h4 className="absolute top-4 left-6 text-[10px] uppercase tracking-[0.3em] text-white/20 font-bold">{struct.id || struct.type}</h4>
                        {renderOneStructure(struct)}
                    </div>
                ))}
            </div>
        );
    };

    return (
        <div className="flex flex-col w-full h-full bg-[#050505] text-slate-200 relative overflow-hidden font-sans">

            {/* Top Section: Split Left & Right */}
            <div className="flex flex-1 min-h-0">
                {/* Left Column: Storyboard, Meta & Controls */}
                <div className="w-[450px] shrink-0 h-full flex flex-col p-10 border-r border-white/[0.05] bg-[#0a0a0a]/80 z-20 relative shadow-2xl overflow-hidden">

                    {/* Top: Title, Meta, Intro, IO */}
                    <div className="shrink-0 mb-6">
                        {/* Title & Meta Box */}
                        <div className="mb-4 p-4 rounded-2xl bg-white/[0.03] border border-white/[0.06] shadow-inner">
                        <h2 className="text-3xl font-light tracking-tight text-white/90 mb-3 drop-shadow-md">
                            {meta?.title || 'Visualization'}
                        </h2>
                        <div className="flex flex-wrap gap-3 text-[10px] tracking-[0.2em] uppercase text-white/40 font-medium mb-6">
                            <span>{meta?.category}</span>
                            <span className="opacity-50">•</span>
                            <span>{meta?.difficulty}</span>
                        </div>
                        {meta?.concept_introduction && (
                            <p className="text-sm text-slate-300 font-light leading-relaxed mb-2">
                                {meta.concept_introduction}
                            </p>
                        )}
                        {(meta?.input || meta?.output) && (
                            <div className="flex flex-col gap-3 mt-2 bg-white/[0.01] p-2 rounded-xl border border-white/[0.03]">
                                {meta?.input && (
                                    <div>
                                        <h4 className="text-[10px] uppercase tracking-widest text-emerald-500/80 font-bold mb-1">Input</h4>
                                        <p className="text-xs text-slate-400 font-mono break-words">{meta.input}</p>
                                    </div>
                                )}
                                {meta?.output && (
                                    <div className="mt-2 pt-2 border-t border-white/[0.04]">
                                        <h4 className="text-[10px] uppercase tracking-widest text-blue-500/80 font-bold mb-1">Output</h4>
                                        <p className="text-xs text-slate-400 font-mono break-words">{meta.output}</p>
                                    </div>
                                )}
                            </div>
                        )}
                        </div>
                    </div>

                    {/* Explanation: What Box */}
                    <div className="mb-4 p-4 rounded-2xl bg-white/[0.04] border border-white/[0.07] shadow-inner">
                        <h3 className="text-[13px] uppercase tracking-widest text-emerald-400/80 font-bold mb-2">What is happening?</h3>
                        <p className="text-xl leading-relaxed text-slate-200 font-light drop-shadow-sm transition-opacity duration-500">
                            {explanation?.what || "Initializing timeline..."}
                        </p>
                    </div>
                    {/* Explanation: Why Box */}
                    {explanation?.why && (
                        <div className="p-4 rounded-2xl bg-white/[0.04] border border-white/[0.07] shadow-inner">
                            <h3 className="text-[13px] uppercase tracking-widest text-emerald-400/80 font-bold mb-2 flex items-center gap-2">
                                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500/80"></span>
                                Why/Intuition
                            </h3>
                            <p className="text-sm leading-relaxed text-emerald-100/70 font-medium tracking-wide">
                                {explanation.why}
                            </p>
                        </div>
                    )}



                </div>

                {/* Right Column: Centered Mathematical Canvas */}
                <div className="flex-1 relative flex flex-col items-center justify-center z-0 transition-opacity duration-1000 ease-in-out p-12 min-h-0 overflow-hidden">
                    <div className="w-full h-full flex-1 flex items-center justify-center">
                        {renderVisualization()}
                    </div>
                    {/* Play Bar under visualization */}
                    <div className="w-full flex items-center justify-between gap-4 px-8 py-4 bg-white/[0.02] backdrop-blur-xl border border-white/[0.06] rounded-full shadow-lg mt-6">
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

            </div>

            {/* Bottom Section: Auxiliary Data Structures Panel (Full Width) */}
            {auxiliary_structures.length > 0 &&
                auxiliary_structures.some(aux => (currentLabels[aux.id] || aux.label)?.trim()) && (
                <div className="w-full shrink-0 flex flex-wrap gap-3 items-start justify-center p-2 pt-1 bg-transparent z-40 relative max-h-32 overflow-y-auto">
                    {auxiliary_structures.map(aux => {
                        const label = (currentLabels[aux.id] || aux.label)?.trim();
                        if (!label) return null;
                        return (
                            <div key={aux.id} className="rounded-xl px-3 py-2 min-w-[120px] max-w-xs bg-black/60 text-emerald-300 font-mono text-xs border border-emerald-900/30 shadow-none flex-1 text-center truncate">
                                <span className="uppercase tracking-widest text-white/40 font-bold mr-2">{aux.id.replace(/_/g, ' ')}:</span>
                                <span className="break-words">{label}</span>
                            </div>
                        );
                    })}
                </div>
            )}

        </div>
    );
};

export default VisualizationEngine;
