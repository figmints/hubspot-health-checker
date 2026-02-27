/**
 * Fixable Issues Detection
 * Analyzes HubSpot data and identifies issues that can be automatically fixed
 */

export interface FixableIssue {
  id: string;
  type: 'duplicate_contacts' | 'duplicate_companies' | 'orphan_contacts' | 
        'missing_email' | 'inconsistent_phone' | 'stale_deals' | 
        'missing_company_domain' | 'inconsistent_names';
  severity: 'high' | 'medium' | 'low';
  title: string;
  description: string;
  affectedCount: number;
  affectedRecords: Array<{
    id: string;
    name: string;
    details: Record<string, any>;
  }>;
  fixAction: string;
  estimatedImpact: string;
  canAutoFix: boolean;
}

/**
 * Detect duplicate contacts by email
 */
export function detectDuplicateContacts(contacts: any[]): FixableIssue | null {
  const emailMap: Record<string, any[]> = {};
  
  contacts.forEach((contact) => {
    const email = contact.properties?.email?.toLowerCase();
    if (email) {
      if (!emailMap[email]) emailMap[email] = [];
      emailMap[email].push(contact);
    }
  });
  
  const duplicates = Object.entries(emailMap)
    .filter(([_, contacts]) => contacts.length > 1)
    .map(([email, contacts]) => ({
      email,
      contacts: contacts.map(c => ({
        id: c.id,
        name: `${c.properties?.firstname || ''} ${c.properties?.lastname || ''}`.trim() || 'Unknown',
        details: { email, createdAt: c.createdAt }
      }))
    }));
  
  if (duplicates.length === 0) return null;
  
  const totalDuplicates = duplicates.reduce((sum, d) => sum + d.contacts.length - 1, 0);
  
  return {
    id: 'duplicate_contacts',
    type: 'duplicate_contacts',
    severity: totalDuplicates > 50 ? 'high' : totalDuplicates > 10 ? 'medium' : 'low',
    title: 'Duplicate Contacts',
    description: `Found ${duplicates.length} email addresses with multiple contacts`,
    affectedCount: totalDuplicates,
    affectedRecords: duplicates.flatMap(d => d.contacts.slice(1)), // Exclude primary
    fixAction: 'Merge duplicate contacts (keep oldest, combine data)',
    estimatedImpact: `Clean up ${totalDuplicates} duplicate records`,
    canAutoFix: true,
  };
}

/**
 * Detect duplicate companies by domain
 */
export function detectDuplicateCompanies(companies: any[]): FixableIssue | null {
  const domainMap: Record<string, any[]> = {};
  
  companies.forEach((company) => {
    let domain = company.properties?.domain?.toLowerCase() || 
                 company.properties?.website?.toLowerCase();
    
    if (domain) {
      // Normalize domain
      domain = domain.replace(/^(https?:\/\/)?(www\.)?/, '').split('/')[0];
      if (!domainMap[domain]) domainMap[domain] = [];
      domainMap[domain].push(company);
    }
  });
  
  const duplicates = Object.entries(domainMap)
    .filter(([_, companies]) => companies.length > 1)
    .map(([domain, companies]) => ({
      domain,
      companies: companies.map(c => ({
        id: c.id,
        name: c.properties?.name || 'Unknown',
        details: { domain, industry: c.properties?.industry }
      }))
    }));
  
  if (duplicates.length === 0) return null;
  
  const totalDuplicates = duplicates.reduce((sum, d) => sum + d.companies.length - 1, 0);
  
  return {
    id: 'duplicate_companies',
    type: 'duplicate_companies',
    severity: totalDuplicates > 20 ? 'high' : totalDuplicates > 5 ? 'medium' : 'low',
    title: 'Duplicate Companies',
    description: `Found ${duplicates.length} domains with multiple company records`,
    affectedCount: totalDuplicates,
    affectedRecords: duplicates.flatMap(d => d.companies.slice(1)),
    fixAction: 'Merge duplicate companies (keep most complete, combine data)',
    estimatedImpact: `Clean up ${totalDuplicates} duplicate company records`,
    canAutoFix: true,
  };
}

/**
 * Detect orphan contacts (no email AND no company)
 */
