"use client";

import { useEffect } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { toast } from "sonner";

/** Shows a one-time welcome toast when arriving via a share invite. */
export function JoinedTripToast({ destination }: { destination: string }) {
  const searchParams = useSearchParams();
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    if (searchParams.get("joined") !== "1") return;
    const city = destination.split(",")[0]?.trim() || destination;
    toast.success(`You're in — packing for ${city} with the group`);
    router.replace(pathname, { scroll: false });
  }, [destination, pathname, router, searchParams]);

  return null;
}
