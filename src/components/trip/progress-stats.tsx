import type { PackingProgress } from "@/lib/types";
import { Progress } from "@/components/ui/progress";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

interface ProgressStatsProps {
  progress: PackingProgress;
}

export function ProgressStats({ progress }: ProgressStatsProps) {
  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="text-base">Packing Progress</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-2">
          <div className="flex justify-between text-sm">
            <span className="font-medium">Trip Total</span>
            <span className="text-muted-foreground">
              {progress.packed} / {progress.total} · {progress.percentage}%
            </span>
          </div>
          <Progress value={progress.percentage} className="h-2" />
        </div>
        <div className="grid gap-2 sm:grid-cols-2">
          {Object.entries(progress.byTraveler).map(([id, stats]) => (
            <div key={id} className="rounded-lg border p-3">
              <div className="flex justify-between text-sm">
                <span className="font-medium">{stats.name}</span>
                <span className="text-muted-foreground">
                  {stats.packed} / {stats.total}
                </span>
              </div>
              <Progress
                value={stats.total > 0 ? (stats.packed / stats.total) * 100 : 0}
                className="mt-2 h-1"
              />
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
