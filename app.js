// Global default configurations for Chart.js
Chart.defaults.font.family = "'Inter', sans-serif";
Chart.defaults.color = "#64748b";
Chart.defaults.plugins.tooltip.backgroundColor = "rgba(15, 23, 42, 0.9)";
Chart.defaults.plugins.tooltip.padding = 10;
Chart.defaults.plugins.tooltip.cornerRadius = 4;

const colors = {
    called: '#2E86AB',
    notCalled: '#E84855',
    total: '#3BB273',
    rateLine: '#F4A261',
    grid: '#DEE2E6',
    q1: '#2E86AB',
    q2: '#3BB273',
    q3: '#F4A261',
    q4: '#E84855',
    riskHigh: '#E84855',
    riskMed: '#F4A261',
    riskLow: '#3BB273'
};

// Helper: Format YYYY-MM-DD to DD-MMM (e.g. 2025-01-05 -> 05-Jan)
function formatDate(dateStr) {
    if (!dateStr) return '';
    const parts = dateStr.split('-');
    if (parts.length !== 3) return dateStr;
    const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    return `${parts[2]}-${months[parseInt(parts[1], 10) - 1]}`;
}

// Helper: Format YYYY-MM-DD to DD-MMM to DD-MMM (e.g. 2025-01-06 -> 06-Jan to 12-Jan)
function formatWeekRange(dateStr) {
    if (!dateStr) return '';
    const parts = dateStr.split('-');
    if (parts.length !== 3) return dateStr;
    const year = parseInt(parts[0], 10);
    const month = parseInt(parts[1], 10) - 1;
    const day = parseInt(parts[2], 10);

    const start = new Date(year, month, day);
    const end = new Date(year, month, day + 6); // Add 6 days to get the end of the week

    const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    const startStr = `${String(start.getDate()).padStart(2, '0')}-${months[start.getMonth()]}`;
    const endStr = `${String(end.getDate()).padStart(2, '0')}-${months[end.getMonth()]}`;

    return `${startStr} to ${endStr}`;
}

// 1. Monthly Referral Totals (Bar + Line)
const ctxMonthlyTotals = document.getElementById('monthlyTotalsChart').getContext('2d');
new Chart(ctxMonthlyTotals, {
    type: 'bar',
    data: {
        labels: dashboardData.monthly.map(d => d.Month.substring(0, 3)),
        datasets: [
            {
                type: 'line',
                label: 'Total Referrals',
                data: dashboardData.monthly.map(d => d['Total Referrals']),
                borderColor: colors.total,
                backgroundColor: colors.total,
                borderWidth: 2,
                tension: 0.3,
                yAxisID: 'y'
            },
            {
                type: 'bar',
                label: 'Called',
                data: dashboardData.monthly.map(d => d.Called),
                backgroundColor: colors.called,
                yAxisID: 'y'
            },
            {
                type: 'bar',
                label: "Didn't Call",
                data: dashboardData.monthly.map(d => d["Didn't Call"]),
                backgroundColor: colors.notCalled,
                yAxisID: 'y'
            }
        ]
    },
    options: {
        responsive: true,
        interaction: { mode: 'index', intersect: false },
        scales: {
            x: { stacked: true, grid: { display: false } },
            y: { stacked: true, beginAtZero: true, grid: { color: colors.grid } }
        }
    }
});

// Disable datalabels globally by default so it doesn't clutter OTHER charts
Chart.defaults.set('plugins.datalabels', {
    display: false
});

// 2. Annual Overview (Donut)
const annCalled = dashboardData.monthly.reduce((sum, d) => sum + d.Called, 0);
const annNotCalled = dashboardData.monthly.reduce((sum, d) => sum + d["Didn't Call"], 0);
const annTotal = annCalled + annNotCalled;
const annCalledPct = ((annCalled / annTotal) * 100).toFixed(1) + '%';
const annNotPct = ((annNotCalled / annTotal) * 100).toFixed(1) + '%';

