# Advanced Mechanix — Launch TODO

*Everything flagged across our chat sessions that you (or your ops/marketing/legal team) need to finish. The website build is done; these are the external / operational items that can't be shipped from code.*

Last updated: 2026-07-07

---

## 🔴 TIER 0 — Must ship BEFORE flipping the site live

**New from the 2026-07-07 reimagine pass (timesheet product launch):**

- [ ] **Confirm the timesheet trial CTA** on `/timesheet.html` points to the correct production product URL before launch; it currently uses `https://staging.advancedmechanix.com/` from the handoff source.
- [ ] **Review the two new success stories before launch** (`case-study-grain-network-arc-flash.html` is an anonymized composite; `case-study-inside-our-timesheet-desk.html` describes the internal operating workflow behind Advanced Mechanix Timesheets under Junaid's name). Confirm you're comfortable with every number and framing.
- [ ] **Create a 1200×630 PNG/JPG social card** (`images/og-card.png`, title-block aesthetic) — half the site's og:image values are SVGs, which LinkedIn/Facebook/X scrapers don't render; swap it in sitewide once it exists.
- [ ] **Contact form now has a "Timesheet Software" option** — make sure whoever triages `contact-handler.php` email knows the new product line exists.


These are launch-blockers. The site will leak leads or credibility without them.

- [ ] **Wire the contact form to a backend.** Options: HubSpot, Formspree, ConvertKit, or a custom endpoint. Currently client-side only — form submissions disappear.
- [ ] **Wire the vendor-checklist + BEP-template forms** to an email-delivery system so the promised PDFs actually arrive.
- [ ] **Build the actual Vendor Checklist PDF.** Landing page is live; the document doesn't exist yet. Target: 14 pages per the landing promise.
- [ ] **Build the actual BIM Execution Plan Template** (editable Word + PDF reference).
- [ ] **Install real Google Analytics 4** — replace the `amTrack` stub in `js/main.js` with your GA4 measurement ID.
- [ ] **Verify Google Search Console + Bing Webmaster Tools.** Submit `sitemap-index.xml` (the legacy monolithic sitemap.xml was retired 2026-07-07 and now 301s to it).
- [ ] **Deploy to production with HTTPS.** Pick www vs non-www and enforce 301 redirects (`.htaccess` already configured; just uncomment).
- [ ] **Install Microsoft Clarity or Hotjar** for session-replay and heatmaps. Free; takes 10 minutes.

---

## 🟠 TIER 1 — Credibility & trust assets (first 30 days)

Without these, procurement teams and skeptical ICP buyers stay skeptical.

- [ ] **Replace initials-avatars with real leadership headshots** on homepage + `/authors/junaid-qazi.html`.
- [ ] **Collect 1–2 client testimonials with full name + photo + LinkedIn** (replaces "J. Marshall" initials-only format).
- [ ] **Real engineer credentials with verification links** — PE license numbers, IEEE memberships, Chartered Engineer registry entries.
- [ ] **Team / facility photos** — Pakistan production office + San Diego HQ. Adds concrete evidence behind the onshore/offshore claim.
- [ ] **Prepare NDA / MSA / ISO-aligned security one-pager** that procurement can forward to legal. The trust panel promises these exist; make them real.
- [ ] **Set up a real LinkedIn Company Page** and update `sameAs` in the Organization JSON-LD on `index.html` with the actual URL.

---

## 🟡 TIER 2 — External presence & entity SEO

Each item is a backlink and/or Knowledge Graph signal. Quick wins, no ongoing cost.

- [ ] **Claim Google Business Profile** at business.google.com. Category: "Engineering Consultant." Add photos + opening hours + services.
- [ ] **Create Wikidata entry** (wikidata.org — free). Add company, founder, founding date, sameAs links.
- [ ] **Create Crunchbase profile** — then re-add its URL to the `sameAs` array in index.html's Organization JSON-LD (removed 2026-07-07 because the profile doesn't exist yet and a dead sameAs hurts entity SEO).
- [ ] **Submit to high-DA directories:** Clutch, G2, DesignRush, GoodFirms, AEC Directory.
- [ ] **Bing Places + Apple Maps** business listings.
- [ ] **Chamber of Commerce San Diego** membership + listing.
- [ ] **Industry association memberships** — IEEE, SMPS, BICSI, IET. Many publish member directories with follow-links.

