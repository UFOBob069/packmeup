"use client";

import { useState, useTransition } from "react";
import { Copy, Mail, Link2 } from "lucide-react";
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
import { inviteByEmail, getShareLink } from "@/actions/packing";
import { toast } from "sonner";

interface InviteDialogProps {
  tripId: string;
}

export function InviteDialog({ tripId }: InviteDialogProps) {
  const [email, setEmail] = useState("");
  const [role, setRole] = useState<"editor" | "viewer">("editor");
  const [shareLink, setShareLink] = useState("");
  const [isPending, startTransition] = useTransition();

  const loadShareLink = () => {
    startTransition(async () => {
      const link = await getShareLink(tripId);
      setShareLink(link);
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

  const copyLink = () => {
    navigator.clipboard.writeText(shareLink);
    toast.success("Link copied!");
  };

  return (
    <Dialog onOpenChange={(open) => open && loadShareLink()}>
      <DialogTrigger render={<Button variant="outline" size="sm" />}>
        <Link2 className="mr-2 h-4 w-4" />
        Invite
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Invite Collaborators</DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          <div className="space-y-2">
            <Label>Share Link</Label>
            <div className="flex gap-2">
              <Input value={shareLink} readOnly placeholder="Loading..." />
              <Button variant="outline" size="icon" onClick={copyLink} disabled={!shareLink}>
                <Copy className="h-4 w-4" />
              </Button>
            </div>
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
