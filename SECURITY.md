# Security Policy

## Prototype & Client-Side Scope Notice

Gebeta is currently a **client-side web and Capacitor Android UI prototype** with local state persistence (`localStorage`):

- Authentication, OTP verification, and password resets are simulated locally for demonstration flows.
- Payment card entry validates formatting and Luhn checksums client-side, strips sensitive PAN/CVC fields before saving to `localStorage`, and stores only masked labels (`•••• 4821`). No live payment gateway or real charges occur.
- Live order progression (`12s` per stage) and courier/support chat replies are simulated client-side.

## Supported Versions

Security fixes apply to the latest commit on the `main` branch (`v1.x`).

## Reporting a Vulnerability

If you discover a security issue (such as XSS, unsafe storage sanitization, dependency vulnerability, or Capacitor bridge exposure):

1. **Do not** open a public GitHub issue with exploit details.
2. Report privately through [GitHub Security Advisories](https://github.com/Natnael-Dev/Gebeta/security/advisories/new) (or contact the maintainer directly via GitHub).
3. Include reproduction steps, affected file paths, and potential impact. We aim to acknowledge reports within 72 hours.
