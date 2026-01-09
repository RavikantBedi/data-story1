import { DataColumn, CleanedData, ColumnStats } from '@/types/analytics';
import { inferColumnType } from './dataIngestion';
import * as ss from 'simple-statistics';

export function cleanAndPrepareData(rawData: Record<string, any>[]): CleanedData {
  const cleaningLog: string[] = [];
  let data = [...rawData];
  
  // Remove duplicates
  const beforeDedup = data.length;
  const seen = new Set<string>();
  data = data.filter(row => {
    const key = JSON.stringify(row);
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });
  const dupRemoved = beforeDedup - data.length;
  if (dupRemoved > 0) {
    cleaningLog.push(`Removed ${dupRemoved} duplicate rows`);
  }
  
  // Get column names
  const columnNames = Object.keys(data[0] || {});
  
  // Process each column
  const columns: DataColumn[] = columnNames.map(name => {
    const values = data.map(row => row[name]);
    const type = inferColumnType(values);
    
    // Clean values based on type
    const cleanedValues = values.map(v => {
      if (v === null || v === undefined || v === '') return null;
      if (type === 'numeric') {
        const num = typeof v === 'number' ? v : parseFloat(v);
        return isNaN(num) ? null : num;
      }
      return v;
    });
    
    // Handle missing values for numeric columns
    if (type === 'numeric') {
      const numericVals = cleanedValues.filter(v => v !== null) as number[];
      if (numericVals.length > 0) {
        const median = ss.median(numericVals);
        const missingCount = cleanedValues.filter(v => v === null).length;
        
        cleanedValues.forEach((v, i) => {
          if (v === null) {
            cleanedValues[i] = median;
          }
        });
        
        if (missingCount > 0) {
          cleaningLog.push(`Filled ${missingCount} missing values in "${name}" with median (${median.toFixed(2)})`);
        }
      }
    }
    
    // Calculate stats
    const stats = calculateColumnStats(cleanedValues, type);
    
    return {
      name,
      type,
      values: cleanedValues,
      stats,
    };
  });
  
  // Rebuild rows with cleaned data
  const cleanedRows = data.map((_, rowIndex) => {
    const row: Record<string, string | number | null> = {};
    columns.forEach(col => {
      row[col.name] = col.values[rowIndex];
    });
    return row;
  });
  
  // Sort by datetime column if exists
  const dateColumn = columns.find(c => c.type === 'datetime');
  if (dateColumn) {
    cleanedRows.sort((a, b) => {
      const dateA = new Date(a[dateColumn.name] as string).getTime();
      const dateB = new Date(b[dateColumn.name] as string).getTime();
      return dateA - dateB;
    });
    cleaningLog.push(`Sorted data by "${dateColumn.name}"`);
  }
  
  return {
    columns,
    rows: cleanedRows,
    rowCount: cleanedRows.length,
    columnCount: columns.length,
    cleaningLog,
  };
}

function calculateColumnStats(values: (string | number | null)[], type: string): ColumnStats {
  const nonNullValues = values.filter(v => v !== null);
  const stats: ColumnStats = {
    count: values.length,
    missing: values.filter(v => v === null).length,
    unique: new Set(nonNullValues).size,
  };
  
  if (type === 'numeric') {
    const numericVals = nonNullValues as number[];
    if (numericVals.length > 0) {
      stats.min = ss.min(numericVals);
      stats.max = ss.max(numericVals);
      stats.mean = ss.mean(numericVals);
      stats.median = ss.median(numericVals);
      stats.stdDev = numericVals.length > 1 ? ss.standardDeviation(numericVals) : 0;
      
      const q1 = ss.quantile(numericVals, 0.25);
      const q3 = ss.quantile(numericVals, 0.75);
      stats.percentiles = {
        p25: q1,
        p50: stats.median,
        p75: q3,
      };
      
      // Detect outliers using IQR
      const iqr = q3 - q1;
      const lowerBound = q1 - 1.5 * iqr;
      const upperBound = q3 + 1.5 * iqr;
      stats.outliers = numericVals.filter(v => v < lowerBound || v > upperBound);
      
      // Detect trend
      if (numericVals.length >= 3) {
        const indices = numericVals.map((_, i) => i);
        const pairs: [number, number][] = indices.map((x, i) => [x, numericVals[i]]);
        const regression = ss.linearRegression(pairs);
        const slope = regression.m;
        
        if (Math.abs(slope) < stats.stdDev * 0.1) {
          stats.trend = 'stable';
        } else if (slope > 0) {
          stats.trend = 'increasing';
        } else {
          stats.trend = 'decreasing';
        }
        
        // Calculate percentage change (first to last)
        if (numericVals[0] !== 0) {
          stats.percentChange = ((numericVals[numericVals.length - 1] - numericVals[0]) / Math.abs(numericVals[0])) * 100;
        }
      }
    }
  } else if (type === 'categorical') {
    // Find mode
    const counts = new Map<string | number, number>();
    nonNullValues.forEach(v => {
      counts.set(v as string | number, (counts.get(v as string | number) || 0) + 1);
    });
    let maxCount = 0;
    let mode: string | number | undefined;
    counts.forEach((count, value) => {
      if (count > maxCount) {
        maxCount = count;
        mode = value;
      }
    });
    stats.mode = mode;
  }
  
  return stats;
}

function calculateSlope(x: number[], y: number[]): number {
  const n = x.length;
  const sumX = ss.sum(x);
  const sumY = ss.sum(y);
  const sumXY = x.reduce((acc, xi, i) => acc + xi * y[i], 0);
  const sumXX = x.reduce((acc, xi) => acc + xi * xi, 0);
  
  return (n * sumXY - sumX * sumY) / (n * sumXX - sumX * sumX);
}
