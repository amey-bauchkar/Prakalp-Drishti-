ï»¿//// charts.js
//// -----------------------------------------------------------------------------
//// Safe chart creation helpers
//// -----------------------------------------------------------------------------

//// store chart instances globally so they can be destroyed/re-rendered
//window.chartInstances = {};

//function destroyChart(id) {
//    try {
//        if (window.chartInstances[id]) {
//            const c = window.chartInstances[id];
//            if (typeof c.destroy === 'function') c.destroy();
//            if (typeof c.clear === 'function') c.clear();
//            delete window.chartInstances[id];
//            //console.log(`Destroyed chart: ${id}`);
//        }
//    } catch (e) {
//        console.warn(`Destroy failed for ${id}`, e);
//    }
//}

//// -----------------------------------------------------------------------------
//// Chart 1 â SectorWise Chart (Chart.js Doughnut)
//// -----------------------------------------------------------------------------
//window.fetchSectorWiseChart = function () {
//    const dataList = window.SectorWiseDataList || [];
//    const canvas = document.getElementById('SectorWiseChart');
//    if (!canvas) {
//        //console.warn('SectorWiseChart canvas missing');
//        return;
//    }

//    // destroy previous chart safely
//    destroyChart('SectorWiseChart');
//    fetchSectorData(dataList);
//    const original = [];
//    const sectors = [];
//    const TotalProject = [];
//    let CumCost = 0, SectorName = "Others", TotalProjectCount = 0;

//    dataList.forEach((item, i) => {
//        if (i < 10) {
//            original.push(item.CumCost);
//            sectors.push(item.SectorName);
//            TotalProject.push(item.TotalProject);
//        } else {
//            CumCost += item.CumCost;
//            TotalProjectCount += item.TotalProject;
//        }
//    });
//    if (TotalProjectCount > 0) {
//        original.push(CumCost);
//        sectors.push(SectorName);
//        TotalProject.push(TotalProjectCount);
//    }

//    const colors = [
//        'rgba(10, 21, 77, 0.8)', 'rgba(0, 128, 0, 0.6)', 'rgba(255, 165, 0, 0.6)',
//        'rgba(255, 69, 0, 0.6)', 'rgba(0, 0, 255, 0.6)', 'rgba(0, 0, 139, 0.6)',
//        'rgba(255, 20, 147, 0.6)', 'rgba(255, 105, 180, 0.6)', 'rgba(255, 99, 132, 0.6)',
//        'rgba(54, 162, 235, 0.6)', 'rgba(75, 192, 192, 0.6)'
//    ];

//    const ctx = canvas.getContext('2d');
//    const config = {
//        type: 'doughnut',
//        data: {
//            labels: sectors,
//            datasets: [
//                {
//                    label: 'Project Count',
//                    data: TotalProject,
//                    backgroundColor: colors,
//                    borderColor: '#fff',
//                    borderWidth: 1
//                },
//                {
//                    label: 'Original Cost (in cr.)',
//                    data: original,
//                    backgroundColor: colors,
//                    borderColor: '#fff',
//                    borderWidth: 1
//                }
//            ]
//        },
//        options: {
//            responsive: true,
//            animation: { duration: 600 },
//            plugins: {
//                legend: { position: 'bottom' },
//                title: {
//                    display: true,
//                    text: '[ Outer Ring : Count :: Inner Ring : Cost ]',
//                    font: { style: 'italic' }
//                },
//                tooltip: {
//                    callbacks: {
//                        label: (tooltipItem) => {
//                            const datasetIndex = tooltipItem.datasetIndex;
//                            const value = tooltipItem.raw;
//                            return datasetIndex === 0
//                                ? `Project Count: ${value}`
//                                : `Original Cost: â¹${value.toLocaleString('en-IN')} cr`;
//                        }
//                    }
//                }
//            }
//        }
//    };

//    try {
//        window.chartInstances['SectorWiseChart'] = new Chart(ctx, config);
//        //console.log(window.SectorWiseDataList);
//        window.chartInstances['SectorWiseChart'].update();
//        //console.log('â SectorWise chart rendered');
//    } catch (err) {
//        console.error('â SectorWiseChart failed:', err);
//    }
//};

//// -----------------------------------------------------------------------------
//// Chart 2 â Progress Chart (ApexCharts)
//// -----------------------------------------------------------------------------
//window.drawProgressChart = function () {
//    const container = document.querySelector('#ProgressChartDiv');
//    if (!container) {
//        //console.warn('ProgressChartDiv missing');
//        return;
//    }
//    destroyChart('ProgressChartDiv');

//    container.innerHTML = '';

//    const progressDataList = window.progressDataList || [];
//    fetchPrgressData(progressDataList);
//    if (!Array.isArray(progressDataList) || !progressDataList.length) {
//        console.warn('No progress data');
//        return;
//    }

//    const ranges = ['< 20', '20-40', '40-60', '60-80', '>= 80'];
//    const chartDataProjects = Array(ranges.length).fill().map((_, i) => ({ x: ranges[i], y: 0 }));
//    const chartDataCosts = Array(ranges.length).fill().map((_, i) => ({ x: ranges[i], y: 0 }));

//    progressDataList.forEach(item => {
//        const progress = parseInt(item.ProgressSlab);
//        let rangeIndex = 0;
//        if (progress >= 20 && progress < 40) rangeIndex = 1;
//        else if (progress >= 40 && progress < 60) rangeIndex = 2;
//        else if (progress >= 60 && progress < 80) rangeIndex = 3;
//        else if (progress >= 80) rangeIndex = 4;

//        chartDataProjects[rangeIndex].y += item.TotalProject;
//        chartDataCosts[rangeIndex].y += item.CumCost;
//    });

//    const categories = ranges;
//    const totalBars = chartDataProjects.length;
//    const baseColor = [144, 238, 144];
//    const barColors = Array.from({ length: totalBars }, (_, i) => {
//        let factor = 1 - (i / (totalBars - 1)) * 0.7;
//        let darkenedColor = baseColor.map(c => Math.round(c * factor));
//        return `rgb(${darkenedColor.join(",")})`;
//    });

//    const options = {
//        chart: { type: 'bar', height: 400, id: 'ProgressChartDiv' },
//        plotOptions: {
//            bar: {
//                columnWidth: '40px',
//                distributed: true,
//                dataLabels: { position: 'top' }
//            }
//        },
//        xaxis: {
//            categories,
//            title: { text: 'Progress %Age' }
//        },
//        yaxis: { show: false },
//        series: [{ name: '', data: chartDataProjects }],
//        dataLabels: {
//            enabled: true,
//            style: { fontSize: '13px', fontWeight: 'bold', colors: ['#fff'] }
//        },
//        fill: { type: 'solid', colors: barColors },
//        legend: { show: false },
//        tooltip: {
//            y: {
//                formatter: (_, { dataPointIndex }) => {
//                    const p = chartDataProjects[dataPointIndex].y;
//                    const c = chartDataCosts[dataPointIndex].y;
//                    return `Projects: ${p} | Cost: â¹${c.toLocaleString('en-IN')} cr`;
//                }
//            }
//        }
//    };

//    try {
//        const chart = new ApexCharts(container, options);
//        window.chartInstances['ProgressChartDiv'] = chart;
//        chart.render();
//        //console.log('â Progress chart rendered');
//    } catch (err) {
//        console.error('â Progress chart failed:', err);
//    }
//};

