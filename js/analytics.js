/**
 * analytics.js — Analytics Dashboard
 * Shows simulation statistics from localStorage history.
 * Uses D3.js (already loaded) for charts.
 */
class AnalyticsDashboard {
  constructor() {}

  render() {
    return `
    <div class="analytics-section">

      <!-- Summary Stats Cards -->
      <div class="analytics-stats-grid" id="analytics-stats">
        <div class="stat-card">
          <div class="stat-icon"><i class="fas fa-play-circle"></i></div>
          <div class="stat-value" id="stat-total-sims">0</div>
          <div class="stat-label">Total Simulations</div>
        </div>
        <div class="stat-card">
          <div class="stat-icon" style="color:var(--accent-danger);"><i class="fas fa-skull-crossbones"></i></div>
          <div class="stat-value" id="stat-deadlock-rate">0%</div>
          <div class="stat-label">Deadlock Rate</div>
        </div>
        <div class="stat-card">
          <div class="stat-icon" style="color:var(--accent-success);"><i class="fas fa-check-circle"></i></div>
          <div class="stat-value" id="stat-success-count">0</div>
          <div class="stat-label">Successful Runs</div>
        </div>
        <div class="stat-card">
          <div class="stat-icon" style="color:var(--accent-warning);"><i class="fas fa-layer-group"></i></div>
          <div class="stat-value" id="stat-avg-steps">0</div>
          <div class="stat-label">Avg Steps / Run</div>
        </div>
      </div>

      <!-- Charts Row -->
      <div class="analytics-charts-grid">
        <div class="analytics-chart-card">
          <h3><i class="fas fa-chart-pie"></i> Simulation Results</h3>
          <div id="chart-results" class="chart-container"></div>
        </div>
        <div class="analytics-chart-card">
          <h3><i class="fas fa-chart-bar"></i> Protocol Usage</h3>
          <div id="chart-protocols" class="chart-container"></div>
        </div>
      </div>

      <!-- Recent Activity -->
      <div class="analytics-chart-card" style="margin-top:24px;">
        <h3><i class="fas fa-clock-rotate-left"></i> Recent Simulations</h3>
        <div id="analytics-recent-list" class="analytics-recent"></div>
      </div>

      <!-- No Data Message -->
      <div id="analytics-no-data" class="analytics-no-data" style="display:none;">
        <i class="fas fa-chart-line"></i>
        <h3>No Data Yet</h3>
        <p>Run some simulations in the Simulator tab to see analytics here!</p>
      </div>
    </div>
    `;
  }

  /** Refresh all analytics from SQLite database via API */
  async refresh() {
    const noData = document.getElementById('analytics-no-data');

    try {
      // Try API first (SQLite backend)
      const resp = await fetch('/api/analytics');
      if (!resp.ok) throw new Error('API error');
      const data = await resp.json();

      if (data.total === 0) {
        if (noData) noData.style.display = 'block';
        document.querySelectorAll('.analytics-stats-grid, .analytics-charts-grid, .analytics-chart-card').forEach(el => {
          if (!el.id?.includes('no-data')) el.style.opacity = '0.3';
        });
        return;
      }
      if (noData) noData.style.display = 'none';
      document.querySelectorAll('.analytics-stats-grid, .analytics-charts-grid, .analytics-chart-card').forEach(el => {
        el.style.opacity = '1';
      });

      // Update stat cards
      this._setText('stat-total-sims', data.total);
      this._setText('stat-deadlock-rate', `${data.deadlockRate}%`);
      this._setText('stat-success-count', data.successes);
      this._setText('stat-avg-steps', data.avgSteps);

      // Draw charts
      this._drawResultsPie(data.successes, data.deadlocks);
      this._drawProtocolBar(data.protocolCounts);
      this._drawRecentList(data.recent || []);

    } catch (e) {
      // Fallback: use localStorage via historyManager
      const historyManager = window.app?.historyManager;
      if (!historyManager) return;

      const entries = await historyManager.getAll();

      if (entries.length === 0) {
        if (noData) noData.style.display = 'block';
        return;
      }
      if (noData) noData.style.display = 'none';
      document.querySelectorAll('.analytics-stats-grid, .analytics-charts-grid, .analytics-chart-card').forEach(el => {
        el.style.opacity = '1';
      });

      const total = entries.length;
      const deadlocks = entries.filter(e => e.isDeadlocked || (e.result && e.result.includes('Deadlock'))).length;
      const successes = total - deadlocks;
      const totalSteps = entries.reduce((sum, e) => sum + (e.totalSteps || e.steps?.length || 0), 0);
      const avgSteps = total > 0 ? (totalSteps / total).toFixed(1) : 0;
      const deadlockRate = total > 0 ? ((deadlocks / total) * 100).toFixed(0) : 0;

      this._setText('stat-total-sims', total);
      this._setText('stat-deadlock-rate', `${deadlockRate}%`);
      this._setText('stat-success-count', successes);
      this._setText('stat-avg-steps', avgSteps);

      const protocolCounts = {};
      entries.forEach(e => {
        const p = e.protocol || e.protocolKey || 'Unknown';
        protocolCounts[p] = (protocolCounts[p] || 0) + 1;
      });

      this._drawResultsPie(successes, deadlocks);
      this._drawProtocolBar(protocolCounts);
      this._drawRecentList(entries.slice(0, 10));
    }
  }

  _setText(id, val) {
    const el = document.getElementById(id);
    if (el) el.textContent = val;
  }

