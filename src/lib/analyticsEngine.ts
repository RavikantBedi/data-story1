import { CleanedData, ChartConfig, ChartInsight } from '@/types/analytics';
import * as ss from 'simple-statistics';

const CHART_COLORS = [
  'hsl(173, 80%, 40%)',  // Teal
  'hsl(262, 83%, 58%)',  // Purple
  'hsl(38, 92%, 50%)',   // Amber
  'hsl(340, 82%, 52%)',  // Rose
  'hsl(200, 95%, 48%)',  // Blue
];

export function generateCharts(data: CleanedData): ChartConfig[] {
  const charts: ChartConfig[] = [];
  const numericColumns = data.columns.filter(c => c.type === 'numeric');
  const categoricalColumns = data.columns.filter(c => c.type === 'categorical');
  const dateColumns = data.columns.filter(c => c.type === 'datetime');
  
  // Time series charts
  if (dateColumns.length > 0 && numericColumns.length > 0) {
    const dateCol = dateColumns[0];
    numericColumns.slice(0, 3).forEach((numCol, idx) => {
      const chartData = data.rows.map(row => ({
        x: row[dateCol.name],
        y: row[numCol.name],
        [dateCol.name]: row[dateCol.name],
        [numCol.name]: row[numCol.name],
      }));
      
      const insights = detectInsights(chartData.map(d => d.y as number), numCol.name);
      
      charts.push({
        id: `line-${numCol.name}`,
        type: 'line',
        title: `${formatColumnName(numCol.name)} Over Time`,
        xAxis: dateCol.name,
        yAxis: numCol.name,
        data: chartData,
        insights,
      });
    });
  }
  
  // Bar charts for categorical comparisons
  if (categoricalColumns.length > 0 && numericColumns.length > 0) {
    const catCol = categoricalColumns[0];
    const numCol = numericColumns[0];
    
    // Aggregate by category
    const aggregated = new Map<string, number[]>();
    data.rows.forEach(row => {
      const cat = String(row[catCol.name]);
      const val = row[numCol.name] as number;
      if (!aggregated.has(cat)) aggregated.set(cat, []);
      aggregated.get(cat)!.push(val);
    });
    
    const chartData = Array.from(aggregated.entries()).map(([category, values]) => ({
      x: category,
      y: ss.mean(values),
      [catCol.name]: category,
      [numCol.name]: ss.mean(values),
    }));
    
    charts.push({
      id: `bar-${catCol.name}-${numCol.name}`,
      type: 'bar',
      title: `${formatColumnName(numCol.name)} by ${formatColumnName(catCol.name)}`,
      xAxis: catCol.name,
      yAxis: numCol.name,
      data: chartData.slice(0, 10), // Limit to top 10
      insights: detectBarInsights(chartData, numCol.name),
    });
  }
  
  // Pie chart for distribution
  if (categoricalColumns.length > 0) {
    const catCol = categoricalColumns[0];
    const counts = new Map<string, number>();
    data.rows.forEach(row => {
      const cat = String(row[catCol.name]);
      counts.set(cat, (counts.get(cat) || 0) + 1);
    });
    
    const chartData = Array.from(counts.entries())
      .map(([name, value]) => ({ name, value }))
      .sort((a, b) => b.value - a.value)
      .slice(0, 6);
    
    charts.push({
      id: `pie-${catCol.name}`,
      type: 'pie',
      title: `Distribution of ${formatColumnName(catCol.name)}`,
      xAxis: 'name',
      yAxis: 'value',
      data: chartData,
      insights: detectDistributionInsights(chartData),
    });
  }
  
  // Additional numeric comparison
  if (numericColumns.length >= 2 && !dateColumns.length) {
    const col1 = numericColumns[0];
    const col2 = numericColumns[1];
    
    const chartData = data.rows.slice(0, 50).map((row, i) => ({
      x: i,
      [col1.name]: row[col1.name],
      [col2.name]: row[col2.name],
    }));
    
    charts.push({
      id: `area-comparison`,
      type: 'area',
      title: `${formatColumnName(col1.name)} vs ${formatColumnName(col2.name)}`,
      xAxis: 'index',
      yAxis: col1.name,
      data: chartData,
      insights: [],
    });
  }
  
  return charts;
}

