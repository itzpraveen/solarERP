const axios = require('axios');

const client = axios.create({
  baseURL: 'http://localhost:4010', // The port the MCP tool runs on
  timeout: 10000, // 10 second timeout for parsing
});

/**
 * Calls the solarProposalParser MCP tool to parse a file.
 * @param {string} filePath - The absolute path to the file to parse.
 * @returns {Promise<object>} - A promise that resolves with the parsed data object { ok: true, data: <SolarProposal> }
 * @throws {Error} - Throws an error if the request fails or the parser returns an error.
 */
async function parse(filePath) {
  try {
    console.log(`[MCP Client] Requesting parsing for: ${filePath}`);
    const response = await client.post('/parse', { filePath });

    if (response.data && response.data.ok) {
      console.log(`[MCP Client] Parsing successful for: ${filePath}`);
      return response.data; // Should contain { ok: true, data: {...} }
    } else {
      // Handle cases where the server responded but with an error message
      const errorMsg = response.data?.error || 'Unknown parsing error';
      const errorDetails = response.data?.details;
      console.error(
        `[MCP Client] Parsing failed for ${filePath}: ${errorMsg}`,
        errorDetails
      );
      throw new Error(
        `Proposal parsing failed: ${errorMsg}${errorDetails ? ` (${JSON.stringify(errorDetails)})` : ''}`
      );
    }
  } catch (error) {
    console.error(
      `[MCP Client] Error calling parser for ${filePath}:`,
      error.message
    );
    if (error.response) {
      // The request was made and the server responded with a status code
      // that falls out of the range of 2xx
      throw new Error(
        `Parser service responded with error ${error.response.status}: ${error.response.data?.error || error.message}`
      );
    } else if (error.request) {
      // The request was made but no response was received
      throw new Error(
        `Parser service did not respond. Is it running? (${error.message})`
      );
    } else {
      // Something happened in setting up the request that triggered an Error
      throw new Error(`Error setting up parser request: ${error.message}`);
    }
  }
}

module.exports = {
  parse,
};
