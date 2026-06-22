"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { ImageIcon, Loader2, MoreHorizontal, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { deleteTrip } from "@/actions/trips";
import { refreshTripCoverImage } from "@/actions/cover-image";
import { toast } from "sonner";

interface TripSettingsMenuProps {
  tripId: string;
  destination: string;
}

export function TripSettingsMenu({ tripId, destination }: TripSettingsMenuProps) {
  const router = useRouter();
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [isPending, startTransition] = useTransition();
  const [isRefreshingCover, startCoverTransition] = useTransition();

  const handleDelete = () => {
    startTransition(async () => {
      await deleteTrip(tripId);
      router.push("/dashboard");
      router.refresh();
    });
  };

  const handleRefreshCover = () => {
    startCoverTransition(async () => {
      try {
        const url = await refreshTripCoverImage(tripId);
        if (url) {
          toast.success("Cover image updated");
          router.refresh();
        } else {
          toast.error("Could not fetch a new cover image. Check your Unsplash API key.");
        }
      } catch {
        toast.error("Failed to refresh cover image");
      }
    });
  };

  return (
    <>
      <DropdownMenu>
        <DropdownMenuTrigger
          render={
            <Button
              variant="outline"
              size="icon"
              aria-label="Trip options"
              className="border-white/20 bg-black/30 text-white hover:bg-black/40 hover:text-white"
            >
              <MoreHorizontal className="h-4 w-4" />
            </Button>
          }
        />
        <DropdownMenuContent align="end">
          <DropdownMenuItem onClick={handleRefreshCover} disabled={isRefreshingCover}>
            {isRefreshingCover ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <ImageIcon className="h-4 w-4" />
            )}
            Refresh cover image
          </DropdownMenuItem>
          <DropdownMenuItem
            variant="destructive"
            onClick={() => setConfirmOpen(true)}
          >
            <Trash2 className="h-4 w-4" />
            Delete packing list
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>

      <Dialog open={confirmOpen} onOpenChange={setConfirmOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete this packing list?</DialogTitle>
            <DialogDescription>
              This will permanently delete your packing list for{" "}
              <strong>{destination}</strong>, including all items, outfits, and chat
              history. This cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setConfirmOpen(false)} disabled={isPending}>
              Cancel
            </Button>
            <Button variant="destructive" onClick={handleDelete} disabled={isPending}>
              {isPending ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Deleting...
                </>
              ) : (
                "Delete list"
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
