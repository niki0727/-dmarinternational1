# DMAR Deployment Runbook (Start From Zero)

This site is static HTML/CSS/JS with custom domain `dmarinternational.com`.

## 1) Source of truth
- GitHub repo default branch: `master`
- Domain in repo: `CNAME` must contain exactly `dmarinternational.com`
- Core SEO files: `sitemap.xml`, `robots.txt`, `_redirects`

## 2) Required GitHub checks
Two workflows are now enabled:
- **Preflight** (`.github/workflows/preflight.yml`) on push/PR
- **Production Monitor** (`.github/workflows/production-monitor.yml`) every 30 minutes + manual run

A change is considered deployment-ready only if both checks pass.

## 3) Host connection checklist
Use your hosting provider dashboard and verify all items below:
1. Connected GitHub repository: `niki0727/-dmarinternational1`
2. Production branch: `master`
3. Build command: none (static)
4. Publish directory: repository root (`/`)
5. Redirect rules file enabled: `_redirects`

## 4) DNS checklist (Cloudflare)
1. `www` points to hosting target (CNAME)
2. Apex `dmarinternational.com` redirects to `https://www.dmarinternational.com/`
3. SSL/TLS active (Full/Strict recommended)
4. Always Use HTTPS enabled

## 5) Go-live smoke test
Run after every deployment:
- `https://www.dmarinternational.com/` returns `200`
- `https://dmarinternational.com/` returns `301` to `https://www.dmarinternational.com/`
- `https://www.dmarinternational.com/services.html` returns `200`
- `https://www.dmarinternational.com/sectors.html` returns `200`
- `https://www.dmarinternational.com/projects.html` returns `200`
- `https://www.dmarinternational.com/sitemap.xml` returns `200`

## 6) If production is stale
1. Re-run **Production Monitor** manually in GitHub Actions.
2. Trigger new deploy from host dashboard.
3. Purge CDN cache for:
   - `/`
   - `/index.html`
   - `/assets/*`
4. Verify again with the smoke test above.

## 7) Rollback
- Revert last commit on `master` and redeploy.
- Confirm smoke test passes before closing incident.
