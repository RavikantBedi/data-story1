import { CleanedData, DataStory, ChartConfig } from '@/types/analytics';

export function generateDataStory(data: CleanedData, charts: ChartConfig[]): DataStory {
  const numericColumns = data.columns.filter(c => c.type === 'numeric');
  const categoricalColumns = data.columns.filter(c => c.type === 'categorical');
  const dateColumns = data.columns.filter(c => c.type === 'datetime');
  
  // Generate executive summary
  const overview = generateExecutiveSummary(data, numericColumns, categoricalColumns, dateColumns);
  
  // Generate key observations with meaning
  const keyTrends = generateKeyObservations(numericColumns, charts, data);
  
  // Generate patterns and variability insights
  const anomalies = generatePatternsAndVariability(numericColumns, categoricalColumns);
  
  // Generate relationships and actionable insights
  const insights = generateRelationshipsAndActions(data, charts, numericColumns, categoricalColumns);
  
  // Generate decision-oriented conclusion
  const conclusion = generateFinalInterpretation(data, keyTrends, anomalies, insights, numericColumns);
  
  return {
    title: generateNarrativeTitle(data, numericColumns),
    overview,
    keyTrends,
    anomalies,
    insights,
    conclusion,
  };
}

function generateNarrativeTitle(data: CleanedData, numericColumns: CleanedData['columns']): string {
  const hasTimeSeries = data.columns.some(c => c.type === 'datetime');
  const primaryMetric = numericColumns[0]?.name || 'Performance';
  
  if (hasTimeSeries) {
    return `Understanding Your ${formatColumnName(primaryMetric)} Performance: A Complete Analysis`;
  }
  return `What Your Data Reveals: Insights Across ${data.rowCount.toLocaleString()} Records`;
}

function generateExecutiveSummary(
  data: CleanedData, 
  numericColumns: CleanedData['columns'],
  categoricalColumns: CleanedData['columns'],
  dateColumns: CleanedData['columns']
): string {
  let summary = '';
  
  // Opening hook - what's the story?
  if (numericColumns.length > 0) {
    const primaryCol = numericColumns[0];
    const trend = primaryCol.stats?.trend;
    const change = primaryCol.stats?.percentChange;
    
    if (trend === 'increasing' && change && change > 10) {
      summary = `Good news: Your ${formatColumnName(primaryCol.name)} is showing strong growth, up ${change.toFixed(0)}% over the period analyzed. `;
    } else if (trend === 'decreasing' && change && change < -10) {
      summary = `Attention needed: ${formatColumnName(primaryCol.name)} has declined by ${Math.abs(change).toFixed(0)}%, which may require investigation. `;
    } else {
      summary = `Your data tells an interesting story across ${data.rowCount.toLocaleString()} records. `;
    }
  }
  
  // Time context if available
  if (dateColumns.length > 0) {
    const dateCol = dateColumns[0];
    const dateValues = dateCol.values.filter(v => v !== null) as string[];
    if (dateValues.length > 1) {
      const dates = dateValues.map(d => new Date(d)).filter(d => !isNaN(d.getTime()));
      if (dates.length > 1) {
        const minDate = new Date(Math.min(...dates.map(d => d.getTime())));
        const maxDate = new Date(Math.max(...dates.map(d => d.getTime())));
        const monthsDiff = Math.round((maxDate.getTime() - minDate.getTime()) / (1000 * 60 * 60 * 24 * 30));
        summary += `This analysis covers ${monthsDiff > 0 ? `${monthsDiff} months` : 'the available period'} of activity, giving us a solid foundation to understand what is working and what needs attention. `;
      }
    }
  }
  
  // Data quality and confidence
  const totalMissing = data.columns.reduce((sum, col) => sum + (col.stats?.missing || 0), 0);
  const totalCells = data.rowCount * data.columnCount;
  const completeness = ((1 - totalMissing / totalCells) * 100);
  
  if (completeness > 95) {
    summary += `The data quality is excellent, meaning we can trust these findings with high confidence.`;
  } else if (completeness > 80) {
    summary += `While some data points are missing, the overall quality is sufficient for reliable conclusions.`;
  } else {
    summary += `Note that some gaps in the data may affect the precision of these insights.`;
  }
  
  return summary;
}

