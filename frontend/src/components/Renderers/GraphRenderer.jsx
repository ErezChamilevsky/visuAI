import React, { useMemo } from 'react';

const GraphRenderer = ({ structure, state, currentLabels = {} }) => {
    const { type, nodes, edges, root } = structure;
    const { activate = [], deactivate = [], update_labels = [], emphasize_edges = [] } = state?.state_changes || {};
    const { primary = [], secondary = [] } = state?.focus || {};

    // Compute Layout
    const layout = useMemo(() => {
        const pos = {};
        const width = 800;
        const height = 600;

        if (type === 'tree') {
            // Simple Hierarchical layout
            const levels = {};
            const childrenMap = {};
            edges.forEach(e => {
                if (!childrenMap[e.parent]) childrenMap[e.parent] = [];
                childrenMap[e.parent].push(e.child);
            });

            const traverse = (nodeId, depth) => {
                if (!levels[depth]) levels[depth] = [];
                levels[depth].push(nodeId);
                (childrenMap[nodeId] || []).forEach(child => traverse(child, depth + 1));
            };

            if (root) traverse(root, 0);

            const maxDepth = Object.keys(levels).length;
            Object.entries(levels).forEach(([depthStr, nodeIds]) => {
                const depth = parseInt(depthStr);
                const y = 100 + depth * (400 / (maxDepth || 1));
                nodeIds.forEach((id, idx) => {
                    const x = (width / (nodeIds.length + 1)) * (idx + 1);
                    pos[id] = { x, y };
                });
            });

            // Fallback for isolated nodes
            nodes.forEach((n, idx) => {
                if (!pos[n.id]) pos[n.id] = { x: 50 + (idx * 50) % width, y: 50 + Math.floor((idx * 50) / width) * 50 };
            });

        } else {
            // Circular layout for generic graphs
            const cx = width / 2;
            const cy = height / 2;
            const radius = 200;
            nodes.forEach((n, idx) => {
                const angle = (2 * Math.PI * idx) / nodes.length;
                pos[n.id] = {
                    x: cx + radius * Math.cos(angle),
                    y: cy + radius * Math.sin(angle)
                };
            });
        }
        return pos;
    }, [structure]);

    // Handle edge drawing
    const renderedEdges = edges.map((e, idx) => {
        const fromId = e.from || e.parent;
        const toId = e.to || e.child;
        const p1 = layout[fromId];
        const p2 = layout[toId];
        if (!p1 || !p2) return null;

        const isEmphasized = emphasize_edges.some(em => (em.from === fromId && em.to === toId) || (em.parent === fromId && em.child === toId));

        const isDeactivated = deactivate.includes(fromId) || deactivate.includes(toId);

        return (
            <g key={`edge-${idx}`} style={{ opacity: isDeactivated ? 0.1 : 1, transition: 'opacity 0.5s ease-in-out' }}>
                <line
                    x1={p1.x} y1={p1.y}
                    x2={p2.x} y2={p2.y}
                    stroke={isEmphasized ? '#f59e0b' : '#475569'}
                    strokeWidth={isEmphasized ? 5 : 2}
                    className="transition-all duration-500 ease-in-out"
                />
                {e.weight && (
                    <text
                        x={(p1.x + p2.x) / 2}
                        y={(p1.y + p2.y) / 2 - 10}
                        fill="#94a3b8"
                        fontSize="14"
                        textAnchor="middle"
                    >
                        {e.weight}
                    </text>
                )}
            </g>
        );
    });

    const getLabel = (node) => {
        return currentLabels[node.id] || node.label;
    };

    const renderedNodes = nodes.map(n => {
        const pos = layout[n.id];
        if (!pos) return null;

        const isActive = activate.includes(n.id);
        const isPrimary = primary.includes(n.id);
        const isSecondary = secondary.includes(n.id);

        // Styling logic
        let fill = '#1e293b'; // slate-800
        let stroke = '#475569'; // slate-600
        let scale = 1;

        if (isPrimary) {
            fill = '#10b981'; // emerald-500
            stroke = '#059669'; // emerald-600
            scale = 1.2;
        } else if (isSecondary) {
            fill = '#3b82f6'; // blue-500
            stroke = '#2563eb'; // blue-600
            scale = 1.1;
        } else if (isActive) {
            fill = '#f59e0b'; // amber-500
            stroke = '#d97706'; // amber-600
        }

        const isDeactivated = deactivate.includes(n.id);

        return (
            <g
                key={`node-${n.id}`}
                style={{
                    transform: `translate(${pos.x}px, ${pos.y}px) scale(${scale})`,
                    transition: 'all 0.5s ease-in-out',
                    opacity: isDeactivated ? 0.1 : 1
                }}
            >
                <circle
                    cx={0} cy={0} r={24}
                    fill={fill}
                    stroke={stroke}
                    strokeWidth={3}
                    className="shadow-xl"
                />
                <text
                    x={0} y={5}
                    fill="white"
                    fontSize="14"
                    fontWeight="bold"
                    textAnchor="middle"
                    className="transition-all duration-300"
                >
                    {getLabel(n)}
                </text>
            </g>
        );
    });

    return (
        <svg width="100%" height="100%" viewBox="0 0 800 600" preserveAspectRatio="xMidYMid meet" className="drop-shadow-lg">
            <defs>
                <marker id="arrow" viewBox="0 0 10 10" refX="28" refY="5" markerWidth="6" markerHeight="6" orient="auto-start-reverse">
                    <path d="M 0 0 L 10 5 L 0 10 z" fill="#475569" />
                </marker>
                <marker id="arrow-emphasized" viewBox="0 0 10 10" refX="28" refY="5" markerWidth="6" markerHeight="6" orient="auto-start-reverse">
                    <path d="M 0 0 L 10 5 L 0 10 z" fill="#f59e0b" />
                </marker>
            </defs>
            {renderedEdges}
            {renderedNodes}
        </svg>
    );
};

export default GraphRenderer;