//// -----------------------------------------------------------------------------
//// Chart 3 â Cost Evaluation Chart (ApexCharts Funnel)
//// -----------------------------------------------------------------------------
//window.fetchCostEvaluationChart = function () {
//    const container = document.querySelector('#CostEvaluationChart');
//    if (!container) {
//        //console.warn('CostEvaluationChart container missing');
//        return;
//    }
//    destroyChart('CostEvaluationChart');
//    container.innerHTML = '';

//    const data = window.CostEvaluationData || [];
//    fetchCostEvaluationData(data);
//    if (!Array.isArray(data) || !data.length) {
//        console.warn('No cost evaluation data');
//        return;
//    }

//    const format = new Intl.NumberFormat('en-IN', { minimumFractionDigits: 0 });
//    const options = {
//        series: [{ name: "Cost Evaluation", data: data }],
//        chart: { type: 'bar', height: 350, id: 'CostEvaluationChart' },
//        plotOptions: {
//            bar: {
//                horizontal: true,
//                isFunnel: true,
//                distributed: true,
//                borderRadius: 3
//            }
//        },
//        dataLabels: {
//            enabled: true,
//            formatter: (val, opt) =>
//                `${opt.w.globals.labels[opt.dataPointIndex]}: â¹${format.format(val)} cr`
//        },
//        xaxis: { categories: ['Original Cost', 'Revised Cost', 'Expenditure'] },
//        fill: { colors: ['#0A154D', '#122587', '#152b9e'] },
//        legend: { show: false },
//        tooltip: { enabled: false }
//    };

//    try {
//        const chart = new ApexCharts(container, options);
//        window.chartInstances['CostEvaluationChart'] = chart;
//        chart.render();
//        //console.log('â Cost Evaluation chart rendered');
//    } catch (err) {
//        console.error('â Cost Evaluation chart failed:', err);
//    }
//};

//// -----------------------------------------------------------------------------
//// Chart 4 â DelayTor Chart (Apex Donut)
//// -----------------------------------------------------------------------------
//window.fetchDataAndRenderChart = function () {
//    const container = document.querySelector('#DelayTor');
//    if (!container) {
//        console.warn('DelayTor div missing');
//        return;
//    }
//    destroyChart('DelayTor');
//    container.innerHTML = '';

//    const RevisedData = window.RevisedData || [];
//    fetchRevisedData(RevisedData);
//    if (!Array.isArray(RevisedData) || !RevisedData.length) {
//        console.warn('No RevisedData found');
//        return;
//    }

//    const sectors = RevisedData.map(r => r.StateName);
//    const projectCounts = RevisedData.map(r => r.TotalProject);
//    const projectCosts = RevisedData.map(r => r.CumCost);

//    const colors = [
//        'rgba(10,21,77,0.8)', 'rgba(0,128,0,0.6)', 'rgba(255,165,0,0.6)',
//        'rgba(255,69,0,0.6)', 'rgba(0,0,255,0.6)', 'rgba(0,0,139,0.6)',
//        'rgba(255,20,147,0.6)', 'rgba(255,105,180,0.6)',
//        'rgba(255,99,132,0.6)', 'rgba(54,162,235,0.6)', 'rgba(75,192,192,0.6)'
//    ];

//    const options = {
//        series: projectCounts,
//        chart: { type: 'donut', height: 400, id: 'DelayTor' },
//        labels: sectors,
//        colors,
//        plotOptions: { pie: { startAngle: -290, endAngle: 70 } },
//        fill: { type: 'solid', opacity: 1 },
//        tooltip: {
//            custom: ({ seriesIndex, w }) => `
//                <div style="padding:6px; background:#000; color:#fff; border-radius:6px;">
//                    <b>${w.globals.labels[seriesIndex]}</b><br>
//                    Projects: ${projectCounts[seriesIndex]}<br>
//                    Cost: â¹${projectCosts[seriesIndex].toLocaleString('en-IN')} cr
//                </div>`
//        },
//        legend: { show: false }
//    };

//    try {
//        const chart = new ApexCharts(container, options);
//        window.chartInstances['DelayTor'] = chart;
//        chart.render();
//       // console.log('â DelayTor chart rendered');
//    } catch (err) {
//        console.error('â DelayTor chart failed:', err);
//    }
//};


// charts.js
// =============================================================================
// Dashboard Chart Binding (Single Page Version)
// =============================================================================

// -----------------------------------------------------------------------------
// Chart Management Helpers
// -----------------------------------------------------------------------------

window.chartInstances = window.chartInstances || {};

async function destroyChart(id) {
    try {
        if (!window.chartInstances) return;        // Safety check
        const chart = window.chartInstances[id];
        if (!chart) return;                        // Chart not rendered yet

        if (chart.destroy) {
            if (chart instanceof ApexCharts) {
                await chart.destroy();
            } else {
                chart.destroy();
            }
        }
        delete window.chartInstances[id];
    } catch (e) {
        console.warn(`Destroy failed for ${id}`, e);
    }
}

function bindAllTables(data) {
    fetchSectorData(data.SectorWiseDataList || []);
    fetchPrgressData(data.PhysicalProgressDataList || []);
    fetchCostEvaluationData(data.CostdetailsList || []);
    fetchRevisedData(data.StateWiseDataList || []);
}
//function renderSectorWiseChart(dataList) {
//    const canvas = document.getElementById('SectorWiseChart');
//    if (!canvas) return;

//    console.log("SectorWiseDataList:", dataList);
//    destroyChart('SectorWiseChart');

//    dataList = dataList || [];

//    fetchSectorData(dataList);


//    // Optional: show first few items
//    dataList.slice(0, 5).forEach((item, i) => {
//        console.log(`Item ${i}:`, item.SectorName, item.TotalProject, item.CumCost);
//    });

//    // Top 10 sectors + Others
//    const sectors = [], totalProjects = [], costs = [];
//    let otherCost = 0, otherProjects = 0;

//    dataList.forEach((item, i) => {
//        if (i < 10) {
//            sectors.push(item.SectorName);
//            totalProjects.push(item.TotalProject);
//            costs.push(item.CumCost);
//        } else {
//            otherProjects += item.TotalProject;
//            otherCost += item.CumCost;
//        }
//    });

//    if (otherProjects > 0) {
//        sectors.push('Others');
//        totalProjects.push(otherProjects);
//        costs.push(otherCost);
//    }

//    const colors = [
//        '#0A154D', '#1E2A78', '#3451A4', '#4E7DC2', '#6DA9E0',
//        '#4B0082', '#9932CC', '#FF69B4', '#FF8C00', '#FFD700', '#ADFF2F'
//    ];

