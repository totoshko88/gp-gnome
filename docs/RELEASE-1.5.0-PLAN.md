# gp-gnome 1.5.0 — Release Plan

Branch: `1.5.0` (already checked out). `metadata.json` version is still `11`; bump gated.
Baseline: tests green (6 unit + 13 property specs), lint/gjs/node present.

---

## 1. Headline fix — Issue #4: VPN disconnects on screen lock

**Root cause.** On screen lock GNOME Shell switches the session mode to
`unlock-dialog`. Because `metadata.json` declares no `session-modes`, the shell
**disables** the extension on lock, and `extension.js disable()` deliberately
runs `globalprotect disconnect` ("Auto-disconnect FIRST … on logout/lock").
Result: every lock/unlock drops the VPN. Reported on GNOME 49.5 / Wayland /
Fedora 44, ext 1.4.1.

**Fix (two parts):**

1. **Survive the lock.** Add `"session-modes": ["user", "unlock-dialog"]` to
   `metadata.json` so the extension is *not* torn down when the screen locks.
   This alone keeps monitoring and the VPN alive across lock/unlock.

2. **Make teardown-disconnect conditional.** The disconnect-on-`disable()` must
   only fire on a *real* teardown (logout / extension disable / shell exit), not
   on a lock. Add a GSettings boolean — proposed `disconnect-on-lock`
   (default `false`, i.e. keep VPN up when locked, matching the reporter's
   expectation) — and in `disable()` detect the session mode
   (`Main.sessionMode.currentMode === 'unlock-dialog'`) to skip the disconnect
   when locking. Keep the existing logout auto-disconnect behavior behind its
   own setting (`auto-disconnect-on-logout`, default `true`) so we don't silently
   change the logout contract.

**New settings (schema):**
- `disconnect-on-lock` (b, default false) — "Disconnect VPN when the screen locks".
- `auto-disconnect-on-logout` (b, default true) — preserve current logout behavior, now user-visible.

**UI:** expose both toggles in `prefs.js`.

**Tests:** add a spec asserting `disable()` skips disconnect when
`currentMode === 'unlock-dialog'` and `disconnect-on-lock` is false; and that it
disconnects on true / on logout. Extend the gnome-mocks for `Main.sessionMode`.

**Docs:** CHANGELOG `[1.5.0]` entry crediting #4; README note on the new toggle.

---

## 2. Project / CI / docs audit — proposed improvements

Grouped by effort. All are proposals; nothing applied without your go-ahead.

### CI (`.github/workflows/ci.yml`)
- **Run the actual test suite in CI.** CI currently lints + validates structure
  but never runs `npm test`. Add a job: `npm ci` → `npm test`. The suite is fast
  (<0.03s) and already green. *High value, low effort.*
- **Node version drift.** CI pins Node 20; local is Node 24. Pin via a matrix or
  bump to 20 LTS + 22. Minor.
- **ESLint 8 is EOL.** `package.json` uses `eslint ^8.57.0` (end-of-life). Plan a
  move to ESLint 9 flat config, or document the pin. Medium effort — defer unless
  you want it in 1.5.0.
- **`npm install` → `npm ci`** in CI for reproducible installs (lockfile present).
- **Schema validation** step is good; consider also `desktop-file`/`glib`
  version-aware check. Low priority.
- **No release-notes/version consistency check.** Add a guard that
  `metadata.json` version matches the tag on release (release.yml edits
  indicator.js/prefs.js but never bumps `metadata.json` "version" integer — see below).

### Release (`.github/workflows/release.yml`)
- **`metadata.json` "version" is not bumped on release.** The workflow sed-edits
  the human-readable version strings in `indicator.js`/`prefs.js` but leaves the
  EGO integer `version` untouched — it must be incremented for each EGO upload
  (currently 11). Decide: bump manually per release (document it) or automate in
  the workflow. *Correctness issue — pick one before tagging 1.5.0.*
- Changelog extraction looks solid. Consider failing the job if the extracted
  changelog section is empty.

### `package.json`
- **Name mismatch:** `"name": "gnome-globalprotect-extension"` / `"version":
  "1.0.0"` is stale and unrelated to the extension version. Harmless (dev-only)
  but confusing — align the name to `gp-gnome` and either track the real version
  or drop it. Low effort.

### Schema / settings
- `portal-address` default is a hard-coded `'vpn.epam.com'` — fine as a sample
  but worth noting it ships as the default. Consider empty default + first-run
  prompt. Optional, not for 1.5.0.

### Docs
- README/CHANGELOG are well maintained. Add the #4 toggle to README once fixed.
- `po/` has only `.gitkeep` + a `pot` make target but no catalogs; translation
  story is stubbed. Fine to leave; note it under "Planned" (already listed).

### Nice-to-have / future (not 1.5.0)
- Reconnect-on-unlock option (if a user *does* disconnect on lock, offer to
  auto-reconnect on unlock).
- GNOME Shell 50 is already in `shell-version`; verify against a 49/50 runtime
  before release.

---

## 3. Proposed 1.5.0 scope (minimal, shippable)

1. Fix #4: `session-modes` + conditional teardown + two new settings + prefs UI.
2. CI: run `npm test`; switch to `npm ci`.
3. Release: resolve the `metadata.json` version-bump gap (automate or document).
4. Bump `metadata.json` version 11 → 12; CHANGELOG `[1.5.0]`.
5. Tests for the lock behavior; keep suite green; lint clean.

Everything in §2 beyond those five is optional and can be deferred to 1.5.x/1.6.

---

## 4. Open decisions for you
- **Default behavior on lock:** keep VPN connected (`disconnect-on-lock=false`,
  recommended, matches #4) vs. keep disconnecting (opt-in to stay connected)?
- **EGO version bump:** automate in release.yml, or bump by hand each release?
- **Scope:** ship the minimal 5 above, or fold in ESLint 9 / package.json cleanup now?
