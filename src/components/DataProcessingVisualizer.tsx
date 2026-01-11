import { motion, AnimatePresence } from 'framer-motion';
import { useState, useEffect } from 'react';
import { 
  FileSpreadsheet, 
  Wand2, 
  BarChart3, 
  BookOpen, 
  Sparkles, 
  CheckCircle2,
  Database,
  Zap,
  Brain,
  TrendingUp
} from 'lucide-react';

interface DataProcessingVisualizerProps {
  isProcessing: boolean;
}

const processingSteps = [
  { 
    icon: FileSpreadsheet, 
    label: 'Reading Data', 
    description: 'Parsing your CSV file...',
    color: 'from-chart-5 to-primary'
  },
  { 
    icon: Wand2, 
    label: 'Cleaning Data', 
    description: 'Fixing inconsistencies...',
    color: 'from-primary to-accent'
  },
  { 
    icon: Database, 
    label: 'Analyzing Structure', 
    description: 'Detecting data types...',
    color: 'from-accent to-chart-4'
  },
  { 
    icon: TrendingUp, 
    label: 'Finding Patterns', 
    description: 'Calculating correlations...',
    color: 'from-chart-4 to-chart-3'
  },
  { 
    icon: BarChart3, 
    label: 'Creating Charts', 
    description: 'Generating visualizations...',
    color: 'from-chart-3 to-chart-5'
  },
  { 
    icon: Brain, 
    label: 'AI Analysis', 
    description: 'Extracting insights...',
    color: 'from-chart-5 to-primary'
  },
  { 
    icon: BookOpen, 
    label: 'Writing Story', 
    description: 'Crafting your narrative...',
    color: 'from-primary to-accent'
  },
  { 
    icon: Sparkles, 
    label: 'Complete!', 
    description: 'Your analysis is ready',
    color: 'from-accent to-chart-5'
  },
];

