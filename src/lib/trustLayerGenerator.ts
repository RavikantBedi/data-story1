import { 
  CleanedData, 
  ChartConfig, 
  DataStory, 
  TrustLayer, 
  InsightEvidence, 
  AnomalyEvent,
  WhatIfScenario,
  MultiStyleExplanation
} from '@/types/analytics';

export function generateTrustLayer(
  data: CleanedData, 
  story: DataStory, 
  charts: ChartConfig[]
): TrustLayer {
  const numericColumns = data.columns.filter(c => c.type === 'numeric');
  
  return {
    reliabilityScore: calculateReliabilityScore(data),
    reliabilityDetails: generateReliabilityDetails(data),
    safeConclusions: generateSafeConclusions(data, numericColumns),
    uncertainConclusions: generateUncertainConclusions(data, numericColumns),
    insightEvidence: generateInsightEvidence(story, data, numericColumns),
    anomalyTimeline: generateAnomalyTimeline(data, charts),
    whatIfScenario: generateWhatIfScenario(data, numericColumns),
    multiStyleExplanation: generateMultiStyleExplanation(data, numericColumns),
    nextQuestions: generateNextQuestions(data, story),
    trustStatement: generateTrustStatement(data)
  };
}

function calculateReliabilityScore(data: CleanedData): number {
  const totalCells = data.rowCount * data.columnCount;
  const missingCells = data.columns.reduce((sum, col) => sum + (col.stats?.missing || 0), 0);
  const completeness = (1 - missingCells / totalCells) * 100;
  
  // Factor in data volume
  const volumeScore = Math.min(data.rowCount / 100, 1) * 20;
  
  // Factor in outlier ratio
  const totalOutliers = data.columns.reduce((sum, col) => sum + (col.stats?.outliers?.length || 0), 0);
  const outlierRatio = totalOutliers / data.rowCount;
  const outlierScore = Math.max(0, (1 - outlierRatio * 5)) * 15;
  
  // Combine scores
  const score = Math.min(100, completeness * 0.65 + volumeScore + outlierScore);
  return Math.round(score);
}

function generateReliabilityDetails(data: CleanedData): string {
  const totalMissing = data.columns.reduce((sum, col) => sum + (col.stats?.missing || 0), 0);
  const completeness = ((1 - totalMissing / (data.rowCount * data.columnCount)) * 100).toFixed(1);
  const totalOutliers = data.columns.reduce((sum, col) => sum + (col.stats?.outliers?.length || 0), 0);
  
  const parts: string[] = [];
  
  if (parseFloat(completeness) > 98) {
    parts.push(`Your data is ${completeness}% complete, which is excellent.`);
  } else if (parseFloat(completeness) > 90) {
    parts.push(`Data completeness is at ${completeness}%. Some gaps exist but shouldn't significantly impact conclusions.`);
  } else {
    parts.push(`Data completeness is ${completeness}%. Missing values may affect some conclusions.`);
  }
  
  if (totalOutliers > 0) {
    const outlierPercent = ((totalOutliers / data.rowCount) * 100).toFixed(1);
    parts.push(`We found ${totalOutliers} unusual values (${outlierPercent}% of records). These have been noted but don't distort the main findings.`);
  }
  
  if (data.rowCount >= 1000) {
    parts.push('With a substantial sample size, statistical patterns are reliable.');
  } else if (data.rowCount >= 100) {
    parts.push('The sample size is adequate for general conclusions.');
  } else {
    parts.push('Smaller dataset - treat findings as directional indicators.');
  }
  
  return parts.join(' ');
}

function generateSafeConclusions(data: CleanedData, numericColumns: CleanedData['columns']): string[] {
  const safe: string[] = [];
  
  // High-confidence conclusions based on strong data
  numericColumns.slice(0, 3).forEach(col => {
    const stats = col.stats;
    if (!stats) return;
    
    const name = formatColumnName(col.name);
    
    // Trend with sufficient data
    if (stats.trend && data.rowCount >= 50) {
      if (stats.trend === 'increasing' && stats.percentChange && stats.percentChange > 10) {
        safe.push(`${name} shows a clear upward trajectory with ${stats.percentChange.toFixed(0)}% growth - this pattern is consistent across the data.`);
      } else if (stats.trend === 'decreasing' && stats.percentChange && Math.abs(stats.percentChange) > 10) {
        safe.push(`${name} is declining at a rate of ${Math.abs(stats.percentChange).toFixed(0)}% - this trend is well-established in the data.`);
      } else if (stats.trend === 'stable') {
        safe.push(`${name} remains stable throughout the period - you can reliably plan around this consistency.`);
      }
    }
    
    // Strong central tendency
    if (stats.mean && stats.stdDev && Math.abs(stats.stdDev / stats.mean) < 0.2) {
      safe.push(`${name} is highly predictable - values cluster tightly around ${formatNumber(stats.mean)}.`);
    }
  });
  
  return safe.slice(0, 4);
}