//    const ctx = canvas.getContext('2d');
//    const config = {
//        type: 'doughnut',
//        data: {
//            labels: sectors,
//            datasets: [
//                {
//                    label: 'Projects',
//                    data: totalProjects,
//                    backgroundColor: colors,
//                    borderColor: '#fff',
//                    borderWidth: 1,
//                    weight: 1
//                },
//                {
//                    label: 'Cost',
//                    data: costs,
//                    backgroundColor: colors.map(c => lightenColor(c, 0.4)),
//                    borderColor: '#fff',
//                    borderWidth: 1,
//                    weight: 0.5
//                }
//            ]
//        },
//        options: {
//            responsive: true,
//            cutout: '50%',
//            plugins: {
//                legend: { position: 'bottom' },
//                title: {
//                    display: true,
//                    text: '[Outer: Count | Inner: Cost]',
//                    font: { style: 'italic' }
//                },
//                tooltip: {
//                    callbacks: {
//                        label: function (tooltipItem) {
//                            const datasetIndex = tooltipItem.datasetIndex;
//                            const value = tooltipItem.raw;
//                            return datasetIndex === 0
//                                ? `Projects: ${value}`
//                                : `Cost: â¹${value.toLocaleString('en-IN')} Cr`;
//                        }
//                    }
//                }
//            }
//        }
//    };

//    try {
//        const chart = new Chart(ctx, config);
//        window.chartInstances['SectorWiseChart'] = chart;
//    } catch (err) {
//        console.error('â SectorWiseChart failed:', err);
//    }
//}

//// Helper to lighten color
//function lightenColor(color, percent) {
//    const f = parseInt(color.slice(1), 16), t = percent, R = f >> 16, G = f >> 8 & 0x00FF, B = f & 0x0000FF;
//    return `rgb(${Math.min(255, Math.round(R + (255 - R) * t))},${Math.min(255, Math.round(G + (255 - G) * t))},${Math.min(255, Math.round(B + (255 - B) * t))})`;
//}

//// =======================================================
//// 2ï¸â£ Progress Chart (Apex Bar)
//// =======================================================
//function renderProgressChart(progressDataList) {
//    const container = document.querySelector('#ProgressChartDiv');
//    if (!container) return;

//    destroyChart('ProgressChartDiv');
//    container.innerHTML = '';

//    progressDataList = progressDataList || [];
//    if (!progressDataList.length) return;

//    const ranges = ['<20', '20â40', '40â60', '60â80', 'â¥80'];
//    const projectSeries = [0, 0, 0, 0, 0];
//    const costSeries = [0, 0, 0, 0, 0];

//    progressDataList.forEach(item => {
//        const progress = parseInt(item.ProgressSlab);
//        let idx = 0;
//        if (progress >= 20 && progress < 40) idx = 1;
//        else if (progress >= 40 && progress < 60) idx = 2;
//        else if (progress >= 60 && progress < 80) idx = 3;
//        else if (progress >= 80) idx = 4;

//        projectSeries[idx] += item.TotalProject;
//        costSeries[idx] += item.CumCost;
//    });

//    const options = {
//        chart: { type: 'bar', height: 400, id: 'ProgressChartDiv' },
//        plotOptions: { bar: { columnWidth: '40%', distributed: true, dataLabels: { position: 'top' } } },
//        xaxis: { categories: ranges, title: { text: 'Progress (%)' } },
//        yaxis: { show: false },
//        series: [{ name: 'Projects', data: projectSeries }],
//        dataLabels: { enabled: true, style: { fontSize: '13px', fontWeight: 'bold', colors: ['#fff'] } },
//        fill: { colors: ['#0A154D', '#1E2A78', '#3451A4', '#4E7DC2', '#6DA9E0'] },
//        legend: { show: false },
//        tooltip: {
//            y: {
//                formatter: function (_, { dataPointIndex }) {
//                    return `Projects: ${projectSeries[dataPointIndex]} | Cost: â¹${costSeries[dataPointIndex].toLocaleString('en-IN')} Cr`;
//                }
//            }
//        }
//    };

//    try {
//        const chart = new ApexCharts(container, options);
//        chart.render();
//        window.chartInstances['ProgressChartDiv'] = chart;
//    } catch (err) {
//        console.error('â ProgressChart failed:', err);
//    }
//}

//// =======================================================
//// 3ï¸â£ Cost Evaluation Chart (Apex Horizontal Bar / Funnel)
//// =======================================================
//function renderCostEvaluationChart(data) {
//    const container = document.querySelector('#CostEvaluationChart');
//    if (!container) return;

//    destroyChart('CostEvaluationChart');
//    container.innerHTML = '';

//    data = data || [];
//    if (!data.length) return;

//    const format = new Intl.NumberFormat('en-IN');
//    const options = {
//        series: [{ name: "Cost Evaluation", data }],
//        chart: { type: 'bar', height: 350, id: 'CostEvaluationChart' },
//        plotOptions: { bar: { horizontal: true, isFunnel: true, distributed: true, borderRadius: 3 } },
//        dataLabels: { enabled: true, formatter: (val, opt) => `${opt.w.globals.labels[opt.dataPointIndex]}: â¹${format.format(val)} Cr` },
//        xaxis: { categories: ['Original Cost', 'Revised Cost', 'Expenditure'] },
//        fill: { colors: ['#0A154D', '#122587', '#152b9e'] },
//        legend: { show: false }
//    };

//    try {
//        const chart = new ApexCharts(container, options);
//        chart.render();
//        window.chartInstances['CostEvaluationChart'] = chart;
//    } catch (err) {
//        console.error('â CostEvaluationChart failed:', err);
//    }
//}

//// =======================================================
//// 4ï¸â£ State / Delay TOR Chart (Apex Donut)
//// =======================================================
//function renderStateWiseChart(data) {
//    const container = document.querySelector('#DelayTor');
//    if (!container) return;

//    destroyChart('DelayTor');
//    container.innerHTML = '';

//    data = data || [];
//    if (!data.length) return;

//    const sectors = data.map(r => r.StateName);
//    const projectCounts = data.map(r => r.TotalProject);
//    const projectCosts = data.map(r => r.CumCost);

//    const colors = [
//        'rgba(10,21,77,0.8)', 'rgba(0,128,0,0.6)', 'rgba(255,165,0,0.6)',
//        'rgba(255,69,0,0.6)', 'rgba(0,0,255,0.6)', 'rgba(0,0,139,0.6)',
//        'rgba(255,20,147,0.6)', 'rgba(255,105,180,0.6)',
//        'rgba(255,99,132,0.6)', 'rgba(54,162,235,0.6)', 'rgba(75,192,192,0.6)'
//    ];

//    const options = {
//        series: projectCounts,
//        chart: { type: 'donut', height: 400, id: 'DelayTor' },
//        labels: sectors,
//        colors,
//        tooltip: {
//            custom: ({ seriesIndex, w }) => `
//                <div style="padding:6px;background:#000;color:#fff;border-radius:6px;">
//                    <b>${w.globals.labels[seriesIndex]}</b><br>
//                    Projects: ${projectCounts[seriesIndex]}<br>
//                    Cost: â¹${projectCosts[seriesIndex].toLocaleString('en-IN')} Cr
//                </div>`
//        },
//        legend: { position: 'bottom' }
//    };

//    try {
//        const chart = new ApexCharts(container, options);
//        chart.render();
//        window.chartInstances['DelayTor'] = chart;
//    } catch (err) {
//        console.error('â DelayTor chart failed:', err);
//    }
//}
// -----------------------------------------------------------------------------
// 1ï¸â£ Sector Wise Chart (Chart.js Doughnut)
// -----------------------------------------------------------------------------

