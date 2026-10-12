"use client";

import FeatureReportWorkspace from "../../components/FeatureReportWorkspace";

export default function AdvisoryReportPage() {
  return <FeatureReportWorkspace title={"workflow automation rules (no auto-stage advancement) advisory report"} apiPath={"/api/gap-workflow-automation-rules-auto-stage/run"}/>;
}
