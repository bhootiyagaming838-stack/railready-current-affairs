#!/usr/bin/env python3
"""Fetch recent headlines for revision; never invent questions or answers."""
import datetime as dt
import json
import pathlib
import urllib.parse
import urllib.request
import xml.etree.ElementTree as ET
from email.utils import parsedate_to_datetime

ROOT=pathlib.Path(__file__).resolve().parents[1]
OUT=ROOT/"data"/"news.json"
QUERIES=[
 ("Railways","Indian Railways PIB government news"),
 ("Government Schemes","India government scheme PIB ministry"),
 ("Economy","RBI India economy official government"),
 ("Science","ISRO India science official"),
 ("Assam & Northeast","Assam northeast India government development")
]
def fetch(topic,query):
 url="https://news.google.com/rss/search?q="+urllib.parse.quote(query+" when:3d")+"&hl=en-IN&gl=IN&ceid=IN:en"
 req=urllib.request.Request(url,headers={"User-Agent":"RailReadyNewsBot/1.0 (educational personal project)"})
 with urllib.request.urlopen(req,timeout=25) as response: root=ET.fromstring(response.read())
 results=[]
 for item in root.findall("./channel/item")[:6]:
  title=(item.findtext("title") or "").strip()
  link=(item.findtext("link") or "").strip()
  rawdate=item.findtext("pubDate") or ""
  try: day=parsedate_to_datetime(rawdate).date().isoformat()
  except (TypeError,ValueError): continue
  if not title or not link.startswith("https://"): continue
  results.append({"topic":topic,"headline":title,"date":day,"source":link,"summary":"Read the linked report and note the key facts. This is a news headline, not a verified exam question."})
 return results
def main():
 previous={}
 if OUT.exists():
  try: previous=json.loads(OUT.read_text(encoding="utf-8"))
  except (ValueError,OSError): pass
 notes=[]
 for topic,query in QUERIES:
  try: notes.extend(fetch(topic,query))
  except Exception as exc: print("Warning:",topic,str(exc))
 seen=set()
 unique=[]
 for note in notes:
  key=note["headline"].lower()
  if key not in seen: unique.append(note);seen.add(key)
 if not unique:
  if previous.get("notes"): print("No new data; retaining previous notes");return
  raise RuntimeError("No news fetched; refusing to publish an empty update")
 OUT.parent.mkdir(parents=True,exist_ok=True)
 OUT.write_text(json.dumps({"updatedAt":dt.datetime.now(dt.timezone.utc).isoformat(),"notes":unique[:25],"kind":"headline-feed","disclaimer":"Headlines are automatically collected from news search results. Verify claims with the original publisher; this feed does not auto-generate verified MCQs."},ensure_ascii=False,indent=2)+"\n",encoding="utf-8")
 print("Saved",len(unique[:25]),"headlines")
if __name__=="__main__":main()
