"use client";

import React, { useState } from "react";
import { Icon } from "@iconify/react";
import {
  Button,
  Input,
  Textarea,
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@shimokitan/ui";
import { toast } from "sonner";
import { useParams } from "next/navigation";
import { getDictionary, Locale, ENTITY_TYPES } from "@shimokitan/utils";
import { submitRegistryApplication } from "../actions";

/**
 * Artist Registry Multi-step Form.
 * Handles artist application submission with IP-based rate limiting.
 */
export function RegistryForm() {
  const params = useParams();
  const locale = (params?.locale as Locale) || "en";
  const dict = getDictionary(locale);

  const [step, setStep] = useState(1);
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [referenceId, setReferenceId] = useState("");

  // Form State
  const [artistName, setArtistName] = useState("");
  const [artistType, setArtistType] = useState<typeof ENTITY_TYPES[number]>("independent");
  const [professionalTitle, setProfessionalTitle] = useState("");
  const [why, setWhy] = useState("");
  const [email, setEmail] = useState("");
  const [socialLinks, setSocialLinks] = useState<Array<{ platform: string; url: string }>>([{ platform: "x", url: "" }]);
  const [artifactSamples, setArtifactSamples] = useState<Array<{ title: string; url: string; description: string }>>([{ title: "", url: "", description: "" }]);

  const addSocialLink = () => {
    setSocialLinks([...socialLinks, { platform: "x", url: "" }]);
  };

  const removeSocialLink = (index: number) => {
    setSocialLinks(socialLinks.filter((_, i) => i !== index));
  };

  const updateSocialLink = (index: number, field: string, value: string) => {
    const updated = [...socialLinks];
    updated[index] = { ...updated[index], [field]: value };
    setSocialLinks(updated);
  };

  const addArtifactSample = () => {
    setArtifactSamples([...artifactSamples, { title: "", url: "", description: "" }]);
  };

  const removeArtifactSample = (index: number) => {
    setArtifactSamples(artifactSamples.filter((_, i) => i !== index));
  };

  const updateArtifactSample = (index: number, field: string, value: string) => {
    const updated = [...artifactSamples];
    updated[index] = { ...updated[index], [field]: value };
    setArtifactSamples(updated);
  };

  const handleSubmit = async () => {
    if (!email) {
      toast.error(dict.common.error);
      return;
    }

    setSubmitting(true);

    try {
      const result = await submitRegistryApplication({
        contactEmail: email,
        artistMetadata: {
          name: artistName,
          professionalTitle: professionalTitle,
          why: why,
          type: artistType,
        },
        socialLinks: socialLinks.filter(l => l.url),
        artifactSamples: artifactSamples.filter(s => s.url),
      });

      if (result.success && result.data) {
        setSubmitted(true);
        setReferenceId(result.data.id);
        toast.success(dict.registry.success_title);
      } else {
        toast.error(result.error || dict.common.error);
        if (result.error === "RATE_LIMIT_EXCEEDED") {
          toast.error(dict.registry.error_rate_limit);
        }
      }
    } catch (error) {
      console.error("Submission failed:", error);
      toast.error(dict.common.error);
    } finally {
      setSubmitting(false);
    }
  };

  const nextStep = () => {
    if (step === 1) {
      if (!artistName) {
        toast.error(dict.registry.form_artist_name + " is required");
        return;
      }
      if (!professionalTitle) {
        toast.error(dict.registry.form_professional_title + " is required");
        return;
      }
      if (why.length < 10) {
        toast.error(dict.registry.form_why + " must be at least 10 characters");
        return;
      }
    }
    
    if (step === 2) {
      const hasValidSocial = socialLinks.some(l => l.url && l.url.startsWith('http'));
      if (!hasValidSocial) {
        toast.error(dict.registry.step_02_desc);
        return;
      }
    }

    if (step === 3) {
      const hasValidArtifact = artifactSamples.some(s => s.url && s.url.startsWith('http'));
      if (!hasValidArtifact) {
        toast.error(dict.registry.step_03_desc);
        return;
      }
    }

    setStep(step + 1);
  };

  const prevStep = () => setStep(step - 1);

  if (submitted) {
    return (
      <div className="flex flex-col items-center justify-center text-center space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500 py-10">
        <div className="w-20 h-20 bg-emerald-500/10 rounded-full flex items-center justify-center border border-emerald-500/20 mb-4 shadow-[0_0_30px_rgba(16,185,129,0.1)]">
          <Icon icon="lucide:check" className="text-emerald-500 w-10 h-10" />
        </div>
        <div className="space-y-2">
          <h3 className="text-3xl font-black italic tracking-tighter text-white">
            {dict.registry.success_title}
          </h3>
          <p className="text-zinc-400 max-w-sm mx-auto">
            {dict.registry.success_desc}
          </p>
        </div>
        
        <div className="bg-zinc-900/80 border border-zinc-800 rounded-lg p-4 w-full max-w-xs space-y-1">
          <p className="text-[10px] font-mono uppercase tracking-[0.2em] text-zinc-500">
            {dict.registry.reference_id}
          </p>
          <p className="font-mono text-violet-400 text-lg">
            {referenceId}
          </p>
        </div>

        <p className="text-xs text-zinc-500 italic max-w-xs">
          {dict.registry.wait_period}
        </p>

        <Button
          variant="ghost"
          onClick={() => window.location.href = `/${locale}`}
          className="mt-4 font-mono uppercase tracking-widest text-zinc-400 hover:text-white"
        >
          {dict.common.back_to_home}
        </Button>
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto w-full space-y-8 px-4">
      {/* Progress Bar */}
      <div className="flex gap-2 max-w-md mx-auto">
        {[1, 2, 3, 4].map((s) => (
          <div
            key={s}
            className={`h-1 flex-1 rounded-full transition-all duration-300 ${
              s <= step ? "bg-violet-600 shadow-[0_0_10px_rgba(124,58,237,0.5)]" : "bg-zinc-800"
            }`}
          />
        ))}
      </div>

      <div className="space-y-8 animate-in fade-in slide-in-from-right-4 duration-300">
        <div className="space-y-1 text-center">
          <h3 className="text-xl font-black italic tracking-tighter text-white uppercase">
            {dict.registry[`step_0${step}_title` as keyof typeof dict.registry] as string}
          </h3>
          <p className="text-sm text-center px-4 py-2 bg-violet-500/10 border border-violet-500/20 rounded text-violet-300 font-medium inline-block mx-auto">
            {dict.registry[`step_0${step}_desc` as keyof typeof dict.registry] as string}
          </p>
        </div>

        {/* Step 1: Identity */}
        {step === 1 && (
          <div className="space-y-8 max-w-md mx-auto">
            <div className="space-y-6">
              <div className="space-y-2 text-center">
                <label className="text-xs font-mono uppercase tracking-[0.2em] text-zinc-400 font-bold block">
                  {dict.registry.form_artist_name}
                </label>
                <Input
                  placeholder="SHIMON OKITAN"
                  value={artistName}
                  onChange={(e) => setArtistName(e.target.value)}
                  className="bg-zinc-900/50 border-zinc-800 focus:border-violet-500/50 h-14 text-center text-lg font-bold"
                />
              </div>
              <div className="space-y-2 text-center">
                <label className="text-xs font-mono uppercase tracking-[0.2em] text-zinc-400 font-bold block">
                  {dict.registry.form_professional_title}
                </label>
                <Input
                  placeholder="Vsinger / Composer"
                  value={professionalTitle}
                  onChange={(e) => setProfessionalTitle(e.target.value)}
                  className="bg-zinc-900/50 border-zinc-800 focus:border-violet-500/50 h-14 text-center text-lg font-bold"
                />
              </div>
            </div>

            <div className="space-y-2 text-center">
              <label className="text-xs font-mono uppercase tracking-[0.2em] text-zinc-400 font-bold block">
                {dict.registry.form_artist_type}
              </label>
              <Select value={artistType} onValueChange={(v: any) => setArtistType(v)}>
                <SelectTrigger className="bg-zinc-900/50 border-zinc-800 h-12 text-zinc-300 justify-center font-mono">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="bg-zinc-950 border-zinc-800 text-zinc-300">
                  {ENTITY_TYPES.map((type) => (
                    <SelectItem key={type} value={type} className="capitalize justify-center">
                      {type}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            
            <div className="space-y-2 text-center">
              <label className="text-xs font-mono uppercase tracking-[0.2em] text-zinc-400 font-bold block">
                {dict.registry.form_why}
              </label>
              <Textarea
                placeholder="..."
                value={why}
                onChange={(e) => setWhy(e.target.value)}
                className="bg-zinc-900/50 border-zinc-800 focus:border-violet-500/50 min-h-[140px] resize-none text-zinc-300 text-center p-6"
              />
            </div>
          </div>
        )}

        {/* Step 2: Socials */}
        {step === 2 && (
          <div className="space-y-4 max-w-lg mx-auto">
            {socialLinks.map((link, i) => (
              <div key={i} className="flex flex-col gap-4 items-center group bg-zinc-900/30 border border-zinc-800 p-6 rounded-xl relative">
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => removeSocialLink(i)}
                  className="absolute top-2 right-2 text-zinc-600 hover:text-red-500 shrink-0"
                  disabled={socialLinks.length <= 1}
                >
                  <Icon icon="lucide:x" className="w-4 h-4" />
                </Button>

                <div className="w-full max-w-xs space-y-2">
                  <label className="text-[10px] font-mono uppercase text-zinc-500 font-bold block text-center">Platform</label>
                  <Select
                    value={["x", "facebook", "instagram"].includes(link.platform) ? link.platform : "other"}
                    onValueChange={(v: any) => updateSocialLink(i, "platform", v === "other" ? "" : v)}
                  >
                    <SelectTrigger className="bg-zinc-900/50 border-zinc-800 text-zinc-300 font-mono text-center">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent className="bg-zinc-950 border-zinc-800 text-zinc-300">
                      <SelectItem value="x">X / TWITTER</SelectItem>
                      <SelectItem value="facebook">FACEBOOK</SelectItem>
                      <SelectItem value="instagram">INSTAGRAM</SelectItem>
                      <SelectItem value="other">OTHERS</SelectItem>
                    </SelectContent>
                  </Select>
                  
                  {!["x", "facebook", "instagram"].includes(link.platform) && (
                    <Input
                      placeholder="Platform Name"
                      value={link.platform}
                      onChange={(e) => updateSocialLink(i, "platform", e.target.value)}
                      className="bg-zinc-950/50 border-zinc-800 h-9 text-[10px] font-mono uppercase text-center"
                    />
                  )}
                </div>

                <div className="w-full max-w-md space-y-2">
                  <label className="text-[10px] font-mono uppercase text-zinc-500 font-bold block text-center">Uplink URL</label>
                  <Input
                    placeholder="https://..."
                    value={link.url}
                    onChange={(e) => updateSocialLink(i, "url", e.target.value)}
                    className="bg-zinc-900/50 border-zinc-800 focus:border-violet-500/50 text-center"
                  />
                </div>
              </div>
            ))}
            <Button
              variant="outline"
              onClick={addSocialLink}
              className="w-full border-dashed border-zinc-800 hover:border-violet-500/50 hover:bg-violet-500/5 transition-all py-8 text-zinc-500 font-mono"
            >
              <Icon icon="lucide:plus" className="mr-2" />
              {dict.registry.add_social}
            </Button>
          </div>
        )}

        {/* Step 3: Artifacts */}
        {step === 3 && (
          <div className="grid grid-cols-1 gap-6">
            {artifactSamples.map((sample, i) => (
              <div key={i} className="space-y-4 p-6 bg-zinc-900/30 border border-zinc-800 rounded-xl relative group max-w-xl mx-auto w-full">
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => removeArtifactSample(i)}
                  className="absolute top-3 right-3 text-zinc-600 hover:text-red-500"
                  disabled={artifactSamples.length <= 1}
                >
                  <Icon icon="lucide:x" />
                </Button>
                
                <div className="space-y-2">
                  <label className="text-[10px] font-mono uppercase text-zinc-500 font-bold block text-center">Artifact Source URL</label>
                  <Input
                    placeholder="YouTube, SoundCloud, Niconico, Bilibili, etc."
                    value={sample.url}
                    onChange={(e) => updateArtifactSample(i, "url", e.target.value)}
                    className="bg-zinc-950/50 border-zinc-800 focus:border-violet-500/50 h-10 text-center"
                  />
                </div>

                <div className="grid grid-cols-1 gap-4 max-w-sm mx-auto w-full">
                  <div className="space-y-1">
                    <label className="text-[10px] font-mono uppercase text-zinc-500 text-center block">Title (Optional)</label>
                    <Input
                      placeholder="e.g. Lead Single"
                      value={sample.title}
                      onChange={(e) => updateArtifactSample(i, "title", e.target.value)}
                      className="bg-zinc-950/50 border-zinc-800 h-9 text-xs text-center"
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-[10px] font-mono uppercase text-zinc-500 text-center block">Context (Optional)</label>
                    <Input
                      placeholder="e.g. Original Song"
                      value={sample.description}
                      onChange={(e) => updateArtifactSample(i, "description", e.target.value)}
                      className="bg-zinc-950/50 border-zinc-800 h-9 text-xs text-center"
                    />
                  </div>
                </div>
              </div>
            ))}
            <Button
              variant="outline"
              onClick={addArtifactSample}
              className="w-full max-w-xl mx-auto border-dashed border-zinc-800 hover:border-violet-500/50 hover:bg-violet-500/5 transition-all py-8 text-zinc-500 font-mono"
            >
              <Icon icon="lucide:plus" className="mr-2" />
              {dict.registry.add_artifact}
            </Button>
          </div>
        )}

        {/* Step 4: Contact */}
        {step === 4 && (
          <div className="space-y-8 max-w-md mx-auto">
            <div className="space-y-4 text-center">
              <label className="text-xs font-mono uppercase tracking-[0.2em] text-zinc-400 font-bold block">
                {dict.registry.form_email}
              </label>
              <Input
                type="email"
                placeholder="artist@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="bg-zinc-900/50 border-zinc-800 focus:border-violet-500/50 h-14 text-center text-lg"
              />
            </div>
            
            <div className="p-6 bg-violet-500/5 border border-violet-500/20 rounded-xl space-y-4 shadow-[0_0_20px_rgba(139,92,246,0.05)]">
              <div className="flex gap-4">
                <div className="w-10 h-10 rounded-full bg-violet-500/10 flex items-center justify-center shrink-0 border border-violet-500/20">
                  <Icon icon="lucide:shield-check" className="text-violet-500 w-5 h-5" />
                </div>
                <div className="space-y-2 text-left">
                  <h4 className="text-[10px] font-black uppercase tracking-[0.2em] text-violet-400 font-mono">Security & Privacy</h4>
                  <p className="text-xs text-zinc-300 leading-relaxed font-medium">
                    {dict.registry.data_collection_warning.split("{{privacy_link}}").map((part, i, arr) => (
                      <React.Fragment key={i}>
                        {part}
                        {i < arr.length - 1 && (
                          <a 
                            href={`/${locale}/privacy`} 
                            target="_blank" 
                            className="text-white hover:text-violet-400 underline decoration-violet-500/50 underline-offset-4 transition-all font-bold"
                          >
                            {dict.registry.privacy_policy}
                          </a>
                        )}
                      </React.Fragment>
                    ))}
                  </p>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Navigation Buttons */}
        <div className="flex flex-col gap-3 pt-8 border-t border-zinc-900 max-w-md mx-auto w-full">
          {step > 1 && (
            <Button
              variant="ghost"
              onClick={prevStep}
              className="w-full font-mono uppercase tracking-widest text-zinc-500 hover:text-white"
            >
              Back
            </Button>
          )}
          {step < 4 ? (
            <Button
              onClick={nextStep}
              className="flex-[2] h-14 bg-violet-600 hover:bg-violet-500 text-white font-black italic tracking-tighter uppercase transition-all shadow-[0_4px_20px_rgba(124,58,237,0.3)]"
            >
              Next Step
              <Icon icon="lucide:arrow-right" className="ml-2" />
            </Button>
          ) : (
            <Button
              onClick={handleSubmit}
              disabled={submitting}
              className="flex-[2] h-14 bg-emerald-600 hover:bg-emerald-500 text-white font-black italic tracking-tighter uppercase transition-all shadow-[0_4px_20px_rgba(16,185,129,0.3)]"
            >
              {submitting ? (
                <>
                  <Icon icon="lucide:loader-2" className="animate-spin mr-2" />
                  {dict.registry.transmitting}
                </>
              ) : (
                <>
                  {dict.registry.submit_application}
                  <Icon icon="lucide:send" className="ml-2 shrink-0" />
                </>
              )}
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}
