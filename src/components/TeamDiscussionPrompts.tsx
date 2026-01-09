import { motion } from 'framer-motion';
import { Users, MessageSquare, HelpCircle, Lightbulb, Target, AlertTriangle } from 'lucide-react';
import { CleanedData, DataStory } from '@/types/analytics';

interface TeamDiscussionPromptsProps {
  data: CleanedData;
  story: DataStory;
}

interface DiscussionQuestion {
  category: 'strategic' | 'operational' | 'investigation' | 'opportunity';
  question: string;
  context: string;
  suggestedParticipants: string[];
}

export function TeamDiscussionPrompts({ data, story }: TeamDiscussionPromptsProps) {
  const questions = generateDiscussionQuestions(data, story);
  
  const categoryIcons = {
    strategic: <Target className="w-4 h-4" />,
    operational: <Users className="w-4 h-4" />,
    investigation: <HelpCircle className="w-4 h-4" />,
    opportunity: <Lightbulb className="w-4 h-4" />
  };
  
  const categoryColors = {
    strategic: 'chart-1',
    operational: 'chart-2',
    investigation: 'chart-4',
    opportunity: 'chart-3'
  };
  
  const categoryLabels = {
    strategic: 'Strategic Question',
    operational: 'Team Discussion',
    investigation: 'Needs Investigation',
    opportunity: 'Opportunity'
  };
  
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="glass-panel-elevated p-6 space-y-6"
    >
      <div className="flex items-center gap-3">
        <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-blue-500 to-cyan-500 flex items-center justify-center">
          <MessageSquare className="w-6 h-6 text-white" />
        </div>
        <div>
          <h3 className="text-xl font-bold">Questions for Your Team</h3>
          <p className="text-sm text-muted-foreground">Discussion points based on the analysis findings</p>
        </div>
      </div>
      
      <div className="space-y-4">
        {questions.map((q, index) => (
          <motion.div
            key={index}
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: index * 0.1 }}
            className="p-5 rounded-xl bg-secondary/30 border border-border/50 hover:border-primary/30 transition-colors"
          >
            {/* Category badge */}
            <div className="flex items-center gap-2 mb-3">
              <div className={`flex items-center gap-2 px-3 py-1 rounded-full bg-${categoryColors[q.category]}/20 text-${categoryColors[q.category]}`}>
                {categoryIcons[q.category]}
                <span className="text-xs font-medium">{categoryLabels[q.category]}</span>
              </div>
            </div>
            
            {/* Question */}
            <h4 className="text-lg font-semibold mb-2 flex items-start gap-2">
              <span className="text-primary mt-1">💬</span>
              {q.question}
            </h4>
            
            {/* Context */}
            <p className="text-sm text-muted-foreground mb-4">{q.context}</p>
            
            {/* Suggested participants */}
            <div className="flex items-center gap-2 flex-wrap">
              <span className="text-xs text-muted-foreground">Involve:</span>
              {q.suggestedParticipants.map((participant, i) => (
                <span
                  key={i}
                  className="px-2 py-1 text-xs rounded-full bg-primary/10 text-primary"
                >
                  {participant}
                </span>
              ))}
            </div>
          </motion.div>
        ))}
      </div>
      
      {/* Tips section */}
      <div className="p-4 bg-primary/5 border border-primary/20 rounded-xl">
        <h4 className="font-medium mb-2 flex items-center gap-2">
          <Lightbulb className="w-4 h-4 text-primary" />
          Tips for Productive Discussions
        </h4>
        <ul className="text-sm text-muted-foreground space-y-1">
          <li>• Share this report with your team before the meeting</li>
          <li>• Focus on one or two key questions per session</li>
          <li>• Document action items and assign owners</li>
          <li>• Schedule follow-up to track progress</li>
        </ul>
      </div>
    </motion.div>
  );
}

