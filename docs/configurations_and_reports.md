# User Settings & Python PDF Reports

Goal
- Replace the technology-centric configuration page with a user-centric Configuraciones page.
- Add profile management (nickname, email, password, language) and a Python-based PDF report generator for portfolios.

Backend changes (portfolio-manager)
- [MODIFY] User.java: add language field (ES/EN).
- [MODIFY] UserEntity.java: add language column.
- [NEW] UserGraphQLController.java: implement updateProfile mutation to handle nickname (username), email, and language.
- [NEW] UserGraphQLController.java: implement changePassword mutation.
- [NEW] ReportController.java: REST endpoint GET /api/reports/portfolio/{id} that triggers a Python script and returns the generated PDF.
- [NEW] Report Service (Python): [NEW] generator.py using ReportLab to generate a professional PDF showing portfolio performance, active positions, and recent transactions.

Frontend changes
- [MODIFY] sidebar.tsx: add a "Configuraciones" link to the side navigation.
- [MODIFY] settings/page.tsx: redesign with tabs for "Perfil", "Seguridad" and "Reportes"; forms for nickname, email and password; language toggle; button to download PDF; and a "Reparar Balance" button to repair orphaned locked funds.

New Python PDF generator
- File: report-service/generator.py
- Reads a portfolio JSON and writes a PDF using ReportLab.
- Script is invoked by the /api/reports/portfolio/{id} endpoint.

Tests and validation (high level)
- Settings: update profile info and verify persistence across refresh.
- Password: change password and verify login with the new password.
- Reports: download PDF and verify a valid PDF is produced containing portfolio data.

Notes
- Python dependencies: reportlab (see report-service/requirements.txt).
- The Python script expects input JSON structured from the Portfolio domain; the generator is designed to tolerate variations.
