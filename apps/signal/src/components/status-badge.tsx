import { cn } from "@shimokitan/ui";
import { Severity } from "../lib/data";

interface StatusBadgeProps {
    severity: Severity;
    className?: string;
}

export function StatusBadge({ severity, className }: StatusBadgeProps) {
    const isCritical = severity === "critical";
    const isHigh = severity === "high";
    const isMonitoring = severity === "monitoring";
    const isResolved = severity === "resolved";

    const label = severity.charAt(0).toUpperCase() + severity.slice(1);

    return (
        <div
            className={cn(
                "inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-xs font-semibold whitespace-nowrap",
                isCritical && "bg-status-critical/10 text-status-critical border border-status-critical/20",
                isHigh && "bg-status-high/10 text-status-high border border-status-high/20",
                isMonitoring && "bg-status-monitoring/10 text-status-monitoring border border-status-monitoring/20",
                isResolved && "bg-status-resolved/10 text-status-resolved border border-status-resolved/20",
                className
            )}
        >
            <div
                className={cn(
                    "w-1.5 h-1.5 rounded-full",
                    isCritical && "bg-status-critical animate-pulse",
                    isHigh && "bg-status-high",
                    isMonitoring && "bg-status-monitoring",
                    isResolved && "bg-status-resolved"
                )}
            />
            {label}
        </div>
    );
}
