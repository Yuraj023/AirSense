document.addEventListener('DOMContentLoaded', () => {
  // --- ELEMENT REFERENCES ---
  const body = document.body;
  const themeSwitcher = document.getElementById('theme-switcher');
  const aboutHeader = document.getElementById('about-header');
  const aboutContent = document.getElementById('about-content');
  const aboutChevron = document.getElementById('about-chevron');
  const tempEl = document.getElementById("temp");
  const humEl = document.getElementById("hum");
  const gasEl = document.getElementById("gas");
  const lastUpdatedEl = document.getElementById("last-updated");
  const lastDataEl = document.getElementById("last-data");
  const connectionStatusEl = document.getElementById("connection-status");
  
  // --- ADAFRUIT IO CREDENTIALS (Hard-coded) ---
  const AIO_USERNAME = "Yurajchauhan";
  const AIO_KEY = "aio_EAMa203w4rxWtpRi3ixmGn3p1FTe";
  const FEEDS = {
      temp: "temperature",
      hum: "humidity",
      gas: "gas"
  };

  // --- UI LOGIC (THEME & ACCORDION) ---
  const applyTheme = (theme) => {
    body.dataset.theme = theme;
    localStorage.setItem('theme', theme);
    updateAllChartThemes(theme);
  };
  themeSwitcher.addEventListener('click', () => {
    const newTheme = body.dataset.theme === 'dark' ? 'light' : 'dark';
    applyTheme(newTheme);
  });
  
  aboutHeader.addEventListener('click', () => {
      aboutContent.classList.toggle('open');
      aboutChevron.classList.toggle('open');
  });
  
  // --- CHART LOGIC ---
  const MAX_DATA_POINTS = 30;
  const createChart = (canvasId, color) => {
    const ctx = document.getElementById(canvasId).getContext("2d");
    const chartData = {
        labels: [],
        datasets: [{
            data: [],
            borderColor: color,
            backgroundColor: color.replace(')', ', 0.2)').replace('rgb', 'rgba'),
            fill: true,
            tension: 0.4,
            pointRadius: 0
        }]
    };
    return new Chart(ctx, { type: "line", data: chartData, options: { responsive: true, maintainAspectRatio: false, scales: { x: { display: false }, y: { display: false } }, plugins: { legend: { display: false }, tooltip: { enabled: false } }, animation: { duration: 400 } }});
  };

  const tempChart = createChart('temp-chart', 'rgb(108, 172, 228)');
  const humChart = createChart('hum-chart', 'rgb(74, 222, 128)');
  const gasChart = createChart('gas-chart', 'rgb(251, 146, 60)');
  const allCharts = [tempChart, humChart, gasChart];

  function updateAllChartThemes(theme) {
      allCharts.forEach(chart => chart.update());
  }
  
  // --- ADAFRUIT IO DATA FETCHING ---
  async function fetchFeed(feedName) {
    const url = `https://io.adafruit.com/api/v2/${AIO_USERNAME}/feeds/${feedName}/data/last`;
    const res = await fetch(url, { headers: { "X-AIO-Key": AIO_KEY } });
    if (!res.ok) {
        const error = new Error(`HTTP error! status: ${res.status} for feed ${feedName}`);
        error.status = res.status;
        throw error;
    }
    return await res.json();
  }

  async function updateDashboard() {
    connectionStatusEl.classList.remove('error');
    if (connectionStatusEl.textContent !== "✅ System Online") {
        connectionStatusEl.textContent = "Updating...";
    }

    try {
      const [t, h, g] = await Promise.all([
         fetchFeed(FEEDS.temp),
         fetchFeed(FEEDS.hum),
         fetchFeed(FEEDS.gas),
      ]);
      
      const now = new Date();
      const lastSeen = new Date(Math.max(new Date(t.created_at), new Date(h.created_at), new Date(g.created_at)));
      const secondsAgo = Math.floor((now - lastSeen) / 1000);

      const elementsToUpdate = [
        { el: tempEl, value: `${parseFloat(t.value).toFixed(1)}°C` },
        { el: humEl, value: `${parseFloat(h.value).toFixed(1)}%` },
        { el: gasEl, value: g.value }
      ];
      
      elementsToUpdate.forEach(({el, value}) => {
        if (el.textContent !== value) {
          el.textContent = value;
          el.classList.add('value-updated');
          setTimeout(() => el.classList.remove('value-updated'), 400);
        }
      });

      lastUpdatedEl.textContent = `Last poll: ${now.toLocaleTimeString()}`;
      lastDataEl.textContent = `Last data: ${lastSeen.toLocaleTimeString()}`;
      connectionStatusEl.textContent = (secondsAgo <= 90) ? "✅ System Online" : "⚠️ Data is Stale";
      
      const updateChartData = (chart, newValue) => {
          chart.data.labels.push('');
          chart.data.datasets[0].data.push(Number(newValue));
          if(chart.data.labels.length > MAX_DATA_POINTS) {
              chart.data.labels.shift();
              chart.data.datasets[0].data.shift();
          }
          chart.update();
      };

      updateChartData(tempChart, t.value);
      updateChartData(humChart, h.value);
      updateChartData(gasChart, g.value);

    } catch (err) {
        console.error("Error fetching data:", err);
        connectionStatusEl.classList.add('error');
        if (err.status === 401) {
            connectionStatusEl.textContent = "❌ Auth Failed. Check Key.";
        } else if (err.status === 404) {
             connectionStatusEl.textContent = "❌ Feed Not Found. Check Names.";
        } else {
            connectionStatusEl.textContent = "❌ Connection Error";
        }
    }
  }

  // --- INITIALIZATION ---
  const savedTheme = localStorage.getItem('theme') || 'dark';
  applyTheme(savedTheme);
  updateDashboard(); // Initial call
  setInterval(updateDashboard, 5000); // Poll every 5 seconds
});