# Setup Guide - Contract Processor

This guide will walk you through setting up the Contract Processor from scratch.

## Step 1: Prerequisites

Ensure you have the following installed:

```bash
# Check Node.js version (should be 18+)
node --version

# Check npm version
npm --version
```

If you don't have Node.js installed, download it from https://nodejs.org/

## Step 2: Install Dependencies

Navigate to the project directory and install all required packages:

```bash
cd contract-processor
npm install
```

This will install:
- Express.js for the web server
- Anthropic SDK for Claude AI
- PDF parsing libraries
- Axios for Confluence API calls
- And other dependencies

## Step 3: Get Your API Keys

### 3.1 Anthropic API Key

1. Go to https://console.anthropic.com
2. Sign up or log in
3. Navigate to "API Keys" in the settings
4. Click "Create Key"
5. Copy the API key (it starts with `sk-ant-...`)

### 3.2 Confluence API Token

1. Go to https://id.atlassian.com/manage-profile/security/api-tokens
2. Log in with your Atlassian account
3. Click "Create API token"
4. Give it a name (e.g., "Contract Processor")
5. Click "Create"
6. Copy the token immediately (you won't be able to see it again)

### 3.3 Find Your Confluence Space Key

1. Log in to your Confluence instance
2. Navigate to the space where you want to create contract pages
3. Look at the URL - it will be something like:
   ```
   https://your-domain.atlassian.net/wiki/spaces/MYSPACE/overview
   ```
4. The space key is the part after `/spaces/` (in this example: `MYSPACE`)

### 3.4 (Optional) Find Parent Page ID

If you want all contract pages to be created under a specific parent page:

1. Navigate to the parent page in Confluence
2. Click the "⋯" menu → "Page Information"
3. Look at the URL - the page ID is the number at the end:
   ```
   https://your-domain.atlassian.net/wiki/pages/viewinfo.action?pageId=123456789
   ```
4. The page ID in this example is `123456789`

## Step 4: Configure Environment Variables

1. Copy the example environment file:
   ```bash
   cp .env.example .env
   ```

2. Edit the `.env` file with your favorite text editor:
   ```bash
   nano .env
   # or
   vim .env
   # or
   code .env
   ```

3. Fill in your values:

   ```env
   # Server Configuration
   PORT=3000
   NODE_ENV=development

   # AI Provider (Claude)
   ANTHROPIC_API_KEY=sk-ant-your-actual-api-key-here

   # Confluence Configuration
   CONFLUENCE_BASE_URL=https://your-domain.atlassian.net
   CONFLUENCE_USER_EMAIL=your-email@company.com
   CONFLUENCE_API_TOKEN=your-actual-confluence-token
   CONFLUENCE_SPACE_KEY=YOURSPACE
   CONFLUENCE_PARENT_PAGE_ID=123456789

   # File Upload Configuration
   MAX_FILE_SIZE_MB=10
   UPLOAD_DIR=./uploads
   ```

   Replace:
   - `your-domain` with your Atlassian subdomain
   - `your-email@company.com` with your Atlassian account email
   - The API keys with your actual keys
   - Space key and page ID with your values

4. Save the file

## Step 5: Create the Uploads Directory

The application needs a directory to temporarily store uploaded PDFs:

```bash
mkdir -p uploads
```

## Step 6: Build the Project

Compile the TypeScript code to JavaScript:

```bash
npm run build
```

This creates a `dist/` directory with the compiled code.

## Step 7: Test the Setup

Start the server in development mode:

```bash
npm run dev
```

You should see output like:

```
info: Contract processor server running on port 3000
info: Environment: development
info: API endpoints:
info:   POST /api/contracts/process - Upload and process contract
info:   GET  /api/contracts/:jobId/status - Get job status
info:   GET  /api/contracts/jobs - List all jobs
info:   GET  /health - Health check
```

## Step 8: Test with a Sample Contract

### Option A: Using cURL

1. Open a new terminal window

2. Test the health endpoint:
   ```bash
   curl http://localhost:3000/health
   ```

   You should get:
   ```json
   {"status":"healthy","timestamp":"2025-01-15T10:30:00.000Z"}
   ```

3. Upload a contract (replace with your PDF path):
   ```bash
   curl -X POST http://localhost:3000/api/contracts/process \
     -F "contract=@/path/to/your/contract.pdf"
   ```

   You'll get a job ID:
   ```json
   {
     "message": "Contract processing started",
     "jobId": "550e8400-e29b-41d4-a716-446655440000",
     "statusUrl": "/api/contracts/550e8400-e29b-41d4-a716-446655440000/status"
   }
   ```

4. Check the status (replace with your job ID):
   ```bash
   curl http://localhost:3000/api/contracts/550e8400-e29b-41d4-a716-446655440000/status
   ```

### Option B: Using the Example Script

1. Update the `example-usage.js` file with your contract path:
   ```javascript
   const CONTRACT_FILE_PATH = './your-contract.pdf';
   ```

2. Install the form-data package for Node.js:
   ```bash
   npm install form-data
   ```

3. Run the example:
   ```bash
   node example-usage.js
   ```

   This will upload the contract, poll for completion, and display the results.

## Step 9: Verify Confluence Page Creation

1. Once processing is complete, you'll get a Confluence URL
2. Open that URL in your browser
3. Verify that the contract information was extracted correctly
4. Check that all sections are populated as expected

## Troubleshooting

### "ANTHROPIC_API_KEY environment variable is required"

- Make sure your `.env` file exists
- Check that the API key is correctly set in `.env`
- Restart the server after changing `.env`

### "Confluence configuration missing in environment variables"

- Verify all Confluence variables are set in `.env`
- Make sure there are no typos in the variable names
- Check that the base URL includes `https://`

### "Failed to extract text from PDF: Invalid PDF file"

- Ensure the file is actually a PDF (not just renamed)
- Try opening the PDF in a PDF reader to verify it's valid
- Check if the PDF is password-protected (not supported)

### "Confluence API error: Unauthorized"

- Verify your Confluence email and API token are correct
- Make sure the API token hasn't expired
- Check that your user has permission to create pages in the space

### "Confluence API error: Space not found"

- Double-check your space key (it's case-sensitive)
- Verify you have access to the space

### File upload fails with "File too large"

- Increase `MAX_FILE_SIZE_MB` in `.env`
- Restart the server

## Next Steps

Now that your Contract Processor is set up:

1. **Test with real contracts**: Try uploading various contract types
2. **Customize the template**: Edit `src/services/confluence.service.ts` to match your needs
3. **Adjust extraction**: Modify the AI prompt in `src/services/ai.service.ts`
4. **Add validation**: Extend the schema in `src/types/contract.types.ts`
5. **Deploy to production**: Set `NODE_ENV=production` and use a process manager like PM2

## Production Deployment Tips

For production use:

1. Use a process manager:
   ```bash
   npm install -g pm2
   pm2 start dist/index.js --name contract-processor
   ```

2. Set up HTTPS with a reverse proxy (nginx, Caddy)

3. Use environment-specific `.env` files

4. Set up log rotation for the log files

5. Monitor the application with PM2 or similar tools

6. Consider using a database to persist job information instead of in-memory storage

7. Add authentication to the API endpoints

8. Set up automated backups of extracted data

## Getting Help

If you encounter issues:

1. Check the logs in `combined.log` and `error.log`
2. Enable verbose logging by setting `LOG_LEVEL=debug` in `.env`
3. Review the troubleshooting section above
4. Check the main README.md for API documentation
