"use client";

import FeatureReportWorkspace from "../../components/FeatureReportWorkspace";

export default function AdvisoryReportPage() {
  return <FeatureReportWorkspace title={"bulk email outreach templates advisory report"} apiPath={"/api/gap-bulk-email-outreach-templates/run"}/>;
}
