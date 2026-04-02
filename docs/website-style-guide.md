# Ring Ring — Website Style Guide & Layout Reference
*Internal reference document. Last updated: March 2026.*

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
1. **Ring Ring** (logo/wordmark — left)
2. Our Story
3. How It Works
4. The Shop
5. Pricing
6. **Sign In** (text link)
7. **Join the Club 🔔** (primary CTA pill button)

### Behavior
- Sticky, transparent on load
- Gets `bg-[#FAF7F2]/95 backdrop-blur-sm shadow-sm` on scroll
- Mobile: hamburger menu (not yet implemented)

---

## 4. Homepage Layout — All 8 Beats

### Beat 1 — Hero (The Hook)
- **H1:** Make the house ring ring again.
- **Subheadline:** A safe, screen-free home phone for kids.
- **Supporting line:** Kids calling each other again. No apps. No scrolling. No strangers. Just talking.
- **Primary CTA:** Join the Club 🔔
- **Secondary CTA:** How it works →
- **Teaser line (italic):** Remember calling a friend after school? We're bringing that back. Plans start at $0/month.
- **Visual:** Hero image right column, floating "Emma called Grandma ✓" badge
- **Badge:** "Built by parents, outside Philadelphia" (amber pill, top left)
- **Background:** `#FAF7F2` with soft amber/orange blur blobs

---

### Beat 2 — 5-Second Explainer (The Clarity)
- **Section label:** How It Works
- **H2:** A home phone. Reimagined.
- **Micro-copy:** Just plug it in. That's it.
- **3-column layout:**
  1. 01 — Plug it in *(amber card)*
  2. 02 — Set your circle *(teal card)*
  3. 03 — Let them call *(orange card)*
- **Background:** White

---

### Beat 3 — The Wedge (Why Not a Smartphone?)
- **Section label:** The Philosophy
- **H2:** This isn't really about a phone.
- **Body copy:** Spatial boundaries, home as sanctuary, independence without apps
- **Closing line (italic):** Also, it doesn't follow them into the bathroom.
- **3-column cards:**
  1. 💬 Real Conversation
  2. 🎯 Single-Tasking
  3. 📴 A Clear End
- **Footnote (italic):** (Can you tell one of our spouses is a therapist?)
- **Background:** `#FAF7F2`

---

### Beat 4 — The Moment Story (The Emotional Core)
- **Layout:** Centered, minimal text, high white space — formatted like a poem
- **Label:** 4:30 PM. Somewhere in America.
- **Poem lines (large, black):**
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
  - 🛍️ Pick a modern classic. → *Browse the Shop*
  - 📦 Bring your own phone. → *Join with your Phone*
- **Below cards:** "The Ring Ring Bridge makes any (working) analog phone work on our network."
- **Teaser (italic):** Yes, even the hamburger one.
- **Background:** `#FAF7F2`

---

### Beat 6 — Trust Zone (Features + Philosophy)
- **Section label:** You Stay in Control
- **H2:** Built for safety. Designed for sanity.
- **6-card grid (2 rows × 3 cols):**
  1. ✅ Approved Contacts Only
  2. 🔴 Digital Kill Switch
  3. 🌙 Quiet Hours
  4. ⏱️ Usage Caps
  5. ⚡ Quick Dial Shortcuts
  6. 🚨 Real E911
- **Radical Transparency callout box** below grid
- **Background:** White

---

### Beat 7 — Pricing (The Investment)
- **Section label:** Simple, Accessible Pricing
- **H2:** No hidden fees. No contracts.
- **Intro line:** Calling another Ring Ring family is always free. Kind of like a group chat, except people actually talk.
- **Monthly / Annual toggle** (toggle switches to annual, shows 20% savings)
- **2-column pricing cards:**
  - Starter Plan — $0/month
  - Make It Ring Ring — $8.95/month ($7.16 annual)
- **Background:** `#FAF7F2`

#### Starter Plan includes:
- Unlimited Ring Ring → Ring Ring calls
- Up to 5 approved contacts
- Online/offline toggle
- Quick dial shortcuts

#### Make It Ring Ring includes:
- Everything in Starter
- Unlimited calls to any US number
- Unlimited approved contacts
- Quick dial slots
- Quiet Hours scheduling
- Digital Kill Switch
- Optional daily usage cap
- Real E911 with verified address

---

### Beat 8 — Social Proof + Final CTA
- **Section label:** What Families Are Saying
- **3 testimonial cards** (PA-local families — Devon, Wayne, Berwyn)
- **Final CTA block** (dark `stone-900` background, rounded-3xl):
  - H2: Ready to hear it ring ring again?
  - Body: Join families across the country...
  - CTA: Join the Club 🔔
  - Closing line (italic): Warning: May cause children to actually tell you about their day.
- **Background:** White

---

## 5. Footer Structure

### 4-column layout:
| The Club | Support | Legal & Safety | Account |
|---|---|---|---|
| Our Analog Story | FAQ | Terms of Service | Log In |
| How It Works | Setup Guides | Privacy Policy | Sign Up |
| The Shop | Contact Us | Refund Policy | |
| Pricing | Invite a Neighbor | Emergency Calling (911) | |

### Footer details:
- Background: `stone-900`
- Wordmark: **Ring Ring** (white, font-black)
- Tagline: "The safe, screen-free home phone for kids. Built by parents, outside Philadelphia."
- Email: support@ringringphone.com
- Copyright line: © 2026 Ring Ring. All rights reserved.
- Italic attribution: Made by parents, for families. Outside Philadelphia.

---

## 6. Page Map (Full Site)

| Page | Route | Status |
|---|---|---|
| Landing / Home | `/landing` | ✅ Built |
| Login / Sign Up | `/login` | ✅ Built |
| Customer Dashboard | `/` | 🔧 Needs rebuild |
| Purchase Flow | `/buy` | ⬜ Not built |
| How It Works | `/how-it-works` | ⬜ Not built |
| The Shop | `/shop` | ⬜ Not built |
| Pricing | `/pricing` | ⬜ Not built (section exists on landing) |
| Our Analog Story | `/story` | ⬜ Not built |
| FAQ | `/faq` | ⬜ Not built |
| Setup Guides | `/setup` | ⬜ Not built |
| Terms of Service | `/terms` | ⬜ Not built |
| Privacy Policy | `/privacy` | ⬜ Not built |
| Refund Policy | `/refund` | ⬜ Not built |
| Emergency Calling (911) | `/911` | ⬜ Not built |
| Admin Portal | `/admin` | ✅ Built |

---

## 7. Writing Tone Rules

- **Never** sound like a SaaS company or a telecom
- **Always** write like a thoughtful parent talking to another parent
- Dry humor is encouraged — use it sparingly and let it land
- Avoid: "revolutionary", "cutting-edge", "seamless", "robust", "leverage"
- Embrace: simple sentences, honest admissions, the occasional self-aware aside
- Parenthetical asides are on-brand: *(Can you tell one of our spouses is a therapist?)*
- The warning format works well for closing lines: *Warning: May cause actual conversation.*
