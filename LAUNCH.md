## JeffGPT launch plan (distribution + growth)

This file is the external launch plan: channels, copy, schedule, and tracking.

- Pre-production checklist lives in `PRELAUNCH.md`.

---

## Current Status (Day 3 post-launch — Dec 15, 2025)

### Results so far

| Channel | Link | Engagement | Signups | Notes |
|---------|------|------------|---------|-------|
| X thread | [link](https://x.com/basslerben/status/1999516558440210842) | 1 like | 0 | Low reach, 80 followers limits distribution |
| r/dataengineering | [link](https://www.reddit.com/r/dataengineering/comments/1pkxcv6/i_built_a_citationsfirst_rag_search_for_the_house/) | 4 upvotes | ~1 | Best performer so far |
| r/machinelearning | pending | mod review | 0 | Awaiting approval |
| r/datasets, r/OSINT, r/OpenSourceIntelligence | — | blocked | 0 | Against subreddit rules |

**Total**: ~6 visitors, 1 signup, 0 paid

### Diagnosis

The core problem is **distribution, not product**. With 80 X followers and strict subreddit rules blocking posts, organic social is near-zero leverage.

Reddit organic only works if:
1. The post hits early engagement (first 30 min)
2. The subreddit allows tool posts
3. You have existing karma/reputation in that community

None of these conditions are met. Continuing to grind Reddit posts has diminishing returns.

---

## Revised Plan (Day 4–14)

### Priority 1: Direct outreach (highest leverage now)

Reddit and X are low-reach without an audience. Outreach bypasses this entirely.

**Target list (build this week):**
- 10 journalists who covered Epstein docs or similar investigations
- 10 OSINT researchers/practitioners (Twitter, LinkedIn)
- 5 legal/policy researchers who use public records

**Outreach cadence:**
- Day 4–7: Send 5 personalized emails/day (25 total)
- Day 8–14: Follow up on non-responders, send 3/day to new targets

**Email template** (keep it short):

> Subject: Tool for searching Epstein files with citations
>
> Hi [Name],
>
> I built epfiles.ai — a citations-first search tool for the 20,000+ U.S. House Oversight Epstein files.
>
> Every answer links to the exact source document so you can verify. Thought it might be useful for [their beat/work].
>
> 60-second demo: [link]
>
> Happy to give you full access if you want to try it.
>
> — Ben

### Priority 2: Show HN (one shot, high variance)

HN is high-leverage if the post catches. Schedule for a weekday morning (Tue–Thu, 8–10am ET).

**Post format:**
> Show HN: Citations-first RAG for searching 20k+ Epstein files
>
> [2-3 sentences on what it does, link, disclosure]

Be in comments immediately for 2+ hours.

### Priority 3: Content marketing (build inbound)

Write one technical post that can rank and get shared:
- **"How I built citations-first RAG on a 20k document corpus"** — post on your blog, cross-post to dev.to, hashnode, or medium
- Include architecture, chunking strategy, failure modes, and what you'd do differently
- Link to product naturally

This creates a long-tail asset that can get picked up by newsletters, aggregators, etc.

### Priority 4: Personal network (warm intros)

- Email your 30-person list (if not done)
- Ask 3 people directly: "Do you know any journalists or researchers who work with public records?"
- LinkedIn post (if you have connections in legal/research/journalism)

### Deprioritize

- **More Reddit posts**: Only post if r/machinelearning gets approved and performs. Otherwise, stop.
- **X posts without engagement**: No point posting to 80 followers daily. Focus on building content that can be shared.
- **Product Hunt**: Not worth it without an audience to coordinate upvotes.

---

## Goals

- **Primary**: get qualified users into the product and collecting feedback.
- **Secondary**: grow an owned distribution channel by routing interest into an **X (Twitter) thread** and ongoing posts.

### Success metrics (first 14 days)

- **Activation**: user reaches a first "useful answer" (define as: runs a query and opens at least one cited source).
- **Conversion**: free-to-paid (or trial-to-paid) conversion rate.
- **Retention**: users who return within 7 days.
- **Distribution**: X follows attributable to launch traffic.

---

## Positioning and message constraints

### What JeffGPT is

- **A search + synthesis interface for a fixed corpus of public records**, designed to make document discovery faster.
- **Citations-first**: every claim should be traceable to a source chunk.

### What JeffGPT is not

- Not a "breaking news" system.
- Not a fact oracle; it can be wrong. Users must verify by reading sources.

### Sensitive-topic guardrails (required language)

- **No accusations / no speculation**: stick to what the documents show.
- **Neutral phrasing**: "the documents indicate/show/state", not "proves".
- **Explicit disclaimer**: encourage primary-source reading and independent verification.

---

## Funnel design (Reddit -> product -> X)

### Target flow

1. **Reddit post** provides value (why it exists, how it works, examples of queries, what's included) and links to the product.
2. Landing experience immediately shows: **what it is**, **how to use it**, **example queries**, and **source citations**.
3. A prominent on-site CTA points to the **X thread** ("full launch thread + updates"), so the product becomes the conversion surface and X becomes the retention/updates surface.

### Implementation notes

- Prefer **UTM-tagged links** everywhere, and use a distinct UTM per subreddit/post.
- When subreddit rules discourage external links, use a text post and place the link in a single comment (or omit link and direct people to search the project name).

---

## Launch assets checklist

### Must-have assets

- [ ] **One-sentence description** (used everywhere)
- [ ] **3-bullet value prop** (used everywhere)
- [ ] **5 example queries** that reliably demonstrate value
- [ ] **30–60s demo video** (screen recording)
- [ ] **3 screenshots** (home, results w/ citations, conversation/history)
- [ ] **Dedicated on-site "What's included" section** (corpus description + limitations)
- [ ] **Dedicated on-site "How citations work" section**
- [ ] **Dedicated on-site disclaimer** (accuracy + verify via sources)
- [x] **X launch thread** (drafted + scheduled)

---

## Tracking (do this before posting)

- [ ] **Create UTM conventions**
  - `utm_source`: `reddit`, `x`, `hn`, `producthunt`, `indiehackers`
  - `utm_medium`: `post`, `comment`, `profile`
  - `utm_campaign`: `launch_2025_12`
  - `utm_content`: subreddit name or post slug
- [x] **Create a launch log table** (add as a section at bottom of this file)
  - timestamp, channel, link, copy version, impressions, clicks, signups, paid, notes
- [ ] **Create a single canonical URL** (product home) and never vary it without UTMs

---

## X (Twitter) strategy (80 followers -> compounding)

### Profile setup

- [ ] **Bio**: explain product in 1 line + "citations-first" + link
- [ ] **Pinned post**: the launch thread
- [ ] **Header image**: product name + "search public records with citations"

### Launch thread structure (copy template)

Replace bracketed fields, keep the structure.

1. Hook: what problem exists, who it's for.
2. Credibility: what corpus, what's new vs generic chat.
3. Demo: 10–20s clip or GIF.
4. How it works: retrieval + citations (high-level).
5. Example queries (5 bullets).
6. What you can't do (limitations, accuracy disclaimer).
7. Privacy posture (high-level, link to policy).
8. CTA: try it + follow for updates + reply with feedback.

### X posting cadence (first 14 days)

- Day 0: thread
- Day 1–3: one focused post/day (one example query + screenshot + link)
- Day 4–14: 3 posts/week (feature, corpus update, "how to verify" tips)

---

## Copy bank (ready to paste)

### Reddit: `r/datasets` (Day 0) — post copy

Title:
I built a citations-first RAG app for searching 20,000+ U.S. House Oversight Epstein files

Body:
I built **epfiles.ai** (JeffGPT), an AI-powered RAG app that makes 20,000+ Epstein files quickly searchable.

It's built for verification-heavy reading: find relevant passages fast, then click through and check the source text, or ask follow-up questions.

The source corpus is the most recent release of **20,000+** U.S. House Oversight Epstein Estate files:
`https://drive.google.com/drive/folders/1hTNH5woIRio578onLGElkTWofUSWRoH_`

These are a bunch of scattered files (mixed formats + nested folders). The app's goal is simple: make it easier to find relevant passages fast without losing the ability to verify.

**Everything is citation-first.** If the app answers something, you can click through to the exact source file in the House Oversight Drive and sanity-check it.

It can still be wrong sometimes — the citations are there so you can verify fast.

What it's good for:
- quickly finding mentions of a name/term across the corpus
- pulling the most relevant excerpts on a topic with citations
- iterating with follow-up questions without losing where the text came from

Disclosure: I built this.

App: `[APP_UTM_LINK]`  
More details/updates: `[X_THREAD_UTM_LINK]`

### X (Twitter): launch thread (Day 0) — thread copy

Tweet 1 (main):
I built `epfiles.ai` — an AI-powered RAG app that makes 20,000+ Epstein files quickly searchable.

It's built for verification-heavy reading: find relevant passages fast, then click through and check the source text (with citations), or ask follow-up questions.

Tweet 2:
[video demo]

Tweet 3:
The source corpus is the most recent release of 20,000+ U.S. House Oversight Epstein Estate files:
`https://drive.google.com/drive/folders/1hTNH5woIRio578onLGElkTWofUSWRoH_`

Tweet 4:
These are a bunch of scattered files (mixed formats + nested folders). The goal here is simple: make it easier to find relevant passages fast without losing the ability to verify.

Tweet 5:
Everything is citation-first. If the app answers something, you can click through to the exact source file and sanity-check it.

Tweet 6:
It can still be wrong sometimes — the citations are there so you can verify fast.

Tweet 7:
How it works (high level):
- your query gets turned into a vector
- we search a vector DB of the corpus for the most relevant chunks
- we send those chunks to the model
- you get an answer + the sources it used

Tweet 8:
LLM responses are generated via the OpenAI API, grounded on the retrieved excerpts.

Tweet 9:
This is V1 (MVP). I'm going to improve it incrementally based on real usage + feedback.

Tweet 10 (final):
If you have feedback, or find a bad citation/bug, reply here or email `support@epfiles.ai`

## Reddit strategy (high-intent acquisition)

### Rules of engagement (to avoid bans and maximize conversions)

- **Do not spam**: 1 subreddit per day, 1–2 max.
- **Text post first**: write a complete post without requiring the link.
- **Disclose**: "I built this" once, clearly.
- **Be useful**: share methodology, examples, and limitations.
- **No brigading**: never ask people to upvote.
- **Stay calm in comments**: respond with sources, not arguments.

### Subreddit targets (categories + examples)

These are starting points; each has strict self-promo norms. Use the angle notes.

- **OSINT / research tooling** (tooling angle)
  - Examples: `r/OSINT`, `r/dataisbeautiful` (only if you have a visualization), `r/datasets` (corpus + access angle)
- **AI / RAG / developer audience** (implementation angle)
  - Examples: `r/MachineLearning` (often dislikes promo), `r/LocalLLaMA` (if relevant), `r/LanguageTechnology`, `r/learnmachinelearning` (educational angle)
- **Journalism / research** (workflow angle)
  - Examples: `r/journalism` (check rules; may ban promo), `r/AskJournalists` (process angle)
- **True crime / topic-adjacent** (extreme caution)
  - Many "Epstein" and true-crime subs have rule sets that treat tooling posts as sensationalism or self-promo.
  - Only post if you can write a neutral, research-workflow framing with strict disclaimers.

### Additional subreddits worth testing (with posting angles)

These are generally better fits than topic-charged communities because you can lead with **workflow + citations + dataset provenance**.

- **`r/OpenSourceIntelligence`**: OSINT workflow angle; emphasize verification and corpus linking.
- **`r/datascience`**: "how I built a citations-first retrieval app on a fixed corpus" angle; keep it methodology-heavy.
- **`r/dataengineering`**: ingestion/OCR/chunking/indexing angle; share implementation lessons + failure modes.
- **`r/NLP`** (if allowed): citation UX + retrieval evaluation angle; avoid hype.
- **`r/ArtificialIntelligence`** (varies): product demo angle; keep disclaimers prominent.
- **`r/technology` / `r/news`**: only if you can write an actual newsworthy angle; these are usually hostile to self-promo and will remove posts.

Operational rule: treat each of these as a **single experiment** (one post), measure results, and stop if moderation friction is high.

### Recommended posting angles (pick one per subreddit)

- **"Research workflow"**: faster document discovery + citations
- **"Citations-first AI"**: transparency + how to verify claims
- **"Corpus navigation"**: metadata + how to find relevant pages/mentions
- **"Build story"**: what you learned building RAG for a fixed dataset (best for dev subs)

### Reddit post templates

#### Template A: research workflow (text post)

Title options:
- "I built a citations-first tool to search a large public-record document corpus"
- "Citations-first RAG for public records: faster document discovery + verification"

Body:
- I built JeffGPT to solve a specific problem: **finding relevant pages fast** in a large public-record corpus.
- It's not an oracle. It returns answers with **citations** so you can open the underlying source.
- What it does well:
  - fast retrieval of relevant chunks
  - citations on every answer
  - repeatable queries and follow-ups
- What it does not do:
  - it can be wrong; you must verify by reading the cited source
  - it won't invent new facts beyond what's in the corpus
- Example queries that work well:
  - [example query 1]
  - [example query 2]
  - [example query 3]
  - [example query 4]
  - [example query 5]
- Disclosure: I built this.
- Link: [UTM LINK]
- If you want the full context + updates, launch thread: [X THREAD LINK]

#### Template B: developer build story (text post)

Title options:
- "What I learned building citations-first RAG on a fixed public-record corpus"
- "Lessons from shipping a citations-first RAG app (retrieval, chunking, UX)"

Body:
- Problem statement (1 paragraph)
- Design choices (bullets): chunking, retrieval, citation UX, limits
- Failure modes (bullets): hallucinations, query drift, misleading snippets
- How you mitigated (bullets): citations, max lengths, guardrails
- Demo + link: [UTM LINK]
- Disclosure: I built this

### Comment playbook (first 2 hours after posting)

- If challenged on accuracy: "Open the citation; if it's wrong, that's a bug and I'll fix it."
- If accused of sensationalism: "This is a document-navigation tool; I'm not making claims beyond sources."
- If asked for proof: respond with a single citation-backed example and a screenshot.

---

## Other channels (high leverage)

### Hacker News (Show HN)

- [ ] Prepare a "Show HN" post focusing on **citations-first** + **workflow** + **what's included**.
- Comment quickly with:
  - corpus description
  - accuracy limitations
  - link to demo video

### Product Hunt

- [ ] Only if you can coordinate a launch day and collect early supporters.

### Indie Hackers

- [ ] Post as a build story + metrics + lessons.

### Direct outreach (journalists, researchers)

- [ ] Build a list of 25 targets (reporters, editors, OSINT folks)
- [ ] Send a short email (template below)

Email template:

Subject: citations-first tool for searching a large public-record corpus

Hi [Name] — I built JeffGPT, a citations-first search + synthesis tool for navigating a large public-record document corpus.

It's designed for verification: answers always link back to the source snippet so you can open and read the original.

Demo: [link]
Launch thread with context: [link]

If you want, I can share a 60-second screen recording and example queries that map to your beat.

— [Your Name]

---

## Execution schedule

## Completed (Day 0–3)

### Day 0 (Dec 12): Launch day ✓

- [x] **X**: published launch thread and pinned it — [link](https://x.com/basslerben/status/1999516558440210842)
  - Result: 1 like, minimal reach (80 followers)
- [x] **Reddit**: attempted `r/datasets` — blocked by rules
- [x] **Comments block**: N/A

### Day 1–2 ✓

- [x] **Reddit**: attempted `r/OSINT`, `r/OpenSourceIntelligence` — blocked by rules
- [x] **X**: posted follow-ups — minimal engagement

### Day 3 (Dec 15 — today) ✓

- [x] **Reddit**: `r/dataengineering` — 4 upvotes, ~1 signup (best result)
- [x] **Reddit**: `r/machinelearning` — submitted, pending mod review
- [ ] **Email list (30 people)**: not sent yet

---

## Active Plan (Day 4–14)

### Day 4–7: Direct outreach + Show HN prep

- [ ] **Build outreach list**: 10 journalists, 10 OSINT researchers, 5 legal/policy researchers
- [ ] **Send 5 personalized outreach emails/day** (25 total by Day 7)
- [ ] **Email your 30-person personal list**
- [ ] **Prep Show HN post** (draft title + body + comments strategy)
- [ ] **Write technical blog post**: "How I built citations-first RAG on a 20k document corpus"
- [ ] If r/machinelearning post gets approved and performs, engage comments; otherwise stop Reddit

### Day 8–14: Follow-up + content distribution

- [ ] **Follow up** on non-responders from outreach
- [ ] **Send 3 new outreach emails/day**
- [ ] **Post Show HN** (Tue–Thu, 8–10am ET) — be in comments for 2+ hours
- [ ] **Publish blog post** to dev.to / hashnode / personal blog
- [ ] **LinkedIn post** (if relevant connections exist)
- [ ] **Iterate on product** based on feedback

---

## Deprioritized (original Reddit-heavy plan)

The following are deprioritized due to:
1. Low karma/reputation → posts don't gain traction
2. Most relevant subreddits blocked tool posts
3. X has 80 followers → no organic distribution

~~r/datascience, r/datasets, r/OSINT, r/OpenSourceIntelligence~~ — blocked or ineffective

---

## Launch log (fill as you post)

| Timestamp | Channel | Destination | UTM | Copy version | Impressions | Clicks | Signups | Paid | Notes |
|----------|---------|-------------|-----|--------------|------------:|------:|--------:|-----:|------|
| Dec 12 | X | [thread](https://x.com/basslerben/status/1999516558440210842) | x_thread | launch thread | ~100 | ~2 | 0 | 0 | 1 like, low reach due to 80 followers |
| Dec 15 | Reddit | [r/dataengineering](https://www.reddit.com/r/dataengineering/comments/1pkxcv6/i_built_a_citationsfirst_rag_search_for_the_house/) | r_dataengineering | Template B | ~200 | ~4 | 1 | 0 | 4 upvotes, best performer |
| Dec 15 | Reddit | r/machinelearning | r_machinelearning | Template B | — | — | 0 | 0 | Pending mod review |
| — | Reddit | r/datasets, r/OSINT, r/OpenSourceIntelligence | — | — | — | — | 0 | 0 | Blocked by subreddit rules |

---

## Post-launch iteration loop (daily)

- [ ] Review top objections/questions and add answers to FAQ/onboarding
- [ ] Add 1 new example query per day (based on real searches)
- [ ] Track the top 3 "aha" moments and turn each into an X post





