"use client";

import FeatureReportWorkspace from "../../components/FeatureReportWorkspace";

export default function AdvisoryReportPage() {
  return <FeatureReportWorkspace title={"Multi-format resume parser (OCR + NLP) producing structured candidate data advisory report"} apiPath={"/api/cf-multi-format-resume-parser-ocr/run"}/>;
}
