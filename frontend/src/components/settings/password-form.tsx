"use client";

import { useState } from "react";
import { useMutation } from "@tanstack/react-query";
import { toast } from "sonner";
import { changePassword } from "@/lib/services/identity";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

export function PasswordForm() {
  const [current, setCurrent] = useState("");
  const [newPw, setNewPw] = useState("");
  const [confirm, setConfirm] = useState("");

  const mutation = useMutation({
    mutationFn: () => changePassword(current, newPw),
    onSuccess: () => {
      toast.success("Password updated");
      setCurrent("");
      setNewPw("");
      setConfirm("");
    },
    onError: (err: Error) => {
      toast.error(err.message ?? "Failed to update password");
    },
  });

  const canSubmit =
    current.length > 0 &&
    newPw.length >= 8 &&
    newPw === confirm;

  return (
    <div className="rounded-lg border border-border bg-surface/50 p-4 space-y-3">
      <div>
        <h3 className="text-sm font-medium">Change Password</h3>
        <p className="text-xs text-muted-foreground">
          Update your account password.
        </p>
      </div>

      <div className="space-y-1.5">
        <label htmlFor="current-password" className="text-xs text-muted-foreground">
          Current Password
        </label>
        <Input
          id="current-password"
          type="password"
          value={current}
          onChange={(e) => setCurrent(e.target.value)}
          className="text-xs bg-background"
          required
        />
      </div>

      <div className="space-y-1.5">
        <label htmlFor="new-password" className="text-xs text-muted-foreground">
          New Password
        </label>
        <Input
          id="new-password"
          type="password"
          value={newPw}
          onChange={(e) => setNewPw(e.target.value)}
          placeholder="Min. 8 characters"
          className="text-xs bg-background"
          required
        />
      </div>

      <div className="space-y-1.5">
        <label htmlFor="confirm-password" className="text-xs text-muted-foreground">
          Confirm New Password
        </label>
        <Input
          id="confirm-password"
          type="password"
          value={confirm}
          onChange={(e) => setConfirm(e.target.value)}
          className="text-xs bg-background"
          required
        />
      </div>

      <Button
        onClick={() => mutation.mutate()}
        disabled={mutation.isPending || !canSubmit}
        size="sm"
        className="bg-primary hover:bg-emerald-muted"
      >
        {mutation.isPending ? "Updating..." : "Update Password"}
      </Button>
    </div>
  );
}
