import os
import unittest
from unittest.mock import MagicMock, patch
import base64

import ai_service
from main import app
from fastapi.testclient import TestClient


class ImageAndCodeTests(unittest.TestCase):
    def setUp(self):
        self.client = TestClient(app)

    def test_is_coding_doubt_detection(self):
        # Code snippets and errors
        self.assertTrue(ai_service._is_coding_doubt("Fix this Python error: IndexError: list index out of range\n```python\nnums[5]\n```"))
        self.assertTrue(ai_service._is_coding_doubt("def calculate_average(grades):\n    return sum(grades) / len(grades)"))
        self.assertTrue(ai_service._is_coding_doubt("NullPointerException in Java class Main"))
        self.assertTrue(ai_service._is_coding_doubt("How to reverse a singly linked list in C++?"))
        self.assertTrue(ai_service._is_coding_doubt("How does quicksort partition work in recursion?"))
        self.assertTrue(ai_service._is_coding_doubt("SELECT * FROM users WHERE active = true"))

        # Non-coding doubts
        self.assertFalse(ai_service._is_coding_doubt("What is the capital of France?"))
        self.assertFalse(ai_service._is_coding_doubt("Explain photosynthesis in plants"))
        self.assertFalse(ai_service._is_coding_doubt("What is Newton's second law of motion?"))

    def test_detect_coding_subject(self):
        self.assertEqual(ai_service._detect_coding_subject("How to handle IndexError in Python?"), "Python Programming")
        self.assertEqual(ai_service._detect_coding_subject("Why do I get NullPointerException in Java class?"), "Java / OOP")
        self.assertEqual(ai_service._detect_coding_subject("Fix segmentation fault with pointer in C++"), "C / C++ Programming")
        self.assertEqual(ai_service._detect_coding_subject("How to handle state in React component?"), "Web Development & JavaScript")
        self.assertEqual(ai_service._detect_coding_subject("SELECT u.name FROM users u JOIN orders o"), "Database & SQL")
        self.assertEqual(ai_service._detect_coding_subject("What is the time complexity of binary search tree?"), "Data Structures & Algorithms")

    def test_extract_text_from_image_gemini_vision_success(self):
        mock_response = MagicMock(status_code=200)
        extracted_content = (
            "Fix this Python error: `ZeroDivisionError: division by zero`\n\n"
            "Code:\n```python\n"
            "def avg(nums):\n"
            "    return sum(nums) / len(nums)\n"
            "```\nWhat is the cause and corrected code?"
        )
        mock_response.json.return_value = {
            "candidates": [
                {
                    "content": {
                        "parts": [{"text": extracted_content}]
                    }
                }
            ]
        }
        client_mock = MagicMock()
        client_mock.__enter__.return_value = client_mock
        client_mock.post.return_value = mock_response

        dummy_b64 = base64.b64encode(b"fake-image-bytes").decode("utf-8")

        with patch.dict(os.environ, {"GEMINI_API_KEY": "test-gemini-key"}):
            with patch.object(ai_service.httpx, "Client", return_value=client_mock):
                text = ai_service.extract_text_from_image(dummy_b64, "image/png")

        self.assertEqual(text, extracted_content)
        self.assertIn("ZeroDivisionError", text)
        self.assertIn("def avg(nums):", text)

    def test_extract_text_from_image_raises_runtime_error_when_unavailable(self):
        client_mock = MagicMock()
        client_mock.__enter__.return_value = client_mock
        client_mock.post.return_value = MagicMock(status_code=500, text="error")

        dummy_b64 = base64.b64encode(b"fake-image-bytes").decode("utf-8")

        with patch.dict(os.environ, {"GEMINI_API_KEY": "test-key", "ANTHROPIC_API_KEY": "", "OPENAI_API_KEY": ""}):
            with patch.object(ai_service.httpx, "Client", return_value=client_mock):
                with self.assertRaises(RuntimeError) as ctx:
                    ai_service.extract_text_from_image(dummy_b64, "image/png")

        self.assertIn("Could not detect readable text", str(ctx.exception))
        # Ensure it NEVER returns the old hardcoded QuickSort fallback
        self.assertNotIn("QuickSort with partition algorithm", str(ctx.exception))

    def test_analyze_doubt_coding_routing_and_format(self):
        coding_doubt = (
            "Fix this Python error: IndexError: list index out of range\n"
            "Code:\n```python\ndef get_item(items):\n    return items[3]\n```"
        )
        mock_ai_output = {
            "domain": "Computer Science & IT",
            "subject": "Python Programming",
            "topic": "IndexError & Bounds Checking",
            "difficulty": "Easy",
            "confidence": 95,
            "explanation": (
                "The `IndexError` occurs because index 3 is out of range for lists with fewer than 4 elements.\n\n"
                "Corrected code:\n```python\ndef get_item(items):\n    if len(items) > 3:\n        return items[3]\n    return None\n```\n\n"
                "- Added bounds check before indexing\n- Returns `None` when list is too short."
            ),
            "simplifiedExplanation": "Always verify list length before accessing an index.",
            "similarQuestions": [
                {"question": "How to avoid IndexError in Python?", "similarity": 90},
                {"question": "What is zero-based indexing in Python?", "similarity": 85},
                {"question": "How does exception handling with try-except work?", "similarity": 80},
            ],
            "resources": [
                {"title": "Python List Documentation", "type": "Documentation", "relevance": 95},
                {"title": "Handling Exceptions in Python", "type": "Video", "relevance": 90},
                {"title": "IndexError Practice Questions", "type": "Practice Questions", "relevance": 85},
                {"title": "Python Data Structures Notes", "type": "Notes", "relevance": 80},
            ],
            "quiz": [
                {
                    "question": "What index does the first element of a Python list have?",
                    "options": ["0", "1", "-1", "None"],
                    "correctIndex": 0,
                    "explanation": "Python lists use zero-based indexing.",
                },
                {
                    "question": "What error occurs when accessing an invalid list index?",
                    "options": ["KeyError", "IndexError", "ValueError", "TypeError"],
                    "correctIndex": 1,
                    "explanation": "Accessing an out-of-range sequence index raises IndexError.",
                },
                {
                    "question": "How can you safely access an index with a default?",
                    "options": ["Using len() check", "Ignoring errors", "Using float()", "Deleting list"],
                    "correctIndex": 0,
                    "explanation": "Checking len() or using try-except ensures safety.",
                },
                {
                    "question": "What is the len of [10, 20, 30]?",
                    "options": ["2", "3", "4", "0"],
                    "correctIndex": 1,
                    "explanation": "There are three items in the list.",
                },
            ],
        }

        with patch.dict(os.environ, {"GEMINI_API_KEY": "test-key"}):
            with patch.object(ai_service, "_retrieve_knowledge", return_value=[]):
                with patch.object(ai_service, "_call_gemini", return_value=mock_ai_output) as mock_gemini:
                    result = ai_service.analyze_doubt(coding_doubt)

        self.assertEqual(result["domain"], "Computer Science & IT")
        self.assertEqual(result["subject"], "Python Programming")
        self.assertIn("```python", result["explanation"])
        self.assertIn("IndexError", result["explanation"])
        self.assertEqual(len(result["quiz"]), 4)

    def test_image_extract_api_endpoint(self):
        with patch.object(ai_service, "extract_text_from_image", return_value="Extracted: print('hello')"):
            response = self.client.post(
                "/api/doubts/image-extract",
                files={"file": ("code_snippet.png", b"fake-png-bytes", "image/png")},
            )
        self.assertEqual(response.status_code, 200)
        self.assertEqual(response.json(), {"text": "Extracted: print('hello')"})

    def test_image_extract_api_endpoint_rejects_non_image(self):
        response = self.client.post(
            "/api/doubts/image-extract",
            files={"file": ("notes.txt", b"plain text", "text/plain")},
        )
        self.assertEqual(response.status_code, 400)

    def test_tamil_nadu_cm_returns_vijay(self):
        # Test fallback / knowledge bank
        result = ai_service.analyze_doubt("Who is the current CM of tamilnadu?")
        self.assertIn("Vijay", result["explanation"])
        self.assertIn("Tamilaga Vettri Kazhagam", result["explanation"])
        self.assertIn("Vijay", result["simplifiedExplanation"])
        self.assertEqual(result["quiz"][0]["options"][0], "Vijay")
        self.assertEqual(result["quiz"][0]["correctIndex"], 0)
        self.assertEqual(len(result["studyPlan"]), 3)

        # Test with LLM response override
        mock_llm_stale = {
            "domain": "History & Social Sciences",
            "subject": "Civics & Governance",
            "topic": "Chief Minister of Tamil Nadu",
            "difficulty": "Easy",
            "confidence": 95,
            "explanation": "The Chief Minister of Tamil Nadu is M. K. Stalin.",
            "simplifiedExplanation": "M. K. Stalin is Chief Minister.",
            "similarQuestions": [],
            "resources": [],
            "quiz": [
                {"question": "Who is CM?", "options": ["M. K. Stalin", "EPS", "OPS", "Other"], "correctIndex": 0}
            ],
            "studyPlan": []
        }
        with patch.dict(os.environ, {"GEMINI_API_KEY": "test-key"}):
            with patch.object(ai_service, "_retrieve_knowledge", return_value=[]):
                with patch.object(ai_service, "_call_gemini", return_value=mock_llm_stale):
                    overridden = ai_service.analyze_doubt("who is the current chief minister of tamil nadu?")

        self.assertIn("Vijay", overridden["explanation"])
        self.assertIn("Tamilaga Vettri Kazhagam", overridden["explanation"])
        self.assertEqual(overridden["quiz"][0]["options"][0], "Vijay")

    def test_study_plan_generation_and_batch_api(self):
        # 1. Verify studyPlan is generated in /api/doubts/analyze
        response = self.client.post(
            "/api/doubts/analyze",
            json={"question": "What is binary search algorithm?", "user_id": 1},
        )
        self.assertEqual(response.status_code, 200)
        data = response.json()
        self.assertIn("studyPlan", data)
        self.assertEqual(len(data["studyPlan"]), 3)
        for task in data["studyPlan"]:
            self.assertIn("task", task)
            self.assertIn("priority", task)
            self.assertIn("due_date", task)

        # 2. Test saving via POST /api/planner/batch
        batch_tasks = [
            {
                "user_id": 1,
                "task": task["task"],
                "subject": data["subject"],
                "topic": data["topic"],
                "due_date": task["due_date"],
                "priority": task["priority"],
            }
            for task in data["studyPlan"]
        ]
        batch_res = self.client.post("/api/planner/batch", json={"user_id": 1, "tasks": batch_tasks})
        self.assertEqual(batch_res.status_code, 200)
        saved = batch_res.json()
        self.assertEqual(len(saved), 3)
        self.assertEqual(saved[0]["task"], batch_tasks[0]["task"])


if __name__ == "__main__":
    unittest.main()

