import type { Property } from "@/lib/types";

interface PropertiesListProps {
  properties: Property[];
}

export default function PropertiesList({ properties }: PropertiesListProps) {
  if (properties.length === 0) return null;
  const twoColumns = properties.length > 6;
  return (
    <section aria-label="Properties" className="mx-auto w-full max-w-[960px]">
      <h2 className="mb-2 text-left text-base font-bold text-black">Properties</h2>
      <dl
        className={`grid gap-x-8 gap-y-1.5 ${
          twoColumns ? "grid-cols-1 sm:grid-cols-2" : "grid-cols-1"
        }`}
      >
        {properties.map((prop) => (
          <div key={prop.key} className="flex gap-2 text-[15px] leading-6">
            <dt className="shrink-0 font-semibold text-black">{prop.key}:</dt>
            <dd className="truncate text-gray-800" title={prop.value}>
              {prop.value}
            </dd>
          </div>
        ))}
      </dl>
    </section>
  );
}
