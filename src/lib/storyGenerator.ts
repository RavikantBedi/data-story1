import { CleanedData, DataStory, ChartConfig } from '@/types/analytics';

// Simple, everyday phrases for different scenarios
const GOING_UP_PHRASES = [
  'is going up',
  'is growing',
  'is getting better',
  'is increasing',
  'is rising'
];

const GOING_DOWN_PHRASES = [
  'is going down',
  'is dropping',
  'is falling',
  'is decreasing',
  'is slowing down'
];

const STAYING_SAME_PHRASES = [
  'is staying steady',
  'is holding firm',
  'is consistent',
  'is stable',
  'has not changed much'
];

const UPS_AND_DOWNS_PHRASES = [
  'has a lot of ups and downs',
  'is all over the place',
  'keeps changing',
  'is unpredictable',
  'swings a lot'
];

function pickRandom<T>(arr: T[]): T {
  return arr[Math.floor(Math.random() * arr.length)];
}

export function generateDataStory(data: CleanedData, charts: ChartConfig[]): DataStory {
  const numericColumns = data.columns.filter(c => c.type === 'numeric');
  const categoricalColumns = data.columns.filter(c => c.type === 'categorical');
  const dateColumns = data.columns.filter(c => c.type === 'datetime');
  
  const overview = generateSimpleOverview(data, numericColumns, categoricalColumns, dateColumns);
  const keyTrends = generateWhatsHappening(numericColumns, data);
  const anomalies = generateWhatToWatch(numericColumns, categoricalColumns);
  const insights = generateFutureOutlookAndBusinessImpact(data, charts, numericColumns, categoricalColumns);
  const conclusion = generateSimpleConclusion(data, keyTrends, anomalies, insights, numericColumns);
  
  return {
    title: generateSimpleTitle(data, numericColumns),
    overview,
    keyTrends,
    anomalies,
    insights,
    conclusion,
  };
}

function generateSimpleTitle(data: CleanedData, numericColumns: CleanedData['columns']): string {
  const hasTime = data.columns.some(c => c.type === 'datetime');
  const mainThing = numericColumns[0]?.name || 'Data';
  
  const titles = hasTime ? [
    `Your ${formatColumnName(mainThing)} Report: What's Really Going On`,
    `Understanding Your ${formatColumnName(mainThing)} - Plain and Simple`,
    `${formatColumnName(mainThing)} Explained: Past, Present, and Future`,
    `The Truth About Your ${formatColumnName(mainThing)} Numbers`
  ] : [
    `What ${data.rowCount.toLocaleString()} Records Tell Us About Your Business`,
    `Your Data Story: Clear Insights from ${data.rowCount.toLocaleString()} Records`,
    `Breaking Down Your Numbers - No Jargon, Just Facts`,
    `Simple Answers from Complex Data`
  ];
  
  return pickRandom(titles);
}

function generateSimpleOverview(
  data: CleanedData, 
  numericColumns: CleanedData['columns'],
  categoricalColumns: CleanedData['columns'],
  dateColumns: CleanedData['columns']
): string {
  const parts: string[] = [];
  
  // Count good vs concerning signs
  let goodSigns = 0;
  let worrySigns = 0;
  
  numericColumns.slice(0, 3).forEach(col => {
    if (col.stats?.trend === 'increasing') goodSigns++;
    if (col.stats?.trend === 'decreasing') worrySigns++;
    if (col.stats?.stdDev && col.stats?.mean && (col.stats.stdDev / Math.abs(col.stats.mean)) > 0.5) worrySigns++;
  });
  
  // Simple opening based on what we see
  if (goodSigns > worrySigns) {
    parts.push('Good news! Your numbers are mostly heading in the right direction.');
  } else if (worrySigns > goodSigns) {
    parts.push('Heads up - there are some things in your data that need attention.');
  } else {
    parts.push('Your data shows a mixed picture - some things are going well, others need watching.');
  }
  
  // What the data is about
  if (numericColumns.length > 0 && categoricalColumns.length > 0) {
    const mainNumber = formatColumnName(numericColumns[0].name);
    const mainCategory = formatColumnName(categoricalColumns[0].name);
    parts.push(`We looked at your ${mainNumber} across different ${mainCategory} groups, using ${data.rowCount.toLocaleString()} records in total.`);
  } else {
    parts.push(`This report is based on ${data.rowCount.toLocaleString()} records with ${data.columnCount} different measurements.`);
  }
  
  // Time period
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
          parts.push(`This covers about ${Math.round(daysDiff / 365)} years of your business activity - enough time to spot real patterns.`);
        } else if (daysDiff > 30) {
          parts.push(`We're looking at roughly ${Math.round(daysDiff / 30)} months of data here.`);
        } else {
          parts.push(`This data covers ${daysDiff} days of activity.`);
        }
      }
    }
  }
  
  // Data quality - simple
  const totalMissing = data.columns.reduce((sum, col) => sum + (col.stats?.missing || 0), 0);
  const completeness = ((1 - totalMissing / (data.rowCount * data.columnCount)) * 100);
  
  if (completeness > 98) {
    parts.push('Your data is very complete and reliable - we can trust these findings.');
  } else if (completeness > 90) {
    parts.push('A few records have missing information, but nothing that changes the big picture.');
  } else if (completeness > 75) {
    parts.push('Some data is missing, so take these findings as guidance rather than exact answers.');
  }
  
  return parts.join(' ');
}

