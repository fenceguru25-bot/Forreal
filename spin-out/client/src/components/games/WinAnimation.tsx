import { motion } from 'framer-motion';

const WinAnimation = ({ amount, multiplier, onClose }: { amount: number; multiplier: number; onClose: () => void }) => {
  const title = multiplier >= 20 ? 'JACKPOT' : multiplier >= 10 ? 'MEGA WIN' : 'BIG WIN';
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm" onClick={onClose}>
      <div className="relative text-center">
        {Array.from({ length: 24 }).map((_, index) => (
          <motion.div
            key={index}
            className="absolute left-1/2 top-1/2 h-3 w-3 rounded-full bg-gold"
            animate={{ x: [0, (index - 12) * 18], y: [0, (index % 2 === 0 ? -1 : 1) * 120], opacity: [1, 0] }}
            transition={{ duration: 1.4, repeat: Infinity, delay: index * 0.03 }}
          />
        ))}
        <motion.div initial={{ scale: 0.8, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} className="glass-card rounded-3xl px-10 py-8 shadow-glow">
          <p className="text-sm uppercase tracking-[0.4em] text-gold">{title}</p>
          <motion.h2 initial={{ y: 20 }} animate={{ y: 0 }} className="mt-3 text-5xl font-black">${amount.toFixed(2)}</motion.h2>
          <p className="mt-2 text-white/70">Multiplier: {multiplier.toFixed(2)}x</p>
        </motion.div>
      </div>
    </div>
  );
};

export default WinAnimation;
