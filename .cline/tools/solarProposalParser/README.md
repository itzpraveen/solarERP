# Solar Proposal Parser MCP Tool

This tool provides an MCP server that parses solar proposal documents (PDF or XLSX) into a standardized JSON format based on a predefined schema.

## Features

*   Listens on port 4010.
*   Provides a `POST /parse` endpoint.
*   Accepts a JSON body with `{ "filePath": "<absolute_path_to_file>" }`.
*   Supports `.pdf` (using `pdf-parse`) and `.xlsx` (using `xlsx`) files.
*   Attempts to map extracted data to the `SolarProposal` schema defined in `schema.json`.
    *   **Note:** The current parsing logic in `index.js` (`parseContentToSchema` function) is a placeholder and needs to be implemented based on the actual structure of vendor proposal documents.
*   Validates the mapped data against the schema using `yup`.
*   Returns `{ "ok": true, "data": <validated_proposal_json> }` on success.
*   Returns `{ "ok": false, "error": "<message>", ... }` on failure (e.g., file not found, unsupported type, parsing error, validation error).

## Usage

1.  **Start the server:**
    ```bash
    cd .cline/tools/solarProposalParser
    npm install
    npm start
    # Or directly: node index.js
    ```
2.  **Register with Cline:** Ensure this tool is registered in the Cline MCP settings file (e.g., `cline_mcp_settings.json`) so it can be called via `<use_mcp_tool>`.
3.  **Call via MCP Client:** Use the provided `client.js` or make direct HTTP POST requests to `http://localhost:4010/parse`.

## Dependencies

*   `express`: Web server framework.
*   `pdf-parse`: For extracting text content from PDF files.
*   `xlsx`: For reading data from XLSX files.
*   `yup`: For schema validation.
