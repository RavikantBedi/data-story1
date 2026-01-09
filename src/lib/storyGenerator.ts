import { CleanedData, DataStory, ChartConfig } from '@/types/analytics';

// Phrase variety pools to avoid repetition
const GROWTH_PHRASES = [
  'showing strong momentum',
  'on an upward trajectory',
  'experiencing notable gains',
  'demonstrating positive movement',
  'climbing steadily'
];

const DECLINE_PHRASES = [
  'facing downward pressure',
  'experiencing a pullback',
  'showing signs of retreat',
  'trending lower',
  'losing ground'
];

const STABILITY_PHRASES = [
  'holding steady',
  'maintaining its position',
  'showing consistency',
  'remaining balanced',
  'demonstrating resilience'
];

const VARIABILITY_PHRASES = [
  'exhibits notable fluctuations',
  'shows considerable swings',
  'demonstrates significant variation',
  'displays uneven patterns',
  'reveals irregular behavior'
];

const POSITIVE_OPENERS = [
  'Encouraging developments emerge from this analysis.',
  'The numbers tell a promising story.',
  'Several bright spots stand out in this dataset.',
  'Performance indicators point in a favorable direction.',
  'There are reasons for optimism here.'
];

const CONCERN_OPENERS = [
  'This analysis surfaces some areas worth watching.',
  'The data highlights patterns that merit attention.',
  'Several indicators suggest room for improvement.',
  'Some trends warrant closer examination.',
  'The findings reveal opportunities for course correction.'
];

const NEUTRAL_OPENERS = [
  'This dataset reveals a nuanced picture.',
  'The analysis uncovers a blend of patterns.',
  'Multiple dynamics are at play here.',
  'The data presents a layered story.',
  'Several interesting patterns emerge from this review.'
];

function pickRandom<T>(arr: T[]): T {
  return arr[Math.floor(Math.random() * arr.length)];
}

export function generateDataStory(data: CleanedData, charts: ChartConfig[]): DataStory {
  const numericColumns = data.columns.filter(c => c.type === 'numeric');
  const categoricalColumns = data.columns.filter(c => c.type === 'categorical');
  const dateColumns = data.columns.filter(c => c.type === 'datetime');
  
  const overview = generateExecutiveSnapshot(data, numericColumns, categoricalColumns, dateColumns);
  const keyTrends = generateWhatsWorkingWell(numericColumns, charts, data);
  const anomalies = generateWhereDataRaisesQuestions(numericColumns, categoricalColumns);
  const insights = generateHiddenPatternsAndActions(data, charts, numericColumns, categoricalColumns);
  const conclusion = generateClosingInterpretation(data, keyTrends, anomalies, insights, numericColumns);
  
  return {
    title: generateEngagingTitle(data, numericColumns),
    overview,
    keyTrends,
    anomalies,
    insights,
    conclusion,
  };
}

function generateEngagingTitle(data: CleanedData, numericColumns: CleanedData['columns']): string {
  const hasTimeSeries = data.columns.some(c => c.type === 'datetime');
  const primaryMetric = numericColumns[0]?.name || 'Performance';
  
  const titles = hasTimeSeries ? [
    `Decoding Your ${formatColumnName(primaryMetric)} Journey`,
    `The Story Behind Your ${formatColumnName(primaryMetric)} Numbers`,
    `${formatColumnName(primaryMetric)} Performance: What the Data Reveals`,
    `Understanding ${formatColumnName(primaryMetric)} Over Time`
  ] : [
    `Insights from ${data.rowCount.toLocaleString()} Data Points`,
    `What ${data.rowCount.toLocaleString()} Records Tell Us`,
    `A Deep Dive into Your Dataset`,
    `Unlocking Patterns Across ${data.columnCount} Dimensions`
  ];
  
  return pickRandom(titles);
}

