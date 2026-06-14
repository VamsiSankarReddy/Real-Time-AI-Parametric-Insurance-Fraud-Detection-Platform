import { useMemo } from 'react';

function colorByRisk(risk) {
  if (risk >= 90) {
    return '#ef4444';
  }
  if (risk >= 60) {
    return '#f59e0b';
  }
  return '#10b981';
}

export default function FraudGraph({ graph }) {
  const layout = useMemo(() => {
    const ipNodes = graph.nodes.filter((n) => n.type === 'ip');
    const userNodes = graph.nodes.filter((n) => n.type === 'user');

    const width = 980;
    const height = 320;
    const centerX = width / 2;
    const centerY = height / 2;

    const points = {};

    ipNodes.forEach((node, index) => {
      const angle = (2 * Math.PI * index) / Math.max(ipNodes.length, 1);
      points[node.id] = {
        x: centerX + 160 * Math.cos(angle),
        y: centerY + 100 * Math.sin(angle)
      };
    });

    userNodes.forEach((node, index) => {
      const angle = (2 * Math.PI * index) / Math.max(userNodes.length, 1);
      points[node.id] = {
        x: centerX + 320 * Math.cos(angle),
        y: centerY + 135 * Math.sin(angle)
      };
    });

    return { points, width, height };
  }, [graph]);

  return (
    <section className="glass-panel card-animate rounded-2xl p-5">
      <div className="mb-4 flex items-center justify-between">
        <h2 className="text-xl font-bold">Fraud Ring Graph</h2>
        <span className="font-mono text-xs text-slate-600">User-IP correlation map</span>
      </div>

      {graph.nodes.length === 0 ? (
        <p className="text-sm text-slate-600">No risky edges yet. Trigger attacker simulation to populate graph.</p>
      ) : (
        <div className="overflow-x-auto">
          <svg width={layout.width} height={layout.height} className="w-full min-w-[980px] rounded-xl bg-slate-50 p-2">
            {graph.edges.map((edge, idx) => {
              const source = layout.points[edge.source];
              const target = layout.points[edge.target];
              if (!source || !target) {
                return null;
              }
              return (
                <line
                  key={`${edge.source}-${edge.target}-${idx}`}
                  x1={source.x}
                  y1={source.y}
                  x2={target.x}
                  y2={target.y}
                  stroke={edge.status === 'fraud_flagged' ? '#ef4444' : '#94a3b8'}
                  strokeWidth={edge.status === 'fraud_flagged' ? 2.5 : 1.4}
                  opacity="0.8"
                />
              );
            })}

            {graph.nodes.map((node) => {
              const point = layout.points[node.id];
              if (!point) {
                return null;
              }
              return (
                <g key={node.id}>
                  <circle cx={point.x} cy={point.y} r={node.type === 'ip' ? 11 : 8} fill={colorByRisk(node.risk)} />
                  <text x={point.x + 12} y={point.y + 4} fontSize="11" fill="#0f172a">
                    {node.label}
                  </text>
                </g>
              );
            })}
          </svg>
        </div>
      )}
    </section>
  );
}
