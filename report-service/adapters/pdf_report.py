class PdfReportAdapter:
    def __init__(self):
        pass

    def generate(self, portfolio, pdf_path):
        # Minimal no-op PDF placeholder to satisfy hexagonal wiring in tests.
        # The actual PDF generation is handled by the Python CLI (generator.py).
        with open(pdf_path, 'wb') as f:
            f.write(b"%PDF-1.4\n%")
        return pdf_path
