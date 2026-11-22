import sys
import unittest
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parent))

from ensure_public_edge_cache import expression, plan, rule_payload


class PublicEdgeCacheRuleTests(unittest.TestCase):
    def test_expression_is_anonymous_public_gets_only(self):
        text = expression()
        self.assertIn('http.request.method eq "GET"', text)
        self.assertIn('not any(http.request.headers["authorization"][*] ne "")', text)
        self.assertIn('not any(http.request.headers["cookie"][*] ne "")', text)
        for path in (
            "/api/home",
            "/api/departments",
            "/api/institute",
            "/api/notifications",
            "/api/academics",
            "/api/v1/cms/api/home",
            "/api/v1/cms/api/departments",
            "/api/v1/cms/api/institute",
            "/api/v1/cms/api/notifications",
            "/api/v1/cms/api/academics",
        ):
            self.assertIn(path, text)
        self.assertNotIn("/api/preview", text)
        self.assertNotIn("/api/analytics", text)
        self.assertNotIn("/api/v1/auth", text)
        self.assertNotIn("/api/v1/profile", text)

    def test_ttl_respects_origin(self):
        params = rule_payload()["action_parameters"]
        self.assertEqual(params["edge_ttl"]["mode"], "respect_origin")
        self.assertEqual(params["browser_ttl"]["mode"], "respect_origin")
        self.assertNotIn("default", params["edge_ttl"])

    def test_plan_does_not_touch_other_rules(self):
        other = {"description": "pages", "action": "set_cache_settings", "id": "keep"}
        action, existing = plan([other])
        self.assertEqual(action, "create")
        self.assertIsNone(existing)

        ours = rule_payload()
        ours["id"] = "rule-1"
        action, existing = plan([other, ours])
        self.assertEqual(action, "noop")
        self.assertEqual(existing["id"], "rule-1")

        stale = dict(ours)
        stale["expression"] = "http.host eq \"example.com\""
        action, existing = plan([other, stale])
        self.assertEqual(action, "update")
        self.assertEqual(existing["description"], "uniz-public-read-edge-cache")


if __name__ == "__main__":
    unittest.main()