function generateExecutiveSnapshot(
  data: CleanedData, 
  numericColumns: CleanedData['columns'],
  categoricalColumns: CleanedData['columns'],
  dateColumns: CleanedData['columns']
): string {
  const parts: string[] = [];
  
  // Determine overall sentiment
  let positiveSignals = 0;
  let concernSignals = 0;
  
  numericColumns.slice(0, 3).forEach(col => {
    if (col.stats?.trend === 'increasing') positiveSignals++;
    if (col.stats?.trend === 'decreasing') concernSignals++;
    if (col.stats?.stdDev && col.stats?.mean && (col.stats.stdDev / Math.abs(col.stats.mean)) > 0.5) concernSignals++;
  });
  
  // Opening hook based on sentiment
  if (positiveSignals > concernSignals) {
    parts.push(pickRandom(POSITIVE_OPENERS));
  } else if (concernSignals > positiveSignals) {
    parts.push(pickRandom(CONCERN_OPENERS));
  } else {
    parts.push(pickRandom(NEUTRAL_OPENERS));
  }
  
  // Business context
  if (numericColumns.length > 0 && categoricalColumns.length > 0) {
    const primaryNum = formatColumnName(numericColumns[0].name);
    const primaryCat = formatColumnName(categoricalColumns[0].name);
    parts.push(`The analysis examines ${primaryNum} across different ${primaryCat} segments, drawing from ${data.rowCount.toLocaleString()} individual records.`);
  } else {
    parts.push(`Drawing from ${data.rowCount.toLocaleString()} records across ${data.columnCount} dimensions, this analysis surfaces the patterns that matter most.`);
  }
  
  // Time context
  if (dateColumns.length > 0) {
    const dateCol = dateColumns[0];
    const dateValues = dateCol.values.filter(v => v !== null) as string[];
    if (dateValues.length > 1) {
      const dates = dateValues.map(d => new Date(d)).filter(d => !isNaN(d.getTime()));
      if (dates.length > 1) {
        const minDate = new Date(Math.min(...dates.map(d => d.getTime())));
        const maxDate = new Date(Math.max(...dates.map(d => d.getTime())));
        const daysDiff = Math.round((maxDate.getTime() - minDate.getTime()) / (1000 * 60 * 60 * 24));
        
        if (daysDiff > 365) {
          parts.push(`This spans approximately ${Math.round(daysDiff / 365)} years of activity, providing substantial historical context.`);
        } else if (daysDiff > 30) {
          parts.push(`The timeframe covers roughly ${Math.round(daysDiff / 30)} months, offering a meaningful window into performance trends.`);
        } else {
          parts.push(`The data captures ${daysDiff} days of activity, suitable for short-term pattern analysis.`);
        }
      }
    }
  }
  
  // Data quality note
  const totalMissing = data.columns.reduce((sum, col) => sum + (col.stats?.missing || 0), 0);
  const completeness = ((1 - totalMissing / (data.rowCount * data.columnCount)) * 100);
  
  if (completeness > 98) {
    parts.push('Data quality is excellent—these findings rest on a solid foundation.');
  } else if (completeness > 90) {
    parts.push('Minor gaps exist in the data, though not enough to undermine the core insights.');
  } else if (completeness > 75) {
    parts.push('Some data completeness issues exist; interpret findings with appropriate caution.');
  }
  
  return parts.join(' ');
}

