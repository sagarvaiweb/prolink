# Search document indexing

`SearchDocument` is derived from `User` + `Profile`, `Job`, `Post`, and `Company`. Source writes refresh or deactivate their search document through Mongoose middleware. Search indexing errors are logged and do not fail the source write; rerun the backfill to repair missed derived records.

## Embeddings

Set these backend variables when the embedding service is available:

```env
AI_SERVICE_URL=http://localhost:8000
AI_SERVICE_TOKEN=
SEARCH_EMBEDDING_MODEL=sentence-transformers/all-MiniLM-L6-v2
SEARCH_EMBEDDING_VERSION=v1
SEARCH_VECTOR_DIMENSIONS=384
SEARCH_AI_TIMEOUT_MS=3000
SEARCH_REINDEX_BATCH_SIZE=50
```

Without `AI_SERVICE_URL`, documents are indexed as text with no vector. With it configured, upserts and backfill request embeddings from `POST /embeddings`. If the service fails or returns vectors with the wrong dimensions, the text is still indexed and the vector is omitted. Rerun the reindex script after the service is available to populate missing vectors. Keep the AI credential only in the backend environment.

## Backfill / repair

From `backend/`, run `node src/scripts/reindexSearchDocuments.js` to process all four types, or pass one or more of `person`, `job`, `post`, and `company`. The script uses a cursor and bounded batches; it is safe to rerun. A profile maps to its owning user ID. It reports scanned and active record counts. Configure the embedding service first if vector population is wanted.

## Atlas Search index

Create an Atlas Search index on `searchdocuments`, named `searchdocument_text_index`:

```json
{
  "mappings": {
    "dynamic": false,
    "fields": {
      "searchableText": { "type": "string", "analyzer": "lucene.standard" },
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

After adding the role, title, salary, author, company, or date metadata fields, update the Atlas Search index mapping and rerun the backfill so existing documents gain those fields.

## Keyword search API

`GET /api/search` requires a bearer token. It supports `q`, comma-separated `type`, `mode=keyword`, `page`, `limit`, and filters for location, skills, role, headline/title, job experience level, employment type, the job's exact `salaryRange` text, industry, post author, post date range, and public post visibility. The endpoint queries Atlas Search, batch-loads the source records, rechecks current visibility and status, then returns only safe display fields. Semantic and hybrid modes are added in the next backend part.
