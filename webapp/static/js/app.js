/* MiroFish Strategy Simulator — Shared JS Utilities */

async function api(path, method = 'GET', body = null) {
    const opts = { method, headers: { 'Content-Type': 'application/json' } };
    if (body) opts.body = JSON.stringify(body);
    try {
        const r = await fetch(path, opts);
        return await r.json();
    } catch (e) {
        return { success: false, error: e.message };
    }
}

function escapeHtml(str) {
    if (!str) return '';
    const div = document.createElement('div');
    div.textContent = str;
    return div.innerHTML;
}

/* Color palette for agents */
const AGENT_COLORS = [
    '#3b82f6', '#ef4444', '#10b981', '#f59e0b', '#8b5cf6',
    '#ec4899', '#06b6d4', '#f97316', '#14b8a6', '#6366f1',
    '#84cc16', '#e11d48', '#0ea5e9', '#d946ef', '#facc15',
    '#22d3ee', '#a855f7', '#fb923c', '#4ade80', '#f43f5e',
];

function agentColor(index) {
    return AGENT_COLORS[index % AGENT_COLORS.length];
}

/* Chart.js defaults */
if (typeof Chart !== 'undefined') {
    Chart.defaults.font.family = "'Inter', sans-serif";
    Chart.defaults.font.size = 12;
    Chart.defaults.color = '#94a3b8';
    Chart.defaults.plugins.legend.labels.usePointStyle = true;
    Chart.defaults.plugins.legend.labels.padding = 16;
    Chart.defaults.responsive = true;
    Chart.defaults.maintainAspectRatio = false;
}

/* D3 Force-directed network graph */
function renderNetworkGraph(container, data, width, height) {
    const svg = d3.select(container).append('svg')
        .attr('width', width).attr('height', height)
        .attr('viewBox', [0, 0, width, height]);

    if (!data.nodes || data.nodes.length === 0) {
        svg.append('text').attr('x', width/2).attr('y', height/2)
            .attr('text-anchor', 'middle').attr('fill', '#64748b')
            .text('No network data available');
        return;
    }

    const maxDegree = Math.max(...data.nodes.map(n => n.degree || 1), 1);
    const maxWeight = Math.max(...data.edges.map(e => e.weight || 1), 1);

    const simulation = d3.forceSimulation(data.nodes)
        .force('link', d3.forceLink(data.edges).id(d => d.id).distance(100).strength(0.5))
        .force('charge', d3.forceManyBody().strength(-200))
        .force('center', d3.forceCenter(width / 2, height / 2))
        .force('collision', d3.forceCollide().radius(30));

    // Arrows
    svg.append('defs').selectAll('marker')
        .data(['arrow']).enter().append('marker')
        .attr('id', d => d).attr('viewBox', '0 -5 10 10')
        .attr('refX', 25).attr('refY', 0)
        .attr('markerWidth', 6).attr('markerHeight', 6)
        .attr('orient', 'auto')
        .append('path').attr('d', 'M0,-5L10,0L0,5')
        .attr('fill', '#475569');

    const link = svg.append('g').selectAll('line')
        .data(data.edges).enter().append('line')
        .attr('stroke', '#475569')
        .attr('stroke-opacity', 0.6)
        .attr('stroke-width', d => Math.max(1, (d.weight / maxWeight) * 4))
        .attr('marker-end', 'url(#arrow)');

    const node = svg.append('g').selectAll('g')
        .data(data.nodes).enter().append('g')
        .call(d3.drag()
            .on('start', (event, d) => { if (!event.active) simulation.alphaTarget(0.3).restart(); d.fx = d.x; d.fy = d.y; })
            .on('drag', (event, d) => { d.fx = event.x; d.fy = event.y; })
            .on('end', (event, d) => { if (!event.active) simulation.alphaTarget(0); d.fx = null; d.fy = null; })
        );

    node.append('circle')
        .attr('r', d => 8 + ((d.degree || 0) / maxDegree) * 16)
        .attr('fill', (d, i) => agentColor(i))
        .attr('stroke', '#1e293b').attr('stroke-width', 2);

    node.append('text')
        .text(d => {
            const label = d.label || d.id;
            return label.length > 20 ? label.slice(0, 20) + '...' : label;
        })
        .attr('dx', 16).attr('dy', 4)
        .attr('fill', '#e2e8f0').attr('font-size', '11px')
        .attr('pointer-events', 'none');

    // Tooltip
    const tooltip = d3.select(container).append('div')
        .attr('class', 'tooltip').style('opacity', 0);

    node.on('mouseover', (event, d) => {
        tooltip.transition().duration(200).style('opacity', 1);
        tooltip.html(`<strong>${d.label || d.id}</strong><br>Connections: ${d.degree || 0}`)
            .style('left', (event.offsetX + 10) + 'px')
            .style('top', (event.offsetY - 10) + 'px');
    }).on('mouseout', () => {
        tooltip.transition().duration(500).style('opacity', 0);
    });

    simulation.on('tick', () => {
        link.attr('x1', d => d.source.x).attr('y1', d => d.source.y)
            .attr('x2', d => d.target.x).attr('y2', d => d.target.y);
        node.attr('transform', d => `translate(${d.x},${d.y})`);
    });

    return simulation;
}

