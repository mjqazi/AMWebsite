#!/usr/bin/env python3
"""Wire a new free-resource page into blog resources, blog footer, the RSS
feed, sitemap-insights.xml and a list of 'related' pages.
usage: add_resource.py <slug.html> "<title>" "<meta line>" "<summary>" <thumb> "<footer label>" [related.html ...]"""
import sys, os, re
ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
slug, title, meta, summary, thumb, flabel, *related = sys.argv[1:]
os.chdir(ROOT)
def rw(f, fn):
    s = open(f, encoding='utf-8').read(); n = fn(s)
    assert n != s, f; open(f, 'w', encoding='utf-8').write(n)
card = f'''      <article class="blog-card" style="border: 1px solid var(--rule);">
        <a href="{slug}">
          <div class="blog-thumb" style="aspect-ratio: 16/9;">
            <img width="970" height="600" src="{thumb}" alt="" loading="lazy" decoding="async">
          </div>
          <div class="blog-body" style="padding: 26px 28px;">
            <div class="blog-meta">{meta}</div>
            <h3>{title}</h3>
            <p style="color: var(--ink-3); font-size: 0.94rem; margin: 10px 0 0; line-height: 1.6;">{summary}</p>
          </div>
        </a>
      </article>
'''
def blog(s):
    i = s.index('<!-- Concept explainers -->')
    j = s.rindex('    </div>', 0, i)
    s = s[:j] + card + s[j:]
    return s.replace('<li><a href="cable-schedule-template.html">Cable Schedule Template</a></li>',
                     f'<li><a href="cable-schedule-template.html">Cable Schedule Template</a></li><li><a href="{slug}">{flabel}</a></li>', 1)
rw('blog.html', blog)
item = f'''  <item>
    <title>{title.replace('&mdash;', '&#8212;')}</title>
    <link>https://advancedmechanix.com/{slug}</link>
    <guid>https://advancedmechanix.com/{slug}</guid>
    <dc:creator>Advanced Mechanix</dc:creator>
    <pubDate>Sat, 17 Oct 2026 00:00:00 +0000</pubDate>
    <description>{summary}</description>
  </item>

'''
rw('feed.xml', lambda s: s.replace('  <item>', item + '  <item>', 1))
rw('sitemap-insights.xml', lambda s: s.replace('</urlset>', f'  <url><loc>https://advancedmechanix.com/{slug}</loc><lastmod>2026-10-17</lastmod><priority>0.7</priority></url>\n</urlset>'))
for f in related:
    def rel(s):
        m = re.search(r'(<div class="related-reads">.*?<ul>\n?)', s, re.S) or re.search(r'(Related Services &amp; Reading</div>\s*<ul class="footer-list">\n?)', s, re.S)
        assert m, f
        ind = '          ' if 'related-reads' in m.group(1) else '      '
        return s[:m.end()] + f'{ind}<li><a href="{slug}">{flabel}</a></li>\n' + s[m.end():]
    rw(f, rel)
print('ok')
