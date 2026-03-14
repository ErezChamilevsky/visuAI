import React, { useRef, useState, useEffect } from 'react';
import { LiveProvider, LivePreview, LiveError } from 'react-live';
import VisualizationEngine from './VisualizationEngine';

const scope = { React, useState, useEffect };

const Visualizer = ({ algorithm }) => {
    const containerRef = useRef(null);

    if (!algorithm) return null;

    if (algorithm.schemaType === 'dsl' && algorithm.dsl) {
        return <VisualizationEngine dsl={algorithm.dsl} />;
    }

    if (!algorithm.componentCode) return null;

    return (
        <div className="flex-1 flex flex-col h-full bg-slate-900 overflow-hidden" ref={containerRef}>
            <div className="bg-slate-950 px-6 py-3 border-b border-slate-800 flex items-center justify-between shrink-0">
                <div>
                    <h2 className="text-xl font-bold text-slate-100">{algorithm.title}</h2>
                    <p className="text-sm text-slate-400 mt-1">{algorithm.description}</p>
                </div>
            </div>

            <div className="flex-1 flex flex-col overflow-hidden relative">
                <LiveProvider code={algorithm.componentCode} scope={scope} noInline={false}>
                    <div className="absolute inset-0 w-full h-full flex flex-col overflow-hidden">
                        <LivePreview className="w-full h-full font-sans visualizer-theme block overflow-hidden" />
                        <LiveError className="absolute bottom-4 left-4 right-4 z-50 text-rose-500 bg-rose-50 p-4 rounded-lg font-mono text-sm whitespace-pre-wrap shadow-lg border border-rose-200 max-h-[50%] overflow-y-auto" />
                    </div>
                </LiveProvider>
            </div>

            <style dangerouslySetInnerHTML={{
                __html: `
        .visualizer-theme {
          --viz-primary: #14b8a6;
          --viz-highlight: #fef08a;
          --viz-text: #334155;
        }
      `}} />
        </div>
    );
};

export default Visualizer;
