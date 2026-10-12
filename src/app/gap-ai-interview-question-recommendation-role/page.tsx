"use client";

import FeatureReportWorkspace from "../../components/FeatureReportWorkspace";

export default function AdvisoryReportPage() {
  return <FeatureReportWorkspace title={"AI interview question recommendation by role/seniority advisory report"} apiPath={"/api/gap-ai-interview-question-recommendation-role/run"}/>;
}
