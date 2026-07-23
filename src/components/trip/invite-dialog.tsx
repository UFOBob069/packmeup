"use client";

import { useState, useTransition } from "react";
import { format, parseISO } from "date-fns";
import { Copy, Mail, Link2, MessageSquareShare } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { inviteByEmail, getShareInvite } from "@/actions/packing";
import { DestinationCover } from "./destination-cover";
import { toast } from "sonner";

interface InviteDialogProps {
  tripId: string;
  destination: string;
  coverImageUrl?: string | null;
  startDate: string;
  endDate: string;
}

interface ShareInvitePayload {
  shareLink: string;
  title: string;
  text: string;
  message: string;
}

export function InviteDialog({
  tripId,
  destination,
  coverImageUrl,
  startDate,
  endDate,
}: InviteDialogProps) {
  const [email, setEmail] = useState("");
  const [role, setRole] = useState<"editor" | "viewer">("editor");
  const [invite, setInvite] = useState<ShareInvitePayload | null>(null);
  const [isPending, startTransition] = useTransition();

  const loadShareInvite = () => {
    startTransition(async () => {
      const result = await getShareInvite(tripId);
      setInvite({
        shareLink: result.shareLink,
        title: result.title,
        text: result.text,
        message: result.message,
      });
    });
  };

  const handleInvite = () => {
    if (!email.trim()) return;
    startTransition(async () => {
      const result = await inviteByEmail(tripId, email, role);
      toast.success(result.message);
      setEmail("");
    });
  };

  const copyLink = async () => {
    if (!invite) return;
    await navigator.clipboard.writeText(invite.message);
    toast.success("Invite message copied — paste it into a text or chat");
  };

  const shareInvite = async () => {
    if (!invite) return;

    if (typeof navigator !== "undefined" && "share" in navigator) {
      try {
        await navigator.share({
          title: invite.title,
          text: invite.text,
          url: invite.shareLink,
        });
        return;
      } catch (error) {
        if (error instanceof DOMException && error.name === "AbortError") return;
      }
    }

    await copyLink();
  };

  return (
    <Dialog onOpenChange={(open) => open && loadShareInvite()}>
      <DialogTrigger
        render={
          <Button
            variant="outline"
            size="sm"
            className="border-white/20 bg-black/30 text-white hover:bg-black/40 hover:text-white"
          />
        }
      >
        <Link2 className="mr-2 h-4 w-4" />
        Invite
      </DialogTrigger>
      <DialogContent className="overflow-hidden p-0 sm:max-w-md">
        <div className="overflow-hidden rounded-t-lg">
          <DestinationCover
            destination={destination}
            coverImageUrl={coverImageUrl}
            variant="preview"
            className="rounded-none"
          >
            <p className="text-xs font-medium uppercase tracking-wider text-white/80">
              Shared packing list
            </p>
            <p className="text-display truncate text-lg font-semibold text-white">{destination}</p>
            <p className="text-xs text-white/75">
              {format(parseISO(startDate), "MMM d")} – {format(parseISO(endDate), "MMM d, yyyy")}
            </p>
          </DestinationCover>
        </div>
        <div className="space-y-4 p-6 pt-4">
          <DialogHeader className="p-0">
            <DialogTitle>Invite Collaborators</DialogTitle>
          </DialogHeader>
          <div className="space-y-2">
            <Label>Share invite</Label>
            <p className="text-xs text-muted-foreground">
              Texts and chats get your invite message. One link works for everyone in a group
              text — each person signs in and joins. Link previews show this destination card.
            </p>
            <div className="rounded-xl border bg-muted/30 p-3 text-sm leading-relaxed whitespace-pre-wrap">
              {invite?.message ?? "Loading invite…"}
            </div>
            <div className="flex gap-2">
              <Button
                type="button"
                variant="outline"
                className="flex-1"
                onClick={() => void shareInvite()}
                disabled={!invite || isPending}
              >
                <MessageSquareShare className="mr-2 h-4 w-4" />
                Share / Text
              </Button>
              <Button
                type="button"
                variant="outline"
                size="icon"
                onClick={() => void copyLink()}
                disabled={!invite || isPending}
                aria-label="Copy invite message"
              >
                <Copy className="h-4 w-4" />
              </Button>
            </div>
            <Input value={invite?.shareLink ?? ""} readOnly placeholder="Loading link…" />
          </div>
          <div className="relative">
            <div className="absolute inset-0 flex items-center">
              <span className="w-full border-t" />
            </div>
            <div className="relative flex justify-center text-xs uppercase">
              <span className="bg-background px-2 text-muted-foreground">or invite by email</span>
            </div>
          </div>
          <div className="space-y-2">
            <Label htmlFor="email">Email</Label>
            <Input
              id="email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="partner@email.com"
            />
          </div>
          <div className="space-y-2">
            <Label>Role</Label>
            <Select value={role} onValueChange={(v) => setRole(v as "editor" | "viewer")}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="editor">Editor — can edit lists</SelectItem>
                <SelectItem value="viewer">Viewer — read only</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <Button onClick={handleInvite} disabled={isPending || !email.trim()} className="w-full">
            <Mail className="mr-2 h-4 w-4" />
            Send Invite
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