// Update descriptive text dynamically based on the recalculated totals
document.getElementById('annualOverviewText').innerText =
    `Total distribution — ${annCalled.toLocaleString()} Called (${annCalledPct}) vs ${annNotCalled.toLocaleString()} Not Called (${annNotPct})`;

const ctxAnnualDonut = document.getElementById('annualDonutChart').getContext('2d');

new Chart(ctxAnnualDonut, {
    type: 'doughnut',
    data: {
        labels: ['Called', "Didn't Call"],
        datasets: [{
            data: [annCalled, annNotCalled],
            backgroundColor: [colors.called, colors.notCalled],
            borderWidth: 0,
            hoverOffset: 10,
            datalabels: {
                display: true
            }
        }]
    },
    options: {
        responsive: true,
        cutout: '65%',
        plugins: {
            legend: { position: 'bottom' },
            datalabels: {
                display: true,
                color: '#fff',
                formatter: (value, ctx) => {
                    let sum = 0;
                    let dataArr = ctx.chart.data.datasets[0].data;
                    dataArr.map(data => {
                        sum += data;
                    });
                    let percentage = (value * 100 / sum).toFixed(1) + "%";
                    return `${percentage}\n(${value})`;
                },
                font: {
                    weight: 'bold',
                    size: 14,
                    family: "'Inter', sans-serif"
                },
                textAlign: 'center'
            }
        }
    }
});


// 3. Risk Analysis 
const ctxRisk = document.getElementById('riskChart').getContext('2d');
new Chart(ctxRisk, {
    type: 'bar',
    data: {
        labels: dashboardData.risk_monthly.map(d => d.Month.substring(0, 3)),
        datasets: [{
            label: "Didn't Call Rate (%)",
            data: dashboardData.risk_monthly.map(d => d['Didnt Call Rate (%)']),
            backgroundColor: dashboardData.risk_monthly.map(d => {
                if (d['Didnt Call Rate (%)'] > 60) return colors.riskHigh;
                if (d['Didnt Call Rate (%)'] > 50) return colors.riskMed;
                return colors.riskLow;
            }),
            borderRadius: 4
        }]
    },
    options: {
        responsive: true,
        plugins: {
            annotation: {
                annotations: {
                    line1: {
                        type: 'line',
                        yMin: 60,
                        yMax: 60,
                        borderColor: colors.riskHigh,
                        borderWidth: 2,
                        borderDash: [5, 5],
                    }
                }
            }
        },
        scales: {
            y: { beginAtZero: true, max: 100 }
        }
    }
});


// 4. Monthly Called Rate (Line)
const ctxMonthlyRate = document.getElementById('monthlyRateChart').getContext('2d');
new Chart(ctxMonthlyRate, {
    type: 'line',
    data: {
        labels: dashboardData.monthly.map(d => d.Month.substring(0, 3)),
        datasets: [
            {
                label: 'Call Rate (%)',
                data: dashboardData.monthly.map(d => d['Call Rate (%)']),
                borderColor: colors.called,
                backgroundColor: 'rgba(59, 178, 115, 0.2)', // Green tinted
                fill: true,
                tension: 0.4,
                borderWidth: 3,
                pointBackgroundColor: colors.called,
                pointRadius: 4
            },
            {
                label: "Didn't Call Rate (%)",
                data: dashboardData.monthly.map(d => d['Didnt Call Rate (%)']),
                borderColor: colors.notCalled,
                backgroundColor: 'rgba(232, 72, 85, 0.2)', // Red tinted
                fill: true,
                tension: 0.4,
                borderWidth: 3,
                pointBackgroundColor: colors.notCalled,
                pointRadius: 4
            }
        ]
    },
    options: {
        responsive: true,
        scales: {
            y: { beginAtZero: true, max: 100 }
        }
    }
});