export function detectOrphanContacts(contacts: any[]): FixableIssue | null {
  const orphans = contacts.filter((c) => 
    !c.properties?.email && !c.properties?.company
  );
  
  if (orphans.length === 0) return null;
  
  return {
    id: 'orphan_contacts',
    type: 'orphan_contacts',
    severity: orphans.length > 100 ? 'high' : orphans.length > 20 ? 'medium' : 'low',
    title: 'Orphan Contacts',
    description: `Found ${orphans.length} contacts with no email and no company association`,
    affectedCount: orphans.length,
    affectedRecords: orphans.slice(0, 50).map(c => ({
      id: c.id,
      name: `${c.properties?.firstname || ''} ${c.properties?.lastname || ''}`.trim() || 'Unknown',
      details: { phone: c.properties?.phone }
    })),
    fixAction: 'Archive orphan contacts (recoverable from HubSpot trash)',
    estimatedImpact: `Clean up ${orphans.length} unusable contact records`,
    canAutoFix: true,
  };
}

/**
 * Detect contacts with missing email
 */
export function detectMissingEmails(contacts: any[]): FixableIssue | null {
  const missing = contacts.filter((c) => 
    !c.properties?.email && (c.properties?.firstname || c.properties?.lastname)
  );
  
  if (missing.length === 0) return null;
  
  const percentage = ((missing.length / contacts.length) * 100).toFixed(1);
  
  return {
    id: 'missing_email',
    type: 'missing_email',
    severity: parseFloat(percentage) > 30 ? 'high' : parseFloat(percentage) > 15 ? 'medium' : 'low',
    title: 'Missing Email Addresses',
    description: `${percentage}% of contacts (${missing.length}) are missing email addresses`,
    affectedCount: missing.length,
    affectedRecords: missing.slice(0, 50).map(c => ({
      id: c.id,
      name: `${c.properties?.firstname || ''} ${c.properties?.lastname || ''}`.trim() || 'Unknown',
      details: { company: c.properties?.company, phone: c.properties?.phone }
    })),
    fixAction: 'Flag for enrichment (requires external data service)',
    estimatedImpact: `Improve contact completeness for ${missing.length} records`,
    canAutoFix: false, // Requires external data
  };
}

/**
 * Detect inconsistent phone formats
 */
export function detectInconsistentPhones(contacts: any[]): FixableIssue | null {
  const inconsistent = contacts.filter((c) => {
    const phone = c.properties?.phone;
    if (!phone) return false;
    
    // Check if not in E.164 format
    return !phone.match(/^\+[1-9]\d{6,14}$/);
  });
  
  if (inconsistent.length === 0) return null;
  
  return {
    id: 'inconsistent_phone',
    type: 'inconsistent_phone',
    severity: inconsistent.length > 100 ? 'medium' : 'low',
    title: 'Inconsistent Phone Formats',
    description: `${inconsistent.length} contacts have non-standardized phone numbers`,
    affectedCount: inconsistent.length,
    affectedRecords: inconsistent.slice(0, 50).map(c => ({
      id: c.id,
      name: `${c.properties?.firstname || ''} ${c.properties?.lastname || ''}`.trim() || 'Unknown',
      details: { phone: c.properties?.phone }
    })),
    fixAction: 'Standardize to E.164 international format',
    estimatedImpact: `Normalize ${inconsistent.length} phone numbers for better calling/SMS`,
    canAutoFix: true,
  };
}

/**
 * Detect stale deals (no activity in 60+ days, still open)
 */
export function detectStaleDeals(deals: any[]): FixableIssue | null {
  const sixtyDaysAgo = Date.now() - 60 * 24 * 60 * 60 * 1000;
  
  const stale = deals.filter((d) => {
    const lastModified = d.properties?.hs_lastmodifieddate 
      ? new Date(d.properties.hs_lastmodifieddate).getTime()
      : 0;
    const stage = d.properties?.dealstage?.toLowerCase();
    
    // Check if stale and not in closed stages
    return lastModified < sixtyDaysAgo && 
           !stage?.includes('closed') && 
           !stage?.includes('won') && 
           !stage?.includes('lost');
  });
  
  if (stale.length === 0) return null;
  
  const totalValue = stale.reduce((sum, d) => 
    sum + (parseFloat(d.properties?.amount) || 0), 0
  );
  
  return {
    id: 'stale_deals',
    type: 'stale_deals',
    severity: stale.length > 20 ? 'high' : stale.length > 5 ? 'medium' : 'low',
    title: 'Stale Deals',
    description: `${stale.length} deals haven't been touched in 60+ days`,
    affectedCount: stale.length,
    affectedRecords: stale.slice(0, 50).map(d => ({
      id: d.id,
      name: d.properties?.dealname || 'Unknown Deal',
      details: { 
        amount: d.properties?.amount,
        stage: d.properties?.dealstage,
        lastModified: d.properties?.hs_lastmodifieddate
      }
    })),
    fixAction: 'Archive stale deals or move to "Closed Lost"',
    estimatedImpact: `Clean pipeline of ${stale.length} stale deals (${formatCurrency(totalValue)} total value)`,
    canAutoFix: true,
  };
}