function generateWhatsHappening(
  numericColumns: CleanedData['columns'], 
  data: CleanedData
): string[] {
  const findings: string[] = [];
  const usedPhrases = new Set<string>();
  
  const getTrendPhrase = (trend: 'increasing' | 'decreasing' | 'stable'): string => {
    const pool = trend === 'increasing' ? GOING_UP_PHRASES : 
                 trend === 'decreasing' ? GOING_DOWN_PHRASES : STAYING_SAME_PHRASES;
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
      const trendPhrase = getTrendPhrase(stats.trend);
      
      if (stats.trend === 'increasing') {
        if (absChange > 25) {
          findings.push(
            `📈 ${name} ${trendPhrase} - up ${absChange.toFixed(0)}%! This is a big jump. In simple terms: whatever is driving this ${name.toLowerCase()} increase is working really well. If this continues, your company could see major improvements in related areas. The key question is: what changed that made this happen, and can we keep it going?`
          );
        } else if (absChange > 8) {
          findings.push(
            `📈 ${name} ${trendPhrase} by ${absChange.toFixed(0)}%. This is healthy growth - not too fast, not too slow. For your company, this means things are moving in the right direction without the risks that come with sudden spikes.`
          );
        } else if (absChange > 0) {
          findings.push(
            `📈 ${name} ${trendPhrase} slightly (${absChange.toFixed(0)}%). The direction is good, but the pace is slow. This might be okay if you're in a stable industry, but if you expected faster growth, it's worth asking why.`
          );
        }
      } else if (stats.trend === 'decreasing') {
        if (absChange > 25) {
          findings.push(
            `📉 Warning: ${name} ${trendPhrase} significantly - down ${absChange.toFixed(0)}%. This is a serious drop that needs attention right away. For your company, this could mean lost revenue, declining customer interest, or operational problems. Finding the cause should be a top priority.`
          );
        } else if (absChange > 8) {
          findings.push(
            `📉 ${name} ${trendPhrase} by ${absChange.toFixed(0)}%. This isn't critical yet, but it's a warning sign. If this trend continues over the next few months, it could become a bigger problem. Now is the time to investigate and fix it.`
          );
        } else if (absChange > 0) {
          findings.push(
            `📉 ${name} has dipped a little (${absChange.toFixed(0)}%). This could just be normal variation, or it could be the start of a bigger trend. Keep an eye on it over the coming weeks.`
          );
        }
      } else {
        findings.push(
          `➡️ ${name} ${trendPhrase} throughout the period. No big changes up or down. This can be good (predictable and reliable) or concerning (no growth). It depends on what your goals are for this metric.`
        );
      }
    }
    
    // Average vs typical value
    if (stats.percentiles && stats.mean && stats.median) {
      const skew = (stats.mean - stats.median) / Math.abs(stats.mean);
      if (Math.abs(skew) > 0.15 && findings.length < 4) {
        if (skew > 0) {
          findings.push(
            `💡 About ${name}: The average (${stats.mean.toLocaleString()}) is higher than what's typical (${stats.median.toLocaleString()}). This means a few really high values are pulling the average up. Most of the time, you'll see the lower number. Use ${stats.median.toLocaleString()} for realistic planning.`
          );
        } else {
          findings.push(
            `💡 About ${name}: Most values are actually higher than the average suggests. Some unusually low numbers are dragging the average down. Your typical performance is better than it might look at first glance.`
          );
        }
      }
    }
  });
  
  // Recent vs earlier comparison
  if (numericColumns.length > 0) {
    const primaryCol = numericColumns[0];
    const values = primaryCol.values.filter(v => v !== null) as number[];
    
    if (values.length >= 9) {
      const recentPart = values.slice(-Math.floor(values.length / 4));
      const earlierPart = values.slice(Math.floor(values.length / 2), Math.floor(values.length * 3 / 4));
      
      if (recentPart.length > 0 && earlierPart.length > 0) {
        const recentAvg = recentPart.reduce((a, b) => a + b, 0) / recentPart.length;
        const earlierAvg = earlierPart.reduce((a, b) => a + b, 0) / earlierPart.length;
        const change = ((recentAvg - earlierAvg) / Math.abs(earlierAvg)) * 100;
        
        if (change > 15) {
          findings.push(
            `🚀 Great news for the future: Recent ${formatColumnName(primaryCol.name)} is ${change.toFixed(0)}% better than earlier! This upward momentum suggests things are improving. If nothing changes, you can expect continued growth in the coming period.`
          );
        } else if (change < -15) {
          findings.push(
            `⚠️ Heads up: Recent ${formatColumnName(primaryCol.name)} has dropped ${Math.abs(change).toFixed(0)}% compared to before. This slowdown is a red flag. Without action, this trend might continue and affect your bottom line.`
          );
        }
      }
    }
  }
  
  return findings.slice(0, 5);
}

