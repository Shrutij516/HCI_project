let chart = null;
let rows = [];
let aggregatedData = [];
let synths = {};
let summaryMetrics = {};

// Load CSV when user selects it
document.getElementById("csvFile").addEventListener("change", function (e) {
  const file = e.target.files[0];
  if (!file) return;
  Papa.parse(file, {
    header: true,
    dynamicTyping: true,
    complete: function (results) {
      rows = results.data.filter(r => r.brand && !isNaN(r.sell_through_pct));
      if (rows.length === 0) {
        alert("No valid data found in CSV.");
        return;
      }
      aggregateByBrand();
      calculateSummaryMetrics();
      setupSynths();
      displayMetrics();
      drawChart();
    }
  });
});

// Calculate standard deviation for volatility
function calculateStdDev(values) {
  if (values.length === 0) return 0;
  const mean = values.reduce((a, b) => a + b, 0) / values.length;
  const variance = values.reduce((sum, val) => sum + Math.pow(val - mean, 2), 0) / values.length;
  return Math.sqrt(variance);
}

// Normalize value to 0-1 range
function normalize(value, min, max) {
  if (max === min) return 0.5;
  return (value - min) / (max - min);
}

// Aggregate data by brand for professional presentation
function aggregateByBrand() {
  const brandMap = {};
  
  rows.forEach(row => {
    const brand = row.brand;
    if (!brandMap[brand]) {
      brandMap[brand] = {
        brand: brand,
        sell_through_pct: [],
        units_sold: [],
        pitch_hz: [],
        revenue: [],
        events: 0,
        instrument: row.instrument || "sine"
      };
    }
    brandMap[brand].sell_through_pct.push(parseFloat(row.sell_through_pct) || 0);
    brandMap[brand].units_sold.push(parseFloat(row.units_sold) || 0);
    brandMap[brand].pitch_hz.push(parseFloat(row.pitch_hz) || 440);
    const price = parseFloat(row.price_usd) || 0;
    brandMap[brand].revenue.push((parseFloat(row.units_sold) || 0) * price);
    brandMap[brand].events++;
  });
  
  // Calculate volatility (std dev) for all brands to normalize
  const allVolatilities = [];
  Object.values(brandMap).forEach(brandData => {
    if (brandData.units_sold.length > 1) {
      const stdDev = calculateStdDev(brandData.units_sold);
      allVolatilities.push(stdDev);
    }
  });
  const minVol = Math.min(...allVolatilities);
  const maxVol = Math.max(...allVolatilities);
  
  // Calculate averages and totals
  aggregatedData = Object.values(brandMap).map(brandData => {
    const avgSellThrough = brandData.sell_through_pct.reduce((a, b) => a + b, 0) / brandData.sell_through_pct.length;
    const totalUnits = brandData.units_sold.reduce((a, b) => a + b, 0);
    const avgUnits = totalUnits / brandData.units_sold.length;
    const totalRevenue = brandData.revenue.reduce((a, b) => a + b, 0);
    const avgPitch = brandData.pitch_hz.reduce((a, b) => a + b, 0) / brandData.pitch_hz.length;
    
    // Calculate volatility (standard deviation of units_sold within brand)
    let volatility = 0;
    if (brandData.units_sold.length > 1) {
      const stdDev = calculateStdDev(brandData.units_sold);
      volatility = normalize(stdDev, minVol, maxVol); // Normalize to 0-1
    }
    
    return {
      brand: brandData.brand,
      avg_sell_through: avgSellThrough,
      total_units_sold: totalUnits,
      avg_units_sold: avgUnits,
      total_revenue: totalRevenue,
      avg_pitch_hz: avgPitch,
      volatility: volatility,
      events: brandData.events,
      instrument: brandData.instrument
    };
  });
  
  // Sort by average sell-through % (descending)
  aggregatedData.sort((a, b) => b.avg_sell_through - a.avg_sell_through);
}

