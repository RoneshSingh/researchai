import json
import logging
import sys
from fastmcp import FastMCP
from notebooklm import NotebookLMClient
from notebooklm.types import AskResult

# Configure logging to write to stderr so it does not interfere with MCP stdout transport
logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s - %(name)s - %(levelname)s - %(message)s",
    stream=sys.stderr,
)
logger = logging.getLogger("notebooklm-mcp")

# Initialize FastMCP server
mcp = FastMCP("notebooklm")

@mcp.tool()
async def notebook_list() -> str:
    """List all available NotebookLM notebooks.
    
    Returns a JSON string containing the list of notebooks with their IDs, titles, and metadata.
    """
    logger.info("Handling tool call: notebook_list")
    try:
        async with NotebookLMClient.from_storage() as client:
            notebooks = await client.notebooks.list()
            result = [
                {
                    "id": nb.id,
                    "title": nb.title,
                    "created_at": nb.created_at,
                    "sources_count": getattr(nb, "sources_count", 0),
                    "is_owner": nb.is_owner,
                }
                for nb in notebooks
            ]
            return json.dumps({"notebooks": result}, indent=2)
    except Exception as e:
        logger.error(f"Error listing notebooks: {e}", exc_info=True)
        return json.dumps({"error": str(e)})

@mcp.tool()
async def notebook_query(notebook_id: str, question: str) -> str:
    """Query a specific NotebookLM notebook by ID with a question.
    
    Args:
        notebook_id: The unique ID of the notebook to query.
        question: The question/prompt to ask the notebook.
        
    Returns the answer grounded in the notebook sources along with full references/citations.
    """
    logger.info(f"Handling tool call: notebook_query (notebook_id={notebook_id})")
    try:
        async with NotebookLMClient.from_storage() as client:
            ask_result: AskResult = await client.chat.ask(notebook_id, question)
            
            # Format references
            references = []
            if hasattr(ask_result, "references") and ask_result.references:
                for ref in ask_result.references:
                    references.append({
                        "source_id": getattr(ref, "source_id", None),
                        "citation_number": getattr(ref, "citation_number", None),
                        "cited_text": getattr(ref, "cited_text", None),
                    })
            
            response_data = {
                "answer": ask_result.answer,
                "conversation_id": getattr(ask_result, "conversation_id", None),
                "references": references,
            }
            return json.dumps(response_data, indent=2)
    except Exception as e:
        logger.error(f"Error querying notebook: {e}", exc_info=True)
        return json.dumps({"error": str(e)})

@mcp.tool()
async def studio_create(notebook_id: str, artifact_type: str = "audio") -> str:
    """Trigger generation of a studio artifact (like a podcast/Audio Overview or Study Guide) for a notebook.
    
    Args:
        notebook_id: The ID of the notebook.
        artifact_type: Type of artifact to generate. Allowed options: 'audio' (default) or 'study_guide'.
        
    Returns status of the generation task, including the task/artifact ID to poll.
    """
    logger.info(f"Handling tool call: studio_create (notebook_id={notebook_id}, type={artifact_type})")
    try:
        async with NotebookLMClient.from_storage() as client:
            if artifact_type == "audio":
                status = await client.artifacts.generate_audio(notebook_id)
            elif artifact_type == "study_guide":
                status = await client.artifacts.generate_study_guide(notebook_id)
            else:
                return json.dumps({"error": f"Unsupported artifact type: '{artifact_type}'. Must be 'audio' or 'study_guide'."})
            
            return json.dumps({
                "task_id": status.task_id,
                "status": status.status,
                "error": getattr(status, "error", None),
                "error_code": getattr(status, "error_code", None),
            }, indent=2)
    except Exception as e:
        logger.error(f"Error initiating studio generation: {e}", exc_info=True)
        return json.dumps({"error": str(e)})

if __name__ == "__main__":
    # Start the FastMCP server
    mcp.run()
