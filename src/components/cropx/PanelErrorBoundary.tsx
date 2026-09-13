import React from "react";
import { cn } from "@/lib/utils";

interface Props {
  children: React.ReactNode;
  /** Short label for what is inside, used in the fallback message. */
  label?: string;
  className?: string;
}

interface State {
  hasError: false | { message: string };
}

/**
 * Guards Convex-backed panels: `useQuery` THROWS when the backend is
 * unreachable or a function errors, and an uncaught throw would blank the
 * whole console. This boundary catches it and renders an inline fallback
 * so the rest of the dashboard keeps working.
 */
export class PanelErrorBoundary extends React.Component<Props, State> {
  state: State = { hasError: false };

  static getDerivedStateFromError(error: Error): State {
    return { hasError: { message: error.message || "unknown error" } };
  }

  componentDidCatch(err: Error) {
    console.warn("[CropX] panel error contained:", err.message);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div
          className={cn(
            "border border-border bg-card px-3.5 py-3 font-mono text-[11px] text-muted-foreground",
            this.props.className,
          )}
        >
          <p className="font-mono text-[10.5px] font-semibold uppercase tracking-[0.14em] text-risk-medium">
            data feed unavailable
          </p>
          <p className="mt-1 leading-relaxed">
            {this.props.label ? `${this.props.label}: ` : ""}
            {this.state.hasError.message} — retrying automatically when the
            connection recovers.
          </p>
        </div>
      );
    }
    return this.props.children;
  }
}
