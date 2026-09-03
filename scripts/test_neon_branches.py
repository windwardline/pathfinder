#!/usr/bin/env python3
"""Safety tests for the Neon branch reaper.

This script deletes production databases, so the classifier is tested against a
synthetic population before it is ever pointed at a real project. Every test
here asserts something is NOT deleted; the single positive case is last.

Run: python3 -m unittest discover -s scripts -p 'test_*.py' -v
"""

import datetime as dt
import unittest

from neon_branches import classify


def branch(name, *, age_hours=999.0, default=False, protected=False, bid=None):
    created = dt.datetime.now(dt.timezone.utc) - dt.timedelta(hours=age_hours)
    return {
        "id": bid or f"br-{name.replace('/', '-')}",
        "name": name,
        "default": default,
        "protected": protected,
        "created_at": created.isoformat().replace("+00:00", "Z"),
    }


def names(rows):
    return {b["name"] for b, _ in rows}


class ClassifierSafety(unittest.TestCase):
    MIN_AGE = 24.0

    def bucket(self, branches, open_heads=frozenset()):
        return classify(branches, set(open_heads) if open_heads is not None else None, self.MIN_AGE)

    def test_default_branch_is_never_a_candidate(self):
        b = self.bucket([branch("main", default=True)])
        self.assertEqual(names(b["candidate"]), set())
        self.assertIn("main", names(b["protected"]))

    def test_protected_branch_is_never_a_candidate(self):
        b = self.bucket([branch("preview/locked", protected=True)])
        self.assertEqual(names(b["candidate"]), set())
        self.assertIn("preview/locked", names(b["protected"]))

    def test_default_flag_wins_even_with_a_preview_name(self):
        """A default branch named like a preview must still be untouchable."""
        b = self.bucket([branch("preview/weird", default=True)])
        self.assertEqual(names(b["candidate"]), set())

    def test_non_preview_branches_are_reported_not_deleted(self):
        b = self.bucket([branch("staging"), branch("dev/scratch")])
        self.assertEqual(names(b["candidate"]), set())
        self.assertEqual(names(b["unclassified"]), {"staging", "dev/scratch"})

    def test_branch_with_an_open_pr_is_held(self):
        b = self.bucket([branch("preview/feat-x")], open_heads={"feat-x"})
        self.assertEqual(names(b["candidate"]), set())
        self.assertIn("preview/feat-x", names(b["held"]))

    def test_young_branch_is_held(self):
        b = self.bucket([branch("preview/just-made", age_hours=1.0)])
        self.assertEqual(names(b["candidate"]), set())
        self.assertIn("preview/just-made", names(b["held"]))

    def test_unknown_pr_state_holds_everything(self):
        """If we cannot list PRs we must not guess. None is not an empty set."""
        b = self.bucket([branch("preview/a"), branch("preview/b")], open_heads=None)
        self.assertEqual(names(b["candidate"]), set())
        self.assertEqual(len(b["held"]), 2)

    def test_every_branch_lands_in_exactly_one_bucket(self):
        pop = [branch("main", default=True), branch("preview/open", ),
               branch("preview/old"), branch("staging"),
               branch("preview/new", age_hours=2.0)]
        b = self.bucket(pop, open_heads={"open"})
        total = sum(len(v) for v in b.values())
        self.assertEqual(total, len(pop), "a branch was dropped or double-counted")

    def test_orphaned_preview_branch_is_the_only_thing_reaped(self):
        pop = [
            branch("main", default=True),
            branch("preview/merged-pr"),          # the one to reap
            branch("preview/still-open"),
            branch("preview/fresh", age_hours=3.0),
            branch("some-manual-branch"),
        ]
        b = self.bucket(pop, open_heads={"still-open"})
        self.assertEqual(names(b["candidate"]), {"preview/merged-pr"})


if __name__ == "__main__":
    unittest.main(verbosity=2)