function generateKeyObservations(
  numericColumns: CleanedData['columns'], 
  charts: ChartConfig[],
  data: CleanedData
): string[] {
  const observations: string[] = [];
  
  numericColumns.slice(0, 4).forEach(col => {
    const stats = col.stats;
    if (!stats) return;
    
    const name = formatColumnName(col.name);
    
    // Trend interpretation with business meaning
    if (stats.trend && stats.percentChange !== undefined) {
      const change = stats.percentChange;
      const absChange = Math.abs(change);
      
      if (stats.trend === 'increasing') {
        if (absChange > 30) {
          observations.push(
            `${name} has seen remarkable growth of ${absChange.toFixed(0)}%. This kind of momentum suggests something is working well—whether it is a new strategy, seasonal demand, or market conditions. Consider investigating what is driving this success so it can be replicated.`
          );
        } else if (absChange > 10) {
          observations.push(
            `${name} is trending upward with a healthy ${absChange.toFixed(0)}% increase. This steady growth indicates positive progress, though there may still be room to accelerate if the right factors are identified.`
          );
        } else {
          observations.push(
            `${name} shows modest improvement of ${absChange.toFixed(0)}%. While growth is always welcome, this pace may not be enough to meet ambitious targets. Worth exploring what barriers might be limiting faster progress.`
          );
        }
      } else if (stats.trend === 'decreasing') {
        if (absChange > 30) {
          observations.push(
            `${name} has dropped significantly by ${absChange.toFixed(0)}%—this is a red flag that needs immediate attention. Something has changed, and understanding why should be a priority before the decline continues.`
          );
        } else if (absChange > 10) {
          observations.push(
            `${name} is declining at ${absChange.toFixed(0)}%, which warrants concern. This could indicate shifting conditions, competitive pressure, or internal challenges that need to be addressed.`
          );
        } else {
          observations.push(
            `${name} has slightly decreased by ${absChange.toFixed(0)}%. While not alarming, this minor dip should be monitored to ensure it does not become a larger trend.`
          );
        }
      } else {
        observations.push(
          `${name} has remained stable during this period. Stability can be positive (consistent performance) or concerning (lack of growth), depending on your goals. Consider whether this metric should be actively improved.`
        );
      }
    }
    
    // Value context
    if (stats.mean && stats.min !== undefined && stats.max !== undefined) {
      const range = stats.max - stats.min;
      const typical = stats.mean;
      
      if (range > typical * 2) {
        observations.push(
          `The range of ${name} is quite wide—from ${stats.min.toLocaleString()} to ${stats.max.toLocaleString()}. This suggests significant differences within your data, possibly reflecting different segments, time periods, or conditions that perform very differently.`
        );
      }
    }
  });
  
  // Add momentum analysis in plain language
  if (numericColumns.length > 0) {
    const primaryCol = numericColumns[0];
    const values = primaryCol.values.filter(v => v !== null) as number[];
    
    if (values.length >= 6) {
      const recentThird = values.slice(-Math.floor(values.length / 3));
      const middleThird = values.slice(Math.floor(values.length / 3), Math.floor(values.length * 2 / 3));
      
      if (recentThird.length > 0 && middleThird.length > 0) {
        const recentAvg = recentThird.reduce((a, b) => a + b, 0) / recentThird.length;
        const middleAvg = middleThird.reduce((a, b) => a + b, 0) / middleThird.length;
        const momentum = ((recentAvg - middleAvg) / middleAvg) * 100;
        
        if (Math.abs(momentum) > 10) {
          const direction = momentum > 0 ? 'accelerating' : 'slowing down';
          observations.push(
            `Recent performance is ${direction} compared to earlier in the period. This recent momentum (${momentum > 0 ? '+' : ''}${momentum.toFixed(0)}%) is worth watching—it may signal a turning point or confirm an emerging trend.`
          );
        }
      }
    }
  }
  
  return observations.slice(0, 5);
}