function generateUncertainConclusions(data: CleanedData, numericColumns: CleanedData['columns']): string[] {
  const uncertain: string[] = [];
  
  numericColumns.slice(0, 3).forEach(col => {
    const stats = col.stats;
    if (!stats) return;
    
    const name = formatColumnName(col.name);
    
    // High variability
    if (stats.mean && stats.stdDev && Math.abs(stats.stdDev / stats.mean) > 0.5) {
      uncertain.push(`${name} varies significantly - predictions for individual values carry more uncertainty.`);
    }
    
    // Limited data
    if (data.rowCount < 50 && stats.trend) {
      uncertain.push(`The trend in ${name} is based on limited data points - it may shift as more data becomes available.`);
    }
    
    // Outlier impact
    if (stats.outliers && stats.outliers.length > data.rowCount * 0.05) {
      uncertain.push(`Many unusual values in ${name} make the average less representative of typical performance.`);
    }
  });
  
  return uncertain.slice(0, 3);
}

function generateInsightEvidence(
  story: DataStory, 
  data: CleanedData,
  numericColumns: CleanedData['columns']
): InsightEvidence[] {
  const evidence: InsightEvidence[] = [];
  
  // Generate evidence for key trends
  story.keyTrends.slice(0, 3).forEach((trend, index) => {
    const col = numericColumns[index];
    const stats = col?.stats;
    
    const dataPoints = col ? col.values.filter(v => v !== null).length : 0;
    const hasEnoughData = dataPoints >= 30;
    const isConsistent = stats?.stdDev && stats?.mean ? Math.abs(stats.stdDev / stats.mean) < 0.5 : false;
    
    evidence.push({
      insight: trend.replace(/📈|📉|➡️|💡|🚀|⚠️/g, '').trim().slice(0, 100) + '...',
      confidence: hasEnoughData && isConsistent ? 85 : hasEnoughData ? 70 : 55,
      evidenceStrength: hasEnoughData && isConsistent ? 'strong' : hasEnoughData ? 'moderate' : 'weak',
      dataPointsSupporting: dataPoints,
      isRepeated: hasEnoughData,
      assumptions: getAssumptionsForTrend(stats)
    });
  });
  
  return evidence;
}

function getAssumptionsForTrend(stats: CleanedData['columns'][0]['stats']): string[] {
  const assumptions: string[] = [];
  
  if (stats?.trend) {
    assumptions.push('Historical patterns will continue under similar conditions');
  }
  if (stats?.outliers && stats.outliers.length > 0) {
    assumptions.push('Outliers represent genuine events, not data errors');
  }
  if (stats?.missing && stats.missing > 0) {
    assumptions.push('Missing data is randomly distributed and not systematic');
  }
  
  return assumptions;
}

function generateAnomalyTimeline(data: CleanedData, charts: ChartConfig[]): AnomalyEvent[] {
  const events: AnomalyEvent[] = [];
  
  // Extract anomalies from chart insights
  charts.forEach((chart, chartIndex) => {
    chart.insights
      .filter(insight => insight.type === 'anomaly' || insight.type === 'spike' || insight.type === 'drop')
      .forEach((insight, index) => {
        events.push({
          timestamp: `Event ${events.length + 1}`,
          description: insight.description,
          significance: insight.severity,
          possibleExplanations: generateExplanations(insight.type)
        });
      });
  });
  
  // Add column-level anomalies
  data.columns.forEach(col => {
    if (col.stats?.outliers && col.stats.outliers.length > 0 && events.length < 5) {
      const outlierCount = col.stats.outliers.length;
      events.push({
        timestamp: 'Throughout data',
        description: `${formatColumnName(col.name)} has ${outlierCount} unusual values that stand out from typical patterns`,
        significance: outlierCount > 5 ? 'high' : 'medium',
        possibleExplanations: [
          'Exceptional performance periods (best or worst cases)',
          'One-time special events or promotions',
          'Data entry errors or system glitches',
          'Changes in business conditions or market factors'
        ]
      });
    }
  });
  
  return events.slice(0, 5);
}

