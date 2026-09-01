let chartCounter = 0;
let chartRegistry = [];

export function resetChartCounter() {
  chartCounter = 0;
  chartRegistry = [];
}

export function buildChartHTML(chartSpec) {
  const id = `chart_${chartCounter++}`;
  chartRegistry.push({ id, chartSpec });
  return {
    html: `<div class="chart-container"><div id="${id}" style="width: 100%; height: 100%; min-height: 280px;"></div></div>`,
    id,
    config: chartSpec,
  };
}

export function getRegisteredCharts(theme) {
  return chartRegistry.map(({ id, chartSpec }) => ({ id, config: applyPresentationChartGrammar(buildEChartsConfig(chartSpec, theme), theme) }));
}

function applyPresentationChartGrammar(config, theme) {
  const presentationTheme = theme.presentationTheme;
  if (!presentationTheme || !config) return config;

  config.textStyle = {
    ...(config.textStyle || {}),
    fontFamily: presentationTheme === 'analyst-proof' ? 'Archivo' : 'Azeret Mono',
  };
  config.animationDuration = 760;
  config.animationDurationUpdate = 360;
  config.animationEasing = 'cubicOut';
  config.animationEasingUpdate = 'cubicOut';
  config.stateAnimation = { duration: 240, easing: 'cubicOut' };
  config.tooltip = config.tooltip ? {
    ...config.tooltip,
    confine: true,
    transitionDuration: .14,
    order: 'valueDesc',
    extraCssText: 'box-shadow:0 14px 34px rgba(0,0,0,.28);border-radius:4px;',
  } : config.tooltip;
  config.axisPointer = config.axisPointer || {
    link: [{ xAxisIndex: 'all' }],
    label: { show: true, backgroundColor: theme.surface, color: theme.text, borderColor: theme.hairline, borderWidth: 1 },
    lineStyle: { color: theme.primary, width: 1, opacity: .62 },
    crossStyle: { color: theme.primary, width: 1, opacity: .62 },
  };

  const axes = [config.xAxis, config.yAxis]
    .flatMap(axis => Array.isArray(axis) ? axis : axis ? [axis] : []);
  const series = Array.isArray(config.series) ? config.series : [];
  series.forEach(item => {
    item.universalTransition = true;
    item.emphasis = { ...(item.emphasis || {}), focus: ['graph', 'sankey'].includes(item.type) ? 'adjacency' : 'series' };
    item.blur = {
      ...(item.blur || {}),
      itemStyle: { ...(item.blur?.itemStyle || {}), opacity: .2 },
      lineStyle: { ...(item.blur?.lineStyle || {}), opacity: .16 },
      areaStyle: { ...(item.blur?.areaStyle || {}), opacity: .08 },
    };
  });

  const loneLine = series.length === 1 && series[0]?.type === 'line' ? series[0] : null;
  if (loneLine) {
    loneLine.endLabel = {
      ...(loneLine.endLabel || {}), show: true, formatter: '{a}', color: theme.text,
      fontSize: 10, fontWeight: 650, distance: 8,
    };
    loneLine.labelLayout = { ...(loneLine.labelLayout || {}), moveOverlap: 'shiftY' };
  }

  if (presentationTheme === 'analyst-proof') {
    axes.forEach(axis => {
      if (axis.axisLine?.lineStyle) axis.axisLine.lineStyle.width = 1;
      if (axis.splitLine?.lineStyle) axis.splitLine.lineStyle.type = 'dashed';
    });
    series.forEach(item => {
      if (item.type === 'bar' && item.itemStyle) item.itemStyle.borderRadius = 0;
      if (item.type === 'line') {
        item.symbol = item.symbol === 'none' ? 'none' : 'emptyCircle';
        item.symbolSize = item.symbol === 'none' ? item.symbolSize : 6;
      }
    });
  }

  if (presentationTheme === 'cutting-room') {
    axes.forEach(axis => {
      if (axis.splitLine) axis.splitLine.show = false;
      if (axis.axisLine?.lineStyle) axis.axisLine.lineStyle.width = 1;
    });
    series.forEach(item => {
      if (item.type === 'bar') {
        if (item.itemStyle) item.itemStyle.borderRadius = 0;
        if (item.barWidth) item.barWidth = typeof item.barWidth === 'string' ? '46%' : item.barWidth;
        if (item.barMaxWidth) item.barMaxWidth = Math.max(item.barMaxWidth, 42);
      }
      if (item.type === 'line') {
        item.smooth = false;
        item.symbol = 'none';
        item.lineStyle = { ...(item.lineStyle || {}), width: 3 };
      }
    });
  }

  if (presentationTheme === 'signal-room') {
    axes.forEach(axis => {
      if (axis.axisLine?.lineStyle) axis.axisLine.lineStyle.opacity = .42;
      if (axis.splitLine?.lineStyle) axis.splitLine.lineStyle.opacity = .34;
    });
    series.forEach((item, index) => {
      if (item.type === 'bar' && item.itemStyle) item.itemStyle.borderRadius = 0;
      if (item.type === 'line') {
        item.symbol = index === 0 ? 'circle' : 'none';
        item.symbolSize = index === 0 ? 6 : item.symbolSize;
        item.lineStyle = { ...(item.lineStyle || {}), width: index === 0 ? 3.4 : 1.7, opacity: index === 0 ? 1 : .68 };
      }
    });
  }

  return config;
}

function compactNumber(value) {
  return new Intl.NumberFormat('en', { notation: 'compact', maximumFractionDigits: 1 }).format(value);
}

function staticFormat(value, format) {
  if (format === 'currency_m') {
    const amount = `$${(Math.abs(value) / 1_000_000).toFixed(value % 1_000_000 === 0 ? 0 : 1)}M`;
    return value < 0 ? `-${amount}` : amount;
  }
  if (format === 'currency_k') {
    const amount = `$${(Math.abs(value) / 1_000).toFixed(value % 1_000 === 0 ? 0 : 1)}K`;
    return value < 0 ? `-${amount}` : amount;
  }
  if (format === 'percent') return `${value}%`;
  return compactNumber(value);
}

function safeText(value, fallback = '') {
  return typeof value === 'string' ? value : fallback;
}

function safeTextValues(values) {
  return Array.isArray(values) ? values.map(value => safeText(value)) : [];
}

function safeNumber(value, fallback = null) {
  return typeof value === 'number' && Number.isFinite(value) ? value : fallback;
}

function safeNumberValues(values) {
  return Array.isArray(values) ? values.map(value => safeNumber(value)) : [];
}

function safeCandlestickValues(values) {
  if (!Array.isArray(values)) return [];
  return values
    .filter(value => Array.isArray(value) && value.length === 4 && value.every(item => safeNumber(item) !== null))
    .map(value => value.slice(0, 4));
}

function safeTupleValues(values, length) {
  if (!Array.isArray(values)) return [];
  return values
    .filter(value => Array.isArray(value) && value.length === length && value.every(item => safeNumber(item) !== null))
    .map(value => value.slice(0, length));
}

function safeNumericRows(values, minimumLength = 1) {
  if (!Array.isArray(values)) return [];
  return values
    .filter(value => Array.isArray(value) && value.length >= minimumLength && value.every(item => safeNumber(item) !== null))
    .map(value => value.map(item => Number(item)));
}

function movingAverage(values, period) {
  return values.map((_, index) => {
    if (index < period - 1) return null;
    const window = values.slice(index - period + 1, index + 1);
    return window.every(value => value !== null)
      ? window.reduce((sum, value) => sum + value, 0) / period
      : null;
  });
}

