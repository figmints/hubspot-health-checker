import { NextResponse } from "next/server";
import { 
  getContacts, 
  getDeals, 
  getCompanies,
  updateContact,
  updateCompany,
  archiveContact,
  archiveDeal,
  mergeContacts,
  mergeCompanies,
  batchUpdateContacts,
  standardizePhone,
  standardizeEmail 
} from "@/lib/hubspot";
import { detectAllFixableIssues, FixableIssue } from "@/lib/fixable-issues";
import { getOrCreateWorkspace, recordFix, isPremiumByPortalId } from "@/lib/db";

interface FixResult {
  success: boolean;
  issueId: string;
  fixedCount: number;
  errors: string[];
  details: string[];
}

/**
 * GET /api/fix
 * Returns all detected fixable issues
 */
export async function GET(request: Request) {
  try {
    const authHeader = request.headers.get('Authorization');
    if (!authHeader?.startsWith('Bearer ')) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    
    const accessToken = authHeader.substring(7);
    
    // Fetch HubSpot data
    const [contactsData, dealsData, companiesData] = await Promise.all([
      getContacts(accessToken, 500),
      getDeals(accessToken, 500),
      getCompanies(accessToken, 500),
    ]);
    
    const contacts = contactsData.results || [];
    const deals = dealsData.results || [];
    const companies = companiesData.results || [];
    
    // Detect all fixable issues
    const issues = detectAllFixableIssues(contacts, deals, companies);
    
    return NextResponse.json({
      issues,
      summary: {
        totalIssues: issues.length,
        autoFixable: issues.filter(i => i.canAutoFix).length,
        highSeverity: issues.filter(i => i.severity === 'high').length,
        mediumSeverity: issues.filter(i => i.severity === 'medium').length,
        lowSeverity: issues.filter(i => i.severity === 'low').length,
      }
    });
  } catch (error) {
    console.error("Error detecting issues:", error);
    return NextResponse.json(
      { error: "Failed to detect issues", message: String(error) },
      { status: 500 }
    );
  }
}

/**
 * POST /api/fix
 * Executes a fix for a specific issue
 * Requires Premium subscription
 */
export async function POST(request: Request) {
  try {
    const authHeader = request.headers.get('Authorization');
    if (!authHeader?.startsWith('Bearer ')) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    
    const accessToken = authHeader.substring(7);
    const body = await request.json();
    const { issueId, dryRun = false, portalId } = body;
    
    // Check premium status
    const isPremium = portalId ? isPremiumByPortalId(portalId) : false;
    if (!isPremium && !dryRun) {
      return NextResponse.json(
        { 
          error: "Premium Required", 
          message: "Automated fixes require a Premium subscription. Upgrade to unlock this feature.",
          requiresPremium: true,
          upgradeUrl: "/api/checkout"
        }, 
        { status: 403 }
      );
    }
    
    if (!issueId) {
      return NextResponse.json(
        { error: "Missing issueId parameter" },
        { status: 400 }
      );
    }
    
    // First, get current issues to find the specific one
    const [contactsData, dealsData, companiesData] = await Promise.all([
      getContacts(accessToken, 500),
      getDeals(accessToken, 500),
      getCompanies(accessToken, 500),
    ]);
    
    const contacts = contactsData.results || [];
    const deals = dealsData.results || [];
    const companies = companiesData.results || [];
    
    const issues = detectAllFixableIssues(contacts, deals, companies);
    const issue = issues.find(i => i.id === issueId);
    
    if (!issue) {
      return NextResponse.json(
        { error: "Issue not found or already resolved" },
        { status: 404 }
      );
    }
    
    if (!issue.canAutoFix) {
      return NextResponse.json(
        { error: "This issue cannot be automatically fixed" },
        { status: 400 }
      );
    }
    
    // Execute the fix based on issue type
    let result: FixResult;
    
    if (dryRun) {
      result = {
        success: true,
        issueId,
        fixedCount: issue.affectedCount,
        errors: [],
        details: [`DRY RUN: Would fix ${issue.affectedCount} records`],
      };
    } else {
      switch (issue.type) {
        case 'orphan_contacts':
          result = await fixOrphanContacts(accessToken, issue);
          break;
        case 'inconsistent_phone':
          result = await fixInconsistentPhones(accessToken, issue, contacts);
          break;
        case 'inconsistent_names':
          result = await fixInconsistentNames(accessToken, issue, contacts);
          break;
        case 'stale_deals':
          result = await fixStaleDeals(accessToken, issue);
          break;
        case 'duplicate_contacts':
          result = await fixDuplicateContacts(accessToken, contacts);
          break;
        case 'duplicate_companies':
          result = await fixDuplicateCompanies(accessToken, companies);
          break;
        default:
          return NextResponse.json(
            { error: `Fix not implemented for issue type: ${issue.type}` },
            { status: 400 }
          );
      }
    }
    
    // Log the fix action
    console.log(`[FIX] ${issueId}: Fixed ${result.fixedCount} records, ${result.errors.length} errors`);
    
    // Record fix in database (use a default portal ID for now)
    try {
      const workspace = getOrCreateWorkspace('default-portal');
      recordFix(
        workspace.id,
        issue.type,
        issue.title,
        result.fixedCount,
        result.errors.length,
        result.details.slice(0, 10) // Limit details stored
      );
    } catch (dbError) {
      console.error('Failed to record fix in database:', dbError);
      // Don't fail the request if database logging fails
    }
    
    return NextResponse.json(result);
  } catch (error) {
    console.error("Error executing fix:", error);
    return NextResponse.json(
      { error: "Failed to execute fix", message: String(error) },
      { status: 500 }
    );
  }
}

