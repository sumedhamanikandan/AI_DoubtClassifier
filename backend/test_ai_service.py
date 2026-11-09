import os
import unittest
from unittest.mock import MagicMock, patch

import ai_service


class ArithmeticAnswerTests(unittest.TestCase):
    def test_simple_arithmetic_returns_exact_answer(self):
        result = ai_service.analyze_doubt("What is 2+2?")

        self.assertEqual(result["domain"], "Mathematics")
        self.assertEqual(result["subject"], "Arithmetic")
        self.assertIn("2+2 = 4", result["explanation"])

    def test_arithmetic_supports_order_of_operations_and_exact_fractions(self):
        result = ai_service.analyze_doubt("calculate (2 + 3) * 4")
        fraction_result = ai_service.analyze_doubt("1/3 + 1/3")

        self.assertIn("20", result["explanation"])
        self.assertIn("2/3", fraction_result["explanation"])

    def test_math_subject_detection_does_not_capture_computer_science(self):
        self.assertEqual(ai_service._math_subject("What is the derivative of x^2?"), "Calculus")
        self.assertEqual(ai_service._math_subject("What is the area of a circle?"), "Geometry")
        self.assertEqual(ai_service._math_subject("What is the mean of 4 and 6?"), "Statistics")
        self.assertIsNone(ai_service._math_subject("How do I solve this binary search problem?"))

    def test_configured_ai_api_receives_math_routing_and_cannot_override_subject(self):
        provider_response = {
            "domain": "Computer Science & IT",
            "subject": "Data Structures",
            "topic": "Linear equations",
            "difficulty": "Easy",
            "confidence": 90,
            "explanation": "Solve for x by isolating the variable.",
        }
        with patch.dict(os.environ, {"ANTHROPIC_API_KEY": "test-key"}):
            with patch.object(ai_service, "_retrieve_knowledge", return_value=[]):
                with patch.object(ai_service, "_call_anthropic", return_value=provider_response) as api_call:
                    result = ai_service.analyze_doubt("How do I solve a linear equation?")

        self.assertIn("Subject routing: Mathematics", api_call.call_args.args[0])
        self.assertEqual(result["domain"], "Mathematics")
        self.assertEqual(result["subject"], "Algebra")

    def test_current_affairs_uses_news_context_and_shows_sources(self):
        source = {
            "title": "Recent election update",
            "url": "https://news.example/election",
            "publisher": "Example News",
            "date": "20261017T120000Z",
            "text": "",
        }
        provider_response = {
            "domain": "General Knowledge",
            "subject": "Politics",
            "topic": "Election results",
            "difficulty": "Easy",
            "confidence": 88,
            "explanation": "The latest reporting says ...",
        }
        with patch.dict(os.environ, {"ANTHROPIC_API_KEY": "test-key"}):
            with patch.object(ai_service, "_retrieve_knowledge", return_value=[source]):
                with patch.object(ai_service, "_call_anthropic", return_value=provider_response) as api_call:
                    result = ai_service.analyze_doubt("What are the latest election results?")

        self.assertIn("Recent election update", api_call.call_args.args[0])
        self.assertIn("do not invent", api_call.call_args.args[0])
        self.assertEqual(result["domain"], "History & Social Sciences")
        self.assertEqual(result["subject"], "Politics & Current Affairs")
        self.assertEqual(result["sources"], [{
            "title": source["title"],
            "url": source["url"],
            "publisher": source["publisher"],
            "date": source["date"],
        }])

    def test_unknown_questions_do_not_fall_back_to_generic_concept_text(self):
        with patch.dict(os.environ, {}, clear=True):
            with patch.object(ai_service, "_retrieve_knowledge", return_value=[]):
                result = ai_service.analyze_doubt("Who won the latest local election?")

        self.assertIn("couldn't verify", result["explanation"])
        self.assertEqual(result["confidence"], 10)

    def test_current_office_question_does_not_mistake_reference_definition_for_answer(self):
        source = {
            "title": "Chief Minister of Tamil Nadu",
            "url": "https://en.wikipedia.org/wiki/Chief_Minister_of_Tamil_Nadu",
            "publisher": "Wikipedia",
            "date": "",
            "text": "The chief minister of Tamil Nadu is the head of government.",
        }
        result = ai_service.analyze_doubt("Who is the current CM of Tamilnadu?")

        self.assertIn("Vijay", result["explanation"])
        self.assertIn("Tamilaga Vettri Kazhagam", result["explanation"])
        self.assertEqual(result["quiz"][0]["options"][0], "Vijay")
        self.assertEqual(result["quiz"][0]["correctIndex"], 0)

    def test_study_fallback_uses_retrieved_reference_extract(self):
        source = {
            "title": "Cellular respiration",
            "url": "https://en.wikipedia.org/wiki/Cellular_respiration",
            "publisher": "Wikipedia",
            "date": "",
            "text": "Cellular respiration releases energy from nutrients in cells.",
        }
        with patch.dict(os.environ, {}, clear=True):
            with patch.object(ai_service, "_retrieve_knowledge", return_value=[source]):
                result = ai_service.analyze_doubt("How does cellular respiration release energy?")

        self.assertEqual(result["explanation"], source["text"])
        self.assertEqual(result["sources"][0]["title"], source["title"])

    def test_gemini_uses_supported_models_and_retries_after_unavailable_model(self):
        client = MagicMock()
        client.__enter__.return_value = client
        missing_model = MagicMock(status_code=404, text="model not found")
        successful_response = MagicMock(status_code=200)
        successful_response.json.return_value = {
            "candidates": [{
                "content": {
                    "parts": [{"text": '{"explanation": "answer"}'}]
                }
            }]
        }
        client.post.side_effect = [missing_model, successful_response]

        with patch.object(ai_service.httpx, "Client", return_value=client):
            result = ai_service._call_gemini("prompt", "test-key")

        self.assertEqual(result, {"explanation": "answer"})
        called_urls = [call.args[0] for call in client.post.call_args_list]
        self.assertIn("gemini-2.5-flash", called_urls[0])
        self.assertIn("gemini-2.5-pro", called_urls[1])

    def test_current_affairs_question_detection(self):
        self.assertTrue(ai_service.is_current_affairs_question("Who is the PM of India?"))
        self.assertTrue(ai_service.is_current_affairs_question("Who is the current CM of Tamilnadu?"))
        self.assertTrue(ai_service.is_current_affairs_question("What are the latest election results?"))
        self.assertFalse(ai_service.is_current_affairs_question("Explain how elections work in a democracy."))

    def test_regional_current_office_search_queries_are_normalized(self):
        client = MagicMock()
        client.__enter__.return_value = client
        response = MagicMock(status_code=200)
        response.json.return_value = {"query": {"pages": []}}
        client.get.return_value = response

        with patch.object(ai_service.httpx, "Client", return_value=client):
            ai_service._search_wikipedia("Who is the current CM of Tamilnadu?")

        self.assertEqual(client.get.call_args.kwargs["params"]["gsrsearch"], "Chief Minister of Tamil Nadu")

    def test_gemini_grounded_answer_returns_search_citations(self):
        client = MagicMock()
        client.__enter__.return_value = client
        response = MagicMock(status_code=200)
        response.json.return_value = {
            "candidates": [{
                "content": {"parts": [{"text": "The current chief minister is the head of state government."}]},
                "groundingMetadata": {
                    "groundingChunks": [{
                        "web": {
                            "uri": "https://www.example.gov/office",
                            "title": "Official Chief Minister page",
                        }
                    }]
                },
            }]
        }
        client.post.return_value = response

        with patch.object(ai_service.httpx, "Client", return_value=client):
            result = ai_service._call_gemini_grounded("Who is the current CM of Tamil Nadu?", "test-key")

        self.assertIn("chief minister", result["explanation"])
        self.assertTrue(result["grounded"])
        self.assertEqual(result["sources"][0]["publisher"], "www.example.gov")
        request = client.post.call_args.kwargs["json"]
        self.assertEqual(request["tools"], [{"google_search": {}}])

    def test_gemini_grounded_answer_is_used_before_fallback_search(self):
        grounded_response = {
            "explanation": "The sourced answer to the question.",
            "sources": [{
                "title": "Official source",
                "url": "https://www.example.gov",
                "publisher": "www.example.gov",
                "date": "",
            }],
            "grounded": True,
        }
        with patch.dict(os.environ, {"GEMINI_API_KEY": "test-key"}):
            with patch.object(ai_service, "_call_gemini_grounded", return_value=grounded_response):
                with patch.object(ai_service, "_retrieve_knowledge", side_effect=AssertionError("fallback search called")):
                    result = ai_service.analyze_doubt("Who is the current CM of Tamilnadu?")

        self.assertEqual(result["domain"], "History & Social Sciences")
        self.assertEqual(result["subject"], "Politics & Current Affairs")
        self.assertEqual(result["explanation"], grounded_response["explanation"])
        self.assertEqual(result["sources"][0]["title"], "Official source")

    def test_gdelt_results_include_source_and_seen_date(self):
        client = MagicMock()
        client.__enter__.return_value = client
        response = MagicMock(status_code=200)
        response.json.return_value = {
            "articles": [{
                "title": "Election update & results",
                "url": "https://news.example/election",
                "domain": "news.example",
                "seendate": "20261017T120000Z",
            }]
        }
        client.get.return_value = response

        with patch.object(ai_service.httpx, "Client", return_value=client):
            results = ai_service._search_current_news("latest election results")

        self.assertEqual(results[0]["title"], "Election update & results")
        self.assertEqual(results[0]["date"], "Seen 2026-10-17")
        self.assertEqual(results[0]["publisher"], "news.example")

    def test_unsupported_or_unsafe_expressions_are_not_evaluated(self):
        self.assertFalse(ai_service.is_arithmetic_question("8 / 0"))
        self.assertFalse(ai_service.is_arithmetic_question('__import__("os").system("whoami")'))


if __name__ == "__main__":
    unittest.main()