function generateDiscussionQuestions(data: CleanedData, story: DataStory): DiscussionQuestion[] {
  const questions: DiscussionQuestion[] = [];
  const numericColumns = data.columns.filter(c => c.type === 'numeric');
  const categoricalColumns = data.columns.filter(c => c.type === 'categorical');
  
  // Check for declining metrics
  const decliningMetrics = numericColumns.filter(c => c.stats?.trend === 'decreasing');
  if (decliningMetrics.length > 0) {
    const metricName = formatColumnName(decliningMetrics[0].name);
    questions.push({
      category: 'investigation',
      question: `Why is ${metricName} declining, and what can we do about it?`,
      context: `The data shows ${metricName.toLowerCase()} has been dropping. Understanding the root cause is crucial before it impacts the business further.`,
      suggestedParticipants: ['Operations Manager', 'Data Analyst', 'Department Leads']
    });
  }
  
  // Check for high variability
  const volatileMetrics = numericColumns.filter(col => {
    if (!col.stats?.stdDev || !col.stats?.mean) return false;
    return Math.abs(col.stats.stdDev / col.stats.mean) > 0.4;
  });
  
  if (volatileMetrics.length > 0) {
    const metricName = formatColumnName(volatileMetrics[0].name);
    questions.push({
      category: 'operational',
      question: `How can we reduce the unpredictability in ${metricName}?`,
      context: `${metricName} shows significant swings, making it hard to plan and allocate resources effectively.`,
      suggestedParticipants: ['Operations Team', 'Process Owners', 'Quality Assurance']
    });
  }
  
  // Check for growing metrics - capitalize on success
  const growingMetrics = numericColumns.filter(c => c.stats?.trend === 'increasing');
  if (growingMetrics.length > 0) {
    const metricName = formatColumnName(growingMetrics[0].name);
    questions.push({
      category: 'opportunity',
      question: `What is driving the growth in ${metricName}, and how can we accelerate it?`,
      context: `${metricName} is trending upward. Understanding what's working helps replicate success across other areas.`,
      suggestedParticipants: ['Strategy Team', 'Marketing', 'Sales Leaders']
    });
  }
  
  // Category concentration question
  if (categoricalColumns.length > 0) {
    const catCol = categoricalColumns[0];
    if (catCol.stats?.mode && catCol.stats?.count) {
      const modeCount = catCol.values.filter(v => v === catCol.stats?.mode).length;
      const modePercent = (modeCount / catCol.stats.count) * 100;
      
      if (modePercent > 50) {
        const catName = formatColumnName(catCol.name);
        questions.push({
          category: 'strategic',
          question: `Should we diversify beyond our concentration in "${catCol.stats.mode}"?`,
          context: `Over ${modePercent.toFixed(0)}% of our ${catName.toLowerCase()} is concentrated in one area. This efficiency could also be a risk.`,
          suggestedParticipants: ['Executive Team', 'Risk Management', 'Strategy']
        });
      }
    }
  }
  
  // Outlier investigation
  const outlierMetrics = numericColumns.filter(c => c.stats?.outliers && c.stats.outliers.length > 0);
  if (outlierMetrics.length > 0 && questions.length < 5) {
    const metricName = formatColumnName(outlierMetrics[0].name);
    const outlierCount = outlierMetrics[0].stats?.outliers?.length || 0;
    questions.push({
      category: 'investigation',
      question: `What caused the ${outlierCount} unusual values in ${metricName}?`,
      context: `These outliers could be exceptional successes, errors, or special circumstances. Each scenario requires a different response.`,
      suggestedParticipants: ['Data Team', 'Operations', 'Quality Control']
    });
  }
  
  // General strategic question based on anomalies
  if (story.anomalies.length > 0 && questions.length < 5) {
    questions.push({
      category: 'strategic',
      question: 'Are we comfortable with the level of variability in our key metrics?',
      context: 'The analysis found several areas with notable fluctuations. Decide if this is acceptable or if more controls are needed.',
      suggestedParticipants: ['Leadership Team', 'Finance', 'Operations']
    });
  }
  
  // Future planning question
  if (questions.length < 5) {
    questions.push({
      category: 'opportunity',
      question: 'What resources do we need to capitalize on the opportunities identified?',
      context: 'Based on the positive trends and patterns found, consider what investments would maximize returns.',
      suggestedParticipants: ['Finance', 'HR', 'Department Heads']
    });
  }
  
  return questions.slice(0, 5);
}

function formatColumnName(name: string): string {
  return name
    .replace(/_/g, ' ')
    .replace(/\b\w/g, c => c.toUpperCase());
}
