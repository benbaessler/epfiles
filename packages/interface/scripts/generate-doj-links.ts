/**
 * Script to generate DOJ document links mapping
 * 
 * Run with: bunx tsx packages/interface/scripts/generate-doj-links.ts
 * 
 * This script fetches all EFTA document IDs from each DataSet page on the DOJ website
 * and creates a mapping of document IDs to their direct PDF URLs.
 */

import * as fs from 'fs';
import * as path from 'path';

const DATA_SETS = [1, 2, 3, 4, 5, 6, 7, 8];
const BASE_URL = 'https://www.justice.gov/epstein/doj-disclosures/data-set-';
const OUTPUT_PATH = path.join(__dirname, '../src/data/doj-links.json');

interface DocumentMapping {
  [docId: string]: {
    url: string;
    dataSet: number;
  };
}

async function fetchDataSetPage(dataSet: number, page: number): Promise<string[]> {
  const url = `${BASE_URL}${dataSet}-files?page=${page}`;
  try {
    const response = await fetch(url);
    if (!response.ok) {
      console.error(`Failed to fetch ${url}: ${response.status}`);
      return [];
    }
    const html = await response.text();
    
    // Extract EFTA document IDs from the page
    // Looking for links like: https://www.justice.gov/epstein/files/DataSet%204/EFTA00005705.pdf
    const regex = /EFTA\d{8}\.pdf/g;
    const matches = html.match(regex) || [];
    return [...new Set(matches)].map(m => m.replace('.pdf', ''));
  } catch (error) {
    console.error(`Error fetching ${url}:`, error);
    return [];
  }
}

async function getMaxPages(dataSet: number): Promise<number> {
  const url = `${BASE_URL}${dataSet}-files`;
  try {
    const response = await fetch(url);
    if (!response.ok) return 0;
    const html = await response.text();
    
    // Look for "Last page" link with page number, e.g. ?page=62
    const lastPageMatch = html.match(/\?page=(\d+)"\s*>\s*<[^>]*>\s*Last/);
    if (lastPageMatch) {
      return parseInt(lastPageMatch[1], 10) + 1; // pages are 0-indexed
    }
    
    // Fallback: check if there's pagination at all
    if (html.includes('Page 2')) {
      // Has pagination but no "Last" - small number of pages
      const pageMatches = html.match(/\?page=(\d+)/g) || [];
      const pageNumbers = pageMatches.map(m => parseInt(m.replace('?page=', ''), 10));
      return Math.max(...pageNumbers, 0) + 1;
    }
    
    return 1; // Single page
  } catch (error) {
    console.error(`Error getting max pages for DataSet ${dataSet}:`, error);
    return 1;
  }
}

async function scrapeDataSet(dataSet: number): Promise<Map<string, string>> {
  const docMap = new Map<string, string>();
  const maxPages = await getMaxPages(dataSet);
  
  console.log(`DataSet ${dataSet}: ${maxPages} pages`);
  
  for (let page = 0; page < maxPages; page++) {
    const docIds = await fetchDataSetPage(dataSet, page);
    for (const docId of docIds) {
      const url = `https://www.justice.gov/epstein/files/DataSet%20${dataSet}/${docId}.pdf`;
      docMap.set(docId, url);
    }
    
    // Be nice to the server
    if (page < maxPages - 1) {
      await new Promise(resolve => setTimeout(resolve, 200));
    }
  }
  
  return docMap;
}

async function main() {
  console.log('Generating DOJ document links mapping...\n');
  
  const mapping: DocumentMapping = {};
  
  for (const dataSet of DATA_SETS) {
    console.log(`\nScraping DataSet ${dataSet}...`);
    const docMap = await scrapeDataSet(dataSet);
    
    for (const [docId, url] of docMap) {
      mapping[docId] = { url, dataSet };
    }
    
    console.log(`  Found ${docMap.size} documents`);
  }
  
  // Sort by document ID
  const sortedMapping: DocumentMapping = {};
  Object.keys(mapping)
    .sort()
    .forEach(key => {
      sortedMapping[key] = mapping[key];
    });
  
  // Ensure output directory exists
  const outputDir = path.dirname(OUTPUT_PATH);
  if (!fs.existsSync(outputDir)) {
    fs.mkdirSync(outputDir, { recursive: true });
  }
  
  // Write the mapping to a JSON file
  fs.writeFileSync(OUTPUT_PATH, JSON.stringify(sortedMapping, null, 2));
  
  console.log(`\n✅ Generated mapping with ${Object.keys(sortedMapping).length} documents`);
  console.log(`   Output: ${OUTPUT_PATH}`);
}

main().catch(console.error);


