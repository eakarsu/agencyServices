"use client";

import FeatureReportWorkspace from "../../components/FeatureReportWorkspace";

export default function AdvisoryReportPage() {
  return <FeatureReportWorkspace title={"ATS / job-board webhook bridge (BambooHR, Lever, Workday) with Slack notifications advisory report"} apiPath={"/api/cf-ats-job-board-webhook-bridge/run"}/>;
}
