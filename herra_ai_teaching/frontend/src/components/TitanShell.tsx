import * as React from "react";
import TitanBrandMark from "./TitanBrandMark";

type TitanShellProps = {
    title: string;
    subtitle?: string;
    actions?: React.ReactNode;
    children: React.ReactNode;
};

export default function TitanShell({ title, subtitle, actions, children }: TitanShellProps) {
    return (
        <div className="relative min-h-screen w-full overflow-hidden text-titan-text">
            <div className="pointer-events-none fixed inset-0 z-0">
                <div className="absolute inset-0 bg-[radial-gradient(circle_at_28%_10%,rgba(18,58,99,0.58),transparent_38%),radial-gradient(circle_at_86%_14%,rgba(103,183,255,0.12),transparent_26%),radial-gradient(circle_at_84%_78%,rgba(36,110,206,0.25),transparent_24%),linear-gradient(180deg,#060b14_0%,#07101a_48%,#060b14_100%)]" />
                <div className="absolute inset-0 opacity-[0.17] bg-[linear-gradient(180deg,rgba(255,255,255,0.03)_0%,rgba(255,255,255,0)_18%),linear-gradient(90deg,rgba(126,196,255,0.05)_0%,rgba(126,196,255,0)_18%,rgba(126,196,255,0.03)_46%,rgba(126,196,255,0)_72%)]" />
                <div className="absolute inset-0 bg-[radial-gradient(circle_at_80%_75%,rgba(103,183,255,0.22)_0%,rgba(103,183,255,0.08)_12%,transparent_30%)]" />
                <div className="absolute bottom-0 left-0 right-0 h-[28vh] bg-[linear-gradient(180deg,rgba(0,0,0,0)_0%,rgba(0,0,0,0.16)_35%,rgba(14,34,60,0.32)_100%)]" />
                <div className="absolute bottom-[12vh] left-[18%] h-px w-[36%] bg-gradient-to-r from-transparent via-[#67b7ff]/55 to-transparent blur-[0.6px]" />
                <div className="absolute bottom-[9vh] right-[8%] h-[26vh] w-[34vw] bg-[radial-gradient(circle_at_100%_100%,rgba(103,183,255,0.34),transparent_48%)]" />

                <div className="absolute inset-0 flex items-center justify-center">
                    <div className="relative flex items-center justify-center">
                        <div className="absolute h-[118vh] w-[118vh] rounded-full bg-[radial-gradient(circle,rgba(103,183,255,0.13)_0%,rgba(103,183,255,0.065)_22%,rgba(103,183,255,0.025)_42%,transparent_68%)] blur-3xl" />
                        <div className="absolute h-[96vh] w-[96vh] rounded-full bg-[radial-gradient(circle,rgba(31,111,235,0.11)_0%,rgba(31,111,235,0.05)_28%,transparent_62%)] blur-2xl" />

                        <div className="absolute -translate-x-[4%] -translate-y-[5%]">
                            <TitanBrandMark className="max-h-[172vh] max-w-[108vw] opacity-[0.16]" ghosted />
                        </div>
                    </div>
                </div>
            </div>

            <div className="relative z-10 w-full px-6 py-6">
                <header className="flex flex-col gap-6 md:flex-row md:items-start md:justify-between">
                    <div className="min-w-0">
                        <div className="flex items-start gap-6">
                            <div className="shrink-0 pt-1">
                                <TitanBrandMark className="h-[5.6rem] md:h-[6.6rem]" />
                            </div>

                            <div className="min-w-0 pt-1">
                                <div className="text-[3.4rem] leading-none font-extrabold tracking-[0.04em] text-white md:text-[5.2rem]">
                                    TITAN
                                </div>

                                <div className="mt-2 max-w-fit border-t border-white/20 pt-3 text-[1.02rem] uppercase tracking-[0.24em] text-slate-200 md:text-[1.34rem]">
                                    Information Technology Solutions
                                </div>
                            </div>
                        </div>

                        <div className="mt-6 min-w-0 space-y-1">
                            <h1 className="break-words text-3xl font-extrabold leading-tight md:text-4xl">
                                {title}
                            </h1>

                            {subtitle ? (
                                <div className="break-words text-sm text-titan-muted md:text-[0.95rem]">
                                    {subtitle}
                                </div>
                            ) : null}
                        </div>
                    </div>

                    {actions ? <div className="flex flex-wrap gap-3">{actions}</div> : null}
                </header>

                <main className="mt-6">{children}</main>

                <footer className="mt-10 border-t border-white/10 pt-6 text-xs text-titan-muted">
                    © {new Date().getFullYear()} Titan Information Technology Solutions • Herra AI Teaching
                </footer>
            </div>
        </div>
    );
}