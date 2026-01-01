# Security Policy

## Supported Versions

| Version | Supported          |
| ------- | ------------------ |
| 1.3.x   | :white_check_mark: |
| < 1.3   | :x:                |

## Security Measures

This extension implements several security measures:

- **No shell command injection**: All CLI commands use array arguments via `Gio.Subprocess`
- **Sensitive data sanitization**: Passwords, tokens, and cookies are removed from logs
- **Input validation**: All user inputs are validated before use
- **No telemetry**: No user data is collected or transmitted
- **Auto-disconnect**: VPN disconnects on logout for security

## Reporting a Vulnerability

If you discover a security vulnerability:

1. **Do NOT** open a public issue
2. Email: totoshko88@gmail.com
3. Include:
   - Description of the vulnerability
   - Steps to reproduce
   - Potential impact
   - Suggested fix (if any)

You can expect:
- Acknowledgment within 48 hours
- Status update within 7 days
- Credit in release notes (if desired)

## Scope

Security issues in scope:
- Command injection vulnerabilities
- Credential exposure
- Privilege escalation
- Data leakage

Out of scope:
- GlobalProtect CLI vulnerabilities (report to Palo Alto Networks)
- GNOME Shell vulnerabilities (report to GNOME)
