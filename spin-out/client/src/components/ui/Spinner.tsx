const Spinner = ({ className = 'h-5 w-5 border-2' }: { className?: string }) => (
  <span className={`inline-block animate-spin rounded-full border-white/20 border-t-white ${className}`} />
);

export default Spinner;
