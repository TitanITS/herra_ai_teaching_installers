import { useEffect, useMemo, useState } from "react";
import { connectorsApi } from "../features/connectors/connectorsApi";
import type { Connector } from "../features/connectors/connectorsTypes";
import { StatusPill } from "./StatusPill";

type OpsState = {
    checked: boolean;
    online: boolean;
    connectors: Connector[];
    requestId?: string;
};

function fmtWhen(s?: string) {
    if (!s) return "—";
    const d = new Date(s);
    if (Number.isNaN(d.getTime())) return s;
    return d.toLocaleString();
}

type Props = {
    compact?: boolean;
};

export default function ConnectorStatusBanner({ compact = false }: Props) {
    const [ops, setOps] = useState<OpsState>({
        checked: false,
        online: false,
        connectors: [],
    });

    useEffect(() => {
        let cancelled = false;

        async function refresh() {
            try {
                const res = await connectorsApi.status();
                if (cancelled) return;

                const connectors = res.success ? res.data.connectors || [] : [];
                setOps({
                    checked: true,
                    online: connectors.length > 0,
                    connectors,
                    requestId: res.meta?.request_id,
                });
            } catch {
                if (cancelled) return;
                setOps({
                    checked: true,
                    online: false,
                    connectors: [],
                });
            }
        }

        void refresh();
        const timer = setInterval(refresh, 3000);

        return () => {
            cancelled = true;
            clearInterval(timer);
        };
    }, []);

    const primaryConnector = useMemo(() => ops.connectors[0] ?? null, [ops.connectors]);

    return (
        <div
            className={[
                "rounded-2xl border border-white/10 bg-black/20",
                compact ? "px-4 py-3" : "px-5 py-4",
            ].join(" ")}
        >
            <div className="flex flex-wrap items-center justify-between gap-3">
                <div className="min-w-0">
                    <div className="text-sm font-semibold text-white">Connector Status</div>
                    {primaryConnector ? (
                        <div className="mt-1 text-xs text-slate-300 break-words">
                            <span className="text-slate-400">Name:</span>{" "}
                            <span className="font-semibold text-white">{primaryConnector.name}</span>
                            <span className="mx-2 text-slate-500">•</span>
                            <span className="text-slate-400">Last seen:</span>{" "}
                            <span className="font-semibold text-white">{fmtWhen(primaryConnector.last_seen)}</span>
                        </div>
                    ) : (
                        <div className="mt-1 text-xs text-slate-300">
                            No connector is currently online.
                        </div>
                    )}
                </div>

                <StatusPill
                    label={ops.online ? "ONLINE" : ops.checked ? "OFFLINE" : "CHECKING"}
                    tone={ops.online ? "ok" : ops.checked ? "danger" : "info"}
                />
            </div>
        </div>
    );
}