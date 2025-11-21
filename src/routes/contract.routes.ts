import { Router, Request, Response } from 'express';
import multer from 'multer';
import path from 'path';
import fs from 'fs';
import { ProcessorService } from '../services/processor.service';
import logger from '../utils/logger';

const router = Router();
const processorService = new ProcessorService();

// Configure multer for file uploads
const uploadDir = process.env.UPLOAD_DIR || './uploads';

// Create upload directory if it doesn't exist
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, uploadDir);
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, file.fieldname + '-' + uniqueSuffix + path.extname(file.originalname));
  },
});

const upload = multer({
  storage,
  limits: {
    fileSize: (parseInt(process.env.MAX_FILE_SIZE_MB || '10') * 1024 * 1024), // Convert MB to bytes
  },
  fileFilter: (req, file, cb) => {
    if (file.mimetype === 'application/pdf') {
      cb(null, true);
    } else {
      cb(new Error('Only PDF files are allowed'));
    }
  },
});

/**
 * POST /api/contracts/process
 * Upload and process a contract PDF
 */
router.post('/process', upload.single('contract'), async (req: Request, res: Response) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'No file uploaded' });
    }

    logger.info(`Received contract upload: ${req.file.originalname}`);

    const jobId = await processorService.processContract(
      req.file.path,
      req.file.originalname
    );

    res.status(202).json({
      message: 'Contract processing started',
      jobId,
      statusUrl: `/api/contracts/${jobId}/status`,
    });
  } catch (error) {
    logger.error('Error processing contract upload:', error);
    res.status(500).json({
      error: 'Failed to process contract',
      details: error instanceof Error ? error.message : 'Unknown error',
    });
  }
});

/**
 * GET /api/contracts/:jobId/status
 * Get the status of a processing job
 */
router.get('/:jobId/status', (req: Request, res: Response) => {
  try {
    const { jobId } = req.params;
    const job = processorService.getJobStatus(jobId);

    if (!job) {
      return res.status(404).json({ error: 'Job not found' });
    }

    // Return job information without sensitive details
    const response: any = {
      id: job.id,
      filename: job.filename,
      status: job.status,
      createdAt: job.createdAt,
      completedAt: job.completedAt,
    };

    if (job.status === 'completed') {
      response.confluencePageUrl = job.confluencePageUrl;
      response.contractData = job.contractData;
    } else if (job.status === 'failed') {
      response.error = job.error;
    }

    res.json(response);
  } catch (error) {
    logger.error('Error retrieving job status:', error);
    res.status(500).json({
      error: 'Failed to retrieve job status',
      details: error instanceof Error ? error.message : 'Unknown error',
    });
  }
});

/**
 * GET /api/contracts/jobs
 * List all processing jobs
 */
router.get('/jobs', (req: Request, res: Response) => {
  try {
    const jobs = processorService.getAllJobs();
    res.json({
      total: jobs.length,
      jobs: jobs.map(job => ({
        id: job.id,
        filename: job.filename,
        status: job.status,
        createdAt: job.createdAt,
        completedAt: job.completedAt,
        confluencePageUrl: job.confluencePageUrl,
      })),
    });
  } catch (error) {
    logger.error('Error listing jobs:', error);
    res.status(500).json({
      error: 'Failed to list jobs',
      details: error instanceof Error ? error.message : 'Unknown error',
    });
  }
});

export default router;
