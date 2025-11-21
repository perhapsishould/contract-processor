/**
 * Example usage of the Contract Processor API
 *
 * This script demonstrates how to:
 * 1. Upload a contract PDF for processing
 * 2. Poll the status endpoint until processing is complete
 * 3. Display the results including the Confluence page URL
 */

const fs = require('fs');
const path = require('path');

// Configuration
const API_BASE_URL = 'http://localhost:3000/api/contracts';
const CONTRACT_FILE_PATH = './sample-contract.pdf'; // Update this path

/**
 * Upload a contract for processing
 */
async function uploadContract(filePath) {
  try {
    const FormData = (await import('form-data')).default;
    const formData = new FormData();

    formData.append('contract', fs.createReadStream(filePath));

    const response = await fetch(`${API_BASE_URL}/process`, {
      method: 'POST',
      body: formData,
      headers: formData.getHeaders ? formData.getHeaders() : {},
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(`Upload failed: ${error.error}`);
    }

    const data = await response.json();
    console.log('✓ Contract uploaded successfully');
    console.log(`  Job ID: ${data.jobId}`);

    return data.jobId;
  } catch (error) {
    console.error('✗ Upload failed:', error.message);
    throw error;
  }
}

/**
 * Check the status of a processing job
 */
async function checkJobStatus(jobId) {
  try {
    const response = await fetch(`${API_BASE_URL}/${jobId}/status`);

    if (!response.ok) {
      const error = await response.json();
      throw new Error(`Status check failed: ${error.error}`);
    }

    return await response.json();
  } catch (error) {
    console.error('✗ Status check failed:', error.message);
    throw error;
  }
}

/**
 * Poll the job status until completion
 */
async function waitForCompletion(jobId, pollInterval = 2000) {
  console.log('\nWaiting for processing to complete...');

  while (true) {
    const status = await checkJobStatus(jobId);

    console.log(`  Status: ${status.status}`);

    if (status.status === 'completed') {
      console.log('\n✓ Processing completed successfully!');
      return status;
    } else if (status.status === 'failed') {
      console.log(`\n✗ Processing failed: ${status.error}`);
      throw new Error(status.error);
    }

    // Wait before polling again
    await new Promise(resolve => setTimeout(resolve, pollInterval));
  }
}

/**
 * Display the results
 */
function displayResults(result) {
  console.log('\n=== CONTRACT PROCESSING RESULTS ===\n');

  console.log('📄 Contract Information:');
  console.log(`  Title: ${result.contractData.contractTitle}`);
  console.log(`  Effective Date: ${result.contractData.effectiveDate}`);

  if (result.contractData.contractNumber) {
    console.log(`  Contract Number: ${result.contractData.contractNumber}`);
  }

  console.log(`\n👥 Parties (${result.contractData.parties.length}):`);
  result.contractData.parties.forEach(party => {
    console.log(`  - ${party.name} (${party.role})`);
  });

  console.log(`\n📋 Key Terms (${result.contractData.keyTerms.length}):`);
  result.contractData.keyTerms.slice(0, 3).forEach(term => {
    console.log(`  - ${term.substring(0, 80)}${term.length > 80 ? '...' : ''}`);
  });
  if (result.contractData.keyTerms.length > 3) {
    console.log(`  ... and ${result.contractData.keyTerms.length - 3} more`);
  }

  console.log(`\n🔗 Confluence Page:`);
  console.log(`  ${result.confluencePageUrl}`);

  console.log('\n===================================\n');
}

/**
 * Main execution
 */
async function main() {
  try {
    console.log('Contract Processor - Example Usage\n');
    console.log('===================================\n');

    // Check if file exists
    if (!fs.existsSync(CONTRACT_FILE_PATH)) {
      console.error(`Error: File not found at ${CONTRACT_FILE_PATH}`);
      console.log('\nPlease update the CONTRACT_FILE_PATH variable in this script');
      process.exit(1);
    }

    console.log(`📁 Contract file: ${path.basename(CONTRACT_FILE_PATH)}`);

    // Step 1: Upload contract
    const jobId = await uploadContract(CONTRACT_FILE_PATH);

    // Step 2: Wait for processing
    const result = await waitForCompletion(jobId);

    // Step 3: Display results
    displayResults(result);

  } catch (error) {
    console.error('\n❌ Error:', error.message);
    process.exit(1);
  }
}

// Run if executed directly
if (require.main === module) {
  main();
}

module.exports = { uploadContract, checkJobStatus, waitForCompletion };
