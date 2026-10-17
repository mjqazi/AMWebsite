#!/usr/bin/env python3
"""Build sitemaps and RSS from real indexable pages and their current metadata."""
from html.parser import HTMLParser
from pathlib import Path
from urllib.parse import urljoin
import json
import xml.etree.ElementTree as ET
from sync_seo import BASE, MODIFIED, ROOT

NS = 'http://www.sitemaps.org/schemas/sitemap/0.9'
IMAGE = 'http://www.google.com/schemas/sitemap-image/1.1'
ET.register_namespace('', NS)
ET.register_namespace('image', IMAGE)


class Images(HTMLParser):
    def __init__(self, source):
        super().__init__()
        self.images = []
        self.feed(source)

    def handle_starttag(self, tag, attrs):
        values = dict(attrs)
        if tag == 'img' and values.get('src') and values.get('alt', '').strip():
            self.images.append(values['src'])


def canonical(filename):
    return BASE + ('/' if filename == 'index.html' else '/' + filename.replace('index.html', ''))


def write_xml(name, root):
    ET.indent(root, space='  ')
    ET.ElementTree(root).write(ROOT / name, encoding='utf-8', xml_declaration=True)


def main():
    pages = json.loads((ROOT / 'tools/seo-pages.json').read_text(encoding='utf-8'))
    services = {'electrical-design.html', 'control-panel-design-outsourcing.html', '3d-modeling.html',
                'bim-modeling-outsourcing.html', 'substation-design-outsourcing.html',
                'arc-flash-study-services.html', 'mep-drafting-outsourcing.html',
                'civil-design.html', 'data-analytics.html', 'solar-services.html'}
    insights = {name for name in pages if name.startswith(('case-study-', 'what-is-', 'how-to-', 'guide-', 'ieee-'))}
    insights.update({'blog.html', 'bim-execution-plan-template.html', 'offshore-drafting-vendor-checklist.html',
                     'offshore-engineering-rates-report-2026.html', 'cable-schedule-template.html',
                     'panel-schedule-template.html', 'single-line-diagram-checklist.html',
                     'california-solar-permit-pass-rate-benchmark-2026.html',
                     'the-true-cost-of-chasing-timesheets.html'})
    groups = {name: ET.Element(f'{{{NS}}}urlset') for name in ('main', 'services', 'industries', 'insights')}
    image_map = ET.Element(f'{{{NS}}}urlset')
    for filename in pages:
        group = 'industries' if filename.startswith('industries/') else 'services' if filename in services else 'insights' if filename in insights else 'main'
        url = ET.SubElement(groups[group], f'{{{NS}}}url')
        ET.SubElement(url, f'{{{NS}}}loc').text = canonical(filename)
        ET.SubElement(url, f'{{{NS}}}lastmod').text = MODIFIED
        images = Images((ROOT / filename).read_text(encoding='utf-8')).images
        addresses = sorted({urljoin(canonical(filename), image) for image in images})
        if addresses:
            entry = ET.SubElement(image_map, f'{{{NS}}}url')
            ET.SubElement(entry, f'{{{NS}}}loc').text = canonical(filename)
            for address in addresses:
                image = ET.SubElement(entry, f'{{{IMAGE}}}image')
                ET.SubElement(image, f'{{{IMAGE}}}loc').text = address
    for group, root in groups.items():
        write_xml(f'sitemap-{group}.xml', root)
    write_xml('sitemap-images.xml', image_map)
    index = ET.Element(f'{{{NS}}}sitemapindex')
    for name in [*groups, 'images']:
        entry = ET.SubElement(index, f'{{{NS}}}sitemap')
        ET.SubElement(entry, f'{{{NS}}}loc').text = BASE + f'/sitemap-{name}.xml'
        ET.SubElement(entry, f'{{{NS}}}lastmod').text = MODIFIED
    write_xml('sitemap.xml', index)
    write_xml('sitemap-index.xml', index)

    rss = ET.Element('rss', version='2.0')
    channel = ET.SubElement(rss, 'channel')
    ET.SubElement(channel, 'title').text = 'Advanced Mechanix — Industrial Design Guides'
    ET.SubElement(channel, 'link').text = BASE + '/blog.html'
    ET.SubElement(channel, 'description').text = 'Project briefs, electrical drawing references, control documentation and plant BIM planning resources.'
    for filename in pages:
        if filename not in insights or filename.startswith('case-study-'):
            continue
        item = ET.SubElement(channel, 'item')
        ET.SubElement(item, 'title').text = pages[filename]['title']
        ET.SubElement(item, 'link').text = canonical(filename)
        ET.SubElement(item, 'guid', isPermaLink='true').text = canonical(filename)
        ET.SubElement(item, 'description').text = pages[filename]['description']
    ET.indent(rss, space='  ')
    ET.ElementTree(rss).write(ROOT / 'feed.xml', encoding='utf-8', xml_declaration=True)
    print(f'Built sitemaps for {len(pages)} indexable URLs and the current guide feed.')


if __name__ == '__main__':
    main()
