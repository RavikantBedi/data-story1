import { CleanedData } from '@/types/analytics';
import * as ss from 'simple-statistics';

// ============ TYPES ============

export interface RegressionResult {
  column1: string;
  column2: string;
  slope: number;
  intercept: number;
  rSquared: number;
  prediction: (x: number) => number;
  interpretation: string;
}

export interface MutualInformationResult {
  column1: string;
  column2: string;
  score: number;
  strength: 'weak' | 'moderate' | 'strong';
  interpretation: string;
}

export interface ANOVAResult {
  categoricalColumn: string;
  numericColumn: string;
  fStatistic: number;
  pValue: number;
  significant: boolean;
  interpretation: string;
  groupMeans: Record<string, number>;
}

export interface ChiSquareResult {
  column1: string;
  column2: string;
  chiSquare: number;
  degreesOfFreedom: number;
  significant: boolean;
  interpretation: string;
}

export interface LeadLagResult {
  column1: string;
  column2: string;
  optimalLag: number;
  correlation: number;
  direction: 'leads' | 'lags' | 'synchronous';
  interpretation: string;
}

export interface AssociationRule {
  antecedent: string[];
  consequent: string[];
  support: number;
  confidence: number;
  lift: number;
  interpretation: string;
}

export interface BusinessHypothesis {
  id: string;
  hypothesis: string;
  possibleCause: string;
  testMethod: string;
  dataSupport: 'weak' | 'moderate' | 'strong';
  priority: 'low' | 'medium' | 'high';
  relatedColumns: string[];
}

export interface RiskOpportunity {
  id: string;
  type: 'opportunity' | 'risk' | 'neutral';
  title: string;
  description: string;
  impact: 'low' | 'medium' | 'high';
  confidence: number;
  actionable: boolean;
  suggestedAction?: string;
}

// ============ REGRESSION ============

export function performRegression(data: CleanedData): RegressionResult[] {
  const results: RegressionResult[] = [];
  const numericCols = data.columns.filter(c => c.type === 'numeric');
  
  for (let i = 0; i < numericCols.length; i++) {
    for (let j = i + 1; j < numericCols.length; j++) {
      const col1 = numericCols[i];
      const col2 = numericCols[j];
      
      const pairs: [number, number][] = [];
      data.rows.forEach(row => {
        const v1 = row[col1.name];
        const v2 = row[col2.name];
        if (typeof v1 === 'number' && typeof v2 === 'number' && !isNaN(v1) && !isNaN(v2)) {
          pairs.push([v1, v2]);
        }
      });
      
      if (pairs.length < 5) continue;
      
      const regression = ss.linearRegression(pairs);
      const regressionLine = ss.linearRegressionLine(regression);
      const rSquared = ss.rSquared(pairs, regressionLine);
      
      const interpretation = rSquared > 0.7
        ? `Strong linear relationship: ${col1.name} explains ${(rSquared * 100).toFixed(0)}% of variance in ${col2.name}`
        : rSquared > 0.4
        ? `Moderate linear relationship between ${col1.name} and ${col2.name}`
        : `Weak linear relationship; other factors likely influence ${col2.name}`;
      
      results.push({
        column1: col1.name,
        column2: col2.name,
        slope: regression.m,
        intercept: regression.b,
        rSquared,
        prediction: regressionLine,
        interpretation
      });
    }
  }
  
  return results.sort((a, b) => b.rSquared - a.rSquared).slice(0, 5);
}

// ============ MUTUAL INFORMATION (Approximation) ============