function renderSectorWiseChart(SectorWiseDataList) {
    if (!SectorWiseDataList || !SectorWiseDataList.length) return;

    // Table binding (if needed)
    fetchSectorData(SectorWiseDataList);

    // Prepare chart data
    const sectors = [];
    const totalProjects = [];
    const costs = [];
    let otherCost = 0;
    let otherProjects = 0;

    for (let i = 0; i < SectorWiseDataList.length; i++) {
        const item = SectorWiseDataList[i];
        if (i < 10) {
            sectors.push(item.SectorName);
            totalProjects.push(item.TotalProject);
            costs.push(item.CumCost);
        } else {
            otherCost += item.CumCost;
            otherProjects += item.TotalProject;
        }
    }

    if (otherProjects > 0) {
        sectors.push("Others");
        totalProjects.push(otherProjects);
        costs.push(otherCost);
    }

    const colors = [
        'rgba(10, 21, 77, 0.8)', 'rgba(0, 128, 0, 0.6)',
        'rgba(255, 165, 0, 0.6)', 'rgba(255, 69, 0, 0.6)',
        'rgba(0, 0, 255, 0.6)', 'rgba(0, 0, 139, 0.6)',
        'rgba(255, 20, 147, 0.6)', 'rgba(255, 105, 180, 0.6)',
        'rgba(255, 99, 132, 0.6)', 'rgba(54, 162, 235, 0.6)',
        'rgba(75, 192, 192, 0.6)'
    ];

    const ctx = document.getElementById('SectorWiseChart').getContext('2d');

    // Destroy existing chart if exists
    destroyChart('SectorWiseChart');

    const data = {
        labels: sectors,
        datasets: [
            {
                label: 'Project Count',
                data: totalProjects,
                backgroundColor: colors,
                borderColor: 'rgba(255, 255, 255, 1)',
                borderWidth: 1
            },
            {
                label: 'Original Cost (in â¹ Cr)',
                data: costs,
                backgroundColor: colors,
                borderColor: 'rgba(255, 255, 255, 1)',
                borderWidth: 1
            }
        ]
    };

    const config = {
        type: 'doughnut',
        data: data,
        options: {
            responsive: true,
            plugins: {
                legend: { position: 'bottom' },
                title: {
                    display: true,
                    text: '[ Outer Ring : Count :: Inner Ring : Cost ]',
                    font: { style: 'italic' }
                },
                tooltip: {
                    callbacks: {
                        label: function (tooltipItem) {
                            const datasetIndex = tooltipItem.datasetIndex;
                            const value = tooltipItem.raw;
                            return datasetIndex === 0
                                ? `Project Count: ${value}`
                                : `Original Cost: â¹${value.toLocaleString('en-IN')} cr`;
                        }
                    }
                }
            }
        }
    };

    // Create chart and store reference
    const chart = new Chart(ctx, config);
    window.chartInstances['SectorWiseChart'] = chart;
}

//function renderSectorWiseChart(dataList) {
//    console.log(dataList);
//    const canvas = document.getElementById('SectorWiseChart');
//    if (!canvas) return;

//    destroyChart('SectorWiseChart');

//    dataList = dataList || [];
//    fetchSectorData(dataList); // table binding

//    const sectors = [];
//    const totalProjects = [];
//    const costs = [];
//    let otherCost = 0, otherProjects = 0;

//    dataList.forEach((item, i) => {
//        if (i < 10) {
//            sectors.push(item.SectorName);
//            totalProjects.push(item.TotalProject);
//            costs.push(item.CumCost);
//        } else {
//            otherCost += item.CumCost;
//            otherProjects += item.TotalProject;
//        }
//    });

//    if (otherProjects > 0) {
//        sectors.push("Others");
//        totalProjects.push(otherProjects);
//        costs.push(otherCost);
//    }

//    const colors = [
//        '#0A154D', '#1E2A78', '#3451A4', '#4E7DC2', '#6DA9E0',
//        '#4B0082', '#9932CC', '#FF69B4', '#FF8C00', '#FFD700', '#ADFF2F'
//    ];

//    const ctx = canvas.getContext('2d');
//    const config = {
//        type: 'doughnut',
//        data: {
//            labels: sectors,
//            datasets: [
//                { label: 'Project Count', data: totalProjects, backgroundColor: colors, borderColor: '#fff', borderWidth: 1 },
//                { label: 'Original Cost (â¹ Cr)', data: costs, backgroundColor: colors, borderColor: '#fff', borderWidth: 1 }
//            ]
//        },
//        options: {
//            responsive: true,
//            animation: { duration: 600 },
//            plugins: {
//                legend: { position: 'bottom' },
//                title: {
//                    display: true,
//                    text: '[Outer: Count | Inner: Cost]',
//                    font: { style: 'italic' }
//                },
//                tooltip: {
//                    callbacks: {
//                        label: function (tooltipItem) {
//                            const datasetIndex = tooltipItem.datasetIndex;
//                            const value = tooltipItem.raw;
//                            return datasetIndex === 0
//                                ? `Projects: ${value}`
//                                : `Cost: â¹${value.toLocaleString('en-IN')} Cr`;
//                        }
//                    }
//                }
//            }
//        }
//    };

//    try {
//        const chart = new Chart(ctx, config);
//        window.chartInstances['SectorWiseChart'] = chart;
//    } catch (err) {
//        console.error('â SectorWiseChart failed:', err);
//    }
//}

// -----------------------------------------------------------------------------
// 2ï¸â£ Progress Chart (Apex Bar)
// -----------------------------------------------------------------------------
function renderProgressChart(progressDataList) {
    const container = document.querySelector('#ProgressChartDiv');
    if (!container) return;

    destroyChart('ProgressChartDiv');
    container.innerHTML = '';

    progressDataList = progressDataList || [];
    fetchPrgressData(progressDataList); // table binding

    // Define the ranges for the progress percentage
    var ranges = ['< 20', '20-40', '40-60', '60-80', '>= 80'];
    var chartDataProjects = [];
    var chartDataCosts = [];
    // Initialize the chart data with 0 project counts and 0 cumulative costs for each range
    for (var i = 0; i < ranges.length; i++) {
        chartDataProjects.push({ x: ranges[i], y: 0 });  // For project count
        chartDataCosts.push({ x: ranges[i], y: 0 });  // For cumulative cost
    }

    // Group data into ranges based on the progress percentage
    progressDataList.forEach(function (item) {
        var progress = parseInt(item.ProgressSlab);

        // Find the range for the current progress percentage
        var rangeIndex = 0;
        if (progress >= 20 && progress < 40) {
            rangeIndex = 1;  // 20%-40%
        } else if (progress >= 40 && progress < 60) {
            rangeIndex = 2;  // 40%-60%
        } else if (progress >= 60 && progress < 80) {
            rangeIndex = 3;  // 60%-80%
        } else if (progress >= 80) {
            rangeIndex = 4;  // 80%-100%
        }

        // Add the project count to the corresponding range for projects
        chartDataProjects[rangeIndex].y += item.TotalProject;

        // Add the cumulative cost to the corresponding range for cost
        chartDataCosts[rangeIndex].y += item.CumCost;
    });

    // ApexCharts options
    var categories = ranges;
    var chartData = chartDataProjects;
    var totalBars = chartData.length;
    var baseColor = [144, 238, 144]; // RGB format

    // Generate different shades (lighter on left, darker on right)
    var barColors = Array.from({ length: totalBars }, (_, i) => {
        let factor = 1 - (i / (totalBars - 1)) * 0.7; // From 100% brightness (right) to 30% (left)
        let darkenedColor = baseColor.map(c => Math.round(c * factor)); // Apply factor
        return `rgb(${darkenedColor.join(",")})`;
    });

    var options = {
        chart: {
            type: 'bar',
            height: 400,
            width: '100%',
            id: 'ProgressChartDiv',
        },
        plotOptions: {
            bar: {
                columnWidth: '40px',
                distributed: true,  //  Ensures each bar has its own shade
                dataLabels: {
                    position: 'top'  //  Moves labels to the top
                }
            }
        },
        xaxis: {
            categories: categories,
            title: {
                text: 'Progress %Age',
                style: {
                    fontFamily: 'sans-serif',
                    fontSize: '16px',
                    fontWeight: 'bold',
                }
            },
        },
        yaxis: {
            show: false,
        },
        series: [{
            name: '',
            data: chartData
        }],
        dataLabels: {
            enabled: true,
            style: {
                fontFamily: 'sans-serif',
                fontSize: '14px',
                fontWeight: 'bold',
                colors: ['#ffffff'], //  Ensures high contrast (change to black if bars are light)
            },
            offsetY: 0, //  Keeps label inside bar at the top
            textAnchor: 'middle'
        },
        fill: {
            type: 'solid', //  Uses solid fill with manually created shades
            colors: barColors //  Apply different shades of color
        },
        legend: {
            show: false //  Hides legend
        },
        tooltip: {
            enabled: true,
            shared: false, // Ensures only one tooltip appears at a time
            intersect: false,
            y: {
                formatter: function (value, { dataPointIndex }) {
                    var projectCount = chartDataProjects[dataPointIndex].y;
                    var cumCost = chartDataCosts[dataPointIndex].y;
                    return `<b>Project Count:</b> ${projectCount} <br/> <b>Original Cost:</b> â¹ ${cumCost.toLocaleString('en-IN')} cr`;
                }
            },
            marker: {
                show: false // Remove color marker from tooltip
            },
            style: {
                fontSize: '14px',
                fontFamily: 'Arial, sans-serif',
            }
        }
    };
    var chart = new ApexCharts(document.querySelector("#ProgressChartDiv"), options);
    chart.render();
}

