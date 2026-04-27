import { Suspense } from "react";
import SpeciesDetailContent from "./SpeciesDetailContent";

export default function SpeciesDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  return (
    <Suspense
      fallback={
        <div className="flex items-center justify-center min-h-[60vh]">
          <div className="text-center text-stone-400">
            <div className="w-10 h-10 border-2 border-emerald-400 border-t-transparent rounded-full animate-spin mx-auto mb-3" />
            <p className="text-sm">Loading species...</p>
          </div>
        </div>
      }
    >
      <SpeciesDetailContent params={params} />
    </Suspense>
  );
}
