# JeffGPT Production Cost Analysis

Comprehensive cost breakdown for running JeffGPT with real paying customers.

---

## Executive Summary

| Category | Monthly Range | Notes |
|----------|---------------|-------|
| **Fixed Costs** | $15–50 | Hosting, baseline services |
| **Variable Costs (AI)** | $0.30–$10.50 per user | Tier-dependent |
| **Explore user max cost** | $0.56/user | 150 queries × Gemini 1.5 Pro |
| **Research user max cost** | $10.50/user | 1000 queries × Claude 3.5 Sonnet |

### Tiered AI Cost Summary

| Tier | Model | Cost/Query | Max Queries | Max Cost/User |
|------|-------|------------|-------------|---------------|
| Free | Gemini 2.0 Flash | $0.0003 | 15 | **$0.0045** |
| Explore | Gemini 1.5 Pro | $0.00375 | 150 | **$0.5625** |
| Research | Claude 3.5 Sonnet | $0.0105 | 1,000 | **$10.50** |

**Break-even**: 2-3 Explore users ($10/mo) or 1 Research user ($25/mo) covers baseline costs.

---

## 1. Fixed Costs (Monthly)

### Infrastructure

| Service | Free Tier | Expected Cost | Notes |
|---------|-----------|---------------|-------|
| **Railway (Backend)** | $5 credits | $5–20/mo | Python FastAPI + PostgreSQL. Scales with traffic. |
| **Vercel (Frontend)** | 100GB bandwidth | $0–20/mo | Next.js. Free tier generous for early stage. |
| **Domain** | N/A | ~$1/mo | Annual cost amortized (~$12/year) |

**Infrastructure Total**: $6–41/month

### Third-Party Services

| Service | Free Tier Limit | Expected Cost | Pricing Model |
|---------|-----------------|---------------|---------------|
| **Clerk** | 10,000 MAU | $0–25/mo | $0.02/MAU above 10k |
| **PostHog** | 1M events/mo | $0 | Free tier sufficient for early stage |
| **ChromaDB** | Self-hosted | $0 | Embedded, no external service |

**Services Total**: $0–25/month

### Total Fixed Costs: $6–66/month

---

## 2. Variable Costs (Per Query)

### OpenAI Embeddings (Fixed Cost)

```
Model: text-embedding-3-large
Price: $0.00013 per 1K tokens
Average query: ~300 tokens
Cost per query: ~$0.00004
```

### Tiered AI Model Pricing (Current Implementation)

| Tier | Model | Provider | Cost/Query | Sell Price | Margin |
|------|-------|----------|------------|------------|--------|
| **Free** | Gemini 2.0 Flash | Google | $0.0003 | $0 | Loss leader |
| **Explore** | Gemini 1.5 Pro | Google | $0.00375 | $0.01 | 62.5% |
| **Research** | Claude 3.5 Sonnet | Anthropic | $0.0105 | $0.025 | 58% |

### Maximum AI Cost Per User Per Month

| Tier | Query Limit | Cost/Query | Max AI Cost/User/Month |
|------|-------------|------------|------------------------|
| **Free** | 15 | $0.0003 | **$0.0045** |
| **Explore** | 150 | $0.00375 | **$0.5625** |
| **Research** | 1,000 | $0.0105 | **$10.50** |

*Add ~$0.00004/query for embeddings (negligible)*

### Fallback Models (if API keys missing)

| Model | Input $/1M | Output $/1M | Cost/Query | Best For |
|-------|------------|-------------|------------|----------|
| **gpt-4o-mini** | $0.15 | $0.60 | **$0.0008** | Budget fallback |
| **Groq Llama 3.1 8B** | FREE | FREE | **$0** | Free fallback |

---

## 3. Maximum Cost Per Tier Per User (Current Implementation)

### Tier Configuration (from `main.py` and `config.py`)

```python
TIER_LIMITS = {"free": 15, "explore": 150, "research": 1000}

TIER_MODELS = {
    "free": {"provider": "google", "model": "gemini-2.0-flash"},
    "explore": {"provider": "google", "model": "gemini-1.5-pro"},
    "research": {"provider": "anthropic", "model": "claude-3-5-sonnet-20241022"},
}
```

### Per-User AI Cost Breakdown

