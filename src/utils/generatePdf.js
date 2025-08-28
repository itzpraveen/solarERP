const PDFDocument = require('pdfkit');
// These variables are defined but never used
// const fs = require('fs');
// const path = require('path');

/**
 * Generates a PDF buffer from proposal data using PDFKit with enhanced styling.
 * @param {object} proposalData - The proposal data object.
 * @returns {Promise<Buffer>} - A promise that resolves with the PDF buffer.
 */
const generateProposalPdf = async (proposalData) => {
  console.log('generateProposalPdf: Starting PDF generation using PDFKit...');

  return new Promise((resolve, reject) => {
    try {
      // Create a PDF document with better initial options
      const doc = new PDFDocument({
        size: 'A4',
        margin: 50,
        bufferPages: true, // Enable page buffering for better control
        autoFirstPage: true, // Automatically create the first page
        info: {
          Title: `Solar Proposal: ${proposalData.name || 'N/A'}`,
          Author: 'Solar ERP System',
          Subject: 'Solar Installation Proposal',
          Keywords: 'solar, proposal, renewable energy',
          CreationDate: new Date(),
        },
      });

      // Create a buffer to store the PDF data
      const buffers = [];
      doc.on('data', (data) => buffers.push(data));

      doc.on('end', () => {
        const pdfBuffer = Buffer.concat(buffers);
        console.log(
          `PDF generation completed. Buffer size: ${pdfBuffer.length} bytes`
        );

        // Verify PDF signature
        const pdfStartString = pdfBuffer.toString('ascii', 0, 5);
        console.log(
          `Checking PDF signature. String found: "${pdfStartString}" (Length: ${pdfStartString.length})`
        );

        if (pdfStartString !== '%PDF-') {
          console.error('Generated buffer does not start with %PDF-');
          reject(
            new Error(
              'Generated buffer is not a valid PDF (missing PDF signature)'
            )
          );
          return;
        }

        resolve(pdfBuffer);
      });

      // Handle errors during generation
      doc.on('error', (err) => {
        console.error('PDFKit error:', err);
        reject(new Error(`PDFKit generation error: ${err.message}`));
      });

      // Set up enhanced styles
      const fonts = {
        title: 'Times-Bold',
        subtitle: 'Times-Bold',
        heading: 'Times-Bold',
        regular: 'Times-Roman',
        light: 'Times-Italic',
      };

      const fontSize = {
        title: 24,
        subtitle: 18,
        heading: 16,
        subheading: 14,
        regular: 12,
        small: 10,
        footer: 9,
      };

      const colors = {
        primary: '#005792', // New Deep Blue
        secondary: '#00A0B0', // New Teal/Turquoise
        accent: '#F7931E', // New Orange
        text: '#212121', // Darker Gray
        lightText: '#5F5F5F', // Medium Gray
        background: '#FFFFFF', // White (no change)
        lightBackground: '#F8F8F8', // Lighter Gray
        border: '#D0D0D0', // Lighter Gray
      };

      // Helper functions for styling
      const formatCurrency = (amount) => {
        if (amount === undefined || amount === null) return '0';
        const symbol = proposalData.currency === 'INR' ? '₹' : '$';
        return `${symbol}${parseFloat(amount).toLocaleString('en-IN', { maximumFractionDigits: 2 })}`;
      };

      const formatDate = (dateString) => {
        if (!dateString) return 'N/A';
        const date = new Date(dateString);
        return date.toLocaleDateString('en-IN', {
          day: '2-digit',
          month: 'short',
          year: 'numeric',
        });
      };

      // Commented out: unused function
      // const drawDivider = (y = doc.y, color = colors.border, width = 1) => {
      //   doc
      //     .moveTo(50, y)
      //     .lineTo(doc.page.width - 50, y)
      //     .lineWidth(width)
      //     .stroke(color);
      //   doc.moveDown(0.5);
      // };

      // Helper to create colored boxes
      const drawBox = (
        x,
        y,
        width,
        height,
        color = colors.lightBackground,
        borderColor = null
      ) => {
        doc.rect(x, y, width, height).fill(color);

        if (borderColor) {
          doc.rect(x, y, width, height).lineWidth(1).stroke(borderColor);
        }
      };

      // Add a watermark to every page
      const addWatermark = () => {
        const pageCount = doc.bufferedPageRange().count;
        // Using let and ++ to increment counter, replace with i+=1
        for (let i = 0; i < pageCount; i += 1) {
          doc.switchToPage(i);

          // Save the current state
          doc.save();

          // Add a watermark in the background
          doc
            .rotate(45, { origin: [doc.page.width / 2, doc.page.height / 2] })
            .fontSize(60)
            .fillOpacity(0.05)
            .fillColor(colors.primary)
            .text(
              'SOLAR ERP',
              doc.page.width / 2 - 150,
              doc.page.height / 2 - 30,
              {
                align: 'center',
              }
            );

          // Restore to the previous state
          doc.restore();

          // Add page numbers at the bottom
          doc
            .font(fonts.regular) // Changed from default
            .fontSize(fontSize.small) // Changed from fontSize.footer
            .fillColor(colors.text) // Changed from colors.lightText
            .text(`Page ${i + 1} of ${pageCount}`, 50, doc.page.height - 30, {
              align: 'center',
              width: doc.page.width - 100,
            });
        }
      };

      // Add a header with company logo/name to each page
      const addHeader = () => {
        const logoPath = './assets/logo.png';
        const logoWidth = 80;
        const logoHeight = 50; // Assuming a typical logo height for vertical alignment
        const headerTextY = 45 + (logoHeight / 2) - (fontSize.subtitle / 2) ; // Attempt to vertically center text with logo
        const headerLineY = 85; // Adjusted Y for the line to be below logo/text

        try {
          doc.image(logoPath, 50, 45, { width: logoWidth, height: logoHeight });
          // Logo loaded successfully, position text to its right
          doc
            .font(fonts.subtitle) // Changed from fonts.title for consistency
            .fontSize(fontSize.subtitle)
            .fillColor(colors.primary)
            .text('SOLAR ERP SYSTEM', 50 + logoWidth + 10, headerTextY, { width: 300 });
        } catch (e) {
          console.warn(`Could not load logo at ${logoPath}: ${e.message}`);
          // Logo failed to load, use default text position
          doc
            .font(fonts.subtitle) // Changed from fonts.title for consistency
            .fontSize(fontSize.subtitle)
            .fillColor(colors.primary)
            .text('SOLAR ERP SYSTEM', 50, headerTextY, { width: 300 }); // Adjusted Y to headerTextY
        }

        // Add a horizontal line under the header
        doc
          .moveTo(50, headerLineY) // Use adjusted Y
          .lineTo(doc.page.width - 50, headerLineY) // Use adjusted Y
          .lineWidth(1.5)
          .stroke(colors.border);

        doc.moveDown(1); // This moveDown might need adjustment based on headerLineY
      };

      // Add the header
      addHeader();

      // Add title section with background
      const titleY = 100; // Y position of the title box
      const titleHeight = 80; // Height of the title box
      drawBox(50, titleY, doc.page.width - 100, titleHeight, colors.primary, null);

      doc
        .font(fonts.title)
        .fontSize(fontSize.title)
        .fillColor('#FFFFFF') // As per requirement
        .text('SOLAR PROPOSAL', 50, titleY + (titleHeight / 2) - (fontSize.title / 2) - 10, { // Centered with padding
          align: 'center',
          width: doc.page.width - 100,
        });

      doc
        .font(fonts.subtitle) // As per requirement
        .fontSize(fontSize.subtitle)
        .fillColor('#FFFFFF') // As per requirement
        .text(proposalData.name || 'N/A', 50, titleY + (titleHeight / 2) + (fontSize.subtitle / 2) - 5, { // Centered with spacing
          align: 'center',
          width: doc.page.width - 100,
        });

      // Add proposal date and reference information in a styled box
      const infoBoxY = titleY + titleHeight + 20; // Positioned below title box with spacing
      const infoBoxHeight = 70; // Increased height for better padding
      drawBox(
        50,
        infoBoxY,
        doc.page.width - 100,
        infoBoxHeight,
        colors.lightBackground, // As per requirement
        colors.border // As per requirement
      );

      const infoBoxPadding = 15;
      const infoBoxTextY = infoBoxY + infoBoxPadding;
      const infoBoxCol1X = 50 + infoBoxPadding;
      const infoBoxCol2X = doc.page.width / 2 + infoBoxPadding / 2; // For second column items

      doc // Date
        .font(fonts.heading) // As per requirement
        .fillColor(colors.primary) // As per requirement
        .fontSize(fontSize.regular) // Using regular for labels for better fit
        .text('Date:', infoBoxCol1X, infoBoxTextY)
        .font(fonts.regular) // As per requirement
        .fillColor(colors.text) // As per requirement
        .text(formatDate(new Date()), infoBoxCol1X + 60, infoBoxTextY);

      doc // Proposal ID
        .font(fonts.heading) // As per requirement
        .fillColor(colors.primary) // As per requirement
        .fontSize(fontSize.regular)
        .text('Proposal ID:', infoBoxCol1X, infoBoxTextY + 25)
        .font(fonts.regular) // As per requirement
        .fillColor(colors.text) // As per requirement
        .text(proposalData._id || proposalData.id || 'N/A', infoBoxCol1X + 60, infoBoxTextY + 25);
      
      doc // Valid Until
        .font(fonts.heading) // As per requirement
        .fillColor(colors.primary) // As per requirement
        .fontSize(fontSize.regular)
        .text('Valid Until:', infoBoxCol2X, infoBoxTextY)
        .font(fonts.regular) // As per requirement
        .fillColor(colors.text) // As per requirement
        .text(formatDate(proposalData.validUntil),infoBoxCol2X + 70, infoBoxTextY);

      doc // Lead
        .font(fonts.heading) // As per requirement
        .fillColor(colors.primary) // As per requirement
        .fontSize(fontSize.regular)
        .text('Lead:', infoBoxCol2X, infoBoxTextY + 25)
        .font(fonts.regular) // As per requirement
        .fillColor(colors.text) // As per requirement
        .text(`${proposalData.lead?.firstName || ''} ${proposalData.lead?.lastName || ''}`, infoBoxCol2X + 70, infoBoxTextY + 25);

      // Move to position below the info box
      doc.y = infoBoxY + infoBoxHeight + 25; // Increased spacing from 20 to 25

      // Client and Proposal Details section
      doc
        .font(fonts.heading)
        .fontSize(fontSize.heading + 2) // Increased size
        .fillColor(colors.primary)
        .text('Proposal Details')
        .moveDown(0.75); // Changed from 0.5

      // Create a styled table for details
      const detailsTableY = doc.y;
      const tableWidth = doc.page.width - 100;
      const col1Width = 180; // Keep as is, or adjust if needed
      const col2Width = tableWidth - col1Width;
      const tableHeaderHeight = 30; // As per current
      const detailRowHeight = 30; // New row height

      // Draw table header
      drawBox(50, detailsTableY, tableWidth, tableHeaderHeight, colors.primary);

      doc
        .fillColor('#FFFFFF') // Text color for header
        .font(fonts.heading) // Font for header
        .fontSize(fontSize.regular) // Font size for header text
        .text('Project Specifications', 50 + 10, detailsTableY + (tableHeaderHeight / 2) - (fontSize.regular / 2), { // Centered with padding
          width: tableWidth - 20, // Keep padding
        });

      // Add rows for the details table with alternating background colors
      let rowY = detailsTableY + tableHeaderHeight;

      // Helper to add a row to the details table
      const addDetailRow = (label, value, isAlternate = false) => {
        drawBox(
          50,
          rowY,
          tableWidth,
          detailRowHeight, // Use new row height
          isAlternate ? colors.lightBackground : colors.background,
          colors.border
        );

        const textY = rowY + (detailRowHeight / 2) - (fontSize.regular / 2); // Vertically centered text

        doc
          .fillColor(colors.text) // Color for labels
          .font(fonts.heading) // Font for labels
          .fontSize(fontSize.regular)
          .text(label, 50 + 10, textY, { width: col1Width - 20 }); // Padded

        doc
          .fillColor(colors.text) // Color for values
          .font(fonts.regular) // Font for values
          .fontSize(fontSize.regular)
          .text(value, 50 + col1Width + 10, textY, { width: col2Width - 20 }); // Padded

        rowY += detailRowHeight; // Increment by new row height
      };

      // Add specification details
      addDetailRow('System Size', `${proposalData.systemSize || 'N/A'} kW`);
      addDetailRow('Panel Count', proposalData.panelCount || 'N/A', true);
      addDetailRow('Panel Type', proposalData.panelType || 'N/A');
      addDetailRow('Inverter', proposalData.inverterType || 'N/A', true);
      addDetailRow('Structure Type', proposalData.structureType || 'N/A');
      addDetailRow(
        'Installation Area',
        `${proposalData.installationArea || 'N/A'} sq m`,
        true
      );

      // Move to position below the details table
      doc.y = rowY + 30; // Increased spacing from 20 to 30

      // Financial Summary section with styled table
      doc
        .font(fonts.heading)
        .fontSize(fontSize.heading + 2) // Increased size
        .fillColor(colors.primary)
        .text('Financial Summary')
        .moveDown(0.75); // Changed from 0.5

      // Create a styled table for financial data
      const financialTableY = doc.y;
      const financialTableHeaderHeight = 30;
      const financialRowHeight = 30; // New row height

      // Draw table header
      drawBox(50, financialTableY, tableWidth, financialTableHeaderHeight, colors.primary);

      doc
        .fillColor('#FFFFFF') // Text color for header
        .font(fonts.heading) // Font for header
        .fontSize(fontSize.regular) // Font size for header text
        .text('Cost Breakdown', 50 + 10, financialTableY + (financialTableHeaderHeight / 2) - (fontSize.regular / 2), { // Centered with padding
          width: col1Width - 20, // Adjusted for padding
        })
        .text('Amount', 50 + col1Width, financialTableY + (financialTableHeaderHeight / 2) - (fontSize.regular / 2), { // Centered with padding
          width: col2Width - 20, // Adjusted for padding
          align: 'right',
        });

      // Add rows for the financial table
      rowY = financialTableY + financialTableHeaderHeight;

      // Helper to add a row to the financial table
      const addFinancialRow = (
        label,
        value,
        isAlternate = false,
        isBold = false
      ) => {
        drawBox(
          50,
          rowY,
          tableWidth,
          financialRowHeight, // Use new row height
          isAlternate ? colors.lightBackground : colors.background,
          colors.border
        );

        const textY = rowY + (financialRowHeight / 2) - (fontSize.regular / 2); // Vertically centered text

        doc
          .fillColor(colors.text) // Color for labels/values
          .font(isBold ? fonts.heading : fonts.regular) // Font for labels/values
          .fontSize(fontSize.regular)
          .text(label, 50 + 10, textY, { width: col1Width - 20 }); // Padded

        doc
          .fillColor(colors.text) // Color for labels/values (repeated for clarity, could be set once)
          .font(isBold ? fonts.heading : fonts.regular) // Font for labels/values
          .fontSize(fontSize.regular)
          .text(value, 50 + col1Width + 10, textY, { // Padded
            width: col2Width - 20, // Adjusted for padding
            align: 'right',
          });

        rowY += financialRowHeight; // Increment by new row height
      };

      // Add financial details
      addFinancialRow(
        'Project Cost (Excluding Structure)',
        formatCurrency(proposalData.projectCostExcludingStructure)
      );
      addFinancialRow(
        'Structure Cost',
        formatCurrency(proposalData.structureCost),
        true
      );

      // Add a highlight row for total cost
      const highlightRowHeight = 35; // As per current
      drawBox(50, rowY, tableWidth, highlightRowHeight, colors.secondary, null); // Use new secondary color

      const highlightTextY = rowY + (highlightRowHeight / 2) - (fontSize.subheading / 2); // Centered text

      doc
        .fillColor('#FFFFFF') // Text color for highlight
        .font(fonts.heading) // Font for highlight
        .fontSize(fontSize.subheading) // Font size for highlight
        .text('Final Project Cost (A+B)', 50 + 10, highlightTextY, { // Padded
          width: col1Width - 20,
        })
        .text(
          formatCurrency(proposalData.finalProjectCost),
          50 + col1Width + 10, // Padded
          highlightTextY,
          { width: col2Width - 20, align: 'right' } // Padded
        );

      rowY += highlightRowHeight;

      // Continue with remaining financial details
      addFinancialRow(
        'Subsidy (PM Surya Ghar)',
        formatCurrency(proposalData.subsidyAmount)
      );

      if (proposalData.additionalCosts > 0) {
        addFinancialRow(
          'Additional Costs (Registration, etc.)',
          formatCurrency(proposalData.additionalCosts),
          true
        );
      }

      // Add a highlight row for net investment
      // highlightRowHeight is already defined and can be reused if it's the same (35)
      drawBox(50, rowY, tableWidth, highlightRowHeight, colors.primary, null); // Use new primary color

      // highlightTextY can be reused or recalculated if font size changes
      const netInvestmentTextY = rowY + (highlightRowHeight / 2) - (fontSize.subheading / 2); // Centered

      doc
        .fillColor('#FFFFFF') // Text color for highlight
        .font(fonts.heading) // Font for highlight
        .fontSize(fontSize.subheading) // Font size for highlight
        .text('Net Investment', 50 + 10, netInvestmentTextY, { width: col1Width - 20 }) // Padded
        .text(
          formatCurrency(proposalData.netInvestment),
          50 + col1Width + 10, // Padded
          netInvestmentTextY,
          { width: col2Width - 20, align: 'right' } // Padded
        );

      rowY += highlightRowHeight;
      doc.y = rowY; // Ensure doc.y is updated after the last financial row.
      doc.moveDown(1.5); // Add explicit space before checking for page break or starting ROI.

      // Add a section about ROI with some visual elements
      // The rowY = doc.y inside the else was potentially problematic for spacing.
      // It's better to let doc.y flow naturally or be set explicitly after moveDown.
      if (doc.y + 200 > doc.page.height - 100) { // Check if ROI fits
        doc.addPage();
        addHeader();
        // After adding a new page, reset Y or let it flow from top margin.
        // ROI section title will be rendered next.
      }
      // Removed else { rowY = doc.y; }

      // ROI Section
      doc
        .font(fonts.heading)
        .fontSize(fontSize.heading + 2) // Increased size
        .fillColor(colors.primary)
        .text('Return on Investment')
        .moveDown(0.75); // Changed from 0.5

      // Draw a box for ROI information
      const roiBoxY = doc.y;
      const roiBoxHeight = 90; // Keep current height or adjust if needed
      const roiPadding = 15;
      drawBox(
        50,
        roiBoxY,
        tableWidth,
        roiBoxHeight,
        colors.lightBackground, // As per requirement
        colors.border // As per requirement
      );

      // Add ROI content
      const roiLabelX = 50 + roiPadding;
      const roiValueX = 50 + 200; // Adjust as needed for alignment
      const roiLineSpacing = 25; // Space between lines

      doc // Annual Savings
        .font(fonts.regular) // Label font
        .fontSize(fontSize.regular)
        .fillColor(colors.text) // Label color
        .text('Estimated Annual Savings:', roiLabelX, roiBoxY + roiPadding);
      doc
        .font(fonts.heading) // Value font
        .fontSize(fontSize.regular) // Value font size (can be different)
        .fillColor(colors.secondary) // Value color
        .text(formatCurrency(proposalData.annualSavings || 12000), roiValueX, roiBoxY + roiPadding);

      doc // Payback Period
        .font(fonts.regular)
        .fontSize(fontSize.regular)
        .fillColor(colors.text)
        .text('Estimated Payback Period:', roiLabelX, roiBoxY + roiPadding + roiLineSpacing);
      doc
        .font(fonts.heading)
        .fontSize(fontSize.regular)
        .fillColor(colors.secondary)
        .text(`${proposalData.paybackPeriod || '4-5'} Years`, roiValueX, roiBoxY + roiPadding + roiLineSpacing);

      doc // Lifetime Savings
        .font(fonts.regular)
        .fontSize(fontSize.regular)
        .fillColor(colors.text)
        .text('Estimated Lifetime Savings:', roiLabelX, roiBoxY + roiPadding + roiLineSpacing * 2);
      doc
        .font(fonts.heading)
        .fontSize(fontSize.regular)
        .fillColor(colors.secondary)
        .text(formatCurrency(proposalData.lifetimeSavings || 300000), roiValueX, roiBoxY + roiPadding + roiLineSpacing * 2);
      
      doc.y = roiBoxY + roiBoxHeight + 30; // Increased spacing from 20 to 30
      let eqRowY = doc.y; // Initialize eqRowY here, in case lineItems is empty

      // Equipment Details section (if line items exist)
      if (proposalData.lineItems && proposalData.lineItems.length > 0) {
        // If there was no page break before ROI, and ROI was short,
        // we might need space before Equipment Details if it's on the same page.
        // The addPage() for equipment details is handled if the *first item* doesn't fit.
        // Consider adding a general moveDown before this section if needed,
        // but the existing page break logic for line items should handle most cases.
        // The doc.y from ROI section + 30 should provide initial spacing.

        doc.addPage(); // This was always here, seems a bit aggressive if ROI is short.
                       // However, the task is about inter-section spacing, not conditional page breaks.
                       // Let's assume this addPage is intentional for now.
        addHeader();

        doc
          .font(fonts.heading)
          .fontSize(fontSize.heading + 2) // Increased size
          .fillColor(colors.primary)
          .text('Equipment Details')
          .moveDown(0.75); // Changed from 0.5

        // Table header
        const eqTableTop = doc.y;
        const eqTableHeaderHeight = 30; // Standard header height
        const eqRowHeight = 30; // Standard row height
        const eqPadding = 10; // Padding for cells

        const colWidths = [ // Ensure these sum to tableWidth or are managed
          tableWidth * 0.3,
          tableWidth * 0.15,
          tableWidth * 0.3,
          tableWidth * 0.25, // Ensure last col doesn't overflow due to padding
        ];

        // Draw table header
        drawBox(50, eqTableTop, tableWidth, eqTableHeaderHeight, colors.primary);
        
        const headerTextY = eqTableTop + (eqTableHeaderHeight / 2) - (fontSize.regular / 2); // Centered text

        doc
          .fillColor('#FFFFFF') // Header text color
          .font(fonts.heading) // Header font
          .fontSize(fontSize.regular); // Header font size

        doc.text('Item', 50 + eqPadding, headerTextY, { width: colWidths[0] - eqPadding * 2 });
        doc.text('Quantity', 50 + colWidths[0] + eqPadding, headerTextY, { width: colWidths[1] - eqPadding * 2 });
        doc.text('Category', 50 + colWidths[0] + colWidths[1] + eqPadding, headerTextY, { width: colWidths[2] - eqPadding * 2 });
        doc.text('Model', 50 + colWidths[0] + colWidths[1] + colWidths[2] + eqPadding, headerTextY, { width: colWidths[3] - eqPadding * 2 });

        // Table rows
        let eqRowY = eqTableTop + eqTableHeaderHeight;

        // Add rows for each line item
        proposalData.lineItems.forEach((item, index) => {
          // Draw row background (alternating for readability)
          drawBox(
            50,
            eqRowY,
            tableWidth,
            eqRowHeight, // Use new row height
            index % 2 === 0 ? colors.background : colors.lightBackground,
            colors.border
          );

          const cellTextY = eqRowY + (eqRowHeight / 2) - (fontSize.regular / 2); // Vertically centered text

          doc
            .fillColor(colors.text) // Cell text color
            .font(fonts.regular) // Cell font
            .fontSize(fontSize.regular); // Cell font size

          doc.text(item.itemId?.name || 'N/A', 50 + eqPadding, cellTextY, { width: colWidths[0] - eqPadding * 2 });
          doc.text(item.quantity || '0', 50 + colWidths[0] + eqPadding, cellTextY, { width: colWidths[1] - eqPadding * 2 });
          doc.text(item.itemId?.category || 'N/A', 50 + colWidths[0] + colWidths[1] + eqPadding, cellTextY, { width: colWidths[2] - eqPadding * 2 });
          doc.text(item.itemId?.modelNumber || 'N/A', 50 + colWidths[0] + colWidths[1] + colWidths[2] + eqPadding, cellTextY, { width: colWidths[3] - eqPadding * 2 });
          
          eqRowY += eqRowHeight; // Increment by new row height

          // Check if we need a new page
          if (
            eqRowY > doc.page.height - 100 &&
            index < proposalData.lineItems.length - 1
          ) {
            doc.addPage();
            addHeader();
            eqRowY = 120;

            // Re-add the table header on the new page
            // eqRowY is the start of the new row, so header should be eqRowY - eqTableHeaderHeight
            const newPageHeaderY = eqRowY - eqTableHeaderHeight; 
            drawBox(50, newPageHeaderY, tableWidth, eqTableHeaderHeight, colors.primary);
            
            const newPageHeaderTextY = newPageHeaderY + (eqTableHeaderHeight / 2) - (fontSize.regular / 2);

            doc
              .fillColor('#FFFFFF')
              .font(fonts.heading)
              .fontSize(fontSize.regular);

            doc.text('Item', 50 + eqPadding, newPageHeaderTextY, { width: colWidths[0] - eqPadding * 2 });
            doc.text('Quantity', 50 + colWidths[0] + eqPadding, newPageHeaderTextY, { width: colWidths[1] - eqPadding * 2 });
            doc.text('Category', 50 + colWidths[0] + colWidths[1] + eqPadding, newPageHeaderTextY, { width: colWidths[2] - eqPadding * 2 });
            doc.text('Model', 50 + colWidths[0] + colWidths[1] + colWidths[2] + eqPadding, newPageHeaderTextY, { width: colWidths[3] - eqPadding * 2 });
          }
        });
      }

      // Notes section
      // After equipment details loop, eqRowY is the current position.
      // We need to set doc.y based on eqRowY before the Notes section.
      if (proposalData.lineItems && proposalData.lineItems.length > 0) {
        doc.y = eqRowY; // Update doc.y to after the last equipment item
        doc.moveDown(1.5); // Add spacing after equipment table before notes or page break check
      }


      if (doc.y + 150 > doc.page.height - 100) { // Check if Notes section fits
        doc.addPage();
        addHeader();
      } else {
        // If no page break, and there were no equipment details,
        // ensure space after ROI box before Notes title.
        // This is covered by doc.y = roiBoxY + roiBoxHeight + 30;
        // If there were equipment details, space is added by the new doc.moveDown(1.5) above.
        // The existing doc.moveDown(2) here might be too much if space was already added.
        // Let's remove the else doc.moveDown(2) and rely on consistent spacing added *after* previous content.
      }

      doc
        .font(fonts.heading)
        .fontSize(fontSize.heading + 2) // Increased size
        .fillColor(colors.primary)
        .text('Notes')
        .moveDown(0.75); // Changed from 0.5

      // Draw a box for notes
      const notesBoxY = doc.y;
      const notesBoxHeight = 100; // Keep current or adjust
      const notesPadding = 15;
      drawBox(
        50,
        notesBoxY,
        tableWidth,
        notesBoxHeight,
        colors.lightBackground, // As per requirement
        colors.border // As per requirement
      );

      doc
        .font(fonts.regular) // As per requirement
        .fontSize(fontSize.regular) // As per requirement
        .fillColor(colors.text) // As per requirement
        .text(
          proposalData.notes || 'No additional notes provided.',
          50 + notesPadding, // Padded X
          notesBoxY + notesPadding, // Padded Y
          {
            width: tableWidth - notesPadding * 2, // Padded width
            align: 'left',
          }
        );
      
      doc.y = notesBoxY + notesBoxHeight + 30; // Increased spacing from 20 to 30

      // Terms and conditions (brief version)
      // doc.moveDown(2); // This was here before, let's rely on the +30 above and title's moveDown.
      // The +30 above should be sufficient.
      doc
        .font(fonts.heading)
        .fontSize(fontSize.heading + 2) // Increased size
        .fillColor(colors.primary)
        .text('Terms & Conditions')
        .moveDown(0.75); // Changed from 0.5

      const terms = [
        'This proposal is valid for 30 days from the date of issue.',
        'A 25% advance payment is required to begin the installation process.',
        'The final cost may vary based on site conditions and requirements.',
        'Installation timeline is subject to weather conditions and material availability.',
        'Warranty details will be provided in the final contract.',
      ];

      terms.forEach((term, index) => {
        doc
          .font(fonts.regular) // As per requirement
          .fontSize(fontSize.regular) // Changed from fontSize.small
          .fillColor(colors.lightText) // As per requirement
          .text(`${index + 1}. ${term}`, 50, doc.y, {
            width: tableWidth,
            align: 'left',
          });
        doc.moveDown(0.75); // Increased line spacing slightly - this is fine for intra-section
      });

      // Add footer with signature box
      doc.moveDown(1.5); // Increased spacing from 1 to 1.5 before signature boxes

      // Draw signature boxes
      const sigBoxWidth = (tableWidth - 20) / 2; // Keep width logic
      const sigBoxY = doc.y;
      const sigBoxHeight = 70; // Keep height
      const sigPadding = 10; // Padding for text inside boxes
      const sigLabelY = sigBoxY + sigPadding;
      const sigLine1Y = sigBoxY + sigPadding + 20; // Y for "Name: ___"
      const sigLine2Y = sigBoxY + sigPadding + 40; // Y for "Date: ___"


      // Customer signature
      drawBox(50, sigBoxY, sigBoxWidth, sigBoxHeight, colors.background, colors.border); // Styles as per requirement
      doc
        .font(fonts.heading) // Font for label
        .fontSize(fontSize.small) // Size for label
        .fillColor(colors.text) // Color for label
        .text('Customer Signature', 50 + sigPadding, sigLabelY, {
          width: sigBoxWidth - sigPadding * 2,
        });

      doc
        .font(fonts.regular) // Font for placeholder lines
        .fontSize(fontSize.small) // Size for placeholder lines
        .fillColor(colors.text) // Color for placeholder lines
        .text('Name: _____________________', 50 + sigPadding, sigLine1Y, {
          width: sigBoxWidth - sigPadding * 2,
        })
        .text('Date: ______________________', 50 + sigPadding, sigLine2Y, {
          width: sigBoxWidth - sigPadding * 2,
        });

      // Company signature
      const companySigX = 50 + sigBoxWidth + 20;
      drawBox(companySigX, sigBoxY, sigBoxWidth, sigBoxHeight, colors.background, colors.border); // Styles as per requirement
      doc
        .font(fonts.heading) // Font for label
        .fontSize(fontSize.small) // Size for label
        .fillColor(colors.text) // Color for label
        .text('Company Representative', companySigX + sigPadding, sigLabelY, {
          width: sigBoxWidth - sigPadding * 2,
        });

      doc
        .font(fonts.regular) // Font for placeholder lines
        .fontSize(fontSize.small) // Size for placeholder lines
        .fillColor(colors.text) // Color for placeholder lines
        .text(
          'Name: _____________________',
          companySigX + sigPadding,
          sigLine1Y,
          { width: sigBoxWidth - sigPadding * 2 }
        )
        .text(
          'Date: ______________________',
          companySigX + sigPadding,
          sigLine2Y,
          { width: sigBoxWidth - sigPadding * 2 }
        );

      // Add a contact information footer
      doc.moveDown(2); // Changed from 3, as signature boxes might take more perceived space with padding.
                       // Or keep 3 if it looks better. Let's try 2.
      drawBox(50, doc.y, tableWidth, 50, colors.primary);

      doc
        .font(fonts.heading)
        .fontSize(fontSize.subheading) // Changed from fontSize.regular
        .fillColor('#FFFFFF')
        .text('Contact Information', 60, doc.y - 42, { // Adjusted Y position
          align: 'center',
          width: tableWidth - 20,
        });

      const contactSectionY = doc.y; 
      const contactLineHeight = 12; 

      doc
        .font(fonts.regular)
        .fontSize(fontSize.small)
        .fillColor('#FFFFFF') 
        .text(
          '📞 Phone: +91 1234567890 | 📧 Email: info@solarerp.com',
          60,
          contactSectionY - 25, // Adjusted Y position
          { align: 'center', width: tableWidth - 20 }
        )
        .text(
          '🌐 Website: www.solarerp.com',
          60,
          contactSectionY - 25 + contactLineHeight, // Position second line below first
          { align: 'center', width: tableWidth - 20 }
        );
      
      // Add watermark and page numbers to all pages
      addWatermark();

      // Finalize the PDF
      doc.end();
    } catch (error) {
      console.error('Error during PDF generation:', error);
      reject(new Error(`Failed to generate proposal PDF: ${error.message}`));
    }
  });
};

module.exports = { generateProposalPdf };
