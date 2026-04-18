from fastapi import FastAPI, Request
from fastapi.exceptions import HTTPException as FastAPIHTTPException
from starlette.exceptions import HTTPException as StarletteHTTPException
from fastapi.middleware.cors import CORSMiddleware

from backend.api.contracts import (
    ApiError,
    api_error_handler,
    http_exception_handler,
    unhandled_exception_handler,
    get_request_id,
)

from backend.api.system import router as system_router
from backend.api.ingest import router as ingest_router
from backend.api.connectors import router as connectors_router
from backend.api.jobs import router as jobs_router
from backend.api.chat import router as chat_router
from backend.storage.database import init_db

app = FastAPI(title="Herra AI Teaching API", version="1.0.0")


@app.on_event("startup")
def startup_init_db() -> None:
    init_db()


# ---------------------------------------------------------
# CORS (DEV)
# ---------------------------------------------------------
app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:5173",
        "http://127.0.0.1:5173",
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
    expose_headers=["X-Request-Id"],
)

app.add_exception_handler(ApiError, api_error_handler)
app.add_exception_handler(FastAPIHTTPException, http_exception_handler)
app.add_exception_handler(StarletteHTTPException, http_exception_handler)
app.add_exception_handler(Exception, unhandled_exception_handler)


@app.middleware("http")
async def request_id_middleware(request: Request, call_next):
    rid = get_request_id(request)
    response = await call_next(request)
    response.headers["X-Request-Id"] = rid
    return response


app.include_router(system_router)
app.include_router(ingest_router)
app.include_router(connectors_router)
app.include_router(jobs_router)
app.include_router(chat_router)