/**
 * Detect companies missing domain
 */
export function detectMissingDomains(companies: any[]): FixableIssue | null {
  const missing = companies.filter((c) => 
    !c.properties?.domain && !c.properties?.website && c.properties?.name
  );
  
  if (missing.length === 0) return null;
  
  const percentage = ((missing.length / companies.length) * 100).toFixed(1);
  
  return {
    id: 'missing_company_domain',
    type: 'missing_company_domain',
    severity: parseFloat(percentage) > 40 ? 'high' : parseFloat(percentage) > 20 ? 'medium' : 'low',
    title: 'Missing Company Domains',
    description: `${percentage}% of companies (${missing.length}) are missing website/domain`,
    affectedCount: missing.length,
    affectedRecords: missing.slice(0, 50).map(c => ({
      id: c.id,
      name: c.properties?.name || 'Unknown',
      details: { industry: c.properties?.industry }
    })),
    fixAction: 'Look up domains from company names (requires enrichment)',
    estimatedImpact: `Enable deduplication and enrichment for ${missing.length} companies`,
    canAutoFix: false, // Requires external data
  };
}

/**
 * Detect inconsistent name formatting
 */
export function detectInconsistentNames(contacts: any[]): FixableIssue | null {
  const inconsistent = contacts.filter((c) => {
    const first = c.properties?.firstname || '';
    const last = c.properties?.lastname || '';
    
    // Check for ALL CAPS, all lowercase, or mixed issues
    const hasIssue = 
      (first && (first === first.toUpperCase() || first === first.toLowerCase())) ||
      (last && (last === last.toUpperCase() || last === last.toLowerCase()));
    
    // Only flag if name exists and has casing issue
    return hasIssue && (first.length > 1 || last.length > 1);
  });
  
  if (inconsistent.length < 10) return null; // Only flag if significant
  
  return {
    id: 'inconsistent_names',
    type: 'inconsistent_names',
    severity: 'low',
    title: 'Inconsistent Name Formatting',
    description: `${inconsistent.length} contacts have ALL CAPS or all lowercase names`,
    affectedCount: inconsistent.length,
    affectedRecords: inconsistent.slice(0, 50).map(c => ({
      id: c.id,
      name: `${c.properties?.firstname || ''} ${c.properties?.lastname || ''}`.trim(),
      details: { email: c.properties?.email }
    })),
    fixAction: 'Convert to proper Title Case formatting',
    estimatedImpact: `Professional formatting for ${inconsistent.length} contact names`,
    canAutoFix: true,
  };
}

/**
 * Run all fixable issue detections
 */
export function detectAllFixableIssues(
  contacts: any[], 
  deals: any[], 
  companies: any[]
): FixableIssue[] {
  const issues: FixableIssue[] = [];
  
  // Contact issues
  const dupContacts = detectDuplicateContacts(contacts);
  if (dupContacts) issues.push(dupContacts);
  
  const orphans = detectOrphanContacts(contacts);
  if (orphans) issues.push(orphans);
  
  const missingEmail = detectMissingEmails(contacts);
  if (missingEmail) issues.push(missingEmail);
  
  const inconsistentPhone = detectInconsistentPhones(contacts);
  if (inconsistentPhone) issues.push(inconsistentPhone);
  
  const inconsistentNames = detectInconsistentNames(contacts);
  if (inconsistentNames) issues.push(inconsistentNames);
  
  // Deal issues
  const staleDeals = detectStaleDeals(deals);
  if (staleDeals) issues.push(staleDeals);
  
  // Company issues
  const dupCompanies = detectDuplicateCompanies(companies);
  if (dupCompanies) issues.push(dupCompanies);
  
  const missingDomains = detectMissingDomains(companies);
  if (missingDomains) issues.push(missingDomains);
  
  // Sort by severity (high first)
  return issues.sort((a, b) => {
    const order = { high: 0, medium: 1, low: 2 };
    return order[a.severity] - order[b.severity];
  });
}

function formatCurrency(value: number): string {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    maximumFractionDigits: 0,
  }).format(value);
}
