import Anthropic from '@anthropic-ai/sdk';
import logger from '../utils/logger';
import { ContractData, ContractDataSchema } from '../types/contract.types';

export class AIService {
  private client: Anthropic | null;
  private demoMode: boolean;

  constructor() {
    const apiKey = process.env.ANTHROPIC_API_KEY;
    this.demoMode = !apiKey || apiKey.includes('your_');

    if (this.demoMode) {
      logger.warn('Running in DEMO MODE - AI extraction will return mock data');
      this.client = null;
    } else {
      this.client = new Anthropic({ apiKey });
    }
  }

  /**
   * Extract structured contract data from text using Claude
   * @param contractText The extracted text from the contract PDF
   * @returns Structured contract data
   */
  async extractContractData(contractText: string): Promise<ContractData> {
    try {
      logger.info('Starting AI extraction of contract data');

      // Demo mode - return mock data based on text analysis
      if (this.demoMode) {
        return this.generateDemoData(contractText);
      }

      const prompt = this.buildExtractionPrompt(contractText);

      const message = await this.client!.messages.create({
        model: 'claude-sonnet-4-5-20250929',
        max_tokens: 4096,
        messages: [
          {
            role: 'user',
            content: prompt,
          },
        ],
      });

      // Extract the JSON response
      const responseText = message.content[0].type === 'text' ? message.content[0].text : '';

      logger.info('Received AI response, parsing JSON');

      // Parse and validate the JSON response
      const jsonMatch = responseText.match(/\{[\s\S]*\}/);
      if (!jsonMatch) {
        throw new Error('No JSON found in AI response');
      }

      const extractedData = JSON.parse(jsonMatch[0]);

      // Validate against schema
      const validatedData = ContractDataSchema.parse(extractedData);

      logger.info('Successfully extracted and validated contract data');
      return validatedData;
    } catch (error) {
      logger.error('Error extracting contract data with AI:', error);
      throw new Error(`Failed to extract contract data: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Generate demo data for testing without API key
   */
  private generateDemoData(contractText: string): ContractData {
    logger.info('Generating demo contract data (no AI API key configured)');

    // Extract a sample title from the text
    const firstLine = contractText.split('\n')[0]?.substring(0, 100) || 'Sample Contract';

    return {
      contractTitle: firstLine.trim() || 'Demo Service Agreement',
      contractNumber: 'DEMO-2025-001',
      effectiveDate: '2025-01-01',
      expirationDate: '2026-01-01',
      parties: [
        {
          name: 'Demo Company LLC',
          role: 'provider',
          address: '123 Demo Street, Demo City, DC 12345',
        },
        {
          name: 'Sample Client Corp',
          role: 'recipient',
          address: '456 Sample Avenue, Sample Town, ST 67890',
        },
      ],
      contractValue: {
        amount: 50000,
        currency: 'USD',
      },
      keyTerms: [
        'Services to be provided as outlined in Exhibit A',
        'Payment terms: Net 30 days',
        'Confidentiality obligations apply to both parties',
        `Contract text preview: ${contractText.substring(0, 150)}...`,
      ],
      obligations: [
        {
          party: 'Demo Company LLC',
          description: 'Provide services as specified in the contract',
        },
        {
          party: 'Sample Client Corp',
          description: 'Make timely payments and provide necessary access',
        },
      ],
      renewalTerms: 'Auto-renewal for 1 year unless terminated with 30 days notice',
      terminationClauses: [
        'Either party may terminate with 30 days written notice',
        'Immediate termination allowed for material breach',
      ],
      governingLaw: 'State of Demo',
      specialProvisions: [
        'This is DEMO DATA - no real AI extraction was performed',
        'Configure ANTHROPIC_API_KEY in .env for real extraction',
      ],
    };
  }

  /**
   * Build the extraction prompt for Claude
   */
  private buildExtractionPrompt(contractText: string): string {
    return `You are an expert contract analyst. Extract key information from the following contract and return it as a JSON object.

Contract Text:
${contractText}

Please extract the following information and return ONLY a valid JSON object (no additional text):

{
  "contractTitle": "The title or name of the contract",
  "contractNumber": "Contract reference number if present",
  "effectiveDate": "Effective date in YYYY-MM-DD format",
  "expirationDate": "Expiration date in YYYY-MM-DD format if present",
  "parties": [
    {
      "name": "Party name",
      "role": "provider|recipient|other",
      "address": "Address if available"
    }
  ],
  "contractValue": {
    "amount": 0,
    "currency": "USD"
  },
  "keyTerms": ["List of important terms and conditions"],
  "obligations": [
    {
      "party": "Party name",
      "description": "Description of obligation"
    }
  ],
  "renewalTerms": "Description of renewal terms if present",
  "terminationClauses": ["List of termination conditions"],
  "governingLaw": "Governing law jurisdiction",
  "specialProvisions": ["Any special provisions or notable clauses"]
}

Important:
- Return ONLY valid JSON, no markdown code blocks or additional text
- Use null for optional fields if information is not found
- Dates must be in YYYY-MM-DD format
- Be thorough and extract all relevant information
- If a field cannot be determined from the contract, use null or an empty array as appropriate`;
  }
}
