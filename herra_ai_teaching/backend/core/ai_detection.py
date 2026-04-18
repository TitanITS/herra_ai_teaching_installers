def detect_ai_source(text: str):
    """
    Placeholder heuristic detector.
    Expand later with ML or external classifiers.
    """
    if "as an ai" in text.lower():
        return "likely_ai"
    return "unknown"
