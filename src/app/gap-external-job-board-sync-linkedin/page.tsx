"use client";

import FeatureReportWorkspace from "../../components/FeatureReportWorkspace";

export default function AdvisoryReportPage() {
  return <FeatureReportWorkspace title={"external job-board sync (LinkedIn, Indeed, ZipRecruiter) advisory report"} apiPath={"/api/gap-external-job-board-sync-linkedin/run"}/>;
}
