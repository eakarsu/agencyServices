"use client";

import FeatureReportWorkspace from "../../components/FeatureReportWorkspace";

export default function AdvisoryReportPage() {
  return <FeatureReportWorkspace title={"background-check vendor integration advisory report"} apiPath={"/api/gap-background-check-vendor-integration/run"}/>;
}