| Tier | Query Limit | Model | Cost/Query | Max AI Cost | Subscription | Profit |
|------|-------------|-------|------------|-------------|--------------|--------|
| **Free** | 15 | Gemini 2.0 Flash | $0.0003 | $0.0045 | $0 | -$0.0045 |
| **Explore** | 150 | Gemini 1.5 Pro | $0.00375 | $0.5625 | $10/mo | +$9.44 |
| **Research** | 1,000 | Claude 3.5 Sonnet | $0.0105 | $10.50 | $25/mo | +$14.50 |

### Profit Margins

| Tier | Revenue | Max AI Cost | Gross Margin |
|------|---------|-------------|--------------|
| **Free** | $0 | $0.0045 | Loss leader |
| **Explore** | $10/mo | $0.5625 | **94.4%** |
| **Research** | $25/mo | $10.50 | **58.0%** |

### Worst-Case Scenario: Every User Maxes Quota

**Scenario: 1000 Free + 100 Explore + 50 Research users, all at max usage**

| Tier | Users | Max Cost/User | Total AI Cost | Revenue | Net |
|------|-------|---------------|---------------|---------|-----|
| Free | 1,000 | $0.0045 | $4.50 | $0 | -$4.50 |
| Explore | 100 | $0.5625 | $56.25 | $1,000 | +$943.75 |
| Research | 50 | $10.50 | $525.00 | $1,250 | +$725.00 |
| **TOTAL** | 1,150 | — | **$585.75** | **$2,250** | **+$1,664.25** |

### Cost Scaling Projections

| Scale | Free Users | Explore Users | Research Users | Total AI Cost | Revenue | Net Profit |
|-------|------------|---------------|----------------|---------------|---------|------------|
| Launch | 100 | 10 | 5 | $6.13 | $225 | +$218.87 |
| Early | 500 | 25 | 10 | $20.48 | $500 | +$479.52 |
| Growth | 2,000 | 100 | 50 | $590.25 | $2,250 | +$1,659.75 |
| Scale | 10,000 | 500 | 200 | $2,376.38 | $10,000 | +$7,623.62 |

*Assumes all users max their query limits (worst case)*

---

## 4. Current Model Strategy

### Tiered Model Implementation ✅

Models are now routed based on user subscription tier:

| Tier | Model | Rationale |
|------|-------|-----------|
| **Free** | Gemini 2.0 Flash | Ultra-cheap ($0.0003), good enough for trial |
| **Explore** | Gemini 1.5 Pro | Better quality, still high margin (94%) |
| **Research** | Claude 3.5 Sonnet | Best quality, premium users expect it |

### Quality vs Cost Trade-off

| Model | Quality | Speed | Cost | Best For |
|-------|---------|-------|------|----------|
| Gemini 2.0 Flash | Good | Fast | $0.0003 | High volume, cost-sensitive |
| Gemini 1.5 Pro | Very Good | Fast | $0.00375 | Balanced quality/cost |
| Claude 3.5 Sonnet | Excellent | Medium | $0.0105 | Complex analysis, nuanced answers |

### Fallback Strategy

If Google/Anthropic API keys are missing, system falls back to:
- OpenAI gpt-4o-mini ($0.0008/query)
- Groq Llama 3.1 8B (free)

This ensures service continuity during API outages.

---

## 5. Revenue Projections

### Pricing Structure

| Tier | Price | Messages | Max AI Cost | Gross Margin |
|------|-------|----------|-------------|--------------|
| **Free** | $0 | 15/mo | $0.0045 | Loss leader |
| **Explore** | $10/mo | 150/mo | $0.5625 | 94.4% |
| **Research** | $25/mo | 1,000/mo | $10.50 | 58.0% |

### Break-Even Analysis

**Monthly Fixed Costs**: ~$15-30 (early stage with Railway + services)

| Scenario | Users Needed |
|----------|--------------|
| 1 Research user | Covers $25 → profitable |
| 2 Explore users | Covers $20 → break-even |
| 1 Research + 1 Explore | Covers $35 → comfortable margin |

**Realistically**: 3-5 paying users covers all fixed costs.

### Revenue Scenarios (Worst-Case AI Costs)

| Scenario | Free | Explore | Research | MRR | AI Cost | Fixed | Net Profit |
|----------|------|---------|----------|-----|---------|-------|------------|
| Launch | 100 | 5 | 2 | $100 | $3.31 | $20 | +$76.69 |
| Early (Mo 3) | 500 | 20 | 8 | $400 | $96.49 | $30 | +$273.51 |
| Growth (Mo 6) | 1,000 | 50 | 25 | $1,125 | $296.76 | $50 | +$778.24 |
| Scale (Mo 12) | 5,000 | 200 | 100 | $4,500 | $1,185.00 | $100 | +$3,215.00 |

