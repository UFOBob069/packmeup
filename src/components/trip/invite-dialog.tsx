"use client";

import { useEffect, useState, useTransition } from "react";
import { Copy, Mail, MessageSquareShare, Share2, XIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
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
import { getHeaderTravelerColor, getTravelerColor, getTravelerInitials } from "@/lib/design-system";
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
  openSignal?: number;
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
      className="flex cursor-pointer items-center rounded-full border border-white/40 bg-white/20 py-1 pl-1.5 pr-2.5 shadow-sm backdrop-blur-sm transition hover:bg-white/30 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/80"
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
                "flex h-8 w-8 items-center justify-center rounded-full border-2 border-white text-[11px] font-bold shadow-md",
                getHeaderTravelerColor(index)
              )}
              title={name}
            >
              {getTravelerInitials(name)}
            </span>
          );
        })}
        {extra > 0 ? (
          <span className="flex h-8 w-8 items-center justify-center rounded-full border-2 border-white bg-slate-900 text-[11px] font-bold text-white shadow-md">
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
  openSignal = 0,
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

  useEffect(() => {
    if (openSignal > 0) openDialog();
    // eslint-disable-next-line react-hooks/exhaustive-deps -- open when parent bumps the signal
  }, [openSignal]);

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
            className="h-9 cursor-pointer bg-white px-3 text-slate-900 shadow-travel-sm hover:bg-white/90 sm:h-8"
          >
            <Share2 className="h-4 w-4 sm:mr-1.5" />
            <span className="hidden sm:inline">Share</span>
            <span className="sr-only sm:hidden">Share</span>
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
        <DialogContent
          showCloseButton={false}
          className="flex max-h-[min(85dvh,640px)] w-full max-w-[calc(100%-1.5rem)] flex-col gap-0 overflow-hidden p-0 sm:max-w-md"
        >
          <div className="flex shrink-0 items-start justify-between gap-3 border-b bg-background px-4 py-3 sm:px-5 sm:py-4">
            <div className="min-w-0">
              <DialogTitle className="text-display text-lg font-semibold">
                People on this trip
              </DialogTitle>
              <p className="mt-0.5 truncate text-xs text-muted-foreground">{destination}</p>
            </div>
            <button
              type="button"
              onClick={() => setOpen(false)}
              className="inline-flex size-9 shrink-0 cursor-pointer items-center justify-center rounded-full border bg-muted/40 text-foreground hover:bg-muted"
              aria-label="Close"
            >
              <XIcon className="size-4" />
            </button>
          </div>

          <div className="min-h-0 flex-1 space-y-3 overflow-y-auto overflow-x-hidden overscroll-contain px-4 py-4 sm:space-y-4 sm:px-5 sm:py-5">
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
                      className="flex min-w-0 items-center gap-3 rounded-xl border bg-muted/20 px-3 py-2.5"
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
                <div className="min-w-0 space-y-2 border-t pt-3 sm:pt-4">
                  <Label>Invite more people</Label>
                  <p className="text-xs text-muted-foreground">
                    One link works for everyone in a group text — each person signs in and joins.
                  </p>
                  <div className="max-h-28 overflow-y-auto rounded-xl border bg-muted/30 p-3 text-sm leading-relaxed break-all whitespace-pre-wrap">
                    {invite?.message ?? "Loading invite…"}
                  </div>
                  <div className="flex min-w-0 gap-2">
                    <Button
                      type="button"
                      className="min-w-0 flex-1 cursor-pointer"
                      onClick={() => void shareInvite()}
                      disabled={!invite || isPending}
                    >
                      <MessageSquareShare className="mr-2 h-4 w-4 shrink-0" />
                      Share / Text
                    </Button>
                    <Button
                      type="button"
                      variant="outline"
                      size="icon"
                      className="shrink-0 cursor-pointer"
                      onClick={() => void copyLink()}
                      disabled={!invite || isPending}
                      aria-label="Copy invite message"
                    >
                      <Copy className="h-4 w-4" />
                    </Button>
                  </div>
                  <Input
                    value={invite?.shareLink ?? ""}
                    readOnly
                    placeholder="Loading link…"
                    className="min-w-0 overflow-hidden text-ellipsis font-mono text-xs"
                  />
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
                <div className="grid min-w-0 gap-3 sm:grid-cols-[1fr_auto]">
                  <div className="min-w-0 space-y-2">
                    <Label htmlFor="share-email">Email</Label>
                    <Input
                      id="share-email"
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="partner@email.com"
                      className="min-w-0"
                    />
                  </div>
                  <div className="space-y-2 sm:w-36">
                    <Label>Role</Label>
                    <Select value={role} onValueChange={(v) => setRole(v as "editor" | "viewer")}>
                      <SelectTrigger className="w-full">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="editor">Editor — can edit lists</SelectItem>
                        <SelectItem value="viewer">Viewer — read only</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                <Button
                  type="button"
                  onClick={handleInvite}
                  disabled={isPending || !email.trim()}
                  className="w-full cursor-pointer"
                >
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
