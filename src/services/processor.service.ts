import { v4 as uuidv4 } from 'uuid';
import { ProcessingJob } from '../types/contract.types';
import { PDFService } from './pdf.service';
import { AIService } from './ai.service';
import { ConfluenceService } from './confluence.service';
import logger from '../utils/logger';
import fs from 'fs/promises';

export class ProcessorService {
  private pdfService: PDFService;
  private aiService: AIService;
  private confluenceService: ConfluenceService;
  private jobs: Map<string, ProcessingJob>;

  constructor() {
    this.pdfService = new PDFService();
    this.aiService = new AIService();
    this.confluenceService = new ConfluenceService();
    this.jobs = new Map();
  }

  /**
   * Process a contract PDF file
   * @param filePath Path to the uploaded PDF file
   * @param filename Original filename
   * @param targetConfluenceUrl User-specified Confluence URL
   * @returns Job ID for tracking
   */
  async processContract(filePath: string, filename: string, targetConfluenceUrl?: string): Promise<string> {
    const jobId = uuidv4();

    const job: ProcessingJob = {
      id: jobId,
      filename,
      status: 'pending',
      createdAt: new Date(),
      targetConfluenceUrl,
    };

    this.jobs.set(jobId, job);

    // Process asynchronously
    this.executeProcessing(jobId, filePath).catch(error => {
      logger.error(`Error in background processing for job ${jobId}:`, error);
    });

    return jobId;
  }

  /**
   * Execute the full processing pipeline
   */
  private async executeProcessing(jobId: string, filePath: string): Promise<void> {
    const job = this.jobs.get(jobId);
    if (!job) return;

    try {
      job.status = 'processing';
      this.jobs.set(jobId, job);

      // Step 1: Validate PDF
      logger.info(`[${jobId}] Validating PDF`);
      const isValid = await this.pdfService.isValidPDF(filePath);
      if (!isValid) {
        throw new Error('Invalid PDF file');
      }

      // Step 2: Extract text from PDF
      logger.info(`[${jobId}] Extracting text from PDF`);
      const contractText = await this.pdfService.extractText(filePath);

      // Step 3: Extract structured data using AI
      logger.info(`[${jobId}] Extracting contract data with AI`);
      const contractData = await this.aiService.extractContractData(contractText);

      // Step 4: Create Confluence page
      logger.info(`[${jobId}] Creating Confluence page`);
      const confluenceUrl = await this.confluenceService.createContractPage(
        contractData,
        job.targetConfluenceUrl
      );

      // Update job as completed
      job.status = 'completed';
      job.completedAt = new Date();
      job.contractData = contractData;
      job.confluencePageUrl = confluenceUrl;
      this.jobs.set(jobId, job);

      logger.info(`[${jobId}] Processing completed successfully`);

      // Clean up uploaded file
      await fs.unlink(filePath).catch(err => {
        logger.warn(`Failed to delete uploaded file ${filePath}:`, err);
      });

    } catch (error) {
      logger.error(`[${jobId}] Processing failed:`, error);

      job.status = 'failed';
      job.completedAt = new Date();
      job.error = error instanceof Error ? error.message : 'Unknown error';
      this.jobs.set(jobId, job);

      // Clean up uploaded file on error
      await fs.unlink(filePath).catch(err => {
        logger.warn(`Failed to delete uploaded file ${filePath}:`, err);
      });
    }
  }

  /**
   * Get the status of a processing job
   * @param jobId Job ID
   * @returns Job information or undefined if not found
   */
  getJobStatus(jobId: string): ProcessingJob | undefined {
    return this.jobs.get(jobId);
  }

  /**
   * List all jobs
   * @returns Array of all jobs
   */
  getAllJobs(): ProcessingJob[] {
    return Array.from(this.jobs.values());
  }
}
