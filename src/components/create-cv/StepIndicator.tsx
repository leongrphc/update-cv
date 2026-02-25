"use client";

interface Step {
  label: string;
  description: string;
}

const steps: Step[] = [
  { label: "Kişisel", description: "Kişisel Bilgiler" },
  { label: "Deneyim", description: "İş Deneyimi" },
  { label: "Eğitim", description: "Eğitim Bilgileri" },
  { label: "Beceriler", description: "Beceri & Diller" },
  { label: "Önizleme", description: "Şablon & İndir" },
];

interface StepIndicatorProps {
  currentStep: number;
}

export default function StepIndicator({ currentStep }: StepIndicatorProps) {
  return (
    <div className="flex items-center gap-2 mb-8">
      {steps.map((step, index) => {
        const isCompleted = index < currentStep;
        const isActive = index === currentStep;

        return (
          <div key={index} className="flex items-center gap-2 flex-1">
            <div className="flex items-center gap-2 min-w-0">
              <div
                className={`w-8 h-8 rounded-full flex items-center justify-center font-bold text-sm flex-shrink-0 transition-colors ${
                  isActive
                    ? "bg-blue-600 text-white"
                    : isCompleted
                    ? "bg-green-500 text-white"
                    : "bg-slate-200 dark:bg-slate-700 text-slate-500 dark:text-slate-400"
                }`}
              >
                {isCompleted ? "✓" : index + 1}
              </div>
              <div className="hidden sm:block min-w-0">
                <p
                  className={`text-sm font-medium truncate ${
                    isActive
                      ? "text-blue-600 dark:text-blue-400"
                      : isCompleted
                      ? "text-green-600 dark:text-green-400"
                      : "text-slate-400 dark:text-slate-500"
                  }`}
                >
                  {step.label}
                </p>
              </div>
            </div>
            {index < steps.length - 1 && (
              <div
                className={`flex-1 h-0.5 ${
                  isCompleted
                    ? "bg-green-500"
                    : "bg-slate-200 dark:bg-slate-700"
                }`}
              />
            )}
          </div>
        );
      })}
    </div>
  );
}
