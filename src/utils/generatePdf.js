const puppeteer = require('puppeteer');

/**
 * Generates a PDF buffer from proposal data using an HTML template.
 * @param {object} proposalData - The proposal data object.
 * @returns {Promise<Buffer>} - A promise that resolves with the PDF buffer.
 */
const generateProposalPdf = async (proposalData) => {
  // Basic HTML template (will need significant enhancement later)
  // TODO: Replace with a proper HTML template matching the example PDF
  const htmlContent = `
    <!DOCTYPE html>
    <html>
    <head>
        <meta charset="UTF-8">
        <title>Proposal - ${proposalData.name || 'N/A'}</title>
        <style>
            body { font-family: sans-serif; padding: 20px; }
            h1, h2 { color: #333; }
            .section { margin-bottom: 20px; border: 1px solid #eee; padding: 15px; }
            .label { font-weight: bold; color: #555; }
            .value { margin-left: 10px; }
            table { width: 100%; border-collapse: collapse; margin-top: 15px; }
            th, td { border: 1px solid #ddd; padding: 8px; text-align: left; }
            th { background-color: #f2f2f2; }
        </style>
    </head>
    <body>
        <h1>Solar Proposal: ${proposalData.name || 'N/A'}</h1>
        <p><span class="label">Proposal ID:</span> <span class="value">${proposalData.proposalId || 'N/A'}</span></p>
        <p><span class="label">Date:</span> <span class="value">${new Date().toLocaleDateString()}</span></p>
        <p><span class="label">Lead:</span> <span class="value">${proposalData.lead?.firstName || ''} ${proposalData.lead?.lastName || ''}</span></p>

        <div class="section">
            <h2>Financial Summary</h2>
            <table>
                <tr><th>Item</th><th>Amount (${proposalData.currency || 'INR'})</th></tr>
                <tr><td>Project Cost (Excluding Structure)</td><td>${proposalData.projectCostExcludingStructure?.toLocaleString() || '0'}</td></tr>
                <tr><td>Structure Cost</td><td>${proposalData.structureCost?.toLocaleString() || '0'}</td></tr>
                <tr><td><strong>Final Project Cost (A+B)</strong></td><td><strong>${proposalData.finalProjectCost?.toLocaleString() || '0'}</strong></td></tr>
                <tr><td>Subsidy (PM Surya Ghar)</td><td>${proposalData.subsidyAmount?.toLocaleString() || '0'}</td></tr>
                <tr><td><strong>Net Investment</strong></td><td><strong>${proposalData.netInvestment?.toLocaleString() || '0'}</strong></td></tr>
                ${proposalData.additionalCosts > 0 ? `<tr><td>Additional Costs (Registration, etc.)</td><td>${proposalData.additionalCosts?.toLocaleString() || '0'}</td></tr>` : ''}
            </table>
        </div>

        <div class="section">
            <h2>Notes</h2>
            <p>${proposalData.notes || 'N/A'}</p>
        </div>

        <!-- TODO: Add more sections for Lead Info, Equipment, Disclaimers etc. -->
        <!-- TODO: Implement styling to match the example PDF -->

    </body>
    </html>
  `;

  let browser;
  console.log('generateProposalPdf: Starting PDF generation...'); // Log start
  try {
    console.log('generateProposalPdf: Launching Puppeteer...'); // Log before launch
    // Launch Puppeteer
    // Add '--no-sandbox' flag for compatibility in certain environments (like Docker)
    browser = await puppeteer.launch({
      args: ['--no-sandbox', '--disable-setuid-sandbox'],
    });
    console.log('generateProposalPdf: Puppeteer launched.'); // Log after launch
    const page = await browser.newPage();
    console.log('generateProposalPdf: New page created.'); // Log after new page

    // Add error listeners to the page
    page.on('error', (err) => {
      console.error('Puppeteer page error:', err);
    });
    page.on('pageerror', (pageErr) => {
      console.error('Puppeteer page JavaScript error:', pageErr);
    });
    page.on('requestfailed', (request) => {
      console.error(
        `Puppeteer request failed: ${request.url()} - ${request.failure()?.errorText}`
      );
    });
    console.log('generateProposalPdf: Added page error listeners.');

    console.log('generateProposalPdf: Navigating to data URI...'); // Log before goto
    // Navigate to a data URI containing the HTML content
    await page.goto(
      `data:text/html;charset=UTF-8,${encodeURIComponent(htmlContent)}`,
      {
        waitUntil: 'networkidle0', // Wait for network activity to cease
      }
    );
    console.log('generateProposalPdf: Navigation to data URI complete.'); // Log after goto

    console.log('generateProposalPdf: Generating PDF buffer...'); // Log before page.pdf

    // Correctly restored original PDF generation code:
    const pdfBuffer = await page.pdf({
      format: 'A4',
      printBackground: true, // Restore
      margin: { top: '20mm', right: '20mm', bottom: '20mm', left: '20mm' }, // Restore
    });
    console.log(
      `generateProposalPdf: PDF buffer generated (Size: ${pdfBuffer.length} bytes).`
    ); // Restore original log message
    return pdfBuffer;
  } catch (error) {
    console.error(
      'Error during PDF generation steps inside generateProposalPdf:',
      error
    ); // More specific log
    // Ensure the error is re-thrown to be caught by the controller
    throw new Error(`Failed to generate proposal PDF: ${error.message}`);
  } finally {
    console.log('generateProposalPdf: Entering finally block...'); // Log finally
    // Ensure browser is closed
    if (browser) {
      console.log('generateProposalPdf: Closing browser...'); // Log before close
      await browser.close();
      console.log('generateProposalPdf: Browser closed.'); // Log after close
    }
    console.log('generateProposalPdf: PDF generation process finished.'); // Log end
  }
};

module.exports = { generateProposalPdf };
