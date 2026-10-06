"use client";

import { useCallback, useState } from "react";
import { useDropzone } from "react-dropzone";
import { Upload, FileText, X, Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";

interface FileUploadProps {
  onFileSelect?: (text: string) => void;
  onTextExtracted?: (text: string) => void;
  isLoading?: boolean;
  label?: string;
}

// Max file size: 5MB
const MAX_FILE_SIZE = 5 * 1024 * 1024;

export function FileUpload({ onFileSelect, onTextExtracted, isLoading, label }: FileUploadProps) {
  const handleTextExtracted = useCallback((text: string) => {
    if (onFileSelect) onFileSelect(text);
    if (onTextExtracted) onTextExtracted(text);
  }, [onFileSelect, onTextExtracted]);
  const [file, setFile] = useState<File | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [parsing, setParsing] = useState(false);

  const onDrop = useCallback(
    async (acceptedFiles: File[]) => {
      const selectedFile = acceptedFiles[0];
      if (!selectedFile) return;

      // Client-side validation
      if (selectedFile.type !== "application/pdf") {
        setError("Sadece PDF dosyaları kabul edilir");
        return;
      }

      if (selectedFile.size > MAX_FILE_SIZE) {
        setError("Dosya boyutu 5MB'dan küçük olmalı");
        return;
      }

      if (!selectedFile.name.toLowerCase().endsWith(".pdf")) {
        setError("Geçersiz dosya uzantısı");
        return;
      }

      setFile(selectedFile);
      setError(null);
      setParsing(true);

      try {
        const formData = new FormData();
        formData.append("file", selectedFile);

        const response = await fetch("/api/parse-pdf", {
          method: "POST",
          body: formData,
        });

        const data = await response.json();

        if (data.success) {
          handleTextExtracted(data.text);
        } else {
          setError(data.error || "PDF okunamadı");
          setFile(null);
        }
      } catch {
        setError("Dosya yüklenirken bir hata oluştu");
        setFile(null);
      } finally {
        setParsing(false);
      }
    },
    [handleTextExtracted]
  );

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: { "application/pdf": [".pdf"] },
    maxFiles: 1,
    disabled: isLoading || parsing,
  });

  const removeFile = () => {
    setFile(null);
    setError(null);
    handleTextExtracted("");
  };

  return (
    <div className="w-full">
      {!file ? (
        <div
          {...getRootProps()}
          className={cn(
            "border-2 border-dashed rounded-sm p-8 text-center cursor-pointer transition-all duration-200",
            isDragActive
              ? "border-slate-900 dark:border-slate-400 bg-slate-50 dark:bg-slate-800"
              : "border-slate-300 dark:border-slate-600 hover:border-slate-400 dark:hover:border-slate-500 hover:bg-slate-50 dark:hover:bg-slate-800/50",
            (isLoading || parsing) && "opacity-50 cursor-not-allowed"
          )}
        >
          <input {...getInputProps()} />
          <Upload className="w-10 h-10 mx-auto text-slate-400 dark:text-slate-500 mb-3" />
          <p className="text-slate-600 dark:text-slate-300 font-medium text-sm">
            {isDragActive
              ? "PDF dosyasını buraya bırakın"
              : label || "CV'nizi yüklemek için tıklayın veya sürükleyin"}
          </p>
          <p className="text-xs text-slate-400 dark:text-slate-500 mt-1.5">Sadece PDF dosyaları</p>
        </div>
      ) : (
        <div className="border border-slate-200 dark:border-slate-700 rounded-sm p-4 flex items-center justify-between bg-slate-50 dark:bg-slate-800/50">
          <div className="flex items-center gap-3">
            {parsing ? (
              <Loader2 className="w-8 h-8 text-slate-500 dark:text-slate-400 animate-spin" />
            ) : (
              <FileText className="w-8 h-8 text-slate-500 dark:text-slate-400" />
            )}
            <div>
              <p className="font-medium text-slate-700 dark:text-slate-200 text-sm">{file.name}</p>
              <p className="text-xs text-slate-400 dark:text-slate-500">
                {parsing ? "PDF okunuyor..." : "PDF başarıyla yüklendi"}
              </p>
            </div>
          </div>
          {!parsing && (
            <button
              onClick={removeFile}
              className="p-2 hover:bg-slate-200 dark:hover:bg-slate-700 rounded-sm transition-colors"
            >
              <X className="w-4 h-4 text-slate-500 dark:text-slate-400" />
            </button>
          )}
        </div>
      )}

      {error && (
        <p className="mt-3 text-sm text-red-600 dark:text-red-400 flex items-center gap-2">
          <span className="inline-block w-1.5 h-1.5 bg-red-500 rounded-full" />
          {error}
        </p>
      )}
    </div>
  );
}

export default FileUpload;
