from backend.storage.database import update_trust




class TrustEngine:
    def reward(self, platform: str):
        update_trust(platform, 1)


    def penalize(self, platform: str):
        update_trust(platform, -1)




trust_engine = TrustEngine()