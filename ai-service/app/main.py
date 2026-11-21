import hmac
import logging
import os
from contextlib import asynccontextmanager
from typing import Annotated

import numpy as np
from dotenv import load_dotenv
from fastapi import FastAPI, Header, HTTPException, status
from pydantic import BaseModel, ConfigDict, Field, field_validator
from sentence_transformers import SentenceTransformer

load_dotenv()

logging.basicConfig(level=os.getenv("LOG_LEVEL", "INFO"))
logger = logging.getLogger("search_embeddings")

MODEL_NAME = os.getenv(
    "MODEL_PATH", "sentence-transformers/all-MiniLM-L6-v2"
)
MODEL_VERSION = os.getenv("MODEL_VERSION", "v1")
EMBEDDING_DIMENSIONS = int(os.getenv("EMBEDDING_DIMENSIONS", "384"))
AI_SERVICE_TOKEN = os.getenv("AI_SERVICE_TOKEN", "")
MAX_BATCH_SIZE = int(os.getenv("MAX_EMBEDDING_BATCH_SIZE", "32"))
MAX_TEXT_LENGTH = int(os.getenv("MAX_EMBEDDING_TEXT_LENGTH", "30000"))

model: SentenceTransformer | None = None


class EmbeddingRequest(BaseModel):
    model_config = ConfigDict(extra="forbid")

    texts: list[str] = Field(min_length=1, max_length=MAX_BATCH_SIZE)

    @field_validator("texts")
    @classmethod
    def validate_texts(cls, texts: list[str]) -> list[str]:
        for text in texts:
            if not text.strip():
                raise ValueError("Texts cannot be empty.")
            if len(text) > MAX_TEXT_LENGTH:
                raise ValueError(
                    f"Each text must be at most {MAX_TEXT_LENGTH} characters."
                )
        return texts


@asynccontextmanager
async def lifespan(_: FastAPI):
    global model

    try:
        loaded_model = SentenceTransformer(MODEL_NAME)
        actual_dimensions = loaded_model.get_sentence_embedding_dimension()
        if actual_dimensions != EMBEDDING_DIMENSIONS:
            raise ValueError(
                "Configured embedding dimensions do not match the model output."
            )
        model = loaded_model
        logger.info("Embedding model is ready.")
    except Exception as error:
        model = None
        logger.exception("Embedding model could not be loaded.")

    yield


app = FastAPI(
    title="ProLink Search Embedding Service",
    version=MODEL_VERSION,
    lifespan=lifespan,
)


def verify_service_token(authorization: Annotated[str | None, Header()] = None):
    if not AI_SERVICE_TOKEN:
        return

    expected = f"Bearer {AI_SERVICE_TOKEN}"
    if not authorization or not hmac.compare_digest(authorization, expected):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid service credentials.",
        )


@app.get("/health")
def health(authorization: Annotated[str | None, Header()] = None):
    verify_service_token(authorization)

    if model is None:
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail="Embedding model is unavailable.",
        )

    return {
        "status": "ok",
        "authentication": "configured" if AI_SERVICE_TOKEN else "disabled",
        "model": MODEL_NAME,
        "version": MODEL_VERSION,
        "dimensions": EMBEDDING_DIMENSIONS,
    }


@app.post("/embeddings")
def create_embeddings(
    request: EmbeddingRequest,
    authorization: Annotated[str | None, Header()] = None,
):
    verify_service_token(authorization)

    if model is None:
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail="Embedding model is unavailable.",
        )

    try:
        vectors = model.encode(
            request.texts,
            convert_to_numpy=True,
            normalize_embeddings=True,
            show_progress_bar=False,
        )
    except Exception as error:
        logger.exception("Embedding request failed.")
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail="Could not create embeddings.",
        ) from error

    embeddings = np.asarray(vectors, dtype=np.float32)
    if embeddings.shape != (len(request.texts), EMBEDDING_DIMENSIONS):
        logger.error("Embedding model returned an unexpected vector shape.")
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail="Embedding model returned an incompatible vector.",
        )

    return {
        "embeddings": embeddings.tolist(),
        "model": MODEL_NAME,
        "version": MODEL_VERSION,
        "dimensions": EMBEDDING_DIMENSIONS,
    }
