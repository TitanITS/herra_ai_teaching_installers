from abc import ABC, abstractmethod




class BaseAIAdapter(ABC):
    @property
    @abstractmethod
    def platform(self) -> str:
        pass


    @abstractmethod
    def learn(self, text: str) -> dict:
        pass