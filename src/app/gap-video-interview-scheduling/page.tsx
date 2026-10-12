"use client";

import FeatureReportWorkspace from "../../components/FeatureReportWorkspace";

export default function AdvisoryReportPage() {
  return <FeatureReportWorkspace title={"video-interview scheduling advisory report"} apiPath={"/api/gap-video-interview-scheduling/run"}/>;
}
