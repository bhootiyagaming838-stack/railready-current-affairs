#!/usr/bin/env python3
"""Generate a Windows ICO containing a 256 x 256 PNG, no extra dependencies."""
import pathlib
import runpy
import struct

ROOT = pathlib.Path(__file__).resolve().parents[1]
maker = runpy.run_path(str(ROOT / "scripts" / "generate_icons.py"))
maker["icon"](256)
png = (ROOT / "icon-256.png").read_bytes()
assert png[:8] == b"\x89PNG\r\n\x1a\n"
target = ROOT / "desktop"
(target / "icon.png").write_bytes(png)
# In ICO format, width/height value 0 represents 256 pixels.
header = struct.pack("<HHH", 0, 1, 1)
entry = struct.pack("<BBBBHHII", 0, 0, 0, 0, 1, 32, len(png), 6 + 16)
(target / "icon.ico").write_bytes(header + entry + png)
print("Generated Windows 256x256 icon.ico", len(header + entry + png), "bytes")
