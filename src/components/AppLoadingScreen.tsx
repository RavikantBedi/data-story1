import { motion } from 'framer-motion';
import { Brain, Sparkles, BarChart3, Database } from 'lucide-react';

export function AppLoadingScreen() {
  return (
    <div className="fixed inset-0 bg-background flex items-center justify-center z-50 overflow-hidden">
      {/* Animated background particles */}
      <div className="absolute inset-0 overflow-hidden">
        {[...Array(20)].map((_, i) => (
          <motion.div
            key={i}
            className="absolute w-1 h-1 rounded-full bg-primary/30"
            initial={{ 
              x: Math.random() * window.innerWidth, 
              y: Math.random() * window.innerHeight,
              opacity: 0 
            }}
            animate={{ 
              y: [null, Math.random() * -200],
              opacity: [0, 1, 0],
            }}
            transition={{
              duration: 3 + Math.random() * 2,
              repeat: Infinity,
              delay: Math.random() * 2,
              ease: "easeOut"
            }}
          />
        ))}
      </div>

      {/* Glowing orbs in background */}
      <motion.div
        className="absolute w-[500px] h-[500px] rounded-full"
        style={{
          background: 'radial-gradient(circle, hsl(173 80% 40% / 0.15) 0%, transparent 70%)',
        }}
        animate={{
          scale: [1, 1.2, 1],
          opacity: [0.3, 0.5, 0.3],
        }}
        transition={{
          duration: 4,
          repeat: Infinity,
          ease: "easeInOut"
        }}
      />
      
      <motion.div
        className="absolute w-[400px] h-[400px] rounded-full"
        style={{
          background: 'radial-gradient(circle, hsl(262 83% 58% / 0.1) 0%, transparent 70%)',
          left: '60%',
          top: '60%',
        }}
        animate={{
          scale: [1.2, 1, 1.2],
          opacity: [0.2, 0.4, 0.2],
        }}
        transition={{
          duration: 5,
          repeat: Infinity,
          ease: "easeInOut"
        }}
      />

      <div className="relative z-10 flex flex-col items-center">
        {/* Animated logo */}
        <motion.div
          className="relative"
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          transition={{ duration: 0.5, ease: "backOut" }}
        >
          {/* Outer ring */}
          <motion.div
            className="absolute -inset-4 rounded-3xl border-2 border-primary/20"
            animate={{ rotate: 360 }}
            transition={{ duration: 8, repeat: Infinity, ease: "linear" }}
          />
          
          {/* Middle ring */}
          <motion.div
            className="absolute -inset-2 rounded-2xl border border-primary/30"
            animate={{ rotate: -360 }}
            transition={{ duration: 6, repeat: Infinity, ease: "linear" }}
          />
          
          {/* Logo container */}
          <motion.div
            className="w-20 h-20 rounded-2xl bg-gradient-to-br from-primary via-primary to-chart-5 flex items-center justify-center shadow-2xl"
            style={{ boxShadow: '0 0 60px hsl(173 80% 40% / 0.4)' }}
            animate={{ 
              boxShadow: [
                '0 0 60px hsl(173 80% 40% / 0.4)',
                '0 0 80px hsl(173 80% 40% / 0.6)',
                '0 0 60px hsl(173 80% 40% / 0.4)',
              ]
            }}
            transition={{ duration: 2, repeat: Infinity }}
          >
            <Brain className="w-10 h-10 text-primary-foreground" />
          </motion.div>

          {/* Orbiting icons */}
          {[
            { Icon: Sparkles, delay: 0, color: 'text-chart-5' },
            { Icon: BarChart3, delay: 1, color: 'text-accent' },
            { Icon: Database, delay: 2, color: 'text-chart-3' },
          ].map(({ Icon, delay, color }, index) => (
            <motion.div
              key={index}
              className={`absolute w-8 h-8 rounded-lg bg-secondary/80 backdrop-blur flex items-center justify-center ${color}`}
              style={{ 
                left: '50%', 
                top: '50%',
                marginLeft: -16,
                marginTop: -16,
              }}
              animate={{
                x: [0, 50 * Math.cos((index * 2 * Math.PI) / 3), 50 * Math.cos((index * 2 * Math.PI) / 3 + Math.PI), 0],
                y: [0, 50 * Math.sin((index * 2 * Math.PI) / 3), 50 * Math.sin((index * 2 * Math.PI) / 3 + Math.PI), 0],
                scale: [0.8, 1, 0.8],
                opacity: [0.5, 1, 0.5],
              }}
              transition={{
                duration: 3,
                repeat: Infinity,
                delay: delay * 0.3,
                ease: "easeInOut"
              }}
            >
              <Icon className="w-4 h-4" />
            </motion.div>
          ))}
        </motion.div>

        {/* Title */}
        <motion.div
          className="mt-12 text-center"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
        >
          <h1 className="text-2xl font-bold mb-2">
            <span className="gradient-text">DataLens AI</span>
          </h1>
          <p className="text-sm text-muted-foreground">Initializing intelligence...</p>
        </motion.div>

        {/* Loading bar */}
        <motion.div
          className="mt-8 w-48 h-1 bg-secondary rounded-full overflow-hidden"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.5 }}
        >
          <motion.div
            className="h-full bg-gradient-to-r from-primary to-chart-5 rounded-full"
            initial={{ width: "0%" }}
            animate={{ width: "100%" }}
            transition={{ duration: 1.5, ease: "easeInOut" }}
          />
        </motion.div>
      </div>
    </div>
  );
}
