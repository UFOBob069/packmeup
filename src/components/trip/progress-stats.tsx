import type { PackingProgress } from "@/lib/types";
import { ProgressRing } from "@/components/design/progress-ring";
import { TravelerAvatar } from "@/components/design/traveler-avatar";

interface ProgressStatsProps {
  progress: PackingProgress;
}

export function ProgressStats({ progress }: ProgressStatsProps) {
  return (
    <section className="rounded-2xl border bg-card p-5 shadow-travel-sm sm:p-6">
      <div className="flex flex-col items-center gap-6 sm:flex-row sm:items-start">
        <ProgressRing
          value={progress.percentage}
          size={96}
          strokeWidth={7}
          sublabel="packed"
        />
        <div className="flex-1 text-center sm:text-left">
          <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
            Trip progress
          </p>
          <p className="text-display mt-1 text-2xl font-semibold">
            {progress.packed} of {progress.total} items
          </p>
          <p className="mt-1 text-sm text-muted-foreground">
            {progress.percentage >= 100
              ? "You're all packed! 🎉"
              : progress.percentage >= 75
                ? "Almost there — just a few things left."
                : "Keep going — every check gets you closer."}
          </p>
        </div>
      </div>

      <div className="mt-6 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        {Object.entries(progress.byTraveler).map(([id, stats], i) => (
          <div
            key={id}
            className="flex items-center gap-3 rounded-xl border bg-background/80 p-3"
          >
            <TravelerAvatar
              name={stats.name}
              type={id === "shared" ? "adult" : undefined}
              index={i}
              size="sm"
            />
            <div className="min-w-0 flex-1">
              <p className="truncate text-sm font-medium">{stats.name}</p>
              <p className="text-xs text-muted-foreground">
                {stats.packed}/{stats.total} packed
              </p>
            </div>
            <span className="text-sm font-semibold tabular-nums text-primary">
              {stats.total > 0 ? Math.round((stats.packed / stats.total) * 100) : 0}%
            </span>
          </div>
        ))}
      </div>
    </section>
  );
}
