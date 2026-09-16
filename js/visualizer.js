class LockVisualizer {
  constructor() {
    this.tableContainerId = '#lock-table-viz';
    this.graphContainerId = '#wait-graph-viz';
    this.timelineContainerId = '#timeline-viz';
  }

  // Render the lock table as an animated SVG table
  renderLockTable(lockTable) {
    const container = d3.select(this.tableContainerId);
    container.selectAll('*').remove();
    
    const items = Object.keys(lockTable);
    if (items.length === 0) {
      container.append('div')
        .style('text-align', 'center')
        .style('padding', '20px')
        .style('color', 'var(--text-secondary)')
        .text('No data yet');
      return;
    }

    const width = container.node().getBoundingClientRect().width || 600;
    const rowHeight = 50;
    const headerHeight = 40;
    const height = headerHeight + items.length * rowHeight + 20;

    const svg = container.append('svg')
      .attr('width', '100%')
      .attr('height', height)
      .attr('viewBox', `0 0 ${width} ${height}`)
      .style('background', 'var(--bg-card)')
      .style('border-radius', '8px');

    // Headers
    const headers = ['Data Item', 'Lock Holders', 'Lock Type', 'Waiting Queue'];
    const colWidths = [0.15, 0.35, 0.2, 0.3];
    let currentX = 0;
    
    svg.append('g')
      .selectAll('text')
      .data(headers)
      .enter()
      .append('text')
      .attr('x', (d, i) => {
        let x = currentX;
        currentX += width * colWidths[i];
        return x + 10;
      })
      .attr('y', headerHeight / 2 + 5)
      .text(d => d)
      .style('font-weight', 'bold')
      .style('fill', 'var(--text-primary)');

    svg.append('line')
      .attr('x1', 0)
      .attr('y1', headerHeight)
      .attr('x2', width)
      .attr('y2', headerHeight)
      .style('stroke', 'var(--border-color)')
      .style('stroke-width', 2);

    // Rows
    const rows = svg.selectAll('.row')
      .data(items, d => d)
      .enter()
      .append('g')
      .attr('class', 'row')
      .attr('transform', (d, i) => `translate(0, ${headerHeight + i * rowHeight})`)
      .style('opacity', 0);

    rows.transition().duration(300).style('opacity', 1);

    // Columns for rows
    rows.each(function(d) {
      const g = d3.select(this);
      const rowData = lockTable[d];
      
      // Data Item
      g.append('text')
        .attr('x', 10)
        .attr('y', rowHeight / 2 + 5)
        .text(d)
        .style('fill', 'var(--text-primary)');

      // Lock Holders
      let holderStr = rowData.holders.map(h => h.txId).join(', ');
      g.append('text')
        .attr('x', width * colWidths[0] + 10)
        .attr('y', rowHeight / 2 + 5)
        .text(holderStr || '-')
        .style('fill', '#2196F3');

      // Lock Type
      let typeStr = Array.from(new Set(rowData.holders.map(h => h.lockType))).join(', ');
      g.append('text')
        .attr('x', width * (colWidths[0] + colWidths[1]) + 10)
        .attr('y', rowHeight / 2 + 5)
        .text(typeStr || '-')
        .style('fill', typeStr.includes('X') ? '#FF9800' : '#4CAF50');

      // Waiting Queue
      let queueStr = rowData.queue.map(q => `${q.txId}(${q.lockType})`).join(', ');
      g.append('text')
        .attr('x', width * (colWidths[0] + colWidths[1] + colWidths[2]) + 10)
        .attr('y', rowHeight / 2 + 5)
        .text(queueStr || '-')
        .style('fill', '#f44336');
        
      g.append('line')
        .attr('x1', 0)
        .attr('y1', rowHeight)
        .attr('x2', width)
        .attr('y2', rowHeight)
        .style('stroke', 'var(--border-color)')
        .style('stroke-width', 1);
    });
  }

  // Render the wait-for graph as a directed graph
  renderWaitForGraph(waitForGraph, deadlockedTxns = []) {
    const container = d3.select(this.graphContainerId);
    container.selectAll('*').remove();

    const nodesMap = new Map();
    const links = [];

    // Build nodes and links
    Object.keys(waitForGraph).forEach(source => {
      if (!nodesMap.has(source)) nodesMap.set(source, { id: source });
      waitForGraph[source].forEach(target => {
        if (!nodesMap.has(target)) nodesMap.set(target, { id: target });
        links.push({ source, target });
      });
    });
    
    // Add deadlocked but isolated nodes if any exist
    deadlockedTxns.forEach(tx => {
      if (!nodesMap.has(tx)) nodesMap.set(tx, { id: tx });
    });

    const nodes = Array.from(nodesMap.values());

    if (nodes.length === 0) {
      container.append('div')
        .style('text-align', 'center')
        .style('padding', '20px')
        .style('color', 'var(--text-secondary)')
        .text('No active waits');
      return;
    }

    const width = container.node().getBoundingClientRect().width || 600;
    const height = 400;

    const svg = container.append('svg')
      .attr('width', '100%')
      .attr('height', height)
      .attr('viewBox', `0 0 ${width} ${height}`);

    // Arrow markers
    svg.append('defs').append('marker')
      .attr('id', 'arrow-normal')
      .attr('viewBox', '0 -5 10 10')
      .attr('refX', 20)
      .attr('refY', 0)
      .attr('markerWidth', 6)
      .attr('markerHeight', 6)
      .attr('orient', 'auto')
      .append('path')
      .attr('d', 'M0,-5L10,0L0,5')
      .attr('fill', '#666');

    svg.append('defs').append('marker')
      .attr('id', 'arrow-deadlock')
      .attr('viewBox', '0 -5 10 10')
      .attr('refX', 20)
      .attr('refY', 0)
      .attr('markerWidth', 6)
      .attr('markerHeight', 6)
      .attr('orient', 'auto')
      .append('path')
      .attr('d', 'M0,-5L10,0L0,5')
      .attr('fill', '#f44336');

    const simulation = d3.forceSimulation(nodes)
      .force('link', d3.forceLink(links).id(d => d.id).distance(100))
      .force('charge', d3.forceManyBody().strength(-300))
      .force('center', d3.forceCenter(width / 2, height / 2));

    const link = svg.append('g')
      .selectAll('line')
      .data(links)
      .enter().append('line')
      .attr('stroke', d => (deadlockedTxns.includes(d.source.id) && deadlockedTxns.includes(d.target.id)) ? '#f44336' : '#666')
      .attr('stroke-width', d => (deadlockedTxns.includes(d.source.id) && deadlockedTxns.includes(d.target.id)) ? 3 : 2)
      .attr('marker-end', d => (deadlockedTxns.includes(d.source.id) && deadlockedTxns.includes(d.target.id)) ? 'url(#arrow-deadlock)' : 'url(#arrow-normal)');

    const node = svg.append('g')
      .selectAll('circle')
      .data(nodes)
      .enter().append('circle')
      .attr('r', 15)
      .attr('fill', d => deadlockedTxns.includes(d.id) ? '#f44336' : '#2196F3');
      
    // Pulse animation for deadlocked nodes
    if (deadlockedTxns.length > 0) {
      function pulse() {
        node.filter(d => deadlockedTxns.includes(d.id))
          .transition().duration(500)
          .attr('r', 20)
          .transition().duration(500)
          .attr('r', 15)
          .on('end', pulse);
      }
      pulse();
    }

    const labels = svg.append('g')
      .selectAll('text')
      .data(nodes)
      .enter().append('text')
      .text(d => d.id)
      .attr('text-anchor', 'middle')
      .attr('dy', 5)
      .attr('fill', 'white')
      .style('font-size', '12px');

    simulation.on('tick', () => {
      link
        .attr('x1', d => d.source.x)
        .attr('y1', d => d.source.y)
        .attr('x2', d => d.target.x)
        .attr('y2', d => d.target.y);

      node
        .attr('cx', d => d.x = Math.max(15, Math.min(width - 15, d.x)))
        .attr('cy', d => d.y = Math.max(15, Math.min(height - 15, d.y)));

      labels
        .attr('x', d => d.x)
        .attr('y', d => d.y);
    });
  }

  // Render a timeline
  renderTimeline(timeline) {
    const container = d3.select(this.timelineContainerId);
    container.selectAll('*').remove();

    if (!timeline || timeline.length === 0) {
      container.append('div')
        .style('text-align', 'center')
        .style('padding', '20px')
        .style('color', 'var(--text-secondary)')
        .text('No events recorded');
      return;
    }

    const txns = Array.from(new Set(timeline.map(t => t.txId))).sort();
    const maxStep = d3.max(timeline, d => d.stepNumber) || 1;

    const margin = { top: 20, right: 20, bottom: 30, left: 50 };
    const width = (container.node().getBoundingClientRect().width || 600) - margin.left - margin.right;
    const height = txns.length * 40 + margin.top + margin.bottom;

    const svg = container.append('svg')
      .attr('width', width + margin.left + margin.right)
      .attr('height', height)
      .append('g')
      .attr('transform', `translate(${margin.left},${margin.top})`);

    const y = d3.scaleBand()
      .domain(txns)
      .range([0, height - margin.top - margin.bottom])
      .padding(0.2);

    const x = d3.scaleLinear()
      .domain([0, maxStep + 1])
      .range([0, width]);

    // Axes
    svg.append('g')
      .attr('transform', `translate(0,${height - margin.top - margin.bottom})`)
      .call(d3.axisBottom(x).ticks(maxStep + 1).tickFormat(d => (d % 1 === 0 ? d : '')))
      .selectAll('text')
      .style('fill', 'var(--text-secondary)');

    svg.append('g')
      .call(d3.axisLeft(y))
      .selectAll('text')
      .style('fill', 'var(--text-primary)');

    // Helper to get color
    const getColor = (result) => {
      switch (result) {
        case 'granted': return '#4CAF50';
        case 'waiting': return '#FF9800';
        case 'deadlock': return '#f44336';
        case 'released': return '#9e9e9e';
        case 'committed': return '#2196F3';
        default: return '#607d8b';
      }
    };

    // Bars
    const barHeight = y.bandwidth();
    const bars = svg.selectAll('.timeline-bar')
      .data(timeline)
      .enter()
      .append('g');

    bars.append('rect')
      .attr('x', d => x(d.stepNumber) - x(1)/2)
      .attr('y', d => y(d.txId))
      .attr('width', x(1))
      .attr('height', barHeight)
      .attr('fill', d => getColor(d.result))
      .attr('rx', 3)
      .style('opacity', 0)
      .transition()
      .duration(300)
      .style('opacity', 0.8);

    bars.append('text')
      .attr('x', d => x(d.stepNumber))
      .attr('y', d => y(d.txId) + barHeight / 2 + 4)
      .text(d => d.item || '')
      .attr('text-anchor', 'middle')
      .attr('fill', 'white')
      .style('font-size', '10px')
      .style('pointer-events', 'none');
  }

  clearAll() {
    d3.select(this.tableContainerId).selectAll('*').remove();
    d3.select(this.graphContainerId).selectAll('*').remove();
    d3.select(this.timelineContainerId).selectAll('*').remove();
  }
}

window.LockVisualizer = LockVisualizer;
