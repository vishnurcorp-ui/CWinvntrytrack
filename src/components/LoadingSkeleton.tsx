export function TableSkeleton() {
  return (
    <div className="bg-card border border-border">
      <div className="p-4 space-y-3">
        <div className="h-4 bg-muted animate-pulse w-full" />
        <div className="h-4 bg-muted animate-pulse w-full" />
        <div className="h-4 bg-muted animate-pulse w-3/4" />
        <div className="h-4 bg-muted animate-pulse w-5/6" />
        <div className="h-4 bg-muted animate-pulse w-full" />
        <div className="h-4 bg-muted animate-pulse w-4/5" />
      </div>
    </div>
  );
}

export function StatsSkeleton() {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
      {[1, 2, 3, 4].map((i) => (
        <div key={i} className="bg-card border border-border p-4">
          <div className="space-y-2">
            <div className="h-3 bg-muted animate-pulse w-1/2" />
            <div className="h-8 bg-muted animate-pulse w-1/3" />
          </div>
        </div>
      ))}
    </div>
  );
}

export function PageLoading() {
  return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="text-sm text-muted-foreground">Loading...</div>
    </div>
  );
}
