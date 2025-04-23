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
        title: 'Helvetica-Bold',
        subtitle: 'Helvetica-Bold',
        heading: 'Helvetica-Bold',
        regular: 'Helvetica',
        light: 'Helvetica',
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
        primary: '#1976D2', // Deep blue
        secondary: '#4CAF50', // Green
        accent: '#FFC107', // Amber
        text: '#333333',
        lightText: '#757575',
        background: '#FFFFFF',
        lightBackground: '#F5F5F5',
        border: '#E0E0E0',
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
            .fontSize(fontSize.footer)
            .fillColor(colors.lightText)
            .text(`Page ${i + 1} of ${pageCount}`, 50, doc.page.height - 30, {
              align: 'center',
              width: doc.page.width - 100,
            });
        }
      };

      // Add a header with company logo/name to each page
      const addHeader = () => {
        // You can replace this with an actual logo using:
        // doc.image('path/to/logo.png', 50, 45, { width: 80 })

        // For now, use styled text as a placeholder
        doc
          .font(fonts.title)
          .fontSize(fontSize.heading)
          .fillColor(colors.primary)
          .text('SOLAR ERP SYSTEM', 50, 45, { width: 200 });

        // Add a horizontal line under the header
        doc
          .moveTo(50, 75)
          .lineTo(doc.page.width - 50, 75)
          .lineWidth(1)
          .stroke(colors.border);

        doc.moveDown(1);
      };

      // Add the header
      addHeader();

      // Add title section with background
      const titleY = 100;
      drawBox(50, titleY, doc.page.width - 100, 80, colors.primary, null);

      doc
        .font(fonts.title)
        .fontSize(fontSize.title)
        .fillColor('#FFFFFF')
        .text('SOLAR PROPOSAL', 70, titleY + 15, {
          align: 'center',
          width: doc.page.width - 140,
        });

      doc
        .fontSize(fontSize.subtitle)
        .text(proposalData.name || 'N/A', 70, titleY + 45, {
          align: 'center',
          width: doc.page.width - 140,
        });

      // Add proposal date and reference information in a styled box
      const infoBoxY = titleY + 100;
      drawBox(
        50,
        infoBoxY,
        doc.page.width - 100,
        60,
        colors.lightBackground,
        colors.border
      );

      doc
        .fontSize(fontSize.regular)
        .fillColor(colors.text)
        .font(fonts.heading)
        .text('Date:', 70, infoBoxY + 10)
        .font(fonts.regular)
        .text(formatDate(new Date()), 130, infoBoxY + 10)
        .font(fonts.heading)
        .text('Proposal ID:', 70, infoBoxY + 35)
        .font(fonts.regular)
        .text(proposalData._id || proposalData.id || 'N/A', 130, infoBoxY + 35)
        .font(fonts.heading)
        .text('Valid Until:', doc.page.width / 2, infoBoxY + 10)
        .font(fonts.regular)
        .text(
          formatDate(proposalData.validUntil),
          doc.page.width / 2 + 70,
          infoBoxY + 10
        )
        .font(fonts.heading)
        .text('Lead:', doc.page.width / 2, infoBoxY + 35)
        .font(fonts.regular)
        .text(
          `${proposalData.lead?.firstName || ''} ${proposalData.lead?.lastName || ''}`,
          doc.page.width / 2 + 70,
          infoBoxY + 35
        );

      // Move to position below the info box
      doc.y = infoBoxY + 80;

      // Client and Proposal Details section
      doc
        .font(fonts.heading)
        .fontSize(fontSize.heading)
        .fillColor(colors.primary)
        .text('Proposal Details')
        .moveDown(0.5);

      // Create a styled table for details
      const detailsTableY = doc.y;
      const tableWidth = doc.page.width - 100;
      const col1Width = 180;
      const col2Width = tableWidth - col1Width;

      // Draw table header
      drawBox(50, detailsTableY, tableWidth, 30, colors.primary);

      doc
        .fillColor('#FFFFFF')
        .font(fonts.heading)
        .fontSize(fontSize.regular)
        .text('Project Specifications', 60, detailsTableY + 8, {
          width: tableWidth - 20,
        });

      // Add rows for the details table with alternating background colors
      let rowY = detailsTableY + 30;

      // Helper to add a row to the details table
      const addDetailRow = (label, value, isAlternate = false) => {
        drawBox(
          50,
          rowY,
          tableWidth,
          25,
          isAlternate ? colors.lightBackground : colors.background,
          colors.border
        );

        doc
          .fillColor(colors.text)
          .font(fonts.heading)
          .fontSize(fontSize.regular)
          .text(label, 60, rowY + 6, { width: col1Width - 20 });

        doc
          .font(fonts.regular)
          .text(value, 50 + col1Width, rowY + 6, { width: col2Width - 20 });

        rowY += 25;
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
      doc.y = rowY + 20;

      // Financial Summary section with styled table
      doc
        .font(fonts.heading)
        .fontSize(fontSize.heading)
        .fillColor(colors.primary)
        .text('Financial Summary')
        .moveDown(0.5);

      // Create a styled table for financial data
      const financialTableY = doc.y;

      // Draw table header
      drawBox(50, financialTableY, tableWidth, 30, colors.primary);

      doc
        .fillColor('#FFFFFF')
        .font(fonts.heading)
        .fontSize(fontSize.regular)
        .text('Cost Breakdown', 60, financialTableY + 8, {
          width: col1Width - 20,
        })
        .text('Amount', 50 + col1Width, financialTableY + 8, {
          width: col2Width - 20,
          align: 'right',
        });

      // Add rows for the financial table
      rowY = financialTableY + 30;

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
          30,
          isAlternate ? colors.lightBackground : colors.background,
          colors.border
        );

        doc
          .fillColor(colors.text)
          .font(isBold ? fonts.heading : fonts.regular)
          .fontSize(fontSize.regular)
          .text(label, 60, rowY + 8, { width: col1Width - 20 });

        doc
          .font(isBold ? fonts.heading : fonts.regular)
          .text(value, 50 + col1Width, rowY + 8, {
            width: col2Width - 20,
            align: 'right',
          });

        rowY += 30;
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
      drawBox(50, rowY, tableWidth, 35, colors.secondary, null);

      doc
        .fillColor('#FFFFFF')
        .font(fonts.heading)
        .fontSize(fontSize.subheading)
        .text('Final Project Cost (A+B)', 60, rowY + 10, {
          width: col1Width - 20,
        })
        .text(
          formatCurrency(proposalData.finalProjectCost),
          50 + col1Width,
          rowY + 10,
          { width: col2Width - 20, align: 'right' }
        );

      rowY += 35;

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
      drawBox(50, rowY, tableWidth, 35, colors.primary, null);

      doc
        .fillColor('#FFFFFF')
        .font(fonts.heading)
        .fontSize(fontSize.subheading)
        .text('Net Investment', 60, rowY + 10, { width: col1Width - 20 })
        .text(
          formatCurrency(proposalData.netInvestment),
          50 + col1Width,
          rowY + 10,
          { width: col2Width - 20, align: 'right' }
        );

      rowY += 55;

      // Add a section about ROI with some visual elements
      if (doc.y + 200 > doc.page.height - 100) {
        doc.addPage();
        addHeader();
        rowY = 120;
      } else {
        rowY = doc.y;
      }

      // ROI Section
      doc
        .font(fonts.heading)
        .fontSize(fontSize.heading)
        .fillColor(colors.primary)
        .text('Return on Investment')
        .moveDown(0.5);

      // Draw a box for ROI information
      const roiBoxY = doc.y;
      drawBox(
        50,
        roiBoxY,
        tableWidth,
        90,
        colors.lightBackground,
        colors.border
      );

      // Add ROI content
      doc
        .font(fonts.regular)
        .fontSize(fontSize.regular)
        .fillColor(colors.text)
        .text('Estimated Annual Savings:', 70, roiBoxY + 15)
        .font(fonts.heading)
        .text(
          formatCurrency(proposalData.annualSavings || 12000),
          250,
          roiBoxY + 15
        )
        .font(fonts.regular)
        .text('Estimated Payback Period:', 70, roiBoxY + 40)
        .font(fonts.heading)
        .text(`${proposalData.paybackPeriod || '4-5'} Years`, 250, roiBoxY + 40)
        .font(fonts.regular)
        .text('Estimated Lifetime Savings:', 70, roiBoxY + 65)
        .font(fonts.heading)
        .text(
          formatCurrency(proposalData.lifetimeSavings || 300000),
          250,
          roiBoxY + 65
        );

      // Equipment Details section (if line items exist)
      if (proposalData.lineItems && proposalData.lineItems.length > 0) {
        doc.addPage();
        addHeader();

        doc
          .font(fonts.heading)
          .fontSize(fontSize.heading)
          .fillColor(colors.primary)
          .text('Equipment Details')
          .moveDown(0.5);

        // Table header
        const eqTableTop = doc.y;
        const colWidths = [
          tableWidth * 0.3,
          tableWidth * 0.15,
          tableWidth * 0.3,
          tableWidth * 0.25,
        ];

        // Draw table header
        drawBox(50, eqTableTop, tableWidth, 30, colors.primary);

        doc
          .fillColor('#FFFFFF')
          .font(fonts.heading)
          .fontSize(fontSize.regular)
          .text('Item', 60, eqTableTop + 8, { width: colWidths[0] - 10 })
          .text('Quantity', 60 + colWidths[0], eqTableTop + 8, {
            width: colWidths[1] - 10,
          })
          .text('Category', 60 + colWidths[0] + colWidths[1], eqTableTop + 8, {
            width: colWidths[2] - 10,
          })
          .text(
            'Model',
            60 + colWidths[0] + colWidths[1] + colWidths[2],
            eqTableTop + 8,
            { width: colWidths[3] - 10 }
          );

        // Table rows
        let eqRowY = eqTableTop + 30;

        // Add rows for each line item
        proposalData.lineItems.forEach((item, index) => {
          // Draw row background (alternating for readability)
          drawBox(
            50,
            eqRowY,
            tableWidth,
            30,
            index % 2 === 0 ? colors.background : colors.lightBackground,
            colors.border
          );

          doc
            .fillColor(colors.text)
            .font(fonts.regular)
            .fontSize(fontSize.regular)
            .text(item.itemId?.name || 'N/A', 60, eqRowY + 8, {
              width: colWidths[0] - 10,
            })
            .text(item.quantity || '0', 60 + colWidths[0], eqRowY + 8, {
              width: colWidths[1] - 10,
            })
            .text(
              item.itemId?.category || 'N/A',
              60 + colWidths[0] + colWidths[1],
              eqRowY + 8,
              { width: colWidths[2] - 10 }
            )
            .text(
              item.itemId?.modelNumber || 'N/A',
              60 + colWidths[0] + colWidths[1] + colWidths[2],
              eqRowY + 8,
              { width: colWidths[3] - 10 }
            );

          eqRowY += 30;

          // Check if we need a new page
          if (
            eqRowY > doc.page.height - 100 &&
            index < proposalData.lineItems.length - 1
          ) {
            doc.addPage();
            addHeader();
            eqRowY = 120;

            // Re-add the table header on the new page
            drawBox(50, eqRowY - 30, tableWidth, 30, colors.primary);

            doc
              .fillColor('#FFFFFF')
              .font(fonts.heading)
              .fontSize(fontSize.regular)
              .text('Item', 60, eqRowY - 22, { width: colWidths[0] - 10 })
              .text('Quantity', 60 + colWidths[0], eqRowY - 22, {
                width: colWidths[1] - 10,
              })
              .text('Category', 60 + colWidths[0] + colWidths[1], eqRowY - 22, {
                width: colWidths[2] - 10,
              })
              .text(
                'Model',
                60 + colWidths[0] + colWidths[1] + colWidths[2],
                eqRowY - 22,
                { width: colWidths[3] - 10 }
              );
          }
        });
      }

      // Notes section
      if (doc.y + 150 > doc.page.height - 100) {
        doc.addPage();
        addHeader();
      } else {
        doc.moveDown(2);
      }

      doc
        .font(fonts.heading)
        .fontSize(fontSize.heading)
        .fillColor(colors.primary)
        .text('Notes')
        .moveDown(0.5);

      // Draw a box for notes
      const notesBoxY = doc.y;
      drawBox(
        50,
        notesBoxY,
        tableWidth,
        100,
        colors.lightBackground,
        colors.border
      );

      doc
        .font(fonts.regular)
        .fontSize(fontSize.regular)
        .fillColor(colors.text)
        .text(
          proposalData.notes || 'No additional notes provided.',
          70,
          notesBoxY + 15,
          {
            width: tableWidth - 40,
            align: 'left',
          }
        );

      // Terms and conditions (brief version)
      doc.moveDown(2);
      doc
        .font(fonts.heading)
        .fontSize(fontSize.heading)
        .fillColor(colors.primary)
        .text('Terms & Conditions')
        .moveDown(0.5);

      const terms = [
        'This proposal is valid for 30 days from the date of issue.',
        'A 25% advance payment is required to begin the installation process.',
        'The final cost may vary based on site conditions and requirements.',
        'Installation timeline is subject to weather conditions and material availability.',
        'Warranty details will be provided in the final contract.',
      ];

      terms.forEach((term, index) => {
        doc
          .font(fonts.regular)
          .fontSize(fontSize.small)
          .fillColor(colors.text)
          .text(`${index + 1}. ${term}`, 50, doc.y, {
            width: tableWidth,
            align: 'left',
          });
        doc.moveDown(0.5);
      });

      // Add footer with signature box
      doc.moveDown(1);

      // Draw signature boxes
      const sigBoxWidth = (tableWidth - 20) / 2;
      const sigBoxY = doc.y;

      // Customer signature
      drawBox(50, sigBoxY, sigBoxWidth, 70, colors.background, colors.border);
      doc
        .font(fonts.heading)
        .fontSize(fontSize.small)
        .fillColor(colors.text)
        .text('Customer Signature', 50 + 10, sigBoxY + 10, {
          width: sigBoxWidth - 20,
        });

      doc
        .font(fonts.regular)
        .text('Name: _____________________', 50 + 10, sigBoxY + 30, {
          width: sigBoxWidth - 20,
        })
        .text('Date: ______________________', 50 + 10, sigBoxY + 50, {
          width: sigBoxWidth - 20,
        });

      // Company signature
      drawBox(
        50 + sigBoxWidth + 20,
        sigBoxY,
        sigBoxWidth,
        70,
        colors.background,
        colors.border
      );
      doc
        .font(fonts.heading)
        .fontSize(fontSize.small)
        .fillColor(colors.text)
        .text('Company Representative', 50 + sigBoxWidth + 30, sigBoxY + 10, {
          width: sigBoxWidth - 20,
        });

      doc
        .font(fonts.regular)
        .text(
          'Name: _____________________',
          50 + sigBoxWidth + 30,
          sigBoxY + 30,
          { width: sigBoxWidth - 20 }
        )
        .text(
          'Date: ______________________',
          50 + sigBoxWidth + 30,
          sigBoxY + 50,
          { width: sigBoxWidth - 20 }
        );

      // Add a contact information footer
      doc.moveDown(3);
      drawBox(50, doc.y, tableWidth, 50, colors.primary);

      doc
        .font(fonts.heading)
        .fontSize(fontSize.regular)
        .fillColor('#FFFFFF')
        .text('Contact Information', 60, doc.y - 40, {
          align: 'center',
          width: tableWidth - 20,
        });

      doc
        .font(fonts.regular)
        .fontSize(fontSize.small)
        .text(
          'Phone: +91 1234567890 | Email: info@solarerp.com | Website: www.solarerp.com',
          60,
          doc.y - 20,
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
