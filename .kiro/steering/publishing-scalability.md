---
inclusion: manual
---

# Publishing Pipeline — Scalability & Production Roadmap

## Current Architecture (Dev/Small Scale)

```
Cron (1 min) → getDuePosts() [DB claim] → publishPost() → Platform API
```

- Single-process, in-memory dedup (`inProgress` Set + DB `__CLAIMED__` sentinel)
- Local filesystem storage (`apps/backend/uploads/`)
- ngrok tunnel for public media URLs
- Retry via `PostRetryService` cron (every 15 min)
- Publish audit in `PublishLog` table

**Works well for:** 1 server instance, <100 posts/day, dev/staging

---

## Production Migration Path

### Step 1 — Persistent Media Storage (PRIORITY: HIGH)

**Problem:** Local `uploads/` is ephemeral on cloud servers (Heroku, Railway, Render restart wipes it).
Media URLs break when ngrok tunnel restarts.

**Fix:** Migrate to S3-compatible storage.

```typescript
// storage.service.ts already has the Supabase path ready
// Set in .env:
STORAGE_PROVIDER=supabase
SUPABASE_URL=https://xxx.supabase.co
SUPABASE_SERVICE_ROLE_KEY=xxx
SUPABASE_BUCKET=socialpilot-media
```

Or use AWS S3:
```
STORAGE_PROVIDER=s3
AWS_ACCESS_KEY_ID=xxx
AWS_SECRET_ACCESS_KEY=xxx
AWS_BUCKET=socialpilot-media
AWS_REGION=us-east-1
```

Once on S3/Supabase:
- Media URLs are permanent (no ngrok dependency)
- Files survive server restarts
- CDN delivery via CloudFront/Supabase CDN

### Step 2 — BullMQ Queue (PRIORITY: HIGH for >500 posts/day)

**Problem:** DB-based cron scheduler has race conditions at scale and can't distribute work across multiple workers.

**Migration:**

```bash
pnpm add bullmq ioredis
```

```typescript
// Replace PostSchedulerService cron with:
@InjectQueue('publish') private publishQueue: Queue

// On post create:
await this.publishQueue.add('publish-post', { postId }, {
  delay: Math.max(0, publishDate.getTime() - Date.now()),
  attempts: 3,
  backoff: { type: 'exponential', delay: 5000 },
  removeOnComplete: false,
  removeOnFail: false,
});

// Worker:
@Processor('publish')
export class PublishWorker extends WorkerHost {
  async process(job: Job<{ postId: string }>) {
    await this.scheduler.publishPost(job.data.postId);
  }
}
```

**Benefits:**
- Exact scheduled time (not ±1 minute)
- Horizontal scaling (multiple workers)
- Built-in retry with backoff
- Job progress tracking
- Dead letter queue for permanent failures
- Bull Board UI for monitoring

**Redis requirement:** Upstash Redis (free tier) works for small scale.

### Step 3 — CDN for Media (PRIORITY: MEDIUM)

Once on S3, add CloudFront:
```
Media URL: https://cdn.yourdomain.com/uploads/uuid.jpg
```

Benefits:
- Global edge delivery (faster for Meta/YouTube to fetch)
- Signed URLs for private media
- Automatic compression/resizing

### Step 4 — Webhook-based Publish Confirmation (PRIORITY: LOW)

Currently: mark PUBLISHED immediately after API call succeeds.
Better: use platform webhooks to confirm actual publication.

- Facebook: `Page Webhooks` → `feed` subscription
- Instagram: `Instagram Webhooks` → `mentions`
- YouTube: `PubSubHubbub` → channel feed

---

## Instagram Reel Requirements (MUST MEET)

| Requirement | Value |
|---|---|
| Video codec | H.264 |
| Audio codec | AAC |
| Aspect ratio | 9:16 (portrait) |
| Min resolution | 500×888px |
| Duration | 3–90 seconds |
| Max file size | 1 GB |
| Frame rate | 23–60 fps |

**Re-encode command:**
```bash
ffmpeg -i input.mp4 \
  -c:v libx264 -preset fast -crf 23 \
  -c:a aac -b:a 128k \
  -vf "scale=1080:1920:force_original_aspect_ratio=decrease,pad=1080:1920:(ow-iw)/2:(oh-ih)/2" \
  -movflags +faststart \
  output_reel.mp4
```

---

## YouTube Shorts Requirements

| Requirement | Value |
|---|---|
| Duration | ≤60 seconds |
| Aspect ratio | 9:16 preferred |
| Title | Must include `#Shorts` |
| Max file size | 256 GB |

The scheduler auto-detects Shorts (≤60s + portrait) and appends `#Shorts` to the title.

---

## Remaining Known Risks

| Risk | Severity | Mitigation |
|---|---|---|
| ngrok tunnel restart breaks media URLs | HIGH | Migrate to S3/Supabase |
| Single-process scheduler | MEDIUM | Migrate to BullMQ |
| Instagram container ERROR with no detail | MEDIUM | Check video specs with `MediaValidatorService` |
| YouTube quota (10k units/day) | MEDIUM | Monitor in Google Cloud Console |
| Token expiry between schedule and publish | LOW | `ensureFreshToken()` handles this |
| Large video upload timeout (>10 min) | LOW | Increase `YOUTUBE_UPLOAD` timeout or use resumable upload API |

---

## Monitoring Checklist

- [ ] Check `PublishLog` table daily for FAILED entries
- [ ] Monitor `Integration.refreshNeeded = true` — means token expired
- [ ] Set up alerts on `Post.state = ERROR` count
- [ ] Monitor `uploads/` directory size (clean up old files)
- [ ] Check YouTube API quota in Google Cloud Console
- [ ] Verify ngrok tunnel is running before scheduled posts fire
