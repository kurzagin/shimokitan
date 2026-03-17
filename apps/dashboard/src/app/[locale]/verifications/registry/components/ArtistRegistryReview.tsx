"use client";

import React from "react";
import { Icon } from "@iconify/react";
import { toast } from "sonner";
import RegistryTable from "@/components/RegistryTable";
import { updateRegistryApplicationStatus, deleteRegistryApplication } from "../../../actions";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@shimokitan/ui";

/**
 * Artist Registry Review Component.
 * Displays a table of applications with status management and detail expansion.
 */
export default function ArtistRegistryReview({ data }: { data: any[] }) {
  const [expanding, setExpanding] = React.useState<string | null>(null);

  const handleStatusChange = async (id: string, status: any) => {
    try {
      const res = await updateRegistryApplicationStatus(id, status);
      if (res.success) toast.success(`SIGNAL_UPDATED: Status changed to ${status}`);
    } catch (e) {
      toast.error("Failed to update signal status.");
    }
  };

  return (
    <div className="space-y-4">
      <RegistryTable
        data={data}
        onDelete={deleteRegistryApplication}
        columns={[
          {
            key: "artistMetadata",
            label: "Artist_Signal",
            render: (val: any, row: any) => (
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded bg-violet-600/20 flex items-center justify-center border border-violet-500/30">
                  <Icon icon="lucide:user" className="text-violet-500" />
                </div>
                <div>
                  <div className="font-bold text-zinc-100">{val.name}</div>
                  <div className="text-[9px] font-mono text-zinc-500 uppercase">
                    {val.type} {'//'} {row.contactEmail}
                  </div>
                </div>
              </div>
            ),
          },
          {
            key: "status",
            label: "Curator_State",
            render: (val: string, row: any) => (
              <Select
                defaultValue={val}
                onValueChange={(v) => handleStatusChange(row.id, v as any)}
              >
                <SelectTrigger className="h-7 bg-zinc-900 border-zinc-800 text-[9px] font-black uppercase tracking-wider w-32">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="bg-zinc-950 border-zinc-800">
                  <SelectItem value="pending" className="text-[10px] uppercase font-mono">Pending</SelectItem>
                  <SelectItem value="reviewed" className="text-[10px] uppercase font-mono">Reviewed</SelectItem>
                  <SelectItem value="approved" className="text-[10px] uppercase font-mono text-emerald-400">Approved</SelectItem>
                  <SelectItem value="rejected" className="text-[10px] uppercase font-mono text-rose-500">Rejected</SelectItem>
                </SelectContent>
              </Select>
            ),
          },
          {
            key: "ipAddress",
            label: "Origin",
            render: (val: string) => (
              <span className="text-[9px] font-mono text-zinc-600 truncate max-w-[100px] block">
                {val}
              </span>
            ),
          },
          {
            key: "createdAt",
            label: "Sync_Date",
            render: (val: any) => (
              <span className="text-[10px] font-mono text-zinc-600">
                {new Date(val).toLocaleDateString()}
              </span>
            ),
          },
          {
            key: "id",
            label: "Details",
            render: (_: any, row: any) => (
              <button
                onClick={() => setExpanding(expanding === row.id ? null : row.id)}
                className={`p-1.5 rounded border transition-all ${
                  expanding === row.id
                    ? "bg-violet-600 border-violet-500 text-white"
                    : "bg-zinc-900 border-zinc-800 text-zinc-500 hover:text-white"
                }`}
              >
                <Icon
                  icon={expanding === row.id ? "lucide:chevron-up" : "lucide:eye"}
                  width={14}
                />
              </button>
            ),
          },
        ]}
      />

      {/* Detail Expansion Modal-like View (Inline) */}
      {expanding && (
        <div className="mt-4 p-6 bg-zinc-900/50 border border-zinc-800 rounded-lg animate-in fade-in slide-in-from-top-2">
          {(() => {
            const row = data.find((r) => r.id === expanding);
            if (!row) return null;
            return (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
                <div className="space-y-6">
                  <div>
                    <h4 className="flex items-center gap-2 text-[10px] font-mono uppercase tracking-[0.2em] text-zinc-500 mb-2">
                      <Icon icon="lucide:id-card" width={12} />
                      Artist_Profile
                    </h4>
                    <div className="bg-zinc-950/50 p-4 rounded border border-zinc-800 space-y-3">
                      <div>
                        <span className="text-[9px] font-mono text-zinc-600 block uppercase mb-1">Professional_Title</span>
                        <div className="text-sm font-black text-white italic">{row.artistMetadata.professionalTitle || "N/A"}</div>
                      </div>
                      <div>
                        <span className="text-[9px] font-mono text-zinc-600 block uppercase mb-1">Reason_for_Residency</span>
                        <p className="text-sm text-zinc-300 whitespace-pre-wrap leading-relaxed">
                          {row.artistMetadata.why || "No manifest provided."}
                        </p>
                      </div>
                    </div>
                  </div>

                  <div>
                    <h4 className="text-[10px] font-mono uppercase tracking-[0.2em] text-zinc-500 mb-2">
                      Social_Links
                    </h4>
                    <div className="flex flex-wrap gap-2">
                      {row.socialLinks.map((link: any, i: number) => {
                        const isStandard = ["x", "facebook", "instagram", "youtube", "spotify", "soundcloud", "apple_music"].includes(link.platform.toLowerCase());
                        return (
                          <a
                            key={i}
                            href={link.url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="flex items-center gap-2 bg-zinc-950 px-3 py-1.5 rounded border border-zinc-800 text-xs text-violet-400 hover:text-white hover:border-violet-600 transition-all font-mono group"
                          >
                            <Icon 
                              icon={isStandard ? `simple-icons:${link.platform.toLowerCase().replace(' ', '')}` : "lucide:link"} 
                              className="group-hover:scale-110 transition-transform"
                            />
                            <span className="uppercase">{link.platform}</span>
                          </a>
                        );
                      })}
                      {row.socialLinks.length === 0 && (
                        <span className="text-xs text-zinc-600 italic">No links linked.</span>
                      )}
                    </div>
                  </div>
                </div>

                <div className="space-y-4">
                  <h4 className="text-[10px] font-mono uppercase tracking-[0.2em] text-zinc-500 mb-2">
                    Artifact_Samples
                  </h4>
                  <div className="space-y-3">
                    {row.artifactSamples.map((sample: any, i: number) => (
                      <div
                        key={i}
                        className="bg-zinc-950/50 p-3 rounded border border-zinc-800 space-y-2 hover:border-zinc-700 transition-all group"
                      >
                        <div className="flex justify-between items-start">
                          <h5 className="font-bold text-white text-sm">
                            {sample.title || "Untitled Artifact"}
                          </h5>
                          <a
                            href={sample.url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-zinc-500 hover:text-emerald-400 transition-colors"
                          >
                            <Icon icon="lucide:external-link" width={14} />
                          </a>
                        </div>
                        {sample.description && (
                          <p className="text-[11px] text-zinc-500 italic">
                            {sample.description}
                          </p>
                        )}
                        <span className="text-[10px] font-mono text-zinc-600 block truncate">
                          {sample.url}
                        </span>
                      </div>
                    ))}
                    {row.artifactSamples.length === 0 && (
                      <div className="text-xs text-zinc-600 italic py-4">
                        No artifacts presented.
                      </div>
                    )}
                  </div>
                </div>
              </div>
            );
          })()}
        </div>
      )}
    </div>
  );
}
