# Quick Start Guide

Get your Contract Processor up and running in 5 minutes!

## Prerequisites

- Node.js 18 or higher
- Anthropic API key
- Confluence account with API access

## Installation

```bash
# 1. Navigate to project directory
cd contract-processor

# 2. Install dependencies
npm install

# 3. Copy environment file
cp .env.example .env

# 4. Edit .env with your API keys
nano .env
```

## Required Environment Variables

```env
ANTHROPIC_API_KEY=sk-ant-your-key-here
CONFLUENCE_BASE_URL=https://your-domain.atlassian.net
CONFLUENCE_USER_EMAIL=your-email@company.com
CONFLUENCE_API_TOKEN=your-confluence-token
CONFLUENCE_SPACE_KEY=YOUR_SPACE
```

## Start the Server

```bash
# Development mode (with hot reload)
npm run dev

# Production mode
npm run build
npm start
```

## Test It Out

```bash
# Upload a contract
curl -X POST http://localhost:3000/api/contracts/process \
  -F "contract=@./your-contract.pdf"

# Check status (use the jobId from previous response)
curl http://localhost:3000/api/contracts/{jobId}/status
```

## What Happens

1. **Upload**: You send a PDF contract via the API
2. **Extract**: System extracts text from the PDF
3. **Analyze**: Claude AI extracts structured data (parties, dates, terms, etc.)
4. **Create**: A formatted Confluence page is automatically created
5. **Done**: You receive the Confluence page URL

## Extracted Information

The system automatically extracts:

- Contract title and number
- Effective and expiration dates
- All parties involved
- Contract value
- Key terms and conditions
- Obligations for each party
- Renewal and termination clauses
- Governing law
- Special provisions

## Next Steps

- See `README.md` for complete API documentation
- See `SETUP-GUIDE.md` for detailed setup instructions
- Run `node example-usage.js` to see a working example
- Customize the Confluence template in `src/services/confluence.service.ts`

## Need Help?

Check the logs:
- `combined.log` - All application logs
- `error.log` - Error logs only

Common issues are covered in `SETUP-GUIDE.md` under "Troubleshooting"