function generateWhatToWatch(
  numericColumns: CleanedData['columns'],
  categoricalColumns: CleanedData['columns']
): string[] {
  const watchItems: string[] = [];
  
  // Things that change a lot
  numericColumns.slice(0, 3).forEach(col => {
    const stats = col.stats;
    if (!stats?.stdDev || !stats?.mean || stats.mean === 0) return;
    
    const variation = Math.abs(stats.stdDev / stats.mean) * 100;
    const name = formatColumnName(col.name);
    
    let phrase = pickRandom(UPS_AND_DOWNS_PHRASES);
    
    if (variation > 60) {
      watchItems.push(
        `⚡ ${name} ${phrase}. What this means for your company: It's hard to predict or plan around this number. One month might be great, the next might be challenging. For the future, consider finding out what causes these swings - is it seasonal? Customer behavior? Something you can control? Reducing this unpredictability would make planning much easier.`
      );
    } else if (variation > 35) {
      watchItems.push(
        `⚡ ${name} varies more than you might expect. This creates some uncertainty in planning. Looking ahead, if you could reduce this variation by even a little, your forecasts would be more accurate and your operations smoother.`
      );
    } else if (variation < 8) {
      watchItems.push(
        `✅ Good news: ${name} is very consistent - it barely changes. This makes it easy to plan around. However, if you want to improve this number, you'll need to do something different because it won't change on its own.`
      );
    }
  });
  
  // Unusual values
  numericColumns.forEach(col => {
    if (col.stats?.outliers && col.stats.outliers.length > 0) {
      const unusualCount = col.stats.outliers.length;
      const name = formatColumnName(col.name);
      const total = col.values.filter(v => v !== null).length;
      const percent = ((unusualCount / total) * 100).toFixed(1);
      
      if (unusualCount <= 3 && watchItems.length < 4) {
        watchItems.push(
          `🔍 ${name} has ${unusualCount} unusual values (${percent}% of all records). These stand out from the rest. They could be: (1) your best or worst performers, (2) special one-time events, or (3) possible errors. Understanding which type they are will help you decide what to do about them.`
        );
      } else if (unusualCount > 10 && watchItems.length < 4) {
        watchItems.push(
          `🔍 There are ${unusualCount} unusual values in ${name} (${percent}% of records). This is more than typical, suggesting you might have different groups mixed in your data (like big clients vs small ones). Separating these groups could give you clearer insights.`
        );
      }
    }
  });
  
  // Category concentration
  categoricalColumns.slice(0, 2).forEach(col => {
    if (col.stats?.mode && col.stats?.count && watchItems.length < 4) {
      const modeCount = col.values.filter(v => v === col.stats?.mode).length;
      const modePercent = (modeCount / col.stats.count) * 100;
      const name = formatColumnName(col.name);
      
      if (modePercent > 60) {
        watchItems.push(
          `📊 Over ${modePercent.toFixed(0)}% of your records are in the "${col.stats.mode}" category for ${name}. Your business is heavily concentrated in this area. For the future: this is efficient but risky. If something affects this main category, it affects most of your business. Consider whether diversifying makes sense.`
        );
      } else if (col.stats.unique && col.stats.unique > 20) {
        watchItems.push(
          `📊 ${name} has ${col.stats.unique} different categories - that's a lot to track. For clearer insights and better decision-making, think about grouping similar ones together.`
        );
      }
    }
  });
  
  return watchItems.slice(0, 4);
}