function generatePatternsAndVariability(
  numericColumns: CleanedData['columns'],
  categoricalColumns: CleanedData['columns']
): string[] {
  const patterns: string[] = [];
  
  // Variability analysis with meaning
  numericColumns.slice(0, 3).forEach(col => {
    const stats = col.stats;
    if (!stats?.stdDev || !stats?.mean) return;
    
    const cv = (stats.stdDev / Math.abs(stats.mean)) * 100;
    const name = formatColumnName(col.name);
    
    if (cv > 50) {
      patterns.push(
        `${name} shows high variability—values swing widely from the average. This unpredictability could make planning difficult. It might reflect natural volatility (like sales seasonality) or underlying inconsistencies that could be smoothed out.`
      );
    } else if (cv > 25) {
      patterns.push(
        `${name} has moderate variability, which is fairly typical for most business metrics. Some fluctuation is normal, but understanding the causes of larger swings could help improve predictability.`
      );
    } else if (cv < 10) {
      patterns.push(
        `${name} is remarkably consistent—values cluster tightly around the average. This predictability makes forecasting easier, though it may also suggest limited opportunity for significant improvement without changing something fundamental.`
      );
    }
  });
  
  // Outlier interpretation
  numericColumns.forEach(col => {
    if (col.stats?.outliers && col.stats.outliers.length > 0) {
      const outlierCount = col.stats.outliers.length;
      const name = formatColumnName(col.name);
      
      if (outlierCount <= 3) {
        patterns.push(
          `A few exceptional values exist in ${name}. These outliers could represent special cases worth studying—perhaps your best performers or unusual circumstances that could provide valuable lessons.`
        );
      } else if (outlierCount > 5) {
        patterns.push(
          `Multiple outliers detected in ${name} (${outlierCount} unusual values). This many exceptions suggest either data quality issues or genuinely different subgroups within your data that may need separate analysis.`
        );
      }
    }
  });
  
  // Categorical distribution insights
  categoricalColumns.slice(0, 2).forEach(col => {
    if (col.stats?.mode && col.stats?.unique && col.stats?.count) {
      const modeCount = col.values.filter(v => v === col.stats?.mode).length;
      const modePercentage = (modeCount / col.stats.count) * 100;
      const name = formatColumnName(col.name);
      
      if (modePercentage > 50) {
        patterns.push(
          `Over half of your data falls into "${col.stats.mode}" for ${name}. This concentration means insights from this dominant group will heavily influence overall conclusions. Consider whether the smaller segments behave differently.`
        );
      } else if (col.stats.unique <= 3) {
        patterns.push(
          `${name} has just ${col.stats.unique} categories. This simplicity makes segmented analysis straightforward and comparisons between groups meaningful.`
        );
      }
    }
  });
  
  return patterns.slice(0, 4);
}