// -----------------------------------------------------------------------------
// 3ï¸â£ Cost Evaluation Chart (Apex Funnel)
// -----------------------------------------------------------------------------
function renderCostEvaluationChart(CostdetailsList) {
    const container = document.querySelector('#CostEvaluationChart');
    if (!container) return;

    destroyChart('CostEvaluationChart');
    container.innerHTML = '';

    const dataList = CostdetailsList || [];

    if (!dataList.length) {
        console.warn("â ï¸ No CostdetailsList data found for chart");
        return;
    }

    // â Extract single row data (you have only one entry)
    const item = dataList[0];

    const data = [
        item.OriginalCost || 0,
        item.RevisedCost || 0,
        item.CummulativeExpenditure || 0
    ];
    fetchCostEvaluationData(data);

    // â For console verification
    $('#CostEvaluationChart').empty();
    //const data = da;

    let format = new Intl.NumberFormat('en-IN', {
        //style: 'currency',
        //currency: 'INR',
        minimumFractionDigits: 0,
    });
   
    var options = {
        series: [
            {
                name: "Cost Evaluation",
                data: data,
            },
        ],
        chart: {
            type: 'bar',
            height: 350,
            dropShadow: {
                enabled: true,
            },
            id: 'CostEvaluationChart',
        },
        plotOptions: {
            bar: {
                borderRadius: 0,
                horizontal: true,
                barHeight: '80%',
                isFunnel: true,
                distributed: true,  // Ensures different colors for each bar
            },
        },
        dataLabels: {
            enabled: true,
            formatter: function (val, opt) {
                return opt.w.globals.labels[opt.dataPointIndex] + ': â¹ ' + format.format(val) + ' cr'
            },
            dropShadow: {
                enabled: true,
            },
            style: {
                fontFamily: 'sans-serif',  // Correct font family property
                fontSize: '16px',
                fontWeight: 'bold',
            },
        },
        xaxis: {
            categories: [
                'Original Cost',
                'Revised Cost',
                'Expenditure'
            ],
        },
        tooltip: {
            enabled: false,
        },
        legend: {
            show: false,
        },
        fill: {
            colors: ['#0A154D', '#122587', '#152b9e']//['#2c67f2', '#5589f8', '#7fa8fc']
        },
    };

    var chart = new ApexCharts(document.querySelector("#CostEvaluationChart"), options);
    chart.render();
}


// -----------------------------------------------------------------------------
// 4ï¸â£ Delay TOR Chart (Apex Donut)
// -----------------------------------------------------------------------------
function renderStateWiseChart(data) {
    const container = document.querySelector('#DelayTor');
    if (!container) return;

    destroyChart('DelayTor');
    container.innerHTML = '';

    data = data || [];
    fetchRevisedData(data); // table binding
    var sectors = [];
    var projectCounts = [];
    var projectCosts = [];

    // Define an array of RGBA colors
    const colors = [
        'rgba(10, 21, 77, 0.8)',  // Light blue
        'rgba(0, 128, 0, 0.6)',  // Dark Green
        'rgba(255, 165, 0, 0.6)', // Orange
        'rgba(255, 69, 0, 0.6)',  // Red-Orange
        'rgba(0, 0, 255, 0.6)',   // Blue
        'rgba(0, 0, 139, 0.6)',   // Dark Blue
        'rgba(255, 20, 147, 0.6)',// Deep Pink
        'rgba(255, 105, 180, 0.6)', // Pink
        'rgba(255, 99, 132, 0.6)', // Light Red
        'rgba(54, 162, 235, 0.6)', // Sky Blue
        'rgba(75, 192, 192, 0.6)'  // Turquoise
    ];

    // Iterate over the data and fill the arrays
    data.forEach(function (item, index) {
        sectors.push(item.StateName);   // Add Sector Name for labels
        projectCounts.push(item.TotalProject);   // Add Total Projects
        projectCosts.push(item.CumCost);   // Add Cumulative Cost
    });

    fetchRevisedData(data);

    // Donut chart options
    var options = {
        series: projectCounts,  // Data for the chart: Total Project Counts
        chart: {
            height: 400,
            width: '100%',
            type: 'donut',
            id: 'DelayTor',
        },
        labels: sectors,  // Sector names as labels
        colors: colors,  // Assign colors to each sector
        plotOptions: {
            pie: {
                startAngle: -290,
                endAngle: 70
            }
        },
        fill: {
            type: 'solid', // Ensure colors are correctly applied
            opacity: 1 // Fully opaque colors (ApexCharts already uses RGBA)
        },
        //title: {
        //    text: "Project Count by Sector",
        //    align: 'center',
        //    style: {
        //        fontSize: '16px',
        //        fontWeight: 'bold'
        //    }
        //},
        tooltip: {
            enabled: true, // Enable the tooltip
            custom: function ({ seriesIndex, dataPointIndex, w }) {
                // Get the project cost and count for the tooltip
                const cost = projectCosts[seriesIndex];  // Project cost
                const count = projectCounts[seriesIndex];  // Project count

                return `
                    <div style="padding:5px; background: #000; border-radius: 5px; box-shadow: 0px 0px 5px rgba(0,0,0,0.2);">
                        <strong>${w.globals.labels[seriesIndex]}</strong><br>
                        Project Count: ${count}<br>
                        Original Cost: â¹${cost.toLocaleString('en-IN')} cr<br>
                    </div>`;
            }
        },
        legend: {
            show: false,
            position: 'right',
            formatter: function (val, opts) {
                return val + " - " + opts.w.globals.series[opts.seriesIndex]; // Custom legend formatting
            }
        },
        responsive: [{
            breakpoint: 480,
            options: {
                chart: {
                    width: 200
                },
                legend: {
                    position: 'bottom'
                }
            }
        }]
    };

    // Create and render the chart
    var chart = new ApexCharts(document.querySelector("#DelayTor"), options);
    chart.render();
}



