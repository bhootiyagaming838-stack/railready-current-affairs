#!/usr/bin/env python3
"""Generate a Windows ICO from the existing png icon without extra dependencies."""
import pathlib
import struct
ROOT=pathlib.Path(__file__).resolve().parents[1]
png=(ROOT/"icon-192.png").read_bytes()
assert png[:8]==b"\x89PNG\r\n\x1a\n"
target=ROOT/"desktop"
(target/"icon.png").write_bytes(png)
# ICO directory with one embedded 192 x 192 PNG icon.
header=struct.pack("<HHH",0,1,1)
entry=struct.pack("<BBBBHHII",192,192,0,0,1,32,len(png),6+16)
(target/"icon.ico").write_bytes(header+entry+png)
print("Generated icon.ico",len(header+entry+png),"bytes")