// 5. Monthly Bar Trends (Grouped Bar)
const ctxMonthlyBar = document.getElementById('monthlyBarChart').getContext('2d');
new Chart(ctxMonthlyBar, {
    type: 'bar',
    data: {
        labels: dashboardData.monthly.map(d => d.Month.substring(0, 3)),
        datasets: [
            {
                label: 'Called',
                data: dashboardData.monthly.map(d => d.Called),
                backgroundColor: colors.called
            },
            {
                label: "Didn't Call",
                data: dashboardData.monthly.map(d => d["Didn't Call"]),
                backgroundColor: colors.notCalled
            }
        ]
    },
    options: {
        responsive: true,
        interaction: { mode: 'index', intersect: false },
        scales: {
            x: { grid: { display: false } },
            y: { beginAtZero: true }
        }
    }
});


// 6. Quarterly Summary
const ctxQuarterly = document.getElementById('quarterlyChart').getContext('2d');
new Chart(ctxQuarterly, {
    type: 'bar',
    data: {
        labels: dashboardData.quarterly.map(d => {
            const lines = d.Quarter.split(' ('); // Split "Q1 (Jan-Mar)" into ["Q1", "Jan-Mar)"]
            if (lines.length > 1) {
                return [lines[0], lines[1].replace(')', '')]; // Returns ["Q1", "Jan-Mar"]
            }
            return [d.Quarter];
        }),
        datasets: [
            {
                label: 'Call Rate (%)',
                data: dashboardData.quarterly.map(d => d['Call Rate (%)']),
                backgroundColor: colors.called,
                borderRadius: 4
            },
            {
                label: "Didn't Call Rate (%)",
                data: dashboardData.quarterly.map(d => d['Didnt Call Rate (%)']),
                backgroundColor: colors.notCalled,
                borderRadius: 4
            }
        ]
    },
    options: {
        responsive: true,
        interaction: { mode: 'index', intersect: false },
        scales: {
            y: { beginAtZero: true, max: 100 }
        }
    }
});

// 7. Day of Week Pattern
const ctxDow = document.getElementById('dowChart').getContext('2d');
new Chart(ctxDow, {
    type: 'bar',
    data: {
        labels: dashboardData.dow.map(d => d.Day.substring(0, 3)),
        datasets: [
            {
                label: 'Total Referrals',
                data: dashboardData.dow.map(d => d.Total),
                backgroundColor: colors.total,
                borderRadius: 4
            }
        ]
    },
    options: {
        responsive: true,
        plugins: {
            legend: { display: false }
        },
        scales: {
            y: { beginAtZero: true }
        }
    }
});

// 8. Weekly Stacked Volumes
const ctxWeeklyStacked = document.getElementById('weeklyStackedChart').getContext('2d');
new Chart(ctxWeeklyStacked, {
    type: 'bar',
    data: {
        labels: dashboardData.weekly.map(d => formatWeekRange(d['Week Starting'])),
        datasets: [
            {
                label: 'Called',
                data: dashboardData.weekly.map(d => d.Called),
                backgroundColor: colors.called
            },
            {
                label: "Didn't Call",
                data: dashboardData.weekly.map(d => d["Didn't Call"]),
                backgroundColor: colors.notCalled
            }
        ]
    },
    options: {
        responsive: true,
        scales: {
            x: { stacked: true },
            y: { stacked: true, beginAtZero: true }
        }
    }
});

// 9. Best vs Worst Performing Weeks
const ctxBestWorst = document.getElementById('bestWorstChart').getContext('2d');
new Chart(ctxBestWorst, {
    type: 'bar',
    data: {
        labels: dashboardData.best_weeks.map(d => ["Best", formatWeekRange(d['Week Starting'])])
            .concat(dashboardData.worst_weeks.map(d => ["Worst", formatWeekRange(d['Week Starting'])])),
        datasets: [{
            label: 'Call Rate (%)',
            data: dashboardData.best_weeks.map(d => d['Call Rate (%)'])
                .concat(dashboardData.worst_weeks.map(d => d['Call Rate (%)'])),
            backgroundColor: dashboardData.best_weeks.map(() => colors.total)
                .concat(dashboardData.worst_weeks.map(() => colors.notCalled)),
            indexAxis: 'y'
        }]
    },
    options: {
        indexAxis: 'y',
        responsive: true,
        plugins: {
            legend: { display: false }
        },
        scales: {
            x: { beginAtZero: true, max: 100 }
        }
    }
});