/**
 * Fix orphan contacts by archiving them
 */
async function fixOrphanContacts(
  accessToken: string, 
  issue: FixableIssue
): Promise<FixResult> {
  const errors: string[] = [];
  const details: string[] = [];
  let fixedCount = 0;
  
  for (const record of issue.affectedRecords) {
    try {
      await archiveContact(accessToken, record.id);
      fixedCount++;
      details.push(`Archived contact: ${record.name} (${record.id})`);
    } catch (error) {
      errors.push(`Failed to archive ${record.id}: ${error}`);
    }
    
    // Rate limiting - HubSpot allows 100 requests per 10 seconds
    if (fixedCount % 10 === 0) {
      await sleep(100);
    }
  }
  
  return {
    success: errors.length === 0,
    issueId: issue.id,
    fixedCount,
    errors,
    details,
  };
}

/**
 * Fix inconsistent phone formats by standardizing to E.164
 */
async function fixInconsistentPhones(
  accessToken: string, 
  issue: FixableIssue,
  contacts: any[]
): Promise<FixResult> {
  const errors: string[] = [];
  const details: string[] = [];
  let fixedCount = 0;
  
  // Find contacts with phone numbers that need standardization
  const contactsToFix = contacts.filter(c => {
    const phone = c.properties?.phone;
    if (!phone) return false;
    return !phone.match(/^\+[1-9]\d{6,14}$/);
  });
  
  // Batch update in groups of 100
  const batches = chunkArray(contactsToFix, 100);
  
  for (const batch of batches) {
    try {
      const updates = batch.map(contact => {
        const originalPhone = contact.properties.phone;
        const standardizedPhone = standardizePhone(originalPhone);
        return {
          id: contact.id,
          properties: {
            phone: standardizedPhone || originalPhone,
          }
        };
      }).filter(u => u.properties.phone);
      
      if (updates.length > 0) {
        await batchUpdateContacts(accessToken, updates);
        fixedCount += updates.length;
        details.push(`Standardized ${updates.length} phone numbers`);
      }
    } catch (error) {
      errors.push(`Batch update failed: ${error}`);
    }
    
    await sleep(100);
  }
  
  return {
    success: errors.length === 0,
    issueId: issue.id,
    fixedCount,
    errors,
    details,
  };
}

/**
 * Fix inconsistent name formatting
 */
async function fixInconsistentNames(
  accessToken: string, 
  issue: FixableIssue,
  contacts: any[]
): Promise<FixResult> {
  const errors: string[] = [];
  const details: string[] = [];
  let fixedCount = 0;
  
  // Find contacts with name issues
  const contactsToFix = contacts.filter(c => {
    const first = c.properties?.firstname || '';
    const last = c.properties?.lastname || '';
    return (first && (first === first.toUpperCase() || first === first.toLowerCase()) && first.length > 1) ||
           (last && (last === last.toUpperCase() || last === last.toLowerCase()) && last.length > 1);
  });
  
  const batches = chunkArray(contactsToFix, 100);
  
  for (const batch of batches) {
    try {
      const updates = batch.map(contact => ({
        id: contact.id,
        properties: {
          firstname: toTitleCase(contact.properties.firstname),
          lastname: toTitleCase(contact.properties.lastname),
        }
      }));
      
      await batchUpdateContacts(accessToken, updates);
      fixedCount += updates.length;
      details.push(`Formatted ${updates.length} contact names`);
    } catch (error) {
      errors.push(`Batch update failed: ${error}`);
    }
    
    await sleep(100);
  }
  
  return {
    success: errors.length === 0,
    issueId: issue.id,
    fixedCount,
    errors,
    details,
  };
}

