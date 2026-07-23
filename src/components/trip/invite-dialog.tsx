"use client";

import { useState, useTransition } from "react";
import { format, parseISO } from "date-fns";
import { Copy, Mail, MessageSquareShare, Share2, XIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogHeader,
  DialogTitle,
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
import { getTravelerColor, getTravelerInitials } from "@/lib/design-system";
import { cn } from "@/lib/utils";
import { toast } from "sonner";
import type { TripMember } from "@/lib/types";

interface InviteDialogProps {
  tripId: string;
  destination: string;
  coverImageUrl?: string | null;
  startDate: string;
  endDate: string;
  members: TripMember[];
  canInvite?: boolean;
}

interface ShareInvitePayload {
  shareLink: string;
  title: string;
  text: string;
  message: string;
}

function roleLabel(role: string) {
  if (role === "owner") return "Host";
  if (role === "editor") return "Can edit";
  return "View only";
}

function memberDisplayName(member: TripMember) {
  return member.profile?.name?.trim() || member.profile?.email || "Traveler";
}

function MemberAvatarStack({
  members,
  onClick,
}: {
  members: TripMember[];
  onClick: () => void;
}) {
  const visible = members.slice(0, 5);
  const extra = members.length - visible.length;

  return (
    <button
      type="button"
      onClick={onClick}
      className="flex items-center rounded-full border border-white/25 bg-black/25 py-1 pl-1 pr-2 backdrop-blur-sm transition hover:bg-black/40 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/70"
      aria-label={`View ${members.length} people on this trip`}
      title="People on this trip"
    >
      <span className="flex -space-x-2">
        {visible.map((member, index) => {
          const name = memberDisplayName(member);
          return (
            <span
              key={member.id}
              className={cn(
                "flex h-8 w-8 items-center justify-center rounded-full border-2 border-white/90 text-[10px] font-semibold shadow-sm",
                getTravelerColor(index)
              )}
              title={name}
            >
              {getTravelerInitials(name)}
            </span>
          );
        })}
        {extra > 0 ? (
          <span className="flex h-8 w-8 items-center justify-center rounded-full border-2 border-white/90 bg-slate-800 text-[10px] font-semibold text-white">
            +{extra}
          </span>
        ) : null}
      </span>
    </button>
  );
}

export function InviteDialog({
  tripId,
  destination,
  coverImageUrl,
  startDate,
  endDate,
  members,
  canInvite = false,
}: InviteDialogProps) {
  const [open, setOpen] = useState(false);
  const [email, setEmail] = useState("");
  const [role, setRole] = useState<"editor" | "viewer">("editor");
  const [invite, setInvite] = useState<ShareInvitePayload | null>(null);
  const [isPending, startTransition] = useTransition();

  const people = members.filter((m) => m.profile?.name || m.profile?.email || m.user_id);

  const openDialog = () => {
    setOpen(true);
    if (!canInvite) return;
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
    <>
      <div className="flex items-center gap-2">
        {people.length > 0 ? <MemberAvatarStack members={people} onClick={openDialog} /> : null}
        {canInvite ? (
          <Button
            type="button"
            size="sm"
            onClick={openDialog}
            className="bg-white text-slate-900 shadow-travel-sm hover:bg-white/90"
          >
            <Share2 className="mr-1.5 h-4 w-4" />
            Share
          </Button>
        ) : people.length === 0 ? (
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={openDialog}
            className="border-white/20 bg-black/30 text-white hover:bg-black/40 hover:text-white"
          >
            People
          </Button>
        ) : null}
      </div>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent showCloseButton={false} className="overflow-hidden p-0 sm:max-w-md">
          <div className="relative overflow-hidden rounded-t-lg">
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
            <DialogClose
              type="button"
              className="absolute top-3 right-3 z-50 inline-flex size-9 items-center justify-center rounded-full border border-white/30 bg-black/55 text-white shadow-md backdrop-blur-sm hover:bg-black/70 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white"
              aria-label="Close"
            >
              <XIcon className="size-4" />
            </DialogClose>
          </div>
          <div className="space-y-4 p-6 pt-4">
            <DialogHeader className="p-0">
              <DialogTitle>People on this trip</DialogTitle>
            </DialogHeader>

            <ul className="space-y-2">
              {people.length === 0 ? (
                <li className="rounded-xl border border-dashed px-3 py-4 text-center text-sm text-muted-foreground">
                  You’re the only one here so far.
                </li>
              ) : (
                people.map((member, index) => {
                  const name = memberDisplayName(member);
                  return (
                    <li
                      key={member.id}
                      className="flex items-center gap-3 rounded-xl border bg-muted/20 px-3 py-2.5"
                    >
                      <div
                        className={cn(
                          "flex h-9 w-9 shrink-0 items-center justify-center rounded-full border-2 text-xs font-semibold",
                          getTravelerColor(index)
                        )}
                      >
                        {getTravelerInitials(name)}
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className="truncate text-sm font-medium">{name}</p>
                        {member.profile?.email ? (
                          <p className="truncate text-xs text-muted-foreground">
                            {member.profile.email}
                          </p>
                        ) : null}
                      </div>
                      <span className="shrink-0 rounded-full bg-background px-2 py-0.5 text-[11px] font-medium text-muted-foreground">
                        {roleLabel(member.role)}
                      </span>
                    </li>
                  );
                })
              )}
            </ul>

            {canInvite ? (
              <>
                <div className="space-y-2 border-t pt-4">
                  <Label>Invite more people</Label>
                  <p className="text-xs text-muted-foreground">
                    One link works for everyone in a group text — each person signs in and joins.
                  </p>
                  <div className="rounded-xl border bg-muted/30 p-3 text-sm leading-relaxed whitespace-pre-wrap">
                    {invite?.message ?? "Loading invite…"}
                  </div>
                  <div className="flex gap-2">
                    <Button
                      type="button"
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
                    <span className="bg-background px-2 text-muted-foreground">
                      or invite by email
                    </span>
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
              </>
            ) : (
              <p className="text-xs text-muted-foreground">
                Ask the host if you want to invite someone else.
              </p>
            )}
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