// 10. MoM Trend
const ctxMomTrend = document.getElementById('momTrendChart').getContext('2d');
new Chart(ctxMomTrend, {
    type: 'line',
    data: {
        labels: dashboardData.mom.map(d => d.Month.substring(0, 3)),
        datasets: [{
            label: 'Call Rate (%)',
            data: dashboardData.mom.map(d => d['Call Rate (%)']),
            borderColor: colors.called,
            backgroundColor: 'rgba(46, 134, 171, 0.2)',
            fill: true,
            tension: 0.3,
            borderWidth: 3,
            pointBackgroundColor: colors.called,
            pointRadius: 5,
            pointHoverRadius: 7
        }]
    },
    options: {
        responsive: true,
        scales: {
            y: { beginAtZero: true, max: 100 }
        }
    }
});

// --- Data Table Generators ---
function generateTableHTML(headers, rows) {
    let html = '<table class="data-table"><thead><tr>';
    headers.forEach(h => html += `<th>${h}</th>`);
    html += '</tr></thead><tbody>';
    rows.forEach(r => {
        html += '<tr>';
        r.forEach(cell => html += `<td>${cell !== null && cell !== undefined ? cell : '-'}</td>`);
        html += '</tr>';
    });
    html += '</tbody></table>';
    return html;
}

// 1. DOW Table
const dowHeaders = ['Day', 'Total Volume', '% of Annual Total'];
const dowRows = dashboardData.dow.map(d => [
    d.Day, d.Total, d['% of Annual Total'] + '%'
]);
document.getElementById('dowTableContainer').innerHTML = generateTableHTML(dowHeaders, dowRows);

// 2. Best & Worst Weeks Table
const bwHeaders = ['Week Name', 'Performance', 'Called', "Didn't Call", 'Total', 'Call Rate (%)'];
const bestRows = dashboardData.best_weeks.map(d => [
    formatWeekRange(d['Week Starting']), 'Best (Top 5)', d.Called, d["Didn't Call"], d.Total, d['Call Rate (%)'] + '%'
]);
const worstRows = dashboardData.worst_weeks.map(d => [
    formatWeekRange(d['Week Starting']), 'Worst (Bottom 5)', d.Called, d["Didn't Call"], d.Total, d['Call Rate (%)'] + '%'
]);
const bwRows = [...bestRows, ...worstRows];
document.getElementById('bestWorstTableContainer').innerHTML = generateTableHTML(bwHeaders, bwRows);


// 3. MoM Trend Table
const momHeaders = ['Month', 'Volume', 'Change vs Prev', 'Trend Direction'];
const momRows = dashboardData.mom.map(d => {
    let trendIcon = '';
    if (d.Trend === 'Increase') trendIcon = '↑ Up';
    else if (d.Trend === 'Decrease') trendIcon = '↓ Down';
    else if (d.Trend === 'Flat') trendIcon = '→ Flat';
    else trendIcon = '— Baseline';

    return [
        d.Month,
        d['Total Referrals'],
        d['% Change'] !== null ? (d['% Change'] > 0 ? '+' : '') + d['% Change'] + '%' : 'N/A',
        trendIcon
    ];
});
document.getElementById('momTableContainer').innerHTML = generateTableHTML(momHeaders, momRows);

// Mobile Sidebar Toggle Logic
const mobileMenuBtn = document.getElementById('mobileMenuBtn');
const sidebar = document.querySelector('.sidebar');
const overlay = document.getElementById('sidebarOverlay');
const sidebarLinks = document.querySelectorAll('.sidebar-nav li a');

function toggleMenu() {
    sidebar.classList.toggle('active');
    overlay.classList.toggle('active');
}

mobileMenuBtn.addEventListener('click', toggleMenu);
overlay.addEventListener('click', toggleMenu);

// Close menu when a link is clicked
sidebarLinks.forEach(link => {
    link.addEventListener('click', () => {
        if (window.innerWidth <= 768) {
            toggleMenu();
        }
    });
});
