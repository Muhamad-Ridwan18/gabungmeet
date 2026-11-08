# IB Community — Core Flows

---

## Authentication Flow

```text
Register
  → validate email/password
  → create user (role=member, status=registered)
  → create profile + onboarding_progress (idle)
  → issue JWT (access) + refresh
  → redirect /member  (browse desk first)

Login
  → validate credentials
  → reject if status=locked
  → issue tokens (remember → longer refresh TTL)
  → route:
       admin/super_admin → /admin
       everyone else → /member

Become a member (user chooses)
  → POST /onboarding/start → status=onboarding
  → /onboarding 5 IB steps (no skip)
  → step 5 → pending_verification
  → admin approve → verified → full unlock
```

Middleware stack (API):

1. OptionalJWT / RequireJWT  
2. RequireStatus(`verified`) for premium resources  
3. RequireRole(`admin`|`super_admin`) for admin routes  
4. RequirePermission(`verification.approve`) for fine-grained admin actions  

---

## Verification Flow

```text
Step 1 Watch broker tutorial → step1_done_at
Step 2 Open IB link (settings.ib_register_url) → acknowledge → step2_done_at
Step 3 Submit mt5_account + broker_server
         → create verification_requests (pending)
         → step3_done_at
Step 4 Deposit tutorial + optional proof upload
         → attach proof_key
         → step4_done_at
Step 5 Confirm waiting
         → user.status = pending_verification
         → step5_done_at, completed_at
         → notify admins

Admin Approve
  → request.status = approved
  → user.status = verified
  → notification: Verification Approved
  → unlock all premium modules (status gate)

Admin Reject
  → request.status = rejected + reason
  → user.status = rejected
  → notification with reason
  → user may resubmit (new verification_requests row; onboarding returns to step 3/4)

Admin Lock / Unlock
  → status=locked (API 403 everywhere except profile/support)
  → unlock restores previous verified/pending as recorded in audit/meta
```

Member UI before verified:

- Sidebar modules visible with **lock affordance**
- Cards show thumbnail + title but CTA = “Complete verification”
- Direct URL to premium content → locked state / upsell to verification

---

## AI Customer Service Flow

```text
User opens chat widget (landing or app)
  → session_key (cookie) + optional user_id

POST /ai/chat { message }
  → normalize text
  → match ai_knowledge (keywords / intent classifier)
  → if match:
       return answer + redirect_path (if configured)
       FE: show reply + primary button “Open page”
  → if no match:
       increment fail_count for session
       polite fallback
  → if fail_count >= settings.ai_fail_threshold (default 3):
       need_human = true
       UI: “Need Human Assistance?” → opens ticket form prefilled topic

Persist ai_conversations + ai_messages for admin review.
```

Covered intents (MVP): Broker Registration, MT5, Deposit, Withdrawal, Telegram, Website Navigation, Verification, FAQ.

Prefer **redirect over long text** when a canonical page exists.

---

## Support Ticket Flow

```text
Create ticket (guest or auth)
  → status=open
  → optional link user_id

Admin picks up
  → status=in_progress
  → reply via ticket_messages

Resolve
  → solved → user can reopen message or new ticket
  → closed (terminal)

Notifications on admin reply (if user_id present).
```

---

## Content Access Flow

```text
GET /contents?module=academy
  → if !authenticated: public non-premium only (landing education)
  → if authenticated && !verified: list with locked=true for premium
  → if verified|admin: full payload including video_url / body

Bookmark / history only for verified (or allow bookmark metadata while locked — MVP: verified only).
```

---

## Notification Fan-out (examples)

| Event | Recipients |
|-------|------------|
| Verification approved/rejected | That user |
| New published analysis/signal/article/video | All `verified` members |
| Ticket reply | Ticket owner |
| System | Targeted or broadcast |

---

## Member Dashboard Aggregation

`GET /member/dashboard` returns:

- onboarding/verification progress (if not verified)
- latest announcement (settings or content flag)
- latest analysis / signals / articles / videos (locked flags)
- continue watching/reading
- telegram CTA
- bonus highlights
- unread notification count
