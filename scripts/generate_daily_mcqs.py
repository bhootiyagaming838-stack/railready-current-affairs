#!/usr/bin/env python3
"""Create original, answer-checked RRB NTPC daily MCQs with no paid API.

Every day creates a new set of numerical and logical problems with freshly
sampled parameters. No current-affairs fact or PYQ provenance is fabricated.
"""
from __future__ import annotations

import argparse
import datetime as dt
import json
import math
import pathlib
import random
import re

ROOT = pathlib.Path(__file__).resolve().parents[1]
LATEST = ROOT / "data" / "daily-mcqs.json"
ARCHIVE = ROOT / "data" / "daily-history"
IST = dt.timezone(dt.timedelta(hours=5, minutes=30))
ALPHABET = "ABCDEFGHIJKLMNOPQRSTUVWXYZ"
WORDS = ("TRAIN", "PLANE", "RAIL", "GARDEN", "MANGO", "TIGER",
         "MARKET", "BREAD", "RIVER", "FRIEND", "EARTH", "MONEY",
         "MOBILE", "HOUSE", "BOTTLE", "SCHOOL", "WINDOW", "FLOWER",
         "ORANGE", "PENCIL", "BRIDGE", "TICKET", "SIGNAL", "ENGINE",
         "NUMBER", "PUZZLE", "ROCKET", "LETTER", "CIRCLE", "SUMMER")

def gcd(a: int, b: int) -> int:
    while b:
        a, b = b, a % b
    return a

