from abc import ABC, abstractmethod

class ReportPort(ABC):
    @abstractmethod
    def generate(self, portfolio: dict, pdf_path: str) -> None:
        pass
