# From HubSpot to trusted data

[Open the eight-scene demo](https://hbfs-cloud.github.io/gamma-slides/data-pipeline/) · [Editable source](../presentations/data-pipeline.yaml)

An English, diagram-led reference architecture for a CRM analytics pipeline. Use **Play story**, select a focus view, or follow the labeled connections. The sequence covers ingestion, n8n queue workers, Batch processing, warehouse modeling, security, recovery and operating budgets.

This deck describes a proposed architecture. It does not connect an account, deploy infrastructure, guarantee throughput or claim certification.

## Read the responsibilities correctly

- HubSpot webhooks enter a signature-checking ingress and a durable SQS buffer. n8n workers consume changes and perform scoped API reads. Scheduled reconciliation covers missed or late changes.
- n8n's Redis queue distributes workflow executions; it is not the SQS ingress buffer. PostgreSQL stores workflow state. Workers pass object references; large datasets remain in S3.
- AWS Batch performs resource-bounded validation and normalization. Versioned inputs, deterministic output keys and complete manifests make controlled replay possible; retries alone do not provide idempotency.
- Amazon Redshift is the example warehouse. COPY loads curated S3 files through a scoped IAM role. dbt submits SQL to the warehouse; it does not move the source files.
- Tests and freshness checks feed an explicitly implemented publication gate. Failed dbt tests are not a universal transactional rollback mechanism.
- Private compute still needs controlled outbound HTTPS for HubSpot. Private network routes supplement, not replace, IAM, secret protection and warehouse authorization.
- Raw personal data, quarantine samples, logs, marts and backups need explicit access, retention and deletion policies. Recovery targets must be defined and measured for the real workload.

## Source basis and decisions

The architecture and operating policies are design choices. Product mechanisms were checked against these primary references on 2026-09-12:

- [HubSpot request validation](https://developers.hubspot.com/docs/apps/developer-platform/build-apps/authentication/request-validation): use the signature scheme applicable to the app and request, including its timestamp rules.
- [HubSpot API usage guidance](https://developers.hubspot.com/docs/developer-tooling/platform/usage-guidelines): account and endpoint limits vary; configure throttling and backoff accordingly.
- [n8n queue-mode documentation](https://docs.n8n.io/deploy/host-n8n/configure-n8n/scaling/enable-queue-mode): review supported queue topology and edition requirements for the version being deployed. This example uses explicit S3 operations, not an assumption that every license includes a managed binary store.
- [AWS Batch retries](https://docs.aws.amazon.com/batch/latest/userguide/job_retries.html): configure bounded attempts and distinguish transient failures from invalid input.
- [Redshift COPY authorization](https://docs.aws.amazon.com/redshift/latest/dg/copy-parameters-authorization.html): prefer scoped IAM-role authorization over embedded access keys.
- [Redshift network isolation](https://docs.aws.amazon.com/redshift/latest/mgmt/network-isolation.html): plan the COPY network path and S3 endpoints explicitly.
- [dbt incremental models](https://docs.getdbt.com/docs/build/incremental-models) and [data tests](https://docs.getdbt.com/docs/build/data-tests): select incremental predicates and unique keys deliberately, and make test outcomes operationally meaningful.

Before implementation: verify the n8n edition and high-availability options, HubSpot app scopes and subscription support, regional AWS capabilities, expected volumes, budgets, deletion obligations and tested recovery objectives. This reference is intentionally not an exactly-once, unlimited-scale or zero-loss promise.
