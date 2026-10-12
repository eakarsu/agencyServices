"use client";

import FeatureReportWorkspace from "../../components/FeatureReportWorkspace";

export default function AdvisoryReportPage() {
  return <FeatureReportWorkspace title={"AI-powered candidate matching via vector embeddings of CVs vs. job specs advisory report"} apiPath={"/api/cf-ai-powered-candidate-matching-vector/run"}/>;
}