function generateWhatsWorkingWell(
  numericColumns: CleanedData['columns'], 
  charts: ChartConfig[],
  data: CleanedData
): string[] {
  const observations: string[] = [];
  const usedPhrases = new Set<string>();
  
  // Helper to get unique phrase
  const getUniqueTrendPhrase = (trend: 'increasing' | 'decreasing' | 'stable'): string => {
    const pool = trend === 'increasing' ? GROWTH_PHRASES : 
                 trend === 'decreasing' ? DECLINE_PHRASES : STABILITY_PHRASES;
    let phrase = pickRandom(pool);
    let attempts = 0;
    while (usedPhrases.has(phrase) && attempts < pool.length) {
      phrase = pickRandom(pool);
      attempts++;
    }
    usedPhrases.add(phrase);
    return phrase;
  };
  
  numericColumns.slice(0, 4).forEach(col => {
    const stats = col.stats;
    if (!stats) return;
    
    const name = formatColumnName(col.name);
    
    if (stats.trend && stats.percentChange !== undefined) {
      const change = stats.percentChange;
      const absChange = Math.abs(change);
      const trendPhrase = getUniqueTrendPhrase(stats.trend);
      
      if (stats.trend === 'increasing') {
        if (absChange > 25) {
          observations.push(
            `${name} is ${trendPhrase}, with gains of ${absChange.toFixed(0)}% over the analyzed period. This kind of acceleration often signals either a successful initiative taking hold or favorable external conditions—either way, understanding the driver could help sustain the momentum.`
          );
        } else if (absChange > 8) {
          observations.push(
            `${name} is ${trendPhrase} at a respectable ${absChange.toFixed(0)}%. While not explosive, this measured growth suggests sustainable progress rather than a temporary spike.`
          );
        } else if (absChange > 0) {
          observations.push(
            `${name} shows marginal improvement of ${absChange.toFixed(0)}%. The direction is positive, though the pace may not match more ambitious growth targets.`
          );
        }
      } else if (stats.trend === 'decreasing') {
        if (absChange > 25) {
          observations.push(
            `${name} is ${trendPhrase}, down ${absChange.toFixed(0)}% from earlier levels. This magnitude of change rarely happens without cause—identifying the root factor should be a priority before the trend compounds.`
          );
        } else if (absChange > 8) {
          observations.push(
            `${name} has ${trendPhrase} by ${absChange.toFixed(0)}%. Not yet alarming, but the direction warrants monitoring to catch any acceleration early.`
          );
        } else if (absChange > 0) {
          observations.push(
            `${name} has dipped slightly by ${absChange.toFixed(0)}%. A minor fluctuation that could be noise—or an early warning worth watching.`
          );
        }
      } else {
        observations.push(
          `${name} is ${trendPhrase} across the period. Depending on context, this consistency could be a sign of maturity (healthy plateau) or stagnation (missed opportunities for growth).`
        );
      }
    }
    
    // Distribution insight
    if (stats.percentiles && stats.mean && stats.median) {
      const skew = (stats.mean - stats.median) / Math.abs(stats.mean);
      if (Math.abs(skew) > 0.15 && observations.length < 4) {
        const direction = skew > 0 ? 'high-value outliers pulling the average up' : 'concentration in lower values';
        observations.push(
          `The distribution of ${name} reveals ${direction}. This means typical performance differs from the mathematical average—use the median (${stats.median.toLocaleString()}) for more realistic benchmarking.`
        );
      }
    }
  });
  
  // Momentum analysis
  if (numericColumns.length > 0) {
    const primaryCol = numericColumns[0];
    const values = primaryCol.values.filter(v => v !== null) as number[];
    
    if (values.length >= 9) {
      const lastQuarter = values.slice(-Math.floor(values.length / 4));
      const previousQuarter = values.slice(Math.floor(values.length / 2), Math.floor(values.length * 3 / 4));
      
      if (lastQuarter.length > 0 && previousQuarter.length > 0) {
        const recentAvg = lastQuarter.reduce((a, b) => a + b, 0) / lastQuarter.length;
        const prevAvg = previousQuarter.reduce((a, b) => a + b, 0) / previousQuarter.length;
        const momentum = ((recentAvg - prevAvg) / Math.abs(prevAvg)) * 100;
        
        if (momentum > 15) {
          observations.push(
            `Recent momentum looks particularly strong—the latest portion of data shows ${momentum.toFixed(0)}% improvement over earlier periods. If this acceleration continues, results could exceed initial projections.`
          );
        } else if (momentum < -15) {
          observations.push(
            `Recent performance has softened compared to earlier in the dataset, down ${Math.abs(momentum).toFixed(0)}%. This deceleration is worth investigating—something may have changed in the operating environment.`
          );
        }
      }
    }
  }
  
  return observations.slice(0, 5);
}