function detectInsights(values: number[], columnName: string): ChartInsight[] {
  const insights: ChartInsight[] = [];
  
  if (values.length < 3) return insights;
  
  const mean = ss.mean(values);
  const stdDev = ss.standardDeviation(values);
  
  // Detect spikes and drops
  values.forEach((val, i) => {
    if (i === 0) return;
    
    const prev = values[i - 1];
    const change = ((val - prev) / Math.abs(prev || 1)) * 100;
    
    if (change > 30) {
      insights.push({
        type: 'spike',
        severity: change > 50 ? 'high' : 'medium',
        description: `Spike of ${change.toFixed(1)}% detected at position ${i + 1}`,
        dataPoint: { x: i, y: val },
      });
    } else if (change < -30) {
      insights.push({
        type: 'drop',
        severity: change < -50 ? 'high' : 'medium',
        description: `Drop of ${Math.abs(change).toFixed(1)}% detected at position ${i + 1}`,
        dataPoint: { x: i, y: val },
      });
    }
    
    // Detect anomalies
    if (Math.abs(val - mean) > 2 * stdDev) {
      insights.push({
        type: 'anomaly',
        severity: Math.abs(val - mean) > 3 * stdDev ? 'high' : 'medium',
        description: `Anomalous value (${val.toFixed(2)}) deviates significantly from mean (${mean.toFixed(2)})`,
        dataPoint: { x: i, y: val },
      });
    }
  });
  
  // Detect overall trend
  const firstHalf = ss.mean(values.slice(0, Math.floor(values.length / 2)));
  const secondHalf = ss.mean(values.slice(Math.floor(values.length / 2)));
  const trendChange = ((secondHalf - firstHalf) / Math.abs(firstHalf || 1)) * 100;
  
  if (Math.abs(trendChange) > 15) {
    insights.push({
      type: 'trend',
      severity: 'medium',
      description: trendChange > 0 
        ? `Overall upward trend: ${trendChange.toFixed(1)}% increase`
        : `Overall downward trend: ${Math.abs(trendChange).toFixed(1)}% decrease`,
    });
  }
  
  return insights.slice(0, 5);
}

function detectBarInsights(data: any[], yAxis: string): ChartInsight[] {
  const insights: ChartInsight[] = [];
  
  if (data.length < 2) return insights;
  
  const values = data.map(d => d[yAxis] || d.y);
  const max = Math.max(...values);
  const min = Math.min(...values);
  const maxItem = data.find(d => (d[yAxis] || d.y) === max);
  const minItem = data.find(d => (d[yAxis] || d.y) === min);
  
  if (maxItem) {
    insights.push({
      type: 'spike',
      severity: 'medium',
      description: `Highest value: "${maxItem.x}" with ${max.toFixed(2)}`,
      dataPoint: { x: maxItem.x, y: max },
    });
  }
  
  if (minItem && max !== min) {
    insights.push({
      type: 'drop',
      severity: 'low',
      description: `Lowest value: "${minItem.x}" with ${min.toFixed(2)}`,
      dataPoint: { x: minItem.x, y: min },
    });
  }
  
  return insights;
}

function detectDistributionInsights(data: { name: string; value: number }[]): ChartInsight[] {
  const insights: ChartInsight[] = [];
  const total = data.reduce((sum, d) => sum + d.value, 0);
  
  const dominant = data[0];
  if (dominant && dominant.value / total > 0.4) {
    insights.push({
      type: 'spike',
      severity: 'medium',
      description: `"${dominant.name}" dominates with ${((dominant.value / total) * 100).toFixed(1)}% of total`,
    });
  }
  
  return insights;
}

function formatColumnName(name: string): string {
  return name
    .replace(/_/g, ' ')
    .replace(/\b\w/g, c => c.toUpperCase());
}

export function generateExplanation(
  chart: ChartConfig, 
  dataPoint: { x: any; y: any }
): string {
  const yValue = typeof dataPoint.y === 'number' ? dataPoint.y.toFixed(2) : dataPoint.y;
  
  // Find position in data
  const index = chart.data.findIndex(d => 
    (d[chart.xAxis] === dataPoint.x || d.x === dataPoint.x) &&
    (d[chart.yAxis] === dataPoint.y || d.y === dataPoint.y)
  );
  
  let explanation = `At ${dataPoint.x}, the ${formatColumnName(chart.yAxis)} is ${yValue}. `;
  
  if (index > 0) {
    const prevValue = chart.data[index - 1][chart.yAxis] || chart.data[index - 1].y;
    if (typeof prevValue === 'number' && typeof dataPoint.y === 'number') {
      const change = ((dataPoint.y - prevValue) / Math.abs(prevValue || 1)) * 100;
      
      if (Math.abs(change) > 5) {
        explanation += change > 0
          ? `This represents a ${change.toFixed(1)}% increase from the previous period. `
          : `This represents a ${Math.abs(change).toFixed(1)}% decrease from the previous period. `;
      } else {
        explanation += `This is relatively stable compared to the previous period. `;
      }
    }
  }
  
  // Add context from column stats
  const values = chart.data.map(d => d[chart.yAxis] || d.y).filter(v => typeof v === 'number') as number[];
  if (values.length > 0) {
    const mean = ss.mean(values);
    const deviation = ((dataPoint.y as number) - mean) / mean * 100;
    
    if (deviation > 20) {
      explanation += `This value is ${deviation.toFixed(1)}% above the average, indicating strong performance.`;
    } else if (deviation < -20) {
      explanation += `This value is ${Math.abs(deviation).toFixed(1)}% below the average, suggesting potential concern.`;
    } else {
      explanation += `This value is close to the average performance.`;
    }
  }
  
  return explanation;
}
