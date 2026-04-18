export type AiProfileIdentity = {
    key: string;
    label: string;
    shortLabel: string;
    providerKey: string;
    providerLabel: string;
    modelKey: string;
    modelLabel: string;
    description: string;
    isCommon: boolean;
};

export const AI_PROFILE_IDENTITIES: AiProfileIdentity[] = [
    {
        key: "compliance_ai",
        label: "Compliance AI",
        shortLabel: "Compliance AI",
        providerKey: "anthropic",
        providerLabel: "Anthropic",
        modelKey: "claude-3.7-sonnet",
        modelLabel: "Claude 3.7 Sonnet",
        description: "Policy-heavy review and regulated workflow support.",
        isCommon: false,
    },
    {
        key: "executive_briefing_ai",
        label: "Executive Briefing AI",
        shortLabel: "Executive AI",
        providerKey: "openai",
        providerLabel: "OpenAI",
        modelKey: "gpt-4.1",
        modelLabel: "GPT-4.1",
        description: "High-level summaries, decisions, and briefing support.",
        isCommon: false,
    },
    {
        key: "finance_ai",
        label: "Finance AI",
        shortLabel: "Finance AI",
        providerKey: "openai",
        providerLabel: "OpenAI",
        modelKey: "gpt-4.1",
        modelLabel: "GPT-4.1",
        description: "Financial analysis, reporting, and forecasting support.",
        isCommon: true,
    },
    {
        key: "hr_ai",
        label: "HR AI",
        shortLabel: "HR AI",
        providerKey: "openai",
        providerLabel: "OpenAI",
        modelKey: "gpt-4o-mini",
        modelLabel: "GPT-4o Mini",
        description: "People operations, onboarding, and policy Q&A.",
        isCommon: true,
    },
    {
        key: "knowledge_base_ai",
        label: "Knowledge Base AI",
        shortLabel: "Knowledge AI",
        providerKey: "local_llm",
        providerLabel: "Local LLM",
        modelKey: "ollama-llama3",
        modelLabel: "Ollama Llama 3",
        description: "Local document recall and internal knowledge assistance.",
        isCommon: false,
    },
    {
        key: "legal_ai",
        label: "Legal AI",
        shortLabel: "Legal AI",
        providerKey: "anthropic",
        providerLabel: "Anthropic",
        modelKey: "claude-3.7-sonnet",
        modelLabel: "Claude 3.7 Sonnet",
        description: "Clause analysis, policy review, and legal drafting support.",
        isCommon: true,
    },
    {
        key: "marketing_ai",
        label: "Marketing AI",
        shortLabel: "Marketing AI",
        providerKey: "google_gemini",
        providerLabel: "Google Gemini",
        modelKey: "gemini-1.5-flash",
        modelLabel: "Gemini 1.5 Flash",
        description: "Campaign ideation, brand copy, and content planning.",
        isCommon: true,
    },
    {
        key: "mock_test_ai",
        label: "Mock Test AI",
        shortLabel: "Mock Test AI",
        providerKey: "mock",
        providerLabel: "Mock / Local Adapter",
        modelKey: "mock-local-response",
        modelLabel: "Local Test Response",
        description: "Internal development and test-only AI profile.",
        isCommon: false,
    },
    {
        key: "operations_ai",
        label: "Operations AI",
        shortLabel: "Operations AI",
        providerKey: "azure_openai",
        providerLabel: "Azure OpenAI",
        modelKey: "azure-gpt-4o",
        modelLabel: "Azure GPT-4o",
        description: "Operational procedure guidance and process control support.",
        isCommon: true,
    },
    {
        key: "procurement_ai",
        label: "Procurement AI",
        shortLabel: "Procurement AI",
        providerKey: "openai",
        providerLabel: "OpenAI",
        modelKey: "gpt-4o-mini",
        modelLabel: "GPT-4o Mini",
        description: "Vendor comparison, quote analysis, and sourcing support.",
        isCommon: false,
    },
    {
        key: "research_ai",
        label: "Research AI",
        shortLabel: "Research AI",
        providerKey: "anthropic",
        providerLabel: "Anthropic",
        modelKey: "claude-3.5-sonnet",
        modelLabel: "Claude 3.5 Sonnet",
        description: "Deep reading, synthesis, and exploratory analysis support.",
        isCommon: true,
    },
    {
        key: "sales_ai",
        label: "Sales AI",
        shortLabel: "Sales AI",
        providerKey: "openai",
        providerLabel: "OpenAI",
        modelKey: "gpt-4o",
        modelLabel: "GPT-4o",
        description: "Pipeline summaries, opportunity coaching, and outbound drafting.",
        isCommon: true,
    },
    {
        key: "support_ai",
        label: "Support AI",
        shortLabel: "Support AI",
        providerKey: "openai",
        providerLabel: "OpenAI",
        modelKey: "gpt-4o-mini",
        modelLabel: "GPT-4o Mini",
        description: "Customer support response drafting and troubleshooting guidance.",
        isCommon: true,
    },
    {
        key: "training_ai",
        label: "Training AI",
        shortLabel: "Training AI",
        providerKey: "google_gemini",
        providerLabel: "Google Gemini",
        modelKey: "gemini-1.5-pro",
        modelLabel: "Gemini 1.5 Pro",
        description: "Teaching content support, training workflows, and instructional guidance.",
        isCommon: true,
    },
];