function generateWhereDataRaisesQuestions(
  numericColumns: CleanedData['columns'],
  categoricalColumns: CleanedData['columns']
): string[] {
  const questions: string[] = [];
  const usedVariabilityPhrases = new Set<string>();
  
  // Variability analysis
  numericColumns.slice(0, 3).forEach(col => {
    const stats = col.stats;
    if (!stats?.stdDev || !stats?.mean || stats.mean === 0) return;
    
    const cv = Math.abs(stats.stdDev / stats.mean) * 100;
    const name = formatColumnName(col.name);
    
    let phrase = pickRandom(VARIABILITY_PHRASES);
    while (usedVariabilityPhrases.has(phrase)) {
      phrase = pickRandom(VARIABILITY_PHRASES);
    }
    usedVariabilityPhrases.add(phrase);
    
    if (cv > 60) {
      questions.push(
        `${name} ${phrase}, with values swinging widely around the average. This level of unpredictability could complicate forecasting and resource allocation. Understanding whether this stems from genuine volatility or data quality issues would be valuable.`
      );
    } else if (cv > 35) {
      questions.push(
        `${name} ${phrase.replace('notable', 'moderate')}. While some variation is healthy, the spread here suggests different conditions or segments may be at play. Segmented analysis could reveal hidden patterns.`
      );
    } else if (cv < 8) {
      questions.push(
        `${name} remains remarkably tight in its range—almost unusually so. This extreme consistency is great for predictability but might also indicate limited room for improvement or potential data constraints.`
      );
    }
  });
  
  // Outlier analysis
  numericColumns.forEach(col => {
    if (col.stats?.outliers && col.stats.outliers.length > 0) {
      const outlierCount = col.stats.outliers.length;
      const name = formatColumnName(col.name);
      const totalValues = col.values.filter(v => v !== null).length;
      const outlierPct = ((outlierCount / totalValues) * 100).toFixed(1);
      
      if (outlierCount <= 3 && questions.length < 4) {
        questions.push(
          `A handful of exceptional values appear in ${name}—just ${outlierCount} out of ${totalValues.toLocaleString()} records (${outlierPct}%). These could be your star performers, unusual circumstances, or data entry errors. Each scenario has different implications worth exploring.`
        );
      } else if (outlierCount > 10 && questions.length < 4) {
        questions.push(
          `${name} contains ${outlierCount} outliers (${outlierPct}% of records), which is higher than typical. This many exceptions suggest either fundamentally different subgroups within your data or systematic issues that need attention.`
        );
      }
    }
  });
  
  // Categorical concentration
  categoricalColumns.slice(0, 2).forEach(col => {
    if (col.stats?.mode && col.stats?.count && questions.length < 4) {
      const modeCount = col.values.filter(v => v === col.stats?.mode).length;
      const modePercentage = (modeCount / col.stats.count) * 100;
      const name = formatColumnName(col.name);
      
      if (modePercentage > 60) {
        questions.push(
          `Over ${modePercentage.toFixed(0)}% of records fall under "${col.stats.mode}" for ${name}. This heavy concentration means smaller segments might get lost in aggregate analysis—yet those segments could hold important opportunities or risks.`
        );
      } else if (col.stats.unique && col.stats.unique > 20) {
        questions.push(
          `${name} has ${col.stats.unique} distinct values, which creates a fragmented picture. For actionable insights, consider grouping similar categories together before drawing conclusions.`
        );
      }
    }
  });
  
  return questions.slice(0, 4);
}

