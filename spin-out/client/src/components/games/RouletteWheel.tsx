import { motion } from 'framer-motion';

const pockets = [0, 32, 15, 19, 4, 21, 2, 25, 17, 34, 6, 27, 13, 36, 11, 30, 8, 23, 10, 5, 24, 16, 33, 1, 20, 14, 31, 9, 22, 18, 29, 7, 28, 12, 35, 3, 26];
const red = new Set([1,3,5,7,9,12,14,16,18,19,21,23,25,27,30,32,34,36]);

const RouletteWheel = ({ spinning, result }: { spinning: boolean; result?: number }) => (
  <motion.div
    animate={spinning ? { rotate: 1440 } : { rotate: 0 }}
    transition={{ duration: 3, ease: 'easeOut' }}
    className="relative mx-auto flex h-80 w-80 items-center justify-center rounded-full border-8 border-gold bg-card shadow-glow"
  >
    {pockets.map((pocket, index) => (
      <div
        key={pocket}
        className={`absolute left-1/2 top-1/2 flex h-8 w-8 -translate-x-1/2 -translate-y-1/2 items-center justify-center rounded-full text-xs font-bold ${pocket === 0 ? 'bg-emerald-500' : red.has(pocket) ? 'bg-red-600' : 'bg-slate-900'}`}
        style={{ transform: `translate(-50%, -50%) rotate(${index * (360 / pockets.length)}deg) translateY(-136px)` }}
      >
        {pocket}
      </div>
    ))}
    <div className="flex h-20 w-20 items-center justify-center rounded-full bg-background text-center text-xl font-black text-gold">
      {result ?? 'SPIN'}
    </div>
  </motion.div>
);

export default RouletteWheel;
