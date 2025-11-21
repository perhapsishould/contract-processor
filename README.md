# Contract Processor - AI Agent

An intelligent document processing system that extracts structured data from contract PDFs using AI and automatically populates Confluence pages.

## Features

- PDF text extraction and validation
- AI-powered contract data extraction using Claude
- Automatic Confluence page generation
- RESTful API for contract processing
- Async job processing with status tracking
- Comprehensive error handling and logging

## Architecture

```
contract-processor/
├── src/
│   ├── services/
│   │   ├── pdf.service.ts          # PDF text extraction
│   │   ├── ai.service.ts           # Claude AI integration
│   │   ├── confluence.service.ts   # Confluence API client
│   │   └── processor.service.ts    # Main processing pipeline
│   ├── routes/
│   │   └── contract.routes.ts      # API endpoints
│   ├── middleware/
│   │   └── error.middleware.ts     # Error handling
│   ├── types/
│   │   └── contract.types.ts       # TypeScript types
│   ├── utils/
│   │   └── logger.ts               # Logging configuration
│   └── index.ts                     # Server entry point
├── uploads/                         # Temporary file storage
└── dist/                            # Compiled JavaScript
```

## Prerequisites

- Node.js 18+ and npm
- Anthropic API key (for Claude)
- Confluence account with API access
- Confluence Space and optional parent page ID

## Installation

1. Clone the repository:
```bash
cd contract-processor
```

2. Install dependencies:
```bash
npm install
```

3. Configure environment variables:
```bash
cp .env.example .env
```

Edit `.env` with your configuration:

```env
# Server Configuration
PORT=3000
NODE_ENV=development

# AI Provider (Claude)
ANTHROPIC_API_KEY=your_anthropic_api_key_here

# Confluence Configuration
CONFLUENCE_BASE_URL=https://your-domain.atlassian.net
CONFLUENCE_USER_EMAIL=your-email@company.com
CONFLUENCE_API_TOKEN=your_confluence_api_token
CONFLUENCE_SPACE_KEY=YOUR_SPACE_KEY
CONFLUENCE_PARENT_PAGE_ID=optional_parent_page_id

# File Upload Configuration
MAX_FILE_SIZE_MB=10
UPLOAD_DIR=./uploads
```

### Getting API Keys

**Anthropic API Key:**
1. Sign up at https://console.anthropic.com
2. Navigate to API Keys section
3. Create a new API key

**Confluence API Token:**
1. Go to https://id.atlassian.com/manage-profile/security/api-tokens
2. Click "Create API token"
3. Give it a name and copy the token
4. Use your Atlassian account email as CONFLUENCE_USER_EMAIL

**Confluence Space Key:**
- Navigate to your Confluence space
- The space key appears in the URL: `https://your-domain.atlassian.net/wiki/spaces/SPACEKEY`

## Usage

### Development Mode

```bash
npm run dev
```

The server will start with hot-reload enabled on port 3000 (or your configured PORT).

### Production Build

```bash
npm run build
npm start
```

## API Endpoints

### 1. Process Contract

Upload and process a contract PDF.

**Endpoint:** `POST /api/contracts/process`

**Request:**
- Content-Type: `multipart/form-data`
- Body: Form field `contract` with PDF file

**Example using curl:**
```bash
curl -X POST http://localhost:3000/api/contracts/process \
  -F "contract=@/path/to/contract.pdf"
```

**Example using JavaScript/fetch:**
```javascript
const formData = new FormData();
formData.append('contract', pdfFile);

const response = await fetch('http://localhost:3000/api/contracts/process', {
  method: 'POST',
  body: formData
});

const data = await response.json();
console.log('Job ID:', data.jobId);
```

**Response (202 Accepted):**
```json
{
  "message": "Contract processing started",
  "jobId": "550e8400-e29b-41d4-a716-446655440000",
  "statusUrl": "/api/contracts/550e8400-e29b-41d4-a716-446655440000/status"
}
```

### 2. Check Processing Status

Get the status of a processing job.

**Endpoint:** `GET /api/contracts/:jobId/status`

**Example:**
```bash
curl http://localhost:3000/api/contracts/550e8400-e29b-41d4-a716-446655440000/status
```

**Response (Processing):**
```json
{
  "id": "550e8400-e29b-41d4-a716-446655440000",
  "filename": "contract.pdf",
  "status": "processing",
  "createdAt": "2025-01-15T10:30:00.000Z"
}
```

