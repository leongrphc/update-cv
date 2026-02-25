"use client";

interface JobDescriptionInputProps {
  value: string;
  onChange: (value: string) => void;
  disabled?: boolean;
}

export function JobDescriptionInput({
  value,
  onChange,
  disabled,
}: JobDescriptionInputProps) {
  return (
    <div className="w-full">
      <textarea
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder="İş ilanının tam metnini buraya yapıştırın...

• Pozisyon gereksinimleri
• Aranan yetenekler
• Sorumluluklar
• Tercih edilen özellikler"
        className="input-base min-h-[200px] resize-y text-sm"
        disabled={disabled}
      />
      <p className="text-xs text-slate-400 dark:text-slate-500 mt-2">
        Daha iyi sonuçlar için iş ilanındaki tüm detayları ekleyin.
      </p>
    </div>
  );
}
