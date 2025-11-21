import pdf from 'pdf-parse';
import fs from 'fs/promises';
import logger from '../utils/logger';

export class PDFService {
  /**
   * Extract text content from a PDF file
   * @param filePath Path to the PDF file
   * @returns Extracted text content
   */
  async extractText(filePath: string): Promise<string> {
    try {
      logger.info(`Extracting text from PDF: ${filePath}`);

      const dataBuffer = await fs.readFile(filePath);
      const data = await pdf(dataBuffer);

      logger.info(`Successfully extracted ${data.numpages} pages from PDF`);

      // Clean up the text - remove excessive whitespace and normalize
      const cleanedText = data.text
        .replace(/\s+/g, ' ')
        .replace(/\n\s*\n/g, '\n')
        .trim();

      return cleanedText;
    } catch (error) {
      logger.error('Error extracting text from PDF:', error);
      throw new Error(`Failed to extract text from PDF: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Validate that a file is a valid PDF
   * @param filePath Path to the file
   * @returns true if valid PDF
   */
  async isValidPDF(filePath: string): Promise<boolean> {
    try {
      const dataBuffer = await fs.readFile(filePath);
      // Check PDF magic number
      const header = dataBuffer.toString('utf-8', 0, 5);
      return header === '%PDF-';
    } catch (error) {
      logger.error('Error validating PDF:', error);
      return false;
    }
  }
}