function exponentialAverage(values, period) {
  const multiplier = 2 / (period + 1);
  let previous = null;
  return values.map(value => {
    if (value === null) return null;
    previous = previous === null ? value : value * multiplier + previous * (1 - multiplier);
    return previous;
  });
}

function bollingerBands(values, period = 20, deviation = 2) {
  const middle = movingAverage(values, period);
  const upper = [];
  const lower = [];
  values.forEach((_, index) => {
    if (index < period - 1) {
      upper.push(null);
      lower.push(null);
      return;
    }
    const window = values.slice(index - period + 1, index + 1);
    if (window.some(value => value === null)) {
      upper.push(null);
      lower.push(null);
      return;
    }
    const mean = middle[index];
    const variance = window.reduce((sum, value) => sum + ((value - mean) ** 2), 0) / period;
    const width = Math.sqrt(variance) * deviation;
    upper.push(mean + width);
    lower.push(mean - width);
  });
  return { middle, upper, lower };
}

function relativeStrengthIndex(values, period = 14) {
  let gains = 0;
  let losses = 0;
  let averageGain = null;
  let averageLoss = null;
  return values.map((value, index) => {
    if (index === 0 || value === null || values[index - 1] === null) return null;
    const change = value - values[index - 1];
    const gain = Math.max(0, change);
    const loss = Math.max(0, -change);
    if (index <= period) {
      gains += gain;
      losses += loss;
      if (index < period) return null;
      averageGain = gains / period;
      averageLoss = losses / period;
    } else {
      averageGain = ((averageGain * (period - 1)) + gain) / period;
      averageLoss = ((averageLoss * (period - 1)) + loss) / period;
    }
    if (averageLoss === 0) return 100;
    const strength = averageGain / averageLoss;
    return 100 - (100 / (1 + strength));
  });
}

function onBalanceVolume(candles, volume) {
  let cumulative = 0;
  return candles.map((candle, index) => {
    if (index === 0) return cumulative;
    const currentClose = candle?.[1];
    const previousClose = candles[index - 1]?.[1];
    const currentVolume = volume[index] ?? 0;
    if (currentClose > previousClose) cumulative += currentVolume;
    else if (currentClose < previousClose) cumulative -= currentVolume;
    return cumulative;
  });
}

function safeTreemapItem(item) {
  if (!item || typeof item !== 'object' || Array.isArray(item) || typeof item.name !== 'string') return null;
  const value = safeNumber(item.value);
  const children = Array.isArray(item.children) ? item.children.map(safeTreemapItem).filter(Boolean) : [];
  if (value === null && children.length === 0) return null;
  return {
    name: item.name,
    ...(value === null ? {} : { value }),
    ...(children.length ? { children } : {}),
  };
}

