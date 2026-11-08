# IB Community — UI / UX Architecture

## Visual Direction

**Feel:** Netflix (media browsing) + Notion (calm structure) + TradingView (pro trading cues).

| Token | Direction |
|-------|-----------|
| Mode | Dark-first, light optional |
| Surface | Deep charcoal / ink, subtle glass panels (low blur, thin borders) |
| Accent | Single signal color (emerald or electric teal — not purple) |
| Type | Distinct display + clean sans (e.g. Instrument Sans / Geist / Satoshi — not Inter default alone) |
| Motion | 2–3 purposeful motions: hero fade/rise, module unlock, chat drawer |
| Density | Minimal chrome; no generic admin-template cards wall on marketing |

Avoid: purple gradients, neon glow spam, pill-stat strips on landing hero, dashboard-template sidebars on marketing pages.

---

## Sitemap / Layouts

### Landing `(landing)`

```text
Navbar (logo, articles, login, join)
Hero          — brand dominant + one headline + one CTA + full-bleed atmosphere
Benefits
How It Works
Educational Articles
Hook Video
Testimonials
FAQ
CTA
Footer
AI Chat widget (floating)
```

Hero budget: brand, one headline, one sentence, one CTA group, one dominant visual. No stats row.

### Auth `(auth)`

Centered auth shell, quiet background, link back to landing.

### Onboarding `(onboarding)`

Full-height wizard:

- Left/top: step progress (1–5, non-skippable)
- Main: step content
- Sticky footer: Back (only to completed prior) / Continue

Step 5 = waiting state with status timeline (submitted → review → result).

### Member `(member)`

```text
App shell
  ├── Sidebar: Dashboard, Academy, Psychology, Daily Analysis,
  │            Signals, Journal, Bonus, Telegram, Profile, Support
  ├── Topbar: search, notifications badge, avatar
  └── Main canvas
```

Locked modules: visible icons + lock; click → verification CTA sheet.

### Admin `(admin)`

Dense but calm ops UI — table-first, filters, drawers for detail. Not the same visual language as marketing.

---

## Component Structure

```text
components/
  ui/                 # shadcn primitives
  layout/
    SiteHeader.tsx
    SiteFooter.tsx
    MemberShell.tsx
    AdminShell.tsx
    OnboardingShell.tsx
  marketing/
    Hero.tsx
    Benefits.tsx
    HowItWorks.tsx
    HookVideo.tsx
    Testimonials.tsx
    FAQ.tsx
    CTA.tsx
  member/
    ModuleLock.tsx
    ContentCard.tsx
    ContinueRail.tsx
    SignalRow.tsx
    JournalForm.tsx
    NotificationBell.tsx
  onboarding/
    StepProgress.tsx
    StepTutorial.tsx
    StepIBLink.tsx
    StepMT5Form.tsx
    StepDeposit.tsx
    StepWaiting.tsx
  chat/
    ChatWidget.tsx
    ChatMessage.tsx
    HumanAssistCTA.tsx
  admin/
    DataTable.tsx
    VerificationReview.tsx
    ContentEditor.tsx
  forms/
  common/
    EmptyState.tsx
    LockedState.tsx
    PageHeader.tsx
```

---

## Key UI States

| State | Treatment |
|-------|-----------|
| Locked module | Dimmed content card + lock + “Verify broker to unlock” |
| Pending verification | Banner on member shell + disabled premium actions |
| Rejected | Inline reason + Resubmit |
| AI redirect | Message + button navigating to `redirect_path` |
| Need human | Replace composer hint with ticket CTA |

---

## Responsive

- Mobile-first; member sidebar → sheet/drawer
- Landing sections stack; hook video full-bleed width
- Tables → card rows on small screens in admin
