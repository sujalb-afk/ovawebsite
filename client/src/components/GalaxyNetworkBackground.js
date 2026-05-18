import React from 'react';

/**
 * Subtle connected network pattern for light backgrounds.
 * Light gray lines with soft pastel nodes (teal, blue, yellow, pink, green).
 * Matches reference: clean, minimal, connectivity theme.
 */
function GalaxyNetworkBackground({ variant = 'hero' }) {
  const nodes = [
    { cx: 5, cy: 12, r: 1.2 }, { cx: 18, cy: 8, r: 1 }, { cx: 32, cy: 15, r: 1.4 },
    { cx: 45, cy: 5, r: 1 }, { cx: 55, cy: 22, r: 1.2 }, { cx: 72, cy: 10, r: 1 },
    { cx: 85, cy: 18, r: 1.4 }, { cx: 92, cy: 35, r: 1 }, { cx: 8, cy: 35, r: 1 },
    { cx: 22, cy: 42, r: 1.2 }, { cx: 38, cy: 38, r: 1 }, { cx: 52, cy: 45, r: 1.4 },
    { cx: 68, cy: 40, r: 1 }, { cx: 78, cy: 52, r: 1.2 }, { cx: 15, cy: 58, r: 1 },
    { cx: 28, cy: 65, r: 1.2 }, { cx: 48, cy: 62, r: 1 }, { cx: 62, cy: 70, r: 1.4 },
    { cx: 88, cy: 65, r: 1 }, { cx: 12, cy: 78, r: 1.2 }, { cx: 35, cy: 82, r: 1 },
    { cx: 58, cy: 85, r: 1.2 }, { cx: 75, cy: 78, r: 1 }, { cx: 95, cy: 88, r: 1 },
    { cx: 42, cy: 28, r: 1 }, { cx: 65, cy: 55, r: 1.2 }, { cx: 25, cy: 72, r: 1 },
  ];

  const connections = [
    [0, 1], [1, 2], [2, 3], [3, 4], [4, 5], [5, 6], [6, 7],
    [0, 8], [8, 9], [9, 10], [10, 11], [11, 12], [12, 6],
    [8, 14], [9, 15], [10, 16], [11, 17], [12, 13],
    [14, 15], [15, 16], [16, 17], [17, 13],
    [14, 19], [15, 20], [16, 21], [17, 22], [13, 23],
    [19, 20], [20, 21], [21, 22], [22, 23],
    [1, 9], [2, 10], [3, 11], [4, 12], [24, 2], [24, 10], [25, 16], [25, 22],
  ];

  const isLight = variant === 'section';
  const lineColor = isLight ? 'rgba(180, 195, 185, 0.5)' : 'rgba(255, 255, 255, 0.5)';
  const nodeColors = isLight
    ? ['#81c784', '#4db6ac', '#90caf9', '#fff59d', '#f48fb1', '#a5d6a7', '#c8e6c9']
    : ['rgba(255,255,255,0.7)', 'rgba(200,230,201,0.75)', 'rgba(165,214,167,0.7)'];

  return (
    <svg
      className={`galaxy-network-bg galaxy-network-bg--${variant}`}
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 100 100"
      preserveAspectRatio="xMidYMid slice"
      aria-hidden="true"
    >
      <g stroke={lineColor} strokeWidth="0.15">
        {connections.map(([a, b], i) => (
          <line key={`line-${i}`} x1={nodes[a].cx} y1={nodes[a].cy} x2={nodes[b].cx} y2={nodes[b].cy} />
        ))}
      </g>
      <g>
        {nodes.map((node, i) => (
          <circle key={`node-${i}`} cx={node.cx} cy={node.cy} r={node.r} fill={nodeColors[i % nodeColors.length]} />
        ))}
      </g>
    </svg>
  );
}

export default GalaxyNetworkBackground;