*AI costs assume all users max their query limits every month (worst case)*

---

## 6. Potential Pitfalls & Exploits

### 🚨 CRITICAL RISKS

#### 1. **Unlimited Tier Abuse**

**Issue**: Research tier ($30) has unlimited messages. A single user could send 10,000+ queries.

**Cost Impact**: 
- 10,000 queries × $0.0006 (OpenAI LLM) = $6/user
- Still profitable at $30, but margin drops to 80%

**Mitigation Options**:
- Add soft cap (e.g., 2,000/month, then throttle speed)
- Flag accounts exceeding 500 queries/day for review
- Switch to Groq for high-volume users

#### 2. **Free Tier Account Farming**

**Issue**: Users create multiple accounts to get unlimited free messages (10 per account).

**Signs**: Same IP, similar queries, burner emails.

**Mitigation**:
- Rate limit by IP (not currently implemented per LAUNCH.md)
- Require email verification
- Flag accounts from same IP creating >3 free accounts

#### 3. **Query Token Stuffing**

**Issue**: Malicious users send extremely long queries to inflate embedding costs.

**Current State**: No `max_length` validation on `QueryRequest.query`

**Cost Impact**: A 10,000 token query costs 100x normal embedding cost.

**Mitigation** (from LAUNCH.md, not yet implemented):
```python
class QueryRequest(BaseModel):
    query: str = Field(..., max_length=10000)
```

#### 4. **API Key Misconfiguration**

**Issue**: Tiered models require `GOOGLE_API_KEY` and `ANTHROPIC_API_KEY`. If missing, falls back to OpenAI/Groq.

**Cost Impact**: 
- Fallback (gpt-4o-mini): ~$0.0008/query vs tiered pricing
- Fallback (Groq): $0/query but lower quality

**Difference at Scale**:
- 50,000 queries on fallback: $40 (OpenAI) vs $0 (Groq)
- With proper tiered setup: ~$150-300 depending on tier mix

**Action**: Verify `GOOGLE_API_KEY` and `ANTHROPIC_API_KEY` are set in Railway environment.

### ⚠️ HIGH RISKS

#### 5. **Groq Rate Limits**

**Limits**:
- 30 requests/minute
- 14,400 requests/day

**Issue**: During traffic spikes, users may see errors or delays.

**At Risk Scenarios**:
- Viral moment: 30+ concurrent users
- Research user running automated queries

**Mitigation**:
- Implement request queuing
- Add exponential backoff/retry
- Have OpenAI as fallback (adds cost)

#### 6. **ChromaDB Re-Download Costs**

**Issue**: Backend downloads ChromaDB on cold start if missing. Large file (~100-500MB).

**Cost**: Railway egress charges, cold start latency.

**Mitigation**:
- Use Railway persistent volumes
- Pre-warm after deployments
- Keep instance alive (increases hosting cost)

#### 7. **Clerk MAU Overage**

**Free Tier**: 10,000 Monthly Active Users

**Overage**: $0.02/MAU

**Scenario**: 15,000 MAU = $100 overage

**Mitigation**:
- Monitor MAU in Clerk dashboard
- Set up billing alerts
- Free users still count as MAU

#### 8. **PostgreSQL Storage Growth**

**Issue**: Every message stored in PostgreSQL. Unlimited Research users could create millions of rows.

**Calculation**:
- Average message: ~2KB (content + metadata)
- 1 million messages: ~2GB
- Railway PostgreSQL: First 1GB free, then $0.05/GB

**Mitigation**:
- Implement message archival after 90 days
- Add conversation pruning for free tier
- Monitor database size in Railway

### ⚡ MEDIUM RISKS

#### 9. **Vercel Bandwidth Overage**

**Free Tier**: 100GB/month

**Risk Scenarios**:
- Large images in document viewer
- High traffic without CDN caching

**Mitigation**:
- Optimize images
- Use proper caching headers
- Consider Cloudflare CDN in front

#### 10. **No IP-Based Rate Limiting**

**Current State**: Rate limits are per-user only (from LAUNCH.md checklist, not implemented).

**Issue**: Unauthenticated endpoints could be hammered.

**Mitigation**:
- Add IP rate limiting via middleware
- Use Cloudflare or Railway's built-in DDoS protection

#### 11. **Conversation History Token Explosion**

**Issue**: Conversation history sent to LLM grows with each message. Long conversations = high token costs.

