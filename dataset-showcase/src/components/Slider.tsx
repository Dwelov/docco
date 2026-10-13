"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import type { Dataset } from "@/lib/types";
import ArrowButton from "./ArrowButton";
import Dots from "./Dots";
import SlideView from "./SlideView";

interface SliderProps {
  datasets: Dataset[];
  isLoading?: boolean;
  error?: string | null;
  onRetry?: () => void;
}

export default function Slider({ datasets, isLoading, error, onRetry }: SliderProps) {
  const [index, setIndex] = useState(0);
  const touchStartX = useRef<number | null>(null);
  const total = datasets.length;

  const goTo = useCallback(
    (next: number) => {
      if (total === 0) return;
      setIndex(((next % total) + total) % total);
    },
    [total],
  );
  const goPrev = useCallback(() => {
    goTo(index - 1);
  }, [goTo, index]);
  const goNext = useCallback(() => {
    goTo(index + 1);
  }, [goTo, index]);

  useEffect(() => {
    function onKeyDown(e: KeyboardEvent) {
      if (e.key === "ArrowLeft") {
        e.preventDefault();
        goPrev();
      } else if (e.key === "ArrowRight") {
        e.preventDefault();
        goNext();
      }
    }
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [goPrev, goNext]);

  function onTouchStart(e: React.TouchEvent) {
    touchStartX.current = e.touches[0].clientX;
  }

  function onTouchEnd(e: React.TouchEvent) {
    if (touchStartX.current === null) return;
    const dx = e.changedTouches[0].clientX - touchStartX.current;
    touchStartX.current = null;
    if (Math.abs(dx) < 50) return;
    if (dx < 0) goNext();
    else goPrev();
  }

  if (isLoading) {
    return (
      <div aria-busy="true" aria-label="Loading datasets" className="w-full">
        <div className="mx-auto mb-5 h-9 w-2/3 animate-pulse rounded bg-gray-200" />
        <div className="mx-auto mb-5 w-full max-w-[960px] space-y-2">
          <div className="h-4 w-1/3 animate-pulse rounded bg-gray-200" />
          <div className="h-4 w-full animate-pulse rounded bg-gray-200" />
          <div className="h-4 w-5/6 animate-pulse rounded bg-gray-200" />
        </div>
        <div className="rounded-lg border border-gray-200 p-4">
          <div className="mb-3 h-5 w-1/4 animate-pulse rounded bg-gray-200" />
          <div className="max-h-[420px] space-y-2 overflow-hidden">
            {Array.from({ length: 8 }, (_, i) => (
              <div key={i} className="h-8 animate-pulse rounded bg-gray-100" />
            ))}
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div role="alert" className="mx-auto max-w-md rounded-lg border border-gray-200 p-8 text-center">
        <p className="mb-2 font-semibold text-black">Couldn&apos;t load datasets</p>
        <p className="mb-4 text-sm text-gray-600">{error}</p>
        {onRetry ? (
          <button
            type="button"
            onClick={onRetry}
            className="rounded-full bg-[#0E7490] px-5 py-2 text-sm font-medium text-white hover:bg-[#0c637b] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#0E7490] focus-visible:ring-offset-2"
          >
            Retry
          </button>
        ) : null}
      </div>
    );
  }

  if (total === 0) {
    return (
      <div className="mx-auto max-w-md rounded-lg border border-gray-200 p-8 text-center">
        <p className="font-semibold text-black">No datasets yet</p>
      </div>
    );
  }

  const safeIndex = total === 0 ? 0 : Math.min(index, total - 1);
  const dataset = datasets[safeIndex];
  const showNav = total > 1;

  return (
    <div className="w-full">
      <div className="flex items-center justify-center gap-4 lg:gap-6">
        {showNav ? (
          <div className="hidden shrink-0 md:block">
            <ArrowButton direction="prev" onClick={goPrev} />
          </div>
        ) : null}
        <div className="min-w-0 flex-1">
          <div key={dataset.id} className="slider-enter">
            <SlideView
              dataset={dataset}
              headerProps={{
                onTouchStart,
                onTouchEnd,
              }}
            />
          </div>
        </div>
        {showNav ? (
          <div className="hidden shrink-0 md:block">
            <ArrowButton direction="next" onClick={goNext} />
          </div>
        ) : null}
      </div>
      {showNav ? (
        <>
          <div className="mt-5 hidden justify-center md:flex">
            <Dots total={total} current={safeIndex} onSelect={goTo} />
          </div>
          <div className="mt-4 flex items-center justify-center gap-6 md:hidden">
            <ArrowButton direction="prev" onClick={goPrev} />
            <span className="text-sm tabular-nums text-gray-600" aria-live="polite">
              {safeIndex + 1} / {total}
            </span>
            <ArrowButton direction="next" onClick={goNext} />
          </div>
        </>
      ) : null}
    </div>
  );
}
