import Image from "next/image";
import { BadgeCheck, FileSignature, Gauge } from "lucide-react";
import { img } from "@/lib/data";

const PHOTO = "https://images.unsplash.com/photo-1553413077-190dd305871c";

/** Phone: photo header with big title, form card overlapping it. Desktop: photo panel + form. */
export function AuthShell({ title, accent, sub, children }: { title: string; accent: string; sub: string; children: React.ReactNode }) {
  return (
    <main className="mx-auto grid max-w-7xl gap-6 pb-28 sm:px-6 sm:pt-6 lg:grid-cols-2 lg:pb-12">
      {/* photo panel */}
      <div className="relative -mt-[76px] h-[340px] overflow-hidden rounded-b-[2.5rem] sm:mt-0 sm:rounded-[2.5rem] lg:h-auto lg:min-h-[680px]">
        <Image src={img(PHOTO, 1400)} alt="" fill sizes="(max-width:1024px) 100vw, 50vw" className="object-cover" priority />
        <div className="absolute inset-0 bg-gradient-to-t from-navy via-navy/50 to-navy/10" />
        <div className="absolute inset-x-6 bottom-14 text-white sm:inset-x-8 lg:bottom-8">
          <h1 className="text-5xl font-black leading-[0.92] sm:text-6xl">{title}<br /><span className="hl">{accent}</span></h1>
          <p className="mt-3 max-w-sm text-ice/85">{sub}</p>
          <ul className="mt-6 hidden space-y-3 lg:block">
            {[[BadgeCheck, "Only physically verified listings"], [Gauge, "Compare true cost, not just rent"], [FileSignature, "Quotes, visits and agreements in one place"]].map(([I, t]) => {
              const Icon = I as typeof Gauge;
              return <li key={t as string} className="glass-dark flex items-center gap-3 rounded-2xl p-3 text-sm font-semibold"><span className="grid size-8 place-items-center rounded-xl bg-lime text-ink"><Icon className="size-4" /></span>{t as string}</li>;
            })}
          </ul>
        </div>
      </div>
      {/* form */}
      <div className="relative z-10 -mt-10 flex items-center justify-center px-4 sm:mt-0 sm:px-0">
        <div className="w-full max-w-lg rounded-[2rem] border border-white bg-white/95 p-6 shadow-[var(--shadow-lift)] backdrop-blur sm:p-10">
          {children}
        </div>
      </div>
    </main>
  );
}