function generateHiddenPatternsAndActions(
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
    
    if (col1.stats?.stdDev && col2.stats?.stdDev && col1.stats?.mean && col2.stats?.mean) {
      const cv1 = Math.abs(col1.stats.stdDev / col1.stats.mean);
      const cv2 = Math.abs(col2.stats.stdDev / col2.stats.mean);
      
      if (cv1 > cv2 * 1.5) {
        insights.push(
          `An interesting dynamic: ${formatColumnName(col1.name)} swings more dramatically than ${formatColumnName(col2.name)}. If reducing overall volatility is a goal, focus efforts on stabilizing ${formatColumnName(col1.name)}—it offers more leverage for improvement.`
        );
      } else if (cv2 > cv1 * 1.5) {
        insights.push(
          `${formatColumnName(col2.name)} shows greater instability compared to ${formatColumnName(col1.name)}. This imbalance could point to different underlying processes or control mechanisms between the two metrics.`
        );
      }
    }
  }
  
  // Benchmark insights
  if (numericColumns.length > 0) {
    const primaryCol = numericColumns[0];
    if (primaryCol.stats?.percentiles) {
      const p25 = primaryCol.stats.percentiles.p25;
      const p75 = primaryCol.stats.percentiles.p75;
      const name = formatColumnName(primaryCol.name);
      
      insights.push(
        `For ${name}, the middle 50% of values fall between ${p25.toLocaleString()} and ${p75.toLocaleString()}. Use this range as a practical benchmark—values below ${p25.toLocaleString()} may need attention, while those above ${p75.toLocaleString()} represent your top performers.`
      );
    }
  }
  
  // Chart-based discoveries
  const hasSpikes = charts.some(c => c.insights.some(i => i.type === 'spike'));
  const hasDrops = charts.some(c => c.insights.some(i => i.type === 'drop'));
  const hasAnomalies = charts.some(c => c.insights.some(i => i.type === 'anomaly'));
  
  if (hasSpikes) {
    insights.push(
      `Notable spikes appear in the data—moments where values jumped significantly above the norm. These peaks could represent one-time events, seasonal surges, or breakthrough performances. Clicking on these points in the charts will reveal what made them special.`
    );
  }
  
  if (hasDrops) {
    insights.push(
      `Several dips stand out as potential concern points—times when performance fell below expectations. Each of these moments has a story; investigating the circumstances could help prevent similar declines in the future.`
    );
  }
  
  if (hasAnomalies && !hasSpikes && !hasDrops) {
    insights.push(
      `The analysis flagged several unusual data points that deviate from established patterns. These anomalies—whether positive or negative—often hold the most valuable lessons. The interactive charts allow deeper exploration of each one.`
    );
  }
  
  // Actionable recommendations
  const volatileMetrics = numericColumns.filter(col => {
    if (!col.stats?.stdDev || !col.stats?.mean) return false;
    return Math.abs(col.stats.stdDev / col.stats.mean) > 0.4;
  });
  
  if (volatileMetrics.length > 0) {
    const names = volatileMetrics.slice(0, 2).map(c => formatColumnName(c.name)).join(' and ');
    insights.push(
      `Consider establishing monitoring thresholds for ${names}. Given their variability, setting alert boundaries could help catch unusual movements before they become larger issues.`
    );
  }
  
  // Segmentation suggestion
  if (categoricalColumns.length > 0 && numericColumns.length > 0) {
    const catName = formatColumnName(categoricalColumns[0].name);
    const numName = formatColumnName(numericColumns[0].name);
    insights.push(
      `Breaking down ${numName} by ${catName} could reveal whether certain segments perform markedly differently. This kind of segmented view often surfaces actionable opportunities that aggregate analysis misses.`
    );
  }
  
  return insights.slice(0, 5);
}

function generateClosingInterpretation(
  data: CleanedData,
  trends: string[], 
  patterns: string[], 
  insights: string[],
  numericColumns: CleanedData['columns']
): string {
  const parts: string[] = [];
  
  // Overall assessment without repetitive phrases
  const positiveIndicators = trends.filter(t => 
    t.includes('momentum') || t.includes('gains') || t.includes('improvement') || t.includes('growth') || t.includes('strong')
  ).length;
  
  const concernIndicators = patterns.filter(p => 
    p.includes('concern') || p.includes('warrant') || p.includes('attention') || p.includes('unpredictability')
  ).length;
  
  if (positiveIndicators > concernIndicators * 1.5) {
    parts.push('Taking a step back, the overall picture leans positive.');
  } else if (concernIndicators > positiveIndicators * 1.5) {
    parts.push('In summary, this analysis surfaces some areas that merit focused attention.');
  } else {
    parts.push('The data presents a balanced picture—neither overwhelmingly positive nor concerning.');
  }
  
  // Confidence level
  const totalRecords = data.rowCount;
  const totalOutliers = numericColumns.reduce((sum, col) => sum + (col.stats?.outliers?.length || 0), 0);
  
  if (totalRecords > 1000 && totalOutliers / totalRecords < 0.02) {
    parts.push('With a substantial sample size and clean data, these conclusions carry good weight for decision-making.');
  } else if (totalRecords > 100) {
    parts.push('The dataset provides adequate foundation for directional insights, though specific predictions should be validated.');
  } else {
    parts.push('Given the limited sample size, treat these findings as preliminary hypotheses rather than definitive conclusions.');
  }
  
  // Forward-looking statement
  if (insights.length > 2) {
    parts.push('Several actionable threads have emerged from this analysis—prioritize those aligned with your most pressing objectives.');
  }
  
  parts.push('The interactive dashboard enables deeper exploration: click on any data point to understand the specific factors at play during that moment.');
  
  return parts.join(' ');
}

function formatColumnName(name: string): string {
  return name
    .replace(/_/g, ' ')
    .replace(/\b\w/g, c => c.toUpperCase());
}
