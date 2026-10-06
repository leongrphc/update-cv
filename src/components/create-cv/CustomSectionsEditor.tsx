"use client";

import { ArrowDown, ArrowUp, Plus, Trash2 } from "lucide-react";
import type { CVCustomSection } from "@/types";

export default function CustomSectionsEditor({ data, onChange }: {
  data: CVCustomSection[]; onChange: (sections: CVCustomSection[]) => void;
}) {
  const update = (id: string, patch: Partial<CVCustomSection>) => onChange(data.map(section => section.id === id ? { ...section, ...patch } : section));
  const move = (index: number, direction: number) => {
    const reordered = [...data];
    [reordered[index], reordered[index + direction]] = [reordered[index + direction], reordered[index]];
    onChange(reordered);
  };
  return <section aria-labelledby="custom-sections-heading" className="mt-8 pt-6 border-t border-slate-200 dark:border-slate-700 space-y-5">
    <div className="flex flex-wrap items-start justify-between gap-3">
      <div><h3 id="custom-sections-heading" className="font-semibold">Özel bölümler</h3>
        <p className="text-sm text-slate-600 dark:text-slate-300 mt-1">Projeler, yayınlar, gönüllülük veya referanslar ekleyin. Bölümler aşağıdaki sırayla PDF’ye dahil edilir.</p></div>
      <button type="button" disabled={data.length >= 20} onClick={() => onChange([...data, { id: crypto.randomUUID(), title: "", content: "" }])} className="inline-flex items-center gap-2 text-sm text-blue-700 dark:text-blue-300 underline underline-offset-4 disabled:opacity-50"><Plus size={16} /> Bölüm ekle</button>
    </div>
    {data.map((section, index) => <div key={section.id} className="border border-slate-200 dark:border-slate-700 rounded-sm p-4 space-y-3">
      <div className="flex justify-between items-center gap-3"><span className="text-sm text-slate-600 dark:text-slate-300">Bölüm {index + 1}</span>
        <div className="flex gap-2">
          <button type="button" aria-label={`${index + 1}. bölümü yukarı taşı`} disabled={index === 0} onClick={() => move(index, -1)} className="p-2 disabled:opacity-40"><ArrowUp size={16} /></button>
          <button type="button" aria-label={`${index + 1}. bölümü aşağı taşı`} disabled={index === data.length - 1} onClick={() => move(index, 1)} className="p-2 disabled:opacity-40"><ArrowDown size={16} /></button>
          <button type="button" aria-label={`${index + 1}. bölümü kaldır`} onClick={() => onChange(data.filter(entry => entry.id !== section.id))} className="p-2 text-red-700 dark:text-red-300"><Trash2 size={16} /></button>
        </div>
      </div>
      <div><label htmlFor={`section-title-${section.id}`} className="block text-sm font-medium mb-1">Bölüm başlığı {index + 1}</label>
        <input id={`section-title-${section.id}`} value={section.title} maxLength={200} placeholder="Örn. Projeler" onChange={event => update(section.id, { title: event.target.value })} className="w-full px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-sm bg-white dark:bg-slate-800" /></div>
      <div><label htmlFor={`section-content-${section.id}`} className="block text-sm font-medium mb-1">Bölüm içeriği {index + 1}</label>
        <textarea id={`section-content-${section.id}`} value={section.content} maxLength={50_000} rows={6} placeholder="Başarılarınızı, açıklamaları ve bağlantıları yazın." onChange={event => update(section.id, { content: event.target.value })} className="w-full px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-sm bg-white dark:bg-slate-800 leading-relaxed" /></div>
    </div>)}
  </section>;
}
