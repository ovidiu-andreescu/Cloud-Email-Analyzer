# Integration Tests

This directory is reserved for end-to-end tests that exercise the canonical `MailReceived` workflow against the subscription-free LocalStack development path.

The previous `assert True` placeholder was removed because it allowed CI to report integration success without testing the system. The real integration suite and its required infrastructure are tracked in [GitHub issue #15](https://github.com/ovidiu-andreescu/Cloud-Email-Analyzer/issues/15).
