import { motion } from 'framer-motion';
import { 
  Shield, 
  CheckCircle, 
  AlertTriangle, 
  BarChart3, 
  Clock, 
  Zap,
  MessageSquare,
  HelpCircle,
  Award,
  Target
} from 'lucide-react';
import { TrustLayer } from '@/types/analytics';
import { Progress } from '@/components/ui/progress';
import { InteractiveTrustExplanations } from '@/components/InteractiveTrustExplanations';

interface TrustLayerDisplayProps {
  trustLayer: TrustLayer;
}

export function TrustLayerDisplay({ trustLayer }: TrustLayerDisplayProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="space-y-6"
    >
      {/* Data Reliability Section */}
      <div className="glass-panel-elevated p-6">
        <div className="flex items-center gap-3 mb-4">
          <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-emerald-500 to-teal-500 flex items-center justify-center">
            <Shield className="w-6 h-6 text-white" />
          </div>
          <div>
            <h3 className="text-xl font-bold">Data Reliability & Health</h3>
            <p className="text-sm text-muted-foreground">How trustworthy is this analysis?</p>
          </div>
        </div>
        
        <div className="grid md:grid-cols-2 gap-6">
          {/* Reliability Score */}
          <div className="p-4 rounded-xl bg-secondary/30 border border-border/50">
            <div className="flex items-center justify-between mb-3">
              <span className="text-sm font-medium">Overall Reliability</span>
              <span className={`text-2xl font-bold ${
                trustLayer.reliabilityScore >= 85 ? 'text-emerald-400' :
                trustLayer.reliabilityScore >= 70 ? 'text-yellow-400' : 'text-orange-400'
              }`}>
                {trustLayer.reliabilityScore}%
              </span>
            </div>
            <Progress 
              value={trustLayer.reliabilityScore} 
              className="h-3"
            />
            <p className="text-sm text-muted-foreground mt-3">
              {trustLayer.reliabilityDetails}
            </p>
          </div>
          
          {/* Safe vs Uncertain */}
          <div className="space-y-4">
            {/* Safe Conclusions */}
            <div className="p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/20">
              <div className="flex items-center gap-2 mb-2">
                <CheckCircle className="w-4 h-4 text-emerald-400" />
                <span className="text-sm font-semibold text-emerald-400">Safe to Conclude</span>
              </div>
              <ul className="text-xs text-muted-foreground space-y-1">
                {trustLayer.safeConclusions.slice(0, 2).map((conclusion, i) => (
                  <li key={i}>• {conclusion}</li>
                ))}
              </ul>
            </div>
            
            {/* Uncertain Conclusions */}
            {trustLayer.uncertainConclusions.length > 0 && (
              <div className="p-3 rounded-xl bg-yellow-500/10 border border-yellow-500/20">
                <div className="flex items-center gap-2 mb-2">
                  <AlertTriangle className="w-4 h-4 text-yellow-400" />
                  <span className="text-sm font-semibold text-yellow-400">More Uncertain</span>
                </div>
                <ul className="text-xs text-muted-foreground space-y-1">
                  {trustLayer.uncertainConclusions.slice(0, 2).map((conclusion, i) => (
                    <li key={i}>• {conclusion}</li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Confidence & Evidence Panel - Interactive */}
      <div className="glass-panel-elevated p-6">
        <div className="flex items-center gap-3 mb-4">
          <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-blue-500 to-indigo-500 flex items-center justify-center">
            <BarChart3 className="w-6 h-6 text-white" />
          </div>
          <div>
            <h3 className="text-xl font-bold">Why These Insights Can Be Trusted</h3>
            <p className="text-sm text-muted-foreground">Click any insight to see how confidence was calculated</p>
          </div>
        </div>
        
        <InteractiveTrustExplanations evidence={trustLayer.insightEvidence} />
      </div>

      {/* Anomaly Timeline */}
      {trustLayer.anomalyTimeline.length > 0 && (
        <div className="glass-panel-elevated p-6">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-orange-500 to-red-500 flex items-center justify-center">
              <Clock className="w-6 h-6 text-white" />
            </div>
            <div>
              <h3 className="text-xl font-bold">Anomaly Timeline</h3>
              <p className="text-sm text-muted-foreground">Unusual events and possible explanations</p>
            </div>
          </div>
          
          <div className="space-y-4">
            {trustLayer.anomalyTimeline.map((event, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.1 }}
                className={`p-4 rounded-xl border ${
                  event.significance === 'high' ? 'bg-red-500/10 border-red-500/30' :
                  event.significance === 'medium' ? 'bg-orange-500/10 border-orange-500/30' : 'bg-yellow-500/10 border-yellow-500/30'
                }`}
              >
                <div className="flex items-center gap-2 mb-2">
                  <span className={`px-2 py-0.5 rounded text-xs font-medium ${
                    event.significance === 'high' ? 'bg-red-500/30 text-red-300' :
                    event.significance === 'medium' ? 'bg-orange-500/30 text-orange-300' : 'bg-yellow-500/30 text-yellow-300'
                  }`}>
                    {event.significance.toUpperCase()}
                  </span>
                  <span className="text-sm text-muted-foreground">{event.timestamp}</span>
                </div>
                <p className="text-sm font-medium mb-3">{event.description}</p>
                <div className="pl-3 border-l-2 border-border/50">
                  <p className="text-xs text-muted-foreground mb-1">Possible explanations:</p>
                  <ul className="text-xs text-muted-foreground space-y-1">
                    {event.possibleExplanations.map((exp, i) => (
                      <li key={i}>• {exp}</li>
                    ))}
                  </ul>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      )}

      {/* What-If Preview */}
      <div className="glass-panel-elevated p-6">
        <div className="flex items-center gap-3 mb-4">
          <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center">
            <Zap className="w-6 h-6 text-white" />
          </div>
          <div>
            <h3 className="text-xl font-bold">What-If Preview</h3>
            <p className="text-sm text-muted-foreground">A simulated scenario based on patterns</p>
          </div>
        </div>
        
        <div className={`p-5 rounded-xl border ${
          trustLayer.whatIfScenario.direction === 'positive' ? 'bg-emerald-500/10 border-emerald-500/20' :
          trustLayer.whatIfScenario.direction === 'negative' ? 'bg-red-500/10 border-red-500/20' : 'bg-blue-500/10 border-blue-500/20'
        }`}>
          <div className="flex items-center gap-2 mb-3">
            <Target className="w-5 h-5 text-primary" />
            <span className="font-semibold">{trustLayer.whatIfScenario.scenario}</span>
          </div>
          
          <div className="flex gap-3 mb-4">
            <span className={`px-3 py-1 rounded-full text-xs font-medium ${
              trustLayer.whatIfScenario.direction === 'positive' ? 'bg-emerald-500/30 text-emerald-300' :
              trustLayer.whatIfScenario.direction === 'negative' ? 'bg-red-500/30 text-red-300' : 'bg-blue-500/30 text-blue-300'
            }`}>
              {trustLayer.whatIfScenario.direction} impact
            </span>
            <span className={`px-3 py-1 rounded-full text-xs font-medium ${
              trustLayer.whatIfScenario.magnitude === 'high' ? 'bg-purple-500/30 text-purple-300' :
              trustLayer.whatIfScenario.magnitude === 'medium' ? 'bg-blue-500/30 text-blue-300' : 'bg-gray-500/30 text-gray-300'
            }`}>
              {trustLayer.whatIfScenario.magnitude} magnitude
            </span>
          </div>
          
          <p className="text-sm text-muted-foreground mb-4">{trustLayer.whatIfScenario.explanation}</p>
          
          <div className="pt-3 border-t border-border/30">
            <p className="text-xs text-muted-foreground">
              <span className="font-medium">Key assumptions: </span>
              {trustLayer.whatIfScenario.assumptions.join(' • ')}
            </p>
          </div>
        </div>
      </div>

      {/* Multi-Style Explanation */}
      <div className="glass-panel-elevated p-6">
        <div className="flex items-center gap-3 mb-4">
          <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-cyan-500 to-blue-500 flex items-center justify-center">
            <MessageSquare className="w-6 h-6 text-white" />
          </div>
          <div>
            <h3 className="text-xl font-bold">Key Finding - Three Ways</h3>
            <p className="text-sm text-muted-foreground">The same insight for different audiences</p>
          </div>
        </div>
        
        <div className="grid md:grid-cols-3 gap-4">
          <div className="p-4 rounded-xl bg-emerald-500/10 border border-emerald-500/20">
            <h4 className="font-semibold mb-2 text-emerald-400">🗣️ Simple</h4>
            <p className="text-sm text-muted-foreground">{trustLayer.multiStyleExplanation.simple}</p>
          </div>
          <div className="p-4 rounded-xl bg-blue-500/10 border border-blue-500/20">
            <h4 className="font-semibold mb-2 text-blue-400">💼 Executive</h4>
            <p className="text-sm text-muted-foreground">{trustLayer.multiStyleExplanation.executive}</p>
          </div>
          <div className="p-4 rounded-xl bg-purple-500/10 border border-purple-500/20">
            <h4 className="font-semibold mb-2 text-purple-400">📊 Analyst</h4>
            <p className="text-sm text-muted-foreground">{trustLayer.multiStyleExplanation.analyst}</p>
          </div>
        </div>
      </div>

      {/* Next Questions */}
      <div className="glass-panel-elevated p-6">
        <div className="flex items-center gap-3 mb-4">
          <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-amber-500 to-orange-500 flex items-center justify-center">
            <HelpCircle className="w-6 h-6 text-white" />
          </div>
          <div>
            <h3 className="text-xl font-bold">Questions to Explore Next</h3>
            <p className="text-sm text-muted-foreground">What a human analyst would ask</p>
          </div>
        </div>
        
        <div className="grid sm:grid-cols-2 gap-3">
          {trustLayer.nextQuestions.map((question, index) => (
            <motion.div
              key={index}
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: index * 0.1 }}
              className="p-4 rounded-xl bg-secondary/30 border border-border/50 hover:border-primary/30 transition-colors"
            >
              <span className="text-primary mr-2">❓</span>
              <span className="text-sm">{question}</span>
            </motion.div>
          ))}
        </div>
      </div>

      {/* Final Trust Statement */}
      <div className="p-6 rounded-2xl bg-gradient-to-r from-primary/10 via-chart-2/10 to-chart-5/10 border border-primary/20">
        <div className="flex items-start gap-4">
          <div className="w-12 h-12 rounded-xl bg-primary/20 flex items-center justify-center shrink-0">
            <Award className="w-6 h-6 text-primary" />
          </div>
          <div>
            <h4 className="font-bold text-lg mb-2">Trust Statement</h4>
            <p className="text-muted-foreground leading-relaxed">{trustLayer.trustStatement}</p>
          </div>
        </div>
      </div>
    </motion.div>
  );
}
