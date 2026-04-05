# Ring Ring Club — Website Style Guide & Layout Reference
*Internal reference document. Last updated: April 2026.*

---

## 1. Visual Identity & Palette

### Vibe
**"Modern Nostalgia."** It should feel like a high-end physical product brand (think Sonos or Nest) but with the warmth of a 1980s family living room.

### Color Palette
| Role | Value | Usage |
|---|---|---|
| Primary Background | `#FAF7F2` — warm off-white/cream | Page backgrounds |
| Primary Accent | `#C4531A` — Burnt Orange | CTAs, headlines, active states |
| Dark Accent | `#a84313` — Deep Burnt Orange | CTA hover states |
| Secondary Accent | Muted Teal | Section cards, highlights |
| Tertiary Accent | Amber | Step numbers, warm highlights |
| Dark Background | `stone-900` (`#1c1917`) | Footer, final CTA block |
| Body Text | `stone-500` / `stone-600` | Body copy |
| Headline Text | `stone-900` | H1, H2, H3 |
| Muted Text | `stone-400` | Labels, captions, subtext |

> **Avoid:** stark white (`#FFFFFF`) as a page background. Use `#FAF7F2` instead.
> **Avoid:** bright "tech" blues, generic SaaS purple/indigo as primary colors.

### Typography
| Role | Recommendation | Tailwind |
|---|---|---|
| Headlines | Bold, friendly Serif — Recoleta or Cooper BT (fallback: system serif) | `font-black`, large sizes |
| Body | Clean sans-serif — Inter or Montserrat | `font-sans`, `font-medium` / `font-normal` |
| Labels / Caps | Same sans-serif, uppercase, wide tracking | `uppercase tracking-widest text-xs` |

> **Current implementation uses Tailwind's `font-black` + `font-sans` system font stack.** When custom fonts are added (Recoleta), apply to `font-serif` class on headlines.

---

## 2. UI Components

### Buttons
- **Primary CTA:** `bg-[#C4531A] text-white font-bold rounded-full` — always pill-shaped (rounded-full), never square
- **Secondary CTA:** `bg-white text-stone-700 border border-stone-200 rounded-full`
- **Dark CTA:** `bg-stone-800 text-white rounded-full`
- Padding: `px-8 py-4` for large, `px-6 py-3` for medium, `px-5 py-2.5` for small

### Cards
- Corner radius: `rounded-3xl` for section cards, `rounded-2xl` for floating badges
- Border: `border-2` with a soft tonal color (e.g., `border-amber-100`, `border-teal-100`)
- Background: muted tonal fills matching section (e.g., `bg-amber-50`, `bg-teal-50`)
- Hover: `hover:shadow-lg transition` — subtle lift, no dramatic color change

### Icons
- Clean, minimalist emoji or line-art icons
- Avoid complex multi-color icons
- Icon size in cards: `text-3xl` to `text-4xl`

### Spacing
- Section padding: `py-24` standard, `py-28` for more breathing room
- Max content width: `max-w-6xl mx-auto px-6`
- Card grids: `gap-6` to `gap-8`
- Generous whitespace between sections — never crowded

---

## 3. Navigation

### Items (left to right)
1. **Ring Ring Club** (logo/wordmark — left)
2. Home
3. Our (analog) story
4. How It Works
5. The Ring Ring Shop
6. Pricing
7. **Sign In** (text link)
8. **Join the Club 🔔** (primary CTA pill button)

### Behavior
- Sticky, transparent on load
- Gets `bg-[#FAF7F2]/95 backdrop-blur-sm shadow-sm` on scroll
- Mobile: hamburger menu (not yet implemented)

---

## 4. Homepage Layout — All 8 Beats

### Beat 1 — Hero (The Hook)
- **H1:** Make the house ring ring again.
- **Subheadline:** A safe, screen-free home phone for kids.
- **Supporting line:** Kids calling each other again. No apps. No scrolling. No strangers. No spam. Just talking.
- **Primary CTA:** Join the Club 🔔
- **Secondary CTA:** How it works →
- **Teaser line (italic):** Remember calling a friend after school? We're bringing that back. Plans start at $0/month.
- **Visual:** Hero image right column (no text overlay, no floating badge)
- **Badge:** "Built by nostalgic, middle aged dads outside of Philly" (amber pill, no blinking dot)
- **Background:** `#FAF7F2` with soft amber/orange blur blobs

