"use client";

import { useMemo, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Pencil, Search, Trash2, Users, X, Check } from "lucide-react";
import { toast } from "sonner";
import { deleteMyGroupMember, updateMyGroupMember } from "@/actions/group";
import { AddGroupMemberForm } from "@/components/group/add-group-member-form";
import { TravelerAvatar } from "@/components/design/traveler-avatar";
import type { GroupMember, TravelerType } from "@/lib/types";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

const TYPE_LABELS: Record<TravelerType, string> = {
  adult: "Adult",
  child: "Child",
  infant: "Infant",
  pet: "Pet",
};

interface MyGroupPanelProps {
  members: GroupMember[];
  className?: string;
}

export function MyGroupPanel({ members, className }: MyGroupPanelProps) {
  const router = useRouter();
  const [query, setQuery] = useState("");
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editName, setEditName] = useState("");
  const [isPending, startTransition] = useTransition();

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return members;
    return members.filter(
      (m) =>
        m.name.toLowerCase().includes(q) ||
        TYPE_LABELS[m.traveler_type].toLowerCase().includes(q)
    );
  }, [members, query]);

  const startEdit = (member: GroupMember) => {
    setEditingId(member.id);
    setEditName(member.name);
  };

  const saveEdit = (memberId: string) => {
    const name = editName.trim();
    if (!name) {
      toast.error("Name is required");
      return;
    }
    startTransition(async () => {
      try {
        await updateMyGroupMember(memberId, { name });
        setEditingId(null);
        router.refresh();
        toast.success("Updated");
      } catch {
        toast.error("Could not update");
      }
    });
  };

  const handleDelete = (memberId: string) => {
    startTransition(async () => {
      try {
        await deleteMyGroupMember(memberId);
        router.refresh();
        toast.success("Removed from My Group");
      } catch {
        toast.error("Could not remove");
      }
    });
  };

  return (
    <div className={cn("space-y-4", className)}>
      <div className="relative">
        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
        <Input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search My Group..."
          className="pl-9"
        />
      </div>

      <AddGroupMemberForm />

      {filtered.length === 0 ? (
        <div className="rounded-xl border bg-muted/20 px-4 py-10 text-center">
          <Users className="mx-auto mb-2 h-8 w-8 text-muted-foreground" />
          <p className="text-sm font-medium">No one in My Group yet</p>
          <p className="mt-1 text-xs text-muted-foreground">
            People you add to trips are saved here automatically for next time.
          </p>
        </div>
      ) : (
        <ul className="space-y-2">
          {filtered.map((member, index) => (
            <li
              key={member.id}
              className="flex items-center gap-3 rounded-xl border bg-card px-3 py-2.5 shadow-travel-sm"
            >
              <TravelerAvatar
                name={member.name}
                type={member.traveler_type}
                index={index}
                size="sm"
              />
              <div className="min-w-0 flex-1">
                {editingId === member.id ? (
                  <Input
                    value={editName}
                    onChange={(e) => setEditName(e.target.value)}
                    className="h-8"
                    autoFocus
                  />
                ) : (
                  <>
                    <p className="truncate font-medium">{member.name}</p>
                    <p className="text-xs text-muted-foreground">
                      {TYPE_LABELS[member.traveler_type]}
                      {member.traveler_type === "pet" && member.pet_species
                        ? ` · ${member.pet_species}${member.pet_size ? `, ${member.pet_size}` : ""}`
                        : ""}
                    </p>
                  </>
                )}
              </div>
              <div className="flex shrink-0 gap-1">
                {editingId === member.id ? (
                  <>
                    <Button
                      type="button"
                      size="icon-sm"
                      variant="ghost"
                      onClick={() => saveEdit(member.id)}
                      disabled={isPending}
                      className="cursor-pointer"
                    >
                      <Check className="h-4 w-4" />
                    </Button>
                    <Button
                      type="button"
                      size="icon-sm"
                      variant="ghost"
                      onClick={() => setEditingId(null)}
                      className="cursor-pointer"
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  </>
                ) : (
                  <>
                    <Button
                      type="button"
                      size="icon-sm"
                      variant="ghost"
                      onClick={() => startEdit(member)}
                      className="cursor-pointer"
                    >
                      <Pencil className="h-4 w-4" />
                    </Button>
                    <Button
                      type="button"
                      size="icon-sm"
                      variant="ghost"
                      onClick={() => handleDelete(member.id)}
                      disabled={isPending}
                      className="cursor-pointer text-muted-foreground hover:text-destructive"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </>
                )}
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
