export interface DataColumn {
  name: string;
  type: 'numeric' | 'categorical' | 'datetime' | 'text';
  values: (string | number | null)[];
  stats?: ColumnStats;
}

export interface ColumnStats {
  count: number;
  missing: number;
  unique: number;
  min?: number;
  max?: number;
  mean?: number;
  median?: number;
  stdDev?: number;
  mode?: string | number;
  percentiles?: { p25: number; p50: number; p75: number };
  outliers?: number[];
  trend?: 'increasing' | 'decreasing' | 'stable';
  percentChange?: number;
}

export interface CleanedData {
  columns: DataColumn[];
  rows: Record<string, string | number | null>[];
  rowCount: number;
  columnCount: number;
  cleaningLog: string[];
}

export interface ChartConfig {
  id: string;
  type: 'line' | 'bar' | 'pie' | 'area' | 'scatter';
  title: string;
  xAxis: string;
  yAxis: string;
  data: Record<string, any>[];
  insights: ChartInsight[];
}

export interface ChartInsight {
  type: 'spike' | 'drop' | 'trend' | 'anomaly' | 'correlation';
  severity: 'high' | 'medium' | 'low';
  description: string;
  dataPoint?: { x: any; y: any };
}

export interface DataStory {
  title: string;
  overview: string;
  keyTrends: string[];
  anomalies: string[];
  insights: string[];
  conclusion: string;
}

export interface TrustLayer {
  reliabilityScore: number;
  reliabilityDetails: string;
  safeConclusions: string[];
  uncertainConclusions: string[];
  insightEvidence: InsightEvidence[];
  anomalyTimeline: AnomalyEvent[];
  whatIfScenario: WhatIfScenario;
  multiStyleExplanation: MultiStyleExplanation;
  nextQuestions: string[];
  trustStatement: string;
}

export interface InsightEvidence {
  insight: string;
  confidence: number;
  evidenceStrength: 'weak' | 'moderate' | 'strong';
  dataPointsSupporting: number;
  isRepeated: boolean;
  assumptions: string[];
}

export interface AnomalyEvent {
  timestamp: string;
  description: string;
  significance: 'high' | 'medium' | 'low';
  possibleExplanations: string[];
}

export interface WhatIfScenario {
  scenario: string;
  direction: 'positive' | 'negative' | 'neutral';
  magnitude: 'low' | 'medium' | 'high';
  assumptions: string[];
  explanation: string;
}

export interface MultiStyleExplanation {
  simple: string;
  executive: string;
  analyst: string;
}

export interface ClickExplanation {
  chartId: string;
  dataPoint: { x: any; y: any };
  explanation: string;
  context: string;
  relatedInsights: string[];
}

export interface AnalyticsState {
  rawData: any[] | null;
  cleanedData: CleanedData | null;
  charts: ChartConfig[];
  dataStory: DataStory | null;
  isProcessing: boolean;
  error: string | null;
}
