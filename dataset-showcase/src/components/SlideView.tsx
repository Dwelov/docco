import type { Dataset } from "@/lib/types";
import PropertiesList from "./PropertiesList";
import PreviewTable from "./PreviewTable";

interface SlideViewProps {
  dataset: Dataset;
  headerProps?: React.HTMLAttributes<HTMLDivElement>;
}

export default function SlideView({ dataset, headerProps }: SlideViewProps) {
  return (
    <article className="w-full">
      <div {...headerProps}>
        <h1 className="mb-5 text-center text-[22px] font-bold leading-tight text-black md:text-[28px] lg:text-[32px]">
          {dataset.title}
        </h1>
        <div className="mb-5">
          <PropertiesList properties={dataset.properties} />
        </div>
      </div>
      <PreviewTable dataset={dataset} />
      {dataset.file_url ? (
        <div className="mt-3">
          <a
            href={dataset.file_url}
            className="text-sm font-medium text-[#0E7490] underline-offset-2 hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#0E7490]"
          >
            Download CSV
          </a>
        </div>
      ) : null}
    </article>
  );
}
