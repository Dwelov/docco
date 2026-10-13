interface DotsProps {
  total: number;
  current: number;
  onSelect?: (index: number) => void;
}

export default function Dots({ total, current, onSelect }: DotsProps) {
  if (total <= 1) return null;
  return (
    <div className="flex items-center justify-center gap-3">
      <div className="flex items-center gap-2" role="tablist" aria-label="Datasets">
        {Array.from({ length: total }, (_, i) => (
          <button
            key={i}
            type="button"
            role="tab"
            aria-selected={i === current}
            aria-label={`Go to dataset ${i + 1}`}
            onClick={() => onSelect?.(i)}
            className={`h-2 rounded-full transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#0E7490] ${
              i === current ? "w-6 bg-[#0E7490]" : "w-2 bg-gray-300 hover:bg-gray-400"
            }`}
          />
        ))}
      </div>
      <span className="text-sm tabular-nums text-gray-600" aria-live="polite">
        {current + 1} / {total}
      </span>
    </div>
  );
}
