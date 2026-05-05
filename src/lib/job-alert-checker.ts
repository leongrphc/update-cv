import { prisma } from "@/lib/prisma";

interface ApifyJobItem {
  title?: string;
  companyName?: string;
  company?: string;
  location?: string;
  contractType?: string;
  employmentType?: string;
  jobType?: string;
  workType?: string;
  postedAt?: string;
  publishedAt?: string;
  url?: string;
  link?: string;
  jobUrl?: string;
  description?: string;
}

export async function checkJobAlerts() {
  const apiToken = process.env.APIFY_API_TOKEN;
  if (!apiToken) {
    throw new Error("APIFY_API_TOKEN not configured");
  }

  const activeAlerts = await prisma.jobAlert.findMany({
    where: { isActive: true },
    include: { user: { select: { id: true } } },
  });

  if (activeAlerts.length === 0) return { checked: 0, newMatches: 0 };

  let totalNewMatches = 0;

  for (const alert of activeAlerts) {
    try {
      const params = new URLSearchParams();
      params.set("keywords", alert.keywords);
      if (alert.location) params.set("location", alert.location);

      const jobTypeMap: Record<string, string> = {
        "full-time": "F",
        "part-time": "P",
        "contract": "C",
        "internship": "I",
      };
      if (alert.jobType && jobTypeMap[alert.jobType]) {
        params.set("f_JT", jobTypeMap[alert.jobType]);
      }

      const searchUrl = `https://www.linkedin.com/jobs/search/?${params.toString()}`;

      const response = await fetch(
        `https://api.apify.com/v2/acts/valig~linkedin-jobs-scraper/run-sync-get-dataset-items?token=${apiToken}`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            startUrls: [searchUrl],
            maxItems: 5,
          }),
        }
      );

      if (!response.ok) continue;

      const rawJobs: ApifyJobItem[] = await response.json();

      // Get existing notification job URLs to avoid duplicates
      const existingNotifications = await prisma.notification.findMany({
        where: { userId: alert.userId, jobAlertId: alert.id },
        select: { jobUrl: true },
      });
      const existingUrls = new Set(
        existingNotifications.map((n) => n.jobUrl).filter(Boolean)
      );

      const newJobs = rawJobs.filter((job) => {
        const jobUrl = job.url || job.link || job.jobUrl || "";
        return jobUrl && !existingUrls.has(jobUrl);
      });

      if (newJobs.length > 0) {
        await prisma.notification.createMany({
          data: newJobs.map((job) => ({
            userId: alert.userId,
            jobAlertId: alert.id,
            type: "job_match",
            title: job.title || "Yeni İş İlanı",
            message: `${job.companyName || job.company || "Şirket"} - ${job.location || "Konum belirtilmemiş"}`,
            jobUrl: job.url || job.link || job.jobUrl || null,
          })),
        });
        totalNewMatches += newJobs.length;
      }

      await prisma.jobAlert.update({
        where: { id: alert.id },
        data: { lastChecked: new Date() },
      });
    } catch {
      // Continue with next alert on individual failure
    }
  }

  return { checked: activeAlerts.length, newMatches: totalNewMatches };
}
