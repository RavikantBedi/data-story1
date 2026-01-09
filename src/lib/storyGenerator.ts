import { CleanedData, DataStory, ChartConfig } from '@/types/analytics';

export function generateDataStory(data: CleanedData, charts: ChartConfig[]): DataStory {
  const numericColumns = data.columns.filter(c => c.type === 'numeric');
  const categoricalColumns = data.columns.filter(c => c.type === 'categorical');
  
  // Generate overview
  const overview = generateOverview(data);
  
  // Extract key trends
  const keyTrends = extractKeyTrends(numericColumns, charts);
  
  // Identify anomalies
  const anomalies = extractAnomalies(charts);
  
  // Generate insights
  const insights = generateInsights(data, charts);
  
  // Create conclusion
  const conclusion = generateConclusion(keyTrends, anomalies, insights);
  
  return {
    title: `Data Analysis Report: ${data.rowCount} Records Analyzed`,
    overview,
    keyTrends,
    anomalies,
    insights,
    conclusion,
  };
}

function generateOverview(data: CleanedData): string {
  const numericCols = data.columns.filter(c => c.type === 'numeric');
  const categoricalCols = data.columns.filter(c => c.type === 'categorical');
  const dateCols = data.columns.filter(c => c.type === 'datetime');
  
  let overview = `This dataset contains ${data.rowCount.toLocaleString()} records across ${data.columnCount} variables. `;
  
  if (dateCols.length > 0) {
    overview += `The data appears to be time-series in nature, with temporal data in the "${formatColumnName(dateCols[0].name)}" column. `;
  }
  
  if (numericCols.length > 0) {
    overview += `There are ${numericCols.length} numeric measure${numericCols.length > 1 ? 's' : ''} available for analysis`;
    if (numericCols.length <= 3) {
      overview += `: ${numericCols.map(c => formatColumnName(c.name)).join(', ')}`;
    }
    overview += '. ';
  }
  
  if (categoricalCols.length > 0) {
    overview += `The data includes ${categoricalCols.length} categorical dimension${categoricalCols.length > 1 ? 's' : ''} for segmentation. `;
  }
  
  // Add data quality note
  const cleaningNotes = data.cleaningLog.length;
  if (cleaningNotes > 0) {
    overview += `During preprocessing, ${cleaningNotes} data quality issue${cleaningNotes > 1 ? 's were' : ' was'} automatically resolved.`;
  }
  
  return overview;
}

function extractKeyTrends(numericColumns: CleanedData['columns'], charts: ChartConfig[]): string[] {
  const trends: string[] = [];
  
  numericColumns.forEach(col => {
    if (col.stats?.trend) {
      const change = col.stats.percentChange;
      const changeText = change 
        ? ` (${change > 0 ? '+' : ''}${change.toFixed(1)}% overall change)`
        : '';
      
      trends.push(
        `${formatColumnName(col.name)} shows a ${col.stats.trend} trend${changeText}`
      );
    }
    
    if (col.stats?.mean && col.stats?.stdDev) {
      const cv = (col.stats.stdDev / col.stats.mean) * 100;
      if (cv > 30) {
        trends.push(
          `High variability detected in ${formatColumnName(col.name)} (CV: ${cv.toFixed(1)}%)`
        );
      }
    }
  });
  
  // Add chart-derived trends
  charts.forEach(chart => {
    const trendInsights = chart.insights.filter(i => i.type === 'trend');
    trendInsights.forEach(insight => {
      trends.push(insight.description);
    });
  });
  
  return [...new Set(trends)].slice(0, 5);
}

function extractAnomalies(charts: ChartConfig[]): string[] {
  const anomalies: string[] = [];
  
  charts.forEach(chart => {
    chart.insights
      .filter(i => i.type === 'anomaly' || i.type === 'spike' || i.type === 'drop')
      .filter(i => i.severity === 'high')
      .forEach(insight => {
        anomalies.push(insight.description);
      });
  });
  
  return [...new Set(anomalies)].slice(0, 4);
}

function generateInsights(data: CleanedData, charts: ChartConfig[]): string[] {
  const insights: string[] = [];
  const numericColumns = data.columns.filter(c => c.type === 'numeric');
  
  // Comparative insights
  if (numericColumns.length >= 2) {
    const col1 = numericColumns[0];
    const col2 = numericColumns[1];
    
    if (col1.stats?.mean && col2.stats?.mean) {
      const ratio = col1.stats.mean / col2.stats.mean;
      insights.push(
        `On average, ${formatColumnName(col1.name)} is ${ratio.toFixed(1)}x the value of ${formatColumnName(col2.name)}`
      );
    }
  }
  
  // Distribution insights
  numericColumns.forEach(col => {
    if (col.stats?.outliers && col.stats.outliers.length > 0) {
      const outlierCount = col.stats.outliers.length;
      const percentage = (outlierCount / (col.stats?.count || 1)) * 100;
      insights.push(
        `${outlierCount} outliers detected in ${formatColumnName(col.name)} (${percentage.toFixed(1)}% of data)`
      );
    }
    
    if (col.stats?.percentiles) {
      const skewness = col.stats.percentiles.p75 - col.stats.percentiles.p50 > 
                       col.stats.percentiles.p50 - col.stats.percentiles.p25
        ? 'right-skewed'
        : 'left-skewed';
      insights.push(
        `${formatColumnName(col.name)} distribution is ${skewness}`
      );
    }
  });
  
  // Category insights
  const categoricalColumns = data.columns.filter(c => c.type === 'categorical');
  categoricalColumns.forEach(col => {
    if (col.stats?.unique && col.stats.unique <= 5) {
      insights.push(
        `${formatColumnName(col.name)} has ${col.stats.unique} distinct categories`
      );
    }
  });
  
  return [...new Set(insights)].slice(0, 5);
}

function generateConclusion(trends: string[], anomalies: string[], insights: string[]): string {
  let conclusion = 'Based on the analysis, ';
  
  if (trends.length > 0) {
    const trendSummary = trends.length === 1 
      ? 'a clear trend has been identified'
      : `${trends.length} significant trends have been identified`;
    conclusion += `${trendSummary}. `;
  }
  
  if (anomalies.length > 0) {
    conclusion += `${anomalies.length} notable anomal${anomalies.length > 1 ? 'ies require' : 'y requires'} attention. `;
  }
  
  if (insights.length > 0) {
    conclusion += `The data reveals ${insights.length} actionable insight${insights.length > 1 ? 's' : ''} that could inform strategic decisions. `;
  }
  
  conclusion += 'Click on any chart element for detailed explanations of specific data points.';
  
  return conclusion;
}

function formatColumnName(name: string): string {
  return name
    .replace(/_/g, ' ')
    .replace(/\b\w/g, c => c.toUpperCase());
}
