import { cn } from "@/lib/utils";

type CoverVariant = "card" | "hero" | "preview";

interface DestinationCoverProps {
  destination: string;
  coverImageUrl?: string | null;
  variant?: CoverVariant;
  className?: string;
  children?: React.ReactNode;
}

const variantHeights: Record<CoverVariant, string> = {
  card: "h-36 sm:h-40",
  hero: "min-h-[180px] sm:min-h-[220px]",
  preview: "h-28",
};

export function DestinationCover({
  destination,
  coverImageUrl,
  variant = "card",
  className,
  children,
}: DestinationCoverProps) {
  const hasImage = Boolean(coverImageUrl);

  return (
    <div
      className={cn(
        "relative overflow-hidden",
        variantHeights[variant],
        !hasImage && "bg-gradient-to-r from-primary via-sky-blue to-ocean-teal",
        className
      )}
      role="img"
      aria-label={`${destination} destination`}
    >
      {hasImage && (
        <>
          <div
            className="absolute inset-0 bg-cover bg-center transition-transform duration-500 group-hover:scale-105"
            style={{ backgroundImage: `url(${coverImageUrl})` }}
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/40 to-black/20" />
        </>
      )}

      {children && (
        <div
          className={cn(
            "relative z-10 flex h-full flex-col justify-end",
            variant === "card" ? "p-4" : variant === "preview" ? "p-4" : "p-5 sm:p-6"
          )}
        >
          {children}
        </div>
      )}
    </div>
  );
}
