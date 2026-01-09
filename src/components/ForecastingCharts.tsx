import { useState } from 'react';
import { motion } from 'framer-motion';
import { TrendingUp, Calendar, Target, Info } from 'lucide-react';
import { CleanedData } from '@/types/analytics';
import { performRegression, RegressionResult } from '@/lib/advancedAnalytics';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  ReferenceLine,
  Area,
  ComposedChart
} from 'recharts';
import * as ss from 'simple-statistics';
import {
  Tooltip as UITooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";

interface ForecastingChartsProps {
  data: CleanedData;
}

interface ForecastData {
  column: string;
  historical: Array<{ index: number; value: number }>;
  forecast: Array<{ index: number; value: number; lower: number; upper: number }>;
  trend: 'up' | 'down' | 'stable';
  growthRate: number;
  confidence: number;
}

export function ForecastingCharts({ data }: ForecastingChartsProps) {
  const [selectedMetric, setSelectedMetric] = useState<string | null>(null);
  
  const numericCols = data.columns.filter(c => c.type === 'numeric');
  
  const generateForecasts = (): ForecastData[] => {
    const forecasts: ForecastData[] = [];
    
    numericCols.slice(0, 4).forEach(col => {
      const values: number[] = [];
      col.values.forEach(v => {
        if (typeof v === 'number' && !isNaN(v)) {
          values.push(v);
        }
      });
      
      if (values.length < 5) return;
      
      // Create indexed data points
      const pairs: [number, number][] = values.map((v, i) => [i, v]);
      
      // Perform linear regression
      const regression = ss.linearRegression(pairs);
      const regressionLine = ss.linearRegressionLine(regression);
      
      // Calculate residuals for confidence interval
      const residuals = pairs.map(([x, y]) => y - regressionLine(x));
      const residualStd = ss.standardDeviation(residuals);
      
      // Historical data
      const historical = values.map((v, i) => ({ index: i, value: v }));
      
      // Forecast next 5 periods
      const forecastPeriods = 5;
      const lastIndex = values.length - 1;
      const forecast = [];
      
      for (let i = 1; i <= forecastPeriods; i++) {
        const x = lastIndex + i;
        const predicted = regressionLine(x);
        const marginOfError = 1.96 * residualStd * Math.sqrt(1 + 1/values.length + Math.pow(x - ss.mean(pairs.map(p => p[0])), 2) / ss.sum(pairs.map(p => Math.pow(p[0] - ss.mean(pairs.map(q => q[0])), 2))));
        
        forecast.push({
          index: x,
          value: predicted,
          lower: predicted - marginOfError,
          upper: predicted + marginOfError
        });
      }
      
      // Determine trend
      const growthRate = (regression.m / (ss.mean(values) || 1)) * 100;
      const trend: 'up' | 'down' | 'stable' = 
        growthRate > 2 ? 'up' : growthRate < -2 ? 'down' : 'stable';
      
      // Calculate R-squared for confidence
      const rSquared = ss.rSquared(pairs, regressionLine);
      
      forecasts.push({
        column: col.name,
        historical,
        forecast,
        trend,
        growthRate,
        confidence: Math.round(rSquared * 100)
      });
    });
    
    return forecasts;
  };
  
  const forecasts = generateForecasts();
  const activeForecast = selectedMetric 
    ? forecasts.find(f => f.column === selectedMetric) 
    : forecasts[0];
  
  if (forecasts.length === 0) {
    return (
      <div className="glass-panel p-6 text-center">
        <p className="text-muted-foreground">Not enough numeric data for forecasting</p>
      </div>
    );
  }
  
  const formatColumnName = (name: string) => 
    name.replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase());
  
  const getTrendColor = (trend: string) => {
    switch (trend) {
      case 'up': return 'text-chart-1';
      case 'down': return 'text-destructive';
      default: return 'text-muted-foreground';
    }
  };
  
  const getTrendIcon = (trend: string) => {
    switch (trend) {
      case 'up': return '↑';
      case 'down': return '↓';
      default: return '→';
    }
  };
  
  // Combine historical and forecast data for the chart
  const chartData = activeForecast ? [
    ...activeForecast.historical.map(h => ({
      index: h.index,
      actual: h.value,
      forecast: null as number | null,
      lower: null as number | null,
      upper: null as number | null
    })),
    // Add connection point
    {
      index: activeForecast.historical[activeForecast.historical.length - 1]?.index,
      actual: activeForecast.historical[activeForecast.historical.length - 1]?.value,
      forecast: activeForecast.historical[activeForecast.historical.length - 1]?.value,
      lower: activeForecast.historical[activeForecast.historical.length - 1]?.value,
      upper: activeForecast.historical[activeForecast.historical.length - 1]?.value
    },
    ...activeForecast.forecast.map(f => ({
      index: f.index,
      actual: null as number | null,
      forecast: f.value,
      lower: f.lower,
      upper: f.upper
    }))
  ] : [];
  
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="glass-panel p-6"
    >
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-chart-5 to-chart-3 flex items-center justify-center">
            <TrendingUp className="w-5 h-5 text-primary-foreground" />
          </div>
          <div>
            <h3 className="font-semibold text-lg">Forecasting Charts</h3>
            <p className="text-sm text-muted-foreground">Regression-based future projections</p>
          </div>
        </div>
        <TooltipProvider>
          <UITooltip>
            <TooltipTrigger>
              <Info className="w-5 h-5 text-muted-foreground" />
            </TooltipTrigger>
            <TooltipContent className="max-w-xs">
              <p>Forecasts are based on linear regression with 95% confidence intervals. Actual results may vary.</p>
            </TooltipContent>
          </UITooltip>
        </TooltipProvider>
      </div>
      
      {/* Metric Selector */}
      <div className="flex gap-2 mb-6 overflow-x-auto pb-2">
        {forecasts.map(f => (
          <button
            key={f.column}
            onClick={() => setSelectedMetric(f.column)}
            className={`px-4 py-2 rounded-lg text-sm font-medium whitespace-nowrap transition-all ${
              (selectedMetric === f.column || (!selectedMetric && f === forecasts[0]))
                ? 'bg-primary text-primary-foreground'
                : 'bg-secondary/50 hover:bg-secondary'
            }`}
          >
            <span className={`mr-2 ${getTrendColor(f.trend)}`}>{getTrendIcon(f.trend)}</span>
            {formatColumnName(f.column)}
          </button>
        ))}
      </div>
      
      {activeForecast && (
        <>
          {/* Stats Cards */}
          <div className="grid grid-cols-3 gap-4 mb-6">
            <div className="p-4 bg-secondary/30 rounded-xl text-center">
              <Calendar className="w-5 h-5 mx-auto mb-2 text-chart-5" />
              <p className="text-2xl font-bold">5</p>
              <p className="text-xs text-muted-foreground">Forecast Periods</p>
            </div>
            <div className="p-4 bg-secondary/30 rounded-xl text-center">
              <Target className="w-5 h-5 mx-auto mb-2 text-chart-1" />
              <p className="text-2xl font-bold">{activeForecast.confidence}%</p>
              <p className="text-xs text-muted-foreground">Model Fit (R²)</p>
            </div>
            <div className="p-4 bg-secondary/30 rounded-xl text-center">
              <TrendingUp className={`w-5 h-5 mx-auto mb-2 ${getTrendColor(activeForecast.trend)}`} />
              <p className={`text-2xl font-bold ${getTrendColor(activeForecast.trend)}`}>
                {activeForecast.growthRate > 0 ? '+' : ''}{activeForecast.growthRate.toFixed(1)}%
              </p>
              <p className="text-xs text-muted-foreground">Growth Rate</p>
            </div>
          </div>
          
          {/* Chart */}
          <div className="h-80">
            <ResponsiveContainer width="100%" height="100%">
              <ComposedChart data={chartData}>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" opacity={0.5} />
                <XAxis 
                  dataKey="index" 
                  stroke="hsl(var(--muted-foreground))"
                  fontSize={12}
                  tickFormatter={(val) => `Period ${val + 1}`}
                />
                <YAxis 
                  stroke="hsl(var(--muted-foreground))"
                  fontSize={12}
                  tickFormatter={(val) => val >= 1000 ? `${(val/1000).toFixed(0)}K` : val.toFixed(0)}
                />
                <Tooltip
                  contentStyle={{
                    backgroundColor: 'hsl(var(--card))',
                    border: '1px solid hsl(var(--border))',
                    borderRadius: '8px',
                    fontSize: '12px'
                  }}
                  formatter={(value: number, name: string) => {
                    if (value === null) return [null, null];
                    return [value.toFixed(2), name === 'actual' ? 'Historical' : 'Forecast'];
                  }}
                />
                
                {/* Confidence interval area */}
                <Area
                  dataKey="upper"
                  stroke="none"
                  fill="hsl(var(--chart-5))"
                  fillOpacity={0.1}
                />
                <Area
                  dataKey="lower"
                  stroke="none"
                  fill="hsl(var(--background))"
                  fillOpacity={1}
                />
                
                {/* Historical line */}
                <Line
                  type="monotone"
                  dataKey="actual"
                  stroke="hsl(var(--primary))"
                  strokeWidth={2}
                  dot={{ fill: 'hsl(var(--primary))', strokeWidth: 0, r: 3 }}
                  connectNulls={false}
                />
                
                {/* Forecast line */}
                <Line
                  type="monotone"
                  dataKey="forecast"
                  stroke="hsl(var(--chart-5))"
                  strokeWidth={2}
                  strokeDasharray="5 5"
                  dot={{ fill: 'hsl(var(--chart-5))', strokeWidth: 0, r: 3 }}
                  connectNulls={false}
                />
                
                {/* Divider line */}
                <ReferenceLine
                  x={activeForecast.historical.length - 1}
                  stroke="hsl(var(--muted-foreground))"
                  strokeDasharray="3 3"
                  label={{ value: 'Now', position: 'top', fontSize: 10 }}
                />
              </ComposedChart>
            </ResponsiveContainer>
          </div>
          
          {/* Legend */}
          <div className="flex justify-center gap-6 mt-4">
            <div className="flex items-center gap-2">
              <div className="w-4 h-0.5 bg-primary" />
              <span className="text-xs text-muted-foreground">Historical</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-4 h-0.5 bg-chart-5" style={{ borderStyle: 'dashed' }} />
              <span className="text-xs text-muted-foreground">Forecast</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-4 h-3 bg-chart-5/20 rounded" />
              <span className="text-xs text-muted-foreground">95% Confidence</span>
            </div>
          </div>
          
          {/* Forecast Values */}
          <div className="mt-6 p-4 bg-secondary/30 rounded-xl">
            <h4 className="text-sm font-medium mb-3">Forecasted Values</h4>
            <div className="grid grid-cols-5 gap-2">
              {activeForecast.forecast.map((f, i) => (
                <div key={i} className="text-center p-2 bg-card/50 rounded-lg">
                  <p className="text-xs text-muted-foreground">+{i + 1} Period</p>
                  <p className="font-semibold text-chart-5">{f.value.toFixed(0)}</p>
                  <p className="text-xs text-muted-foreground">
                    ±{((f.upper - f.lower) / 2).toFixed(0)}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </>
      )}
    </motion.div>
  );
}
