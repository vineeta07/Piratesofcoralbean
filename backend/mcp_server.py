from mcp.server.fastmcp import FastMCP
import json
import contextlib
import sys

# Initialize FastMCP Server
mcp = FastMCP("Coral Sales Intelligence")

@mcp.tool()
def analyze_pipeline_risk(query: str) -> str:
    """
    Run the AI-powered Coral Sales Deal pipeline to analyze deals for risk.
    You should call this tool when the user asks about the status of deals, risk, or sales pipeline.
    
    Args:
        query: The natural language question (e.g. "Show me deals at risk this month")
    """
    # CRITICAL: We must redirect all stdout (print statements from CrewAI) to stderr 
    # so they don't corrupt the JSON-RPC messages sent over stdout by the MCP protocol.
    with contextlib.redirect_stdout(sys.stderr):
        try:
            # Defer import so the MCP server initializes instantly without hanging
            from backend.pipeline.orchestrator import pipeline_orchestrator
            
            # Run the full CrewAI + Coral + Risk Scoring pipeline
            result = pipeline_orchestrator.analyze_query(query)
            
            # We extract the slack formatted text to return a clean summary to the LLM
            if result.get("success", True) and "slack" in result:
                blocks = result["slack"].get("blocks", [])
                
                # Combine the text blocks into a single string
                output = []
                for block in blocks:
                    if "text" in block and "text" in block["text"]:
                        output.append(block["text"]["text"])
                
                return "\n\n".join(output)
            else:
                return f"Pipeline execution failed or returned unexpected format: {json.dumps(result)}"
                
        except Exception as e:
            return f"Error executing pipeline: {str(e)}"

if __name__ == "__main__":
    # Start the standard input/output server for MCP clients
    mcp.run()