export function calculateMutualInformation(data: CleanedData): MutualInformationResult[] {
  const results: MutualInformationResult[] = [];
  const numericCols = data.columns.filter(c => c.type === 'numeric');
  
  for (let i = 0; i < numericCols.length; i++) {
    for (let j = i + 1; j < numericCols.length; j++) {
      const col1 = numericCols[i];
      const col2 = numericCols[j];
      
      const values1: number[] = [];
      const values2: number[] = [];
      
      data.rows.forEach(row => {
        const v1 = row[col1.name];
        const v2 = row[col2.name];
        if (typeof v1 === 'number' && typeof v2 === 'number' && !isNaN(v1) && !isNaN(v2)) {
          values1.push(v1);
          values2.push(v2);
        }
      });
      
      if (values1.length < 10) continue;
      
      // Discretize into bins for MI calculation
      const bins = 5;
      const discretize = (vals: number[]) => {
        const min = Math.min(...vals);
        const max = Math.max(...vals);
        const step = (max - min) / bins || 1;
        return vals.map(v => Math.min(bins - 1, Math.floor((v - min) / step)));
      };
      
      const d1 = discretize(values1);
      const d2 = discretize(values2);
      
      // Calculate joint and marginal probabilities
      const jointCounts: Record<string, number> = {};
      const marginal1: Record<number, number> = {};
      const marginal2: Record<number, number> = {};
      const n = d1.length;
      
      for (let k = 0; k < n; k++) {
        const key = `${d1[k]}-${d2[k]}`;
        jointCounts[key] = (jointCounts[key] || 0) + 1;
        marginal1[d1[k]] = (marginal1[d1[k]] || 0) + 1;
        marginal2[d2[k]] = (marginal2[d2[k]] || 0) + 1;
      }
      
      let mi = 0;
      for (const key of Object.keys(jointCounts)) {
        const [b1, b2] = key.split('-').map(Number);
        const pxy = jointCounts[key] / n;
        const px = marginal1[b1] / n;
        const py = marginal2[b2] / n;
        if (pxy > 0 && px > 0 && py > 0) {
          mi += pxy * Math.log2(pxy / (px * py));
        }
      }
      
      // Normalize to 0-1 range
      const normalizedMI = Math.min(1, Math.max(0, mi / Math.log2(bins)));
      
      const strength: 'weak' | 'moderate' | 'strong' = 
        normalizedMI > 0.5 ? 'strong' : normalizedMI > 0.2 ? 'moderate' : 'weak';
      
      results.push({
        column1: col1.name,
        column2: col2.name,
        score: normalizedMI,
        strength,
        interpretation: strength === 'strong'
          ? `Strong non-linear dependency between ${col1.name} and ${col2.name}`
          : strength === 'moderate'
          ? `Moderate information sharing between these variables`
          : `Weak mutual information; variables appear largely independent`
      });
    }
  }
  
  return results.sort((a, b) => b.score - a.score).slice(0, 5);
}

// ============ ANOVA ============

export function performANOVA(data: CleanedData): ANOVAResult[] {
  const results: ANOVAResult[] = [];
  const numericCols = data.columns.filter(c => c.type === 'numeric');
  const categoricalCols = data.columns.filter(c => c.type === 'categorical');
  
  for (const catCol of categoricalCols) {
    for (const numCol of numericCols) {
      const groups: Record<string, number[]> = {};
      
      data.rows.forEach(row => {
        const cat = String(row[catCol.name]);
        const val = row[numCol.name];
        if (typeof val === 'number' && !isNaN(val)) {
          if (!groups[cat]) groups[cat] = [];
          groups[cat].push(val);
        }
      });
      
      const groupNames = Object.keys(groups).filter(g => groups[g].length >= 3);
      if (groupNames.length < 2) continue;
      
      // Calculate F-statistic
      const allValues: number[] = [];
      groupNames.forEach(g => allValues.push(...groups[g]));
      const grandMean = ss.mean(allValues);
      
      let ssBetween = 0;
      let ssWithin = 0;
      
      groupNames.forEach(g => {
        const groupMean = ss.mean(groups[g]);
        ssBetween += groups[g].length * Math.pow(groupMean - grandMean, 2);
        groups[g].forEach(v => {
          ssWithin += Math.pow(v - groupMean, 2);
        });
      });
      
      const dfBetween = groupNames.length - 1;
      const dfWithin = allValues.length - groupNames.length;
      
      if (dfWithin <= 0) continue;
      
      const msBetween = ssBetween / dfBetween;
      const msWithin = ssWithin / dfWithin;
      const fStat = msWithin > 0 ? msBetween / msWithin : 0;
      
      // Approximate p-value (simplified)
      const significant = fStat > 3.0;
      
      const groupMeans: Record<string, number> = {};
      groupNames.forEach(g => {
        groupMeans[g] = ss.mean(groups[g]);
      });
      
      results.push({
        categoricalColumn: catCol.name,
        numericColumn: numCol.name,
        fStatistic: fStat,
        pValue: significant ? 0.01 : 0.1,
        significant,
        groupMeans,
        interpretation: significant
          ? `Significant difference in ${numCol.name} across ${catCol.name} groups (F=${fStat.toFixed(2)})`
          : `No significant difference in ${numCol.name} across ${catCol.name} groups`
      });
    }
  }
  
  return results.sort((a, b) => b.fStatistic - a.fStatistic).slice(0, 5);
}

