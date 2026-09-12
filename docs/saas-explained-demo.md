# SaaS explained: editable demo deck

[Open the seven-scene demo](https://hbfs-cloud.github.io/gamma-slides/saas-explained/) · [Editable source](../presentations/saas-explained.yaml)

`presentations/saas-explained.yaml` is a seven-slide, diagram-led explanation of how a fictional shared-booking SaaS can work. It is written for people who do not work in technology.

## Narrative

1. A customer books a time.
2. The online workspace checks the right business diary.
3. The confirmation reaches both the customer and the team.
4. An employee updates a booking when plans change.
5. Teammates see the shared plan according to their roles.
6. A subscription supports the provider-run online service and its help path.
7. An illustrative interruption shows a recovery and communication path.

Every slide uses the existing `layout: diagram` presentation layout with an editable Archify architecture specification. Each scene uses a compact `1100 × 500` composition, labeled animated actions, and three guided focus views.

## Plain-language guardrails

- “SaaS” is described as software provided by a provider and used online.
- “Cloud” means a provider-managed application accessed online; it does not imply a particular technical setup.
- The business, roles, support, and recovery path are fictional examples, not claims about a real product.
- Role-specific permissions and customer separation are stated as intentional design goals, not absolute guarantees.
- Reliability and recovery are presented as an illustrative responsible path, never as a time or availability promise.

## Validation

Validate the deck with the repository presentation checks, then validate every embedded architecture specification with Archify’s showcase profile. The final source remains editable YAML; no rendered artifact is required for the demo.

```sh
bun bin/gamma-slides.js validate -f presentations/saas-explained.yaml
```
