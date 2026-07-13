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
        className="inline-flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground"
        aria-label={`Learn more about ${term}`}
      >
        <Info className="h-3 w-3" />
      </TooltipTrigger>
      <TooltipContent side="top" className="max-w-xs text-xs">
        <p className="font-medium">{term}</p>
        <p className="mt-1 text-muted-foreground">{definition}</p>
      </TooltipContent>
    </Tooltip>
  )
}
