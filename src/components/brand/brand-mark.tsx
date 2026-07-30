import Image from "next/image";
import { cn } from "@/lib/utils";

interface BrandMarkProps {
  className?: string;
  size?: number;
  priority?: boolean;
}

/** Suitcase brand mark for headers and compact UI. */
export function BrandMark({ className, size = 36, priority = false }: BrandMarkProps) {
  return (
    <Image
      src="/brand/logo.png"
      alt=""
      width={size}
      height={size}
      priority={priority}
      className={cn("rounded-[22%] object-cover shadow-travel-sm", className)}
    />
  );
}