// ============ CHI-SQUARE ============

export function performChiSquare(data: CleanedData): ChiSquareResult[] {
  const results: ChiSquareResult[] = [];
  const categoricalCols = data.columns.filter(c => c.type === 'categorical');
  
  for (let i = 0; i < categoricalCols.length; i++) {
    for (let j = i + 1; j < categoricalCols.length; j++) {
      const col1 = categoricalCols[i];
      const col2 = categoricalCols[j];
      
      // Build contingency table
      const contingency: Record<string, Record<string, number>> = {};
      const row1Totals: Record<string, number> = {};
      const col2Totals: Record<string, number> = {};
      let total = 0;
      
      data.rows.forEach(row => {
        const v1 = String(row[col1.name]);
        const v2 = String(row[col2.name]);
        
        if (!contingency[v1]) contingency[v1] = {};
        contingency[v1][v2] = (contingency[v1][v2] || 0) + 1;
        row1Totals[v1] = (row1Totals[v1] || 0) + 1;
        col2Totals[v2] = (col2Totals[v2] || 0) + 1;
        total++;
      });
      
      const rows = Object.keys(contingency);
      const cols = Object.keys(col2Totals);
      
      if (rows.length < 2 || cols.length < 2) continue;
      
      // Calculate chi-square
      let chiSquare = 0;
      rows.forEach(r => {
        cols.forEach(c => {
          const observed = contingency[r][c] || 0;
          const expected = (row1Totals[r] * col2Totals[c]) / total;
          if (expected > 0) {
            chiSquare += Math.pow(observed - expected, 2) / expected;
          }
        });
      });
      
      const df = (rows.length - 1) * (cols.length - 1);
      const significant = chiSquare > (df * 3.84); // Approximation
      
      results.push({
        column1: col1.name,
        column2: col2.name,
        chiSquare,
        degreesOfFreedom: df,
        significant,
        interpretation: significant
          ? `Significant association between ${col1.name} and ${col2.name} (Chi2=${chiSquare.toFixed(2)})`
          : `No significant association between these categorical variables`
      });
    }
  }
  
  return results.sort((a, b) => b.chiSquare - a.chiSquare).slice(0, 5);
}

// ============ LEAD-LAG ANALYSIS ============

