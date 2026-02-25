import { NextRequest, NextResponse } from "next/server";

interface ApifyJobItem {
  title?: string;
  companyName?: string;
  company?: string;
  location?: string;
  jobType?: string;
  postedAt?: string;
  publishedAt?: string;
  url?: string;
  link?: string;
  jobUrl?: string;
  description?: string;
  salary?: string;
  applicationsCount?: string;
  contractType?: string;
  employmentType?: string;
  experienceLevel?: string;
  seniorityLevel?: string;
  workType?: string;
  sector?: string;
  industry?: string;
}

function buildLinkedInSearchUrl(
  keywords: string,
  location?: string,
  jobType?: string
): string {
  const params = new URLSearchParams();
  params.set("keywords", keywords);
  if (location) params.set("location", location);

  // LinkedIn job type filters
  const jobTypeMap: Record<string, string> = {
    "full-time": "F",
    "part-time": "P",
    "contract": "C",
    "internship": "I",
  };
  if (jobType && jobTypeMap[jobType]) {
    params.set("f_JT", jobTypeMap[jobType]);
  }

  return `https://www.linkedin.com/jobs/search/?${params.toString()}`;
}

export async function POST(request: NextRequest) {
  try {
    const { keywords, location, jobType, limit = 10 } = await request.json();

    if (!keywords) {
      return NextResponse.json(
        { success: false, error: "Anahtar kelime gerekli" },
        { status: 400 }
      );
    }

    const apiToken = process.env.APIFY_API_TOKEN;
    if (!apiToken) {
      return NextResponse.json(
        { success: false, error: "Apify API token yapılandırılmamış" },
        { status: 500 }
      );
    }

    const searchUrl = buildLinkedInSearchUrl(keywords, location, jobType);

    // Build Apify input with direct parameters so location actually works
    // The actor defaults to "New York" if location is not explicitly set
    const apifyInput: Record<string, unknown> = {
      startUrls: [searchUrl],
      maxItems: Math.min(limit, 25),
    };

    if (location) {
      apifyInput.location = location;
    }

    const response = await fetch(
      `https://api.apify.com/v2/acts/valig~linkedin-jobs-scraper/run-sync-get-dataset-items?token=${apiToken}`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(apifyInput),
      }
    );

    if (!response.ok) {
      const errorText = await response.text();
      console.error("Apify error:", errorText);
      return NextResponse.json(
        { success: false, error: "İş ilanları alınırken hata oluştu" },
        { status: 502 }
      );
    }

    const rawJobs: ApifyJobItem[] = await response.json();

    const jobs = rawJobs.map((job, index) => ({
      id: `job-${index}-${Date.now()}`,
      title: job.title || "Bilinmeyen Pozisyon",
      company: job.companyName || job.company || "Bilinmeyen Şirket",
      location: job.location || "Belirtilmemiş",
      jobType:
        job.contractType ||
        job.employmentType ||
        job.jobType ||
        job.workType ||
        "Belirtilmemiş",
      postedAt: job.postedAt || job.publishedAt || "",
      url: job.url || job.link || job.jobUrl || "",
      description: job.description || "",
      salary: job.salary || "",
      applicationsCount: job.applicationsCount || "",
      experienceLevel: job.experienceLevel || job.seniorityLevel || "",
      sector: job.sector || job.industry || "",
    }));

    return NextResponse.json({ success: true, jobs });
  } catch (error) {
    console.error("Find jobs error:", error);
    return NextResponse.json(
      { success: false, error: "İş ilanları aranırken hata oluştu" },
      { status: 500 }
    );
  }
}