/* Render heatmap with D3 */
function renderHeatmap(container, heatmapData, totalRounds) {
    const el = document.querySelector(container);
    if (!el) return;
    el.innerHTML = '';

    let agents = Object.entries(heatmapData);
    if (agents.length === 0) {
        el.innerHTML = '<p class="muted">No heatmap data available</p>';
        return;
    }

    // Sort by total activity and limit to top 25
    agents.sort((a, b) => {
        const totalA = Object.values(a[1].rounds).reduce((s, r) => s + r.action_count, 0);
        const totalB = Object.values(b[1].rounds).reduce((s, r) => s + r.action_count, 0);
        return totalB - totalA;
    });
    if (agents.length > 25) agents = agents.slice(0, 25);

    const margin = {top: 30, right: 30, bottom: 60, left: 160};
    const cellSize = 28;
    const width = margin.left + margin.right + totalRounds * cellSize;
    const height = margin.top + margin.bottom + agents.length * cellSize;

    const svg = d3.select(container).append('svg')
        .attr('width', width).attr('height', height);

    const rounds = Array.from({length: totalRounds}, (_, i) => i);
    const agentNames = agents.map(([, info]) => info.name);

    // Find max intensity
    let maxIntensity = 1;
    agents.forEach(([, info]) => {
        Object.values(info.rounds).forEach(r => {
            if (r.action_count > maxIntensity) maxIntensity = r.action_count;
        });
    });

    const colorScale = d3.scaleSequential(d3.interpolateYlOrRd).domain([0, maxIntensity]);

    // X axis
    svg.append('g').attr('transform', `translate(${margin.left}, ${margin.top})`)
        .selectAll('text').data(rounds).enter().append('text')
        .attr('x', (d, i) => i * cellSize + cellSize / 2)
        .attr('y', -8).attr('text-anchor', 'middle').attr('fill', '#94a3b8')
        .attr('font-size', '10px').text(d => `R${d}`);

    // Y axis
    svg.append('g').attr('transform', `translate(${margin.left - 8}, ${margin.top})`)
        .selectAll('text').data(agentNames).enter().append('text')
        .attr('x', 0).attr('y', (d, i) => i * cellSize + cellSize / 2 + 4)
        .attr('text-anchor', 'end').attr('fill', '#e2e8f0')
        .attr('font-size', '11px').text(d => d.length > 18 ? d.slice(0, 18) + '…' : d);

    // Cells
    const g = svg.append('g').attr('transform', `translate(${margin.left}, ${margin.top})`);
    agents.forEach(([aid, info], rowIdx) => {
        rounds.forEach(rnum => {
            const rd = info.rounds[String(rnum)];
            const count = rd ? rd.action_count : 0;
            g.append('rect')
                .attr('x', rnum * cellSize).attr('y', rowIdx * cellSize)
                .attr('width', cellSize - 2).attr('height', cellSize - 2)
                .attr('rx', 3)
                .attr('fill', count > 0 ? colorScale(count) : '#1e293b')
                .attr('stroke', '#0f172a').attr('stroke-width', 1)
                .append('title').text(`${info.name} | Round ${rnum}: ${count} actions`);
        });
    });

    // Legend
    const legendWidth = 200;
    const legendG = svg.append('g').attr('transform', `translate(${margin.left}, ${height - 25})`);
    const legendScale = d3.scaleLinear().domain([0, maxIntensity]).range([0, legendWidth]);
    const legendAxis = d3.axisBottom(legendScale).ticks(5).tickSize(6);
    const defs = svg.append('defs');
    const gradient = defs.append('linearGradient').attr('id', 'heatmap-gradient');
    gradient.append('stop').attr('offset', '0%').attr('stop-color', colorScale(0));
    gradient.append('stop').attr('offset', '100%').attr('stop-color', colorScale(maxIntensity));
    legendG.append('rect').attr('width', legendWidth).attr('height', 12).attr('fill', 'url(#heatmap-gradient)').attr('rx', 2);
    legendG.append('g').attr('transform', 'translate(0,12)').call(legendAxis)
        .selectAll('text').attr('fill', '#94a3b8').attr('font-size', '9px');
    legendG.append('text').attr('x', legendWidth + 10).attr('y', 10).attr('fill', '#94a3b8').attr('font-size', '10px').text('actions');
}