// Calculate summary metrics for dashboard
function calculateSummaryMetrics() {
  const totalEvents = rows.length;
  const totalUnits = rows.reduce((sum, r) => sum + (parseFloat(r.units_sold) || 0), 0);
  const avgSellThrough = rows.reduce((sum, r) => sum + (parseFloat(r.sell_through_pct) || 0), 0) / totalEvents;
  const totalRevenue = rows.reduce((sum, r) => {
    const price = parseFloat(r.price_usd) || 0;
    return sum + ((parseFloat(r.units_sold) || 0) * price);
  }, 0);
  const uniqueBrands = new Set(rows.map(r => r.brand)).size;
  
  summaryMetrics = {
    totalEvents,
    totalUnits,
    avgSellThrough,
    totalRevenue,
    uniqueBrands,
    hasRevenue: totalRevenue > 0
  };
}

// Display summary metrics
function displayMetrics() {
  const metricsPanel = document.getElementById("metricsPanel");
  metricsPanel.style.display = "grid";
  
  let revenueCard = '';
  if (summaryMetrics.hasRevenue) {
    revenueCard = `
    <div class="metric-card">
      <h3>Total Revenue</h3>
      <div class="value">$${(summaryMetrics.totalRevenue / 1000000).toFixed(1)}M</div>
      <div class="subtitle">Estimated revenue</div>
    </div>`;
  }
  
  metricsPanel.innerHTML = `
    <div class="metric-card">
      <h3>Total Events</h3>
      <div class="value">${summaryMetrics.totalEvents.toLocaleString()}</div>
      <div class="subtitle">Pop-up events analyzed</div>
    </div>
    <div class="metric-card">
      <h3>Average Sell-Through</h3>
      <div class="value">${summaryMetrics.avgSellThrough.toFixed(1)}%</div>
      <div class="subtitle">Across all brands</div>
    </div>
    <div class="metric-card">
      <h3>Total Units Sold</h3>
      <div class="value">${summaryMetrics.totalUnits.toLocaleString()}</div>
      <div class="subtitle">All events combined</div>
    </div>
    ${revenueCard}
    <div class="metric-card">
      <h3>Brands Analyzed</h3>
      <div class="value">${summaryMetrics.uniqueBrands}</div>
      <div class="subtitle">Unique brands</div>
    </div>
  `;
}

// Create one synth per instrument type
function setupSynths() {
  const types = [...new Set(rows.map(r => r.instrument || "sine"))];
  types.forEach(t => {
    synths[t] = new Tone.Synth({
      oscillator: { type: t }
    }).toDestination();
  });
}

// Draw professional bar chart
function drawChart() {
  const ctx = document.getElementById("kpiChart").getContext("2d");
  const chartContainer = document.getElementById("chartContainer");
  chartContainer.style.display = "block";
  
  const labels = aggregatedData.map(d => d.brand);
  const dataSell = aggregatedData.map(d => d.avg_sell_through);
  
  if (chart) chart.destroy();
  
  chart = new Chart(ctx, {
    type: "bar",
    data: {
      labels: labels,
      datasets: [{
        label: "Average Sell-Through %",
        data: dataSell,
        backgroundColor: 'rgba(30, 60, 114, 0.8)',
        borderColor: 'rgba(30, 60, 114, 1)',
        borderWidth: 1,
        borderRadius: 4
      }]
    },
    options: {
      responsive: true,
      maintainAspectRatio: true,
      plugins: {
        legend: {
          display: false
        },
        tooltip: {
          backgroundColor: 'rgba(0, 0, 0, 0.8)',
          padding: 12,
          titleFont: {
            size: 14,
            weight: 'bold'
          },
          bodyFont: {
            size: 13
          },
          callbacks: {
            label: function(context) {
              const brandData = aggregatedData[context.dataIndex];
              return [
                `Sell-Through: ${context.parsed.y.toFixed(1)}%`,
                `Avg Units: ${Math.round(brandData.avg_units_sold).toLocaleString()}`,
                `Events: ${brandData.events}`
              ];
            }
          }
        }
      },
      scales: {
        y: {
          beginAtZero: true,
          max: 100,
          title: {
            display: true,
            text: 'Sell-Through Rate (%)',
            font: {
              size: 12,
              weight: 'bold'
            }
          },
          grid: {
            color: 'rgba(0, 0, 0, 0.05)'
          },
          ticks: {
            callback: function(value) {
              return value + '%';
            }
          }
        },
        x: {
          title: {
            display: true,
            text: 'Brand',
            font: {
              size: 12,
              weight: 'bold'
            }
          },
          ticks: {
            maxRotation: 45,
            minRotation: 45,
            font: {
              size: 10
            }
          },
          grid: {
            display: false
          }
        }
      },
      onClick: async (evt, elements) => {
        if (!elements.length) return;
        const idx = elements[0].index;
        const brandData = aggregatedData[idx];
        await playRow(brandData);
        showDetailPanel(brandData);
      }
    }
  });
}

