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

Without `AI_SERVICE_URL`, documents are indexed as text with no vector. With it configured, upserts and backfill request embeddings from `POST /embeddings`; invalid response dimensions fail the sync and are logged for later retry. Keep the AI credential only in the backend environment.

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
      "entityType": { "type": "token" },
      "isActive": { "type": "boolean" },
      "metadata": {
        "type": "document",
        "fields": {
          "location": { "type": "string", "analyzer": "lucene.keyword" },
          "skills": { "type": "string", "analyzer": "lucene.keyword" },
          "experienceLevel": { "type": "token" },
          "employmentType": { "type": "token" },
          "industry": { "type": "string", "analyzer": "lucene.keyword" },
          "visibility": { "type": "token" }
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
    { "type": "filter", "path": "metadata.industry" },
    { "type": "filter", "path": "metadata.visibility" }
  ]
}
```

The model output dimension, `SEARCH_VECTOR_DIMENSIONS`, and Atlas vector index dimension must match. Model changes require a new embedding version and a full reindex.