function generateFutureOutlookAndBusinessImpact(
  data: CleanedData, 
  charts: ChartConfig[], 
  numericColumns: CleanedData['columns'],
  categoricalColumns: CleanedData['columns']
): string[] {
  const insights: string[] = [];
  
  // What's most important to fix
  if (numericColumns.length >= 2) {
    const col1 = numericColumns[0];
    const col2 = numericColumns[1];
    
    if (col1.stats?.stdDev && col2.stats?.stdDev && col1.stats?.mean && col2.stats?.mean) {
      const var1 = Math.abs(col1.stats.stdDev / col1.stats.mean);
      const var2 = Math.abs(col2.stats.stdDev / col2.stats.mean);
      
      if (var1 > var2 * 1.5) {
        insights.push(
          `🎯 WHERE TO FOCUS: ${formatColumnName(col1.name)} is much more unpredictable than ${formatColumnName(col2.name)}. If you want to make your business more stable, start by tackling ${formatColumnName(col1.name)} first - fixing this will have the biggest impact.`
        );
      } else if (var2 > var1 * 1.5) {
        insights.push(
          `🎯 WHERE TO FOCUS: ${formatColumnName(col2.name)} swings more than ${formatColumnName(col1.name)}. Understanding why will help you reduce surprises in your operations.`
        );
      }
    }
  }
  
  // Performance benchmarks in plain language
  if (numericColumns.length > 0) {
    const primaryCol = numericColumns[0];
    if (primaryCol.stats?.percentiles) {
      const bottom = primaryCol.stats.percentiles.p25;
      const top = primaryCol.stats.percentiles.p75;
      const name = formatColumnName(primaryCol.name);
      
      insights.push(
        `📏 SIMPLE BENCHMARK FOR ${name.toUpperCase()}: Below ${bottom.toLocaleString()} = needs improvement. Between ${bottom.toLocaleString()} and ${top.toLocaleString()} = doing okay. Above ${top.toLocaleString()} = doing great! Use these numbers to quickly judge future performance.`
      );
    }
  }
  
  // Future predictions based on patterns
  const hasSpikes = charts.some(c => c.insights.some(i => i.type === 'spike'));
  const hasDrops = charts.some(c => c.insights.some(i => i.type === 'drop'));
  
  if (hasSpikes) {
    insights.push(
      `📈 FUTURE OPPORTUNITY: Your data shows some big spikes - times when things went really well. Study what happened during these peaks. If you can recreate those conditions, you might be able to make high performance happen more often instead of by accident.`
    );
  }
  
  if (hasDrops) {
    insights.push(
      `📉 FUTURE RISK: There were some significant drops in your data. Understanding what caused these dips helps you prevent them from happening again. Each time you avoid a drop, you protect your revenue and resources.`
    );
  }
  
  // Specific business impact
  const volatileMetrics = numericColumns.filter(col => {
    if (!col.stats?.stdDev || !col.stats?.mean) return false;
    return Math.abs(col.stats.stdDev / col.stats.mean) > 0.4;
  });
  
  if (volatileMetrics.length > 0) {
    const names = volatileMetrics.slice(0, 2).map(c => formatColumnName(c.name)).join(' and ');
    insights.push(
      `⚙️ HOW THIS AFFECTS YOUR COMPANY: The unpredictability in ${names} means you need bigger safety buffers - more inventory, more staff on standby, more cash reserves. Reducing this variation could cut your operating costs and make your business more efficient.`
    );
  }
  
  // Segment analysis suggestion
  if (categoricalColumns.length > 0 && numericColumns.length > 0) {
    const catName = formatColumnName(categoricalColumns[0].name);
    const numName = formatColumnName(numericColumns[0].name);
    insights.push(
      `🔎 NEXT STEP: Look at ${numName} separately for each ${catName}. Some groups might be doing much better than others. Finding your best performers and learning from them could improve your overall results.`
    );
  }
  
  // Long-term outlook
  const growingMetrics = numericColumns.filter(c => c.stats?.trend === 'increasing').length;
  const decliningMetrics = numericColumns.filter(c => c.stats?.trend === 'decreasing').length;
  
  if (growingMetrics > decliningMetrics * 1.5) {
    insights.push(
      `🌟 LONG-TERM OUTLOOK: Most of your key numbers are heading up. If current trends continue, your company is on track for growth. The main job now is to maintain this momentum and avoid disruptions.`
    );
  } else if (decliningMetrics > growingMetrics * 1.5) {
    insights.push(
      `⚠️ LONG-TERM OUTLOOK: Several key metrics are declining. Without changes, this could lead to reduced performance over time. The sooner you identify and address the root causes, the easier it will be to turn things around.`
    );
  } else {
    insights.push(
      `🔮 LONG-TERM OUTLOOK: Your business is in a relatively stable state - not surging forward, but not falling back either. This is a good time to experiment with improvements, since you have a stable base to build from.`
    );
  }
  
  return insights.slice(0, 6);
}

