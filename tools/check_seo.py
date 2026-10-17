#!/usr/bin/env python3
"""Guard content/metadata parity, crawl coverage and industrial positioning."""
from html import unescape
from html.parser import HTMLParser
from pathlib import Path
from urllib.parse import urlsplit, urljoin
import json
import re
import urllib.robotparser
import xml.etree.ElementTree as ET
from sync_seo import BASE, ORG_ID, ROOT, VisibleContent


class Head(HTMLParser):
    def __init__(self, source):
        super().__init__()
        self.meta = {}
        self.canonicals = []
        self.links = []
        self.feed(source)

    def handle_starttag(self, tag, attrs):
        values = dict(attrs)
        if tag == 'a' and values.get('href'):
            self.links.append(values['href'])
        if tag == 'meta':
            key = values.get('name', values.get('property'))
            if key:
                self.meta.setdefault(key, []).append(values.get('content', ''))
        if tag == 'link' and values.get('rel') == 'canonical':
            self.canonicals.append(values.get('href'))


def main():
    errors = []
    pages = json.loads((ROOT / 'tools/seo-pages.json').read_text(encoding='utf-8'))
    expected = {BASE + ('/' if name == 'index.html' else '/' + name.replace('index.html', '')) for name in pages}
    titles = {}
    descriptions = {}
    faq_count = 0
    links = {}
    for filename, config in pages.items():
        source = (ROOT / filename).read_text(encoding='utf-8')
        head = Head(source)
        title = unescape(re.search(r'<title>(.*?)</title>', source, re.S)[1]).strip()
        canonical = BASE + ('/' if filename == 'index.html' else '/' + filename.replace('index.html', ''))
        links[canonical] = {urljoin(canonical, href).split('#')[0].split('?')[0] for href in head.links}
        if head.canonicals != [canonical]:
            errors.append(f'{filename}: canonical must match the public URL')
        if title != config['title'] or title in titles:
            errors.append(f'{filename}: title is stale or duplicated')
        titles[title] = filename
        description = config['description']
        if description in descriptions:
            errors.append(f'{filename}: duplicate meta description')
        descriptions[description] = filename
        for name, value in [('description', description), ('og:title', title),
                            ('og:description', description), ('og:url', canonical),
                            ('twitter:title', title), ('twitter:description', description)]:
            if head.meta.get(name) != [value]:
                errors.append(f'{filename}: missing, duplicate or inconsistent {name}')
        if 'noindex' in ' '.join(head.meta.get('robots', [])).lower():
            errors.append(f'{filename}: indexable page blocked by meta robots')
        if re.search(r'(?:src|href)="http://', source):
            errors.append(f'{filename}: insecure linked asset or destination')
        schemas = re.findall(r'<script\b[^>]*type="application/ld\+json"[^>]*>(.*?)</script>', source, re.S)
        graph = [node for block in schemas for node in json.loads(block).get('@graph', [])]
        visible = VisibleContent(source).faqs
        structured = [node for node in graph if node.get('@type') == 'FAQPage']
        if len(structured) != bool(visible):
            errors.append(f'{filename}: visible FAQ/schema presence mismatch')
        elif visible:
            actual = [(item['name'], item['acceptedAnswer']['text']) for item in structured[0]['mainEntity']]
            if actual != visible:
                errors.append(f'{filename}: schema answers differ from visible FAQ content')
            faq_count += len(visible)
        organizations = [node for node in graph if node.get('@type') == 'Organization']
        if not organizations or any(node.get('@id') != ORG_ID for node in organizations):
            errors.append(f'{filename}: inconsistent company entity')
        if any(node.get('@type') == 'LocalBusiness' for node in graph):
            errors.append(f'{filename}: unsubstantiated staffed-office schema')
        if re.search(r'"(?:numberOfEmployees|hasCredential|aggregateRating)"', '\n'.join(schemas)):
            errors.append(f'{filename}: unsubstantiated credential, headcount or rating markup')
    reached, pending = set(), [BASE + '/']
    while pending:
        url = pending.pop()
        if url in reached or url not in expected:
            continue
        reached.add(url)
        pending.extend(links.get(url, set()) - reached)
    for url in sorted(expected - reached):
        errors.append(f'Indexable page unreachable through internal links: {url}')
    listed = []
    for group in ('main', 'services', 'industries', 'insights'):
        listed.extend(node.text for node in ET.parse(ROOT / f'sitemap-{group}.xml').getroot().iter('{http://www.sitemaps.org/schemas/sitemap/0.9}loc'))
    if set(listed) != expected or len(listed) != len(expected):
        errors.append('Sitemap inventory differs from indexable canonical URLs or contains duplicates')
    for node in ET.parse(ROOT / 'sitemap-images.xml').getroot().iter('{http://www.google.com/schemas/sitemap-image/1.1}loc'):
        if not (ROOT / urlsplit(node.text).path.lstrip('/')).is_file():
            errors.append(f'Missing sitemap image: {node.text}')
    directory = (ROOT / 'llms.txt').read_text(encoding='utf-8')
    for url in re.findall(r'\]\((https://[^)]+)\)', directory):
        if url not in expected:
            errors.append(f'AI directory URL is not canonical/indexable: {url}')
    if re.search(r'solar permit|first drawing free|3-5 business|500 kV', directory, re.I):
        errors.append('AI directory contains retired positioning or scope promises')
    robots = urllib.robotparser.RobotFileParser()
    robots.parse((ROOT / 'robots.txt').read_text(encoding='utf-8').splitlines())
    for bot in ('Googlebot', 'Bingbot', 'OAI-SearchBot'):
        for url in expected:
            if not robots.can_fetch(bot, url):
                errors.append(f'{bot} blocked from {url}')
    print(json.dumps({'indexablePages': len(pages), 'visibleFaqAnswers': faq_count,
                      'uniqueSitemapUrls': len(set(listed)), 'errors': errors}, indent=2))
    raise SystemExit(bool(errors))


if __name__ == '__main__':
    main()