export function performLeadLagAnalysis(data: CleanedData): LeadLagResult[] {
  const results: LeadLagResult[] = [];
  const numericCols = data.columns.filter(c => c.type === 'numeric');
  const hasDateCol = data.columns.some(c => c.type === 'datetime');
  
  if (!hasDateCol || numericCols.length < 2) return results;
  
  for (let i = 0; i < numericCols.length; i++) {
    for (let j = i + 1; j < numericCols.length; j++) {
      const col1 = numericCols[i];
      const col2 = numericCols[j];
      
      const series1: number[] = [];
      const series2: number[] = [];
      
      data.rows.forEach(row => {
        const v1 = row[col1.name];
        const v2 = row[col2.name];
        if (typeof v1 === 'number' && typeof v2 === 'number') {
          series1.push(v1);
          series2.push(v2);
        }
      });
      
      if (series1.length < 10) continue;
      
      // Test different lags
      let bestLag = 0;
      let bestCorr = 0;
      
      for (let lag = -5; lag <= 5; lag++) {
        const pairs: [number, number][] = [];
        for (let k = Math.max(0, -lag); k < Math.min(series1.length, series2.length - lag); k++) {
          pairs.push([series1[k], series2[k + lag]]);
        }
        
        if (pairs.length < 5) continue;
        
        const corr = Math.abs(ss.sampleCorrelation(pairs.map(p => p[0]), pairs.map(p => p[1])));
        if (corr > bestCorr) {
          bestCorr = corr;
          bestLag = lag;
        }
      }
      
      const direction: 'leads' | 'lags' | 'synchronous' = 
        bestLag < 0 ? 'leads' : bestLag > 0 ? 'lags' : 'synchronous';
      
      results.push({
        column1: col1.name,
        column2: col2.name,
        optimalLag: bestLag,
        correlation: bestCorr,
        direction,
        interpretation: direction === 'synchronous'
          ? `${col1.name} and ${col2.name} move together (correlation: ${bestCorr.toFixed(2)})`
          : `${col1.name} ${direction} ${col2.name} by ${Math.abs(bestLag)} periods`
      });
    }
  }
  
  return results.sort((a, b) => b.correlation - a.correlation).slice(0, 5);
}

// ============ ASSOCIATION RULES (Simplified) ============

export function findAssociationRules(data: CleanedData): AssociationRule[] {
  const rules: AssociationRule[] = [];
  const categoricalCols = data.columns.filter(c => c.type === 'categorical').slice(0, 4);
  
  if (categoricalCols.length < 2) return rules;
  
  // Build transactions
  const transactions = data.rows.map(row => 
    categoricalCols.map(c => `${c.name}=${row[c.name]}`)
  );
  
  const n = transactions.length;
  
  // Find frequent itemsets
  const itemCounts: Record<string, number> = {};
  const pairCounts: Record<string, number> = {};
  
  transactions.forEach(t => {
    t.forEach(item => {
      itemCounts[item] = (itemCounts[item] || 0) + 1;
    });
    
    for (let i = 0; i < t.length; i++) {
      for (let j = i + 1; j < t.length; j++) {
        const pair = [t[i], t[j]].sort().join('|');
        pairCounts[pair] = (pairCounts[pair] || 0) + 1;
      }
    }
  });
  
  // Generate rules
  for (const pair of Object.keys(pairCounts)) {
    const [item1, item2] = pair.split('|');
    const support = pairCounts[pair] / n;
    
    if (support < 0.05) continue;
    
    const confidence1 = pairCounts[pair] / itemCounts[item1];
    const confidence2 = pairCounts[pair] / itemCounts[item2];
    
    const expectedSupport1 = (itemCounts[item1] / n) * (itemCounts[item2] / n);
    const lift1 = support / expectedSupport1;
    
    if (confidence1 > 0.3 && lift1 > 1.2) {
      rules.push({
        antecedent: [item1],
        consequent: [item2],
        support,
        confidence: confidence1,
        lift: lift1,
        interpretation: `When ${item1}, there's a ${(confidence1 * 100).toFixed(0)}% chance of ${item2}`
      });
    }
    
    if (confidence2 > 0.3 && lift1 > 1.2) {
      rules.push({
        antecedent: [item2],
        consequent: [item1],
        support,
        confidence: confidence2,
        lift: lift1,
        interpretation: `When ${item2}, there's a ${(confidence2 * 100).toFixed(0)}% chance of ${item1}`
      });
    }
  }
  
  return rules.sort((a, b) => b.lift - a.lift).slice(0, 8);
}

