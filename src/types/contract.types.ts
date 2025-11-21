import { z } from 'zod';

// Zod schema for contract data validation
export const ContractDataSchema = z.object({
  contractTitle: z.string(),
  contractNumber: z.string().optional(),
  effectiveDate: z.string(),
  expirationDate: z.string().optional(),
  parties: z.array(z.object({
    name: z.string(),
    role: z.enum(['provider', 'recipient', 'other']),
    address: z.string().optional(),
  })),
  contractValue: z.object({
    amount: z.number().optional(),
    currency: z.string().optional(),
  }).optional(),
  keyTerms: z.array(z.string()),
  obligations: z.array(z.object({
    party: z.string(),
    description: z.string(),
  })),
  renewalTerms: z.string().optional(),
  terminationClauses: z.array(z.string()).optional(),
  governingLaw: z.string().optional(),
  specialProvisions: z.array(z.string()).optional(),
});

export type ContractData = z.infer<typeof ContractDataSchema>;

// Processing status tracking
export interface ProcessingJob {
  id: string;
  filename: string;
  status: 'pending' | 'processing' | 'completed' | 'failed';
  createdAt: Date;
  completedAt?: Date;
  error?: string;
  contractData?: ContractData;
  confluencePageUrl?: string;
}
