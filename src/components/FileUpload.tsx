import React, { useCallback, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Upload, FileSpreadsheet, AlertCircle, CheckCircle2 } from 'lucide-react';
import { parseCSV, validateData } from '@/lib/dataIngestion';

interface FileUploadProps {
  onDataLoaded: (data: Record<string, any>[]) => void;
  isProcessing: boolean;
}

export function FileUpload({ onDataLoaded, isProcessing }: FileUploadProps) {
  const [isDragging, setIsDragging] = useState(false);
  const [file, setFile] = useState<File | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [validationIssues, setValidationIssues] = useState<string[]>([]);

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  }, []);

  const handleDrop = useCallback(async (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    setError(null);
    
    const droppedFile = e.dataTransfer.files[0];
    if (droppedFile) {
      await processFile(droppedFile);
    }
  }, []);

  const handleFileSelect = useCallback(async (e: React.ChangeEvent<HTMLInputElement>) => {
    setError(null);
    const selectedFile = e.target.files?.[0];
    if (selectedFile) {
      await processFile(selectedFile);
    }
  }, []);

  const processFile = async (file: File) => {
    if (!file.name.endsWith('.csv')) {
      setError('Please upload a CSV file');
      return;
    }

    if (file.size > 10 * 1024 * 1024) {
      setError('File size must be less than 10MB');
      return;
    }

    setFile(file);
    
    try {
      const result = await parseCSV(file);
      
      if (result.errors.length > 0) {
        setValidationIssues(result.errors);
      }
      
      const validation = validateData(result.data);
      if (!validation.valid) {
        setValidationIssues(prev => [...prev, ...validation.issues]);
      }
      
      if (result.data.length > 0) {
        onDataLoaded(result.data);
      } else {
        setError('No valid data found in the file');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to parse file');
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="w-full max-w-2xl mx-auto"
    >
      <div
        className={`upload-zone p-12 text-center cursor-pointer ${isDragging ? 'active' : ''}`}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        onClick={() => document.getElementById('file-input')?.click()}
      >
        <input
          id="file-input"
          type="file"
          accept=".csv"
          onChange={handleFileSelect}
          className="hidden"
          disabled={isProcessing}
        />
        
        <motion.div
          animate={{ scale: isDragging ? 1.05 : 1 }}
          transition={{ duration: 0.2 }}
          className="space-y-4"
        >
          <div className="w-20 h-20 mx-auto rounded-2xl bg-primary/10 flex items-center justify-center">
            {isProcessing ? (
              <motion.div
                animate={{ rotate: 360 }}
                transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
              >
                <FileSpreadsheet className="w-10 h-10 text-primary" />
              </motion.div>
            ) : (
              <Upload className="w-10 h-10 text-primary" />
            )}
          </div>
          
          <div>
            <p className="text-lg font-medium text-foreground">
              {isProcessing ? 'Processing your data...' : 'Drop your CSV file here'}
            </p>
            <p className="text-sm text-muted-foreground mt-1">
              or click to browse • Max 10MB
            </p>
          </div>
          
          {file && !error && (
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              className="inline-flex items-center gap-2 px-4 py-2 bg-primary/10 rounded-lg"
            >
              <FileSpreadsheet className="w-4 h-4 text-primary" />
              <span className="text-sm font-medium">{file.name}</span>
              <CheckCircle2 className="w-4 h-4 text-primary" />
            </motion.div>
          )}
        </motion.div>
      </div>
      
      <AnimatePresence>
        {error && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="mt-4 p-4 bg-destructive/10 border border-destructive/20 rounded-xl flex items-start gap-3"
          >
            <AlertCircle className="w-5 h-5 text-destructive shrink-0 mt-0.5" />
            <p className="text-sm text-destructive">{error}</p>
          </motion.div>
        )}
        
        {validationIssues.length > 0 && !error && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="mt-4 p-4 bg-chart-3/10 border border-chart-3/20 rounded-xl"
          >
            <p className="text-sm font-medium text-chart-3 mb-2">Data Quality Notes:</p>
            <ul className="space-y-1">
              {validationIssues.slice(0, 3).map((issue, i) => (
                <li key={i} className="text-sm text-muted-foreground">• {issue}</li>
              ))}
            </ul>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}
