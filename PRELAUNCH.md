# JeffGPT Pre-Launch Checklist

Pre-production checklist for legal, security, and operational readiness.

---

## 🚨 CRITICAL (Do Before Launch)

### Legal

- [x] **Privacy Policy** — Required by law when collecting personal data. You're storing user IDs, conversation history, and payment info via Clerk. Must disclose:
  - What data you collect (conversations, usage, payment info)
  - How you use it (RAG queries, billing)
  - Third parties (Clerk, OpenAI, Groq, Railway, Vercel)
  - Data retention periods
  - User rights (deletion, export)

- [x] **Terms of Service** — Contract between you and users. Include:
  - Acceptable use policy (no illegal research, no harassment)
  - Content disclaimer (AI can hallucinate, sources are public records)
  - Limitation of liability
  - Subscription terms and cancellation policy
  - Intellectual property (who owns the queries/outputs)

- [x] **Refund Policy** — Required for payment processing. Define:
  - Conditions for refunds
  - Pro-rata vs full-month policy
  - How to request refunds

- [ ] **Business Entity** — Consider forming an LLC. Personal liability protection when charging money. Cost: ~$50-500 depending on state.

- [ ] **Cookie/Consent Banner** — Clerk uses cookies. GDPR/CCPA require consent for tracking. Add a consent banner before setting non-essential cookies.

### Security

- [x] **Tighten CORS Origins** — CORS is environment-based. Development defaults to localhost; production requires explicit `CORS_ORIGINS` and rejects localhost/placeholder domains.
  ```python
  # rag-backend/app/core/config.py
  # e.g. CORS_ORIGINS='["https://your-domain.com"]'
  cors_origins: list[str] = []
  ...
  def get_cors_origins(self) -> list[str]:
      if self.app_env == "development":
          if not self.cors_origins:
              return ["http://localhost:3000"]
          return self.cors_origins

      if not self.cors_origins:
          raise ValueError("CORS_ORIGINS must be set in production. Set CORS_ORIGINS as a JSON array.")
      # Reject unsafe placeholder origins in production
      unsafe_patterns = ["localhost", "yourdomain.com", "127.0.0.1"]
      ...
      return self.cors_origins
  ```

- [x] **Add Security Headers** — Already configured in `interface/next.config.ts`:
  ```typescript
  const nextConfig: NextConfig = {
    headers: async () => [
      {
        source: "/:path*",
        headers: [
          { key: "X-Frame-Options", value: "DENY" },
          { key: "X-Content-Type-Options", value: "nosniff" },
          { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
          { key: "X-XSS-Protection", value: "1; mode=block" },
        ],
      },
    ],
  };
  ```

- [ ] **Environment Variables Audit**
  - Verify no secrets in git history
  - Confirm `.env` is in `.gitignore`
  - Use Railway/Vercel environment variable UI, not committed files
  - Rotate any API keys that may have been exposed during development

- [x] **Backend Input Validation** — Explicit length limits are already enforced to prevent abuse:
  ```python
  # rag-backend/app/main.py
  class QueryRequest(BaseModel):
      query: str = Field(..., min_length=1, max_length=10000)
  ```

---

## ⚠️ HIGH PRIORITY (First Week)

### Monitoring & Reliability

- [ ] **Error Monitoring** — Add Sentry or similar. Current `console.error` calls won't alert you to production issues. Sentry has free tier.

- [ ] **Uptime Monitoring** — Use UptimeRobot, Better Uptime, or similar to alert when backend goes down.

- [ ] **Database Backups** — Confirm Railway PostgreSQL has automated backups enabled. Test restore process.

- [ ] **Logging** — Add structured logging to backend. Railway logs are ephemeral.

### Payment & Billing

- [ ] **Clerk Billing Webhook Verification** — Ensure subscription changes (upgrades, downgrades, cancellations) are handled correctly. Test the full flow.

- [ ] **Failed Payment Handling** — Define behavior when payment fails. Immediate revocation or grace period?

- [ ] **Usage Reset Edge Cases** — Billing period resets on the 1st. Test edge cases (subscribe on 31st, etc.).

- [ ] **Tax Collection** — Configure sales tax collection if required by jurisdiction. Clerk/Stripe can handle this.

### User Experience

- [ ] **Contact/Support Email** — Users need a way to reach you. Add support email and display prominently.

- [ ] **Delete Account Flow** — GDPR requires account deletion. Clerk handles auth, but PostgreSQL data (conversations, usage) must also be deleted.

- [ ] **Data Export** — Users should be able to export their conversation history.

---

## 📋 MEDIUM PRIORITY (First Month)

### Security Hardening

- [ ] **Rate Limiting by IP** — Current limits are per-user. Add IP-based rate limiting to prevent abuse from unauthenticated requests.

- [ ] **API Key Rotation Schedule** — Set calendar reminders to rotate OpenAI/Groq keys quarterly.

- [ ] **Dependency Audit** — Run `bun audit` and check for vulnerabilities. Set up Dependabot/Renovate for automated updates.

- [ ] **CSP (Content Security Policy)** — Add to security headers once all external resources are known.

### Business Operations

- [ ] **Analytics** — Add basic analytics (Plausible, PostHog, or Vercel Analytics) to understand user behavior.

- [ ] **Usage Monitoring** — Track OpenAI/Groq API costs. Set up billing alerts.

- [ ] **Backup Email Delivery** — If adding transactional emails (receipts, etc.), use a reliable provider.

### Documentation

- [ ] **README/Landing Page** — Clear explanation of product, pricing, and how to get started.

- [ ] **FAQ Page** — Anticipate common questions:
  - What documents are included?
  - How accurate is it?
  - Can I cancel anytime?

---

## ✅ NICE TO HAVE (Post-Launch)

- [ ] **Status Page** — Public status page for transparency during outages
- [ ] **Changelog** — Document updates and improvements
- [ ] **API Documentation** — If offering API access
- [ ] **SOC 2 / Security Page** — For enterprise customers
- [ ] **Bug Bounty Program** — For security researchers

---

## Summary

| Category | Critical | High | Medium |
|----------|----------|------|--------|
| Legal | 2 items | 0 items | 0 items |
| Security | 1 item | 0 items | 4 items |
| Billing | 0 items | 4 items | 0 items |
| Monitoring | 0 items | 4 items | 0 items |
| UX | 0 items | 3 items | 2 items |

**Minimum viable launch**: Complete all Critical items. Everything else can follow.

---

*Last updated: December 2025*





