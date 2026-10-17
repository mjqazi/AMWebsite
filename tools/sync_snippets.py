#!/usr/bin/env python3
"""Copy shared HTML snippets into pages (no build system on GitHub Pages).

Each page holds a copy of a snippet between markers:
    <!-- snippet:objections -->  ...  <!-- /snippet:objections -->
Edit tools/snippets/<name>.html, then run:  python3 tools/sync_snippets.py
The shared primary navigation is rendered from navigation.html with active
links and service-aware contact targets for each page.

The {{LABEL}} placeholder becomes the section label: a numbered
section-number on the homepage, an eyebrow elsewhere.
Pages listed in PAGES but missing markers get the block inserted just
before their FAQ section.
"""
import os, re, sys

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
PAGES = {
    'objections': [
        'index.html',
        # service pages
        'electrical-design.html', '3d-modeling.html', 'bim-modeling-outsourcing.html',
        'solar-services.html', 'civil-design.html', 'data-analytics.html',
        'arc-flash-study-services.html', 'substation-design-outsourcing.html',
        'control-panel-design-outsourcing.html', 'mep-drafting-outsourcing.html',
        # city pages
        'electrical-drafting-perth.html', 'electrical-drafting-brisbane.html',
        'electrical-drafting-houston.html', 'electrical-drafting-phoenix.html',
    ],
}
LABELS = {
    'index.html': '<div class="section-number">&sect;05 &mdash; Offshore Worries</div>',
}
DEFAULT_LABEL = '<span class="eyebrow">Before you send a drawing</span>'


def render(name, page):
    with open(os.path.join(ROOT, 'tools', 'snippets', name + '.html'), encoding='utf-8') as fh:
        body = fh.read().strip('\n')
    body = body.replace('{{LABEL}}', LABELS.get(page, DEFAULT_LABEL))
    return '<!-- snippet:%s (source: tools/snippets/%s.html) -->\n%s\n<!-- /snippet:%s -->' % (name, name, body, name)


def main():
    changed = 0
    for name, pages in PAGES.items():
        pat = re.compile(r'<!-- snippet:%s\b.*?<!-- /snippet:%s -->' % (name, name), re.S)
        for page in pages:
            path = os.path.join(ROOT, page)
            with open(path, encoding='utf-8') as fh:
                html = fh.read()
            block = render(name, page)
            if pat.search(html):
                new = pat.sub(lambda m: block, html, count=1)
            elif '<!-- Objections block (Task 3) -->' in html:
                new = html.replace('<!-- Objections block (Task 3) -->', block, 1)
            else:
                m = re.search(r'<section[^>]*>(?:(?!</section>).)*?faq-wrap', html, re.S)
                if not m:
                    sys.exit('no FAQ section to anchor on in ' + page)
                # walk back to the start of the section that holds the FAQ
                start = html.rfind('<section', 0, m.end())
                new = html[:start] + block + '\n\n' + html[start:]
            if new != html:
                with open(path, 'w', encoding='utf-8') as fh:
                    fh.write(new)
                changed += 1
    # One navigation source for root pages, hubs and preserved legacy URLs.
    # Root-relative paths work at every depth on our custom-domain host.
    with open(os.path.join(ROOT, 'tools', 'snippets', 'navigation.html'), encoding='utf-8') as fh:
        navigation = fh.read().strip()
    for directory, folders, files in os.walk(ROOT):
        folders[:] = [name for name in folders if not name.startswith('.') and name != 'tools']
        for filename in files:
            if not filename.endswith('.html'):
                continue
            path = os.path.join(directory, filename)
            with open(path, encoding='utf-8') as fh:
                html = fh.read()
            if not re.search(r'<nav\b[^>]*class="nav"', html):
                continue
            page = os.path.relpath(path, ROOT).replace(os.sep, '/')
            active_path = '/' + page
            nav = navigation.replace('href="%s"' % active_path,
                                     'href="%s" class="active" aria-current="page"' % active_path)
            if page == 'index.html':
                nav = nav.replace('/contact.html?service=electrical', '#contact')
            else:
                service = re.search(r'<body\b[^>]*data-service="([a-z-]+)"', html)
                if service:
                    nav = nav.replace('/contact.html?service=electrical',
                                      '/contact.html?service=' + service.group(1))
            new = re.sub(r'<nav\b[^>]*class="nav"[^>]*>.*?</nav>', lambda m: nav, html, count=1, flags=re.S)
            if new != html:
                with open(path, 'w', encoding='utf-8') as fh:
                    fh.write(new)
                changed += 1
    print('updated %d snippet placement(s)' % changed)


if __name__ == '__main__':
    main()