---

### Beat 2 — 5-Second Explainer (The Clarity)
- **Section label:** How It Works
- **H2:** A home phone. Reimagined.
- **Micro-copy:** Just plug it in. That's it.
- **3-column layout:**
  1. 01 — Plug it in — "The small Ring Ring Bridge connects to your router or mesh." *(amber card)*
  2. 02 — Set your circle — "Only numbers you approve can call or be called. Everyone else is blocked." *(teal card)*
  3. 03 — Let them call / answer — "Your child picks up the phone and calls their friends." *(orange card)*
- **Background:** White

---

### Beat 3 — The Wedge (Why Not a Smartphone?)
- **Section label:** The Catch *(changed from "The Philosophy")*
- **H2:** This isn't really about a phone.
- **Body copy (4 paragraphs, tight spacing — `mb-2` between each):**
  1. A corded phone stays in the house, introducing natural, physical boundaries that restore the home as a sanctuary.
  2. Our kids learn to have a conversation without having a face or screen attached, which leads them to listen deeper, pay attention to each other, and ask questions.
  3. It gives *slightly older kids* independence without the pressure of texting, apps, or late-night scrolling.
  4. We know they'll have a smartphone eventually. We're just helping families start with something simpler.
- **Closing line (italic):** Also, it doesn't follow them into the bathroom.
- **3-column cards (copy trimmed):**
  1. 💬 Real Conversation — "The joy and independence of a focused call."
  2. 🎯 Single-Tasking — "Talking becomes the activity, not something happening alongside scrolling."
  3. 📴 A Clear End — "When the handset goes down, the conversation is over."
- **Footnote (italic):** (Can you tell one of our spouses is a therapist?)
- **Background:** `#FAF7F2`
- **Spacing note:** Reduced `mb-6` to `mb-2` between body paragraphs — section was too airy

---

### Beat 4 — The Moment Story (The Emotional Core)
- **Layout:** Centered, minimal text, high white space — formatted like a poem
- **No section label** — poem opens directly
- **Poem lines (large, black) — `it's 4:30pm.` is the opening line:**
  - It's 4:30pm.
  - Homework is done.
  - Your child picks up the phone
  - and calls their friend
  - to coordinate tomorrow's outfit.
- **Fade lines (muted):**
  - No texting.
  - No scrolling.
  - Just talking.
- **Closing italic:** And yes, they might say "hi" and then forget what to say next...
- **Background:** White

---

### Beat 5 — BYOP (Any Phone. One Club.)
- **Section label:** Any Phone. One Ring Ring.
- **H2:** Any Phone. One Ring Ring Club.
- **2-column cards:**
  - 🛍️ Pick a modern classic. — "Curated handsets ready to ring." → *Browse the Ring Ring Shop →*
  - 📦 Bring your own phone. — "A vintage rotary from your attic or a thrift store find." → *Join the Club with your Phone →*
- **Below cards:** "The Ring Ring Bridge makes any (working) analog phone work on our network."
- **Teaser (italic):** Yes, even the hamburger one.
- **Background:** `#FAF7F2`

---

### Beat 6 — Trust Zone (Features + Philosophy)
- **Section label:** You Stay in Control
- **H2:** Built for safety. Designed for sanity.
- **6-card grid (2 rows × 3 cols):**
  1. ✅ Approved Contacts Only — "You control the circle. Everyone else is politely blocked, automatically."
  2. 🔴 Digital Kill Switch — "Take the phone offline instantly from your dashboard."
  3. 🌙 Quiet Hours — "Schedule silence during homework, dinner, or bedtime. Automatically."
  4. ⏱️ Usage Caps — "Set daily talk limits when needed — and override them on snow days."
  5. ⚡ Quick Dial Shortcuts — "For younger kids who haven't mastered dialing 10 digits yet. And for those who have, but need to call their bff asap."
  6. 🚨 Real E911 — Enterprise-grade routing to local dispatcher with verified address
