import React from 'react';

const ArrayRenderer = ({ structure, state, currentLabels = {} }) => {
    const { type, elements, frames, cells } = structure;
    const { activate = [], deactivate = [], update_labels = [] } = state?.state_changes || {};
    const { primary = [], secondary = [] } = state?.focus || {};

    // Unify Array / Stack / Memory representations
    let items = [];
    if (type === 'array') items = elements;
    if (type === 'stack') items = frames;
    if (type === 'memory') items = cells.map(c => ({ id: c.address, label: c.address, value: c.value }));

    const getLabel = (item) => {
        return currentLabels[item.id] || (item.value || item.label);
    };

    return (
        <div className={`p-8 w-full h-full flex items-center justify-center ${type === 'stack' ? 'flex-col justify-end' : 'flex-row'}`}>
            <div className={`flex gap-2 p-6 bg-slate-800 rounded-xl shadow-2xl border border-slate-700 ${type === 'stack' ? 'flex-col-reverse' : 'flex-wrap justify-center'}`}>
                {items.map((item, idx) => {
                    const isActive = activate.includes(item.id);
                    const isPrimary = primary.includes(item.id);
                    const isSecondary = secondary.includes(item.id);

                    let bgClass = 'bg-slate-900 border-slate-600';
                    let scaleClass = 'scale-100';

                    if (isPrimary) {
                        bgClass = 'bg-emerald-500 border-emerald-400 text-white shadow-[0_0_20px_rgba(16,185,129,0.5)]';
                        scaleClass = 'scale-110 z-10';
                    } else if (isSecondary) {
                        bgClass = 'bg-blue-500 border-blue-400 text-white';
                        scaleClass = 'scale-105 z-10';
                    } else if (isActive) {
                        bgClass = 'bg-amber-500 border-amber-400 text-slate-900';
                    }

                    const isDeactivated = deactivate.includes(item.id);

                    return (
                        <div
                            key={item.id}
                            className={`flex flex-col items-center justify-center min-w-[80px] h-20 px-4 rounded-lg border-2 transition-all duration-500 ease-in-out ${bgClass} ${scaleClass}`}
                            style={{ opacity: isDeactivated ? 0.1 : 1 }}
                        >
                            <span className="text-xs opacity-70 mb-1">{type === 'memory' ? item.id : idx}</span>
                            <span className="font-bold text-lg">{getLabel(item)}</span>
                        </div>
                    );
                })}
            </div>
        </div>
    );
}

export default ArrayRenderer;
