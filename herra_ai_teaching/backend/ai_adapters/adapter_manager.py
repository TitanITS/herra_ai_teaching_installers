from backend.ai_adapters.mock_adapter import MockAIAdapter




class AdapterManager:
    def __init__(self):
        self.adapters = []


    def register(self, adapter):
        self.adapters.append(adapter)


    def learn(self, text: str):
        return [adapter.learn(text) for adapter in self.adapters]




adapter_manager = AdapterManager()
adapter_manager.register(MockAIAdapter())