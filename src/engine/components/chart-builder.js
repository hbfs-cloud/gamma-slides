let chartCounter = 0;

export function resetChartCounter() {
  chartCounter = 0;
}

export function buildChartHTML(chartSpec) {
  const id = `chart_${chartCounter++}`;
  return {
    html: `<div class="chart-container"><div id="${id}" style="width: 100%; height: 100%; min-height: 280px;"></div></div>`,
    id,
    config: chartSpec,
  };
}

export function buildEChartsConfig(chartSpec, theme) {
  const resolveColor = (c) => {
    if (!c) return theme.primary;
    if (c === 'primary') return theme.primary;
    if (c === 'secondary') return theme.secondary;
    if (c === 'accent') return theme.accent;
    if (c.startsWith('#')) return c;
    return theme.primary;
  };

  const palette = [theme.primary, theme.secondary, theme.accent, '#74B9FF', '#FFEAA7', '#FD79A8', '#00CEC9', '#E17055'];
  const data = chartSpec.data;
  const opts = chartSpec.options || {};
  const type = chartSpec.type;

  const baseOpts = {
    backgroundColor: 'transparent',
    animation: true,
    animationDuration: 800,
    animationEasing: 'cubicOut',
    textStyle: { fontFamily: theme.fontBody || 'Inter', color: theme.textMuted },
  };

  if (['doughnut', 'pie'].includes(type)) {
    const ds = data.datasets?.[0] || {};
    const colors = ds.colors ? ds.colors.map(resolveColor) : palette.slice(0, data.labels?.length || 0);
    return {
      ...baseOpts,
      tooltip: { trigger: 'item', backgroundColor: theme.surface, borderColor: theme.primary + '40', textStyle: { color: theme.text } },
      legend: {
        bottom: 10, textStyle: { color: theme.textMuted, fontSize: 11 },
        itemWidth: 12, itemHeight: 12, itemGap: 16,
      },
      series: [{
        type: 'pie',
        radius: type === 'doughnut' ? ['50%', '78%'] : ['0%', '78%'],
        center: ['50%', '45%'],
        itemStyle: { borderRadius: 6, borderColor: theme.background, borderWidth: 3 },
        emphasis: {
          itemStyle: { shadowBlur: 20, shadowColor: 'rgba(0,0,0,0.3)' },
          scaleSize: 8,
        },
        label: { show: false },
        data: (data.labels || []).map((label, i) => ({
          name: label,
          value: ds.values?.[i] || 0,
          itemStyle: { color: colors[i] || palette[i] },
        })),
        animationType: 'scale',
        animationEasing: 'elasticOut',
        animationDelay: (idx) => idx * 100,
      }],
    };
  }

  if (type === 'bar') {
    const hasRightAxis = data.datasets?.some(d => d.y_axis === 'right');
    return {
      ...baseOpts,
      tooltip: {
        trigger: 'axis', backgroundColor: theme.surface, borderColor: theme.primary + '40',
        textStyle: { color: theme.text }, axisPointer: { type: 'shadow', shadowStyle: { color: 'rgba(150,150,150,0.08)' } },
      },
      legend: opts.show_legend !== false ? {
        top: 8, textStyle: { color: theme.textMuted, fontSize: 11 },
        itemWidth: 14, itemHeight: 10,
      } : undefined,
      grid: { left: 60, right: hasRightAxis ? 60 : 30, top: 40, bottom: 30, containLabel: false },
      xAxis: {
        type: 'category', data: data.labels || [],
        axisLine: { lineStyle: { color: theme.textMuted + '40' } },
        axisLabel: { color: theme.textMuted, fontSize: 11 },
        axisTick: { show: false },
      },
      yAxis: [
        {
          type: 'value', position: 'left',
          axisLine: { show: false }, axisTick: { show: false },
          axisLabel: { color: theme.textMuted, fontSize: 10 },
          splitLine: { lineStyle: { color: theme.textMuted + '15' } },
        },
        ...(hasRightAxis ? [{
          type: 'value', position: 'right',
          axisLine: { show: false }, axisTick: { show: false },
          axisLabel: { color: theme.textMuted, fontSize: 10 },
          splitLine: { show: false },
        }] : []),
      ],
      series: (data.datasets || []).map((ds, i) => ({
        name: ds.label || `Series ${i + 1}`,
        type: 'bar',
        yAxisIndex: ds.y_axis === 'right' ? 1 : 0,
        barWidth: data.datasets.length > 1 ? '35%' : '50%',
        itemStyle: {
          color: {
            type: 'linear', x: 0, y: 0, x2: 0, y2: 1,
            colorStops: [
              { offset: 0, color: resolveColor(ds.color || palette[i]) },
              { offset: 1, color: resolveColor(ds.color || palette[i]) + 'AA' },
            ],
          },
          borderRadius: [6, 6, 0, 0],
        },
        emphasis: { itemStyle: { shadowBlur: 12, shadowColor: resolveColor(ds.color || palette[i]) + '60' } },
        data: ds.values || [],
        animationDelay: (idx) => idx * 80,
      })),
    };
  }

  if (['line', 'area'].includes(type)) {
    return {
      ...baseOpts,
      tooltip: {
        trigger: 'axis', backgroundColor: theme.surface, borderColor: theme.primary + '40',
        textStyle: { color: theme.text },
      },
      legend: opts.show_legend !== false ? {
        top: 8, textStyle: { color: theme.textMuted, fontSize: 11 },
      } : undefined,
      grid: { left: 60, right: 30, top: 40, bottom: 30 },
      xAxis: {
        type: 'category', data: data.labels || [],
        axisLine: { lineStyle: { color: theme.textMuted + '40' } },
        axisLabel: { color: theme.textMuted, fontSize: 11 },
        axisTick: { show: false },
        boundaryGap: false,
      },
      yAxis: {
        type: 'value',
        axisLine: { show: false }, axisTick: { show: false },
        axisLabel: { color: theme.textMuted, fontSize: 10 },
        splitLine: { lineStyle: { color: theme.textMuted + '15' } },
      },
      series: (data.datasets || []).map((ds, i) => ({
        name: ds.label || `Series ${i + 1}`,
        type: 'line',
        smooth: true,
        symbolSize: 8,
        lineStyle: { width: 3, color: resolveColor(ds.color || palette[i]) },
        itemStyle: { color: resolveColor(ds.color || palette[i]) },
        areaStyle: type === 'area' ? {
          color: {
            type: 'linear', x: 0, y: 0, x2: 0, y2: 1,
            colorStops: [
              { offset: 0, color: resolveColor(ds.color || palette[i]) + '40' },
              { offset: 1, color: resolveColor(ds.color || palette[i]) + '05' },
            ],
          },
        } : undefined,
        emphasis: { focus: 'series' },
        data: ds.values || [],
        animationDelay: (idx) => idx * 60,
      })),
    };
  }

  if (type === 'radar') {
    const maxVal = Math.max(...(data.datasets || []).flatMap(d => d.values || []));
    return {
      ...baseOpts,
      radar: {
        indicator: (data.labels || []).map(l => ({ name: l, max: maxVal * 1.2 })),
        axisName: { color: theme.textMuted, fontSize: 11 },
        splitLine: { lineStyle: { color: theme.textMuted + '20' } },
        splitArea: { show: false },
        axisLine: { lineStyle: { color: theme.textMuted + '30' } },
      },
      series: [{
        type: 'radar',
        data: (data.datasets || []).map((ds, i) => ({
          name: ds.label,
          value: ds.values,
          lineStyle: { color: resolveColor(ds.color || palette[i]), width: 2 },
          itemStyle: { color: resolveColor(ds.color || palette[i]) },
          areaStyle: { color: resolveColor(ds.color || palette[i]) + '30' },
        })),
      }],
    };
  }

  // Fallback: bar
  return { ...baseOpts, xAxis: { type: 'category', data: data.labels || [] }, yAxis: { type: 'value' }, series: [{ type: 'bar', data: (data.datasets?.[0]?.values || []) }] };
}
