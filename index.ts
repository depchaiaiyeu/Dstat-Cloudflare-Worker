export interface Env {
  ANALYTICS_KV: KVNamespace;
}

interface RequestData {
  timestamp: number;
  method: string;
  url: string;
  userAgent: string;
  ip: string;
  country: string;
  responseTime: number;
  status: number;
}

interface Analytics {
  requests: RequestData[];
  totalRequests: number;
  lastUpdated: number;
}

export default {
  async fetch(request: Request, env: Env, ctx: ExecutionContext): Promise<Response> {
    const url = new URL(request.url);
    
    // Serve dashboard
    if (url.pathname === '/' || url.pathname === '/dashboard') {
      return new Response(getDashboardHTML(), {
        headers: { 'Content-Type': 'text/html' }
      });
    }
    
    // API endpoint for getting analytics data
    if (url.pathname === '/api/analytics') {
      const analytics = await getAnalytics(env);
      return new Response(JSON.stringify(analytics), {
        headers: { 
          'Content-Type': 'application/json',
          'Access-Control-Allow-Origin': '*'
        }
      });
    }
    
    // API endpoint for clearing data
    if (url.pathname === '/api/clear' && request.method === 'POST') {
      await env.ANALYTICS_KV.delete('analytics');
      return new Response(JSON.stringify({ success: true }), {
        headers: { 
          'Content-Type': 'application/json',
          'Access-Control-Allow-Origin': '*'
        }
      });
    }
    
    // Track any other request
    const startTime = Date.now();
    
    // Simulate processing
    await new Promise(resolve => setTimeout(resolve, Math.random() * 50));
    
    const responseTime = Date.now() - startTime;
    
    // Log the request
    ctx.waitUntil(logRequest(request, env, responseTime, 200));
    
    // Return a simple response for demo
    return new Response(JSON.stringify({
      message: 'Request tracked successfully!',
      timestamp: new Date().toISOString(),
      path: url.pathname,
      method: request.method
    }), {
      headers: { 'Content-Type': 'application/json' },
      status: 200
    });
  }
};

async function logRequest(request: Request, env: Env, responseTime: number, status: number) {
  const cf = request.cf;
  const url = new URL(request.url);
  
  const requestData: RequestData = {
    timestamp: Date.now(),
    method: request.method,
    url: url.pathname,
    userAgent: request.headers.get('User-Agent') || 'Unknown',
    ip: request.headers.get('CF-Connecting-IP') || 'Unknown',
    country: cf?.country?.toString() || 'Unknown',
    responseTime,
    status
  };
  
  // Get existing analytics
  const analytics = await getAnalytics(env);
  
  // Add new request (keep only last 100)
  analytics.requests.unshift(requestData);
  analytics.requests = analytics.requests.slice(0, 100);
  analytics.totalRequests++;
  analytics.lastUpdated = Date.now();
  
  // Save back to KV
  await env.ANALYTICS_KV.put('analytics', JSON.stringify(analytics));
}

async function getAnalytics(env: Env): Promise<Analytics> {
  const data = await env.ANALYTICS_KV.get('analytics');
  if (data) {
    return JSON.parse(data);
  }
  
  return {
    requests: [],
    totalRequests: 0,
    lastUpdated: Date.now()
  };
}

