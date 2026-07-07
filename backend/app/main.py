import datetime
import os
import tempfile
import json
from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from notebooklm import NotebookLMClient
from notebooklm.types import AskResult

app = FastAPI(title="NotebookLM Research Assistant API")

# Enable CORS for frontend integration
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

class QueryRequest(BaseModel):
    question: str

class PodcastRequest(BaseModel):
    language: str = "en"
    instructions: str | None = None

def serialize_datetime(dt):
    if isinstance(dt, datetime.datetime):
        return dt.isoformat()
    return None

def get_client():
    """Helper to retrieve the NotebookLM client.
    
    If running in a cloud/headless environment, it reads Google session cookies
    from the NOTEBOOKLM_STORAGE_STATE_JSON environment variable and writes them
    to a temporary file to authenticate.
    """
    storage_json = os.environ.get("NOTEBOOKLM_STORAGE_STATE_JSON")
    if storage_json:
        try:
            # Validate JSON format
            json.loads(storage_json)
            temp_dir = tempfile.gettempdir()
            temp_path = os.path.join(temp_dir, "storage_state.json")
            with open(temp_path, "w", encoding="utf-8") as f:
                f.write(storage_json)
            return NotebookLMClient.from_storage(path=temp_path)
        except Exception as e:
            # Fall back to default location if env variable is invalid
            pass
            
    return NotebookLMClient.from_storage()


@app.get("/api/notebooks")
async def list_notebooks():
    try:
        async with get_client() as client:
            notebooks = await client.notebooks.list()
            return [
                {
                    "id": nb.id,
                    "title": nb.title,
                    "created_at": serialize_datetime(nb.created_at),
                    "sources_count": getattr(nb, "sources_count", 0),
                    "is_owner": nb.is_owner,
                }
                for nb in notebooks
            ]
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/api/notebooks/{id}/query")
async def query_notebook(id: str, request: QueryRequest):
    try:
        async with get_client() as client:
            ask_result: AskResult = await client.chat.ask(id, request.question)
            
            # Extract references/citations
            references = []
            if hasattr(ask_result, "references") and ask_result.references:
                for ref in ask_result.references:
                    references.append({
                        "source_id": getattr(ref, "source_id", None),
                        "citation_number": getattr(ref, "citation_number", None),
                        "cited_text": getattr(ref, "cited_text", None),
                    })
                    
            return {
                "answer": ask_result.answer,
                "conversation_id": getattr(ask_result, "conversation_id", None),
                "references": references,
            }
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/api/notebooks/{id}/podcast")
async def generate_podcast(id: str, request: PodcastRequest = PodcastRequest()):
    try:
        async with get_client() as client:
            status = await client.artifacts.generate_audio(
                notebook_id=id,
                language=request.language,
                instructions=request.instructions
            )
            return {
                "task_id": status.task_id,
                "status": status.status,
                "error": getattr(status, "error", None),
                "error_code": getattr(status, "error_code", None),
            }
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/api/notebooks/{id}/artifacts")
async def list_artifacts(id: str):
    try:
        async with get_client() as client:
            artifacts = await client.artifacts.list(id)
            return [
                {
                    "id": art.id,
                    "title": art.title,
                    "kind": art.kind.value if hasattr(art.kind, "value") else str(art.kind),
                    "status": art.status_str,
                    "status_code": art.status,
                    "created_at": serialize_datetime(art.created_at),
                    "url": art.url,
                }
                for art in artifacts
            ]
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/api/notebooks/{id}/tasks/{task_id}")
async def check_task_status(id: str, task_id: str):
    try:
        async with get_client() as client:
            status = await client.artifacts.poll_status(id, task_id)
            return {
                "task_id": status.task_id,
                "status": status.status,
                "error": getattr(status, "error", None),
                "error_code": getattr(status, "error_code", None),
            }
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