  /** Draw pie chart for results using D3 */
  _drawResultsPie(successes, deadlocks) {
    const container = document.getElementById('chart-results');
    if (!container || typeof d3 === 'undefined') return;
    container.innerHTML = '';

    const total = successes + deadlocks;
    if (total === 0) {
      container.innerHTML = '<p style="text-align:center;color:var(--text-muted);">No data</p>';
      return;
    }

    const width = 260, height = 220, radius = 80;
    const svg = d3.select(container).append('svg')
      .attr('width', width).attr('height', height)
      .append('g').attr('transform', `translate(${width / 2},${height / 2})`);

    const data = [
      { label: 'Completed', value: successes, color: '#4CAF50' },
      { label: 'Deadlock', value: deadlocks, color: '#f44336' }
    ].filter(d => d.value > 0);

    const pie = d3.pie().value(d => d.value).sort(null);
    const arc = d3.arc().innerRadius(40).outerRadius(radius);

    svg.selectAll('path')
      .data(pie(data)).enter().append('path')
      .attr('d', arc)
      .attr('fill', d => d.data.color)
      .attr('stroke', 'var(--bg-card)').attr('stroke-width', 2)
      .style('transition', 'transform 0.2s')
      .on('mouseover', function() { d3.select(this).style('transform', 'scale(1.05)'); })
      .on('mouseout', function() { d3.select(this).style('transform', 'scale(1)'); });

    // Labels
    const labelArc = d3.arc().innerRadius(radius + 12).outerRadius(radius + 12);
    svg.selectAll('text')
      .data(pie(data)).enter().append('text')
      .attr('transform', d => `translate(${labelArc.centroid(d)})`)
      .attr('text-anchor', 'middle')
      .attr('fill', 'var(--text-primary)')
      .style('font-size', '12px').style('font-weight', '600')
      .text(d => `${d.data.label} (${d.data.value})`);
  }

  /** Draw bar chart for protocol usage */
  _drawProtocolBar(protocolCounts) {
    const container = document.getElementById('chart-protocols');
    if (!container || typeof d3 === 'undefined') return;
    container.innerHTML = '';

    const entries = Object.entries(protocolCounts);
    if (entries.length === 0) return;

    const margin = { top: 10, right: 20, bottom: 50, left: 40 };
    const width = 300 - margin.left - margin.right;
    const height = 200 - margin.top - margin.bottom;

    const svg = d3.select(container).append('svg')
      .attr('width', width + margin.left + margin.right)
      .attr('height', height + margin.top + margin.bottom)
      .append('g').attr('transform', `translate(${margin.left},${margin.top})`);

    const x = d3.scaleBand().range([0, width]).domain(entries.map(e => e[0])).padding(0.3);
    const y = d3.scaleLinear().range([height, 0]).domain([0, d3.max(entries, e => e[1]) * 1.2]);

    // Bars
    const colors = ['#4361ee', '#4cc9f0', '#f72585', '#7209b7', '#3a0ca3'];
    svg.selectAll('rect')
      .data(entries).enter().append('rect')
      .attr('x', d => x(d[0])).attr('y', d => y(d[1]))
      .attr('width', x.bandwidth()).attr('height', d => height - y(d[1]))
      .attr('rx', 4)
      .attr('fill', (d, i) => colors[i % colors.length])
      .style('transition', 'opacity 0.2s')
      .on('mouseover', function() { d3.select(this).style('opacity', 0.8); })
      .on('mouseout', function() { d3.select(this).style('opacity', 1); });

    // Value labels on bars
    svg.selectAll('.bar-label')
      .data(entries).enter().append('text')
      .attr('x', d => x(d[0]) + x.bandwidth() / 2)
      .attr('y', d => y(d[1]) - 5)
      .attr('text-anchor', 'middle')
      .attr('fill', 'var(--text-primary)')
      .style('font-size', '12px').style('font-weight', '700')
      .text(d => d[1]);

    // X axis
    svg.append('g').attr('transform', `translate(0,${height})`)
      .call(d3.axisBottom(x))
      .selectAll('text')
      .attr('fill', 'var(--text-secondary)')
      .style('font-size', '10px')
      .attr('transform', 'rotate(-20)')
      .style('text-anchor', 'end');

    svg.selectAll('.domain, .tick line').attr('stroke', 'var(--border-color)');
  }

  /** Render recent simulations list */
  _drawRecentList(entries) {
    const container = document.getElementById('analytics-recent-list');
    if (!container) return;

    if (entries.length === 0) {
      container.innerHTML = '<p style="color:var(--text-muted);text-align:center;">No recent simulations.</p>';
      return;
    }

    container.innerHTML = entries.map((e, i) => {
      const isDeadlock = e.isDeadlocked || (e.result && e.result.includes('Deadlock'));
      const icon = isDeadlock ? '🔴' : '✅';
      const status = isDeadlock ? 'Deadlock' : 'Completed';
      return `
        <div class="analytics-recent-item">
          <span class="recent-num">${i + 1}</span>
          <div class="recent-info">
            <strong>${e.exampleName || 'Custom'}</strong>
            <span>${e.protocol || e.protocolKey || ''} • ${e.transactions || ''}</span>
          </div>
          <span class="recent-status ${isDeadlock ? 'status-deadlock' : 'status-success'}">${icon} ${status}</span>
          <span class="recent-time">${e.timestamp ? new Date(e.timestamp).toLocaleDateString() : ''}</span>
        </div>
      `;
    }).join('');
  }
}

window.AnalyticsDashboard = AnalyticsDashboard;
