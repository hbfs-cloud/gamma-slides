import Ajv from 'ajv';
import addFormats from 'ajv-formats';
import { readFileSync } from 'fs';
import { dirname, resolve } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const schema = JSON.parse(readFileSync(resolve(__dirname, 'deck.schema.json'), 'utf-8'));

const ajv = new Ajv({ allErrors: true, useDefaults: true, validateSchema: false });
addFormats(ajv);

const validate = ajv.compile(schema);

export function validateDeck(deck) {
  const schemaValid = validate(deck);
  const errors = [...(validate.errors || [])];

  if (schemaValid && Array.isArray(deck?.slides)) {
    const addError = (instancePath, message) => errors.push({ instancePath, message });
    const checkTable = (table, path) => {
      if (!table?.headers || !table?.rows) return;
      table.rows.forEach((row, rowIndex) => {
        if (row.length !== table.headers.length) {
          addError(`${path}/rows/${rowIndex}`, 'must have the same number of cells as table headers');
        }
      });
    };
    const checkChart = (chart, path) => {
      if (!chart?.data) return;
      const { data, options = {} } = chart;
      if (data.datasets && data.labels) {
        data.datasets.forEach((dataset, datasetIndex) => {
          if (dataset.values && dataset.values.length !== data.labels.length) {
            addError(`${path}/data/datasets/${datasetIndex}/values`, 'must have the same length as chart labels');
          }
        });
      }
      if (chart.type === 'heatmap') {
        if (data.y_labels && data.values?.length !== data.y_labels.length) {
          addError(`${path}/data/values`, 'must have one row per y-axis label');
        }
        data.values?.forEach((row, rowIndex) => {
          if (data.x_labels && row.length !== data.x_labels.length) {
            addError(`${path}/data/values/${rowIndex}`, 'must have one value per x-axis label');
          }
        });
      }
      if (chart.type === 'candlestick' || chart.type === 'stock') {
        const candles = data.datasets?.[0]?.values || data.values || [];
        candles.forEach((candle, candleIndex) => {
          if (!Array.isArray(candle) || candle.length !== 4) return;
          const [open, close, low, high] = candle;
          if (low > Math.min(open, close) || high < Math.max(open, close) || low > high) {
            addError(`${path}/data/values/${candleIndex}`, 'must use [open, close, low, high] with coherent bounds');
          }
        });
        if (!candles.length) addError(`${path}/data`, `${chart.type} requires OHLC values`);
        if (chart.type === 'stock' && data.volume?.length !== candles.length) {
          addError(`${path}/data/volume`, 'stock volume must have the same length as OHLC values');
        }
      }
      if (chart.type === 'market_depth' && (!data.bids?.length || !data.asks?.length)) {
        addError(`${path}/data`, 'market_depth requires bid and ask levels');
      }
      if (chart.type === 'boxplot') {
        if (!data.boxes?.length) addError(`${path}/data/boxes`, 'boxplot requires boxes');
        if (data.labels && data.boxes?.length !== data.labels.length) addError(`${path}/data/boxes`, 'must have one box per chart label');
        data.boxes?.forEach((box, boxIndex) => {
          if (box.some((value, valueIndex) => valueIndex > 0 && value < box[valueIndex - 1])) {
            addError(`${path}/data/boxes/${boxIndex}`, 'boxplot values must be ordered [min, q1, median, q3, max]');
          }
        });
      }
      if (chart.type === 'calendar_heatmap' && !data.calendar_values?.length) addError(`${path}/data/calendar_values`, 'calendar_heatmap requires dated values');
      if (chart.type === 'parallel') {
        if (!data.dimensions?.length || !data.rows?.length) addError(`${path}/data`, 'parallel requires dimensions and rows');
        data.rows?.forEach((row, rowIndex) => {
          if (row.length !== data.dimensions?.length) addError(`${path}/data/rows/${rowIndex}`, 'must have one value per parallel dimension');
        });
      }
      if (chart.type === 'sunburst' && !data.items?.length) addError(`${path}/data/items`, 'sunburst requires hierarchical items');
      if (chart.type === 'network' && (!data.graph_nodes?.length || !data.graph_links?.length)) addError(`${path}/data`, 'network requires graph_nodes and graph_links');
      if (chart.type === 'theme_river' && !data.streams?.length) addError(`${path}/data/streams`, 'theme_river requires streams');
      if (chart.type === 'fan') {
        const expected = data.labels?.length || 0;
        for (const field of ['lower', 'base', 'upper']) {
          if (!data[field]?.length || data[field].length !== expected) addError(`${path}/data/${field}`, 'must have the same length as fan chart labels');
        }
        data.labels?.forEach((_, index) => {
          if (data.lower?.[index] > data.base?.[index] || data.base?.[index] > data.upper?.[index]) {
            addError(`${path}/data/${index}`, 'fan values must satisfy lower <= base <= upper');
          }
        });
      }
      if (chart.type === 'gauge') {
        const min = options.min ?? 0;
        const max = options.max ?? 100;
        if (min >= max) addError(`${path}/options`, 'gauge min must be lower than max');
        if (Number.isFinite(data.value) && (data.value < min || data.value > max)) {
          addError(`${path}/data/value`, 'gauge value must stay between min and max');
        }
      }
    };
    const checkPanel = (panel, path) => {
      if (!panel) return;
      if (panel.type === 'chart') {
        if (!panel.chart) addError(path, 'chart panel requires chart');
        else checkChart(panel.chart, `${path}/chart`);
      }
      if (panel.type === 'table') {
        const table = panel.table || panel;
        if (!table.headers || !table.rows) addError(path, 'table panel requires headers and rows');
        else checkTable(table, panel.table ? `${path}/table` : path);
      }
      if (panel.type === 'bullets' && !panel.items?.length) addError(path, 'bullets panel requires items');
      if (panel.type === 'image' && !panel.image?.src) addError(path, 'image panel requires image.src');
      if (panel.type === 'metrics' && !panel.metrics?.length) addError(path, 'metrics panel requires metrics');
      if (panel.type === 'metric' && panel.value == null) addError(path, 'metric panel requires value');
    };

    deck.slides.forEach((slide, index) => {
      const path = `/slides/${index}`;
      const requireField = (field, predicate = value => value != null) => {
        if (!predicate(slide[field])) errors.push({ instancePath: path, message: `layout "${slide.layout}" requires ${field}` });
      };

      if (slide.layout === 'chart') requireField('chart');
      if (slide.layout === 'metrics') requireField('metrics', value => Array.isArray(value) && value.length > 0);
      if (slide.layout === 'table') requireField('table');
      if (slide.layout === 'image') requireField('image');
      if (slide.layout === 'quote') requireField('quote', value => typeof value === 'string' && value.length > 0);
      if (['agenda', 'bullets', 'timeline'].includes(slide.layout)) {
        requireField('items', value => Array.isArray(value) && value.length > 0);
      }
      if (slide.layout === 'dashboard') requireField('panels', value => Array.isArray(value) && value.length > 0);
      if (slide.layout === 'comparison') {
        requireField('columns', value => Array.isArray(value) && value.length >= 2);
      }
      if (slide.layout === 'split') {
        requireField('left');
        requireField('right');
      }

      if (slide.chart) checkChart(slide.chart, `${path}/chart`);
      if (slide.table) checkTable(slide.table, `${path}/table`);
      if (slide.layout === 'dashboard') slide.panels?.forEach((panel, panelIndex) => checkPanel(panel, `${path}/panels/${panelIndex}`));
      if (slide.layout === 'split') {
        checkPanel(slide.left, `${path}/left`);
        checkPanel(slide.right, `${path}/right`);
      }

      if (slide.layout === 'metrics' && slide.variant === 'hero' && (slide.metrics.length < 2 || slide.metrics.length > 4)) {
        addError(`${path}/metrics`, 'hero metrics require between 2 and 4 metrics');
      }
      if (slide.layout === 'agenda' && slide.variant === 'editorial' && slide.items.length > 6) {
        addError(`${path}/items`, 'editorial agenda supports at most 6 items');
      }
      if (slide.layout === 'bullets' && slide.variant === 'pillars' && slide.items.length > 6) {
        addError(`${path}/items`, 'pillars supports at most 6 items');
      }
      if (slide.layout === 'table' && slide.variant === 'editorial' && slide.table.rows.length > 10) {
        addError(`${path}/table/rows`, 'editorial table supports at most 10 rows');
      }
      if (slide.layout === 'quote' && slide.variant === 'editorial' && slide.quote.length > 320) {
        addError(`${path}/quote`, 'editorial quote supports at most 320 characters');
      }
      if (slide.layout === 'closing' && slide.variant === 'decisions' && (slide.items || []).length > 4) {
        addError(`${path}/items`, 'decisions closing supports at most 4 decisions');
      }
      if (slide.layout === 'comparison' && slide.variant === 'story') {
        if (slide.columns.length !== 2) addError(`${path}/columns`, 'story comparison requires exactly 2 columns');
        if (slide.columns.some(column => column.items.length > 7)) addError(`${path}/columns`, 'story comparison supports at most 7 rows');
      }
    });
  }

  return {
    valid: errors.length === 0,
    errors,
  };
}

export { schema };
