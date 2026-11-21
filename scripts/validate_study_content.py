#!/usr/bin/env python3
"""Validate staged study data before it is imported into RailReady."""
from collections import Counter
from pathlib import Path
import json

ROOT=Path(__file__).resolve().parents[1]
def load(path):
    return json.loads((ROOT / path).read_text(encoding="utf-8"))
questions=load("data/quant-reasoning-bank.json")["questions"]
lessons=load("data/study-lessons.json")["lessons"]
sources=load("data/pyq-source-index.json")
counts=Counter(q["topic"] for q in questions)
assert counts["Mathematics"] >= 30, counts
assert counts["Reasoning"] >= 30, counts
assert len({q["id"] for q in questions}) == len(questions)
for q in questions:
    assert q.get("kind") == "Original practice", q
    assert len(q["options"]) == 4 and len(set(q["options"])) == 4, q
    assert isinstance(q["answer"],int) and 0 <= q["answer"] <= 3, q
    assert isinstance(q["question"],str) and len(q["question"]) > 10, q
    assert isinstance(q["explanation"],str) and len(q["explanation"]) > 10, q
assert len([x for x in lessons if x["section"]=="Mathematics"])>=10
assert len([x for x in lessons if x["section"]=="Reasoning"])>=10
assert len({x["id"] for x in lessons})==len(lessons)
for x in lessons:
    assert all(x.get(k) for k in ["title","objective","keyRule","example","tip"]), x
assert sources["verifiedTranscribedQuestions"] == 0, "No unverified PYQ claims allowed"
pattern=sources["examPattern"]
assert pattern["questions"] == 100 and pattern["minutes"] == 90
assert [s["count"] for s in pattern["breakdown"]] == [40,30,30]
print(f"PASS: {len(questions)} unique original questions: {dict(counts)}")
print(f"PASS: {len(lessons)} lessons and {len(sources['resources'])} PYQ/source references")
print("PASS: Exam pattern, answer keys and PYQ labelling")
