import { CleanedData, DataStory, ChartConfig } from '@/types/analytics';

export function generateDataStory(data: CleanedData, charts: ChartConfig[]): DataStory {
  const numericColumns = data.columns.filter(c => c.type === 'numeric');
  const categoricalColumns = data.columns.filter(c => c.type === 'categorical');
  const dateColumns = data.columns.filter(c => c.type === 'datetime');
  
  // Generate comprehensive overview
  const overview = generateDetailedOverview(data, numericColumns, categoricalColumns, dateColumns);
  
  // Extract key trends with more detail
  const keyTrends = extractDetailedTrends(numericColumns, charts, data);
  
  // Identify anomalies with context
  const anomalies = extractDetailedAnomalies(charts, numericColumns);
  
  // Generate actionable insights
  const insights = generateDetailedInsights(data, charts, numericColumns, categoricalColumns);
  
  // Create comprehensive conclusion
  const conclusion = generateDetailedConclusion(data, keyTrends, anomalies, insights, numericColumns);
  
  return {
    title: generateDynamicTitle(data, numericColumns),
    overview,
    keyTrends,
    anomalies,
    insights,
    conclusion,
  };
}

function generateDynamicTitle(data: CleanedData, numericColumns: CleanedData['columns']): string {
  const hasTimeSeries = data.columns.some(c => c.type === 'datetime');
  const primaryMetric = numericColumns[0]?.name?.replace(/_/g, ' ') || 'Data';
  
  if (hasTimeSeries) {
    return `Comprehensive Time-Series Analysis: ${data.rowCount.toLocaleString()} Data Points Across ${numericColumns.length} Key Metrics`;
  }
  return `In-Depth Statistical Analysis: ${formatColumnName(primaryMetric)} and ${numericColumns.length - 1} Related Variables`;
}

function generateDetailedOverview(
  data: CleanedData, 
  numericColumns: CleanedData['columns'],
  categoricalColumns: CleanedData['columns'],
  dateColumns: CleanedData['columns']
): string {
  let overview = `This comprehensive analysis examines a dataset containing ${data.rowCount.toLocaleString()} records across ${data.columnCount} distinct variables. `;
  
  if (dateColumns.length > 0) {
    const dateCol = dateColumns[0];
    const dateValues = dateCol.values.filter(v => v !== null) as string[];
    if (dateValues.length > 0) {
      const dates = dateValues.map(d => new Date(d)).filter(d => !isNaN(d.getTime()));
      if (dates.length > 1) {
        const minDate = new Date(Math.min(...dates.map(d => d.getTime())));
        const maxDate = new Date(Math.max(...dates.map(d => d.getTime())));
        overview += `The data spans from ${minDate.toLocaleDateString('en-US', { month: 'long', year: 'numeric' })} to ${maxDate.toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}, providing a temporal perspective for trend analysis. `;
      }
    }
  }
  
  if (numericColumns.length > 0) {
    const metricsDesc = numericColumns.slice(0, 3).map(c => formatColumnName(c.name)).join(', ');
    overview += `Key quantitative measures include ${metricsDesc}${numericColumns.length > 3 ? ` and ${numericColumns.length - 3} additional metrics` : ''}. `;
    
    // Add statistical summary
    const primaryCol = numericColumns[0];
    if (primaryCol.stats) {
      const range = (primaryCol.stats.max || 0) - (primaryCol.stats.min || 0);
      const cv = primaryCol.stats.stdDev && primaryCol.stats.mean 
        ? ((primaryCol.stats.stdDev / primaryCol.stats.mean) * 100).toFixed(1)
        : null;
      
      overview += `The primary metric, ${formatColumnName(primaryCol.name)}, ranges from ${primaryCol.stats.min?.toLocaleString()} to ${primaryCol.stats.max?.toLocaleString()} with a mean of ${primaryCol.stats.mean?.toFixed(2)}${cv ? ` and a coefficient of variation of ${cv}%` : ''}. `;
    }
  }
  
  if (categoricalColumns.length > 0) {
    const catDesc = categoricalColumns.slice(0, 2).map(c => {
      const uniqueCount = c.stats?.unique || 0;
      return `${formatColumnName(c.name)} (${uniqueCount} categories)`;
    }).join(' and ');
    overview += `Categorical dimensions include ${catDesc}, enabling segmented analysis. `;
  }
  
  // Data quality assessment
  const totalMissing = data.columns.reduce((sum, col) => sum + (col.stats?.missing || 0), 0);
  const totalCells = data.rowCount * data.columnCount;
  const completenessRate = ((1 - totalMissing / totalCells) * 100).toFixed(1);
  
  overview += `Data completeness stands at ${completenessRate}%, indicating ${parseFloat(completenessRate) > 95 ? 'excellent' : parseFloat(completenessRate) > 80 ? 'good' : 'moderate'} data quality for reliable analysis.`;
  
  return overview;
}

