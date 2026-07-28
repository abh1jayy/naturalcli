import { motion } from 'framer-motion';

export default function AnimatedBackground() {
  return (
    <div className="pointer-events-none fixed inset-0 -z-10 overflow-hidden bg-[radial-gradient(circle_at_top_left,_rgba(0,194,255,0.12),_transparent_25%),radial-gradient(circle_at_85%_10%,_rgba(124,58,237,0.16),_transparent_30%),linear-gradient(135deg,_#030712_0%,_#060b16_35%,_#0b1120_100%)]">
      <motion.div
        className="absolute left-[-10%] top-[8%] h-[24rem] w-[24rem] rounded-full bg-cyan-400/12 blur-[120px]"
        animate={{ x: [0, 34, -22, 0], y: [0, -24, 18, 0], scale: [1, 1.04, 0.96, 1] }}
        transition={{ duration: 22, repeat: Infinity, ease: 'easeInOut' }}
      />
      <motion.div
        className="absolute right-[-8%] top-[16%] h-[28rem] w-[28rem] rounded-full bg-violet-500/12 blur-[140px]"
        animate={{ x: [0, -28, 20, 0], y: [0, 24, -14, 0], scale: [1, 0.96, 1.04, 1] }}
        transition={{ duration: 24, repeat: Infinity, ease: 'easeInOut' }}
      />
      <motion.div
        className="absolute bottom-[-8%] left-[18%] h-[26rem] w-[26rem] rounded-full bg-slate-400/10 blur-[120px]"
        animate={{ x: [0, 16, -12, 0], y: [0, -10, 10, 0], scale: [1, 1.02, 0.98, 1] }}
        transition={{ duration: 30, repeat: Infinity, ease: 'easeInOut' }}
      />

      <div className="absolute inset-0 opacity-[0.08] [background-image:linear-gradient(rgba(255,255,255,0.45)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.45)_1px,transparent_1px)] [background-size:82px_82px]" />
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,_transparent_0%,_transparent_55%,_rgba(2,6,23,0.55)_100%)]" />
      <div className="absolute inset-0 bg-[linear-gradient(180deg,rgba(255,255,255,0.025),transparent_35%,rgba(255,255,255,0.015))]" />

      <motion.div
        className="absolute inset-0"
        animate={{ opacity: [0.16, 0.28, 0.16] }}
        transition={{ duration: 18, repeat: Infinity, ease: 'easeInOut' }}
      >
        <div className="absolute left-[14%] top-[24%] h-1.5 w-1.5 rounded-full bg-white/60" />
        <div className="absolute right-[18%] top-[20%] h-1 w-1 rounded-full bg-cyan-300/60" />
        <div className="absolute bottom-[24%] right-[24%] h-1.5 w-1.5 rounded-full bg-violet-300/60" />
        <div className="absolute bottom-[18%] left-[34%] h-1 w-1 rounded-full bg-white/60" />
      </motion.div>
    </div>
  );
}
