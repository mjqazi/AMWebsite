#!/usr/bin/env python3
"""Check HTML links, fragment targets, JSON-LD, indexable-page headings,
canonical presence, sitemap destinations and local CSS assets.
Run with Python 3: python tools/check_site.py (no dependencies).
"""
from pathlib import Path
from html.parser import HTMLParser
from urllib.parse import urljoin,urlparse,unquote
import json,re,xml.etree.ElementTree as ET
ROOT=Path(__file__).resolve().parents[1]; errors=[]; refs=0; blocks=0
class Page(HTMLParser):
 def __init__(self):
  super().__init__();self.refs=[];self.ids=set();self.jsons=[];self.ins=False;self.buf='';self.h1=0;self.noindex=False;self.canonical=[]
 def handle_starttag(self,t,a):
  a=dict(a)
  if a.get('id'):self.ids.add(a['id'])
  if t=='h1':self.h1+=1
  if t=='meta' and a.get('name')=='robots' and 'noindex' in a.get('content',''):self.noindex=True
  if t=='link' and a.get('rel')=='canonical':self.canonical.append(a.get('href'))
  for k in ['src','href','poster']:
   if a.get(k):self.refs.append(a[k])
  if a.get('srcset'):self.refs.extend(x.strip().split()[0] for x in a['srcset'].split(','))
  if t=='script' and a.get('type')=='application/ld+json':self.ins=True;self.buf=''
 def handle_data(self,d):
  if self.ins:self.buf+=d
 def handle_endtag(self,t):
  if t=='script' and self.ins:self.jsons.append(self.buf);self.ins=False
pages={}
for f in ROOT.rglob('*.html'):
 if '.git' in f.parts or 'tools' in f.parts or 'node_modules' in f.parts:continue
 source=f.read_text(encoding='utf-8')
 if re.fullmatch(r'google[a-f0-9]+\.html',f.name) and source.strip()=='google-site-verification: '+f.name:continue
 p=Page();p.feed(source);pages[f]=p
 for s in p.jsons:
  blocks+=1
  try:json.loads(s)
  except Exception as e:errors.append(f'{f.name}: invalid JSON-LD: {e}')
 if not p.noindex and (p.h1!=1 or len(p.canonical)!=1):errors.append(f'{f.name}: H1={p.h1}, canonical={p.canonical}')
for f,p in pages.items():
 base='https://advancedmechanix.com/'+f.relative_to(ROOT).as_posix()
 for ref in p.refs:
  if ref.startswith(('mailto:','tel:','data:','javascript:')):continue
  u=urlparse(urljoin(base,ref))
  if u.hostname!='advancedmechanix.com':continue
  refs+=1;dest=ROOT/unquote(u.path.lstrip('/'))
  if dest.is_dir():dest=dest/'index.html'
  if not dest.exists():errors.append(f'{f.name}: missing {ref}')
  elif u.fragment and dest in pages and unquote(u.fragment) not in pages[dest].ids:errors.append(f'{f.name}: missing anchor {ref}')
for f in ROOT.glob('sitemap*.xml'):
 for loc in ET.parse(f).getroot().iter('{http://www.sitemaps.org/schemas/sitemap/0.9}loc'):
  u=urlparse(loc.text);dest=ROOT/u.path.lstrip('/')
  if dest.is_dir():dest=dest/'index.html'
  if not dest.exists():errors.append(f'{f.name}: missing {loc.text}')
  if dest in pages and pages[dest].noindex:errors.append(f'{f.name}: noindex {loc.text}')
for f in ROOT.glob('css/*.css'):
 for ref in re.findall(r'url\([\'\"]?([^\)\'\"]+)',f.read_text(encoding='utf-8')):
  if ref.startswith(('data:','%23','#')):continue
  u=urlparse(urljoin('https://advancedmechanix.com/css/'+f.name,ref))
  if u.hostname=='advancedmechanix.com' and not (ROOT/u.path.lstrip('/')).exists():errors.append(f'{f.name}: missing {ref}')
print(json.dumps({'pages':len(pages),'references':refs,'jsonLdBlocks':blocks,'errors':errors},indent=2));raise SystemExit(bool(errors))
