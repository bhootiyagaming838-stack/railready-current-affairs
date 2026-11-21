#!/usr/bin/env python3
"""Independently recompute the correct option of every generated daily MCQ."""
import json, math, pathlib, re

root=pathlib.Path(__file__).resolve().parents[1]
data=json.loads((root/"data/daily-mcqs.json").read_text(encoding="utf-8"))
questions=data["questions"]
ABC="ABCDEFGHIJKLMNOPQRSTUVWXYZ"
passed=0
def numbers(s):
    return [int(n) for n in re.findall(r"\d+",s)]
def correct(q):
    return q["options"][q["answer"]]
def value(q):
    m=re.match(r"^(\d+)",correct(q))
    assert m, f"Not a numerical answer: {q['id']} -> {correct(q)}"
    return int(m.group(1))
def verify(q):
    t=q["topic"]
    s=q["skill"]
    question=q["question"]
    ns=numbers(question)
    if t=="Mathematics":
        if s=="Percentages" and question.startswith("Find"):
            p,n=ns[:2];return value(q)==p*n/100
        if s=="Percentages":
            price,p=ns[:2];return value(q)==price*(100+p)/100
        if s=="Profit, Loss & Discount":
            price,p=ns[:2];return value(q)==price*(100-p)/100
        if s=="Averages":
            a,b,c=ns[:3];return value(q)==(a+b+c)/3
        if s=="Ratio & Proportion":
            a,b,total=ns[:3];return value(q)==a*total/(a+b)
        if s=="Simple Interest":
            principal,rate,years=ns[:3];return value(q)==principal*rate*years/100
        if s=="Algebra":
            a,b,c=ns[:3];return (c-b)%a==0 and value(q)==(c-b)//a
        if s=="Speed, Time & Distance":
            speed,hours=ns[:2];return value(q)==speed*hours
        if s=="Mensuration":
            length,width=ns[:2];return value(q)==length*width
        if s=="Number System":
            a,b=ns[:2];expected=math.gcd(a,b) if "HCF" in question else math.lcm(a,b)
            return value(q)==expected
        if s=="Time & Work":
            a,b=ns[:2];return value(q)==a*b/(a+b)
    if t=="Reasoning":
        if s=="Number Series":
            values=numbers(question)
            if len(values)==5 and len(set([b-a for a,b in zip(values,values[1:])]))==1:
                return value(q)==values[-1]+(values[-1]-values[-2])
            if all(math.isqrt(v)**2==v for v in values):
                roots=[math.isqrt(v) for v in values]
                if all(b-a==1 for a,b in zip(roots,roots[1:])):
                    return value(q)==(roots[-1]+1)**2
            if all(values[i] and values[i+1]%values[i]==0 for i in range(len(values)-1)):
                ratios=[values[i+1]//values[i] for i in range(len(values)-1)]
                if len(set(ratios))==1:return value(q)==values[-1]*ratios[0]
            raise AssertionError(f"Unrecognized numerical series {question}")
        if s=="Alphabet Series":
            letters=re.search(r": ([A-Z], [A-Z], [A-Z], [A-Z], [A-Z]), \?$",question).group(1).split(", ")
            positions=[ABC.index(x) for x in letters]
            step=(positions[-1]-positions[-2])%26
            return all((b-a)%26==step for a,b in zip(positions,positions[1:])) and correct(q)==ABC[(positions[-1]+step)%26]
        if s=="Ranking & Order":
            left,right=ns[:2];return value(q)==left+right-1
        if s=="Direction Sense":
            a,b=ns[:2];return value(q)**2==a*a+b*b
        if s=="Coding-Decoding":
            shift=ns[0];word=re.search(r"How is ([A-Z]+) written",question).group(1)
            expected="".join(ABC[(ABC.index(x)+shift)%26] for x in word)
            return correct(q)==expected
        if s=="Analogy":
            a,aa,b=ns[:3];return aa==a*a and value(q)==b*b
        if s=="Logical Operations":
            # Defined (a+b) times multiplier, followed by concrete example.
            mult,a,b=ns[:3];return value(q)==(a+b)*mult
    raise AssertionError(f"No independent verification for {q['id']} {t} {s}")
for q in questions:
    try: verified=verify(q)
    except Exception as e:raise AssertionError(f"Could not verify {q['id']} {q['question']}") from e
    assert verified, f"Wrong answer: {q['id']} {q['question']}, marked {correct(q)}"
    passed+=1
assert passed==60
print(f"PASS: All {passed} daily MCQ correct options independently recomputed for {data['date']}")
