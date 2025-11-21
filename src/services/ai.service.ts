import Anthropic from '@anthropic-ai/sdk';
import logger from '../utils/logger';
import { ContractData, ContractDataSchema } from '../types/contract.types';

export class AIService {
  private client: Anthropic;

  constructor() {
    const apiKey = process.env.ANTHROPIC_API_KEY;
    if (!apiKey) {
      throw new Error('ANTHROPIC_API_KEY environment variable is required');
    }
    this.client = new Anthropic({ apiKey });
  }

  /**
   * Extract structured contract data from text using Claude
   * @param contractText The extracted text from the contract PDF
   * @returns Structured contract data
   */
  async extractContractData(contractText: string): Promise<ContractData> {
    try {
      logger.info('Starting AI extraction of contract data');

      const prompt = this.buildExtractionPrompt(contractText);

      const message = await this.client.messages.create({
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
  "specialProvisions": ["Any special provisions or notable clauses"],
  "aiSummary": "A concise executive summary (2-3 paragraphs) highlighting the key aspects of the contract, including parties, duration, value, major obligations, and critical terms. Write this as if briefing an executive.",
  "templateData": "Format the contract information for presentation using this structure:\n\n1. OVERVIEW: Brief contract description\n2. PARTIES & DATES: Key stakeholders and timeline\n3. FINANCIAL TERMS: Payment and value details\n4. OBLIGATIONS: What each party must do\n5. RISK FACTORS: Termination, liability, and other risks\n6. SPECIAL NOTES: Any unusual or important clauses\n\nKeep each section concise but comprehensive."
}

Important:
- Return ONLY valid JSON, no markdown code blocks or additional text
- Use null for optional fields if information is not found
- Dates must be in YYYY-MM-DD format
- Be thorough and extract all relevant information
- The aiSummary should be a professional executive summary
- The templateData should be formatted as described above
- If a field cannot be determined from the contract, use null or an empty array as appropriate`;
  }
}