def main() -> None:
    ap = argparse.ArgumentParser()
    ap.add_argument("--date", help="YYYY-MM-DD in India, otherwise today IST")
    args = ap.parse_args()
    today = dt.date.fromisoformat(args.date) if args.date else dt.datetime.now(IST).date()
    rng = random.Random(int(today.strftime("%Y%m%d")) * 104729)
    generator_version = 2  # Fix percent calculations and out-of-range alphabet series
    created: list[dict] = []
    used: set[str] = set()
    existing: set[str] = set()
    for file in sorted(ARCHIVE.glob("*.json"), reverse=True)[:14]:
        try:
            past = json.loads(file.read_text(encoding="utf-8"))
            existing.update(q["question"].casefold() for q in past.get("questions", []))
        except (OSError, ValueError, KeyError, TypeError):
            pass

    def add(topic: str, skill: str, question: str, correct: str,
            distractors: list[str], explanation: str, difficulty: str = "Easy") -> bool:
        question = question.strip()
        key = question.casefold()
        if key in used or key in existing:
            return False
        options = [str(correct)]
        options += [str(x) for x in distractors if str(x) not in options]
        # Preserve four unique, meaningful choices; don't pad with invented
        # "both" or "none" for numerical questions.
        options = list(dict.fromkeys(options))
        if len(options) < 4:
            return False
        options = options[:4]
        rng.shuffle(options)
        answer = options.index(str(correct))
        if not 0 <= answer <= 3:
            return False
        used.add(key)
        created.append({
            "id": "daily-" + today.strftime("%Y%m%d") + "-" + f"{len(created)+1:03d}",
            "date": today.isoformat(),
            "topic": topic, "skill": skill, "question": question,
            "options": options, "answer": answer,
            "explanation": explanation, "difficulty": difficulty,
            "kind": "Original daily practice",
        })
        return True

    def numeric(topic: str, skill: str, prompt: str, value: int,
                explanation: str, unit: str = "", difficulty: str = "Easy") -> bool:
        if not isinstance(value, int) or value < 0:
            return False
        step = 2 if value < 15 else 4 if value < 40 else 10 if value < 150 else 25 if value < 500 else 100
        possible = [value + step, value - step if value >= step else value + 3*step, value + 2*step]
        return add(topic, skill, prompt, f"{value}{unit}",
                   [f"{x}{unit}" for x in possible], explanation, difficulty)

    M, R = "Mathematics", "Reasoning"

    def generate(category: str, n: int, builder) -> None:
        for _ in range(n):
            for trial in range(150):
                if builder(): break
            else: raise RuntimeError(f"Cannot create {category} distinct question after 150 attempts")

    def math_percent():
        p = rng.choice((5, 10, 12, 15, 20, 25, 30, 35, 40, 50, 60, 75))
        value = rng.randrange(20, 200) * 100
        result = value * p // 100
        return numeric(M, "Percentages", f"Find {p}% of {value}.", result,
                       f"{p}% of {value} = {p}/100 × {value} = {result}.")
    generate("percentages", 4, math_percent)

    def math_increase():
        price = rng.randrange(50, 900) * 100
        pct = rng.choice((5, 10, 15, 20, 25, 30))
        result = price * (100 + pct) // 100
        return numeric(M, "Percentages",
                       f"An amount of ₹{price} is increased by {pct}%. What is the new amount?",
                       result, f"New amount = {price} × (100+{pct})/100 = ₹{result}.")
    generate("increases", 2, math_increase)

    def math_discount():
        marked = rng.randrange(40, 800) * 100
        pct = rng.choice((5, 10, 15, 20, 25, 30, 40))
        result = marked * (100 - pct) // 100
        return numeric(M, "Profit, Loss & Discount",
                       f"An item has a marked price of ₹{marked} and a {pct}% discount. Find the selling price.",
                       result, f"SP = ₹{marked} × (100−{pct})/100 = ₹{result}.")
    generate("discounts", 3, math_discount)

    def math_average():
        middle = rng.randrange(15, 140)
        gap = rng.randrange(2, 21)
        numbers = (middle - gap, middle, middle + gap)
        return numeric(M, "Averages",
                       f"Find the average of {numbers[0]}, {numbers[1]} and {numbers[2]}.",
                       middle, f"Average = ({'+'.join(map(str,numbers))})/3 = {middle}.")
    generate("averages", 2, math_average)

    def math_ratio():
        a = rng.randrange(2, 14)
        b = rng.randrange(2, 15)
        k = rng.randrange(8, 100)
        if gcd(a,b) != 1: return False
        total = (a+b)*k
        result = a*k
        return numeric(M, "Ratio & Proportion",
                       f"Two numbers are in the ratio {a}:{b}. Their sum is {total}. Find the first number.",
                       result, f"One part is {total}/({a}+{b})={k}; first = {a}×{k}={result}.")
    generate("ratios", 3, math_ratio)

    def math_interest():
        principal = rng.randrange(4, 200) * 500
        rate = rng.randrange(3, 14)
        years = rng.randrange(2, 7)
        result = principal * rate * years // 100
        return numeric(M, "Simple Interest",
                       f"Find the simple interest on ₹{principal} at {rate}% per annum for {years} years.",
                       result, f"SI = P×R×T/100 = {principal}×{rate}×{years}/100 = ₹{result}.")
    generate("interest", 3, math_interest)

    def math_algebra():
        x = rng.randrange(2, 40)
        a = rng.randrange(2, 15)
        b = rng.randrange(3, 35)
        c = a*x+b
        return numeric(M, "Algebra", f"Solve {a}x + {b} = {c}. Find x.", x,
                       f"{a}x = {c}−{b} = {a*x}; x = {a*x}/{a} = {x}.")
    generate("algebra", 3, math_algebra)

    def math_speed():
        speed = rng.randrange(20, 131)
        time = rng.randrange(2, 10)
        result = speed*time
        return numeric(M, "Speed, Time & Distance",
                       f"A train travels at {speed} km/h for {time} hours. How far does it travel?",
                       result, f"Distance = speed×time = {speed}×{time} = {result} km.", " km")
    generate("speed", 2, math_speed)

    def math_rectangle():
        length = rng.randrange(10, 71)
        width = rng.randrange(5, 45)
        result = length*width
        return numeric(M, "Mensuration",
                       f"Find the area of a rectangle {length} cm long and {width} cm wide.",
                       result, f"Area = {length}×{width} = {result} cm².", " cm²")
    generate("area", 2, math_rectangle)

    def math_hcf():
        common = rng.randrange(3, 26)
        a, b = rng.sample((2,3,4,5,7,9,11,13), 2)
        if gcd(a,b) != 1: return False
        x,y = a*common,b*common
        return numeric(M, "Number System",
                       f"Find the HCF of {x} and {y}.", common,
                       f"HCF({x}, {y}) = {common} because {a} and {b} are coprime.")
    generate("HCF", 2, math_hcf)

    def math_lcm():
        a,b = rng.sample(range(4, 34), 2)
        result = a*b//gcd(a,b)
        return numeric(M, "Number System",
                       f"Find the LCM of {a} and {b}.", result,
                       f"LCM = {a}×{b}/HCF({a},{b}) = {result}.")
    generate("LCM", 2, math_lcm)

    def math_work():
        # A and B require 3u and 6u days respectively, so together: 2u days.
        unit = rng.randrange(2, 25)
        a,b = 3*unit, 6*unit
        combined = 2*unit
        return numeric(M, "Time & Work",
                       f"A completes a task in {a} days and B in {b} days. How many days together?",
                       combined,
                       f"Combined time = ({a}×{b})/({a}+{b}) = {combined} days.", " days")
    generate("work", 2, math_work)

    def reasoning_arithmetic():
        start,step = rng.randrange(3, 150),rng.randrange(2, 25)
        seq = [start+i*step for i in range(5)]
        result = seq[-1]+step
        return numeric(R, "Number Series",
                       f"Complete the series: {', '.join(map(str,seq))}, ?", result,
                       f"The common difference is +{step}; {seq[-1]}+{step} = {result}.")
    generate("arithmetic series", 5, reasoning_arithmetic)

    def reasoning_squares():
        a = rng.randrange(2, 80)
        seq = [(a+i)**2 for i in range(4)]
        result=(a+4)**2
        return numeric(R, "Number Series",
                       f"Find the next number: {', '.join(map(str,seq))}, ?", result,
                       f"These are squares of consecutive integers {a} to {a+3}. Next is ({a+4})²={result}.")
    generate("square series", 3, reasoning_squares)

    def reasoning_geometric():
        start = rng.randrange(2, 15)
        ratio = rng.choice((2,3,4,5))
        seq = [start*ratio**i for i in range(4)]
        result = start*ratio**4
        return numeric(R, "Number Series",
                       f"What comes next? {', '.join(map(str,seq))}, ?", result,
                       f"Each term is multiplied by {ratio}; {seq[-1]}×{ratio}={result}.")
    generate("geometric series", 3, reasoning_geometric)

    def reasoning_letters():
        step = rng.randrange(2, 5)
        start = rng.randrange(0, 26 - 5*step)
        seq = [ALPHABET[start + i*step] for i in range(5)]
        result=ALPHABET[start+5*step]
        idx=ALPHABET.index(result)
        candidates=[ALPHABET[(idx+x)%26] for x in (-2,-1,1)]
        return add(R, "Alphabet Series",
                   f"Complete the letter series: {', '.join(seq)}, ?",
                   result,candidates,
                   f"Letters advance {step} places each step. After {seq[-1]} comes {result}.")
    generate("letter series", 4, reasoning_letters)

    def reasoning_rank():
        left,right = rng.randrange(3,60),rng.randrange(3,65)
        result = left+right-1
        return numeric(R, "Ranking & Order",
                       f"A student ranks {left}th from the left and {right}th from the right. How many students are there?",
                       result, f"Total = {left}+{right}−1 = {result}.")
    generate("ranking", 3, reasoning_rank)

    def reasoning_distance():
        scale = rng.randrange(2, 25)
        triple=rng.choice(((3,4,5),(5,12,13),(8,15,17),(7,24,25)))
        a,b,c=(x*scale for x in triple)
        return numeric(R,"Direction Sense",
                       f"A person walks {a} km east, then {b} km north. What is the shortest distance from the starting point?",
                       c, f"Using Pythagoras: √({a}²+{b}²) = {c} km.", " km")
    generate("direction", 3, reasoning_distance)

    def reasoning_coding():
        word=rng.choice(WORDS)
        shift = rng.randrange(1, 6)
        encoded="".join(ALPHABET[(ALPHABET.index(c)+shift)%26] for c in word)
        distractors=[
            "".join(ALPHABET[(ALPHABET.index(c)+shift+delta)%26] for c in word)
            for delta in (-1,1,2)
        ]
        return add(R, "Coding-Decoding",
                   f"In a code, each letter moves {shift} positions forward in the alphabet. How is {word} written?",
                   encoded,distractors,
                   f"Shift each letter of {word} forward by {shift} positions to obtain {encoded}.")
    generate("coding", 3, reasoning_coding)

    def reasoning_analogy():
        a,b = rng.sample(range(2, 45),2)
        result=b*b
        return numeric(R, "Analogy",
                       f"If {a} is related to {a*a}, then {b} is related to what number?",
                       result, f"The rule is squaring: {a}²={a*a}, so {b}²={result}.")
    generate("analogy", 3, reasoning_analogy)

    def reasoning_operations():
        a,b = rng.randrange(5,45),rng.randrange(5,45)
        multiply = rng.randrange(2,9)
        result=(a+b)*multiply
        return numeric(R, "Logical Operations",
                       f"If a ★ b means (a+b)×{multiply}, find {a} ★ {b}.",
                       result, f"Substitute a={a} and b={b} into the defined operation: ({a}+{b})×{multiply} = {result}.")
    generate("operations", 3, reasoning_operations)

    assert len(created) == 60, f"Expected 60 daily MCQs, got {len(created)}"
    counts = {M: sum(q["topic"] == M for q in created),
              R: sum(q["topic"] == R for q in created)}
    assert counts == {M:30,R:30}, counts
    assert len({q["question"] for q in created}) == 60
    invalid = [(q["id"], q["skill"], q["question"]) for q in created
               if not (len(q["options"]) == len(set(q["options"])) == 4
               and 0<=q["answer"]<4 and len(q["explanation"])>20)]
    assert not invalid, f"Invalid generated MCQs: {invalid[:5]}"
    for q in created:
        assert q["kind"] == "Original daily practice"
        assert re.fullmatch(r"daily-\d{8}-\d{3}",q["id"])
    archive = ARCHIVE / (today.isoformat()+".json")
    out = {"generatorVersion":generator_version,
           "date":today.isoformat(),
           "generatedAt":dt.datetime.now(IST).isoformat(),
           "timezone":"Asia/Kolkata","questionCount":len(created),
           "breakdown":counts,
           "kind":"Original daily practice",
           "description":"60 original exam-style Mathematics and Reasoning MCQs, freshly parameterised for today's date. These are not verified PYQs or current-affairs fact questions.",
           "questions":created}
    ARCHIVE.mkdir(parents=True,exist_ok=True)
    if archive.exists():
        # Keep answer keys stable within a day except when correcting a broken generator version.
        earlier = json.loads(archive.read_text(encoding="utf-8"))
        if earlier.get("generatorVersion") == generator_version:
            out = earlier
        else:
            archive.write_text(json.dumps(out,ensure_ascii=False,indent=2)+"\n",encoding="utf-8")
    else:
        archive.write_text(json.dumps(out,ensure_ascii=False,indent=2)+"\n",encoding="utf-8")
    LATEST.parent.mkdir(parents=True,exist_ok=True)
    LATEST.write_text(json.dumps(out,ensure_ascii=False,indent=2)+"\n",encoding="utf-8")
    # Compatibility for the existing Floot app: its News tab already reads
    # "questions" from news.json. Keep original headline reading exercises
    # separately and supply the 60 new practice MCQs there until the Floot
    # UI can be updated. This changes data, not the published app code.
    news_path = ROOT / "data" / "news.json"
    if news_path.exists():
        news = json.loads(news_path.read_text(encoding="utf-8"))
        if isinstance(news, dict):
            original = [q for q in news.get("questions", [])
                        if isinstance(q,dict) and q.get("kind") == "headline-classification"]
            if original:
                news["headlineReadingQuestions"] = original
            news["questions"] = out["questions"]
            news["dailyQuestionDate"] = out["date"]
            news["dailyQuestionCount"] = len(out["questions"])
            news["dailyQuestionLabel"] = "60 original daily Maths and Reasoning MCQs — not verified PYQs"
            news_path.write_text(json.dumps(news,ensure_ascii=False,indent=2)+"\n",encoding="utf-8")
            print("Updated Floot-compatible news quiz feed with 60 new daily MCQs")
    print(f"Created {len(out['questions'])} daily MCQs for {out['date']}: {out['breakdown']}")
    print("Original numerical/logic questions only; no claimed official PYQs or generated current-affairs facts.")

if __name__ == "__main__":
    main()
