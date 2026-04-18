from backend.ai_adapters.base_adapter import BaseAIAdapter




class MockAIAdapter(BaseAIAdapter):
    @property
    def platform(self) -> str:
        return "local"


    def learn(self, text: str) -> dict:
        return {"platform": self.platform, "status": "learned"}