export function buildEChartsConfig(chartSpec, theme) {
  const resolveColor = (c) => {
    if (!c) return theme.primary;
    if (c === 'primary') return theme.primary;
    if (c === 'secondary') return theme.secondary;
    if (c === 'accent') return theme.accent;
    if (typeof c === 'string' && /^#(?:[0-9a-f]{3}|[0-9a-f]{6})$/i.test(c)) return c;
    return theme.primary;
  };

  const palette = theme.aesthetic === 'editorial'
    ? [theme.primary, theme.secondary, '#76839A', '#9DA5B2', theme.accent, theme.positive, theme.negative, '#C2BEB4']
    : [theme.primary, theme.secondary, theme.accent, '#74B9FF', '#FFEAA7', '#FD79A8', '#00CEC9', '#E17055'];
  const data = chartSpec.data || {};
  const opts = chartSpec.options || {};
  const type = chartSpec.type;
  const labels = safeTextValues(data.labels);
  const datasets = Array.isArray(data.datasets)
    ? data.datasets.filter(dataset => dataset && typeof dataset === 'object' && !Array.isArray(dataset))
    : [];

  const baseOpts = {
    backgroundColor: 'transparent',
    animation: true,
    animationDuration: 800,
    animationEasing: 'cubicOut',
    textStyle: { fontFamily: theme.fontBody || 'Inter', color: theme.textMuted },
  };

  if (['doughnut', 'pie'].includes(type)) {
    const ds = datasets[0] || {};
    const values = safeNumberValues(ds.values);
    const colors = Array.isArray(ds.colors) ? ds.colors.map(resolveColor) : palette.slice(0, labels.length);
    const total = values.reduce((sum, value) => sum + (value || 0), 0);
    return {
      ...baseOpts,
      tooltip: { trigger: 'item', backgroundColor: theme.surface, borderColor: theme.primary + '40', textStyle: { color: theme.text } },
      legend: opts.show_legend === false ? undefined : {
        bottom: 10, textStyle: { color: theme.textMuted, fontSize: 11 },
        itemWidth: 12, itemHeight: 12, itemGap: 16,
      },
      title: type === 'doughnut' ? {
        text: staticFormat(total, opts.format_y), subtext: opts.center_label || 'Total',
        left: 'center', top: '34%',
        textStyle: { color: theme.text, fontSize: 22, fontWeight: 800, fontFamily: theme.fontHeading || 'Inter' },
        subtextStyle: { color: theme.textMuted, fontSize: 11, fontWeight: 600 },
      } : undefined,
      series: [{
        type: 'pie',
        radius: type === 'doughnut' ? ['50%', '78%'] : ['0%', '78%'],
        center: ['50%', '45%'],
        itemStyle: { borderRadius: theme.aesthetic === 'editorial' ? 1 : 6, borderColor: theme.background, borderWidth: theme.aesthetic === 'editorial' ? 2 : 3 },
        emphasis: {
          itemStyle: { shadowBlur: 20, shadowColor: 'rgba(0,0,0,0.3)' },
          scaleSize: 8,
        },
        label: { show: false },
        data: labels.map((label, i) => ({
          name: label,
          value: values[i] ?? 0,
          itemStyle: { color: colors[i] || palette[i] },
        })),
        animationType: 'scale',
        animationEasing: theme.aesthetic === 'editorial' ? 'cubicOut' : 'elasticOut',
        animationDelay: (idx) => idx * 100,
      }],
    };
  }

  if (type === 'bar') {
    const hasRightAxis = datasets.some(d => d.y_axis === 'right');
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
      __gammaFormatY: opts.format_y || 'compact',
      __gammaFormatYRight: opts.format_y_right || opts.format_y || 'compact',
      grid: { left: 62, right: hasRightAxis ? 62 : 30, top: 52, bottom: 34, containLabel: false },
      xAxis: {
        type: 'category', data: labels,
        axisLine: { lineStyle: { color: theme.textMuted + '40' } },
        axisLabel: { color: theme.textMuted, fontSize: 12, margin: 14 },
        axisTick: { show: false },
      },
      yAxis: [
        {
          type: 'value', position: 'left',
          axisLine: { show: false }, axisTick: { show: false },
          axisLabel: { color: theme.textMuted, fontSize: 12 },
          splitLine: { lineStyle: { color: theme.textMuted + '15' } },
        },
        ...(hasRightAxis ? [{
          type: 'value', position: 'right',
          axisLine: { show: false }, axisTick: { show: false },
          axisLabel: { color: theme.textMuted, fontSize: 12 },
          splitLine: { show: false },
        }] : []),
      ],
      series: datasets.map((ds, i) => ({
        name: safeText(ds.label, `Series ${i + 1}`),
        type: 'bar',
        stack: opts.stacked ? 'total' : undefined,
        yAxisIndex: ds.y_axis === 'right' ? 1 : 0,
        barWidth: datasets.length > 1 ? '35%' : '50%',
        itemStyle: {
          color: resolveColor(ds.color || palette[i]),
          borderRadius: theme.aesthetic === 'editorial' ? [2, 2, 0, 0] : [6, 6, 0, 0],
        },
        emphasis: { focus: 'series' },
        label: opts.show_values === false ? { show: false } : {
          show: true, position: 'top', color: theme.textMuted, fontSize: 11, fontWeight: 600,
        },
        data: safeNumberValues(ds.values).map((value, index) => ds.colors?.[index]
          ? { value, itemStyle: { color: resolveColor(ds.colors[index]) } }
          : value),
        animationDelay: (idx) => idx * 80,
      })),
    };
  }

  if (type === 'combo') {
    const hasRightAxis = datasets.some(dataset => dataset.y_axis === 'right');
    return {
      ...baseOpts,
      tooltip: { trigger: 'axis', backgroundColor: theme.surface, borderColor: theme.hairline || theme.primary + '30', textStyle: { color: theme.text } },
      legend: opts.show_legend === false ? undefined : { top: 4, right: 8, textStyle: { color: theme.textMuted, fontSize: 11 }, itemWidth: 14, itemHeight: 8 },
      __gammaFormatY: opts.format_y || 'compact',
      __gammaFormatYRight: opts.format_y_right || opts.format_y || 'compact',
      grid: { left: 60, right: hasRightAxis ? 62 : 26, top: 48, bottom: 36 },
      xAxis: { type: 'category', data: labels, axisTick: { show: false }, axisLine: { lineStyle: { color: theme.textMuted + '45' } }, axisLabel: { color: theme.textMuted, fontSize: 11, margin: 13 } },
      yAxis: [
        { type: 'value', axisLine: { show: false }, axisTick: { show: false }, axisLabel: { color: theme.textMuted, fontSize: 11 }, splitLine: { lineStyle: { color: theme.textMuted + '18' } } },
        ...(hasRightAxis ? [{ type: 'value', axisLine: { show: false }, axisTick: { show: false }, axisLabel: { color: theme.textMuted, fontSize: 11 }, splitLine: { show: false } }] : []),
      ],
      series: datasets.map((dataset, index) => {
        const seriesType = dataset.type || 'bar';
        const color = resolveColor(dataset.color || palette[index]);
        if (seriesType === 'line' || seriesType === 'area') {
          return {
            name: safeText(dataset.label, `Series ${index + 1}`), type: 'line', yAxisIndex: dataset.y_axis === 'right' ? 1 : 0,
            smooth: opts.smooth !== false, symbol: 'circle', symbolSize: 7,
            lineStyle: { width: 2.5, color, type: dataset.dashed ? 'dashed' : 'solid' }, itemStyle: { color },
            areaStyle: seriesType === 'area' ? { color: color + '18' } : undefined,
            data: safeNumberValues(dataset.values),
          };
        }
        return {
          name: safeText(dataset.label, `Series ${index + 1}`), type: 'bar', yAxisIndex: dataset.y_axis === 'right' ? 1 : 0,
          barMaxWidth: 34, itemStyle: { color, borderRadius: [2, 2, 0, 0] },
          data: safeNumberValues(dataset.values).map((value, valueIndex) => dataset.colors?.[valueIndex] ? { value, itemStyle: { color: resolveColor(dataset.colors[valueIndex]) } } : value),
        };
      }),
    };
  }

  if (type === 'waterfall') {
    const dataset = datasets[0] || {};
    const values = safeNumberValues(dataset.values);
    const totalIndexes = new Set(opts.total_indices || [0, Math.max(0, values.length - 1)]);
    let running = 0;
    const helper = [];
    const visible = [];
    values.forEach((raw, index) => {
      const value = Number(raw || 0);
      if (totalIndexes.has(index)) {
        helper.push(0);
        visible.push({ value: Math.abs(value), raw: value, itemStyle: { color: index === values.length - 1 ? theme.primary : theme.text } });
        running = value;
      } else if (value >= 0) {
        helper.push(running);
        visible.push({ value, raw: value, itemStyle: { color: theme.positive } });
        running += value;
      } else {
        helper.push(running + value);
        visible.push({ value: Math.abs(value), raw: value, itemStyle: { color: theme.negative } });
        running += value;
      }
    });
    return {
      ...baseOpts,
      __gammaFormatY: opts.format_y || 'compact',
      __gammaWaterfall: true,
      tooltip: { trigger: 'axis', backgroundColor: theme.surface, borderColor: theme.hairline || theme.primary + '30', textStyle: { color: theme.text } },
      grid: { left: 62, right: 22, top: 26, bottom: 52 },
      xAxis: { type: 'category', data: labels, axisTick: { show: false }, axisLine: { lineStyle: { color: theme.textMuted + '45' } }, axisLabel: { color: theme.textMuted, fontSize: 10, interval: 0, width: 90, overflow: 'break', lineHeight: 14, margin: 14 } },
      yAxis: { type: 'value', axisLine: { show: false }, axisTick: { show: false }, axisLabel: { color: theme.textMuted, fontSize: 11 }, splitLine: { lineStyle: { color: theme.textMuted + '18' } } },
      series: [
        { type: 'bar', stack: 'bridge', silent: true, itemStyle: { color: 'transparent' }, emphasis: { disabled: true }, data: helper },
        { name: safeText(dataset.label, 'Bridge'), type: 'bar', stack: 'bridge', barMaxWidth: 52, itemStyle: { borderRadius: [2,2,0,0] }, label: { show: true, position: 'top', color: theme.text, fontSize: 11, fontWeight: 600 }, data: visible },
      ],
    };
  }

  if (type === 'heatmap') {
    const xLabels = safeTextValues(data.x_labels?.length ? data.x_labels : labels);
    const yLabels = safeTextValues(data.y_labels);
    const values = (Array.isArray(data.values) ? data.values : [])
      .flatMap((row, y) => Array.isArray(row)
        ? row.map((value, x) => safeNumber(value) === null ? null : [x, y, value])
        : [])
      .filter(Boolean);
    const numeric = values.map(point => Number(point[2]));
    const min = opts.min ?? (numeric.length ? Math.min(...numeric) : 0);
    const max = opts.max ?? (numeric.length ? Math.max(...numeric) : 1);
    return {
      ...baseOpts,
      tooltip: { position: 'top', backgroundColor: theme.surface, borderColor: theme.hairline || theme.primary + '30', textStyle: { color: theme.text } },
      grid: { left: 82, right: 20, top: 18, bottom: 54 },
      xAxis: { type: 'category', data: xLabels, splitArea: { show: true }, axisLine: { show: false }, axisTick: { show: false }, axisLabel: { color: theme.textMuted, fontSize: 10 } },
      yAxis: { type: 'category', data: yLabels, splitArea: { show: true }, axisLine: { show: false }, axisTick: { show: false }, axisLabel: { color: theme.textMuted, fontSize: 10 } },
      visualMap: { min, max, calculable: false, orient: 'horizontal', left: 'center', bottom: 4, itemWidth: 12, itemHeight: 120, text: opts.legend_labels || [String(max), String(min)], textGap: 8, textStyle: { color: theme.textMuted, fontSize: 9 }, inRange: { color: opts.correlation ? [theme.negative, theme.surfaceLight, theme.positive] : [theme.surfaceLight, theme.primary] } },
      series: [{ type: 'heatmap', data: values, label: { show: opts.show_values !== false, color: theme.text, fontSize: 9 }, itemStyle: { borderColor: theme.background, borderWidth: 2 }, emphasis: { itemStyle: { borderColor: theme.text, borderWidth: 1 } } }],
    };
  }

  if (['scatter', 'bubble'].includes(type)) {
    const pointDatasets = datasets.length ? datasets : [{ label: data.label, points: Array.isArray(data.points) ? data.points : [] }];
    const points = pointDatasets
      .flatMap(dataset => Array.isArray(dataset.points) ? dataset.points : [])
      .filter(point => point && typeof point === 'object' && !Array.isArray(point));
    const xValues = points.map(point => safeNumber(point.x)).filter(value => value !== null);
    const yValues = points.map(point => safeNumber(point.y)).filter(value => value !== null);
    const xMax = xValues.length ? Math.max(...xValues) : null;
    const yMax = yValues.length ? Math.max(...yValues) : null;
    return {
      ...baseOpts,
      __gammaFormatX: opts.format_x || 'compact',
      __gammaFormatY: opts.format_y || 'compact',
      tooltip: { trigger: 'item', backgroundColor: theme.surface, borderColor: theme.hairline || theme.primary + '30', textStyle: { color: theme.text } },
      legend: pointDatasets.length > 1 && opts.show_legend !== false ? { top: 2, right: 6, textStyle: { color: theme.textMuted, fontSize: 10 } } : undefined,
      grid: { left: 62, right: 44, top: 54, bottom: 48 },
      xAxis: { type: 'value', min: opts.x_min, max: opts.x_max ?? (xMax == null ? undefined : xMax * 1.12), name: opts.x_label || '', nameLocation: 'middle', nameGap: 32, nameTextStyle: { color: theme.textMuted, fontSize: 10 }, axisLine: { lineStyle: { color: theme.textMuted + '45' } }, axisTick: { show: false }, axisLabel: { color: theme.textMuted, fontSize: 10 }, splitLine: { lineStyle: { color: theme.textMuted + '18' } } },
      yAxis: { type: 'value', min: opts.y_min, max: opts.y_max ?? (yMax == null ? undefined : yMax * 1.08), name: opts.y_label || '', nameLocation: 'middle', nameGap: 42, nameTextStyle: { color: theme.textMuted, fontSize: 10 }, axisLine: { show: false }, axisTick: { show: false }, axisLabel: { color: theme.textMuted, fontSize: 10 }, splitLine: { lineStyle: { color: theme.textMuted + '18' } } },
      series: pointDatasets.map((dataset, index) => ({
        name: safeText(dataset.label, `Series ${index + 1}`), type: 'scatter',
        symbolSize: type === 'bubble' ? '__gammaBubbleSize' : 12,
        itemStyle: { color: resolveColor(dataset.color || palette[index]), opacity: .82 },
        label: { show: true, formatter: '{b}', position: 'top', color: theme.textMuted, fontSize: 9 },
        labelLayout: { hideOverlap: true, moveOverlap: 'shiftY' }, clip: false,
        data: (Array.isArray(dataset.points) ? dataset.points : [])
          .filter(point => point && typeof point === 'object' && safeNumber(point.x) !== null && safeNumber(point.y) !== null)
          .map(point => ({ name: safeText(point.name, safeText(point.label)), value: [point.x, point.y, safeNumber(point.size, 1)], label: { show: Boolean(point.highlight || opts.show_all_labels) }, itemStyle: point.color ? { color: resolveColor(point.color) } : undefined })),
      })),
    };
  }

  if (type === 'stock') {
    const candles = safeCandlestickValues(datasets[0]?.values || data.values);
    const volume = safeNumberValues(data.volume || datasets[1]?.values).slice(0, candles.length);
    const closes = candles.map(candle => safeNumber(candle[1]));
    const periods = Array.isArray(opts.moving_averages)
      ? opts.moving_averages.filter(period => Number.isInteger(period) && period >= 2 && period <= 200).slice(0, 4)
      : [5, 10, 20];
    const emaFast = exponentialAverage(closes, 12);
    const emaSlow = exponentialAverage(closes, 26);
    const macd = emaFast.map((value, index) => value === null || emaSlow[index] === null ? null : value - emaSlow[index]);
    const macdSignal = exponentialAverage(macd, 9);
    const macdHistogram = macd.map((value, index) => value === null || macdSignal[index] === null ? null : value - macdSignal[index]);
    const bollingerPeriod = Number.isInteger(opts.bollinger_period) ? opts.bollinger_period : 20;
    const bollingerDeviation = safeNumber(opts.bollinger_deviation, 2);
    const bollinger = bollingerBands(closes, bollingerPeriod, bollingerDeviation);
    const rsiPeriod = Number.isInteger(opts.rsi_period) ? opts.rsi_period : 14;
    const rsi = relativeStrengthIndex(closes, rsiPeriod);
    const obv = onBalanceVolume(candles, volume);
    const volumeData = volume.map((value, index) => ({
      value,
      itemStyle: { color: candles[index]?.[1] >= candles[index]?.[0] ? theme.positive + '90' : theme.negative + '90' },
    }));
    const macdData = macdHistogram.map(value => value === null ? null : ({ value, itemStyle: { color: value >= 0 ? theme.positive : theme.negative } }));
    const showMacd = opts.show_macd !== false;
    const showRsi = opts.show_rsi !== false;
    const showBollinger = opts.show_bollinger !== false;
    const showObv = opts.show_obv !== false;
    const grids = showMacd && showRsi
      ? [{ left: 58, right: 22, top: 34, height: '42%' }, { left: 58, right: 22, top: '53%', height: '9%' }, { left: 58, right: 22, top: '66%', height: '9%' }, { left: 58, right: 22, top: '79%', height: '9%' }]
      : (showMacd || showRsi)
        ? [{ left: 58, right: 22, top: 34, height: '51%' }, { left: 58, right: 22, top: '62%', height: '11%' }, { left: 58, right: 22, top: '78%', height: '10%' }]
        : [{ left: 58, right: 22, top: 34, height: '60%' }, { left: 58, right: 22, top: '72%', height: '16%' }];
    const macdAxisIndex = showMacd ? 2 : null;
    const rsiAxisIndex = showRsi ? (showMacd ? 3 : 2) : null;
    const panelIndices = grids.map((_, index) => index);
    const obvYAxisIndex = panelIndices.length;
    return {
      ...baseOpts,
      tooltip: { trigger: 'axis', axisPointer: { type: 'cross' }, backgroundColor: theme.surface, borderColor: theme.hairline || theme.primary + '30', textStyle: { color: theme.text } },
      axisPointer: { link: [{ xAxisIndex: 'all' }] },
      legend: { top: 0, right: 8, data: ['OHLC', ...periods.map(period => `MA${period}`), ...(showBollinger ? ['Bollinger'] : []), ...(showObv ? ['OBV'] : [])], textStyle: { color: theme.textMuted, fontSize: 9 }, itemWidth: 14, itemHeight: 8 },
      grid: grids,
      xAxis: panelIndices.map(index => ({
        type: 'category', data: labels, gridIndex: index, boundaryGap: true,
        axisLine: { lineStyle: { color: theme.textMuted + '45' } }, axisTick: { show: false },
        axisLabel: { show: index === panelIndices.at(-1), color: theme.textMuted, fontSize: 8, hideOverlap: true },
        min: 'dataMin', max: 'dataMax',
      })),
      yAxis: [...panelIndices.map((index) => ({
        scale: index !== rsiAxisIndex, min: index === rsiAxisIndex ? 0 : undefined, max: index === rsiAxisIndex ? 100 : undefined,
        interval: index === rsiAxisIndex ? 50 : undefined, gridIndex: index, axisLine: { show: false }, axisTick: { show: false },
        axisLabel: { show: index === 0 || index === rsiAxisIndex, color: theme.textMuted, fontSize: index === rsiAxisIndex ? 7 : 9 },
        splitLine: { show: index === 0 || index === rsiAxisIndex, lineStyle: { color: theme.textMuted + '16' } },
      })), ...(showObv ? [{ gridIndex: 1, position: 'right', scale: true, axisLine: { show: false }, axisTick: { show: false }, axisLabel: { show: false }, splitLine: { show: false } }] : [])],
      dataZoom: [
        { type: 'inside', xAxisIndex: panelIndices, start: Math.max(0, 100 - Math.min(100, 6000 / Math.max(labels.length, 1))), end: 100 },
        { type: 'slider', xAxisIndex: panelIndices, bottom: 2, height: 14, borderColor: 'transparent', fillerColor: theme.primary + '18', handleStyle: { color: theme.primary }, textStyle: { color: theme.textMuted, fontSize: 8 } },
      ],
      series: [
        { name: 'OHLC', type: 'candlestick', data: candles, itemStyle: { color: theme.positive, color0: theme.negative, borderColor: theme.positive, borderColor0: theme.negative } },
        ...periods.map((period, index) => ({
          name: `MA${period}`, type: 'line', data: movingAverage(closes, period), showSymbol: false, smooth: false,
          lineStyle: { width: 1.4, color: palette[(index + 1) % palette.length] }, itemStyle: { color: palette[(index + 1) % palette.length] },
        })),
        ...(showBollinger ? [
          { name: 'Bollinger', type: 'line', data: bollinger.upper, showSymbol: false, smooth: false, silent: true, lineStyle: { width: 1, type: 'dashed', color: theme.forecast + 'B8' } },
          { name: 'Bollinger', type: 'line', data: bollinger.lower, showSymbol: false, smooth: false, silent: true, lineStyle: { width: 1, type: 'dashed', color: theme.forecast + 'B8' } },
        ] : []),
        { name: 'Volume', type: 'bar', xAxisIndex: 1, yAxisIndex: 1, data: volumeData, barWidth: '58%' },
        ...(showObv ? [{ name: 'OBV', type: 'line', xAxisIndex: 1, yAxisIndex: obvYAxisIndex, data: obv, showSymbol: false, smooth: false, lineStyle: { width: 1.4, color: theme.accent }, itemStyle: { color: theme.accent } }] : []),
        ...(showMacd ? [
          { name: 'MACD histogram', type: 'bar', xAxisIndex: macdAxisIndex, yAxisIndex: macdAxisIndex, data: macdData, barWidth: '58%' },
          { name: 'MACD', type: 'line', xAxisIndex: macdAxisIndex, yAxisIndex: macdAxisIndex, data: macd, showSymbol: false, smooth: false, lineStyle: { width: 1.2, color: theme.primary } },
          { name: 'Signal', type: 'line', xAxisIndex: macdAxisIndex, yAxisIndex: macdAxisIndex, data: macdSignal, showSymbol: false, smooth: false, lineStyle: { width: 1.1, color: theme.negative } },
        ] : []),
        ...(showRsi ? [{
          name: `RSI ${rsiPeriod}`, type: 'line', xAxisIndex: rsiAxisIndex, yAxisIndex: rsiAxisIndex, data: rsi, showSymbol: false, smooth: false,
          lineStyle: { width: 1.5, color: theme.secondary },
          markLine: { silent: true, symbol: 'none', label: { show: false }, lineStyle: { width: 1, type: 'dashed', color: theme.textMuted + '75' }, data: [{ yAxis: 30 }, { yAxis: 70 }] },
          markArea: { silent: true, itemStyle: { color: theme.negative + '0C' }, data: [[{ yAxis: 70 }, { yAxis: 100 }]] },
        }] : []),
      ],
    };
  }

  if (type === 'market_depth') {
    const bids = safeTupleValues(data.bids, 2).sort((a, b) => a[0] - b[0]);
    const asks = safeTupleValues(data.asks, 2).sort((a, b) => a[0] - b[0]);
    return {
      ...baseOpts,
      tooltip: { trigger: 'axis', axisPointer: { type: 'cross' }, backgroundColor: theme.surface, borderColor: theme.hairline || theme.primary + '30', textStyle: { color: theme.text } },
      legend: { top: 4, right: 8, data: ['Bid depth', 'Ask depth'], textStyle: { color: theme.textMuted, fontSize: 10 } },
      grid: { left: 62, right: 28, top: 46, bottom: 44 },
      xAxis: { type: 'value', name: opts.x_label || 'Price', nameLocation: 'middle', nameGap: 28, axisLine: { lineStyle: { color: theme.textMuted + '45' } }, axisTick: { show: false }, axisLabel: { color: theme.textMuted, fontSize: 10 }, splitLine: { lineStyle: { color: theme.textMuted + '14' } } },
      yAxis: { type: 'value', name: opts.y_label || 'Cumulative size', nameTextStyle: { color: theme.textMuted, fontSize: 9 }, axisLine: { show: false }, axisTick: { show: false }, axisLabel: { color: theme.textMuted, fontSize: 10 }, splitLine: { lineStyle: { color: theme.textMuted + '14' } } },
      series: [
        { name: 'Bid depth', type: 'line', step: 'end', showSymbol: false, data: bids, lineStyle: { width: 2, color: theme.positive }, itemStyle: { color: theme.positive }, areaStyle: { color: theme.positive + '28' } },
        { name: 'Ask depth', type: 'line', step: 'start', showSymbol: false, data: asks, lineStyle: { width: 2, color: theme.negative }, itemStyle: { color: theme.negative }, areaStyle: { color: theme.negative + '28' } },
      ],
    };
  }

  if (type === 'boxplot') {
    const boxes = safeTupleValues(data.boxes, 5);
    const outliers = safeTupleValues(data.outliers, 2);
    return {
      ...baseOpts,
      tooltip: { trigger: 'item', backgroundColor: theme.surface, borderColor: theme.hairline || theme.primary + '30', textStyle: { color: theme.text } },
      grid: { left: 62, right: 26, top: 28, bottom: 46 },
      xAxis: { type: 'category', data: labels, boundaryGap: true, axisLine: { lineStyle: { color: theme.textMuted + '45' } }, axisTick: { show: false }, axisLabel: { color: theme.textMuted, fontSize: 10 } },
      yAxis: { type: 'value', scale: true, axisLine: { show: false }, axisTick: { show: false }, axisLabel: { color: theme.textMuted, fontSize: 10 }, splitLine: { lineStyle: { color: theme.textMuted + '16' } } },
      series: [
        { name: safeText(data.label, 'Distribution'), type: 'boxplot', data: boxes, itemStyle: { color: theme.primary + '24', borderColor: theme.primary, borderWidth: 1.5 } },
        ...(outliers.length ? [{ name: 'Outliers', type: 'scatter', data: outliers, symbolSize: 7, itemStyle: { color: theme.negative } }] : []),
      ],
    };
  }

  if (type === 'histogram') {
    const values = safeNumberValues(datasets[0]?.values);
    const thresholdIndex = Number.isInteger(opts.threshold_index) ? opts.threshold_index : null;
    return {
      ...baseOpts,
      tooltip: { trigger: 'axis', axisPointer: { type: 'shadow' }, backgroundColor: theme.surface, borderColor: theme.hairline || theme.primary + '30', textStyle: { color: theme.text } },
      grid: { left: 58, right: 24, top: 28, bottom: 46 },
      xAxis: { type: 'category', data: labels, boundaryGap: true, axisLine: { lineStyle: { color: theme.textMuted + '45' } }, axisTick: { show: false }, axisLabel: { color: theme.textMuted, fontSize: 9, interval: Math.max(0, Math.floor(labels.length / 8) - 1) } },
      yAxis: { type: 'value', name: opts.y_label || 'Frequency', nameTextStyle: { color: theme.textMuted, fontSize: 9 }, axisLine: { show: false }, axisTick: { show: false }, axisLabel: { color: theme.textMuted, fontSize: 9 }, splitLine: { lineStyle: { color: theme.textMuted + '16' } } },
      series: [{
        name: safeText(datasets[0]?.label, 'Observations'), type: 'bar', barCategoryGap: '4%',
        itemStyle: { color: theme.primary, borderRadius: [1, 1, 0, 0] }, data: values,
        markLine: thresholdIndex !== null && labels[thresholdIndex] ? { silent: true, symbol: 'none', lineStyle: { color: theme.negative, type: 'dashed', width: 1.5 }, label: { formatter: safeText(opts.threshold_label, 'Threshold'), color: theme.negative, fontSize: 9 }, data: [{ xAxis: labels[thresholdIndex] }] } : undefined,
      }],
    };
  }

  if (type === 'calendar_heatmap') {
    const values = (Array.isArray(data.calendar_values) ? data.calendar_values : [])
      .filter(item => item && typeof item === 'object' && typeof item.date === 'string' && safeNumber(item.value) !== null)
      .map(item => [item.date, item.value]);
    const numbers = values.map(item => item[1]);
    const range = Array.isArray(opts.range) && opts.range.length === 2 && opts.range.every(value => typeof value === 'string')
      ? opts.range.slice(0, 2)
      : safeText(opts.range, values[0]?.[0]?.slice(0, 4) || String(new Date().getFullYear()));
    return {
      ...baseOpts,
      tooltip: { position: 'top', backgroundColor: theme.surface, borderColor: theme.hairline || theme.primary + '30', textStyle: { color: theme.text } },
      visualMap: { min: opts.min ?? Math.min(...numbers, 0), max: opts.max ?? Math.max(...numbers, 1), calculable: false, orient: 'horizontal', left: 'center', bottom: 2, itemWidth: 12, itemHeight: 110, textStyle: { color: theme.textMuted, fontSize: 9 }, inRange: { color: [theme.surfaceLight, theme.primary] } },
      calendar: { top: 38, left: 58, right: 24, bottom: 42, range, cellSize: ['auto', 18], splitLine: { lineStyle: { color: theme.background, width: 3 } }, itemStyle: { color: theme.surfaceLight, borderColor: theme.background, borderWidth: 2 }, yearLabel: { color: theme.text, fontSize: 12 }, monthLabel: { color: theme.textMuted, fontSize: 9 }, dayLabel: { color: theme.textMuted, fontSize: 9 } },
      series: [{ type: 'heatmap', coordinateSystem: 'calendar', data: values }],
    };
  }

  if (type === 'parallel') {
    const dimensions = safeTextValues(data.dimensions);
    const rows = safeNumericRows(data.rows, dimensions.length || 1);
    return {
      ...baseOpts,
      tooltip: { trigger: 'item', backgroundColor: theme.surface, borderColor: theme.hairline || theme.primary + '30', textStyle: { color: theme.text } },
      parallelAxis: dimensions.map((dimension, index) => ({ dim: index, name: dimension, nameTextStyle: { color: theme.text, fontSize: 10 }, axisLabel: { color: theme.textMuted, fontSize: 8 }, axisLine: { lineStyle: { color: theme.textMuted + '45' } }, splitLine: { lineStyle: { color: theme.textMuted + '16' } } })),
      parallel: { left: 58, right: 38, top: 42, bottom: 38, parallelAxisDefault: { type: 'value', nameLocation: 'end', nameGap: 12 } },
      series: [{ name: safeText(data.label, 'Scenarios'), type: 'parallel', lineStyle: { width: 2, opacity: .55, color: theme.primary }, emphasis: { lineStyle: { width: 4, opacity: 1 } }, data: rows }],
    };
  }

  if (type === 'sunburst') {
    const items = (Array.isArray(data.items) ? data.items : []).map(safeTreemapItem).filter(Boolean);
    return {
      ...baseOpts,
      tooltip: { trigger: 'item', backgroundColor: theme.surface, borderColor: theme.hairline || theme.primary + '30', textStyle: { color: theme.text } },
      series: [{
        type: 'sunburst', radius: ['10%', '88%'], center: ['50%', '49%'], sort: null,
        data: items, label: { color: theme.text, fontSize: 9, rotate: 'radial', minAngle: 8 },
        itemStyle: { borderColor: theme.background, borderWidth: 2 },
        emphasis: { focus: 'ancestor' }, levels: [{}, { r0: '10%', r: '42%', itemStyle: { borderWidth: 3 } }, { r0: '42%', r: '70%' }, { r0: '70%', r: '88%', label: { position: 'outside', rotate: 0 } }],
      }],
    };
  }

  if (type === 'network') {
    const categories = safeTextValues(data.categories);
    const categoryIndex = new Map(categories.map((name, index) => [name, index]));
    const nodes = (Array.isArray(data.graph_nodes) ? data.graph_nodes : []).map(node => {
      if (!node || typeof node !== 'object' || Array.isArray(node) || typeof node.name !== 'string') return null;
      const value = safeNumber(node.value, 1);
      const category = typeof node.category === 'string' ? categoryIndex.get(node.category) : safeNumber(node.category, 0);
      return { name: node.name, value, category: Number.isInteger(category) ? category : 0, symbolSize: Math.max(18, Math.min(56, 14 + Math.sqrt(Math.max(0, value)) * 5)) };
    }).filter(Boolean);
    const nodeNames = new Set(nodes.map(node => node.name));
    const links = (Array.isArray(data.graph_links) ? data.graph_links : []).map(link => {
      if (!link || typeof link !== 'object' || Array.isArray(link)) return null;
      const source = safeText(link.source); const target = safeText(link.target); const value = safeNumber(link.value, 1);
      return nodeNames.has(source) && nodeNames.has(target) ? { source, target, value, lineStyle: { width: Math.max(1, Math.min(8, Math.sqrt(Math.max(0, value)))) } } : null;
    }).filter(Boolean);
    return {
      ...baseOpts,
      tooltip: { trigger: 'item', backgroundColor: theme.surface, borderColor: theme.hairline || theme.primary + '30', textStyle: { color: theme.text } },
      legend: categories.length ? { top: 2, right: 6, data: categories, textStyle: { color: theme.textMuted, fontSize: 9 } } : undefined,
      series: [{
        type: 'graph', layout: 'circular', circular: { rotateLabel: false }, roam: false, draggable: false,
        data: nodes, links, categories: categories.map((name, index) => ({ name, itemStyle: { color: palette[index % palette.length] } })),
        label: { show: true, position: 'right', color: theme.text, fontSize: 9 },
        lineStyle: { color: 'source', curveness: .14, opacity: .35 }, emphasis: { focus: 'adjacency' },
      }],
    };
  }

  if (type === 'theme_river') {
    const streams = (Array.isArray(data.streams) ? data.streams : [])
      .filter(item => item && typeof item === 'object' && typeof item.date === 'string' && typeof item.name === 'string' && safeNumber(item.value) !== null)
      .map(item => [item.date, item.value, item.name]);
    return {
      ...baseOpts,
      tooltip: { trigger: 'axis', axisPointer: { type: 'line' }, backgroundColor: theme.surface, borderColor: theme.hairline || theme.primary + '30', textStyle: { color: theme.text } },
      legend: { top: 2, right: 6, textStyle: { color: theme.textMuted, fontSize: 9 } },
      singleAxis: { top: 42, bottom: 34, type: 'time', axisLine: { lineStyle: { color: theme.textMuted + '45' } }, axisTick: { show: false }, axisLabel: { color: theme.textMuted, fontSize: 9 } },
      series: [{ type: 'themeRiver', data: streams, emphasis: { focus: 'series' }, label: { show: true, color: theme.text, fontSize: 9 }, itemStyle: { opacity: .78 } }],
      color: palette,
    };
  }

  if (type === 'fan') {
    const lower = safeNumberValues(data.lower);
    const upper = safeNumberValues(data.upper);
    const base = safeNumberValues(data.base);
    const band = upper.map((value, index) => value === null || lower[index] === null ? null : Math.max(0, value - lower[index]));
    return {
      ...baseOpts,
      __gammaFormatY: opts.format_y || 'compact',
      tooltip: { trigger: 'axis', backgroundColor: theme.surface, borderColor: theme.hairline || theme.primary + '30', textStyle: { color: theme.text } },
      legend: { top: 2, right: 6, data: ['Base case', 'Forecast range'], textStyle: { color: theme.textMuted, fontSize: 9 } },
      grid: { left: 62, right: 28, top: 44, bottom: 38 },
      xAxis: { type: 'category', data: labels, boundaryGap: false, axisLine: { lineStyle: { color: theme.textMuted + '45' } }, axisTick: { show: false }, axisLabel: { color: theme.textMuted, fontSize: 10 } },
      yAxis: { type: 'value', scale: true, axisLine: { show: false }, axisTick: { show: false }, axisLabel: { color: theme.textMuted, fontSize: 10 }, splitLine: { lineStyle: { color: theme.textMuted + '16' } } },
      series: [
        { name: '_lower', type: 'line', stack: 'confidence', data: lower, symbol: 'none', lineStyle: { opacity: 0 }, areaStyle: { opacity: 0 }, silent: true },
        { name: 'Forecast range', type: 'line', stack: 'confidence', data: band, symbol: 'none', lineStyle: { opacity: 0 }, areaStyle: { color: theme.forecast + '38' }, silent: true },
        { name: 'Base case', type: 'line', data: base, showSymbol: true, symbolSize: 7, lineStyle: { color: theme.forecast, width: 2.5 }, itemStyle: { color: theme.forecast } },
      ],
    };
  }

  if (type === 'candlestick') {
    const candles = safeCandlestickValues(datasets[0]?.values || data.values);
    const volumeValues = safeNumberValues(data.volume || datasets[1]?.values);
    const volume = volumeValues.length ? volumeValues : null;
    return {
      ...baseOpts,
      tooltip: { trigger: 'axis', axisPointer: { type: 'cross' }, backgroundColor: theme.surface, borderColor: theme.hairline || theme.primary + '30', textStyle: { color: theme.text } },
      axisPointer: { link: [{ xAxisIndex: 'all' }] },
      grid: volume ? [{ left: 58, right: 18, top: 20, height: '63%' }, { left: 58, right: 18, top: '76%', height: '14%' }] : { left: 58, right: 18, top: 20, bottom: 42 },
      xAxis: volume ? [0,1].map(index => ({ type: 'category', data: labels, gridIndex: index, boundaryGap: true, axisLine: { lineStyle: { color: theme.textMuted + '45' } }, axisTick: { show: false }, axisLabel: { show: index === 1, color: theme.textMuted, fontSize: 9 }, min: 'dataMin', max: 'dataMax' })) : { type: 'category', data: labels, boundaryGap: true, axisLine: { lineStyle: { color: theme.textMuted + '45' } }, axisTick: { show: false }, axisLabel: { color: theme.textMuted, fontSize: 9 }, min: 'dataMin', max: 'dataMax' },
      yAxis: volume ? [{ scale: true, gridIndex: 0, axisLabel: { color: theme.textMuted, fontSize: 9 }, splitLine: { lineStyle: { color: theme.textMuted + '16' } } }, { scale: true, gridIndex: 1, axisLabel: { show: false }, splitLine: { show: false } }] : { scale: true, axisLabel: { color: theme.textMuted, fontSize: 9 }, splitLine: { lineStyle: { color: theme.textMuted + '16' } } },
      dataZoom: opts.data_zoom ? [{ type: 'inside', xAxisIndex: volume ? [0,1] : [0] }] : undefined,
      series: [
        { name: safeText(datasets[0]?.label, 'OHLC'), type: 'candlestick', data: candles, itemStyle: { color: theme.positive, color0: theme.negative, borderColor: theme.positive, borderColor0: theme.negative } },
        ...(volume ? [{ name: 'Volume', type: 'bar', xAxisIndex: 1, yAxisIndex: 1, data: volume, itemStyle: { color: theme.primary + '70' } }] : []),
      ],
    };
  }

  if (type === 'treemap') {
    const items = (Array.isArray(data.items) ? data.items : []).map(safeTreemapItem).filter(Boolean);
    return {
      ...baseOpts,
      tooltip: { trigger: 'item', backgroundColor: theme.surface, borderColor: theme.hairline || theme.primary + '30', textStyle: { color: theme.text } },
      series: [{
        type: 'treemap', roam: false, nodeClick: false, breadcrumb: { show: false },
        label: { show: true, formatter: '{b}', color: theme.text, fontSize: 11, fontWeight: 600 },
        upperLabel: { show: true, height: 24, color: theme.text, fontSize: 10, fontWeight: 600 },
        itemStyle: { borderColor: theme.background, borderWidth: 3, gapWidth: 2 },
        levels: [{ itemStyle: { borderWidth: 0, gapWidth: 3 } }, { colorSaturation: [.25,.55], itemStyle: { borderWidth: 2, gapWidth: 2 } }],
        data: items, color: palette,
      }],
    };
  }

  if (type === 'gauge') {
    const value = safeNumber(data.value ?? datasets[0]?.values?.[0], 0);
    return {
      ...baseOpts,
      series: [{
        type: 'gauge', min: opts.min ?? 0, max: opts.max ?? 100, startAngle: 205, endAngle: -25,
        progress: { show: true, width: 14, itemStyle: { color: theme.primary } },
        axisLine: { lineStyle: { width: 14, color: [[1, theme.surfaceLight]] } },
        axisTick: { show: false }, splitLine: { show: false }, axisLabel: { show: false }, pointer: { show: false },
        anchor: { show: false }, title: { offsetCenter: [0, '42%'], color: theme.textMuted, fontSize: 11 },
        detail: { valueAnimation: true, offsetCenter: [0, '2%'], color: theme.text, fontFamily: theme.fontHeading, fontSize: 34, fontWeight: 650, formatter: `${staticFormat(value, opts.format_y)}${opts.suffix || ''}` },
        data: [{ value, name: safeText(data.label, safeText(opts.label)) }],
      }],
    };
  }

  if (type === 'sankey') {
    const nodes = (Array.isArray(data.nodes) ? data.nodes : []).map((node, index) => {
      const name = typeof node === 'string' ? node : safeText(node?.name);
      if (!name) return null;
      return { name, itemStyle: { color: palette[index % palette.length] } };
    }).filter(Boolean);
    const nodeNames = new Set(nodes.map(node => node.name));
    const links = (Array.isArray(data.links) ? data.links : []).map(link => {
      if (!link || typeof link !== 'object' || Array.isArray(link)) return null;
      const source = safeText(link.source);
      const target = safeText(link.target);
      const value = safeNumber(link.value);
      if (!nodeNames.has(source) || !nodeNames.has(target) || value === null) return null;
      return { source, target, value };
    }).filter(Boolean);
    return {
      ...baseOpts,
      tooltip: { trigger: 'item', backgroundColor: theme.surface, borderColor: theme.hairline || theme.primary + '30', textStyle: { color: theme.text } },
      series: [{
        type: 'sankey', left: 12, right: 132, top: 12, bottom: 12, nodeWidth: 10, nodeGap: 16, draggable: false,
        data: nodes,
        links,
        label: { color: theme.text, fontSize: 10 }, lineStyle: { color: 'gradient', curveness: .5, opacity: .35 },
        emphasis: { focus: 'adjacency' },
      }],
    };
  }

  if (type === 'funnel') {
    const dataset = datasets[0] || {};
    const values = safeNumberValues(dataset.values);
    return {
      ...baseOpts,
      tooltip: { trigger: 'item', backgroundColor: theme.surface, borderColor: theme.hairline || theme.primary + '30', textStyle: { color: theme.text } },
      series: [{
        type: 'funnel', left: '8%', width: '84%', top: 10, bottom: 10, minSize: '18%', maxSize: '100%', sort: 'descending', gap: 4,
        label: { show: true, position: 'inside', formatter: '{b}  {c}', color: theme.text, fontSize: 11, fontWeight: 600 },
        labelLine: { show: false }, itemStyle: { borderColor: theme.background, borderWidth: 2 },
        data: labels.map((label, index) => ({ name: label, value: values[index] ?? 0, itemStyle: { color: dataset.colors?.[index] ? resolveColor(dataset.colors[index]) : palette[index] } })),
      }],
    };
  }

  if (type === 'bullet') {
    const actual = safeNumberValues(datasets[0]?.values);
    const targets = safeNumberValues(data.targets || datasets[1]?.values);
    const max = opts.max || Math.max(...actual, ...targets, 1) * 1.15;
    return {
      ...baseOpts,
      __gammaFormatX: opts.format_y || 'compact',
      tooltip: { trigger: 'axis', axisPointer: { type: 'shadow' }, backgroundColor: theme.surface, borderColor: theme.hairline || theme.primary + '30', textStyle: { color: theme.text } },
      grid: { left: 130, right: 52, top: 18, bottom: 28 },
      xAxis: { type: 'value', max, axisLine: { show: false }, axisTick: { show: false }, axisLabel: { color: theme.textMuted, fontSize: 9 }, splitLine: { lineStyle: { color: theme.textMuted + '16' } } },
      yAxis: { type: 'category', data: labels, axisLine: { show: false }, axisTick: { show: false }, axisLabel: { color: theme.text, fontSize: 10 } },
      series: [
        { name: 'Actual', type: 'bar', barWidth: 14, itemStyle: { color: theme.primary, borderRadius: 1 }, label: { show: true, position: 'right', color: theme.text, fontSize: 10 }, data: actual },
        { name: 'Target', type: 'scatter', symbol: 'rect', symbolSize: [3, 24], itemStyle: { color: theme.text }, data: targets.map((target, index) => [target, index]) },
      ],
    };
  }

  if (type === 'tornado') {
    const downside = safeNumberValues(datasets[0]?.values);
    const upside = safeNumberValues(datasets[1]?.values);
    return {
      ...baseOpts,
      __gammaFormatX: opts.format_y || 'compact',
      tooltip: { trigger: 'axis', axisPointer: { type: 'shadow' }, backgroundColor: theme.surface, borderColor: theme.hairline || theme.primary + '30', textStyle: { color: theme.text } },
      legend: { top: 0, right: 4, textStyle: { color: theme.textMuted, fontSize: 10 } },
      grid: { left: 146, right: 58, top: 32, bottom: 24 },
      xAxis: { type: 'value', axisLabel: { color: theme.textMuted, fontSize: 9 }, splitLine: { lineStyle: { color: theme.textMuted + '18' } } },
      yAxis: { type: 'category', data: labels, axisLine: { show: false }, axisTick: { show: false }, axisLabel: { color: theme.text, fontSize: 10 } },
      series: [
        { name: safeText(datasets[0]?.label, 'Downside'), type: 'bar', stack: 'total', data: downside, itemStyle: { color: theme.negative }, label: { show: true, position: 'left', color: theme.negative, fontSize: 10 } },
        { name: safeText(datasets[1]?.label, 'Upside'), type: 'bar', stack: 'total', data: upside, itemStyle: { color: theme.positive }, label: { show: true, position: 'right', color: theme.positive, fontSize: 10 } },
      ],
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
      __gammaFormatY: opts.format_y || 'compact',
      grid: { left: 62, right: 30, top: 48, bottom: 34 },
      xAxis: {
        type: 'category', data: labels,
        axisLine: { lineStyle: { color: theme.textMuted + '40' } },
        axisLabel: { color: theme.textMuted, fontSize: 12, margin: 14 },
        axisTick: { show: false },
        boundaryGap: false,
      },
      yAxis: {
        type: 'value',
        min: opts.y_min,
        max: opts.y_max,
        axisLine: { show: false }, axisTick: { show: false },
        axisLabel: { color: theme.textMuted, fontSize: 12 },
        splitLine: { lineStyle: { color: theme.textMuted + '15' } },
      },
      series: datasets.map((ds, i) => ({
        name: safeText(ds.label, `Series ${i + 1}`),
        type: 'line',
        smooth: true,
        symbolSize: 8,
        lineStyle: { width: 3, color: resolveColor(ds.color || palette[i]), type: ds.dashed ? 'dashed' : 'solid' },
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
        data: safeNumberValues(ds.values),
        animationDelay: (idx) => idx * 60,
      })),
    };
  }

  if (type === 'radar') {
    const values = datasets.map(dataset => safeNumberValues(dataset.values));
    const numericValues = values.flat().filter(value => value !== null);
    const maxVal = Math.max(...numericValues, 1);
    const indicatorMax = typeof opts.max === 'number' && Number.isFinite(opts.max) ? opts.max : maxVal * 1.2;
    return {
      ...baseOpts,
      legend: datasets.length > 1 && opts.show_legend !== false
        ? { top: 2, right: 6, textStyle: { color: theme.textMuted, fontSize: 10 }, itemWidth: 12, itemHeight: 8 }
        : undefined,
      radar: {
        indicator: labels.map(label => ({ name: label, max: indicatorMax })),
        axisName: { color: theme.textMuted, fontSize: 11 },
        splitLine: { lineStyle: { color: theme.textMuted + '20' } },
        splitArea: { show: false },
        axisLine: { lineStyle: { color: theme.textMuted + '30' } },
      },
      series: [{
        type: 'radar',
        data: datasets.map((ds, i) => ({
          name: safeText(ds.label, `Series ${i + 1}`),
          value: values[i],
          lineStyle: { color: resolveColor(ds.color || palette[i]), width: 2 },
          itemStyle: { color: resolveColor(ds.color || palette[i]) },
          areaStyle: { color: resolveColor(ds.color || palette[i]) + '30' },
        })),
      }],
    };
  }

  // Fallback: bar
  return { ...baseOpts, xAxis: { type: 'category', data: labels }, yAxis: { type: 'value' }, series: [{ type: 'bar', data: safeNumberValues(datasets[0]?.values) }] };
}
