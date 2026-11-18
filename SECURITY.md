# Security Policy

## Reporting a vulnerability

This is a training and portfolio project. Please **do not open a public issue**
for security problems.

Report vulnerabilities privately to **tiagofsantospires@gmail.com** with:

- a short description and the potential impact;
- steps to reproduce (page, action, request payload);
- the affected commit or version, if known.

You can expect an acknowledgement within a few days. Please give a reasonable
amount of time to investigate and fix the issue before any public disclosure.

## Scope notes

- The frontend holds a short-lived JWT access token in `localStorage` and relies
  on the backend's HttpOnly refresh cookie for renewal. A cross-site scripting
  flaw in this app would expose the access token; report any such finding.
- Demo accounts and the credentials shown in the README exist only to make local
  development convenient. They are not valid credentials for a real deployment.
- The payment gateway is a stub on the backend. This app never handles card
  numbers; it redirects to the provider URL returned by the API.
- The project is MIT licensed; see [LICENSE](LICENSE). It is a personal
training project, so pull requests are not expected.