// -----------------------------------------------------------------------------
// Table Binding Helpers (same as your originals)
// -----------------------------------------------------------------------------
//function renderSectorWiseChart(list) { /* your old bindSectorWiseChart code */ }

//// State-wise Chart (Apex Donut)
//function renderStateWiseChart(list) { /* your old bindStateWiseChart code */ }

//// Physical Progress Chart (Apex Bar)
//function renderProgressChart(list) { /* your old bindPhysicalProgressChart code */ }

//// Cost Evaluation Chart (Apex Bar/Funnel)
//function renderCostEvaluationChart(list) { }

//function renderSectorTable(list) { /* old bindSectorWiseTable code */ }
//function renderStateTable(list) { /* old bindStateWiseTable code */ }
//function renderProgressTable(list) { /* old bindPhysicalProgressTable code */ }
//function renderCostTable(list) { /* old bindCostTable code */ }




function fetchPrgressData(PrgressData) {
    // Clear any existing rows in the table
    $('#ProgressTableBody').empty();

    // Check if there is valid data
    if (PrgressData && PrgressData.length > 0) {
        var i = 1;
        PrgressData.forEach(function (item) {
            // Create a new table row
            var slab = item.ProgressSlab;
            if (slab < 100) {
                slab = item.ProgressSlab + '-' + (parseInt(item.ProgressSlab) + 10).toString();
            }
            var row = '<tr class="highlight-row">' +
                '<td>' + i++ + '</td>' +  // Optional: Empty cell for any additional content
                '<td style="text-align: center;">' + slab + '</td>' +
                '<td style="text-align: center;">' + item.TotalProject + '</td>' +
                '<td style="text-align: right;">' + item.CumCost + ' <b>(' + item.CumRevCost + ')</b></td>' +
                '<td style="text-align: right;">' + item.CumExpen + '</td>' +
                '</tr>';

            // Append the row to the table body
            $('#ProgressTableBody').append(row);
        });
    } else {
        // If no data, show a message
        var row = '<tr><td colspan="5">No data available</td></tr>';
        $('#ProgressTableBody').append(row);
    }

    $(document).off("click", "#downloadCSV3").on("click", "#downloadCSV3", function () {
        const table = document.querySelector("#ProgressTableBody");

        if (!table || table.rows.length === 0) {
            alert('No data to download.');
            return;
        }

        let csv = [];

        // Prepare filters text
        let filtersTextArr = [];
        $('#filters .filter-row').each(function () {
            let field = $(this).find('.field').val();
            let op = $(this).find('.operator').val();
            let val = $(this).find('.value').val();

            if (field && op && val) {
                let displayName = fieldDisplayNames[field] || field;
                filtersTextArr.push(`${displayName} ${op} ${val}`);
            }
        });

        // Build the title line with filters (if any)
        let titleLine = "Physical Progress";
        if (filtersTextArr.length > 0) {
            titleLine += " - " + filtersTextArr.join(', ');
        }

        // Add the title + filters line as first row in CSV (quoted)
        csv.push(`"${titleLine}"`);

        // Empty row after title line
        csv.push("");

        // Now add the table header and rows
        for (let row of table.rows) {
            let rowData = [];
            for (let cell of row.cells) {
                let text = cell.innerText.replace(/"/g, '""').trim();
                rowData.push(`"${text}"`);
            }
            csv.push(rowData.join(","));
        }

        const csvContent = csv.join("\n");
        const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
        const url = URL.createObjectURL(blob);

        const link = document.createElement('a');
        link.setAttribute('href', url);
        link.setAttribute('download', 'Physical-Progress-Report.csv');
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    });


    $(document).off("click", "#downloadXLS3").on("click", "#downloadXLS3", function () {
        const table = document.querySelector("#ProgressTableBody");
        if (!table || table.rows.length === 0) {
            alert('No data to download.');
            return;
        }

        const wb = XLSX.utils.book_new();
        const ws = XLSX.utils.aoa_to_sheet([]); // empty sheet

        const columnCount = table.rows[0].cells.length;

        // Prepare filters text for the header
        let filtersTextArr = [];
        $('#filters .filter-row').each(function () {
            let field = $(this).find('.field').val();
            let op = $(this).find('.operator').val();
            let val = $(this).find('.value').val();

            if (field && op && val) {
                let displayName = fieldDisplayNames[field] || field;
                filtersTextArr.push(`${displayName} ${op} ${val}`);
            }
        });

        const filtersText = filtersTextArr.length > 0 ? ` - ${filtersTextArr.join(', ')}` : "";
        const fullTitle = `Physical Progress ${filtersText}`;

        // Add the combined title + filters as first row (A1)
        XLSX.utils.sheet_add_aoa(ws, [[fullTitle]], { origin: "A1" });

        // Merge title cell across all columns
        ws['!merges'] = ws['!merges'] || [];
        ws['!merges'].push({
            s: { r: 0, c: 0 },
            e: { r: 0, c: columnCount - 1 }
        });

        // Style the title cell (bold, white text, blue background, centered)
        const titleCell = XLSX.utils.encode_cell({ r: 0, c: 0 });
        if (!ws[titleCell]) ws[titleCell] = { t: 's', v: fullTitle };
        ws[titleCell].s = {
            font: { bold: true, sz: 14, color: { rgb: "FFFFFF" } },
            alignment: { horizontal: "center", vertical: "center", wrapText: true },
            fill: { fgColor: { rgb: "4F81BD" } }
        };

        // Add an empty row after title (row 2 / index 1)
        XLSX.utils.sheet_add_aoa(ws, [[]], { origin: "A2" });

        // Prepare table data (headers + rows)
        let tableData = [];
        for (let r = 0; r < table.rows.length; r++) {
            let rowData = [];
            for (let c = 0; c < table.rows[r].cells.length; c++) {
                rowData.push(table.rows[r].cells[c].innerText.trim());
            }
            tableData.push(rowData);
        }

        // Add table data starting at row 3 (index 2)
        XLSX.utils.sheet_add_aoa(ws, tableData, { origin: "A3" });

        XLSX.utils.book_append_sheet(wb, ws, "Sheet1");
        XLSX.writeFile(wb, "Physical-Progress-Report.xlsx");
    });
}

function fetchSectorData(response) {
    // Clear any existing rows in the table

    $('#SectorWiseDataBody').empty();

    // Check if there is valid data
    if (response && response.length > 0) {
        var i = 1;
        response.forEach(function (item) {
            // Create a new table row

            var row = '<tr class="highlight-row">' +
                '<td>' + i++ + '</td>' +
                '<td>' + item.SectorName + '</td>' +
                '<td style="text-align: center;">' + item.TotalProject + '</td>' +
                '<td style="text-align: right;">' + item.CumCost + ' <b>(' + item.CumRevCost + ')</b></td>' +
                '<td style="text-align: right;">' + item.CumExpen + '</td>' +
                '</tr>';
            // Append the row to the table body
            $('#SectorWiseDataBody').append(row);
        });
    } else {
        // If no data, show a message in the table
        var row = '<tr><td colspan="3">No data available</td></tr>';
        $('#SectorWiseDataBody').append(row);
    }

    $(document).off("click", "#downloadCSV1").on("click", "#downloadCSV1", function () {
        const table = document.querySelector("#SectorWiseDataBody");

        if (!table || table.rows.length === 0) {
            alert('No data to download.');
            return;
        }

        let csv = [];

        // Prepare filters text
        let filtersTextArr = [];
        $('#filters .filter-row').each(function () {
            let field = $(this).find('.field').val();
            let op = $(this).find('.operator').val();
            let val = $(this).find('.value').val();

            if (field && op && val) {
                let displayName = fieldDisplayNames[field] || field;
                filtersTextArr.push(`${displayName} ${op} ${val}`);
            }
        });

        // Build the title line with filters (if any)
        let titleLine = "Sector Wise Details";
        if (filtersTextArr.length > 0) {
            titleLine += " - " + filtersTextArr.join(', ');
        }

        // Add the title + filters line as first row in CSV (quoted)
        csv.push(`"${titleLine}"`);

        // Empty row after title line
        csv.push("");

        // Now add the table header and rows
        for (let row of table.rows) {
            let rowData = [];
            for (let cell of row.cells) {
                let text = cell.innerText.replace(/"/g, '""').trim();
                rowData.push(`"${text}"`);
            }
            csv.push(rowData.join(","));
        }

        const csvContent = csv.join("\n");
        const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
        const url = URL.createObjectURL(blob);

        const link = document.createElement('a');
        link.setAttribute('href', url);
        link.setAttribute('download', 'Sector-Wise-Report.csv');
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    });


    $(document).off("click", "#downloadXLS1").on("click", "#downloadXLS1", function () {
        const table = document.querySelector("#SectorWiseDataBody");
        if (!table || table.rows.length === 0) {
            alert('No data to download.');
            return;
        }

        const wb = XLSX.utils.book_new();
        const ws = XLSX.utils.aoa_to_sheet([]); // empty sheet

        const columnCount = table.rows[0].cells.length;

        // Prepare filters text for the header
        let filtersTextArr = [];
        $('#filters .filter-row').each(function () {
            let field = $(this).find('.field').val();
            let op = $(this).find('.operator').val();
            let val = $(this).find('.value').val();

            if (field && op && val) {
                let displayName = fieldDisplayNames[field] || field;
                filtersTextArr.push(`${displayName} ${op} ${val}`);
            }
        });

        const filtersText = filtersTextArr.length > 0 ? ` - ${filtersTextArr.join(', ')}` : "";
        const fullTitle = `Physical Progress ${filtersText}`;

        // Add the combined title + filters as first row (A1)
        XLSX.utils.sheet_add_aoa(ws, [[fullTitle]], { origin: "A1" });

        // Merge title cell across all columns
        ws['!merges'] = ws['!merges'] || [];
        ws['!merges'].push({
            s: { r: 0, c: 0 },
            e: { r: 0, c: columnCount - 1 }
        });

        // Style the title cell (bold, white text, blue background, centered)
        const titleCell = XLSX.utils.encode_cell({ r: 0, c: 0 });
        if (!ws[titleCell]) ws[titleCell] = { t: 's', v: fullTitle };
        ws[titleCell].s = {
            font: { bold: true, sz: 14, color: { rgb: "FFFFFF" } },
            alignment: { horizontal: "center", vertical: "center", wrapText: true },
            fill: { fgColor: { rgb: "4F81BD" } }
        };

        // Add an empty row after title (row 2 / index 1)
        XLSX.utils.sheet_add_aoa(ws, [[]], { origin: "A2" });

        // Prepare table data (headers + rows)
        let tableData = [];
        for (let r = 0; r < table.rows.length; r++) {
            let rowData = [];
            for (let c = 0; c < table.rows[r].cells.length; c++) {
                rowData.push(table.rows[r].cells[c].innerText.trim());
            }
            tableData.push(rowData);
        }

        // Add table data starting at row 3 (index 2)
        XLSX.utils.sheet_add_aoa(ws, tableData, { origin: "A3" });

        XLSX.utils.book_append_sheet(wb, ws, "Sheet1");
        XLSX.writeFile(wb, "Sector-Wise-Report.xlsx");
    });

}
function fetchRevisedData(response) {
    // Clear any existing rows in the table

    $('#RevisedDataBody').empty();

    // Check if there is valid data
    if (response && response.length > 0) {
        var i = 1;
        response.forEach(function (item) {
            // Create a new table row

            var row = '<tr class="highlight-row">' +
                '<td>' + i++ + '</td>' +
                '<td>' + item.StateName + '</td>' +
                '<td style="text-align: center;">' + item.TotalProject + '</td>' +
                '<td style="text-align: right;">' + item.CumCost + ' <b>(' + item.CumRevCost + ')</b></td>' +
                '<td style="text-align: right;">' + item.CumExpen + '</td>' +
                '</tr>';
            // Append the row to the table body
            $('#RevisedDataBody').append(row);
        });
    } else {
        // If no data, show a message in the table
        var row = '<tr><td colspan="3">No data available</td></tr>';
        $('#RevisedDataBody').append(row);
    }

    $(document).off("click", "#downloadCSV4").on("click", "#downloadCSV4", function () {
        const table = document.querySelector("#RevisedDataBody");

        if (!table || table.rows.length === 0) {
            alert('No data to download.');
            return;
        }

        let csv = [];

        // Prepare filters text
        let filtersTextArr = [];
        $('#filters .filter-row').each(function () {
            let field = $(this).find('.field').val();
            let op = $(this).find('.operator').val();
            let val = $(this).find('.value').val();

            if (field && op && val) {
                let displayName = fieldDisplayNames[field] || field;
                filtersTextArr.push(`${displayName} ${op} ${val}`);
            }
        });

        // Build the title line with filters (if any)
        let titleLine = "State Wise Details";
        if (filtersTextArr.length > 0) {
            titleLine += " - " + filtersTextArr.join(', ');
        }

        // Add the title + filters line as first row in CSV (quoted)
        csv.push(`"${titleLine}"`);

        // Empty row after title line
        csv.push("");

        // Now add the table header and rows
        for (let row of table.rows) {
            let rowData = [];
            for (let cell of row.cells) {
                let text = cell.innerText.replace(/"/g, '""').trim();
                rowData.push(`"${text}"`);
            }
            csv.push(rowData.join(","));
        }

        const csvContent = csv.join("\n");
        const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
        const url = URL.createObjectURL(blob);

        const link = document.createElement('a');
        link.setAttribute('href', url);
        link.setAttribute('download', 'State-Wise-Report.csv');
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    });


    $(document).off("click", "#downloadXLS4").on("click", "#downloadXLS4", function () {
        const table = document.querySelector("#RevisedDataBody");
        if (!table || table.rows.length === 0) {
            alert('No data to download.');
            return;
        }

        const wb = XLSX.utils.book_new();
        const ws = XLSX.utils.aoa_to_sheet([]); // empty sheet

        const columnCount = table.rows[0].cells.length;

        // Prepare filters text for the header
        let filtersTextArr = [];
        $('#filters .filter-row').each(function () {
            let field = $(this).find('.field').val();
            let op = $(this).find('.operator').val();
            let val = $(this).find('.value').val();

            if (field && op && val) {
                let displayName = fieldDisplayNames[field] || field;
                filtersTextArr.push(`${displayName} ${op} ${val}`);
            }
        });

        const filtersText = filtersTextArr.length > 0 ? ` - ${filtersTextArr.join(', ')}` : "";
        const fullTitle = `Cost Wise Report ${filtersText}`;

        // Add the combined title + filters as first row (A1)
        XLSX.utils.sheet_add_aoa(ws, [[fullTitle]], { origin: "A1" });

        // Merge title cell across all columns
        ws['!merges'] = ws['!merges'] || [];
        ws['!merges'].push({
            s: { r: 0, c: 0 },
            e: { r: 0, c: columnCount - 1 }
        });

        // Style the title cell (bold, white text, blue background, centered)
        const titleCell = XLSX.utils.encode_cell({ r: 0, c: 0 });
        if (!ws[titleCell]) ws[titleCell] = { t: 's', v: fullTitle };
        ws[titleCell].s = {
            font: { bold: true, sz: 14, color: { rgb: "FFFFFF" } },
            alignment: { horizontal: "center", vertical: "center", wrapText: true },
            fill: { fgColor: { rgb: "4F81BD" } }
        };

        // Add an empty row after title (row 2 / index 1)
        XLSX.utils.sheet_add_aoa(ws, [[]], { origin: "A2" });

        // Prepare table data (headers + rows)
        let tableData = [];
        for (let r = 0; r < table.rows.length; r++) {
            let rowData = [];
            for (let c = 0; c < table.rows[r].cells.length; c++) {
                rowData.push(table.rows[r].cells[c].innerText.trim());
            }
            tableData.push(rowData);
        }

        // Add table data starting at row 3 (index 2)
        XLSX.utils.sheet_add_aoa(ws, tableData, { origin: "A3" });

        XLSX.utils.book_append_sheet(wb, ws, "Sheet1");
        XLSX.writeFile(wb, "Cost-Wise-Report.xlsx");
    });
}

function fetchCostEvaluationData(response) {
    // Clear any existing rows in the table
    $('#CostEvaluationTBody').empty();

    const format = new Intl.NumberFormat('en-IN', {
        minimumFractionDigits: 0
    });

    // Ensure response has at least one record
    if (response && response.length > 0) {
        const item = response[0]; // your JSON has only one object

        const row = `
            <tr class="highlight-row">
                <td></td>
                
                <td>â¹ ${format.format(item.OriginalCost || 0)}</td>
                <td>â¹ ${format.format(item.RevisedCost || 0)}</td>
                <td>â¹ ${format.format(item.CummulativeExpenditure || 0)}</td>
            </tr>
        `;

        $('#CostEvaluationTBody').append(row);
    } else {
        // If no data, show a message in the table
        $('#CostEvaluationTBody').append('<tr><td colspan="4">No data available</td></tr>');
    }

    $(document).off("click", "#downloadCSV2").on("click", "#downloadCSV2", function () {
        const table = document.querySelector("#CostEvaluationTBody");

        if (!table || table.rows.length === 0) {
            alert('No data to download.');
            return;
        }

        let csv = [];

        // Prepare filters text
        let filtersTextArr = [];
        $('#filters .filter-row').each(function () {
            let field = $(this).find('.field').val();
            let op = $(this).find('.operator').val();
            let val = $(this).find('.value').val();

            if (field && op && val) {
                let displayName = fieldDisplayNames[field] || field;
                filtersTextArr.push(`${displayName} ${op} ${val}`);
            }
        });

        // Build the title line with filters (if any)
        let titleLine = "Cost Wise Details";
        if (filtersTextArr.length > 0) {
            titleLine += " - " + filtersTextArr.join(', ');
        }

        // Add the title + filters line as first row in CSV (quoted)
        csv.push(`"${titleLine}"`);

        // Empty row after title line
        csv.push("");

        // Now add the table header and rows
        for (let row of table.rows) {
            let rowData = [];
            for (let cell of row.cells) {
                let text = cell.innerText.replace(/"/g, '""').trim();
                rowData.push(`"${text}"`);
            }
            csv.push(rowData.join(","));
        }

        const csvContent = csv.join("\n");
        const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
        const url = URL.createObjectURL(blob);

        const link = document.createElement('a');
        link.setAttribute('href', url);
        link.setAttribute('download', 'Cost-Wise-Report.csv');
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    });


    $(document).off("click", "#downloadXLS2").on("click", "#downloadXLS2", function () {
        const table = document.querySelector("#CostEvaluationTBody");
        if (!table || table.rows.length === 0) {
            alert('No data to download.');
            return;
        }

        const wb = XLSX.utils.book_new();
        const ws = XLSX.utils.aoa_to_sheet([]); // empty sheet

        const columnCount = table.rows[0].cells.length;

        // Prepare filters text for the header
        let filtersTextArr = [];
        $('#filters .filter-row').each(function () {
            let field = $(this).find('.field').val();
            let op = $(this).find('.operator').val();
            let val = $(this).find('.value').val();

            if (field && op && val) {
                let displayName = fieldDisplayNames[field] || field;
                filtersTextArr.push(`${displayName} ${op} ${val}`);
            }
        });

        const filtersText = filtersTextArr.length > 0 ? ` - ${filtersTextArr.join(', ')}` : "";
        const fullTitle = `Cost Wise Report ${filtersText}`;

        // Add the combined title + filters as first row (A1)
        XLSX.utils.sheet_add_aoa(ws, [[fullTitle]], { origin: "A1" });

        // Merge title cell across all columns
        ws['!merges'] = ws['!merges'] || [];
        ws['!merges'].push({
            s: { r: 0, c: 0 },
            e: { r: 0, c: columnCount - 1 }
        });

        // Style the title cell (bold, white text, blue background, centered)
        const titleCell = XLSX.utils.encode_cell({ r: 0, c: 0 });
        if (!ws[titleCell]) ws[titleCell] = { t: 's', v: fullTitle };
        ws[titleCell].s = {
            font: { bold: true, sz: 14, color: { rgb: "FFFFFF" } },
            alignment: { horizontal: "center", vertical: "center", wrapText: true },
            fill: { fgColor: { rgb: "4F81BD" } }
        };

        // Add an empty row after title (row 2 / index 1)
        XLSX.utils.sheet_add_aoa(ws, [[]], { origin: "A2" });

        // Prepare table data (headers + rows)
        let tableData = [];
        for (let r = 0; r < table.rows.length; r++) {
            let rowData = [];
            for (let c = 0; c < table.rows[r].cells.length; c++) {
                rowData.push(table.rows[r].cells[c].innerText.trim());
            }
            tableData.push(rowData);
        }

        // Add table data starting at row 3 (index 2)
        XLSX.utils.sheet_add_aoa(ws, tableData, { origin: "A3" });

        XLSX.utils.book_append_sheet(wb, ws, "Sheet1");
        XLSX.writeFile(wb, "Cost-Wise-Report.xlsx");
    });
}

