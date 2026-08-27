import { motion } from 'framer-motion';
import PaylineOverlay from './PaylineOverlay';

interface SlotReelsProps {
  reels: string[][];
  isSpinning: boolean;
  winningPaylines?: number[];
}

const SlotReels = ({ reels, isSpinning, winningPaylines = [] }: SlotReelsProps) => (
  <div className="relative overflow-hidden rounded-3xl border border-white/10 bg-card p-4">
    <div className="grid grid-cols-5 gap-3">
      {Array.from({ length: 5 }).map((_, reelIndex) => (
        <motion.div
          key={reelIndex}
          animate={isSpinning ? { y: [0, -10, 0] } : { y: 0 }}
          transition={{ duration: 0.6, repeat: isSpinning ? Infinity : 0, delay: reelIndex * 0.08 }}
          className="grid gap-3"
        >
          {Array.from({ length: 3 }).map((__, rowIndex) => (
            <div key={`${reelIndex}-${rowIndex}`} className={`reel-symbol ${winningPaylines.length ? 'win-flash' : ''}`}>
              {reels[rowIndex]?.[reelIndex] ?? '🍒'}
            </div>
          ))}
        </motion.div>
      ))}
    </div>
    <PaylineOverlay paylines={winningPaylines} />
    {isSpinning ? <div className="absolute inset-0 flex items-center justify-center bg-background/30 text-4xl font-black tracking-[0.5em] text-gold">SPIN</div> : null}
  </div>
);

export default SlotReels;
