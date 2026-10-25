#!/usr/bin/env bash
# Capture ONE window by owner name into a PNG (window-only, no desktop, no other windows).
# Usage: docs/capture/capture-window.sh <owner-substring> <out.png>
# Needs macOS Screen Recording permission for the terminal app that runs it
# (System Settings > Privacy & Security > Screen Recording). Without it the PNG is the wallpaper/blank.
set -euo pipefail
here="$(cd "$(dirname "$0")" && pwd)"
[ -x "$here/winid" ] || swiftc -O "$here/winid.swift" -o "$here/winid"
id="$("$here/winid" "$1" | head -1 | cut -f1)"
[ -n "$id" ] || { echo "no window matching '$1'"; "$here/winid"; exit 2; }
screencapture -x -o -l "$id" "$2"
echo "captured window $id -> $2"
