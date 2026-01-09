import { motion } from 'framer-motion';
import { CorrelationMatrix as CorrelationMatrixType, getCorrelationColor, getCorrelationLabel } from '@/lib/correlationAnalysis';
import { useState } from 'react';

interface CorrelationMatrixProps {
  matrix: CorrelationMatrixType;
}

export function CorrelationMatrix({ matrix }: CorrelationMatrixProps) {
  const [hoveredCell, setHoveredCell] = useState<{ row: number; col: number } | null>(null);
  
  const formatColumnName = (name: string) => {
    return name.replace(/_/g, ' ').slice(0, 12) + (name.length > 12 ? '...' : '');
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="glass-panel p-6 space-y-4"
    >
      <div>
        <h3 className="font-semibold text-lg">Correlation Heatmap</h3>
        <p className="text-sm text-muted-foreground">Relationships between numeric variables</p>
      </div>
      
      <div className="overflow-x-auto">
        <div className="inline-block min-w-full">
          {/* Column headers */}
          <div className="flex">
            <div className="w-24 shrink-0" />
            {matrix.columns.map((col, i) => (
              <div
                key={`header-${i}`}
                className="w-16 h-20 flex items-end justify-center pb-2"
                title={col}
              >
                <span className="text-xs text-muted-foreground transform -rotate-45 origin-left whitespace-nowrap">
                  {formatColumnName(col)}
                </span>
              </div>
            ))}
          </div>
          
          {/* Matrix rows */}
          {matrix.matrix.map((row, rowIdx) => (
            <div key={`row-${rowIdx}`} className="flex">
              {/* Row label */}
              <div 
                className="w-24 h-12 flex items-center pr-2 text-xs text-muted-foreground truncate shrink-0"
                title={matrix.columns[rowIdx]}
              >
                {formatColumnName(matrix.columns[rowIdx])}
              </div>
              
              {/* Cells */}
              {row.map((value, colIdx) => (
                <motion.div
                  key={`cell-${rowIdx}-${colIdx}`}
                  className="w-16 h-12 flex items-center justify-center text-xs font-mono cursor-pointer relative"
                  style={{ backgroundColor: getCorrelationColor(value) }}
                  whileHover={{ scale: 1.1, zIndex: 10 }}
                  onMouseEnter={() => setHoveredCell({ row: rowIdx, col: colIdx })}
                  onMouseLeave={() => setHoveredCell(null)}
                >
                  <span className="text-white font-medium drop-shadow-md">
                    {value.toFixed(2)}
                  </span>
                  
                  {/* Tooltip */}
                  {hoveredCell?.row === rowIdx && hoveredCell?.col === colIdx && (
                    <motion.div
                      initial={{ opacity: 0, y: -5 }}
                      animate={{ opacity: 1, y: 0 }}
                      className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 p-2 bg-popover border border-border rounded-lg shadow-lg z-20 whitespace-nowrap"
                    >
                      <p className="text-xs font-medium">{matrix.columns[rowIdx]} ↔ {matrix.columns[colIdx]}</p>
                      <p className="text-xs text-muted-foreground">{getCorrelationLabel(value)}</p>
                    </motion.div>
                  )}
                </motion.div>
              ))}
            </div>
          ))}
        </div>
      </div>
      
      {/* Legend */}
      <div className="flex items-center justify-center gap-4 pt-4">
        <div className="flex items-center gap-2">
          <div className="w-4 h-4 rounded" style={{ backgroundColor: 'hsl(340, 80%, 40%)' }} />
          <span className="text-xs text-muted-foreground">Strong -</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-4 h-4 rounded" style={{ backgroundColor: 'hsl(220, 20%, 40%)' }} />
          <span className="text-xs text-muted-foreground">Neutral</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-4 h-4 rounded" style={{ backgroundColor: 'hsl(173, 80%, 40%)' }} />
          <span className="text-xs text-muted-foreground">Strong +</span>
        </div>
      </div>
    </motion.div>
  );
}