// ============ BUSINESS HYPOTHESES ============

export function generateBusinessHypotheses(data: CleanedData): BusinessHypothesis[] {
  const hypotheses: BusinessHypothesis[] = [];
  const numericCols = data.columns.filter(c => c.type === 'numeric');
  const categoricalCols = data.columns.filter(c => c.type === 'categorical');
  
  // Analyze trends and anomalies
  numericCols.forEach(col => {
    if (!col.stats) return;
    
    // High variance hypothesis
    if (col.stats.stdDev && col.stats.mean && col.stats.stdDev / Math.abs(col.stats.mean) > 0.5) {
      hypotheses.push({
        id: `variance-${col.name}`,
        hypothesis: `High variance in ${formatColumnName(col.name)} may indicate distinct customer segments`,
        possibleCause: 'Multiple buyer personas or seasonal patterns',
        testMethod: 'Segment analysis by customer type or time period',
        dataSupport: 'moderate',
        priority: 'high',
        relatedColumns: [col.name]
      });
    }
    
    // Growth/decline hypothesis
    if (col.stats.trend === 'increasing' && col.stats.percentChange && col.stats.percentChange > 20) {
      hypotheses.push({
        id: `growth-${col.name}`,
        hypothesis: `${formatColumnName(col.name)} growth may be driven by a specific channel or campaign`,
        possibleCause: 'Recent marketing initiative or product improvement',
        testMethod: 'Attribution analysis by source/channel',
        dataSupport: 'strong',
        priority: 'medium',
        relatedColumns: [col.name]
      });
    }
    
    if (col.stats.trend === 'decreasing' && col.stats.percentChange && col.stats.percentChange < -15) {
      hypotheses.push({
        id: `decline-${col.name}`,
        hypothesis: `${formatColumnName(col.name)} decline may signal competitive pressure or market shift`,
        possibleCause: 'External market factors or internal quality issues',
        testMethod: 'Competitive analysis and customer feedback review',
        dataSupport: 'moderate',
        priority: 'high',
        relatedColumns: [col.name]
      });
    }
    
    // Outliers hypothesis
    if (col.stats.outliers && col.stats.outliers.length > 0) {
      hypotheses.push({
        id: `outliers-${col.name}`,
        hypothesis: `Outliers in ${formatColumnName(col.name)} may represent bulk buyers or data entry errors`,
        possibleCause: 'Enterprise customers, promotions, or system issues',
        testMethod: 'Manual review of top/bottom values with customer context',
        dataSupport: 'moderate',
        priority: 'medium',
        relatedColumns: [col.name]
      });
    }
  });
  
  // Category concentration hypothesis
  categoricalCols.forEach(col => {
    const counts: Record<string, number> = {};
    data.rows.forEach(row => {
      const val = String(row[col.name]);
      counts[val] = (counts[val] || 0) + 1;
    });
    
    const sorted = Object.entries(counts).sort((a, b) => b[1] - a[1]);
    const total = data.rowCount;
    
    if (sorted.length > 0 && sorted[0][1] / total > 0.6) {
      hypotheses.push({
        id: `concentration-${col.name}`,
        hypothesis: `Heavy concentration in "${sorted[0][0]}" ${formatColumnName(col.name)} may indicate opportunity for diversification`,
        possibleCause: 'Market specialization or limited targeting',
        testMethod: 'Expansion feasibility study for underrepresented segments',
        dataSupport: 'strong',
        priority: 'medium',
        relatedColumns: [col.name]
      });
    }
  });
  
  return hypotheses.slice(0, 6);
}

// ============ RISK & OPPORTUNITY RADAR ============

