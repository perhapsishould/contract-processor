import axios, { AxiosInstance } from 'axios';
import logger from '../utils/logger';
import { ContractData } from '../types/contract.types';

export class ConfluenceService {
  private client: AxiosInstance | null;
  private baseUrl: string;
  private spaceKey: string;
  private parentPageId?: string;
  private demoMode: boolean;

  constructor() {
    this.baseUrl = process.env.CONFLUENCE_BASE_URL || '';
    this.spaceKey = process.env.CONFLUENCE_SPACE_KEY || '';
    this.parentPageId = process.env.CONFLUENCE_PARENT_PAGE_ID;

    const email = process.env.CONFLUENCE_USER_EMAIL;
    const apiToken = process.env.CONFLUENCE_API_TOKEN;

    // Check if running in demo mode
    this.demoMode = !this.baseUrl ||
                    !email ||
                    !apiToken ||
                    !this.spaceKey ||
                    this.baseUrl.includes('your-domain') ||
                    email.includes('your-email');

    if (this.demoMode) {
      logger.warn('Running in DEMO MODE - Confluence pages will not be created');
      this.client = null;
    } else {
      // Create authenticated axios instance
      this.client = axios.create({
        baseURL: `${this.baseUrl}/wiki/rest/api`,
        auth: {
          username: email,
          password: apiToken,
        },
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json',
        },
      });
    }
  }

  /**
   * Create a Confluence page from contract data
   * @param contractData Extracted contract information
   * @param targetUrl User-specified Confluence URL (optional)
   * @returns URL of the created Confluence page
   */
  async createContractPage(contractData: ContractData, targetUrl?: string): Promise<string> {
    try {
      logger.info(`Creating Confluence page for contract: ${contractData.contractTitle}`);
      if (targetUrl) {
        logger.info(`Target URL specified: ${targetUrl}`);
      }

      // Demo mode - return user-specified URL or mock URL
      if (this.demoMode) {
        const demoUrl = targetUrl || `https://demo.confluence.com/wiki/spaces/DEMO/pages/123456/${encodeURIComponent(contractData.contractTitle)}`;
        logger.info(`DEMO MODE: Would have created page at: ${demoUrl}`);
        logger.info('Configure Confluence credentials in .env to create real pages');
        return demoUrl;
      }

      const pageContent = this.buildPageContent(contractData);
      const pageTitle = this.buildPageTitle(contractData);

      const pageData: any = {
        type: 'page',
        title: pageTitle,
        space: {
          key: this.spaceKey,
        },
        body: {
          storage: {
            value: pageContent,
            representation: 'storage',
          },
        },
      };

      // Add parent page if configured
      if (this.parentPageId) {
        pageData.ancestors = [{ id: this.parentPageId }];
      }

      const response = await this.client!.post('/content', pageData);

      const pageUrl = `${this.baseUrl}/wiki${response.data._links.webui}`;
      logger.info(`Successfully created Confluence page: ${pageUrl}`);

      return pageUrl;
    } catch (error) {
      logger.error('Error creating Confluence page:', error);
      if (axios.isAxiosError(error)) {
        throw new Error(`Confluence API error: ${error.response?.data?.message || error.message}`);
      }
      throw error;
    }
  }

  /**
   * Build the page title from contract data
   */
  private buildPageTitle(contractData: ContractData): string {
    const title = contractData.contractTitle;
    const number = contractData.contractNumber ? ` (${contractData.contractNumber})` : '';
    return `${title}${number}`;
  }

  /**
   * Build Confluence storage format HTML content from contract data
   */
  private buildPageContent(contractData: ContractData): string {
    const sections: string[] = [];

    // Header section
    sections.push('<h1>Contract Summary</h1>');

    // AI Executive Summary (if available)
    if (contractData.aiSummary) {
      sections.push('<ac:structured-macro ac:name="info">');
      sections.push('<ac:parameter ac:name="title">Executive Summary (AI-Generated)</ac:parameter>');
      sections.push('<ac:rich-text-body>');
      sections.push(`<p>${this.escape(contractData.aiSummary).replace(/\n/g, '</p><p>')}</p>`);
      sections.push('</ac:rich-text-body>');
      sections.push('</ac:structured-macro>');
      sections.push('<p></p>');
    }

    // Template Data Section (if available)
    if (contractData.templateData) {
      sections.push('<h2>📋 Contract Template View</h2>');
      sections.push('<ac:structured-macro ac:name="panel">');
      sections.push('<ac:parameter ac:name="bgColor">#f4f5f7</ac:parameter>');
      sections.push('<ac:rich-text-body>');
      sections.push(`<pre>${this.escape(contractData.templateData)}</pre>`);
      sections.push('</ac:rich-text-body>');
      sections.push('</ac:structured-macro>');
      sections.push('<p></p>');
    }

    // Basic information table
    sections.push('<h2>Basic Information</h2>');
    sections.push('<table><tbody>');
    sections.push(`<tr><th>Contract Title</th><td>${this.escape(contractData.contractTitle)}</td></tr>`);

    if (contractData.contractNumber) {
      sections.push(`<tr><th>Contract Number</th><td>${this.escape(contractData.contractNumber)}</td></tr>`);
    }

    sections.push(`<tr><th>Effective Date</th><td>${contractData.effectiveDate}</td></tr>`);

    if (contractData.expirationDate) {
      sections.push(`<tr><th>Expiration Date</th><td>${contractData.expirationDate}</td></tr>`);
    }

    if (contractData.contractValue?.amount) {
      sections.push(`<tr><th>Contract Value</th><td>${contractData.contractValue.currency} ${contractData.contractValue.amount.toLocaleString()}</td></tr>`);
    }

    if (contractData.governingLaw) {
      sections.push(`<tr><th>Governing Law</th><td>${this.escape(contractData.governingLaw)}</td></tr>`);
    }

    sections.push('</tbody></table>');

    // Parties section
    sections.push('<h2>Parties</h2>');
    sections.push('<table><tbody>');
    sections.push('<tr><th>Name</th><th>Role</th><th>Address</th></tr>');

    contractData.parties.forEach(party => {
      sections.push(`<tr><td>${this.escape(party.name)}</td><td>${party.role}</td><td>${this.escape(party.address || 'N/A')}</td></tr>`);
    });

    sections.push('</tbody></table>');

    // Key terms section
    if (contractData.keyTerms.length > 0) {
      sections.push('<h2>Key Terms</h2>');
      sections.push('<ul>');
      contractData.keyTerms.forEach(term => {
        sections.push(`<li>${this.escape(term)}</li>`);
      });
      sections.push('</ul>');
    }

    // Obligations section
    if (contractData.obligations.length > 0) {
      sections.push('<h2>Obligations</h2>');
      sections.push('<table><tbody>');
      sections.push('<tr><th>Party</th><th>Obligation</th></tr>');

      contractData.obligations.forEach(obligation => {
        sections.push(`<tr><td>${this.escape(obligation.party)}</td><td>${this.escape(obligation.description)}</td></tr>`);
      });

      sections.push('</tbody></table>');
    }

    // Renewal terms
    if (contractData.renewalTerms) {
      sections.push('<h2>Renewal Terms</h2>');
      sections.push(`<p>${this.escape(contractData.renewalTerms)}</p>`);
    }

    // Termination clauses
    if (contractData.terminationClauses && contractData.terminationClauses.length > 0) {
      sections.push('<h2>Termination Clauses</h2>');
      sections.push('<ul>');
      contractData.terminationClauses.forEach(clause => {
        sections.push(`<li>${this.escape(clause)}</li>`);
      });
      sections.push('</ul>');
    }

    // Special provisions
    if (contractData.specialProvisions && contractData.specialProvisions.length > 0) {
      sections.push('<h2>Special Provisions</h2>');
      sections.push('<ul>');
      contractData.specialProvisions.forEach(provision => {
        sections.push(`<li>${this.escape(provision)}</li>`);
      });
      sections.push('</ul>');
    }

    // Footer
    sections.push('<hr/>');
    sections.push(`<p><em>This page was automatically generated from contract analysis on ${new Date().toISOString()}</em></p>`);

    return sections.join('\n');
  }

  /**
   * Escape HTML special characters
   */
  private escape(text: string): string {
    return text
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#039;');
  }
}
