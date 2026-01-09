import { motion } from 'framer-motion';
import { TrendingUp, TrendingDown, Minus, BarChart3, Hash, Calendar, Percent, Sparkles, AlertTriangle } from 'lucide-react';
import { CleanedData } from '@/types/analytics';

interface MetricSummaryCardsProps {
  data: CleanedData;
}

interface MetricCard {
  label: string;
  value: string;
  change?: number;
  trend?: 'up' | 'down' | 'stable';
  icon: React.ReactNode;
  color: string;
  isHighlighted?: boolean;
  highlightReason?: string;
}

export function MetricSummaryCards({ data }: MetricSummaryCardsProps) {
  const numericColumns = data.columns.filter(c => c.type === 'numeric');
  const dateColumns = data.columns.filter(c => c.type === 'datetime');
  
  const metrics: MetricCard[] = [];
  
  // Total Records
  metrics.push({
    label: 'Total Records',
    value: data.rowCount.toLocaleString(),
    icon: <Hash className="w-5 h-5" />,
    color: 'chart-1'
  });
  
  // Data Columns
  metrics.push({
    label: 'Data Points',
    value: data.columnCount.toString(),
    icon: <BarChart3 className="w-5 h-5" />,
    color: 'chart-2'
  });
  
  // Primary numeric metric with trend
  if (numericColumns.length > 0) {
    const primaryCol = numericColumns[0];
    const stats = primaryCol.stats;
    
    if (stats?.mean !== undefined) {
      const trendDirection = stats.trend === 'increasing' ? 'up' : 
                            stats.trend === 'decreasing' ? 'down' : 'stable';
      
      // Highlight if significant change
      const isSignificant = stats.percentChange && Math.abs(stats.percentChange) > 15;
      const isHighVariability = stats.stdDev && stats.mean && Math.abs(stats.stdDev / stats.mean) > 0.5;
      
      metrics.push({
        label: `Avg ${formatLabel(primaryCol.name)}`,
        value: formatNumber(stats.mean),
        change: stats.percentChange,
        trend: trendDirection,
        icon: isSignificant ? <Sparkles className="w-5 h-5" /> : <TrendingUp className="w-5 h-5" />,
        color: 'chart-3',
        isHighlighted: isSignificant || isHighVariability,
        highlightReason: isSignificant 
          ? `${Math.abs(stats.percentChange!).toFixed(0)}% ${trendDirection === 'up' ? 'growth' : 'decline'} - significant!`
          : isHighVariability ? 'High variability detected' : undefined
      });
    }
    
    // Second numeric metric if available
    if (numericColumns.length > 1) {
      const secondCol = numericColumns[1];
      const secondStats = secondCol.stats;
      
      if (secondStats?.mean !== undefined) {
        const trendDirection = secondStats.trend === 'increasing' ? 'up' : 
                              secondStats.trend === 'decreasing' ? 'down' : 'stable';
        
        const hasOutliers = secondStats.outliers && secondStats.outliers.length > 5;
        
        metrics.push({
          label: `Avg ${formatLabel(secondCol.name)}`,
          value: formatNumber(secondStats.mean),
          change: secondStats.percentChange,
          trend: trendDirection,
          icon: hasOutliers ? <AlertTriangle className="w-5 h-5" /> : <Percent className="w-5 h-5" />,
          color: 'chart-4',
          isHighlighted: hasOutliers,
          highlightReason: hasOutliers ? `${secondStats.outliers!.length} unusual values found` : undefined
        });
      }
    }
  }
  
  // Time span if date column exists
  if (dateColumns.length > 0) {
    const dateCol = dateColumns[0];
    const dateValues = dateCol.values.filter(v => v !== null) as string[];
    if (dateValues.length > 1) {
      const dates = dateValues.map(d => new Date(d)).filter(d => !isNaN(d.getTime()));
      if (dates.length > 1) {
        const minDate = new Date(Math.min(...dates.map(d => d.getTime())));
        const maxDate = new Date(Math.max(...dates.map(d => d.getTime())));
        const daysDiff = Math.round((maxDate.getTime() - minDate.getTime()) / (1000 * 60 * 60 * 24));
        
        const timeSpan = daysDiff > 365 ? `${Math.round(daysDiff / 365)} years` :
                        daysDiff > 30 ? `${Math.round(daysDiff / 30)} months` :
                        `${daysDiff} days`;
        
        metrics.push({
          label: 'Time Span',
          value: timeSpan,
          icon: <Calendar className="w-5 h-5" />,
          color: 'chart-5'
        });
      }
    }
  }
  
  return (
    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4 mb-8">
      {metrics.slice(0, 5).map((metric, index) => (
        <motion.div
          key={metric.label}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: index * 0.1 }}
          className={`relative overflow-hidden rounded-2xl bg-gradient-to-br from-${metric.color}/10 to-${metric.color}/5 border ${
            metric.isHighlighted 
              ? 'border-primary/50 ring-2 ring-primary/20' 
              : `border-${metric.color}/20`
          } p-4`}
        >
          {/* Highlight badge */}
          {metric.isHighlighted && (
            <div className="absolute top-2 right-2 z-20">
              <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                className="px-2 py-0.5 rounded-full bg-primary/90 text-primary-foreground text-[10px] font-bold"
              >
                KEY INSIGHT
              </motion.div>
            </div>
          )}
          
          {/* Icon background */}
          <div className={`absolute -right-2 -top-2 w-16 h-16 rounded-full bg-${metric.color}/10 blur-xl`} />
          
          {/* Content */}
          <div className="relative z-10">
            <div className={`w-10 h-10 rounded-xl bg-${metric.color}/20 flex items-center justify-center mb-3`}>
              <span className={`text-${metric.color}`}>{metric.icon}</span>
            </div>
            
            <p className="text-sm text-muted-foreground mb-1">{metric.label}</p>
            
            <div className="flex items-center gap-2">
              <span className="text-2xl font-bold">{metric.value}</span>
              
              {metric.trend && metric.change !== undefined && (
                <div className={`flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium ${
                  metric.trend === 'up' 
                    ? 'bg-green-500/20 text-green-400' 
                    : metric.trend === 'down' 
                    ? 'bg-red-500/20 text-red-400' 
                    : 'bg-gray-500/20 text-gray-400'
                }`}>
                  {metric.trend === 'up' ? (
                    <TrendingUp className="w-3 h-3" />
                  ) : metric.trend === 'down' ? (
                    <TrendingDown className="w-3 h-3" />
                  ) : (
                    <Minus className="w-3 h-3" />
                  )}
                  <span>{Math.abs(metric.change).toFixed(1)}%</span>
                </div>
              )}
            </div>
            
            {/* Highlight reason tooltip */}
            {metric.highlightReason && (
              <motion.p
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.3 }}
                className="text-[10px] text-primary mt-2 font-medium"
              >
                💡 {metric.highlightReason}
              </motion.p>
            )}
          </div>
        </motion.div>
      ))}
    </div>
  );
}

function formatLabel(name: string): string {
  return name
    .replace(/_/g, ' ')
    .replace(/\b\w/g, c => c.toUpperCase())
    .slice(0, 15);
}

function formatNumber(num: number): string {
  if (Math.abs(num) >= 1000000) {
    return (num / 1000000).toFixed(1) + 'M';
  }
  if (Math.abs(num) >= 1000) {
    return (num / 1000).toFixed(1) + 'K';
  }
  return num.toFixed(num % 1 === 0 ? 0 : 1);
}