// Play audio for brand
async function playRow(brandData) {
  await Tone.start();
  const freq = parseFloat(brandData.avg_pitch_hz) || 440;
  const volNorm = Math.max(parseFloat(brandData.volatility) || 0.3, 0.05);
  const instr = brandData.instrument || "sine";
  const synth = synths[instr] || synths["sine"];
  synth.volume.value = 20 * Math.log10(volNorm);
  synth.triggerAttackRelease(freq, "8n");
}

// Display detailed information panel
function showDetailPanel(brandData) {
  const detailPanel = document.getElementById("detailPanel");
  detailPanel.classList.add("active");
  
  const unitsSold = Math.round(brandData.total_units_sold);
  const avgUnits = Math.round(brandData.avg_units_sold);
  const revenue = brandData.total_revenue;
  const pitch = Math.round(brandData.avg_pitch_hz);
  const volatility = brandData.volatility;
  
  // Determine performance indicators
  let performanceLevel = "Standard";
  if (brandData.avg_sell_through >= 75) performanceLevel = "Excellent";
  else if (brandData.avg_sell_through >= 70) performanceLevel = "Strong";
  else if (brandData.avg_sell_through >= 65) performanceLevel = "Good";
  
  let volatilityDesc = "Stable";
  if (volatility > 0.7) volatilityDesc = "High Volatility";
  else if (volatility > 0.4) volatilityDesc = "Moderate Volatility";
  else if (volatility > 0.1) volatilityDesc = "Low Volatility";
  else volatilityDesc = "Very Stable";
  
  let pitchDesc = "Low Volume";
  if (pitch >= 600) pitchDesc = "High Volume";
  else if (pitch >= 400) pitchDesc = "Medium Volume";
  
  // Get instrument name
  const instrumentName = brandData.instrument || "sine";
  const instrumentDisplay = instrumentName.charAt(0).toUpperCase() + instrumentName.slice(1);
  
  let revenueItem = '';
  if (revenue > 0) {
    revenueItem = `
      <div class="detail-item">
        <label>Total Revenue</label>
        <div class="value">$${(revenue / 1000).toFixed(0)}K</div>
      </div>`;
  }
  
  detailPanel.innerHTML = `
    <h3>${brandData.brand} - Performance Details</h3>
    <div class="detail-grid">
      <div class="detail-item">
        <label>Sell-Through Rate</label>
        <div class="value">${brandData.avg_sell_through.toFixed(1)}%</div>
      </div>
      <div class="detail-item">
        <label>Performance Level</label>
        <div class="value">${performanceLevel}</div>
      </div>
      <div class="detail-item">
        <label>Total Units Sold</label>
        <div class="value">${unitsSold.toLocaleString()}</div>
      </div>
      <div class="detail-item">
        <label>Average Units/Event</label>
        <div class="value">${avgUnits.toLocaleString()}</div>
      </div>
      ${revenueItem}
      <div class="detail-item">
        <label>Number of Events</label>
        <div class="value">${brandData.events}</div>
      </div>
      <div class="detail-item">
        <label>Sales Volume (Pitch)</label>
        <div class="value">${pitchDesc}</div>
      </div>
      <div class="detail-item">
        <label>Sales Volatility (Volume)</label>
        <div class="value">${volatilityDesc}</div>
      </div>
      <div class="detail-item">
        <label>Brand Identifier (Timbre)</label>
        <div class="value">${instrumentDisplay} Wave</div>
      </div>
    </div>
    <p style="margin-top: 20px; font-size: 14px; color: #34495e; line-height: 1.6;">
      <strong>Audio Indicators:</strong> Pitch represents average sales volume (higher pitch = more units sold). Volume represents sales volatility within this brand (louder = more variation between events of the same brand). Timbre (instrument type) uniquely identifies each brand - there are 4 instrument types (Sine, Triangle, Square, Sawtooth) assigned to brands.
    </p>
  `;
}