- **Radical Transparency callout box** moved to *below the pricing cards* in Beat 7 (removed from Beat 6)
- **Background:** White

---

### Beat 7 — Pricing (The Investment)
- **Section label:** Simple, Accessible Pricing
- **H2:** No hidden fees. No contracts.
- **Intro line:** Calling another Ring Ring family is always free. Kind of like a group chat, except people actually talk.
- **Billing toggle:** Pill/tab selector (not a switch) — Monthly tab | Annual tab (Annual tab is filled/highlighted when selected)
  - Annual saves **10%** (not 20%)
  - Annual price: **$8.06/month** (billed annually, ~$11/year savings)
- **2-column pricing cards:**
  - Starter Plan — $0/month
  - The Make it Ring Ring Plan — $8.95/month ($8.06 annual)
- **Radical Transparency Note** sits *below* the two pricing cards
- **Background:** `#FAF7F2`

#### Starter Plan includes:
- Unlimited calling to other Ring Ring Club members
- Up to 5 approved contacts
- Online/offline toggle
- Quick dial shortcuts

#### The Make it Ring Ring Plan includes:
- Everything in Starter
- Unlimited inbound/outbound calls to any US number
- Unlimited approved contacts
- Quick Dial Slots for easy button calling
- Quiet Hours to schedule peace and quiet
- The Digital Kill Switch (Online/Offline toggle)
- Optional Daily Usage Cap (with easy snow-day override)
- Real E911 with verified address

#### Radical Transparency Note (below cards):
> No magic. No cloud buzzwords. Just a small adapter (we call it the Ring Ring Bridge) that allows a real phone to work safely today. It connects to your router. We pre-configure it before it ships.

---

### Beat 8 — Social Proof + Final CTA
- **Section label:** What Families Are Saying
- **3 testimonial cards** (PA-local families — authentic, specific phrasing):
  1. "She actually asks to call her friend after dinner now..." — The Murphys, Havertown PA
  2. "Our son called his friend to plan their bike route for Saturday..." — The Garcias, Wayne PA
  3. "It rang. She sprinted from the other end of the house to answer it..." — The Williamses, Berwyn PA
- **Final CTA block** (dark `stone-900` background, rounded-3xl):
  - H2: Ready to hear it ring ring again?
  - Body: Join families across the country...
  - CTA: Join the Club 🔔
  - Closing line (italic): Warning: May cause parents to learn more about their children's day.
- **Background:** White

---

## 5. Footer Structure

### 3-column link grid + bottom horizontal strip:

| The Club | Support | Account |
|---|---|---|
| Our Analog Story → ringringclub.com/our-story | FAQs → ringringclub.com/faq | Log In → ringringclub.com/login |
| How It Works → ringringclub.com/how-it-works | Setup Guides → ringringclub.com/setup | Sign Up → ringringclub.com/Join |
| The Shop → ringringclub.com/shop | Contact Us → ringringclub.com/contact | Invite a Neighbor → ringringclub.com/invite |
| Pricing → ringringclub.com/pricing | | |
| Community → ringringclub.com/community | | |

### Bottom horizontal strip (not a column — inline, pipe-separated):
`Terms of Service | Privacy Policy | E911 Disclosure | Refund Policy`

### Footer details:
- Background: `stone-900`
- Wordmark: **Ring Ring Club** (white, font-black)
- Tagline: "The safe, screen-free home phone for kids. Built by parents, outside Philadelphia."
- Email: support@ringringphone.com
- Copyright line: © 2026 Ring Ring Club. All rights reserved.
- The old "Legal & Safety" column has been removed — those links now live in the bottom strip.
- The old italic attribution line has been removed.

---

## 6. Page Map (Full Site)

