/**
 * Topographic contour lines — the cartographic motif behind the sign-in
 * panel and empty states. Decorative only; hidden from assistive tech.
 */
export function TopoBackdrop({ className }: { className?: string }) {
  return (
    <svg
      aria-hidden="true"
      className={className}
      viewBox="0 0 600 600"
      fill="none"
      preserveAspectRatio="xMidYMid slice"
    >
      {[0, 1, 2, 3, 4, 5, 6].map(i => (
        <path
          key={i}
          d={`M -50 ${90 + i * 78}
              C 100 ${40 + i * 70}, 200 ${140 + i * 74}, 320 ${95 + i * 76}
              S 520 ${150 + i * 72}, 660 ${80 + i * 78}`}
          stroke="currentColor"
          strokeWidth="1.25"
          opacity={0.16 - i * 0.015}
        />
      ))}
    </svg>
  );
}