**Current Limit**: `max_history_messages: int = 10`

**Cost Impact**: 10 messages × ~500 tokens = 5,000 extra tokens per query.

**Mitigation**: Current limit of 10 is reasonable. Monitor and adjust if needed.

---

## 7. Cost Monitoring Checklist

### Daily Checks
- [ ] Railway dashboard: CPU/memory usage
- [ ] OpenAI usage: Check for anomalies

### Weekly Checks
- [ ] Clerk MAU count
- [ ] PostgreSQL storage size
- [ ] Groq rate limit hits (if logging)

### Monthly Checks
- [ ] Full cost reconciliation
- [ ] Revenue vs. costs margin
- [ ] User query volume by tier

### Set Up Alerts
- [ ] OpenAI: Budget alert at $20, $50, $100
- [ ] Railway: Usage alert at 80% of plan
- [ ] Clerk: MAU alert at 8,000 (before 10,000 free limit)

---

## 8. Cost Optimization Recommendations

### Immediate (Before Launch)

1. **Verify API Keys**: Ensure `GOOGLE_API_KEY` and `ANTHROPIC_API_KEY` are set in production.

2. **Add Query Length Limit**: Already implemented `max_length=10000` on query field.

3. **Add IP Rate Limiting**: Prevent unauthenticated abuse.

### Short-Term (First Month)

4. **Implement Soft Caps**: Add warning at 80% of message limit, throttle at 95%.

5. **Monitor High-Volume Users**: Dashboard to identify abuse patterns.

6. **Database Pruning**: Auto-delete conversations older than 90 days for free tier.

### Long-Term (Scale)

7. **Response Caching**: Cache common queries to reduce API calls (especially for free tier).

8. **Batch Embeddings**: If supporting bulk operations, batch for efficiency.

9. **Model A/B Testing**: Test if cheaper models maintain quality for specific query types.

---

## 9. Summary: Monthly Operating Cost by Scale

### With Tiered AI Models (Current Implementation)

| Scale | Free | Explore | Research | Fixed | AI Cost | Revenue | Net Profit |
|-------|------|---------|----------|-------|---------|---------|------------|
| Launch | 100 | 10 | 5 | $20 | $58.57 | $225 | **+$146.43** |
| Early | 500 | 25 | 10 | $30 | $119.57 | $475 | **+$325.43** |
| Growth | 2,000 | 100 | 50 | $50 | $590.25 | $2,250 | **+$1,609.75** |
| Scale | 10,000 | 500 | 200 | $100 | $2,376.38 | $10,000 | **+$7,523.62** |

*AI costs assume worst-case: all users max their query limits*

### Cost Per Query by Tier

| Tier | Model | Cost/Query | Queries/User | Cost/User |
|------|-------|------------|--------------|-----------|
| Free | Gemini 2.0 Flash | $0.0003 | 15 | $0.0045 |
| Explore | Gemini 1.5 Pro | $0.00375 | 150 | $0.5625 |
| Research | Claude 3.5 Sonnet | $0.0105 | 1,000 | $10.50 |

### Margin Analysis

| Tier | Subscription | Max AI Cost | Gross Margin |
|------|--------------|-------------|--------------|
| Free | $0 | $0.0045 | -100% (loss leader) |
| Explore | $10/mo | $0.5625 | **94.4%** |
| Research | $25/mo | $10.50 | **58.0%** |

---

## 10. Risk Matrix

| Risk | Likelihood | Impact | Mitigation Status |
|------|------------|--------|-------------------|
| API key misconfiguration | Medium | Medium | ⚠️ Has fallback to OpenAI/Groq |
| Query token stuffing | Low | Medium | ✅ max_length=10000 implemented |
| Research tier abuse (1000 queries) | Low | High ($10.50/user) | ⚠️ Monitoring only |
| Free tier account farming | Medium | Low ($0.0045/user) | ❌ Not implemented |
| Google/Anthropic rate limits | Low | Medium (UX) | ✅ Falls back to OpenAI/Groq |
| Clerk MAU overage | Low | Medium | ❌ No alerts |
| PostgreSQL growth | Low | Low | ⚠️ No pruning |

---

*Last updated: December 2024*

*Assumptions: Google Gemini pricing, Anthropic Claude pricing, OpenAI embedding pricing as of Dec 2024, Railway hobby tier pricing.*

*Tiered models: Gemini 2.0 Flash (Free), Gemini 1.5 Pro (Explore), Claude 3.5 Sonnet (Research)*

