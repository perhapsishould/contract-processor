# Project Summary - Contract Processor AI Agent

## Overview

This is a complete Node.js/TypeScript application that creates an AI-powered contract processing system. It receives PDF contracts, extracts structured information using Claude AI, and automatically populates Confluence pages with the extracted data.

## Technology Stack

- **Runtime**: Node.js 18+ with TypeScript
- **Web Framework**: Express.js
- **AI Service**: Anthropic Claude (Sonnet 4.5)
- **PDF Processing**: pdf-parse library
- **Documentation Platform**: Confluence (Atlassian)
- **Validation**: Zod schema validation
- **Logging**: Winston
- **File Uploads**: Multer

## Project Structure

```
contract-processor/
├── src/
│   ├── services/               # Business logic layer
│   │   ├── pdf.service.ts      # PDF text extraction
│   │   ├── ai.service.ts       # Claude AI integration
│   │   ├── confluence.service.ts   # Confluence API client
│   │   └── processor.service.ts    # Main orchestration
│   ├── routes/
│   │   └── contract.routes.ts  # REST API endpoints
│   ├── middleware/
│   │   └── error.middleware.ts # Error handling
│   ├── types/
│   │   └── contract.types.ts   # TypeScript definitions
│   ├── utils/
│   │   └── logger.ts           # Logging configuration
│   └── index.ts                # Application entry point
├── .env.example                # Environment variables template
├── package.json                # Dependencies and scripts
├── tsconfig.json               # TypeScript configuration
├── example-usage.js            # Working example script
├── README.md                   # Complete documentation
├── SETUP-GUIDE.md              # Step-by-step setup
└── QUICK-START.md              # 5-minute quick start
```

## Key Features

### 1. PDF Processing (pdf.service.ts)
- Validates PDF files
- Extracts text content from PDFs
- Handles multi-page documents
- Cleans and normalizes extracted text

### 2. AI Extraction (ai.service.ts)
- Uses Claude Sonnet 4.5 for intelligent extraction
- Structured prompt engineering for contract analysis
- JSON schema validation of extracted data
- Extracts: parties, dates, terms, obligations, clauses, etc.

### 3. Confluence Integration (confluence.service.ts)
- Creates formatted Confluence pages
- Supports parent page hierarchy
- Generates HTML tables and lists
- Includes proper escaping and formatting

### 4. Processing Pipeline (processor.service.ts)
- Asynchronous job processing
- Status tracking (pending, processing, completed, failed)
- Error handling and recovery
- Automatic file cleanup

### 5. REST API (contract.routes.ts)
- `POST /api/contracts/process` - Upload contract
- `GET /api/contracts/:jobId/status` - Check status
- `GET /api/contracts/jobs` - List all jobs
- `GET /health` - Health check

### 6. Error Handling
- Custom error middleware
- Validation error handling (Zod)
- File upload error handling (Multer)
- Comprehensive logging

## Data Flow

```
1. Client uploads PDF via API
   ↓
2. Multer saves file to uploads/
   ↓
3. Job created with unique ID
   ↓
4. PDF Service extracts text
   ↓
5. AI Service sends to Claude
   ↓
6. Claude returns structured JSON
   ↓
7. Data validated with Zod
   ↓
8. Confluence Service creates page
   ↓
9. Job marked complete
   ↓
10. Client gets Confluence URL
```

## Configuration

All configuration via environment variables in `.env`:

**Required:**
- `ANTHROPIC_API_KEY` - Claude API key
- `CONFLUENCE_BASE_URL` - Atlassian instance URL
- `CONFLUENCE_USER_EMAIL` - User email
- `CONFLUENCE_API_TOKEN` - API token
- `CONFLUENCE_SPACE_KEY` - Target space

**Optional:**
- `PORT` - Server port (default: 3000)
- `NODE_ENV` - Environment mode
- `CONFLUENCE_PARENT_PAGE_ID` - Parent page
- `MAX_FILE_SIZE_MB` - Upload limit (default: 10)
- `UPLOAD_DIR` - Upload directory (default: ./uploads)
- `LOG_LEVEL` - Logging level

## Contract Data Schema

The system extracts and validates:

```typescript
{
  contractTitle: string
  contractNumber?: string
  effectiveDate: string (YYYY-MM-DD)
  expirationDate?: string
  parties: [{
    name: string
    role: 'provider' | 'recipient' | 'other'
    address?: string
  }]
  contractValue?: {
    amount: number
    currency: string
  }
  keyTerms: string[]
  obligations: [{
    party: string
    description: string
  }]
  renewalTerms?: string
  terminationClauses?: string[]
  governingLaw?: string
  specialProvisions?: string[]
}
```

## API Response Examples

**Upload Response (202):**
```json
{
  "message": "Contract processing started",
  "jobId": "uuid",
  "statusUrl": "/api/contracts/{uuid}/status"
}
```

**Status Response - Completed (200):**
```json
{
  "id": "uuid",
  "filename": "contract.pdf",
  "status": "completed",
  "createdAt": "2025-01-15T10:30:00Z",
  "completedAt": "2025-01-15T10:31:30Z",
  "confluencePageUrl": "https://...",
  "contractData": { ... }
}
```

## NPM Scripts

```bash
npm run dev      # Start development server with hot reload
npm run build    # Compile TypeScript to JavaScript
npm start        # Run production server
npm test         # Run tests (Jest)
```

## Customization Points

### Add New Contract Fields
1. Update `ContractDataSchema` in `src/types/contract.types.ts`
2. Update AI prompt in `src/services/ai.service.ts`
3. Update Confluence template in `src/services/confluence.service.ts`

### Change AI Model
Edit `src/services/ai.service.ts`:
```typescript
model: 'claude-sonnet-4-5-20250929'  // Change to other Claude models
```

### Customize Confluence Template
Edit `buildPageContent()` method in `src/services/confluence.service.ts`

### Add Authentication
Add middleware in `src/index.ts` or `src/routes/contract.routes.ts`

## Security Considerations

- API keys stored in environment variables (never committed)
- File upload size limits enforced
- Only PDF files accepted
- Input validation with Zod
- HTML escaping in Confluence output
- Uploaded files cleaned up after processing

## Limitations & Future Enhancements

**Current Limitations:**
- In-memory job storage (lost on restart)
- No authentication on API endpoints
- Single-user/instance design
- No webhook notifications

**Potential Enhancements:**
- Database for persistent job storage
- Webhook support for job completion
- Batch processing of multiple contracts
- Email notifications
- User authentication and authorization
- Admin dashboard
- Contract comparison features
- Template customization per contract type
- OCR support for scanned PDFs

## Getting Started

Choose your path:

1. **Quick Start**: Read `QUICK-START.md` for 5-minute setup
2. **Detailed Setup**: Read `SETUP-GUIDE.md` for comprehensive instructions
3. **API Reference**: Read `README.md` for full API documentation
4. **See It Work**: Run `node example-usage.js` with your contract

## Support

- Check logs in `combined.log` and `error.log`
- Review troubleshooting in `SETUP-GUIDE.md`
- Ensure all environment variables are set correctly
- Verify API keys and permissions

## License

MIT - Free to use and modify