**Response (Completed):**
```json
{
  "id": "550e8400-e29b-41d4-a716-446655440000",
  "filename": "contract.pdf",
  "status": "completed",
  "createdAt": "2025-01-15T10:30:00.000Z",
  "completedAt": "2025-01-15T10:31:30.000Z",
  "confluencePageUrl": "https://your-domain.atlassian.net/wiki/spaces/SPACE/pages/123456/Contract+Title",
  "contractData": {
    "contractTitle": "Service Agreement",
    "effectiveDate": "2025-01-01",
    "parties": [...],
    "keyTerms": [...],
    ...
  }
}
```

**Response (Failed):**
```json
{
  "id": "550e8400-e29b-41d4-a716-446655440000",
  "filename": "contract.pdf",
  "status": "failed",
  "createdAt": "2025-01-15T10:30:00.000Z",
  "completedAt": "2025-01-15T10:30:45.000Z",
  "error": "Failed to extract text from PDF: Invalid PDF file"
}
```

### 3. List All Jobs

Get a list of all processing jobs.

**Endpoint:** `GET /api/contracts/jobs`

**Example:**
```bash
curl http://localhost:3000/api/contracts/jobs
```

**Response:**
```json
{
  "total": 3,
  "jobs": [
    {
      "id": "550e8400-e29b-41d4-a716-446655440000",
      "filename": "contract1.pdf",
      "status": "completed",
      "createdAt": "2025-01-15T10:30:00.000Z",
      "completedAt": "2025-01-15T10:31:30.000Z",
      "confluencePageUrl": "https://..."
    },
    ...
  ]
}
```

### 4. Health Check

Check if the server is running.

**Endpoint:** `GET /health`

**Response:**
```json
{
  "status": "healthy",
  "timestamp": "2025-01-15T10:30:00.000Z"
}
```

## Contract Data Schema

The system extracts the following information from contracts:

```typescript
{
  contractTitle: string;
  contractNumber?: string;
  effectiveDate: string; // YYYY-MM-DD format
  expirationDate?: string;
  parties: Array<{
    name: string;
    role: 'provider' | 'recipient' | 'other';
    address?: string;
  }>;
  contractValue?: {
    amount: number;
    currency: string;
  };
  keyTerms: string[];
  obligations: Array<{
    party: string;
    description: string;
  }>;
  renewalTerms?: string;
  terminationClauses?: string[];
  governingLaw?: string;
  specialProvisions?: string[];
}
```

## Confluence Template

The generated Confluence page includes:

- **Basic Information Table**: Contract title, number, dates, value, governing law
- **Parties Table**: All parties with their roles and addresses
- **Key Terms**: Bulleted list of important terms
- **Obligations Table**: Party responsibilities
- **Renewal Terms**: Description of renewal conditions
- **Termination Clauses**: List of termination conditions
- **Special Provisions**: Notable clauses and provisions
- **Auto-generated timestamp footer**

## Error Handling

The API returns appropriate HTTP status codes:

- `200` - Success
- `202` - Accepted (async processing started)
- `400` - Bad request (invalid file, missing fields)
- `404` - Job not found
- `413` - File too large
- `500` - Server error

Error responses include details:
```json
{
  "error": "Error description",
  "details": "Additional error information"
}
```

## Logging

Logs are written to:
- `combined.log` - All logs
- `error.log` - Error logs only
- Console (in development mode)

## Testing

Example test workflow:

1. Start the server:
```bash
npm run dev
```

2. Upload a test contract:
```bash
curl -X POST http://localhost:3000/api/contracts/process \
  -F "contract=@./test-contract.pdf"
```

3. Note the returned `jobId` and check status:
```bash
curl http://localhost:3000/api/contracts/{jobId}/status
```

4. Once completed, visit the Confluence URL to view the generated page.

## Customization

### Modifying the Extraction Schema

Edit `src/types/contract.types.ts` to add or remove fields from `ContractDataSchema`.

### Customizing the Confluence Template

Edit `src/services/confluence.service.ts`, specifically the `buildPageContent()` method to change the page layout.

### Adjusting the AI Prompt

Edit `src/services/ai.service.ts`, specifically the `buildExtractionPrompt()` method to modify how Claude extracts information.

## Troubleshooting

**PDF extraction fails:**
- Ensure the PDF is not password-protected
- Check that the PDF contains readable text (not just images)
- Try reducing file size if it's too large

**AI extraction returns incomplete data:**
- Check your Anthropic API key is valid
- Review the extraction prompt in `ai.service.ts`
- Ensure the contract text is clear and well-formatted

**Confluence page creation fails:**
- Verify API token permissions
- Check that the space key is correct
- Ensure parent page ID exists (if specified)
- Confirm the user has write permissions to the space

## License

MIT