function extractDetailedTrends(
  numericColumns: CleanedData['columns'], 
  charts: ChartConfig[],
  data: CleanedData
): string[] {
  const trends: string[] = [];
  
  numericColumns.forEach(col => {
    if (col.stats?.trend && col.stats?.percentChange !== undefined) {
      const change = col.stats.percentChange;
      const absChange = Math.abs(change);
      const direction = change > 0 ? 'increased' : 'decreased';
      const intensity = absChange > 50 ? 'dramatically' : absChange > 20 ? 'significantly' : 'moderately';
      
      let trendDesc = `${formatColumnName(col.name)} has ${intensity} ${direction} by ${absChange.toFixed(1)}% over the observation period`;
      
      // Add context about the values
      if (col.stats.mean && col.stats.median) {
        const skewIndicator = col.stats.mean > col.stats.median ? 'right-skewed (potential high outliers)' : 
                              col.stats.mean < col.stats.median ? 'left-skewed (potential low outliers)' : 'symmetrically distributed';
        trendDesc += `. The distribution is ${skewIndicator}`;
      }
      
      trends.push(trendDesc);
    }
  });
  
  // Add momentum analysis
  numericColumns.slice(0, 2).forEach(col => {
    const values = col.values.filter(v => v !== null) as number[];
    if (values.length >= 4) {
      const recentQuarter = values.slice(-Math.floor(values.length / 4));
      const previousQuarter = values.slice(-Math.floor(values.length / 2), -Math.floor(values.length / 4));
      
      if (recentQuarter.length > 0 && previousQuarter.length > 0) {
        const recentAvg = recentQuarter.reduce((a, b) => a + b, 0) / recentQuarter.length;
        const previousAvg = previousQuarter.reduce((a, b) => a + b, 0) / previousQuarter.length;
        const momentum = ((recentAvg - previousAvg) / previousAvg) * 100;
        
        if (Math.abs(momentum) > 5) {
          const momentumDir = momentum > 0 ? 'accelerating' : 'decelerating';
          trends.push(`Recent momentum in ${formatColumnName(col.name)} shows ${momentumDir} trend with ${Math.abs(momentum).toFixed(1)}% change in recent quarter vs. previous`);
        }
      }
    }
  });
  
  // Chart-derived trends with more context
  charts.forEach(chart => {
    const trendInsights = chart.insights.filter(i => i.type === 'trend');
    trendInsights.forEach(insight => {
      if (!trends.some(t => t.includes(insight.description))) {
        trends.push(insight.description);
      }
    });
  });
  
  return [...new Set(trends)].slice(0, 6);
}

function extractDetailedAnomalies(charts: ChartConfig[], numericColumns: CleanedData['columns']): string[] {
  const anomalies: string[] = [];
  
  // Statistical outlier analysis
  numericColumns.forEach(col => {
    if (col.stats?.outliers && col.stats.outliers.length > 0) {
      const outlierCount = col.stats.outliers.length;
      const outlierPercentage = ((outlierCount / (col.stats.count || 1)) * 100).toFixed(1);
      const maxOutlier = Math.max(...col.stats.outliers);
      const minOutlier = Math.min(...col.stats.outliers);
      
      let anomalyDesc = `${formatColumnName(col.name)} contains ${outlierCount} statistical outliers (${outlierPercentage}% of data)`;
      
      if (col.stats.mean) {
        const maxDeviation = ((maxOutlier - col.stats.mean) / col.stats.mean * 100).toFixed(1);
        anomalyDesc += `. Extreme values deviate up to ${Math.abs(parseFloat(maxDeviation))}% from the mean`;
      }
      
      anomalies.push(anomalyDesc);
    }
  });
  
  // Chart-based anomalies
  charts.forEach(chart => {
    chart.insights
      .filter(i => (i.type === 'anomaly' || i.type === 'spike' || i.type === 'drop') && i.severity === 'high')
      .forEach(insight => {
        let enhancedDesc = insight.description;
        if (insight.dataPoint) {
          enhancedDesc += ` at ${insight.dataPoint.x} (value: ${typeof insight.dataPoint.y === 'number' ? insight.dataPoint.y.toFixed(2) : insight.dataPoint.y})`;
        }
        anomalies.push(enhancedDesc);
      });
  });
  
  return [...new Set(anomalies)].slice(0, 5);
}

