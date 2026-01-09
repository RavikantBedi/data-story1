import { motion } from 'framer-motion';
import { 
  TrendingUp, 
  TrendingDown, 
  Minus, 
  Hash, 
  Tag, 
  Calendar,
  AlertTriangle 
} from 'lucide-react';
import { CleanedData } from '@/types/analytics';

interface StatsOverviewProps {
  data: CleanedData;
}

export function StatsOverview({ data }: StatsOverviewProps) {
  const numericColumns = data.columns.filter(c => c.type === 'numeric');
  
  const containerVariants = {
    hidden: { opacity: 0 },
    show: {
      opacity: 1,
      transition: { staggerChildren: 0.1 }
    }
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    show: { opacity: 1, y: 0 }
  };

  return (
    <div className="space-y-6">
      {/* Summary Stats */}
      <motion.div 
        variants={containerVariants}
        initial="hidden"
        animate="show"
        className="grid grid-cols-2 md:grid-cols-4 gap-4"
      >
        <motion.div variants={itemVariants} className="stat-card">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-chart-1/15 flex items-center justify-center">
              <Hash className="w-5 h-5 text-chart-1" />
            </div>
            <div>
              <p className="text-2xl font-bold">{data.rowCount.toLocaleString()}</p>
              <p className="text-xs text-muted-foreground">Total Records</p>
            </div>
          </div>
        </motion.div>
        
        <motion.div variants={itemVariants} className="stat-card">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-chart-2/15 flex items-center justify-center">
              <Tag className="w-5 h-5 text-chart-2" />
            </div>
            <div>
              <p className="text-2xl font-bold">{data.columnCount}</p>
              <p className="text-xs text-muted-foreground">Variables</p>
            </div>
          </div>
        </motion.div>
        
        <motion.div variants={itemVariants} className="stat-card">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-chart-3/15 flex items-center justify-center">
              <Calendar className="w-5 h-5 text-chart-3" />
            </div>
            <div>
              <p className="text-2xl font-bold">
                {data.columns.filter(c => c.type === 'datetime').length}
              </p>
              <p className="text-xs text-muted-foreground">Time Series</p>
            </div>
          </div>
        </motion.div>
        
        <motion.div variants={itemVariants} className="stat-card">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-chart-4/15 flex items-center justify-center">
              <AlertTriangle className="w-5 h-5 text-chart-4" />
            </div>
            <div>
              <p className="text-2xl font-bold">
                {numericColumns.reduce((sum, col) => sum + (col.stats?.outliers?.length || 0), 0)}
              </p>
              <p className="text-xs text-muted-foreground">Outliers</p>
            </div>
          </div>
        </motion.div>
      </motion.div>

      {/* Column Details */}
      <motion.div
        variants={containerVariants}
        initial="hidden"
        animate="show"
        className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4"
      >
        {numericColumns.slice(0, 6).map((col) => (
          <motion.div key={col.name} variants={itemVariants} className="stat-card">
            <div className="flex items-start justify-between mb-3">
              <div>
                <h4 className="font-medium text-sm truncate max-w-[150px]" title={col.name}>
                  {formatColumnName(col.name)}
                </h4>
                <p className="text-xs text-muted-foreground">Numeric</p>
              </div>
              {col.stats?.trend && (
                <div className={getTrendBadgeClass(col.stats.trend)}>
                  {getTrendIcon(col.stats.trend)}
                  <span className="text-xs">
                    {col.stats.percentChange !== undefined 
                      ? `${col.stats.percentChange > 0 ? '+' : ''}${col.stats.percentChange.toFixed(1)}%`
                      : col.stats.trend}
                  </span>
                </div>
              )}
            </div>
            
            <div className="grid grid-cols-2 gap-3 text-sm">
              <div>
                <p className="text-muted-foreground text-xs">Mean</p>
                <p className="font-mono font-medium">
                  {col.stats?.mean?.toFixed(2) ?? '-'}
                </p>
              </div>
              <div>
                <p className="text-muted-foreground text-xs">Median</p>
                <p className="font-mono font-medium">
                  {col.stats?.median?.toFixed(2) ?? '-'}
                </p>
              </div>
              <div>
                <p className="text-muted-foreground text-xs">Min</p>
                <p className="font-mono font-medium">
                  {col.stats?.min?.toFixed(2) ?? '-'}
                </p>
              </div>
              <div>
                <p className="text-muted-foreground text-xs">Max</p>
                <p className="font-mono font-medium">
                  {col.stats?.max?.toFixed(2) ?? '-'}
                </p>
              </div>
            </div>
          </motion.div>
        ))}
      </motion.div>

      {/* Cleaning Log */}
      {data.cleaningLog.length > 0 && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="glass-panel p-4"
        >
          <h4 className="font-medium text-sm mb-3">Data Preprocessing Log</h4>
          <div className="space-y-2">
            {data.cleaningLog.map((log, i) => (
              <div key={i} className="flex items-center gap-2 text-sm text-muted-foreground">
                <span className="w-5 h-5 rounded-full bg-chart-1/15 flex items-center justify-center text-xs text-chart-1">
                  ✓
                </span>
                {log}
              </div>
            ))}
          </div>
        </motion.div>
      )}
    </div>
  );
}

function formatColumnName(name: string): string {
  return name
    .replace(/_/g, ' ')
    .replace(/\b\w/g, c => c.toUpperCase());
}

function getTrendBadgeClass(trend: string): string {
  switch (trend) {
    case 'increasing':
      return 'insight-badge-positive';
    case 'decreasing':
      return 'insight-badge-negative';
    default:
      return 'insight-badge-neutral';
  }
}

function getTrendIcon(trend: string) {
  switch (trend) {
    case 'increasing':
      return <TrendingUp className="w-3 h-3" />;
    case 'decreasing':
      return <TrendingDown className="w-3 h-3" />;
    default:
      return <Minus className="w-3 h-3" />;
  }
}
