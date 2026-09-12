# Fictional SaaS identity incident demo

[Open the eight-scene demo](https://hbfs-cloud.github.io/gamma-slides/cyber-incident/) · [Editable source](../presentations/cyber-incident.yaml)

`presentations/cyber-incident.yaml` is an eight-slide, diagram-led educational walkthrough for a mixed audience. It describes a fictional employee phishing event, a conditional session-exposure branch, bounded SaaS access, delegated automation review, an attempted data transfer, detection, containment, and recovery.

It is defensive by design: it names no victim, infrastructure, indicator, exploit implementation, or executable action. The deck deliberately does not claim that MFA is universally bypassed. Its session-exposure branch is conditional, and the recovery view avoids any unbounded security promise.

## Narrative and audience cues

| Slide | Question it answers | Defensive message |
| --- | --- | --- |
| 1 | What is inside the incident boundary? | People, identity, SaaS, and response teams have distinct roles and logs. |
| 2 | What does the phishing signal mean? | Filter, verify, and report; a message alone does not prove compromise. |
| 3 | Why investigate a session? | A session can be a conditional risk; compare its use with context and telemetry. |
| 4 | What could the SaaS session reach? | Separate effective privilege, observed activity, and retained evidence. |
| 5 | Why review automation separately? | Delegated service identities have their own owners, scopes, consent, and logs. |
| 6 | What happened at the data boundary? | Verify a policy outcome and evidence before making transfer claims. |
| 7 | How is the incident contained? | Scope, authorize, record, and verify containment while preserving facts. |
| 8 | What changes after recovery? | Improve identity controls and rehearsal; do not promise immunity. |

## Factual framing and sources

- [MITRE ATT&CK: Phishing (T1566)](https://attack.mitre.org/techniques/T1566/) identifies phishing as an initial-access technique and describes mitigations such as filtering, anti-spoofing controls, and user training.
- [MITRE ATT&CK: Steal Web Session Cookie (T1539)](https://attack.mitre.org/techniques/T1539/) describes session-cookie theft and gives defensive examples including authentication auditing, anomaly monitoring, hardware-backed phishing-resistant authentication, trusted-device policy, and constrained cookie lifetime.
- [CISA phishing guidance](https://www.cisa.gov/sites/default/files/2025-03/Phishing%20Guidance%20-%20Stopping%20the%20Attack%20Cycle%20at%20Phase%20One%20508.pdf) recommends a documented incident-response plan and points readers to phishing-resistant MFA resources.
- [CISA/FBI Scattered Spider advisory](https://www.cisa.gov/sites/default/files/2023-11/aa23-320a_scattered_spider_0.pdf) recommends enabling and enforcing phishing-resistant MFA.
- [NIST SP 800-63B authentication guidance](https://pages.nist.gov/800-63-4/sp800-63b/authenticators/) explains phishing resistance and notes that manually entered OTP outputs are not phishing resistant because they are not bound to the specific session; WebAuthn is an example of verifier-name binding.
- [Microsoft Entra consent-phishing guidance](https://learn.microsoft.com/en-us/entra/identity/enterprise-apps/protect-against-consent-phishing) explains that malicious cloud applications can obtain authorized access through granted permissions, and recommends reviewing consent and application activity.

These sources inform general risk and control concepts only. The deck does not assert product behavior, test a configuration, or replace an organization’s incident-response process.

## Validation

Run the deck-level validation, which compiles each typed Archify diagram through the repository’s pinned delivery pipeline:

```sh
bun bin/gamma-slides.js validate -f presentations/cyber-incident.yaml
```

The slide `diagram` schema intentionally contains only `type` and `spec`; this repository selects Archify from the typed `spec` and validates it during deck loading. It does not accept a separate `diagram.engine: archify` field.