/**
 * Fix stale deals by archiving them
 */
async function fixStaleDeals(
  accessToken: string, 
  issue: FixableIssue
): Promise<FixResult> {
  const errors: string[] = [];
  const details: string[] = [];
  let fixedCount = 0;
  
  for (const record of issue.affectedRecords) {
    try {
      await archiveDeal(accessToken, record.id);
      fixedCount++;
      details.push(`Archived deal: ${record.name} (${record.id})`);
    } catch (error) {
      errors.push(`Failed to archive ${record.id}: ${error}`);
    }
    
    if (fixedCount % 10 === 0) {
      await sleep(100);
    }
  }
  
  return {
    success: errors.length === 0,
    issueId: issue.id,
    fixedCount,
    errors,
    details,
  };
}

/**
 * Fix duplicate contacts by merging
 */
async function fixDuplicateContacts(
  accessToken: string,
  contacts: any[]
): Promise<FixResult> {
  const errors: string[] = [];
  const details: string[] = [];
  let fixedCount = 0;
  
  // Group contacts by email
  const emailMap: Record<string, any[]> = {};
  contacts.forEach(contact => {
    const email = contact.properties?.email?.toLowerCase();
    if (email) {
      if (!emailMap[email]) emailMap[email] = [];
      emailMap[email].push(contact);
    }
  });
  
  // Merge duplicates
  for (const [email, dupes] of Object.entries(emailMap)) {
    if (dupes.length <= 1) continue;
    
    // Sort by creation date - keep oldest as primary
    const sorted = dupes.sort((a, b) => 
      new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()
    );
    
    const primary = sorted[0];
    
    for (let i = 1; i < sorted.length; i++) {
      try {
        await mergeContacts(accessToken, primary.id, sorted[i].id);
        fixedCount++;
        details.push(`Merged ${sorted[i].id} into ${primary.id} (${email})`);
      } catch (error) {
        errors.push(`Failed to merge ${sorted[i].id}: ${error}`);
      }
      
      await sleep(200); // Merge operations need more time
    }
  }
  
  return {
    success: errors.length === 0,
    issueId: 'duplicate_contacts',
    fixedCount,
    errors,
    details,
  };
}

/**
 * Fix duplicate companies by merging
 */
async function fixDuplicateCompanies(
  accessToken: string,
  companies: any[]
): Promise<FixResult> {
  const errors: string[] = [];
  const details: string[] = [];
  let fixedCount = 0;
  
  // Group companies by domain
  const domainMap: Record<string, any[]> = {};
  companies.forEach(company => {
    let domain = company.properties?.domain?.toLowerCase() || 
                 company.properties?.website?.toLowerCase();
    if (domain) {
      domain = domain.replace(/^(https?:\/\/)?(www\.)?/, '').split('/')[0];
      if (!domainMap[domain]) domainMap[domain] = [];
      domainMap[domain].push(company);
    }
  });
  
  // Merge duplicates
  for (const [domain, dupes] of Object.entries(domainMap)) {
    if (dupes.length <= 1) continue;
    
    // Sort by creation date - keep oldest as primary
    const sorted = dupes.sort((a, b) => 
      new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()
    );
    
    const primary = sorted[0];
    
    for (let i = 1; i < sorted.length; i++) {
      try {
        await mergeCompanies(accessToken, primary.id, sorted[i].id);
        fixedCount++;
        details.push(`Merged ${sorted[i].id} into ${primary.id} (${domain})`);
      } catch (error) {
        errors.push(`Failed to merge ${sorted[i].id}: ${error}`);
      }
      
      await sleep(200);
    }
  }
  
  return {
    success: errors.length === 0,
    issueId: 'duplicate_companies',
    fixedCount,
    errors,
    details,
  };
}

// Helper functions
function sleep(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms));
}

function chunkArray<T>(array: T[], size: number): T[][] {
  const chunks: T[][] = [];
  for (let i = 0; i < array.length; i += size) {
    chunks.push(array.slice(i, i + size));
  }
  return chunks;
}

function toTitleCase(str: string): string {
  if (!str) return str;
  return str
    .toLowerCase()
    .split(' ')
    .map(word => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ');
}
