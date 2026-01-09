import { motion } from 'framer-motion';
import { BookOpen, TrendingUp, AlertTriangle, Lightbulb, CheckCircle } from 'lucide-react';
import { DataStory as DataStoryType } from '@/types/analytics';

interface DataStoryProps {
  story: DataStoryType;
}

export function DataStory({ story }: DataStoryProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="glass-panel-elevated p-8 space-y-8"
    >
      {/* Header */}
      <div className="flex items-start gap-4">
        <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-chart-1 to-chart-5 flex items-center justify-center shrink-0">
          <BookOpen className="w-7 h-7 text-background" />
        </div>
        <div>
          <h2 className="text-2xl font-bold gradient-text">{story.title}</h2>
          <p className="text-sm text-muted-foreground mt-1">AI-Generated Narrative Report</p>
        </div>
      </div>

      {/* Overview */}
      <div className="space-y-2">
        <h3 className="text-lg font-semibold flex items-center gap-2">
          <span className="w-6 h-6 rounded-lg bg-chart-1/15 flex items-center justify-center">
            <span className="text-xs text-chart-1">📊</span>
          </span>
          Overview
        </h3>
        <p className="text-muted-foreground leading-relaxed">{story.overview}</p>
      </div>

      {/* Key Trends */}
      {story.keyTrends.length > 0 && (
        <div className="space-y-4">
          <h3 className="text-lg font-semibold flex items-center gap-2">
            <span className="w-6 h-6 rounded-lg bg-chart-2/15 flex items-center justify-center">
              <TrendingUp className="w-3.5 h-3.5 text-chart-2" />
            </span>
            Key Trends
          </h3>
          <div className="grid gap-3">
            {story.keyTrends.map((trend, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: i * 0.1 }}
                className="flex items-start gap-3 p-4 bg-secondary/30 rounded-xl"
              >
                <span className="w-6 h-6 rounded-full bg-chart-2/20 flex items-center justify-center text-xs text-chart-2 shrink-0">
                  {i + 1}
                </span>
                <p className="text-sm text-foreground">{trend}</p>
              </motion.div>
            ))}
          </div>
        </div>
      )}

      {/* Anomalies */}
      {story.anomalies.length > 0 && (
        <div className="space-y-4">
          <h3 className="text-lg font-semibold flex items-center gap-2">
            <span className="w-6 h-6 rounded-lg bg-chart-4/15 flex items-center justify-center">
              <AlertTriangle className="w-3.5 h-3.5 text-chart-4" />
            </span>
            Notable Anomalies
          </h3>
          <div className="grid gap-3">
            {story.anomalies.map((anomaly, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: i * 0.1 }}
                className="flex items-start gap-3 p-4 bg-chart-4/5 border border-chart-4/20 rounded-xl"
              >
                <AlertTriangle className="w-4 h-4 text-chart-4 shrink-0 mt-0.5" />
                <p className="text-sm text-foreground">{anomaly}</p>
              </motion.div>
            ))}
          </div>
        </div>
      )}

      {/* Insights */}
      {story.insights.length > 0 && (
        <div className="space-y-4">
          <h3 className="text-lg font-semibold flex items-center gap-2">
            <span className="w-6 h-6 rounded-lg bg-chart-3/15 flex items-center justify-center">
              <Lightbulb className="w-3.5 h-3.5 text-chart-3" />
            </span>
            Actionable Insights
          </h3>
          <div className="grid sm:grid-cols-2 gap-3">
            {story.insights.map((insight, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.1 }}
                className="flex items-start gap-3 p-4 bg-chart-3/5 border border-chart-3/20 rounded-xl"
              >
                <Lightbulb className="w-4 h-4 text-chart-3 shrink-0 mt-0.5" />
                <p className="text-sm text-foreground">{insight}</p>
              </motion.div>
            ))}
          </div>
        </div>
      )}

      {/* Conclusion */}
      <div className="p-6 bg-gradient-to-r from-chart-1/10 via-chart-2/10 to-chart-5/10 rounded-2xl border border-primary/20">
        <div className="flex items-start gap-4">
          <div className="w-10 h-10 rounded-xl bg-primary/20 flex items-center justify-center shrink-0">
            <CheckCircle className="w-5 h-5 text-primary" />
          </div>
          <div>
            <h4 className="font-semibold mb-2">Conclusion</h4>
            <p className="text-sm text-muted-foreground leading-relaxed">{story.conclusion}</p>
          </div>
        </div>
      </div>
    </motion.div>
  );
}
