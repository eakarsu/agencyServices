"use client";

import FeatureReportWorkspace from "../../components/FeatureReportWorkspace";

export default function AdvisoryReportPage() {
  return <FeatureReportWorkspace title={"AI candidate scoring or suitability ranking from resumes advisory report"} apiPath={"/api/gap-ai-candidate-scoring-suitability-ranking/run"}/>;
}
