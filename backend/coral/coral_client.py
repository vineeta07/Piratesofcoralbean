import subprocess
import json
import logging

class CoralDataLoader:
    def __init__(self):
        self._cache = None

    def execute_query(self, sql_string: str) -> list[dict]:
        """Executes a real SQL query against the Coral CLI and returns JSON results."""
        try:
            # Call the Coral CLI to run the SQL query
            result = subprocess.run(
                ["coral", "sql", "--format", "json", sql_string],
                capture_output=True,
                text=True,
                check=True
            )
            
            # Parse the JSON output
            data = json.loads(result.stdout)
            
            # Format empty arrays/nulls if necessary, but Coral JSON should be well-formed
            return data
            
        except subprocess.CalledProcessError as e:
            logging.error(f"Coral CLI Query Failed: {e.stderr}")
            raise Exception(f"Failed to execute Coral query: {e.stderr}")
        except json.JSONDecodeError as e:
            logging.error(f"Failed to parse Coral JSON output: {e}")
            raise Exception("Failed to parse Coral output.")

# Singleton instance for the app
coral_client = CoralDataLoader()