---

## 🟢 TIER 3 — Review generation & social proof

Once the site has traffic, these compound. Start the cadence now.

- [ ] **Email every completed-project client** asking for a Google / Clutch / LinkedIn review. Target: 50+ Google reviews in year 1.
- [ ] **Collect AggregateRating data** (stars + count) once real reviews exist; update `Organization` schema.
- [ ] **Build a champion-enablement share button** ("Forward this page to your procurement team") — requires light email/CRM integration.

---

## 🔵 TIER 4 — Content production pipeline (ongoing)

The blog lists these as "in production" — they need to exist for SEO momentum.

- [ ] **2026 Offshore Engineering Rates Report** (teased on blog). High-priority: this is the link-worthy asset that earns press backlinks.
- [ ] **California AHJ Permit Pass-Rate Benchmark** (teased on blog).
- [ ] **IEEE 1584 Arc Flash Calculation step-by-step guide** (teased on blog).
- [ ] **Real case studies** with client permission — named client, project scope, measurable outcome. Replace anonymized case-study cards.
- [ ] **Monthly editorial cadence** — one concept explainer or industry analysis per month, authored by a named engineer.

---

## 🟣 TIER 5 — Link building & PR (ongoing)

Ranks B2B traffic at ~6–9 month lag. Start now.

- [ ] **HARO / Qwoted responses** — 3 journalist queries per week in your expertise area.
- [ ] **Guest posts** on AEC / engineering publications (even mid-tier trade press).
- [ ] **Podcast guesting** — AEC podcasts are niche but high-intent audience.
- [ ] **Award submissions** — AEC Excellence Awards, Design Intelligence, ENR.
- [ ] **Speaking engagements** at industry conferences (even local chapters).

---

## 🔧 TIER 6 — Post-launch optimization

Schedule a quarterly review once live traffic is flowing.

- [ ] **Cross-browser / cross-device QA** on production (Safari mobile, Firefox, Edge).
- [ ] **Core Web Vitals monthly audit** via PageSpeed Insights. Targets: LCP <2.5s, CLS <0.1, INP <200ms.
- [ ] **A/B test hero headline variants** (e.g., loss-framed vs. outcome-framed).
- [ ] **Search Console monitoring** — 404s, indexing issues, crawl errors.
- [ ] **Annual content freshness refresh** on pillar guide, concept explainers, city pages.

---

## 📝 Schema + metadata placeholders to replace

Minor but worth keeping visible.

- [ ] Update `sameAs` in `index.html` JSON-LD with real LinkedIn + Crunchbase URLs (currently placeholder).
- [ ] Update `Person` schema in `/authors/junaid-qazi.html` with real LinkedIn (placeholder), optional ORCID.
- [ ] Add `AggregateRating` + individual `Review` schema once real reviews exist.
- [ ] Real `image` URLs in Person schemas once headshots are shot.

---

## 📂 What's DONE (for reference)

*So you know where we left off.*

- ✅ 42 pages built across services, industries, cities, concept explainers, comparisons, lead magnets
- ✅ Full Engineering Atelier design system (retired by the 2026-07-07 product/drafting-room reimagine)
- ✅ JSON-LD schema on every page (Organization, Service, FAQPage, Breadcrumb, Article, Person, LocalBusiness, HowTo)
- ✅ Sitemap.xml + segmented sitemaps + RSS feed + robots.txt
- ✅ Self-hosted fonts (no Google Fonts dependency)
- ✅ AVIF + WebP conversion for key images
- ✅ `.htaccess` + `_headers` files for HTTP/cache/security config
- ✅ Custom 404 page
- ✅ Marketing psychology fixes: reason-why on guarantees, scarcity signal, loss-framing panel, peak-end trust stack, identity-matching hero, upgraded testimonial attribution
- ✅ Blog page rebuilt with real article links + SVG thumbnails (no more programmatic placeholders)

---

**Owner note:** Work top-to-bottom. Tier 0 items are genuinely launch-blockers — everything else can come in waves after you're live. The three highest-ROI items in Tier 1 (real headshots, one named testimonial with photo, leadership credentials) collectively move conversion more than any other single fix.
