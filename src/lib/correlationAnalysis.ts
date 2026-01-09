import * as ss from 'simple-statistics';
import { CleanedData } from '@/types/analytics';

export interface CorrelationMatrix {
  columns: string[];
  matrix: number[][];
}

export interface ScatterPlotData {
  id: string;
  xColumn: string;
  yColumn: string;
  correlation: number;
  data: { x: number; y: number; label?: string }[];
}

export function calculateCorrelationMatrix(data: CleanedData): CorrelationMatrix {
  const numericColumns = data.columns.filter(c => c.type === 'numeric');
  const columnNames = numericColumns.map(c => c.name);
  
  const matrix: number[][] = [];
  
  for (let i = 0; i < numericColumns.length; i++) {
    const row: number[] = [];
    for (let j = 0; j < numericColumns.length; j++) {
      if (i === j) {
        row.push(1);
      } else {
        const xValues = numericColumns[i].values.filter(v => v !== null) as number[];
        const yValues = numericColumns[j].values.filter(v => v !== null) as number[];
        
        // Need same length arrays
        const minLen = Math.min(xValues.length, yValues.length);
        const x = xValues.slice(0, minLen);
        const y = yValues.slice(0, minLen);
        
        try {
          const correlation = ss.sampleCorrelation(x, y);
          row.push(isNaN(correlation) ? 0 : correlation);
        } catch {
          row.push(0);
        }
      }
    }
    matrix.push(row);
  }
  
  return { columns: columnNames, matrix };
}

export function generateScatterPlots(data: CleanedData): ScatterPlotData[] {
  const numericColumns = data.columns.filter(c => c.type === 'numeric');
  const scatterPlots: ScatterPlotData[] = [];
  
  // Generate top correlations (exclude self-correlations)
  const correlations: { i: number; j: number; corr: number }[] = [];
  
  for (let i = 0; i < numericColumns.length; i++) {
    for (let j = i + 1; j < numericColumns.length; j++) {
      const xValues = numericColumns[i].values.filter(v => v !== null) as number[];
      const yValues = numericColumns[j].values.filter(v => v !== null) as number[];
      
      const minLen = Math.min(xValues.length, yValues.length);
      const x = xValues.slice(0, minLen);
      const y = yValues.slice(0, minLen);
      
      try {
        const correlation = ss.sampleCorrelation(x, y);
        if (!isNaN(correlation)) {
          correlations.push({ i, j, corr: Math.abs(correlation) });
        }
      } catch {
        // Skip if correlation fails
      }
    }
  }
  
  // Sort by absolute correlation and take top 4
  correlations.sort((a, b) => b.corr - a.corr);
  const topCorrelations = correlations.slice(0, 4);
  
  for (const { i, j, corr } of topCorrelations) {
    const xCol = numericColumns[i];
    const yCol = numericColumns[j];
    
    const plotData: { x: number; y: number }[] = [];
    const minLen = Math.min(xCol.values.length, yCol.values.length);
    
    for (let k = 0; k < minLen; k++) {
      const x = xCol.values[k];
      const y = yCol.values[k];
      if (x !== null && y !== null) {
        plotData.push({ x: x as number, y: y as number });
      }
    }
    
    scatterPlots.push({
      id: `scatter-${xCol.name}-${yCol.name}`,
      xColumn: xCol.name,
      yColumn: yCol.name,
      correlation: corr,
      data: plotData.slice(0, 100), // Limit points for performance
    });
  }
  
  return scatterPlots;
}

export function getCorrelationColor(value: number): string {
  // Strong positive: green, strong negative: red, neutral: gray
  if (value > 0.7) return 'hsl(173, 80%, 40%)';
  if (value > 0.4) return 'hsl(173, 60%, 50%)';
  if (value > 0.1) return 'hsl(173, 40%, 60%)';
  if (value > -0.1) return 'hsl(220, 20%, 40%)';
  if (value > -0.4) return 'hsl(340, 40%, 60%)';
  if (value > -0.7) return 'hsl(340, 60%, 50%)';
  return 'hsl(340, 80%, 40%)';
}

export function getCorrelationLabel(value: number): string {
  const absVal = Math.abs(value);
  const direction = value >= 0 ? 'positive' : 'negative';
  
  if (absVal > 0.8) return `Very strong ${direction}`;
  if (absVal > 0.6) return `Strong ${direction}`;
  if (absVal > 0.4) return `Moderate ${direction}`;
  if (absVal > 0.2) return `Weak ${direction}`;
  return 'No correlation';
}