function generateSimpleConclusion(
  data: CleanedData,
  trends: string[], 
  patterns: string[], 
  insights: string[],
  numericColumns: CleanedData['columns']
): string {
  const parts: string[] = [];
  
  // Simple summary
  const goodThings = trends.filter(t => 
    t.includes('going up') || t.includes('growing') || t.includes('better') || t.includes('Great news')
  ).length;
  
  const worryThings = patterns.filter(p => 
    p.includes('Warning') || p.includes('attention') || p.includes('Heads up') || p.includes('unpredictable')
  ).length;
  
  if (goodThings > worryThings * 1.5) {
    parts.push('THE BOTTOM LINE: Things are looking good overall.');
  } else if (worryThings > goodThings * 1.5) {
    parts.push('THE BOTTOM LINE: There are some challenges that need your attention.');
  } else {
    parts.push('THE BOTTOM LINE: It\'s a mixed picture with both good things and areas to work on.');
  }
  
  // How reliable is this?
  const totalRecords = data.rowCount;
  const totalOutliers = numericColumns.reduce((sum, col) => sum + (col.stats?.outliers?.length || 0), 0);
  
  if (totalRecords > 1000 && totalOutliers / totalRecords < 0.02) {
    parts.push('With over a thousand clean records, you can trust these findings to guide your decisions.');
  } else if (totalRecords > 100) {
    parts.push('This analysis gives you a good sense of what\'s happening. For major decisions, you might want to gather a bit more data to confirm.');
  } else {
    parts.push('Since we\'re working with a smaller dataset, treat these as early signals rather than definite answers.');
  }
  
  // What to do next
  parts.push('WHAT TO DO NOW: Focus on the top 1-2 issues identified above. Small improvements in key areas often have bigger effects than trying to fix everything at once.');
  
  parts.push('Use the interactive charts to explore specific moments in your data. Click on any point to see what was happening at that exact time.');
  
  return parts.join(' ');
}

function formatColumnName(name: string): string {
  return name
    .replace(/_/g, ' ')
    .replace(/\b\w/g, c => c.toUpperCase());
}
