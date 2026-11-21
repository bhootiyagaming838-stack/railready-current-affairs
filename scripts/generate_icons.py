#!/usr/bin/env python3
"""Create installable Android PWA icons using Python standard library only."""
import math
import struct
import zlib
from pathlib import Path

ROOT=Path(__file__).resolve().parents[1]
GLYPH=[
 "11110",
 "10001",
 "10001",
 "11110",
 "10100",
 "10010",
 "10001",
]
def chunk(kind,payload):
    data=kind+payload
    return struct.pack(">I",len(payload))+data+struct.pack(">I",zlib.crc32(data)&0xffffffff)
def icon(n):
    rows=[]
    r=n*0.17
    scale=max(1,round(n*0.077))
    w=5*scale
    h=7*scale
    left=(n-w)//2
    top=(n-h)//2
    for y in range(n):
        line=bytearray([0])
        for x in range(n):
            # Subtle rounded tile background, avoiding transparency for easier adaptive icons.
            bg=(23,108,85,255)
            if x<r and y<r and (x-r)**2+(y-r)**2>r*r:bg=(17,78,61,255)
            if x>n-r and y<r and (x-(n-r))**2+(y-r)**2>r*r:bg=(17,78,61,255)
            if x<r and y>n-r and (x-r)**2+(y-(n-r))**2>r*r:bg=(17,78,61,255)
            if x>n-r and y>n-r and (x-(n-r))**2+(y-(n-r))**2>r*r:bg=(17,78,61,255)
            cellx=(x-left)//scale
            celly=(y-top)//scale
            if 0<=cellx<5 and 0<=celly<7 and GLYPH[celly][cellx]=="1" and left<=x<left+w and top<=y<top+h:
                bg=(252,251,240,255)
            if (x-n*.78)**2+(y-n*.20)**2<(n*.065)**2:
                bg=(230,182,87,255)
            line.extend(bg)
        rows.append(bytes(line))
    raw=b"".join(rows)
    png=b"\x89PNG\r\n\x1a\n"+chunk(b"IHDR",struct.pack(">IIBBBBB",n,n,8,6,0,0,0))+chunk(b"IDAT",zlib.compress(raw,9))+chunk(b"IEND",b"")
    (ROOT/("icon-"+str(n)+".png")).write_bytes(png)
for n in (192,512):
    icon(n)
print("Generated 192px and 512px PWA icons.")