function generateDetailedInsights(
  data: CleanedData, 
  charts: ChartConfig[], 
  numericColumns: CleanedData['columns'],
  categoricalColumns: CleanedData['columns']
): string[] {
  const insights: string[] = [];
  
  // Cross-variable relationships
  if (numericColumns.length >= 2) {
    const col1 = numericColumns[0];
    const col2 = numericColumns[1];
    
    if (col1.stats?.mean && col2.stats?.mean) {
      const ratio = col1.stats.mean / col2.stats.mean;
      insights.push(
        `${formatColumnName(col1.name)} averages ${ratio.toFixed(2)}x the value of ${formatColumnName(col2.name)}, suggesting a ${ratio > 1 ? 'dominant' : 'secondary'} relationship between these metrics`
      );
    }
    
    // Volatility comparison
    if (col1.stats?.stdDev && col2.stats?.stdDev && col1.stats?.mean && col2.stats?.mean) {
      const cv1 = (col1.stats.stdDev / col1.stats.mean) * 100;
      const cv2 = (col2.stats.stdDev / col2.stats.mean) * 100;
      const moreVolatile = cv1 > cv2 ? col1.name : col2.name;
      const lessVolatile = cv1 > cv2 ? col2.name : col1.name;
      insights.push(
        `${formatColumnName(moreVolatile)} shows ${(Math.abs(cv1 - cv2)).toFixed(1)}% higher volatility than ${formatColumnName(lessVolatile)}, indicating greater variability in this metric`
      );
    }
  }
  
  // Distribution insights
  numericColumns.slice(0, 3).forEach(col => {
    if (col.stats?.percentiles) {
      const iqr = col.stats.percentiles.p75 - col.stats.percentiles.p25;
      const medianToMean = col.stats.median && col.stats.mean 
        ? ((col.stats.median - col.stats.mean) / col.stats.mean * 100).toFixed(1)
        : null;
      
      if (medianToMean && Math.abs(parseFloat(medianToMean)) > 10) {
        const skewDir = parseFloat(medianToMean) < 0 ? 'right' : 'left';
        insights.push(
          `${formatColumnName(col.name)} distribution is ${skewDir}-skewed (median ${Math.abs(parseFloat(medianToMean))}% ${parseFloat(medianToMean) < 0 ? 'below' : 'above'} mean), suggesting ${skewDir === 'right' ? 'presence of high-value outliers' : 'concentration of lower values'}`
        );
      }
    }
  });
  
  // Categorical insights
  categoricalColumns.slice(0, 2).forEach(col => {
    if (col.stats?.mode && col.stats?.unique) {
      const modeFreq = col.values.filter(v => v === col.stats?.mode).length;
      const modePercentage = ((modeFreq / (col.stats.count || 1)) * 100).toFixed(1);
      
      if (parseFloat(modePercentage) > 30) {
        insights.push(
          `"${col.stats.mode}" is the dominant category in ${formatColumnName(col.name)}, representing ${modePercentage}% of all records`
        );
      }
    }
  });
  
  // Performance quartile analysis
  if (numericColumns.length > 0) {
    const primaryCol = numericColumns[0];
    if (primaryCol.stats?.percentiles) {
      const p75 = primaryCol.stats.percentiles.p75;
      const p25 = primaryCol.stats.percentiles.p25;
      const topQuartileThreshold = p75;
      
      insights.push(
        `Top quartile performance threshold for ${formatColumnName(primaryCol.name)} is ${topQuartileThreshold.toFixed(2)}, with an interquartile range of ${(p75 - p25).toFixed(2)}`
      );
    }
  }
  
  return [...new Set(insights)].slice(0, 6);
}

function generateDetailedConclusion(
  data: CleanedData,
  trends: string[], 
  anomalies: string[], 
  insights: string[],
  numericColumns: CleanedData['columns']
): string {
  let conclusion = 'This comprehensive analysis reveals several key findings. ';
  
  // Trend summary
  if (trends.length > 0) {
    const trendCount = trends.length;
    const hasPositive = trends.some(t => t.includes('increased') || t.includes('accelerating'));
    const hasNegative = trends.some(t => t.includes('decreased') || t.includes('decelerating'));
    
    if (hasPositive && hasNegative) {
      conclusion += `The data exhibits ${trendCount} significant trends with mixed directionality, suggesting a complex and dynamic pattern that warrants segment-specific analysis. `;
    } else if (hasPositive) {
      conclusion += `Overall, the data shows positive momentum with ${trendCount} identified growth trend${trendCount > 1 ? 's' : ''}, indicating favorable conditions. `;
    } else if (hasNegative) {
      conclusion += `The analysis identifies ${trendCount} declining trend${trendCount > 1 ? 's' : ''}, which may require strategic intervention. `;
    } else {
      conclusion += `${trendCount} significant pattern${trendCount > 1 ? 's have' : ' has'} been identified in the data. `;
    }
  }
  
  // Anomaly summary
  if (anomalies.length > 0) {
    conclusion += `${anomalies.length} notable anomal${anomalies.length > 1 ? 'ies require' : 'y requires'} attention, representing potential outliers or exceptional events that should be investigated further. `;
  }
  
  // Data quality and reliability note
  const totalOutliers = numericColumns.reduce((sum, col) => sum + (col.stats?.outliers?.length || 0), 0);
  if (totalOutliers < data.rowCount * 0.05) {
    conclusion += 'The low outlier ratio indicates high data reliability for decision-making. ';
  }
  
  // Actionable recommendation
  if (insights.length > 0) {
    conclusion += `Based on ${insights.length} actionable insight${insights.length > 1 ? 's' : ''}, we recommend focusing on the primary metrics identified while monitoring the highlighted anomalies. `;
  }
  
  conclusion += 'For deeper analysis, click on any chart element to explore specific data points and their contextual explanations.';
  
  return conclusion;
}

function formatColumnName(name: string): string {
  return name
    .replace(/_/g, ' ')
    .replace(/\b\w/g, c => c.toUpperCase());
}