function generateRelationshipsAndActions(
  data: CleanedData, 
  charts: ChartConfig[], 
  numericColumns: CleanedData['columns'],
  categoricalColumns: CleanedData['columns']
): string[] {
  const insights: string[] = [];
  
  // Comparative insights with context
  if (numericColumns.length >= 2) {
    const col1 = numericColumns[0];
    const col2 = numericColumns[1];
    
    // Check for meaningful relationship
    if (col1.stats?.mean && col2.stats?.mean && col1.stats?.stdDev && col2.stats?.stdDev) {
      const cv1 = col1.stats.stdDev / Math.abs(col1.stats.mean);
      const cv2 = col2.stats.stdDev / Math.abs(col2.stats.mean);
      
      if (Math.abs(cv1 - cv2) > 0.2) {
        const moreVariable = cv1 > cv2 ? col1.name : col2.name;
        const moreStable = cv1 > cv2 ? col2.name : col1.name;
        insights.push(
          `${formatColumnName(moreVariable)} fluctuates more than ${formatColumnName(moreStable)}. If you are looking to reduce risk or improve predictability, focusing on stabilizing ${formatColumnName(moreVariable)} might yield better results.`
        );
      }
    }
  }
  
  // Distribution-based actionable insights
  numericColumns.slice(0, 2).forEach(col => {
    if (col.stats?.percentiles && col.stats?.mean && col.stats?.median) {
      const name = formatColumnName(col.name);
      const skew = col.stats.mean - col.stats.median;
      const relativeSkew = skew / Math.abs(col.stats.mean);
      
      if (relativeSkew > 0.1) {
        insights.push(
          `${name} has a long tail of high values—a few data points are pulling the average up significantly. This means the typical case is actually lower than the average suggests. Consider using the median for more realistic expectations.`
        );
      } else if (relativeSkew < -0.1) {
        insights.push(
          `${name} is weighted toward lower values, with occasional high performers. Understanding what drives those high performers could help elevate overall results.`
        );
      }
    }
  });
  
  // Performance thresholds as recommendations
  if (numericColumns.length > 0) {
    const primaryCol = numericColumns[0];
    if (primaryCol.stats?.percentiles) {
      const p75 = primaryCol.stats.percentiles.p75;
      const name = formatColumnName(primaryCol.name);
      insights.push(
        `To be in the top 25% for ${name}, you need to exceed ${p75.toLocaleString()}. This benchmark can help set realistic targets and identify what separates top performers from the rest.`
      );
    }
  }
  
  // Monitoring recommendations
  const volatileColumns = numericColumns.filter(col => {
    if (!col.stats?.stdDev || !col.stats?.mean) return false;
    return (col.stats.stdDev / Math.abs(col.stats.mean)) > 0.3;
  });
  
  if (volatileColumns.length > 0) {
    const names = volatileColumns.slice(0, 2).map(c => formatColumnName(c.name)).join(' and ');
    insights.push(
      `${names} should be monitored regularly due to their variability. Setting up alerts for unusual values could help catch issues early before they become bigger problems.`
    );
  }
  
  // Investigation suggestions based on anomalies
  const hasAnomalies = charts.some(c => c.insights.some(i => i.type === 'anomaly' || i.type === 'spike' || i.type === 'drop'));
  if (hasAnomalies) {
    insights.push(
      `Several unusual patterns have been detected. Clicking on specific data points in the charts will reveal what happened at those moments—this investigation could uncover root causes or opportunities.`
    );
  }
  
  return insights.slice(0, 5);
}

function generateFinalInterpretation(
  data: CleanedData,
  trends: string[], 
  patterns: string[], 
  insights: string[],
  numericColumns: CleanedData['columns']
): string {
  let conclusion = '';
  
  // Overall health assessment
  const positiveTrends = trends.filter(t => 
    t.includes('growth') || t.includes('improvement') || t.includes('success') || t.includes('positive')
  ).length;
  const concerningPatterns = patterns.filter(p => 
    p.includes('attention') || p.includes('concern') || p.includes('red flag')
  ).length;
  
  if (positiveTrends > concerningPatterns) {
    conclusion = 'Overall, the data paints a positive picture. ';
  } else if (concerningPatterns > positiveTrends) {
    conclusion = 'The data suggests some challenges that deserve attention. ';
  } else {
    conclusion = 'The data reveals a mixed picture with both strengths and areas for improvement. ';
  }
  
  // Confidence statement
  const totalOutliers = numericColumns.reduce((sum, col) => sum + (col.stats?.outliers?.length || 0), 0);
  const outlierRatio = totalOutliers / data.rowCount;
  
  if (outlierRatio < 0.02) {
    conclusion += 'The low number of outliers indicates this is clean, reliable data that can confidently support decision-making. ';
  } else if (outlierRatio < 0.1) {
    conclusion += 'While a few unusual values exist, the overall patterns are clear enough to guide strategic thinking. ';
  } else {
    conclusion += 'The presence of many unusual values suggests taking conclusions with some caution and perhaps investigating data quality. ';
  }
  
  // Actionable next step
  if (insights.length > 0) {
    conclusion += 'The insights identified point to concrete opportunities—prioritize the most impactful recommendations based on your current goals. ';
  }
  
  conclusion += 'For a deeper understanding of specific moments or anomalies, use the interactive dashboard to explore individual data points and their explanations.';
  
  return conclusion;
}

function formatColumnName(name: string): string {
  return name
    .replace(/_/g, ' ')
    .replace(/\b\w/g, c => c.toUpperCase());
}
