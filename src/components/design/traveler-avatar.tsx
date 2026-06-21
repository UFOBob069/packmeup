import { cn } from "@/lib/utils";
import { getTravelerColor, getTravelerInitials } from "@/lib/design-system";

interface TravelerAvatarProps {
  name: string;
  type?: "adult" | "child" | "infant" | "pet";
  index?: number;
  size?: "sm" | "md" | "lg";
  showName?: boolean;
  packed?: number;
  total?: number;
  className?: string;
}

const sizes = {
  sm: "h-8 w-8 text-xs",
  md: "h-10 w-10 text-sm",
  lg: "h-14 w-14 text-base",
};

export function TravelerAvatar({
  name,
  type = "adult",
  index = 0,
  size = "md",
  showName,
  packed,
  total,
  className,
}: TravelerAvatarProps) {
  const isPet = type === "pet";
  const colorClass = getTravelerColor(index, isPet);

  return (
    <div className={cn("flex flex-col items-center gap-1.5", className)}>
      <div
        className={cn(
          "flex items-center justify-center rounded-full border-2 font-semibold",
          sizes[size],
          colorClass,
          isPet && "rounded-2xl"
        )}
      >
        {isPet ? "🐾" : getTravelerInitials(name)}
      </div>
      {showName && (
        <div className="text-center">
          <p className="text-xs font-medium">{name}</p>
          {packed !== undefined && total !== undefined && (
            <p className="text-[10px] text-muted-foreground">
              {packed}/{total} packed
            </p>
          )}
        </div>
      )}
    </div>
  );
}

interface TravelerAvatarGroupProps {
  travelers: { name: string; traveler_type: string; packed?: number; total?: number }[];
  max?: number;
  size?: "sm" | "md" | "lg";
}

export function TravelerAvatarGroup({ travelers, max = 5, size = "sm" }: TravelerAvatarGroupProps) {
  const visible = travelers.slice(0, max);

  return (
    <div className="flex -space-x-2">
      {visible.map((t, i) => (
        <div
          key={t.name}
          className={cn(
            "flex items-center justify-center rounded-full border-2 border-background font-semibold",
            sizes[size],
            getTravelerColor(i, t.traveler_type === "pet")
          )}
          title={t.name}
        >
          {t.traveler_type === "pet" ? "🐾" : getTravelerInitials(t.name)}
        </div>
      ))}
      {travelers.length > max && (
        <div
          className={cn(
            "flex items-center justify-center rounded-full border-2 border-background bg-muted font-medium text-muted-foreground",
            sizes[size]
          )}
        >
          +{travelers.length - max}
        </div>
      )}
    </div>
  );
}
