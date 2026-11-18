# Security Policy

## Reporting a vulnerability

Please **do not open a public issue** for security problems.

Private vulnerability reporting is enabled on this repository. Use the
[Security tab](https://github.com/tiagofsps/hunting-fishing-store-web/security) →
**Report a vulnerability**. The report stays private between you and the
maintainer, and the fix can be discussed there.

Please include:

- a short description and the potential impact;
- steps to reproduce (page, action, request payload);
- the affected commit or version, if known.

This is a personal training project maintained in spare time, so a reply may
take a few days.

## Scope notes

- The app keeps a short-lived JWT access token in `localStorage` and relies on
  the API's HttpOnly refresh cookie for renewal. A cross-site scripting flaw
  would expose the access token; report any such finding.
- Demo accounts and the credentials shown in the README exist only to make local
  development convenient. They are not valid credentials for a real deployment.
- The payment gateway is a stub on the backend. This app never handles card
  numbers; it redirects to the provider URL returned by the API.
- The project is MIT licensed; see [LICENSE](LICENSE). It is a personal training
  project, so pull requests are not expected.