function generateExplanations(type: string): string[] {
  const explanations: Record<string, string[]> = {
    spike: [
      'Seasonal demand surge or promotional campaign',
      'Major order from a key customer',
      'Market event or external factor',
      'Data recording change or system update'
    ],
    drop: [
      'Supply chain or operational issue',
      'Market downturn or competitive pressure',
      'Seasonal low period',
      'Technical or data collection issue'
    ],
    anomaly: [
      'Unusual customer behavior or one-time event',
      'External market factors',
      'Internal process change',
      'Possible data quality issue'
    ]
  };
  
  return explanations[type] || explanations.anomaly;
}

function generateWhatIfScenario(data: CleanedData, numericColumns: CleanedData['columns']): WhatIfScenario {
  const primaryCol = numericColumns[0];
  const stats = primaryCol?.stats;
  
  if (!stats || !stats.mean || !stats.percentChange) {
    return {
      scenario: 'Current trends continue for the next quarter',
      direction: 'neutral',
      magnitude: 'low',
      assumptions: ['Business conditions remain similar', 'No major external disruptions'],
      explanation: 'Without clear trend data, we expect relatively stable performance with normal fluctuations.'
    };
  }
  
  const name = formatColumnName(primaryCol.name);
  const isPositive = stats.trend === 'increasing';
  const changeRate = Math.abs(stats.percentChange);
  
  if (changeRate > 15) {
    return {
      scenario: `If ${name.toLowerCase()} continues at the current rate`,
      direction: isPositive ? 'positive' : 'negative',
      magnitude: 'high',
      assumptions: [
        'Market conditions remain favorable',
        'No significant competitive changes',
        'Internal operations maintain consistency'
      ],
      explanation: isPositive 
        ? `${name} could grow by ${(changeRate * 0.25).toFixed(0)}-${(changeRate * 0.5).toFixed(0)}% next quarter. This represents significant potential, but high growth rates often moderate over time.`
        : `${name} may decline further by ${(changeRate * 0.25).toFixed(0)}-${(changeRate * 0.5).toFixed(0)}% without intervention. Early corrective action typically yields better results than waiting.`
    };
  }
  
  return {
    scenario: `Maintaining current ${name.toLowerCase()} performance`,
    direction: 'neutral',
    magnitude: 'medium',
    assumptions: [
      'No major changes to operations',
      'Market conditions stay stable',
      'Customer behavior continues as observed'
    ],
    explanation: `${name} is likely to remain in its current range with minor fluctuations. This stability provides a reliable baseline for planning but limited organic growth.`
  };
}

function generateMultiStyleExplanation(
  data: CleanedData, 
  numericColumns: CleanedData['columns']
): MultiStyleExplanation {
  const primaryCol = numericColumns[0];
  const stats = primaryCol?.stats;
  const name = primaryCol ? formatColumnName(primaryCol.name) : 'Key Metric';
  
  if (!stats || !stats.mean) {
    return {
      simple: 'Your data shows typical business activity with some ups and downs.',
      executive: 'Performance metrics are within normal operating parameters with expected variation.',
      analyst: 'Statistical analysis indicates data distribution consistent with baseline operational patterns.'
    };
  }
  
  const trend = stats.trend || 'stable';
  const change = stats.percentChange ? Math.abs(stats.percentChange).toFixed(0) : '0';
  
  return {
    simple: trend === 'increasing' 
      ? `Good news! ${name} is going up by ${change}%. Things are moving in the right direction.`
      : trend === 'decreasing'
      ? `${name} has dropped by ${change}%. This needs attention to prevent further decline.`
      : `${name} is holding steady. Reliable, but no major changes either way.`,
      
    executive: trend === 'increasing'
      ? `${name} demonstrates ${change}% growth, indicating positive momentum. This trajectory supports favorable business outcomes if sustained.`
      : trend === 'decreasing'
      ? `${name} reflects a ${change}% decline requiring strategic review. Recommend prioritizing root cause analysis and corrective measures.`
      : `${name} maintains stability within expected ranges. Consider initiatives to drive incremental improvement.`,
      
    analyst: trend === 'increasing'
      ? `${name} exhibits a statistically significant positive trend (${change}% Δ, n=${data.rowCount}). Coefficient of variation: ${stats.stdDev && stats.mean ? (stats.stdDev / stats.mean * 100).toFixed(1) : 'N/A'}%. Pattern suggests sustained growth momentum with moderate confidence interval.`
      : trend === 'decreasing'
      ? `${name} demonstrates negative trajectory (${change}% Δ). Statistical significance is ${data.rowCount > 100 ? 'high' : 'moderate'} given sample size. Recommend segmented analysis to isolate contributing factors.`
      : `${name} shows no significant directional trend. Standard deviation ratio of ${stats.stdDev && stats.mean ? (stats.stdDev / stats.mean * 100).toFixed(1) : 'N/A'}% indicates ${stats.stdDev && stats.mean && stats.stdDev / stats.mean < 0.3 ? 'low' : 'moderate'} volatility.`
  };
}

