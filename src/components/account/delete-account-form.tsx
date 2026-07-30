"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { deleteAccount } from "@/actions/account";

interface DeleteAccountFormProps {
  email: string;
}

export function DeleteAccountForm({ email }: DeleteAccountFormProps) {
  const router = useRouter();
  const [confirm, setConfirm] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();
  const ready = confirm.trim().toUpperCase() === "DELETE";

  const onDelete = () => {
    if (!ready) return;
    startTransition(async () => {
      setError(null);
      try {
        await deleteAccount();
        router.replace("/?deleted=1");
        router.refresh();
      } catch (cause) {
        setError(cause instanceof Error ? cause.message : "Could not delete account");
      }
    });
  };

  return (
    <div className="rounded-2xl border border-destructive/30 bg-destructive/5 p-5">
      <div className="flex items-start gap-3">
        <span className="mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-destructive/10 text-destructive">
          <Trash2 className="h-4 w-4" />
        </span>
        <div className="min-w-0 flex-1">
          <h2 className="text-display text-lg font-semibold">Delete account</h2>
          <p className="mt-1 text-sm text-muted-foreground">
            Permanently delete <span className="font-medium text-foreground">{email}</span> and all
            trips you own. Shared trips you joined will remove your membership. This cannot be
            undone.
          </p>
          <label className="mt-4 block text-sm font-medium">
            Type DELETE to confirm
            <Input
              value={confirm}
              onChange={(event) => setConfirm(event.target.value)}
              className="mt-2"
              autoComplete="off"
              placeholder="DELETE"
            />
          </label>
          {error ? <p className="mt-3 text-sm text-destructive">{error}</p> : null}
          <div className="mt-4 flex flex-wrap gap-2">
            <Button
              type="button"
              variant="destructive"
              disabled={!ready || pending}
              onClick={onDelete}
            >
              {pending ? "Deleting…" : "Delete my account"}
            </Button>
            <Button asChild type="button" variant="outline">
              <Link href="/dashboard">Cancel</Link>
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
