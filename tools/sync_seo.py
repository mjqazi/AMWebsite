#!/usr/bin/env python3
"""Synchronise metadata, company facts and visible FAQ markup.

Run after editing copy: python tools/sync_seo.py
No third-party packages or build step are required by GitHub Pages.
"""
from html import escape, unescape
from html.parser import HTMLParser
from pathlib import Path
import json
import re
from urllib.parse import urlsplit, urlunsplit

ROOT = Path(__file__).resolve().parents[1]
BASE = 'https://advancedmechanix.com'
ORG_ID = BASE + '/#organization'
MODIFIED = '2026-10-17'
VOID = {'area', 'base', 'br', 'col', 'embed', 'hr', 'img', 'input',
        'link', 'meta', 'param', 'source', 'track', 'wbr'}
ORGANIZATION = {
    '@type': 'Organization', '@id': ORG_ID, 'name': 'Advanced Mechanix',
    'url': BASE + '/', 'logo': BASE + '/images/am-logo-black-h88.png',
    'description': 'Industrial electrical design documentation, control panel drawings and coordinated plant models.',
    'email': 'company@advancedmechanix.com', 'telephone': '+1-408-412-0717',
    'address': {'@type': 'PostalAddress', 'streetAddress': '12478 San Bruno Cove',
                'addressLocality': 'San Diego', 'addressRegion': 'CA',
                'postalCode': '92130', 'addressCountry': 'US'},
}


class VisibleContent(HTMLParser):
    """Read real FAQ answers; never create schema-only marketing answers."""
    def __init__(self, source):
        super().__init__()
        self.stack = []
        self.faq = None
        self.question_depth = None
        self.answer_depth = None
        self.faqs = []
        self.feed(source)

    def handle_starttag(self, tag, attrs):
        if tag in VOID:
            return
        self.stack.append(tag)
        classes = dict(attrs).get('class', '').split()
        if 'faq-item' in classes:
            self.faq = {'depth': len(self.stack), 'question': [], 'answer': []}
        if self.faq and tag == 'summary':
            self.question_depth = len(self.stack)
        if self.faq and 'faq-body' in classes:
            self.answer_depth = len(self.stack)

    def handle_data(self, data):
        if self.faq and self.question_depth is not None:
            self.faq['question'].append(data)
        if self.faq and self.answer_depth is not None:
            self.faq['answer'].append(data)

    def handle_endtag(self, tag):
        if tag not in self.stack:
            return
        depth = len(self.stack) - self.stack[::-1].index(tag)
        if self.question_depth == depth:
            self.question_depth = None
        if self.answer_depth == depth:
            self.answer_depth = None
        if self.faq and self.faq['depth'] == depth:
            clean = lambda parts: re.sub(r'\s+', ' ', ' '.join(parts)).strip()
            question = re.sub(r'^\d+\s*', '', clean(self.faq['question']))
            answer = clean(self.faq['answer'])
            if question and answer:
                self.faqs.append((question, answer))
            self.faq = None
        self.stack = self.stack[:depth - 1]


def normalise_url(value):
    if not isinstance(value, str) or not value.startswith(BASE):
        return value
    parts = urlsplit(value)
    path = parts.path
    if path in ('/index.html', '/index'):
        path = '/'
    elif path and not Path(path).suffix and (ROOT / (path.lstrip('/') + '.html')).is_file():
        path += '.html'
    return urlunsplit((parts.scheme, parts.netloc, path, parts.query, parts.fragment))


