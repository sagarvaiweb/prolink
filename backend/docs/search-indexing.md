# Search document indexing

`SearchDocument` is derived from `User` + `Profile`, `Job`, `Post`, and `Company`. Source writes refresh or deactivate their search document through Mongoose middleware. Search indexing errors are logged and do not fail the source write; rerun the backfill to repair missed derived records.

## Embeddings

The FastAPI service lives in `ai-service/` and requires Python 3.10 or newer. Install its requirements and start it from that directory:

```bash
python -m venv .venv
# Activate the virtual environment for your shell, then:
pip install -r requirements.txt
uvicorn app.main:app --host 0.0.0.0 --port 8000
```

From `ai-service/`, copy `.env.example` to `.env` and set `AI_SERVICE_TOKEN`. The service loads that file at startup. Set the same token in the backend environment along with these variables:

```env
AI_SERVICE_URL=http://localhost:8000
AI_SERVICE_TOKEN=replace-with-the-same-secret
SEARCH_EMBEDDING_MODEL=sentence-transformers/all-MiniLM-L6-v2
SEARCH_EMBEDDING_VERSION=v1
SEARCH_VECTOR_DIMENSIONS=384
SEARCH_AI_TIMEOUT_MS=3000
SEARCH_REINDEX_BATCH_SIZE=50
SEARCH_TEXT_INDEX=searchdocument_text_index
SEARCH_VECTOR_INDEX=searchdocument_vector_index
SEARCH_RRF_K=60
SEARCH_CANDIDATE_POOL=100
```

The service loads the model once at startup. `GET /health` reports readiness and model dimensions; `POST /embeddings` accepts a bounded batch of texts and returns vectors, model, version, and dimensions. The backend checks all four before saving or searching with a vector. Keep the shared service token in backend and AI-service environments only.

If the AI service is unavailable during source indexing, the searchable text is still saved and the stale vector is removed. Once the service is available, rerun the backfill to populate vectors. If it is unavailable during a semantic or hybrid request, the API returns keyword results with `fallbackUsed: true` and `mode: "keyword"`.

## Backfill / repair

From `backend/`, run `node src/scripts/reindexSearchDocuments.js` to process all four types, or pass one or more of `person`, `job`, `post`, and `company`. The script creates the MongoDB indexes declared by the search document and recent search models, then uses a cursor and bounded batches to refresh source records. It is safe to rerun. A profile maps to its owning user ID. At the end of each type it reports scanned and active documents, current-model embedding coverage, and missing embeddings. Configure and start the embedding service first if vector population is wanted. Invalid batch-size settings fall back to 50; larger values are capped at 500.

## Operations and readiness

Create both Atlas indexes from the definitions below and wait until Atlas reports each one ready. The text index handles keyword search and autocomplete; the vector index handles semantic and hybrid search. Atlas Search indexes are separate from MongoDB collection indexes, so the reindex command does not create or repair them.

After configuring MongoDB, Atlas, and the optional embedding service, start the backend and call `GET /api/search/health` with an authenticated admin bearer token. The endpoint performs bounded live probes against the configured text, autocomplete, and vector indexes, checks the embedding service's authentication and model/version/dimension settings, and reports active-document embedding coverage. It does not return environment values or service credentials.

- `ready`: keyword, autocomplete, vector, embedding, and coverage checks all pass.
- `degraded`: keyword search is ready, but an optional search capability or embedding coverage needs attention.
- `unavailable`: MongoDB or the keyword index is unavailable, so the core search workflow cannot be confirmed.
- `disabled`: embeddings are not configured. Keyword search remains available; semantic search uses its documented keyword fallback.
- `partial` or `empty` document coverage: rerun the backfill after the source data and embedding service are available.

For repair, first inspect the individual check status and message. Correct environment mismatches or missing Atlas mappings, wait for Atlas index builds to finish, and rerun `node src/scripts/reindexSearchDocuments.js` from `backend/`. The endpoint requires the admin role in addition to normal authentication; embedding-service health checks use the configured shared token.

Integration review checklist:

- Confirm public profiles are searchable to any authenticated user.
- Confirm a `connections` profile is searchable only to its owner and an accepted connection, not to a pending or unrelated user.
- Confirm private profiles are absent from search and autocomplete for other users.
- Confirm a non-admin account receives a forbidden response from `/api/search/health`.
- Confirm the readiness endpoint reports a missing or building Atlas index without exposing secrets.
- Confirm a mismatched embedding model or dimension is reported and does not count as current-model coverage.
- Run the backfill twice and confirm the second run completes without duplicate search documents.
- Disable the embedding service and confirm keyword search remains available with the documented fallback behavior.

## Atlas Search index

Create an Atlas Search index on `searchdocuments`, named `searchdocument_text_index`:

```json
{
  "mappings": {
    "dynamic": false,
    "fields": {
      "searchableText": { "type": "string", "analyzer": "lucene.standard" },
      "suggestionText": {
        "type": "autocomplete",
        "analyzer": "lucene.standard",
        "tokenization": "edgeGram",
        "minGrams": 2,
        "maxGrams": 15,
        "foldDiacritics": true
      },
      "entityType": { "type": "token", "normalizer": "lowercase" },
      "isActive": { "type": "boolean" },
      "metadata": {
        "type": "document",
        "fields": {
          "role": { "type": "token", "normalizer": "lowercase" },
          "title": { "type": "token", "normalizer": "lowercase" },
          "location": { "type": "token", "normalizer": "lowercase" },
          "skills": { "type": "token", "normalizer": "lowercase" },
          "experienceLevel": { "type": "token", "normalizer": "lowercase" },
          "employmentType": { "type": "token", "normalizer": "lowercase" },
          "salaryRange": { "type": "token", "normalizer": "lowercase" },
          "industry": { "type": "token", "normalizer": "lowercase" },
          "visibility": { "type": "token", "normalizer": "lowercase" },
          "authorId": { "type": "objectId" },
          "postedById": { "type": "objectId" },
          "companyId": { "type": "objectId" },
          "createdAt": { "type": "date" }
        }
      }
    }
  }
}
```

## Atlas Vector Search index

Create an Atlas Vector Search index on `searchdocuments`, named `searchdocument_vector_index`:

```json
{
  "fields": [
    { "type": "vector", "path": "embedding", "numDimensions": 384, "similarity": "cosine" },
    { "type": "filter", "path": "entityType" },
    { "type": "filter", "path": "isActive" },
    { "type": "filter", "path": "embeddingModel" },
    { "type": "filter", "path": "embeddingVersion" },
    { "type": "filter", "path": "metadata.location" },
    { "type": "filter", "path": "metadata.experienceLevel" },
    { "type": "filter", "path": "metadata.employmentType" },
    { "type": "filter", "path": "metadata.salaryRange" },
    { "type": "filter", "path": "metadata.industry" },
    { "type": "filter", "path": "metadata.visibility" },
    { "type": "filter", "path": "metadata.role" },
    { "type": "filter", "path": "metadata.title" },
    { "type": "filter", "path": "metadata.authorId" },
    { "type": "filter", "path": "metadata.postedById" },
    { "type": "filter", "path": "metadata.companyId" },
    { "type": "filter", "path": "metadata.createdAt" }
  ]
}
```

The model output dimension, `SEARCH_VECTOR_DIMENSIONS`, and Atlas vector index dimension must match. Model changes require a new embedding version and a full reindex.

After adding the role, title, salary, author, company, date, or suggestion fields, update the Atlas Search index mapping and rerun the backfill so existing documents gain those fields.

## Profile visibility

Public profiles can appear in search and autocomplete for any authenticated user. Profiles with `connections` visibility are returned only to the owner and users with an accepted connection. Private profiles are not indexed for search. The search and autocomplete queries pre-filter connection-visible profiles, then recheck visibility against the current profile and connection records before returning results. The profile detail endpoint uses the same visibility rule. The owner ID is stored in the existing `metadata.authorId` field so the Atlas index definitions above need no additional fields. Rerun the backfill after deploying this change to refresh existing search documents.

## Search API

`GET /api/search` requires a bearer token. It supports `q`, comma-separated `type`, `mode=keyword|semantic|hybrid` (default `hybrid`), `page`, `limit`, and filters for location, skills, role, headline/title, job experience level, employment type, the job's exact `salaryRange` text, industry, post author, post date range, and public post visibility. Keyword mode uses Atlas Search. Semantic mode uses the request embedding and Atlas Vector Search. Hybrid mode fuses both ranked lists with reciprocal rank fusion (RRF). Every mode batch-loads source records and rechecks current visibility and status before returning safe fields. The response reports the mode actually used and sets `fallbackUsed: true` when it falls back to keyword search. For semantic and hybrid modes, `pagination.total` reflects the bounded candidate set retrieved for ranking rather than a corpus-wide exact count.

`GET /api/search/autocomplete?q=react&type=jobs&limit=8` requires a bearer token and returns prefix suggestions for people, jobs, and companies. Queries need at least two characters; results are limited to 10 and deduplicated by entity. Suggestions use Atlas Search autocomplete only and never request embeddings. The endpoint allows 30 requests per minute per IP. MongoDB supports arrays of strings for the `autocomplete` field type; see the [autocomplete mapping](https://www.mongodb.com/docs/search/indexes/field-types/autocomplete-type/) and [autocomplete operator](https://www.mongodb.com/docs/search/query/operators-collectors/autocomplete/).

Recent searches are stored per user in `recentsearches`. Repeating the same normalized query and entity types updates its timestamp instead of adding another entry. The authenticated endpoints are `GET /api/search/recent?limit=10`, `DELETE /api/search/recent/:id`, and `DELETE /api/search/recent`. The list returns at most 10 entries; reads and deletes are scoped to the authenticated user.