export function DataProcessingVisualizer({ isProcessing }: DataProcessingVisualizerProps) {
  const [currentStep, setCurrentStep] = useState(0);
  const [particles, setParticles] = useState<Array<{ id: number; x: number; y: number }>>([]);

  useEffect(() => {
    if (!isProcessing) {
      setCurrentStep(0);
      return;
    }

    const interval = setInterval(() => {
      setCurrentStep(prev => {
        if (prev >= processingSteps.length - 1) {
          return prev;
        }
        return prev + 1;
      });
    }, 600);

    return () => clearInterval(interval);
  }, [isProcessing]);

  useEffect(() => {
    if (!isProcessing) return;

    const particleInterval = setInterval(() => {
      const newParticle = {
        id: Date.now(),
        x: Math.random() * 100,
        y: Math.random() * 100,
      };
      setParticles(prev => [...prev.slice(-15), newParticle]);
    }, 200);

    return () => clearInterval(particleInterval);
  }, [isProcessing]);

  if (!isProcessing) return null;

  const CurrentIcon = processingSteps[currentStep].icon;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.9 }}
        className="fixed inset-0 z-50 flex items-center justify-center bg-background/95 backdrop-blur-xl"
      >
        {/* Animated background grid */}
        <div className="absolute inset-0 overflow-hidden">
          <div 
            className="absolute inset-0 opacity-10"
            style={{
              backgroundImage: `
                linear-gradient(hsl(173 80% 40% / 0.3) 1px, transparent 1px),
                linear-gradient(90deg, hsl(173 80% 40% / 0.3) 1px, transparent 1px)
              `,
              backgroundSize: '50px 50px',
            }}
          />
          
          {/* Floating particles */}
          {particles.map(particle => (
            <motion.div
              key={particle.id}
              className="absolute w-2 h-2 rounded-full bg-primary"
              initial={{ 
                left: `${particle.x}%`, 
                top: `${particle.y}%`,
                opacity: 1,
                scale: 0
              }}
              animate={{ 
                opacity: 0,
                scale: 2,
                y: -50
              }}
              transition={{ duration: 1.5, ease: "easeOut" }}
              style={{ filter: 'blur(1px)' }}
            />
          ))}
        </div>

        {/* Radial glow */}
        <motion.div
          className="absolute w-[600px] h-[600px] rounded-full"
          style={{
            background: `radial-gradient(circle, hsl(var(--primary) / 0.2) 0%, transparent 70%)`,
          }}
          animate={{
            scale: [1, 1.3, 1],
            opacity: [0.3, 0.5, 0.3],
          }}
          transition={{ duration: 2, repeat: Infinity }}
        />

        <div className="relative z-10 flex flex-col items-center max-w-lg px-6">
          {/* Main visualization */}
          <div className="relative mb-8">
            {/* Outer spinning ring */}
            <motion.div
              className="absolute -inset-8 rounded-full border-2 border-dashed border-primary/20"
              animate={{ rotate: 360 }}
              transition={{ duration: 10, repeat: Infinity, ease: "linear" }}
            />

            {/* Inner spinning ring */}
            <motion.div
              className="absolute -inset-4 rounded-full border border-primary/40"
              animate={{ rotate: -360 }}
              transition={{ duration: 6, repeat: Infinity, ease: "linear" }}
            />

            {/* Pulsing glow behind icon */}
            <motion.div
              className={`absolute -inset-2 rounded-3xl bg-gradient-to-br ${processingSteps[currentStep].color} opacity-20`}
              animate={{
                scale: [1, 1.2, 1],
                opacity: [0.2, 0.4, 0.2],
              }}
              transition={{ duration: 1.5, repeat: Infinity }}
            />

            {/* Central icon container */}
            <motion.div
              key={currentStep}
              initial={{ scale: 0.5, opacity: 0, rotate: -180 }}
              animate={{ scale: 1, opacity: 1, rotate: 0 }}
              transition={{ duration: 0.4, type: "spring", stiffness: 200 }}
              className={`relative w-28 h-28 rounded-3xl bg-gradient-to-br ${processingSteps[currentStep].color} flex items-center justify-center shadow-2xl`}
              style={{ 
                boxShadow: `0 0 60px hsl(var(--primary) / 0.4)`,
              }}
            >
              <CurrentIcon className="w-14 h-14 text-white" />
              
              {/* Sparkle effects */}
              {currentStep === processingSteps.length - 1 && (
                <>
                  {[...Array(6)].map((_, i) => (
                    <motion.div
                      key={i}
                      className="absolute w-2 h-2 bg-white rounded-full"
                      initial={{ scale: 0, opacity: 1 }}
                      animate={{ 
                        scale: [0, 1.5, 0],
                        opacity: [1, 0.5, 0],
                        x: Math.cos((i * Math.PI * 2) / 6) * 60,
                        y: Math.sin((i * Math.PI * 2) / 6) * 60,
                      }}
                      transition={{ 
                        duration: 1,
                        repeat: Infinity,
                        delay: i * 0.1,
                      }}
                    />
                  ))}
                </>
              )}
            </motion.div>

            {/* Data flow lines */}
            <svg className="absolute -inset-16 w-[calc(100%+8rem)] h-[calc(100%+8rem)]" style={{ overflow: 'visible' }}>
              {[0, 1, 2, 3].map(i => (
                <motion.circle
                  key={i}
                  cx="50%"
                  cy="50%"
                  r={70 + i * 15}
                  fill="none"
                  stroke="url(#gradient)"
                  strokeWidth="1"
                  strokeDasharray="10 20"
                  initial={{ opacity: 0 }}
                  animate={{ 
                    opacity: [0, 0.5, 0],
                    scale: [1, 1.1, 1],
                  }}
                  transition={{
                    duration: 2,
                    repeat: Infinity,
                    delay: i * 0.3,
                  }}
                />
              ))}
              <defs>
                <linearGradient id="gradient" x1="0%" y1="0%" x2="100%" y2="100%">
                  <stop offset="0%" stopColor="hsl(173 80% 40%)" />
                  <stop offset="100%" stopColor="hsl(262 83% 58%)" />
                </linearGradient>
              </defs>
            </svg>
          </div>

          {/* Step label */}
          <motion.div
            key={`label-${currentStep}`}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-center mb-8"
          >
            <h2 className="text-2xl font-bold mb-2">
              <span className="gradient-text">{processingSteps[currentStep].label}</span>
            </h2>
            <p className="text-muted-foreground">{processingSteps[currentStep].description}</p>
          </motion.div>

          {/* Progress steps */}
          <div className="flex items-center gap-2">
            {processingSteps.map((step, index) => (
              <motion.div
                key={index}
                className={`relative ${index <= currentStep ? 'text-primary' : 'text-muted'}`}
              >
                <motion.div
                  className={`w-3 h-3 rounded-full transition-all duration-300 ${
                    index < currentStep 
                      ? 'bg-primary' 
                      : index === currentStep 
                        ? 'bg-primary shadow-lg shadow-primary/50' 
                        : 'bg-muted/30'
                  }`}
                  animate={index === currentStep ? { scale: [1, 1.3, 1] } : {}}
                  transition={{ duration: 0.5, repeat: index === currentStep ? Infinity : 0 }}
                />
                {index < currentStep && (
                  <motion.div
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    className="absolute inset-0 flex items-center justify-center"
                  >
                    <CheckCircle2 className="w-3 h-3 text-primary-foreground" />
                  </motion.div>
                )}
              </motion.div>
            ))}
          </div>

          {/* Binary/data stream decoration */}
          <div className="absolute bottom-10 left-0 right-0 overflow-hidden h-6 opacity-20">
            <motion.div
              className="whitespace-nowrap text-xs font-mono text-primary"
              animate={{ x: [0, -500] }}
              transition={{ duration: 10, repeat: Infinity, ease: "linear" }}
            >
              {Array(50).fill(null).map((_, i) => (
                <span key={i} className="mx-1">
                  {Math.random() > 0.5 ? '█' : '░'}
                </span>
              ))}
            </motion.div>
          </div>
        </div>
      </motion.div>
    </AnimatePresence>
  );
}
