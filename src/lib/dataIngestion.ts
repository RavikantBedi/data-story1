import Papa from 'papaparse';

export interface ParseResult {
  data: Record<string, any>[];
  errors: string[];
  meta: {
    fields: string[];
    rowCount: number;
  };
}

export async function parseCSV(file: File): Promise<ParseResult> {
  return new Promise((resolve, reject) => {
    Papa.parse(file, {
      header: true,
      skipEmptyLines: true,
      dynamicTyping: true,
      transformHeader: (header) => header.trim().replace(/\s+/g, '_'),
      complete: (results) => {
        const errors = results.errors.map(e => e.message);
        resolve({
          data: results.data as Record<string, any>[],
          errors,
          meta: {
            fields: results.meta.fields || [],
            rowCount: results.data.length,
          },
        });
      },
      error: (error) => {
        reject(new Error(`Failed to parse CSV: ${error.message}`));
      },
    });
  });
}

export function inferColumnType(values: any[]): 'numeric' | 'categorical' | 'datetime' | 'text' {
  const nonNullValues = values.filter(v => v !== null && v !== undefined && v !== '');
  
  if (nonNullValues.length === 0) return 'text';
  
  // Check for numeric
  const numericCount = nonNullValues.filter(v => typeof v === 'number' || !isNaN(parseFloat(v))).length;
  if (numericCount / nonNullValues.length > 0.8) return 'numeric';
  
  // Check for datetime
  const datePatterns = [
    /^\d{4}-\d{2}-\d{2}$/,
    /^\d{2}\/\d{2}\/\d{4}$/,
    /^\d{2}-\d{2}-\d{4}$/,
    /^\w{3}\s\d{1,2},?\s\d{4}$/,
  ];
  
  const dateCount = nonNullValues.filter(v => {
    if (typeof v !== 'string') return false;
    return datePatterns.some(pattern => pattern.test(v)) || !isNaN(Date.parse(v));
  }).length;
  
  if (dateCount / nonNullValues.length > 0.7) return 'datetime';
  
  // Check for categorical
  const uniqueRatio = new Set(nonNullValues).size / nonNullValues.length;
  if (uniqueRatio < 0.3) return 'categorical';
  
  return 'text';
}

export function validateData(data: Record<string, any>[]): { valid: boolean; issues: string[] } {
  const issues: string[] = [];
  
  if (!data || data.length === 0) {
    issues.push('Dataset is empty');
    return { valid: false, issues };
  }
  
  const fields = Object.keys(data[0]);
  if (fields.length === 0) {
    issues.push('No columns detected');
    return { valid: false, issues };
  }
  
  // Check for too many missing values
  fields.forEach(field => {
    const missingCount = data.filter(row => row[field] === null || row[field] === undefined || row[field] === '').length;
    const missingRatio = missingCount / data.length;
    if (missingRatio > 0.5) {
      issues.push(`Column "${field}" has ${Math.round(missingRatio * 100)}% missing values`);
    }
  });
  
  return { valid: issues.length === 0, issues };
}
