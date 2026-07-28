"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { deactivateFramework } from "@/lib/services/identity";
import { useAuthStore } from "@/lib/stores/auth-store";
import { Button } from "@/components/ui/button";

export function ActiveFrameworkCard() {
  const queryClient = useQueryClient();
  const user = useAuthStore((s) => s.user);
  const hasActive = !!user?.activeFrameworkId;

  const mutation = useMutation({
    mutationFn: deactivateFramework,
    onSuccess: (data) => {
      toast.success("Active framework cleared");
      useAuthStore.getState().setUser(data);
      queryClient.invalidateQueries({ queryKey: ["portfolio"] });
      queryClient.invalidateQueries({ queryKey: ["compliance"] });
    },
    onError: (err: Error) => {
      toast.error(err.message ?? "Failed to clear active framework");
    },
  });

  return (
    <div className="rounded-lg border border-border/15 bg-surface/50 p-4 space-y-3">
      <div>
        <h3 className="text-sm font-medium">Active Enforcement Framework</h3>
        <p className="text-xs text-muted-foreground">
          {hasActive
            ? "A framework is active on your account. Some trading actions may be restricted."
            : "No framework is active. All trading actions are permitted."}
        </p>
      </div>
      {hasActive && (
        <Button
          variant="outline"
          size="sm"
          onClick={() => mutation.mutate()}
          disabled={mutation.isPending}
        >
          {mutation.isPending ? "Clearing..." : "Remove Active Framework"}
        </Button>
      )}
    </div>
  );
}
