import { ChevronLeft, ChevronRight } from "lucide-react";

interface ArrowButtonProps {
  direction: "prev" | "next";
  onClick: () => void;
}

export default function ArrowButton({ direction, onClick }: ArrowButtonProps) {
  const label = direction === "prev" ? "Previous dataset" : "Next dataset";
  const Icon = direction === "prev" ? ChevronLeft : ChevronRight;
  return (
    <button
      type="button"
      aria-label={label}
      onClick={onClick}
      className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-[#D9D9D9] text-black transition-colors hover:bg-[#BFBFBF] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#0E7490] focus-visible:ring-offset-2 focus-visible:ring-offset-white lg:h-[54px] lg:w-[54px]"
    >
      <Icon className="h-5 w-5 lg:h-6 lg:w-6" aria-hidden="true" />
    </button>
  );
}
