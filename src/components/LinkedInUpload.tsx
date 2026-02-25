"use client";

import { useState, useCallback } from "react";
import { LinkedInProfile } from "@/types";

interface LinkedInUploadProps {
  onProfileParsed: (profile: LinkedInProfile) => void;
  onError: (error: string) => void;
}

export default function LinkedInUpload({ onProfileParsed, onError }: LinkedInUploadProps) {
  const [isDragging, setIsDragging] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [fileName, setFileName] = useState<string | null>(null);

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  }, []);

  const processFile = async (file: File) => {
    if (file.type !== "application/pdf") {
      onError("Lütfen PDF formatında bir dosya yükleyin");
      return;
    }

    setIsLoading(true);
    setFileName(file.name);

    try {
      // First, parse the PDF to get text
      const formData = new FormData();
      formData.append("file", file);

      const parseResponse = await fetch("/api/parse-pdf", {
        method: "POST",
        body: formData,
      });

      if (!parseResponse.ok) {
        throw new Error("PDF ayrıştırma hatası");
      }

      const parseResult = await parseResponse.json();

      // Then, parse LinkedIn profile from text
      const linkedInResponse = await fetch("/api/linkedin/parse", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ pdfText: parseResult.text }),
      });

      if (!linkedInResponse.ok) {
        throw new Error("LinkedIn profili ayrıştırma hatası");
      }

      const linkedInResult = await linkedInResponse.json();
      onProfileParsed(linkedInResult.profile);
    } catch (error) {
      onError(error instanceof Error ? error.message : "Bir hata oluştu");
    } finally {
      setIsLoading(false);
    }
  };

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);

    const file = e.dataTransfer.files[0];
    if (file) {
      processFile(file);
    }
  }, []);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      processFile(file);
    }
  };

  return (
    <div className="space-y-4">
      <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-sm p-4">
        <h4 className="font-medium text-blue-900 dark:text-blue-100 mb-2">
          LinkedIn PDF Nasıl İndirilir?
        </h4>
        <ol className="text-sm text-blue-800 dark:text-blue-200 space-y-1 list-decimal list-inside">
          <li>LinkedIn profilinize gidin</li>
          <li>&quot;Daha fazla&quot; butonuna tıklayın</li>
          <li>&quot;PDF olarak kaydet&quot; seçeneğini seçin</li>
          <li>İndirilen PDF&apos;i buraya yükleyin</li>
        </ol>
      </div>

      <div
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        className={`
          border-2 border-dashed rounded-sm p-8 text-center transition-colors cursor-pointer
          ${isDragging
            ? "border-blue-500 bg-blue-50 dark:bg-blue-900/20"
            : "border-slate-300 dark:border-slate-600 hover:border-slate-400 dark:hover:border-slate-500"
          }
          ${isLoading ? "opacity-50 pointer-events-none" : ""}
        `}
      >
        <input
          type="file"
          accept=".pdf"
          onChange={handleFileChange}
          className="hidden"
          id="linkedin-pdf-input"
          disabled={isLoading}
        />
        <label htmlFor="linkedin-pdf-input" className="cursor-pointer">
          {isLoading ? (
            <div className="space-y-2">
              <div className="animate-spin w-8 h-8 border-2 border-blue-500 border-t-transparent rounded-full mx-auto" />
              <p className="text-slate-600 dark:text-slate-400">
                LinkedIn profili ayrıştırılıyor...
              </p>
              {fileName && (
                <p className="text-sm text-slate-500 dark:text-slate-500">{fileName}</p>
              )}
            </div>
          ) : (
            <div className="space-y-2">
              <div className="w-12 h-12 mx-auto bg-blue-100 dark:bg-blue-900/30 rounded-sm flex items-center justify-center">
                <svg
                  className="w-6 h-6 text-blue-600 dark:text-blue-400"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12"
                  />
                </svg>
              </div>
              <p className="text-slate-700 dark:text-slate-300 font-medium">
                LinkedIn PDF&apos;inizi sürükleyip bırakın
              </p>
              <p className="text-sm text-slate-500 dark:text-slate-400">
                veya dosya seçmek için tıklayın
              </p>
            </div>
          )}
        </label>
      </div>
    </div>
  );
}
