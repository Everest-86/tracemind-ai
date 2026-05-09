from __future__ import annotations

import sys
import tempfile
import unittest
from pathlib import Path

BACKEND_ROOT = Path(__file__).resolve().parents[1]

if str(BACKEND_ROOT) not in sys.path:
    sys.path.insert(0, str(BACKEND_ROOT))

from app import database
from app.main import health
from app.schemas import DomainType, GenerateQAPackageRequest, GenerateRequest, RiskLevel
from app.services.mock_generator import generate_outputs, generate_qa_package


class TraceMindBackendTests(unittest.TestCase):
    def test_health_endpoint_returns_ok(self) -> None:
        self.assertEqual(health(), {"status": "ok"})

    def test_generate_qa_package_returns_expected_sections(self) -> None:
        request = GenerateQAPackageRequest(
            requirement=(
                "The AI workflow assistant shall review inbound project requests, identify missing acceptance "
                "criteria, classify priority, route high-risk items to human review, generate a QA checklist, "
                "and save an audit trail with request reference, confidence score, final status, and reviewer "
                "handoff notes."
            ),
            domain=DomainType.workflow_automation,
            risk_level=RiskLevel.high,
        )

        response = generate_qa_package(request)

        self.assertGreaterEqual(len(response.test_cases), 5)
        self.assertGreaterEqual(len(response.edge_cases), 4)
        self.assertGreaterEqual(len(response.negative_tests), 4)
        self.assertGreaterEqual(len(response.traceability_matrix), 5)
        self.assertIn("workflow automation", response.audit_summary.lower())

    def test_save_and_list_analysis_uses_sqlite_history(self) -> None:
        original_db_path = database.DB_PATH

        try:
            with tempfile.TemporaryDirectory() as temp_dir:
                database.DB_PATH = Path(temp_dir) / "tracemind-test.db"
                database.init_db()

                request = GenerateRequest(
                    product_name="TraceMind AI",
                    domain_context="workflow automation",
                    requirement_text=(
                        "The workflow assistant shall classify inbound requests, identify missing acceptance "
                        "criteria, and generate structured QA outputs for reviewer follow-up."
                    ),
                )
                outputs = generate_outputs(request)
                saved = database.save_analysis(request, outputs)
                items = database.list_analyses(limit=5)

                self.assertIsNotNone(saved.id)
                self.assertEqual(len(items), 1)
                self.assertEqual(items[0].id, saved.id)
                self.assertEqual(items[0].requirement_reference, outputs.requirement_reference)
        finally:
            database.DB_PATH = original_db_path


if __name__ == "__main__":
    unittest.main()