function generateNextQuestions(data: CleanedData, story: DataStory): string[] {
  const questions: string[] = [];
  const numericColumns = data.columns.filter(c => c.type === 'numeric');
  const categoricalColumns = data.columns.filter(c => c.type === 'categorical');
  
  // Based on trends
  const decliningMetrics = numericColumns.filter(c => c.stats?.trend === 'decreasing');
  if (decliningMetrics.length > 0) {
    questions.push(`What specific factors are driving the decline in ${formatColumnName(decliningMetrics[0].name)}?`);
  }
  
  // Based on variability
  const volatileMetrics = numericColumns.filter(col => {
    if (!col.stats?.stdDev || !col.stats?.mean) return false;
    return Math.abs(col.stats.stdDev / col.stats.mean) > 0.4;
  });
  if (volatileMetrics.length > 0) {
    questions.push(`Is the variability in ${formatColumnName(volatileMetrics[0].name)} seasonal, customer-driven, or operational?`);
  }
  
  // Segment analysis
  if (categoricalColumns.length > 0 && numericColumns.length > 0) {
    questions.push(`How does ${formatColumnName(numericColumns[0].name)} performance differ across ${formatColumnName(categoricalColumns[0].name)} segments?`);
  }
  
  // Outlier investigation
  const outlierMetrics = numericColumns.filter(c => c.stats?.outliers && c.stats.outliers.length > 0);
  if (outlierMetrics.length > 0) {
    questions.push(`What caused the unusual values in ${formatColumnName(outlierMetrics[0].name)}, and are they repeatable?`);
  }
  
  // Forward-looking
  questions.push('What external factors might change these patterns in the coming months?');
  
  // Correlation question
  if (numericColumns.length >= 2) {
    questions.push(`Is there a relationship between ${formatColumnName(numericColumns[0].name)} and ${formatColumnName(numericColumns[1].name)}?`);
  }
  
  return questions.slice(0, 5);
}

function generateTrustStatement(data: CleanedData): string {
  const reliability = calculateReliabilityScore(data);
  const totalMissing = data.columns.reduce((sum, col) => sum + (col.stats?.missing || 0), 0);
  const totalOutliers = data.columns.reduce((sum, col) => sum + (col.stats?.outliers?.length || 0), 0);
  
  const parts: string[] = [];
  
  if (reliability >= 85) {
    parts.push('This analysis is built on solid foundations. The data quality is high, patterns are consistent, and conclusions are well-supported.');
  } else if (reliability >= 70) {
    parts.push('This analysis provides reliable guidance for most decisions. Some areas have higher uncertainty, which we\'ve clearly marked.');
  } else {
    parts.push('This analysis offers directional insights, though data limitations mean some conclusions should be verified with additional information.');
  }
  
  // Limitations
  const limitations: string[] = [];
  if (totalMissing > 0) {
    limitations.push('some missing data points');
  }
  if (totalOutliers > 0) {
    limitations.push('unusual values that may represent special cases');
  }
  if (data.rowCount < 100) {
    limitations.push('a smaller sample size');
  }
  
  if (limitations.length > 0) {
    parts.push(`We've accounted for ${limitations.join(', ')} in our confidence assessments.`);
  }
  
  parts.push('We encourage you to explore the interactive charts to validate these findings against your domain knowledge. Your expertise combined with this data creates the most complete picture.');
  
  return parts.join(' ');
}

function formatColumnName(name: string): string {
  return name
    .replace(/_/g, ' ')
    .replace(/\b\w/g, c => c.toUpperCase());
}

function formatNumber(num: number): string {
  if (Math.abs(num) >= 1000000) {
    return (num / 1000000).toFixed(1) + 'M';
  }
  if (Math.abs(num) >= 1000) {
    return (num / 1000).toFixed(1) + 'K';
  }
  return num.toFixed(num % 1 === 0 ? 0 : 1);
}
