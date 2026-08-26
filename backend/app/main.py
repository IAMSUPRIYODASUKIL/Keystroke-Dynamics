import logging
from contextlib import asynccontextmanager

from fastapi import FastAPI, Request
from fastapi.exceptions import RequestValidationError
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse

# Import models before create_all so every table is registered on Base.metadata.
import app.models  # noqa: F401
from app.api import activity, auth, ml, profile, public, typing
from app.core.config import settings
from app.database.session import Base, engine

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger("keystroke_auth")


@asynccontextmanager
async def lifespan(app: FastAPI):
    Base.metadata.create_all(bind=engine)
    logger.info("Database tables ensured. Environment=%s", settings.ENVIRONMENT)
    yield


app = FastAPI(
    title="Keystroke Dynamics Authentication API",
    description=(
        "User Authentication Using Keystroke Dynamics and Machine Learning — "
        "an academic/research prototype demonstrating typing behavior as an "
        "additional (not sole) authentication factor."
    ),
    version="1.0.0",
    lifespan=lifespan,
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.cors_origins_list,
    allow_origin_regex=settings.CORS_ORIGIN_REGEX,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.exception_handler(RequestValidationError)
async def validation_exception_handler(request: Request, exc: RequestValidationError) -> JSONResponse:
    # Never leak internal validation internals to the client — return a
    # single friendly message plus a compact field/error list.
    errors = [{"field": ".".join(str(p) for p in e["loc"][1:]), "message": e["msg"]} for e in exc.errors()]
    return JSONResponse(
        status_code=422,
        content={"detail": "Some fields were invalid.", "errors": errors},
    )


@app.exception_handler(Exception)
async def unhandled_exception_handler(request: Request, exc: Exception) -> JSONResponse:
    logger.exception("Unhandled server error on %s %s", request.method, request.url.path)
    return JSONResponse(
        status_code=500,
        content={"detail": "An unexpected server error occurred. Please try again."},
    )


@app.get("/api/health", tags=["health"])
def health() -> dict:
    return {"status": "ok"}


app.include_router(public.router)
app.include_router(auth.router)
app.include_router(typing.router)
app.include_router(profile.router)
app.include_router(ml.router)
app.include_router(activity.router)
