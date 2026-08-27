const lines = [
  [[10, 20], [90, 20]],
  [[10, 50], [90, 50]],
  [[10, 80], [90, 80]],
  [[10, 20], [30, 50], [50, 80], [70, 50], [90, 20]],
  [[10, 80], [30, 50], [50, 20], [70, 50], [90, 80]]
];

const PaylineOverlay = ({ paylines }: { paylines: number[] }) => (
  <svg viewBox="0 0 100 100" className="pointer-events-none absolute inset-0 h-full w-full">
    {paylines.map((line) => (
      <polyline
        key={line}
        points={lines[line].map(([x, y]) => `${x},${y}`).join(' ')}
        fill="none"
        stroke="#F5C518"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    ))}
  </svg>
);

export default PaylineOverlay;