const PROVIDER_FALLBACKS: Record<string, AiProfileIdentity> = {
    anthropic: AI_PROFILE_IDENTITIES.find((item) => item.key === "research_ai")!,
    azure_openai: AI_PROFILE_IDENTITIES.find((item) => item.key === "operations_ai")!,
    google_gemini: AI_PROFILE_IDENTITIES.find((item) => item.key === "training_ai")!,
    local_llm: AI_PROFILE_IDENTITIES.find((item) => item.key === "knowledge_base_ai")!,
    mock: AI_PROFILE_IDENTITIES.find((item) => item.key === "mock_test_ai")!,
    openai: AI_PROFILE_IDENTITIES.find((item) => item.key === "sales_ai")!,
};

export function getAiProfileByKey(key: string): AiProfileIdentity | null {
    return AI_PROFILE_IDENTITIES.find((item) => item.key === key) ?? null;
}

export function resolveAiProfileIdentity(params: {
    activeSource?: string | null;
    providerKey?: string | null;
    modelKey?: string | null;
}): AiProfileIdentity {
    const providerKey = (params.providerKey || params.activeSource || "mock").trim() || "mock";
    const modelKey = (params.modelKey || "").trim();

    const exact = AI_PROFILE_IDENTITIES.find(
        (item) => item.providerKey === providerKey && item.modelKey === modelKey,
    );
    if (exact) return exact;

    const providerFallback = PROVIDER_FALLBACKS[providerKey];
    if (providerFallback) return providerFallback;

    return AI_PROFILE_IDENTITIES.find((item) => item.key === "mock_test_ai")!;
}

export function getCommonAiProfiles(currentKey?: string | null): AiProfileIdentity[] {
    return AI_PROFILE_IDENTITIES.filter((item) => item.isCommon && item.key !== currentKey).sort((a, b) =>
        a.label.localeCompare(b.label),
    );
}

export function getAlphabetizedAiProfiles(currentKey?: string | null): Record<string, AiProfileIdentity[]> {
    const grouped: Record<string, AiProfileIdentity[]> = {};

    for (const item of AI_PROFILE_IDENTITIES) {
        if (item.isCommon || item.key === currentKey) continue;
        const letter = item.label.charAt(0).toUpperCase();
        if (!grouped[letter]) grouped[letter] = [];
        grouped[letter].push(item);
    }

    for (const letter of Object.keys(grouped)) {
        grouped[letter].sort((a, b) => a.label.localeCompare(b.label));
    }

    return grouped;
}

export function searchAiProfiles(searchTerm: string, currentKey?: string | null): AiProfileIdentity[] {
    const normalized = searchTerm.trim().toLowerCase();
    if (!normalized) return [];

    return AI_PROFILE_IDENTITIES.filter((item) => {
        if (item.key === currentKey) return false;
        const haystack = [item.label, item.shortLabel, item.providerLabel, item.modelLabel, item.description]
            .join(" ")
            .toLowerCase();
        return haystack.includes(normalized);
    }).sort((a, b) => a.label.localeCompare(b.label));
}