export function generateRiskOpportunityRadar(data: CleanedData): RiskOpportunity[] {
  const items: RiskOpportunity[] = [];
  const numericCols = data.columns.filter(c => c.type === 'numeric');
  
  numericCols.forEach(col => {
    if (!col.stats) return;
    
    // Opportunities
    if (col.stats.trend === 'increasing' && col.stats.percentChange && col.stats.percentChange > 15) {
      items.push({
        id: `opp-growth-${col.name}`,
        type: 'opportunity',
        title: `${formatColumnName(col.name)} Growth Momentum`,
        description: `${formatColumnName(col.name)} shows ${col.stats.percentChange.toFixed(1)}% growth - capitalize on this trend`,
        impact: col.stats.percentChange > 30 ? 'high' : 'medium',
        confidence: 75,
        actionable: true,
        suggestedAction: 'Analyze drivers and allocate resources to maintain momentum'
      });
    }
    
    // Risks
    if (col.stats.trend === 'decreasing' && col.stats.percentChange && col.stats.percentChange < -10) {
      items.push({
        id: `risk-decline-${col.name}`,
        type: 'risk',
        title: `${formatColumnName(col.name)} Declining`,
        description: `${formatColumnName(col.name)} dropped ${Math.abs(col.stats.percentChange).toFixed(1)}% - investigate root causes`,
        impact: col.stats.percentChange < -25 ? 'high' : 'medium',
        confidence: 80,
        actionable: true,
        suggestedAction: 'Conduct root cause analysis and develop recovery plan'
      });
    }
    
    // High volatility risk
    if (col.stats.stdDev && col.stats.mean && col.stats.stdDev / Math.abs(col.stats.mean) > 0.6) {
      items.push({
        id: `risk-volatility-${col.name}`,
        type: 'risk',
        title: `High ${formatColumnName(col.name)} Volatility`,
        description: 'Unpredictable swings make forecasting difficult and may indicate instability',
        impact: 'medium',
        confidence: 70,
        actionable: true,
        suggestedAction: 'Investigate causes and implement smoothing strategies'
      });
    }
    
    // Outlier opportunity
    if (col.stats.outliers && col.stats.outliers.length > 0) {
      const highOutliers = col.stats.outliers.filter(o => o > (col.stats?.mean || 0));
      if (highOutliers.length > 0) {
        items.push({
          id: `opp-outliers-${col.name}`,
          type: 'opportunity',
          title: `High-Value ${formatColumnName(col.name)} Cases`,
          description: `${highOutliers.length} exceptional values detected - study what made these successful`,
          impact: 'medium',
          confidence: 65,
          actionable: true,
          suggestedAction: 'Profile high performers to replicate success'
        });
      }
    }
    
    // Stable performance - neutral
    if (col.stats.trend === 'stable') {
      items.push({
        id: `neutral-stable-${col.name}`,
        type: 'neutral',
        title: `${formatColumnName(col.name)} Stable`,
        description: 'Consistent performance with no significant changes detected',
        impact: 'low',
        confidence: 85,
        actionable: false
      });
    }
  });
  
  // Data quality risk
  const missingPercentage = data.columns.reduce((sum, col) => 
    sum + (col.stats?.missing || 0), 0) / (data.rowCount * data.columnCount) * 100;
  
  if (missingPercentage > 5) {
    items.push({
      id: 'risk-data-quality',
      type: 'risk',
      title: 'Data Quality Concerns',
      description: `${missingPercentage.toFixed(1)}% missing data may affect analysis reliability`,
      impact: missingPercentage > 15 ? 'high' : 'medium',
      confidence: 90,
      actionable: true,
      suggestedAction: 'Improve data collection processes and address gaps'
    });
  }
  
  return items.sort((a, b) => {
    const typeOrder = { risk: 0, opportunity: 1, neutral: 2 };
    const impactOrder = { high: 0, medium: 1, low: 2 };
    return typeOrder[a.type] - typeOrder[b.type] || impactOrder[a.impact] - impactOrder[b.impact];
  }).slice(0, 8);
}

function formatColumnName(name: string): string {
  return name.replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase());
}
