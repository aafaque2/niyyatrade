"use client";

import { useState } from "react";
import { useMutation } from "@tanstack/react-query";
import { toast } from "sonner";
import { useAuthStore } from "@/lib/stores/auth-store";
import { updateProfile } from "@/lib/services/identity";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

export function ProfileForm() {
  const user = useAuthStore((s) => s.user);
  const setUser = useAuthStore((s) => s.setUser);
  const [name, setName] = useState(user?.name ?? "");

  const trimmedName = name.trim();

  const mutation = useMutation({
    mutationFn: () => {
      if (trimmedName.length === 0) {
        return Promise.reject(new Error("Name cannot be empty"));
      }
      return updateProfile(trimmedName);
    },
    onSuccess: () => {
      if (user) {
        setUser({ ...user, name: trimmedName });
      }
      toast.success("Profile updated");
    },
    onError: (err: Error) => {
      toast.error(err.message ?? "Failed to update profile");
    },
  });

  const isDirty = trimmedName !== (user?.name ?? "").trim();

  return (
    <div className="rounded-lg border border-border bg-surface/50 p-4 space-y-3">
      <div>
        <h3 className="text-sm font-medium">Profile</h3>
        <p className="text-xs text-muted-foreground">
          Your name and email address.
        </p>
      </div>

      <div className="space-y-1.5">
        <label htmlFor="profile-email" className="text-xs text-muted-foreground">Email</label>
        <Input
          id="profile-email"
          value={user?.email ?? ""}
          disabled
          className="bg-muted text-xs"
        />
        <p className="text-[10px] text-muted-foreground">
          Email cannot be changed.
        </p>
      </div>

      <div className="space-y-1.5">
        <label htmlFor="profile-name" className="text-xs text-muted-foreground">Name</label>
        <Input
          id="profile-name"
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="Your name"
          className="text-xs bg-background"
        />
      </div>

      <Button
        onClick={() => mutation.mutate()}
        disabled={mutation.isPending || !isDirty || trimmedName.length === 0}
        size="sm"
        className="bg-primary hover:bg-emerald-muted"
      >
        {mutation.isPending ? "Saving..." : "Save"}
      </Button>
    </div>
  );
}
