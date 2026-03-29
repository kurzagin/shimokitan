import { Icon } from "@iconify/react";
import Link from "next/link";

export default function Page() {
  return (
    <div className="animate-in fade-in duration-1000 flex flex-col items-center justify-center min-h-[90vh] w-full max-w-5xl mx-auto px-6 text-center py-12">
      
      {/* Brand Header */}
      <div className="mb-8">
        <h1 className="text-5xl md:text-6xl font-black tracking-tighter mb-2">Signal.</h1>
        <div className="h-1 w-16 bg-foreground mx-auto" />
      </div>

      <div className="space-y-6 max-w-2xl">
        {/* Status Indicator */}
        <div className="inline-flex items-center gap-2 px-3 py-1 bg-muted/50 rounded-full border border-border/50 text-[10px] font-mono uppercase tracking-[0.2em] text-muted-foreground">
          <span className="relative flex h-1.5 w-1.5">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-status-monitoring opacity-75"></span>
            <span className="relative inline-flex rounded-full h-1.5 w-1.5 bg-status-monitoring"></span>
          </span>
          Synchronizing_Frequencies
        </div>
        
        <div className="space-y-3">
          <h2 className="text-2xl md:text-4xl font-bold tracking-tight text-balance italic">
            Decrypting the human pulse of the district
          </h2>
          
          <p className="text-muted-foreground text-base md:text-lg leading-relaxed text-balance max-w-lg mx-auto opacity-80">
            The anomaly hub is currently calibrating. We are building the operational counterpart to Shimokitan — a direct bridge between collective feedback and actionable resolution.
          </p>
        </div>

        {/* Back Button */}
        <div className="pt-4">
          <Link 
            href="https://shimokitan.live" 
            className="group inline-flex items-center gap-2 px-6 py-3 bg-foreground text-background rounded-full font-bold uppercase tracking-widest text-[10px] hover:scale-105 transition-transform"
          >
            <Icon icon="lucide:arrow-left" className="w-3.5 h-3.5 group-hover:-translate-x-1 transition-transform" />
            Return_to_Headquarters
          </Link>
        </div>

        {/* Core Pillars - Compact */}
        <div className="pt-10 grid grid-cols-1 md:grid-cols-3 gap-6 text-center border-t border-border/50 mt-8">
          <div className="space-y-2 flex flex-col items-center">
             <div className="w-8 h-8 rounded-lg bg-muted flex items-center justify-center border border-border/50">
               <Icon icon="lucide:radar" className="w-4 h-4 text-muted-foreground" />
             </div>
             <h3 className="font-bold text-[11px] uppercase tracking-widest">Anomaly_Detection</h3>
             <p className="text-[10px] text-muted-foreground leading-snug opacity-70">
               Real-time identification of system bottlenecks across the district.
             </p>
          </div>
          <div className="space-y-2 flex flex-col items-center">
             <div className="w-8 h-8 rounded-lg bg-muted flex items-center justify-center border border-border/50">
               <Icon icon="lucide:git-pull-request" className="w-4 h-4 text-muted-foreground" />
             </div>
             <h3 className="font-bold text-[11px] uppercase tracking-widest">Actionable_Logs</h3>
             <p className="text-[10px] text-muted-foreground leading-snug opacity-70">
               High-contrast issues built from aggregated human feedback.
             </p>
          </div>
          <div className="space-y-2 flex flex-col items-center">
             <div className="w-8 h-8 rounded-lg bg-muted flex items-center justify-center border border-border/50">
               <Icon icon="lucide:radio" className="w-4 h-4 text-muted-foreground" />
             </div>
             <h3 className="font-bold text-[11px] uppercase tracking-widest">Direct_Broadcast</h3>
             <p className="text-[10px] text-muted-foreground leading-snug opacity-70">
               A transparent, operational feed of system health and trust.
             </p>
          </div>
        </div>
      </div>
      
      {/* Footer Meta */}
      <div className="mt-16 space-y-1">
        <div className="text-[9px] font-mono text-muted-foreground opacity-30 uppercase tracking-[0.4em]">
          CONNECTION_PENDING // SHIMOKITAN_SIGNAL_V0.1
        </div>
        <div className="flex items-center justify-center gap-4 text-[9px] font-mono text-muted-foreground opacity-20 uppercase tracking-widest">
          <span>LAT: 35.6622° N</span>
          <span>LNG: 139.6664° E</span>
        </div>
      </div>
    </div>
  );
}
