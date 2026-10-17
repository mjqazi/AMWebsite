#!/usr/bin/env python3
"""Preserve reviewed legacy URLs on static GitHub Pages with instant redirects."""
from html import escape
import json
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]


def main():
    redirects = json.loads((ROOT / 'tools/legacy-redirects.json').read_text(encoding='utf-8'))
    pages = json.loads((ROOT / 'tools/seo-pages.json').read_text(encoding='utf-8'))
    canonical = {'/' if name == 'index.html' else '/' + name.replace('index.html', '') for name in pages}
    changed = 0
    for source, target in redirects.items():
        if not source.startswith('/') or target not in canonical or source in canonical:
            raise ValueError(f'Unsafe or noncanonical redirect: {source} -> {target}')
        destination = (ROOT / source.strip('/') / 'index.html').resolve()
        if ROOT not in destination.parents:
            raise ValueError(f'Redirect escapes site root: {source}')
        current = destination.read_text(encoding='utf-8') if destination.exists() else ''
        if current and 'noindex' not in current:
            raise ValueError(f'Refusing to overwrite a content page: {source}')
        url = escape('https://advancedmechanix.com' + target, quote=True)
        content = ('<!doctype html><html lang="en"><head><meta charset="utf-8">'
                   '<meta name="robots" content="noindex, follow">'
                   f'<meta http-equiv="refresh" content="0; url={url}">'
                   f'<link rel="canonical" href="{url}"><title>Page moved | Advanced Mechanix</title>'
                   f'</head><body><p>This page has moved. <a href="{url}">Continue to Advanced Mechanix</a>.</p></body></html>\n')
        if current != content:
            destination.parent.mkdir(parents=True, exist_ok=True)
            destination.write_text(content, encoding='utf-8')
            changed += 1
    print(f'Synchronised {len(redirects)} reviewed legacy redirects; {changed} changed.')


if __name__ == '__main__':
    main()
