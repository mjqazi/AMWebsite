#!/usr/bin/env python3
"""Notify IndexNow of deployed canonical URLs; receipt is not indexing proof."""
import argparse
import json
from pathlib import Path
from urllib.request import Request, urlopen

ROOT = Path(__file__).resolve().parents[1]


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument('--dry-run', action='store_true')
    args = parser.parse_args()
    config = json.loads((ROOT / 'tools/indexnow.json').read_text(encoding='utf-8'))
    host, filename = config['host'], config['keyFile']
    key = (ROOT / filename).read_text(encoding='utf-8').strip()
    if host != 'advancedmechanix.com' or filename != key + '.txt':
        raise ValueError('IndexNow host/key file mismatch')
    pages = json.loads((ROOT / 'tools/seo-pages.json').read_text(encoding='utf-8'))
    base = 'https://' + host
    urls = [base + ('/' if name == 'index.html' else '/' + name.replace('index.html', '')) for name in pages]
    payload = {'host': host, 'key': key, 'keyLocation': base + '/' + filename, 'urlList': urls}
    if args.dry_run:
        print(json.dumps({'host': host, 'canonicalUrls': len(urls), 'dryRun': True}))
        return
    # A notification must follow deployment, after the public proof file is live.
    with urlopen(payload['keyLocation'], timeout=30) as response:
        if response.read().decode('utf-8').strip() != key:
            raise ValueError('Deployed IndexNow verification file differs from local file')
    request = Request('https://api.indexnow.org/indexnow',
                      data=json.dumps(payload).encode('utf-8'),
                      headers={'Content-Type': 'application/json; charset=utf-8'}, method='POST')
    with urlopen(request, timeout=60) as response:
        status = response.status
        if status not in (200, 202):
            raise RuntimeError(f'Unexpected IndexNow response: {status}')
    print(json.dumps({'submittedUrls': len(urls), 'httpStatus': status,
                      'result': 'Received; indexing is determined by search engines'}))


if __name__ == '__main__':
    main()
