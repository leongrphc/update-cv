"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import LinkedInUpload from "@/components/LinkedInUpload";
import LinkedInManualForm from "@/components/LinkedInManualForm";
import ProfileMergePreview from "@/components/ProfileMergePreview";
import FileUpload from "@/components/FileUpload";
import { LinkedInProfile, LinkedInMergeResult } from "@/types";

type Step = "upload" | "cv" | "merge";
type InputMode = "pdf" | "manual";

export default function LinkedInPage() {
  const router = useRouter();
  const [step, setStep] = useState<Step>("upload");
  const [inputMode, setInputMode] = useState<InputMode>("pdf");
  const [linkedInProfile, setLinkedInProfile] = useState<LinkedInProfile | null>(null);
  const [cvText, setCvText] = useState("");
  const [error, setError] = useState<string | null>(null);

  const handleProfileParsed = (profile: LinkedInProfile) => {
    setLinkedInProfile(profile);
    setStep("cv");
    setError(null);
  };

  const handleManualSubmit = (profile: LinkedInProfile) => {
    setLinkedInProfile(profile);
    setStep("cv");
    setError(null);
  };

  const handleCVUploaded = () => {
    if (cvText && linkedInProfile) {
      setStep("merge");
    }
  };

  const handleMergeComplete = (result: LinkedInMergeResult) => {
    // Store result in sessionStorage for result page
    sessionStorage.setItem("linkedinMergeResult", JSON.stringify(result));
    router.push("/linkedin/result");
  };

  return (
    <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-slate-900 dark:text-slate-100 mb-2">
            LinkedIn Profil Entegrasyonu
          </h1>
          <p className="text-slate-600 dark:text-slate-400">
            LinkedIn profilinizi CV&apos;nizle birleştirerek daha kapsamlı bir özgeçmiş oluşturun.
          </p>
        </div>

        {/* Progress Steps */}
        <div className="flex items-center gap-4 mb-8">
          <div className={`flex items-center gap-2 ${step === "upload" ? "text-blue-600 dark:text-blue-400" : "text-slate-400"}`}>
            <div className={`w-8 h-8 rounded-full flex items-center justify-center font-bold ${step === "upload" ? "bg-blue-600 text-white" : linkedInProfile ? "bg-green-500 text-white" : "bg-slate-200 dark:bg-slate-700"}`}>
              {linkedInProfile ? "✓" : "1"}
            </div>
            <span className="font-medium">LinkedIn</span>
          </div>
          <div className="flex-1 h-0.5 bg-slate-200 dark:bg-slate-700" />
          <div className={`flex items-center gap-2 ${step === "cv" ? "text-blue-600 dark:text-blue-400" : "text-slate-400"}`}>
            <div className={`w-8 h-8 rounded-full flex items-center justify-center font-bold ${step === "cv" ? "bg-blue-600 text-white" : cvText ? "bg-green-500 text-white" : "bg-slate-200 dark:bg-slate-700"}`}>
              {cvText ? "✓" : "2"}
            </div>
            <span className="font-medium">CV</span>
          </div>
          <div className="flex-1 h-0.5 bg-slate-200 dark:bg-slate-700" />
          <div className={`flex items-center gap-2 ${step === "merge" ? "text-blue-600 dark:text-blue-400" : "text-slate-400"}`}>
            <div className={`w-8 h-8 rounded-full flex items-center justify-center font-bold ${step === "merge" ? "bg-blue-600 text-white" : "bg-slate-200 dark:bg-slate-700"}`}>
              3
            </div>
            <span className="font-medium">Birleştir</span>
          </div>
        </div>

        {error && (
          <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 text-red-700 dark:text-red-400 px-4 py-3 rounded-sm mb-6">
            {error}
          </div>
        )}

        {/* Step 1: LinkedIn Profile */}
        {step === "upload" && (
          <div className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-sm p-6">
            <h2 className="text-lg font-semibold text-slate-900 dark:text-slate-100 mb-4">
              LinkedIn Profilinizi Ekleyin
            </h2>

            {/* Mode Toggle */}
            <div className="flex gap-2 mb-6">
              <button
                onClick={() => setInputMode("pdf")}
                className={`flex-1 py-2 px-4 rounded-sm font-medium transition-colors ${
                  inputMode === "pdf"
                    ? "bg-blue-600 text-white"
                    : "bg-slate-100 dark:bg-slate-700 text-slate-700 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-600"
                }`}
              >
                PDF Yükle
              </button>
              <button
                onClick={() => setInputMode("manual")}
                className={`flex-1 py-2 px-4 rounded-sm font-medium transition-colors ${
                  inputMode === "manual"
                    ? "bg-blue-600 text-white"
                    : "bg-slate-100 dark:bg-slate-700 text-slate-700 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-600"
                }`}
              >
                Manuel Giriş
              </button>
            </div>

            {inputMode === "pdf" ? (
              <LinkedInUpload
                onProfileParsed={handleProfileParsed}
                onError={setError}
              />
            ) : (
              <LinkedInManualForm
                onSubmit={handleManualSubmit}
                onCancel={() => setInputMode("pdf")}
              />
            )}
          </div>
        )}

        {/* Step 2: CV Upload */}
        {step === "cv" && (
          <div className="space-y-6">
            {/* LinkedIn Profile Summary */}
            <div className="bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-sm p-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-green-100 dark:bg-green-900/50 rounded-sm flex items-center justify-center">
                  <svg className="w-6 h-6 text-green-600 dark:text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                </div>
                <div>
                  <p className="font-medium text-green-800 dark:text-green-300">
                    LinkedIn profili yüklendi: {linkedInProfile?.fullName}
                  </p>
                  <p className="text-sm text-green-600 dark:text-green-400">
                    {linkedInProfile?.experience.length} deneyim, {linkedInProfile?.skills.length} beceri
                  </p>
                </div>
                <button
                  onClick={() => { setStep("upload"); setLinkedInProfile(null); }}
                  className="ml-auto text-sm text-green-700 dark:text-green-400 hover:underline"
                >
                  Değiştir
                </button>
              </div>
            </div>

            {/* CV Upload */}
            <div className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-sm p-6">
              <h2 className="text-lg font-semibold text-slate-900 dark:text-slate-100 mb-4">
                Mevcut CV&apos;nizi Yükleyin
              </h2>
              <FileUpload
                onTextExtracted={(text) => setCvText(text)}
                label="CV PDF'inizi sürükleyip bırakın"
              />
              {cvText && (
                <div className="mt-4 flex items-center justify-between">
                  <div className="flex items-center gap-2 text-green-600 dark:text-green-400">
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                    <span className="text-sm">CV yüklendi ({cvText.length} karakter)</span>
                  </div>
                  <button
                    onClick={handleCVUploaded}
                    className="px-6 py-2 bg-blue-600 text-white font-medium rounded-sm hover:bg-blue-700 transition-colors"
                  >
                    Devam Et
                  </button>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Step 3: Merge */}
        {step === "merge" && linkedInProfile && (
          <ProfileMergePreview
            cvText={cvText}
            linkedInProfile={linkedInProfile}
            onMerge={handleMergeComplete}
            onCancel={() => setStep("cv")}
          />
        )}

        {/* Info Box */}
        {step === "upload" && (
          <div className="mt-8 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-sm p-6">
            <h3 className="font-semibold text-blue-900 dark:text-blue-100 mb-3">
              Neden LinkedIn Entegrasyonu?
            </h3>
            <ul className="space-y-2 text-sm text-blue-800 dark:text-blue-200">
              <li className="flex items-start gap-2">
                <svg className="w-5 h-5 mt-0.5 text-blue-600 dark:text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
                LinkedIn profiliniz genellikle daha güncel bilgiler içerir
              </li>
              <li className="flex items-start gap-2">
                <svg className="w-5 h-5 mt-0.5 text-blue-600 dark:text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
                Beceriler ve onaylar otomatik olarak eklenir
              </li>
              <li className="flex items-start gap-2">
                <svg className="w-5 h-5 mt-0.5 text-blue-600 dark:text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
                Sertifikalar ve dil bilgileri tamamlanır
              </li>
              <li className="flex items-start gap-2">
                <svg className="w-5 h-5 mt-0.5 text-blue-600 dark:text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
                Çatışan bilgiler akıllıca çözülür
              </li>
            </ul>
          </div>
        )}
    </div>
  );
}
