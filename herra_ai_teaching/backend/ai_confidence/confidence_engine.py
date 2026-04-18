from backend.storage.database import update_trust, log_audit

class ConfidenceEngine:

    @staticmethod
    def reward(platform: str):
        update_trust(platform, 1)
        log_audit("reward_trust", "system")

    @staticmethod
    def penalize(platform: str):
        update_trust(platform, -1)
        log_audit("penalize_trust", "system")
