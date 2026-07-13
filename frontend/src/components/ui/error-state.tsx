"use client";

import { AlertTriangle } from "lucide-react"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"

interface ErrorStateProps {
  title?: string
  message?: string
  onRetry?: () => void
  className?: string
}

export function ErrorState({
  title = "Something went wrong",
  message = "An unexpected error occurred. Please try again.",
  onRetry,
  className,
}: ErrorStateProps) {
  return (
    <div
      className={cn(
        "flex flex-col items-center justify-center rounded-lg border p-12 text-center",
        className,
      )}
    >
      <AlertTriangle className="mb-4 h-12 w-12 text-destructive/50" />
      <h3 className="text-sm font-medium text-foreground">{title}</h3>
      {message && (
        <p className="mt-1 text-sm text-muted-foreground">{message}</p>
      )}
      {onRetry && (
        <Button variant="outline" size="sm" className="mt-4" onClick={onRetry}>
          Try Again
        </Button>
      )}
    </div>
  )
}
