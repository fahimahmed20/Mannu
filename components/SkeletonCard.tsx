export default function SkeletonCard() {
  return (
    <div className="rounded-2xl overflow-hidden bg-white shadow-sm border border-stone-200 animate-pulse">
      <div className="h-40 bg-stone-200" />
      <div className="p-3 space-y-2">
        <div className="h-4 bg-stone-200 rounded w-3/4" />
        <div className="h-3 bg-stone-100 rounded w-1/2" />
        <div className="h-8 bg-stone-100 rounded-xl mt-2" />
      </div>
    </div>
  );
}
