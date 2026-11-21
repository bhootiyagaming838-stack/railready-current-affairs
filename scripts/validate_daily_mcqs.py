#!/usr/bin/env python3
"""Validate the latest original daily MCQ set and answer-key integrity."""
import datetime as dt
import json
import pathlib
import sys
from collections import Counter

ROOT=pathlib.Path(__file__).resolve().parents[1]
p=ROOT/"data"/"daily-mcqs.json"
data=json.loads(p.read_text(encoding="utf-8"))
qs=data["questions"]
assert dt.date.fromisoformat(data["date"])
assert data["questionCount"]==60 and len(qs)==60
assert len({q["id"] for q in qs})==60
assert len({q["question"].strip().lower() for q in qs})==60
assert dict(Counter(q["topic"] for q in qs))=={"Mathematics":30,"Reasoning":30}
for q in qs:
 assert q["date"]==data["date"]
 assert q["kind"]=="Original daily practice"
 assert isinstance(q["question"],str) and len(q["question"])>=12
 assert len(q["options"])==len(set(q["options"]))==4
 assert type(q["answer"])==int and 0<=q["answer"]<=3
 assert isinstance(q["explanation"],str) and len(q["explanation"])>=20
 assert isinstance(q["options"][q["answer"]],str)
archive=ROOT/"data"/"daily-history"/(data["date"]+".json")
assert archive.exists(), "Current date missing from daily archive"
assert json.loads(archive.read_text(encoding="utf-8"))==data
news_path=ROOT/"data"/"news.json"
if news_path.exists():
    news=json.loads(news_path.read_text(encoding="utf-8"))
    assert len(news.get("questions",[]))==60, "Floot compatibility quiz does not have 60 questions"
    assert news.get("dailyQuestionDate")==data["date"], "Floot compatibility quiz has the wrong date"
    assert {q["id"] for q in news["questions"]}=={q["id"] for q in qs}, "Floot quiz answers differ from today's daily bank"
print("PASS: "+data["date"]+" / 60 original MCQs / 30 Maths + 30 Reasoning / Floot news feed bridge")