def sync_schema(source, canonical, metadata, faqs):
    def rewrite(value):
        if isinstance(value, list):
            return [node for item in value if (node := rewrite(item)) is not None]
        if not isinstance(value, dict):
            return value
        kind = value.get('@type')
        if kind in ('LocalBusiness', 'FAQPage'):
            return None
        if kind == 'Organization' and value.get('name', 'Advanced Mechanix') == 'Advanced Mechanix':
            return ORGANIZATION.copy()
        if kind == 'Organization' and value.get('name') == 'OptiScheduleAI':
            # The industrial data page no longer makes a sister-product offer.
            return None
        if kind == 'Person' and ('Junaid' in value.get('name', '') or 'junaid-qazi' in value.get('@id', '')):
            return {'@type': 'Person', '@id': BASE + '/authors/junaid-qazi.html#person',
                    'name': 'Junaid Qazi', 'url': BASE + '/authors/junaid-qazi.html',
                    'jobTitle': 'Founder', 'worksFor': {'@id': ORG_ID}}
        result = {}
        for key, item in value.items():
            if key in ('offers', 'aggregateRating', 'review', 'numberOfEmployees',
                       'foundingDate', 'openingHoursSpecification', 'priceRange', 'geo'):
                continue
            updated = rewrite(item)
            if updated is not None:
                result[key] = normalise_url(updated) if key in ('@id', 'url', 'item', 'mainEntityOfPage') else updated
        if kind in ('ProfessionalService', 'Service'):
            result.update({'@type': 'Service', 'name': metadata['title'],
                           'description': metadata['description'], 'url': canonical,
                           'provider': {'@id': ORG_ID}})
            result.pop('serviceType', None)
            result.pop('areaServed', None)
        if kind in ('Article', 'BlogPosting', 'TechArticle'):
            result.update({'headline': metadata['title'], 'description': metadata['description'],
                           'mainEntityOfPage': canonical, 'dateModified': MODIFIED,
                           'author': {'@id': ORG_ID}, 'publisher': {'@id': ORG_ID}})
            # A modification date is real; inherited publication dates were not substantiated.
            result.pop('datePublished', None)
        if kind == 'WebApplication':
            result.update({'name': metadata['title'], 'description': metadata['description'],
                           'url': canonical, 'applicationCategory': 'BusinessApplication',
                           'operatingSystem': 'Web browser'})
            result.pop('featureList', None)
        if kind == 'BreadcrumbList' and result.get('itemListElement'):
            result['itemListElement'][-1]['name'] = metadata['title'].split(' | ')[0]
        return result

    graphs = []
    for match in re.finditer(r'<script\b[^>]*type="application/ld\+json"[^>]*>(.*?)</script>', source, re.S):
        data = json.loads(match.group(1))
        nodes = data.get('@graph', [data])
        graphs.extend(node for item in nodes if (node := rewrite(item)) is not None)
    if not any(node.get('@type') == 'Organization' for node in graphs):
        graphs.insert(0, ORGANIZATION.copy())
    if faqs:
        graphs.append({'@type': 'FAQPage', '@id': canonical + '#faq', 'mainEntity': [
            {'@type': 'Question', 'name': question,
             'acceptedAnswer': {'@type': 'Answer', 'text': answer}}
            for question, answer in faqs]})
    block = '<script type="application/ld+json">\n' + json.dumps(
        {'@context': 'https://schema.org', '@graph': graphs}, ensure_ascii=False, indent=2) + '\n</script>'
    source = re.sub(r'<script\b[^>]*type="application/ld\+json"[^>]*>.*?</script>\s*', '', source, flags=re.S)
    return source.replace('</head>', block + '\n</head>', 1)


def main():
    manifest = json.loads((ROOT / 'tools/seo-pages.json').read_text(encoding='utf-8'))
    changed = 0
    for filename, metadata in manifest.items():
        path = ROOT / filename
        original = path.read_text(encoding='utf-8')
        source = original
        canonical = BASE + ('/' if filename == 'index.html' else '/' + filename.replace('index.html', ''))
        source = re.sub(r'<title>.*?</title>', '<title>' + escape(metadata['title']) + '</title>', source, count=1, flags=re.S)
        tags = {'description': metadata['description'], 'og:title': metadata['title'],
                'og:description': metadata['description'], 'og:url': canonical,
                'twitter:title': metadata['title'], 'twitter:description': metadata['description'],
                'robots': 'index, follow, max-image-preview:large'}
        for name, content in tags.items():
            attribute = 'property' if name.startswith('og:') else 'name'
            tag = f'<meta {attribute}="{name}" content="{escape(content, quote=True)}">'
            pattern = r'<meta\b[^>]*(?:name|property)="' + re.escape(name) + r'"[^>]*>'
            if re.search(pattern, source):
                source = re.sub(pattern, lambda m: tag, source, count=1)
            else:
                source = source.replace('</head>', tag + '\n</head>', 1)
        source = re.sub(r'<link\b[^>]*rel="canonical"[^>]*>',
                        '<link rel="canonical" href="' + canonical + '">', source, count=1)
        source = sync_schema(source, canonical, metadata, VisibleContent(source).faqs)
        if source != original:
            path.write_text(source, encoding='utf-8')
            changed += 1
    print(f'Synchronised SEO metadata and visible FAQ schema on {changed} page(s).')


if __name__ == '__main__':
    main()
