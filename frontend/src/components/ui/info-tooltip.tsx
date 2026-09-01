import { Info } from "lucide-react"
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip"

interface InfoTooltipProps {
  term: string
  definition: string
}

export function InfoTooltip({ term, definition }: InfoTooltipProps) {
  return (
    <Tooltip>
      <TooltipTrigger
        className="inline-flex size-4 items-center justify-center rounded-full text-muted-foreground transition-colors hover:bg-emerald-subtle hover:text-emerald focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
        aria-label={`Learn more about ${term}`}
      >
        <Info className="h-3 w-3" />
      </TooltipTrigger>
      <TooltipContent side="top" className="max-w-[280px] p-3">
        <div className="flex items-start gap-2.5">
          <span className="mt-1.5 size-1.5 shrink-0 rounded-full bg-emerald" aria-hidden />
          <div className="space-y-1">
            <p className="text-xs font-semibold leading-none tracking-tight text-foreground">{term}</p>
            <p className="text-[11px] leading-relaxed text-muted-foreground">{definition}</p>
          </div>
        </div>
      </TooltipContent>
    </Tooltip>
  )
}
