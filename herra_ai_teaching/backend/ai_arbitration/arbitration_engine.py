from backend.ai_trust.trust_engine import trust_engine


class ArbitrationEngine:
    """
    Simple, deterministic arbitration engine
    """

    def arbitrate(self, results: list) -> dict:
        score = 0

        for r in results:
            platform = r.get("platform")
            status = r.get("status")

            if status == "learned":
                trust_engine.reward(platform)
                score += 1
            else:
                trust_engine.penalize(platform)
                score -= 1

        return {
            "decision": "reinforced" if score > 0 else "penalized"
        }


# Singleton
arbitration_engine = ArbitrationEngine()