function getDashboardHTML(): string {
  return `<!DOCTYPE html>
<html lang="vi">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Request Monitor Dashboard</title>
    <script src="https://code.highcharts.com/highcharts.js"></script>
    <script src="https://code.highcharts.com/modules/boost.js"></script>
    <script src="https://code.highcharts.com/themes/dark-unica.js"></script>
    <style>
        * {
            margin: 0;
            padding: 0;
            box-sizing: border-box;
        }
        
        body {
            font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
            background: linear-gradient(135deg, #1e3c72 0%, #2a5298 100%);
            color: #fff;
            min-height: 100vh;
        }
        
        .header {
            background: rgba(0,0,0,0.3);
            padding: 20px;
            text-align: center;
            backdrop-filter: blur(10px);
        }
        
        .header h1 {
            font-size: 2.5em;
            margin-bottom: 10px;
            background: linear-gradient(45deg, #ff6b6b, #4ecdc4);
            -webkit-background-clip: text;
            -webkit-text-fill-color: transparent;
        }
        
        .stats {
            display: grid;
            grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
            gap: 20px;
            padding: 20px;
            max-width: 1200px;
            margin: 0 auto;
        }
        
        .stat-card {
            background: rgba(255,255,255,0.1);
            padding: 20px;
            border-radius: 15px;
            text-align: center;
            backdrop-filter: blur(10px);
            border: 1px solid rgba(255,255,255,0.2);
            transition: transform 0.3s ease;
        }
        
        .stat-card:hover {
            transform: translateY(-5px);
        }
        
        .stat-number {
            font-size: 2em;
            font-weight: bold;
            margin-bottom: 10px;
            color: #4ecdc4;
        }
        
        .charts {
            display: grid;
            grid-template-columns: 1fr 1fr;
            gap: 20px;
            padding: 20px;
            max-width: 1200px;
            margin: 0 auto;
        }
        
        .chart-container {
            background: rgba(255,255,255,0.1);
            border-radius: 15px;
            padding: 20px;
            backdrop-filter: blur(10px);
            border: 1px solid rgba(255,255,255,0.2);
        }
        
        .requests-table {
            max-width: 1200px;
            margin: 20px auto;
            background: rgba(255,255,255,0.1);
            border-radius: 15px;
            padding: 20px;
            backdrop-filter: blur(10px);
        }
        
        .table-container {
            max-height: 400px;
            overflow-y: auto;
        }
        
        table {
            width: 100%;
            border-collapse: collapse;
        }
        
        th, td {
            padding: 10px;
            text-align: left;
            border-bottom: 1px solid rgba(255,255,255,0.2);
        }
        
        th {
            background: rgba(255,255,255,0.1);
            font-weight: bold;
        }
        
        .method {
            padding: 4px 8px;
            border-radius: 5px;
            font-size: 0.8em;
            font-weight: bold;
        }
        
        .method.GET { background: #4caf50; }
        .method.POST { background: #2196f3; }
        .method.PUT { background: #ff9800; }
        .method.DELETE { background: #f44336; }
        
        .controls {
            text-align: center;
            padding: 20px;
        }
        
        button {
            background: linear-gradient(45deg, #ff6b6b, #4ecdc4);
            border: none;
            padding: 12px 24px;
            border-radius: 25px;
            color: white;
            font-weight: bold;
            cursor: pointer;
            margin: 0 10px;
            transition: transform 0.3s ease;
        }
        
        button:hover {
            transform: scale(1.05);
        }
        
        .status {
            display: inline-block;
            padding: 2px 6px;
            border-radius: 3px;
            font-size: 0.8em;
        }
        
        .status.success { background: #4caf50; }
        .status.error { background: #f44336; }
        
        @media (max-width: 768px) {
            .charts {
                grid-template-columns: 1fr;
            }
        }
    </style>
</head>
<body>
    <div class="header">
        <h1>🚀 Request Monitor Dashboard</h1>
        <p>Real-time monitoring của requests đến Cloudflare Worker</p>
    </div>
    
    <div class="stats" id="stats">
        <div class="stat-card">
            <div class="stat-number" id="totalRequests">0</div>
            <div>Total Requests</div>
        </div>
        <div class="stat-card">
            <div class="stat-number" id="avgResponseTime">0ms</div>
            <div>Avg Response Time</div>
        </div>
        <div class="stat-card">
            <div class="stat-number" id="requestsPerMinute">0</div>
            <div>Requests/Min</div>
        </div>
        <div class="stat-card">
            <div class="stat-number" id="uniqueCountries">0</div>
            <div>Countries</div>
        </div>
    </div>
    
    <div class="charts">
        <div class="chart-container">
            <div id="timelineChart" style="height: 300px;"></div>
        </div>
        <div class="chart-container">
            <div id="methodChart" style="height: 300px;"></div>
        </div>
        <div class="chart-container">
            <div id="countryChart" style="height: 300px;"></div>
        </div>
        <div class="chart-container">
            <div id="responseTimeChart" style="height: 300px;"></div>
        </div>
    </div>
    
    <div class="requests-table">
        <h3>📊 Recent Requests</h3>
        <div class="table-container">
            <table id="requestsTable">
                <thead>
                    <tr>
                        <th>Time</th>
                        <th>Method</th>
                        <th>URL</th>
                        <th>Country</th>
                        <th>Response Time</th>
                        <th>Status</th>
                    </tr>
                </thead>
                <tbody></tbody>
            </table>
        </div>
    </div>
    
    <div class="controls">
        <button onclick="refreshData()">🔄 Refresh</button>
        <button onclick="clearData()">🗑️ Clear Data</button>
        <button onclick="generateTestData()">🧪 Generate Test Data</button>
    </div>

    <script>
        let charts = {};
        let autoRefresh = true;
        
        // Initialize charts
        function initCharts() {
            // Timeline chart
            charts.timeline = Highcharts.chart('timelineChart', {
                chart: { type: 'spline' },
                title: { text: 'Requests Timeline' },
                xAxis: { type: 'datetime' },
                yAxis: { title: { text: 'Requests' } },
                series: [{
                    name: 'Requests',
                    data: []
                }],
                credits: { enabled: false }
            });
            
            // Method distribution
            charts.method = Highcharts.chart('methodChart', {
                chart: { type: 'pie' },
                title: { text: 'HTTP Methods' },
                series: [{
                    name: 'Methods',
                    data: []
                }],
                credits: { enabled: false }
            });
            
            // Country distribution
            charts.country = Highcharts.chart('countryChart', {
                chart: { type: 'column' },
                title: { text: 'Top Countries' },
                xAxis: { categories: [] },
                yAxis: { title: { text: 'Requests' } },
                series: [{
                    name: 'Requests',
                    data: []
                }],
                credits: { enabled: false }
            });
            
            // Response time
            charts.responseTime = Highcharts.chart('responseTimeChart', {
                chart: { type: 'area' },
                title: { text: 'Response Time' },
                xAxis: { type: 'datetime' },
                yAxis: { title: { text: 'Response Time (ms)' } },
                series: [{
                    name: 'Response Time',
                    data: []
                }],
                credits: { enabled: false }
            });
        }
        
        async function fetchAnalytics() {
            try {
                const response = await fetch('/api/analytics');
                const data = await response.json();
                updateDashboard(data);
            } catch (error) {
                console.error('Error fetching analytics:', error);
            }
        }
        
        function updateDashboard(analytics) {
            updateStats(analytics);
            updateCharts(analytics);
            updateTable(analytics.requests);
        }
        
        function updateStats(analytics) {
            document.getElementById('totalRequests').textContent = analytics.totalRequests;
            
            if (analytics.requests.length > 0) {
                const avgResponseTime = analytics.requests.reduce((sum, req) => sum + req.responseTime, 0) / analytics.requests.length;
                document.getElementById('avgResponseTime').textContent = Math.round(avgResponseTime) + 'ms';
                
                const recentRequests = analytics.requests.filter(req => Date.now() - req.timestamp < 60000);
                document.getElementById('requestsPerMinute').textContent = recentRequests.length;
                
                const uniqueCountries = new Set(analytics.requests.map(req => req.country)).size;
                document.getElementById('uniqueCountries').textContent = uniqueCountries;
            }
        }
        
        function updateCharts(analytics) {
            // Timeline data
            const timelineData = {};
            analytics.requests.forEach(req => {
                const minute = Math.floor(req.timestamp / 60000) * 60000;
                timelineData[minute] = (timelineData[minute] || 0) + 1;
            });
            
            const timelinePoints = Object.entries(timelineData)
                .map(([time, count]) => [parseInt(time), count])
                .sort((a, b) => a[0] - b[0]);
            
            charts.timeline.series[0].setData(timelinePoints);
            
            // Method distribution
            const methodData = {};
            analytics.requests.forEach(req => {
                methodData[req.method] = (methodData[req.method] || 0) + 1;
            });
            
            const methodPoints = Object.entries(methodData)
                .map(([method, count]) => ({ name: method, y: count }));
            
            charts.method.series[0].setData(methodPoints);
            
            // Country distribution
            const countryData = {};
            analytics.requests.forEach(req => {
                if (req.country !== 'Unknown') {
                    countryData[req.country] = (countryData[req.country] || 0) + 1;
                }
            });
            
            const topCountries = Object.entries(countryData)
                .sort((a, b) => b[1] - a[1])
                .slice(0, 10);
            
            charts.country.xAxis[0].setCategories(topCountries.map(([country]) => country));
            charts.country.series[0].setData(topCountries.map(([, count]) => count));
            
            // Response time
            const responseTimePoints = analytics.requests
                .map(req => [req.timestamp, req.responseTime])
                .sort((a, b) => a[0] - b[0]);
            
            charts.responseTime.series[0].setData(responseTimePoints);
        }
        
        function updateTable(requests) {
            const tbody = document.querySelector('#requestsTable tbody');
            tbody.innerHTML = '';
            
            requests.slice(0, 20).forEach(req => {
                const row = tbody.insertRow();
                row.innerHTML = \`
                    <td>\${new Date(req.timestamp).toLocaleTimeString()}</td>
                    <td><span class="method \${req.method}">\${req.method}</span></td>
                    <td>\${req.url}</td>
                    <td>\${req.country}</td>
                    <td>\${req.responseTime}ms</td>
                    <td><span class="status \${req.status < 400 ? 'success' : 'error'}">\${req.status}</span></td>
                \`;
            });
        }
        
        async function refreshData() {
            await fetchAnalytics();
        }
        
        async function clearData() {
            if (confirm('Bạn có chắc muốn xóa tất cả dữ liệu?')) {
                try {
                    await fetch('/api/clear', { method: 'POST' });
                    await fetchAnalytics();
                } catch (error) {
                    console.error('Error clearing data:', error);
                }
            }
        }
        
        async function generateTestData() {
            const methods = ['GET', 'POST', 'PUT', 'DELETE'];
            const paths = ['/api/users', '/api/products', '/dashboard', '/login', '/api/orders'];
            const countries = ['US', 'VN', 'JP', 'DE', 'GB', 'FR', 'CA', 'AU'];
            
            for (let i = 0; i < 20; i++) {
                const testPath = paths[Math.floor(Math.random() * paths.length)];
                await fetch(testPath, {
                    method: methods[Math.floor(Math.random() * methods.length)]
                });
                await new Promise(resolve => setTimeout(resolve, 100));
            }
            
            setTimeout(() => refreshData(), 1000);
        }
        
        // Initialize
        document.addEventListener('DOMContentLoaded', function() {
            initCharts();
            fetchAnalytics();
            
            // Auto refresh every 10 seconds
            setInterval(() => {
                if (autoRefresh) {
                    fetchAnalytics();
                }
            }, 10000);
        });
    </script>
</body>
</html>`;
}
