import { useEffect, useMemo, useState } from "react";
import IngestListPage from "./pages/IngestListPage";
import AutoDetectPage from "./pages/AutoDetectPage";
import SystemAuditPage from "./pages/SystemAuditPage";
import SourcesPage from "./pages/SourcesPage";
import ChatPage from "./pages/ChatPage";
import SettingsPage from "./pages/SettingsPage";
import TitanShell from "./components/TitanShell";
import TitanButton from "./components/TitanButton";
import ConnectorStatusBanner from "./components/ConnectorStatusBanner";
import TitanCard from "./components/TitanCard";

type Tab = "ingest" | "auto" | "system" | "chat" | "sources" | "settings";

type LaunchContext = {
  source: string;
  deploymentId: string;
  deploymentCode: string;
  deploymentName: string;
  environmentType: string;
  region: string;
  customerAccountId: string;
  customerAccountName: string;
  customerUserEmail: string;
  customerUserName: string;
  tab: Tab | "";
};

function isTab(value: string | null): value is Tab {
  return value === "ingest" || value === "auto" || value === "system" || value === "chat" || value === "sources" || value === "settings";
}

function readLaunchContext(): LaunchContext {
  const params = new URLSearchParams(window.location.search);

  return {
    source: params.get("source") ?? "",
    deploymentId: params.get("deployment_id") ?? "",
    deploymentCode: params.get("deployment_code") ?? "",
    deploymentName: params.get("deployment_name") ?? "",
    environmentType: params.get("environment_type") ?? "",
    region: params.get("region") ?? "",
    customerAccountId: params.get("customer_account_id") ?? "",
    customerAccountName: params.get("customer_account_name") ?? "",
    customerUserEmail: params.get("customer_user_email") ?? "",
    customerUserName: params.get("customer_user_name") ?? "",
    tab: isTab(params.get("tab")) ? (params.get("tab") as Tab) : "",
  };
}

const deploymentMode = (import.meta.env.VITE_DEPLOYMENT_MODE ?? "saas").toLowerCase();
const isPrivateDeployment = deploymentMode === "private";

export default function App() {
  const launchContext = useMemo(() => readLaunchContext(), []);
  const [tab, setTab] = useState<Tab>(launchContext.tab || "ingest");

  useEffect(() => {
    if (launchContext.deploymentName) {
      document.title = `Herra AI Teaching • ${launchContext.deploymentName}`;
      return;
    }

    document.title = "Herra AI Teaching";
  }, [launchContext.deploymentName]);

  const launchedFromTitan = launchContext.source.toLowerCase() === "titan";
  const hasLaunchContext =
    launchedFromTitan &&
    Boolean(
      launchContext.deploymentName ||
      launchContext.deploymentCode ||
      launchContext.customerAccountName ||
      launchContext.customerUserEmail,
    );

  return (
    <TitanShell
      title="Herra AI Teaching"
      subtitle={isPrivateDeployment ? "Private deployment server" : "AI learning platform"}
      actions={
        <>
          <TitanButton
            variant="secondary"
            onClick={() => window.open("http://127.0.0.1:8001/docs", "_blank")}
          >
            API Docs
          </TitanButton>

          <TitanButton variant="primary" onClick={() => window.location.reload()}>
            Refresh
          </TitanButton>
        </>
      }
    >
      {hasLaunchContext ? (
        <div className="mb-5">
          <TitanCard
            title="Titan Launch Context"
            subtitle="This Herra session was opened from Titan and is using the deployment context below."
          >
            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2 text-sm">
                <div className="flex items-start justify-between gap-4">
                  <span className="text-titan-muted">Deployment</span>
                  <span className="text-right text-titan-text">{launchContext.deploymentName || "—"}</span>
                </div>

                <div className="flex items-start justify-between gap-4">
                  <span className="text-titan-muted">Deployment Code</span>
                  <span className="text-right text-titan-text">{launchContext.deploymentCode || "—"}</span>
                </div>

                <div className="flex items-start justify-between gap-4">
                  <span className="text-titan-muted">Environment</span>
                  <span className="text-right text-titan-text">{launchContext.environmentType || "—"}</span>
                </div>

                <div className="flex items-start justify-between gap-4">
                  <span className="text-titan-muted">Region</span>
                  <span className="text-right text-titan-text">{launchContext.region || "—"}</span>
                </div>
              </div>

              <div className="space-y-2 text-sm">
                <div className="flex items-start justify-between gap-4">
                  <span className="text-titan-muted">Customer Account</span>
                  <span className="text-right text-titan-text">{launchContext.customerAccountName || "—"}</span>
                </div>

                <div className="flex items-start justify-between gap-4">
                  <span className="text-titan-muted">Launched By</span>
                  <span className="text-right text-titan-text">
                    {launchContext.customerUserName || launchContext.customerUserEmail || "—"}
                  </span>
                </div>

                <div className="flex items-start justify-between gap-4">
                  <span className="text-titan-muted">Source</span>
                  <span className="text-right text-titan-text">Titan</span>
                </div>

                <div className="flex items-start justify-between gap-4">
                  <span className="text-titan-muted">Initial Tab</span>
                  <span className="text-right text-titan-text">{tab}</span>
                </div>
              </div>
            </div>
          </TitanCard>
        </div>
      ) : null}

      {!isPrivateDeployment ? (
        <div className="mt-2 flex justify-center">
          <div className="w-full max-w-3xl">
            <ConnectorStatusBanner compact />
          </div>
        </div>
      ) : null}

      <div className="mt-5 flex flex-wrap items-center gap-3">
        <TitanButton variant={tab === "ingest" ? "primary" : "secondary"} onClick={() => setTab("ingest")}>
          Ingest
        </TitanButton>

        <TitanButton variant={tab === "auto" ? "primary" : "secondary"} onClick={() => setTab("auto")}>
          Auto Detect
        </TitanButton>

        <TitanButton variant={tab === "system" ? "primary" : "secondary"} onClick={() => setTab("system")}>
          System
        </TitanButton>

        <TitanButton variant={tab === "sources" ? "primary" : "secondary"} onClick={() => setTab("sources")}>
          Sources
        </TitanButton>

        <TitanButton variant={tab === "chat" ? "primary" : "secondary"} onClick={() => setTab("chat")}>
          AI Chat
        </TitanButton>

        <TitanButton variant={tab === "settings" ? "primary" : "secondary"} onClick={() => setTab("settings")}>
          Settings
        </TitanButton>
      </div>

      <div className="mt-6">
        {tab === "ingest" && <IngestListPage />}
        {tab === "auto" && <AutoDetectPage />}
        {tab === "system" && <SystemAuditPage />}
        {tab === "sources" && <SourcesPage />}
        {tab === "chat" && <ChatPage />}
        {tab === "settings" && <SettingsPage />}
      </div>
    </TitanShell>
  );
}