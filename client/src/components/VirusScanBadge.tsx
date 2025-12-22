import { Badge } from "@/components/ui/badge";
import { ShieldCheck, ShieldAlert, Shield, Loader2 } from "lucide-react";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";

type Status = "pending" | "clean" | "infected";

export function VirusScanBadge({ status, report }: { status: Status, report?: string | null }) {
  if (status === "pending") {
    return (
      <Badge variant="outline" className="gap-1.5 border-yellow-500/50 text-yellow-500 bg-yellow-500/10">
        <Loader2 className="w-3.5 h-3.5 animate-spin" />
        Scanning...
      </Badge>
    );
  }

  if (status === "infected") {
    return (
      <Tooltip>
        <TooltipTrigger>
          <Badge variant="destructive" className="gap-1.5 shadow-lg shadow-red-500/20">
            <ShieldAlert className="w-3.5 h-3.5" />
            Threat Detected
          </Badge>
        </TooltipTrigger>
        <TooltipContent className="max-w-xs border-destructive bg-destructive/10 text-destructive-foreground">
          <p className="font-semibold">Security Report:</p>
          <p className="text-sm mt-1">{report || "Malicious code patterns detected."}</p>
        </TooltipContent>
      </Tooltip>
    );
  }

  return (
    <Tooltip>
      <TooltipTrigger>
        <Badge className="gap-1.5 bg-green-500/15 text-green-500 border-green-500/30 hover:bg-green-500/20 shadow-lg shadow-green-500/10">
          <ShieldCheck className="w-3.5 h-3.5" />
          Verified Safe
        </Badge>
      </TooltipTrigger>
      <TooltipContent>
        <p>This script passed automated security checks.</p>
      </TooltipContent>
    </Tooltip>
  );
}
