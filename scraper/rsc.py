"""Minimal parser for Next.js App Router (React Server Components) payloads.

Public ApplyBoard pages are server-rendered with Next.js; their data lives in
`self.__next_f.push([1, "..."])` script chunks. Concatenated, those chunks form
a stream of records:

    <hex id>:<JSON value>            e.g.  5a:["$","div",null,{...}]
    <hex id>:T<hex length>,<text>    a raw text block (HTML descriptions)
    <hex id>:I[...] / HL[...]        module / hint records (ignored)

JSON values point at other records with "$<hex id>" strings, which
`resolve()` follows so callers get plain nested Python data.
"""

from __future__ import annotations

import json
import re

_CHUNK_RE = re.compile(r'self\.__next_f\.push\(\[1,"((?:[^"\\]|\\.)*)"\]\)')
_RECORD_RE = re.compile(r"([0-9a-f]+):")


def payload(html: str) -> str:
    return "".join(json.loads(f'"{c}"') for c in _CHUNK_RE.findall(html))


def records(stream: str) -> dict[str, object]:
    out: dict[str, object] = {}
    pos, n = 0, len(stream)
    while pos < n:
        m = _RECORD_RE.match(stream, pos)
        if not m:
            nl = stream.find("\n", pos)
            if nl == -1:
                break
            pos = nl + 1
            continue
        rid, pos = m.group(1), m.end()
        if stream.startswith("T", pos):
            comma = stream.index(",", pos)
            length = int(stream[pos + 1:comma], 16)
            # length is in UTF-8 bytes
            start = comma + 1
            raw = stream[start:].encode("utf-8")[:length].decode("utf-8", "ignore")
            out[rid] = raw
            pos = start + len(raw)
            continue
        nl = stream.find("\n", pos)
        line = stream[pos:] if nl == -1 else stream[pos:nl]
        pos = n if nl == -1 else nl + 1
        if line[:1] in "[{\"" or line[:1].isdigit() or line in ("null", "true", "false"):
            try:
                out[rid] = json.loads(line)
            except ValueError:
                pass
    return out


def resolve(value, recs: dict, depth: int = 0):
    if depth > 60:
        return value
    if isinstance(value, str) and value.startswith("$") and len(value) > 1:
        key = value[1:]
        if key.startswith("L"):
            key = key[1:]
        if key in recs:
            return resolve(recs[key], recs, depth + 1)
        return None if value in ("$undefined",) else value
    if isinstance(value, list):
        return [resolve(v, recs, depth + 1) for v in value]
    if isinstance(value, dict):
        return {k: resolve(v, recs, depth + 1) for k, v in value.items()}
    return value


def walk(node):
    """Yield every dict/list node in a resolved tree."""
    stack = [node]
    while stack:
        cur = stack.pop()
        yield cur
        if isinstance(cur, dict):
            stack.extend(cur.values())
        elif isinstance(cur, list):
            stack.extend(cur)


def text_of(node) -> str:
    """Flatten rendered React children (["$","tag",key,{children}]) to text."""
    if node is None or isinstance(node, bool):
        return ""
    if isinstance(node, (str, int, float)):
        s = str(node)
        return "" if s.startswith("$") else s
    if isinstance(node, list):
        if len(node) == 4 and node[0] == "$" and isinstance(node[3], dict):
            return text_of(node[3].get("children"))
        return "".join(text_of(n) for n in node)
    if isinstance(node, dict):
        return text_of(node.get("children"))
    return ""
