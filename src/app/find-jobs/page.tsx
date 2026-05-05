"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import {
  Search,
  MapPin,
  Clock,
  Building2,
  ExternalLink,
  Target,
  Loader2,
  Briefcase,
  AlertCircle,
} from "lucide-react";
import { useTranslation } from "@/lib/i18n";

interface Job {
  id: string;
  title: string;
  company: string;
  location: string;
  jobType: string;
  postedAt: string;
  url: string;
  description: string;
  salary: string;
  experienceLevel: string;
  sector: string;
}

export default function FindJobsPage() {
  const router = useRouter();
  const { t } = useTranslation();
  const [keywords, setKeywords] = useState("");
  const [location, setLocation] = useState("");
  const [jobType, setJobType] = useState("");
  const [jobs, setJobs] = useState<Job[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [hasSearched, setHasSearched] = useState(false);

  const handleSearch = async () => {
    if (!keywords.trim()) return;

    setIsLoading(true);
    setError(null);
    setHasSearched(true);

    try {
      const res = await fetch("/api/find-jobs", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          keywords: keywords.trim(),
          location: location.trim() || undefined,
          jobType: jobType || undefined,
          limit: 15,
        }),
      });

      const data = await res.json();

      if (data.success) {
        setJobs(data.jobs);

        // Save search to database
        try {
          await fetch("/api/job-searches", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              keywords: keywords.trim(),
              location: location.trim() || null,
              jobType: jobType || null,
              jobs: data.jobs,
            }),
          });
        } catch {
          // Save failed silently - user might not be logged in
        }
      } else {
        setError(data.error || t.findJobs.errorFetchJobs);
      }
    } catch {
      setError(t.findJobs.errorConnection);
    } finally {
      setIsLoading(false);
    }
  };

  const handleOptimize = (job: Job) => {
    if (job.description) {
      sessionStorage.setItem("jobDescription", job.description);
      sessionStorage.setItem("jobTitle", job.title);
    }
    router.push("/optimize");
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") handleSearch();
  };

  return (
    <div className="max-w-6xl mx-auto">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-slate-900 dark:text-white">
          {t.findJobs.title}
        </h1>
        <p className="text-slate-500 dark:text-slate-400 mt-1">
          {t.findJobs.subtitle}
        </p>
      </div>

      {/* Search Bar */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-4 mb-6">
        <div className="flex flex-col sm:flex-row gap-3">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <input
              type="text"
              placeholder={t.findJobs.keywordPlaceholder}
              value={keywords}
              onChange={(e) => setKeywords(e.target.value)}
              onKeyDown={handleKeyDown}
              className="w-full pl-10 pr-4 py-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-sm placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-slate-900/10 dark:focus:ring-white/10"
            />
          </div>
          <div className="relative flex-1">
            <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <input
              type="text"
              placeholder={t.findJobs.locationPlaceholder}
              value={location}
              onChange={(e) => setLocation(e.target.value)}
              onKeyDown={handleKeyDown}
              className="w-full pl-10 pr-4 py-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-sm placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-slate-900/10 dark:focus:ring-white/10"
            />
          </div>
          <select
            value={jobType}
            onChange={(e) => setJobType(e.target.value)}
            className="px-4 py-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-sm text-slate-700 dark:text-slate-300 focus:outline-none focus:ring-2 focus:ring-slate-900/10 dark:focus:ring-white/10"
          >
            <option value="">{t.findJobs.allTypes}</option>
            <option value="full-time">{t.findJobs.fullTime}</option>
            <option value="part-time">{t.findJobs.partTime}</option>
            <option value="contract">{t.findJobs.contract}</option>
            <option value="internship">{t.findJobs.internship}</option>
          </select>
          <button
            onClick={handleSearch}
            disabled={!keywords.trim() || isLoading}
            className="px-6 py-2.5 bg-slate-900 dark:bg-white text-white dark:text-slate-900 rounded-lg text-sm font-medium hover:bg-slate-800 dark:hover:bg-slate-100 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
          >
            {isLoading ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                {t.findJobs.searching}
              </>
            ) : (
              t.findJobs.search
            )}
          </button>
        </div>
      </div>

      {/* Error */}
      {error && (
        <div className="mb-6 p-4 bg-red-50 dark:bg-red-950/50 border border-red-200 dark:border-red-800/50 rounded-xl flex items-center gap-3">
          <AlertCircle className="w-5 h-5 text-red-500" />
          <p className="text-sm text-red-700 dark:text-red-400">{error}</p>
        </div>
      )}

      {/* Loading Skeleton */}
      {isLoading && (
        <div className="space-y-3">
          {[...Array(5)].map((_, i) => (
            <div
              key={i}
              className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-5 animate-pulse"
            >
              <div className="flex items-start gap-3">
                <div className="w-10 h-10 bg-slate-200 dark:bg-slate-700 rounded-lg" />
                <div className="flex-1 space-y-2">
                  <div className="h-4 bg-slate-200 dark:bg-slate-700 rounded w-1/3" />
                  <div className="h-3 bg-slate-200 dark:bg-slate-700 rounded w-1/4" />
                  <div className="h-3 bg-slate-200 dark:bg-slate-700 rounded w-1/2" />
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Job Listings */}
      {!isLoading && jobs.length > 0 && (
        <div className="space-y-3">
          {jobs.map((job) => (
            <div
              key={job.id}
              className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-5 hover:shadow-sm hover:border-slate-300 dark:hover:border-slate-700 transition-all"
            >
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-2">
                    <div className="w-10 h-10 bg-slate-100 dark:bg-slate-800 rounded-lg flex items-center justify-center">
                      <Building2 className="w-5 h-5 text-slate-500 dark:text-slate-400" />
                    </div>
                    <div>
                      <h3 className="text-base font-semibold text-slate-900 dark:text-white">
                        {job.title}
                      </h3>
                      <p className="text-sm text-slate-500 dark:text-slate-400">
                        {job.company}
                      </p>
                    </div>
                  </div>
                  <div className="flex flex-wrap items-center gap-3 mt-3">
                    <span className="flex items-center gap-1 text-xs text-slate-500 dark:text-slate-400">
                      <MapPin className="w-3 h-3" /> {job.location}
                    </span>
                    {job.jobType && (
                      <span className="flex items-center gap-1 text-xs text-slate-500 dark:text-slate-400">
                        <Briefcase className="w-3 h-3" /> {job.jobType}
                      </span>
                    )}
                    {job.postedAt && (
                      <span className="flex items-center gap-1 text-xs text-slate-500 dark:text-slate-400">
                        <Clock className="w-3 h-3" /> {job.postedAt}
                      </span>
                    )}
                    {job.salary && (
                      <span className="text-xs font-medium text-emerald-600 dark:text-emerald-400">
                        {job.salary}
                      </span>
                    )}
                    {job.experienceLevel && (
                      <span className="text-xs px-2 py-0.5 bg-slate-100 dark:bg-slate-800 rounded text-slate-600 dark:text-slate-400">
                        {job.experienceLevel}
                      </span>
                    )}
                  </div>
                </div>
                <div className="flex items-center gap-2 ml-4">
                  {job.description && (
                    <button
                      onClick={() => handleOptimize(job)}
                      className="flex items-center gap-1.5 px-3 py-2 text-sm font-medium bg-slate-900 dark:bg-white text-white dark:text-slate-900 rounded-lg hover:bg-slate-800 dark:hover:bg-slate-100 transition-colors"
                    >
                      <Target className="w-3.5 h-3.5" />
                      {t.findJobs.optimize}
                    </button>
                  )}
                  {job.url && (
                    <a
                      href={job.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="p-2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 transition-colors"
                      title={t.findJobs.viewOnLinkedIn}
                    >
                      <ExternalLink className="w-4 h-4" />
                    </a>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Empty State - After search */}
      {!isLoading && hasSearched && jobs.length === 0 && !error && (
        <div className="text-center p-12 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl">
          <Briefcase className="w-8 h-8 text-slate-300 dark:text-slate-600 mx-auto mb-3" />
          <p className="text-sm text-slate-500 dark:text-slate-400">
            {t.findJobs.noJobsFound}
          </p>
        </div>
      )}

      {/* Initial State - Before search */}
      {!isLoading && !hasSearched && (
        <div className="text-center p-12 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 border-dashed rounded-xl">
          <Search className="w-8 h-8 text-slate-300 dark:text-slate-600 mx-auto mb-3" />
          <h3 className="text-base font-semibold text-slate-900 dark:text-white mb-2">
            {t.findJobs.searchForJobs}
          </h3>
          <p className="text-sm text-slate-500 dark:text-slate-400 max-w-md mx-auto">
            {t.findJobs.searchForJobsDesc}
          </p>
        </div>
      )}
    </div>
  );
}
