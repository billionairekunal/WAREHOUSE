"use client";
import Image from "next/image";
import { useState } from "react";
import { ChevronLeft, ChevronRight, Images } from "lucide-react";
import { img } from "@/lib/data";
import { useT } from "@/lib/i18n/client";

export function Gallery({ photos, name, children }: { photos: string[]; name: string; children?: React.ReactNode }) {
  const [i, setI] = useState(0);
  const { t } = useT();
  const list = photos.length ? photos : [""];
  const go = (d: number) => setI((i + d + list.length) % list.length);

  return (
    <div>
      <div className="relative aspect-[4/5] overflow-hidden rounded-[2rem] bg-ice sm:aspect-[16/9]">
        <Image key={i} src={img(list[i], 1600)} alt={`${name}, photo ${i + 1} of ${list.length}`} fill priority sizes="(max-width:1024px) 100vw, 65vw" className="rise object-cover" />
        <div className="absolute inset-0 bg-gradient-to-t from-navy/85 via-navy/10 to-navy/20" />
        {list.length > 1 && (
          <>
            <button onClick={() => go(-1)} aria-label={t("d.prevPhoto")} className="glass absolute left-4 top-4 hidden size-11 place-items-center rounded-full sm:grid"><ChevronLeft className="size-5" /></button>
            <button onClick={() => go(1)} aria-label={t("d.nextPhoto")} className="glass absolute left-[4.25rem] top-4 hidden size-11 place-items-center rounded-full sm:grid"><ChevronRight className="size-5" /></button>
          </>
        )}
        <span className="glass-dark absolute right-4 top-4 inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-bold text-white">
          <Images className="size-3.5" /> {i + 1} / {list.length}
        </span>
        <div className="absolute inset-x-0 bottom-0 p-5 text-white sm:p-8">{children}</div>
      </div>
      {list.length > 1 && (
        <div className="mt-3 grid grid-cols-4 gap-2.5">
          {list.slice(0, 4).map((p, n) => {
            const more = n === 3 && list.length > 4;
            return (
              <button key={p + n} onClick={() => setI(more ? (i + 1) % list.length : n)} aria-label={more ? t("d.morePhotos", { n: list.length - 3 }) : t("d.photo", { n: n + 1, total: list.length })}
                className={`relative aspect-[4/3] overflow-hidden rounded-[1.2rem] border-[3px] transition ${n === i ? "border-brand" : "border-white hover:border-sky"}`}>
                <Image src={img(p, 300)} alt="" fill sizes="25vw" className="object-cover" />
                {more && <span className="display absolute inset-0 grid place-items-center bg-navy/60 text-xl font-black text-white">+{list.length - 3}</span>}
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}
