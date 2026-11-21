#!/usr/bin/env python3
"""Regression-test 45 future daily sets, their answer keys and non-repetition."""
import datetime as dt
import json
import pathlib
import shutil
import subprocess
import sys
import tempfile

ROOT=pathlib.Path(__file__).resolve().parents[1]
SOURCE=ROOT/"scripts"
START=dt.date(2026,11,22)
with tempfile.TemporaryDirectory(prefix="railready-future-mcqs-") as workspace:
    target=pathlib.Path(workspace)
    (target/"scripts").mkdir()
    for filename in ("generate_daily_mcqs.py","validate_daily_mcqs.py","verify_daily_answers.py"):
        shutil.copy2(SOURCE/filename,target/"scripts"/filename)
    previous=[]
    for n in range(45):
        date=(START+dt.timedelta(days=n)).isoformat()
        generation=subprocess.run([sys.executable,str(target/"scripts"/"generate_daily_mcqs.py"),"--date",date],
                       check=False,capture_output=True,text=True,timeout=15)
        if generation.returncode:
            raise RuntimeError(f"Generation failed for {date}: {generation.stderr}\n{generation.stdout}")
        subprocess.run([sys.executable,str(target/"scripts"/"validate_daily_mcqs.py")],
                       check=True,capture_output=True,text=True,timeout=15)
        subprocess.run([sys.executable,str(target/"scripts"/"verify_daily_answers.py")],
                       check=True,capture_output=True,text=True,timeout=15)
        data=json.loads((target/"data"/"daily-mcqs.json").read_text(encoding="utf-8"))
        current={q["question"].lower() for q in data["questions"]}
        assert len(current)==60, date
        for old in previous[-14:]:
            assert not current.intersection(old), f"Repeated MCQs within 14 days at {date}"
        previous.append(current)
    print("PASS: 45 consecutive dates, 2,700 original MCQs, no question repeats within 14 days")
    print("PASS: independently checked answers and valid options on every generated date")
