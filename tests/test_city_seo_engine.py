"""Offline, no-credential tests for the existing upgraded city AI engine."""
import pathlib
import sys
import types
import unittest
from unittest.mock import Mock

sys.path.insert(0, str(pathlib.Path(__file__).resolve().parents[1] / "backend"))
sys.modules.setdefault("config", types.SimpleNamespace(require_ingestion_settings=lambda: ("", "")))
from ai_engine import GenerationError, validate_city_batch
from engine import run


def city(number):
    return {"id": f"00000000-0000-4000-8000-{number:012d}", "name": f"City {number}",
            "slug": f"city-{number}", "country": "Testland", "country_code": "TL",
            "seo_title": None, "seo_description": None, "description": None, "is_active": True}


def content(records):
    results = []
    for item in records:
        name = item["name"]
        number = int(item["id"][-12:])
        themes = ["river access", "museum research", "historic pathways", "train stops", "local walking routes", "scenic viewpoints", "public gardens", "transport connections"]
        theme = themes[number % len(themes)]
        results.append({
            "id": item["id"],
            "seo_title": f"{name}: Practical planning around {theme} and nearby services",
            "seo_description": f"Explore {name} with practical {theme} planning notes, compare verified source links, and check local travel arrangements before booking your trip.",
            "description": f"{name} is a destination to research using actual published information before arranging a visit. "
                           + f"For {theme}, check the locally relevant transport situation, compare independently published places to visit, and confirm details with official operators. "
                           + f"Before reserving any paid service in {name}, verify addresses, dates, admission rules and supplier terms directly. "
                           + f"Keep an alternative plan for {theme} and the specific conditions of the journey."
        })
    return results


class FakeTable:
    def __init__(self, rows):
        self.rows = rows
        self.cursor = ""
        self.count = 50
        self.pending_only = False
    def select(self, *_args, **_kwargs): return self
    def eq(self, *_args, **_kwargs): return self
    def order(self, *_args, **_kwargs): return self
    def or_(self, predicate):
        assert "seo_title.is.null" in predicate and "seo_description.is.null" in predicate
        self.pending_only = True
        return self
    def limit(self, value):
        self.count = value
        return self
    def gt(self, _key, cursor):
        self.cursor = cursor
        return self
    def execute(self):
        eligible = [r for r in self.rows if r["id"] > self.cursor and
                    (not self.pending_only or any(r.get(k) in (None, "") for k in
                    ("seo_title", "seo_description", "description")))]
        return type("Reply", (), {"data": eligible[:self.count]})()


class FakeDB:
    def __init__(self, rows):
        self.rows = rows
        self.reads = 0
    def table(self, name):
        assert name == "destinations"
        self.reads += 1
        return FakeTable(self.rows)


class CitySeoEngineTests(unittest.TestCase):
    def test_valid_unique_copy_and_id_alignment(self):
        rows = [city(1), city(2)]
        parsed = validate_city_batch(rows, content(rows))
        self.assertEqual([x["id"] for x in parsed], [x["id"] for x in rows])
    def test_reject_incomplete_ids_duplicates_and_generic_template(self):
        rows = [city(1), city(2)]
        with self.assertRaises(GenerationError):
            validate_city_batch(rows, content(rows)[:1])
        mixed = content(rows)
        mixed[1]["id"] = mixed[0]["id"]
        with self.assertRaises(GenerationError):
            validate_city_batch(rows, mixed)
        generic = content(rows)
        generic[1]["description"] = generic[0]["description"].replace("City 1", "City 2")
        # Fingerprints normalize city names, but distinct text patterns require review.
        with self.assertRaises(GenerationError):
            validate_city_batch(rows, generic)
    def test_dry_run_reads_only_and_never_calls_gemini_or_writer(self):
        db = FakeDB([city(i) for i in range(1, 8)])
        gen = Mock(side_effect=AssertionError("dry run must not call Gemini"))
        writer = Mock(side_effect=AssertionError("dry run must not write"))
        summary = run(client=db, generator=gen, writer=writer, batch_size=2,
                      max_calls=1, max_reads=1, page_size=7, write=False)
        self.assertEqual(summary["db_reads"], 1)
        self.assertEqual(summary["ai_calls"], 0)
        self.assertEqual(summary["written"], 0)
        self.assertEqual(summary["pending"], 7)
        gen.assert_not_called()
        writer.assert_not_called()
    def test_bounded_write_returns_cursor_and_resumes_remaining_rows(self):
        rows = [city(i) for i in range(1, 8)]
        db = FakeDB(rows)
        writes = []
        def writer(client, row, draft):
            writes.append(row["id"])
            return True
        first = run(client=db, generator=content, writer=writer, batch_size=2,
                    max_calls=1, max_reads=2, page_size=4, min_interval=0, write=True)
        self.assertEqual(first["ai_calls"], 1)
        self.assertEqual(first["written"], 2)
        self.assertEqual(first["next_cursor"], city(2)["id"])
        self.assertEqual(writes, [city(1)["id"], city(2)["id"]])
        followup = run(client=db, generator=content, writer=writer, batch_size=2,
                       max_calls=3, max_reads=2, page_size=4, min_interval=0,
                       write=True, cursor=first["next_cursor"], sleep=lambda _: None)
        self.assertEqual(followup["written"], 5)
        self.assertEqual(followup["next_cursor"], city(7)["id"])
        self.assertEqual(len(set(writes)), 7)
    def test_scheduled_batches_start_afresh_without_rescanning_completed_rows(self):
        rows = [city(i) for i in range(1, 7)]
        db = FakeDB(rows)
        def writer(_client, row, draft):
            row.update(draft)
            return True
        first = run(client=db, generator=content, writer=writer,
                    batch_size=2, max_calls=1, max_reads=1, page_size=4,
                    min_interval=0, write=True)
        self.assertEqual(first["written"], 2)
        self.assertEqual(first["db_reads"], 1)
        # A separate scheduled run can start with no cursor: the server-side
        # pending filter excludes previously completed records.
        second = run(client=db, generator=content, writer=writer,
                     batch_size=2, max_calls=1, max_reads=1, page_size=4,
                     min_interval=0, write=True)
        self.assertEqual(second["written"], 2)
        self.assertEqual(second["next_cursor"], city(4)["id"])
        self.assertTrue(all(rows[i]["seo_title"] for i in range(4)))
        self.assertEqual(rows[4]["seo_title"], None)

    def test_rejected_gemini_batch_writes_nothing(self):
        rows = [city(1), city(2)]
        db = FakeDB(rows)
        writer = Mock()
        summary = run(client=db, generator=lambda _: [], writer=writer,
                      batch_size=2, max_calls=2, max_reads=1, page_size=2, write=True, min_interval=0)
        self.assertGreater(summary["failed"], 0)
        self.assertEqual(summary["next_cursor"], "")
        writer.assert_not_called()


if __name__ == "__main__":
    unittest.main()
