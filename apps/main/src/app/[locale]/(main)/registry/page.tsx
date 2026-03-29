import { Metadata } from "next";
import { getDictionary, Locale } from "@shimokitan/utils";
import { RegistryForm } from "./components/RegistryForm";
import { MainLayout } from "@/components/layout/MainLayout";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
    const locale = (await params).locale as Locale;
    const dict = getDictionary(locale);

  return {
    title: `${dict.registry.title} // SHIMOKITAN`,
    description: dict.registry.description,
  };
}

export default async function RegistryPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
    const locale = (await params).locale as Locale;
    const dict = getDictionary(locale);

  return (
    <div className="w-full flex flex-col items-center justify-start py-20 px-4 relative z-10">
      <div className="w-full max-w-5xl mx-auto flex flex-col items-center">
        {/* Header */}
        <div className="mb-12 space-y-4 text-center flex flex-col items-center w-full">
          <h1 className="text-4xl md:text-6xl font-black italic tracking-tighter text-white uppercase leading-none">
            {dict.registry.title}
          </h1>
          <div className="h-1 w-20 bg-violet-600 mb-6" />
          <p className="text-zinc-400 text-lg leading-relaxed max-w-2xl font-medium mx-auto">
            {dict.registry.description}
          </p>
        </div>

        {/* Form Card */}
        <div className="bg-zinc-950/40 border border-zinc-800/50 backdrop-blur-2xl rounded-2xl p-6 md:p-12 relative overflow-hidden shadow-2xl w-full max-w-4xl mx-auto">
          <div className="absolute top-0 left-0 w-full h-[1px] bg-gradient-to-r from-transparent via-violet-500/30 to-transparent" />
          <div className="absolute inset-x-0 bottom-0 h-[1px] bg-gradient-to-r from-transparent via-emerald-500/10 to-transparent" />
          <RegistryForm />
        </div>
      </div>
    </div>
  );
}