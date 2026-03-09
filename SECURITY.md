# Security Policy

If you believe you have found a security issue in `firestore-mcp-kit`, please do not open a public issue with exploit details.

Instead, report it privately to the maintainer through GitHub security advisories or another private contact channel if one is available.

Please include:

- a description of the issue
- steps to reproduce it
- impact assessment
- any suggested remediation

This project is a toolkit for building Firestore-backed MCP tools. The most relevant classes of issues are likely to involve:

- authorization mistakes in example or integration code
- unsafe write behavior
- transport-layer request handling
- accidental credential exposure in docs or examples

I will make a best effort to acknowledge reports promptly and coordinate a fix before public disclosure.
