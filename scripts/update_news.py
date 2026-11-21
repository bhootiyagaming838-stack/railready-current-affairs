#!/usr/bin/env python3
"""Collect sourced news headlines for RRB NTPC; preserve a searchable archive.

This script NEVER invents news claims or factual multiple-choice answers.
Practice questions concern headline category recognition only.
"""
import datetime as dt
import json
import pathlib
import re
import urllib.parse
import urllib.request
import xml.etree.ElementTree as ET
from email.utils import parsedate_to_datetime

ROOT=pathlib.Path(__file__).resolve().parents[1]
OUT=ROOT/"data"/"news.json"
QUERIES=[
 ("Railways", '"Indian Railways" OR "Vande Bharat" OR "bullet train" site:pib.gov.in'),
 ("Government Schemes", '"government scheme" OR "PM Yojana" OR SVAMITVA site:pib.gov.in'),
 ("Economy", 'RBI OR economy OR manufacturing OR exports site:pib.gov.in'),
 ("Science", 'ISRO OR satellite OR science OR space site:pib.gov.in'),
 ("Awards & Sports", 'sports OR award OR medal OR championship site:pib.gov.in'),
 ("National Affairs", 'Cabinet OR Parliament OR "President of India" site:pib.gov.in'),
]
KEYWORDS={
 "Railways":r'railway|railways|rail coach|bullet train|high.speed rail|vande bharat|locomotive|train service|rail corridor|rail station',
 "Government Schemes":r'\bscheme\b|\bmission\b|yojana|svamitva|panchayat|beneficiar|welfare|social security',
 "Economy":r'econom|\bRBI\b|reserve bank|\bGDP\b|inflation|manufactur|export|industry|\bMSME\b|investment|fiscal|financial',
 "Science":r'\bISRO\b|satellite|\bspace\b|\bscience\b|research|gaganyaan|nuclear|scientist|technology',
 "Awards & Sports":r'\bsport\b|cricket|olympic|medal|championship|tournament|athlete|\baward\b|\bprize\b',
 "National Affairs":r'\bcabinet\b|parliament|president|prime minister|government|policy|national|\bIndia\b|\bIndian\b|ministry',
}

def category(title):
 for topic,pattern in KEYWORDS.items():
  if re.search(pattern,title,re.I): return topic
 return None

def fetch(topic,query):
 url="https://news.google.com/rss/search?q="+urllib.parse.quote(query+" when:7d")+"&hl=en-IN&gl=IN&ceid=IN:en"
 req=urllib.request.Request(url,headers={"User-Agent":"Mozilla/5.0 RailReady/1.0 educational project"})
 with urllib.request.urlopen(req,timeout=22) as resp: root=ET.fromstring(resp.read())
 results=[]
 for item in root.findall("./channel/item")[:25]:
  title=(item.findtext("title") or "").strip()
  source=(item.findtext("link") or "").strip()
  publisher=(item.findtext("source") or "").strip()
  try: date=parsedate_to_datetime(item.findtext("pubDate") or "").date().isoformat()
  except (TypeError,ValueError): continue
  if not title or not source.startswith("https://"): continue
  if " - " in title: title=title.rsplit(" - ",1)[0].strip()
  c=category(title)
  if not c: continue
  # Keep relevant categorized news, not an unrelated result from a broad search.
  if topic!="National Affairs" and c!=topic: continue
  if topic=="National Affairs" and c!="National Affairs": continue
  results.append({"topic":c,"headline":title,"date":date,"source":source,
                  "publisher":publisher or "News result",
                  "summary":"Source-linked headline. Open the original report to review the full facts."})
 return results

def make_quiz(notes):
 quiz=[]
 categories=list(KEYWORDS)
 for i,n in enumerate(notes):
  distractors=[cat for cat in categories if cat!=n["topic"]]
  options=[n["topic"]]+distractors[:3]
  shift=i%4
  options=options[shift:]+options[:shift]
  quiz.append({"id":"headline-"+n["date"]+"-"+str(i),
   "question":"Which news category best fits this headline? "+n["headline"],
   "options":options,"answer":options.index(n["topic"]),
   "explanation":"This headline is categorized as "+n["topic"]+". Check the linked report for details.",
   "topic":"News Reading Practice","date":n["date"],"source":n["source"],"kind":"headline-classification"})
 return quiz[:40]

def main():
 previous={}
 if OUT.exists():
  try: previous=json.loads(OUT.read_text(encoding="utf-8"))
  except (ValueError,OSError): pass
 collected=[]
 for topic,query in QUERIES:
  try:
   found=fetch(topic,query)
   collected.extend(found)
   print(topic, len(found),"relevant headlines")
  except Exception as exc: print("Warning:",topic,str(exc))
 recent_floor=(dt.datetime.now(dt.timezone.utc).date()-dt.timedelta(days=45)).isoformat()
 older=[x for x in previous.get("notes",[]) if isinstance(x,dict) and x.get("date","")>=recent_floor
        and x.get("topic")!="Assam & Northeast"
        and category(x.get("headline",""))==x.get("topic")]
 merged=sorted(collected+older,key=lambda x:x.get("date",""),reverse=True)
 seen=set()
 notes=[]
 for item in merged:
  norm=re.sub(r'\W+','',item["headline"].lower())
  if norm in seen: continue
  seen.add(norm);notes.append(item)
 if not notes:
  if older:
   print("No new data; retaining archived headlines")
   return
  raise RuntimeError("No news available; refusing to publish an empty feed")
 notes=notes[:120]
 OUT.parent.mkdir(parents=True,exist_ok=True)
 OUT.write_text(json.dumps({
  "updatedAt":dt.datetime.now(dt.timezone.utc).isoformat(),
  "notes":notes,"questions":make_quiz(notes),"kind":"headline-feed",
  "disclaimer":"Automatic headlines and classification exercises are not verified factual exam questions. Review linked reports."
 },ensure_ascii=False,indent=2)+"\n",encoding="utf-8")
 print("Saved",len(notes),"headlines and",min(40,len(notes)),"reading exercises")
if __name__=="__main__":main()
