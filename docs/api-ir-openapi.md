# api.ir OpenAPI spec

`api-ir-openapi.json` is api.ir's own OpenAPI 3.1.1 export (their full service catalog, not just company inquiry) — provided by the user, since this contract is only visible inside the logged-in developer panel at p.api.ir, not on api.ir's public marketing pages.

The service actually integrated in this codebase is `/api/sw1/CompanyInfo` ("استعلام شخص حقوقی" — legal-entity inquiry), consumed by [`src/lib/integrations/api-ir.ts`](../src/lib/integrations/api-ir.ts). If api.ir's contract changes, re-check that path in this file against the client.