| Page | Route | Status |
|---|---|---|
| Landing / Home | `/landing` | ✅ Built |
| Login / Sign Up | `/login` | ✅ Built |
| Customer Dashboard | `/` | 🔧 Needs rebuild |
| Purchase Flow | `/buy` | ✅ Built |
| The Neighborhood (Community) | `/community` | ✅ Built |
| How It Works | `/how-it-works` | ⬜ Not built (section exists on landing) |
| The Ring Ring Shop | `/shop` | ⬜ Not built |
| Pricing | `/pricing` | ⬜ Not built (section exists on landing) |
| Our Analog Story | `/our-story` | ⬜ Not built |
| FAQ | `/faq` | ⬜ Not built |
| Setup Guides | `/setup` | ⬜ Not built |
| Contact | `/contact` | ⬜ Not built |
| Terms of Service | `/terms` | ⬜ Not built |
| Privacy Policy | `/privacy` | ⬜ Not built |
| E911 Disclosure | `/e911` | ⬜ Not built |
| Refund Policy | `/refunds` | ⬜ Not built |
| Invite a Neighbor | `/invite` | ✅ Built |
| Admin Portal | `/admin` | ✅ Built |

---

## 7. Writing Tone Rules

- **Never** sound like a SaaS company or a telecom
- **Always** write like a thoughtful parent talking to another parent
- Dry humor is encouraged — use it sparingly and let it land
- Avoid: "revolutionary", "cutting-edge", "seamless", "robust", "leverage"
- Embrace: simple sentences, honest admissions, the occasional self-aware aside
- Parenthetical asides are on-brand: *(Can you tell one of our spouses is a therapist?)*
- The warning format works well for closing lines: *Warning: May cause parents to learn more about their children's day.*

---

## 8. The Neighborhood — Community Page (`/community`)

A standalone marketing page. Same visual system as the landing page.

### Layout (7 sections):

**1. Village Core (Header)**
- H1: THE NEIGHBORHOOD
- Sub-headline: It Takes a Village: Supporting the schools and institutions that raise us.
- Intro: "At the Ring Ring Club, we believe..."

**2. The Give Back Program**
- Layout: 2-column (photo placeholder | copy)
- 3 pillars: Collaborative Fundraising / Events & Auctions / The Backbone
- CTA: "Send a Dispatch →" → mailto:support@ringringphone.com

**3. Become a (Legal) "Ring Ring Leader"**
- Intro copy: no influencers — parents who want to bring conversation back to their streets
- 3 numbered Command Center Cards: Host a Pop-Up / Upcycling / Secret Stash
- 2-column photo placeholder row (Leader Kit + Secret Stash phone)
- Dark note bar: "Can't make it to an event? Email us."

**4. The Resource Library**

*Sub-section A — The Free Stuff:*
- 3 Command Center Cards with line-art SVG icons:
  1. 📋 The Ring Ring Cheat Sheet → [Download PDF] | [Order printed]
  2. 🖨️ The Ring Ring Phone Book → [Download] | [Order professional edition]
  3. 🎵 The "Ring Club" Playlist → [Listen on Spotify] (Spotify green button)

*Sub-section B — The Stuff We Can't Afford to Make Free:*
- 3 Command Center Cards: Calling Cards / Professional Prints / Ring Ring Stickers
- Each has a [Shop Now →] CTA
- Note: "Design credit to Jen." on Calling Cards

**5. The Community Roadmap**
- H2: We want you to own the future of the Club.
- First Call photo placeholder
- 2×2 grid: Send us your ideas / Share your wishes / The First Call / Tell us the truth
- CTA: "Send us a note →"

**6. Gratitude & Accountability**
- Horizontal rule separator
- Two editorial paragraphs (no outside investors, accountable to members)
- Final CTA: Join the Club 🔔

**7. Footer Mood / Spotify Embed**
- Dark `stone-900` section
- Embedded Spotify iframe (Ring Club Playlist — swap URL when ready)
- Standard site footer below

### Visual Placeholders (to be replaced with real photos):
| Section | Photo Note |
|---|---|
| Give Back | Vintage phone on library books or at a Family Night table |
| Leader — Kit | Leader Kit on a wooden workbench: Bridge, coiled cord, stickers |
| Leader — Stash | A "Secret Stash" retro phone hinting at unlisted inventory |
| Free Stuff | Cheat Sheet / Phone Book with a child's handwriting + Post-it |
| Paid Goods | Close-up of Calling Cards — hand-drawn design on professional cardstock |
| Roadmap | First Call moment — handset in focus, face blurred |
