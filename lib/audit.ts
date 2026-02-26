export interface AuditResult {
  overallScore: number;
  categories: CategoryScore[];
  issues: string[];
  recommendations: string[];
}

export interface CategoryScore {
  name: string;
  score: number;
  maxPoints: number;
  description: string;
  details: string[];
}

function calculateContactQuality(contacts: any[]): CategoryScore {
  let score = 0;
  const maxPoints = 25;
  const details: string[] = [];

  if (contacts.length === 0) {
    return {
      name: "Contact Data Quality",
      score: 0,
      maxPoints,
      description: "No contacts found",
      details: ["No contacts to analyze"],
    };
  }

  // Email fill rate
  const emailCount = contacts.filter(
    (c) => c.properties.email
  ).length;
  const emailRate = (emailCount / contacts.length) * 100;
  const emailScore = Math.round((emailRate / 100) * 5);
  score += emailScore;
  details.push(`Email fill rate: ${emailRate.toFixed(1)}% (${emailCount}/${contacts.length})`);

  // Name fill rate
  const nameCount = contacts.filter(
    (c) => c.properties.firstname && c.properties.lastname
  ).length;
  const nameRate = (nameCount / contacts.length) * 100;
  const nameScore = Math.round((nameRate / 100) * 5);
  score += nameScore;
  details.push(`Name fill rate: ${nameRate.toFixed(1)}% (${nameCount}/${contacts.length})`);

  // Company association
  const companyCount = contacts.filter((c) => c.properties.company).length;
  const companyRate = (companyCount / contacts.length) * 100;
  const companyScore = Math.round((companyRate / 100) * 5);
  score += companyScore;
  details.push(
    `Company association: ${companyRate.toFixed(1)}% (${companyCount}/${contacts.length})`
  );

  // Industry fill rate
  const industryCount = contacts.filter((c) => c.properties.industry).length;
  const industryRate = (industryCount / contacts.length) * 100;
  const industryScore = Math.round((industryRate / 100) * 5);
  score += industryScore;
  details.push(`Industry fill rate: ${industryRate.toFixed(1)}% (${industryCount}/${contacts.length})`);

  // Lead status fill rate
  const leadStatusCount = contacts.filter((c) => c.properties.hs_lead_status).length;
  const leadStatusRate = (leadStatusCount / contacts.length) * 100;
  const leadStatusScore = Math.round((leadStatusRate / 100) * 5);
  score += leadStatusScore;
  details.push(
    `Lead status fill rate: ${leadStatusRate.toFixed(1)}% (${leadStatusCount}/${contacts.length})`
  );

  return {
    name: "Contact Data Quality",
    score: Math.min(score, maxPoints),
    maxPoints,
    description: "Email, name, company, industry, and lead status completeness",
    details,
  };
}

function calculateDealPipelineHealth(deals: any[]): CategoryScore {
  let score = 0;
  const maxPoints = 25;
  const details: string[] = [];

  if (deals.length === 0) {
    return {
      name: "Deal Pipeline Health",
      score: maxPoints,
      maxPoints,
      description: "No deals to analyze",
      details: ["No deals found - this might indicate a sales process issue"],
    };
  }

  // Stale deal percentage (not touched in 30+ days)
  const thirtyDaysAgo = Date.now() - 30 * 24 * 60 * 60 * 1000;
  const staleDealCount = deals.filter((d) => {
    const lastModified = d.properties.hs_lastmodifieddate
      ? parseInt(d.properties.hs_lastmodifieddate)
      : 0;
    return lastModified < thirtyDaysAgo;
  }).length;
  const staleRate = (staleDealCount / deals.length) * 100;
  const staleScore = Math.max(0, 10 - Math.round(staleRate / 10));
  score += staleScore;
  details.push(`Stale deals (30+ days): ${staleRate.toFixed(1)}% (${staleDealCount}/${deals.length})`);

  // Amount fill rate
  const amountCount = deals.filter((d) => d.properties.amount).length;
  const amountRate = (amountCount / deals.length) * 100;
  const amountScore = Math.round((amountRate / 100) * 5);
  score += amountScore;
  details.push(`Amount fill rate: ${amountRate.toFixed(1)}% (${amountCount}/${deals.length})`);

  // Close date fill rate
  const closeDateCount = deals.filter((d) => d.properties.closedate).length;
  const closeDateRate = (closeDateCount / deals.length) * 100;
  const closeDateScore = Math.round((closeDateRate / 100) * 5);
  score += closeDateScore;
  details.push(`Close date fill rate: ${closeDateRate.toFixed(1)}% (${closeDateCount}/${deals.length})`);

  // Stage distribution
  const stageDistribution: Record<string, number> = {};
  deals.forEach((d) => {
    const stage = d.properties.dealstage || "Unknown";
    stageDistribution[stage] = (stageDistribution[stage] || 0) + 1;
  });
  const stageCount = Object.keys(stageDistribution).length;
  const balanceScore = stageCount >= 3 ? 5 : stageCount >= 2 ? 3 : 0;
  score += balanceScore;
  details.push(`Deal stages: ${stageCount} (${Object.keys(stageDistribution).join(", ")})`);

  return {
    name: "Deal Pipeline Health",
    score: Math.min(score, maxPoints),
    maxPoints,
    description: "Stale deals, amount/date fill rates, and pipeline distribution",
    details,
  };
}

function calculateCompanyDataQuality(companies: any[]): CategoryScore {
  let score = 0;
  const maxPoints = 20;
  const details: string[] = [];

  if (companies.length === 0) {
    return {
      name: "Company Data Quality",
      score: 0,
      maxPoints,
      description: "No companies found",
      details: ["No companies to analyze"],
    };
  }

  // Industry fill rate
  const industryCount = companies.filter((c) => c.properties.industry).length;
  const industryRate = (industryCount / companies.length) * 100;
  const industryScore = Math.round((industryRate / 100) * 5);
  score += industryScore;
  details.push(`Industry fill rate: ${industryRate.toFixed(1)}% (${industryCount}/${companies.length})`);

  // Employee count fill rate
  const empCount = companies.filter((c) => c.properties.numberofemployees).length;
  const empRate = (empCount / companies.length) * 100;
  const empScore = Math.round((empRate / 100) * 5);
  score += empScore;
  details.push(
    `Employee count fill rate: ${empRate.toFixed(1)}% (${empCount}/${companies.length})`
  );

  // Revenue fill rate
  const revCount = companies.filter((c) => c.properties.annualrevenue).length;
  const revRate = (revCount / companies.length) * 100;
  const revScore = Math.round((revRate / 100) * 5);
  score += revScore;
  details.push(`Revenue fill rate: ${revRate.toFixed(1)}% (${revCount}/${companies.length})`);

  // Website/domain fill rate
  const webCount = companies.filter((c) => c.properties.website).length;
  const webRate = (webCount / companies.length) * 100;
  const webScore = Math.round((webRate / 100) * 5);
  score += webScore;
  details.push(`Website fill rate: ${webRate.toFixed(1)}% (${webCount}/${companies.length})`);

  return {
    name: "Company Data Quality",
    score: Math.min(score, maxPoints),
    maxPoints,
    description: "Industry, employee count, revenue, and domain information",
    details,
  };
}

function calculateEngagementHealth(contacts: any[]): CategoryScore {
  let score = 0;
  const maxPoints = 15;
  const details: string[] = [];

  if (contacts.length === 0) {
    return {
      name: "Engagement Health",
      score: 0,
      maxPoints,
      description: "No contacts found",
      details: ["No contacts to analyze"],
    };
  }

  // Email engagement (page views in last 90 days)
  const ninetyDaysAgo = Date.now() - 90 * 24 * 60 * 60 * 1000;
  const engagedCount = contacts.filter((c) => {
    const lastVisit = c.properties.hs_analytics_last_visit_timestamp
      ? parseInt(c.properties.hs_analytics_last_visit_timestamp)
      : 0;
    return lastVisit > ninetyDaysAgo;
  }).length;
  const engagementRate = (engagedCount / contacts.length) * 100;
  const engagementScore = Math.round((engagementRate / 100) * 8);
  score += engagementScore;
  details.push(
    `Recently engaged (90 days): ${engagementRate.toFixed(1)}% (${engagedCount}/${contacts.length})`
  );

  // Marketing vs Sales ratio
  const sdrsCount = contacts.filter((c) => c.properties.hubspotsalesdeveloper).length;
  const salesRatio = (sdrsCount / contacts.length) * 100;
  const ratioScore = salesRatio > 5 && salesRatio < 50 ? 7 : 3;
  score += ratioScore;
  details.push(`Sales involvement: ${salesRatio.toFixed(1)}% (${sdrsCount}/${contacts.length})`);

  return {
    name: "Engagement Health",
    score: Math.min(score, maxPoints),
    maxPoints,
    description: "Email engagement and sales coverage",
    details,
  };
}

function calculateDataHygiene(contacts: any[]): CategoryScore {
  let score = 15;
  const maxPoints = 15;
  const details: string[] = [];

  if (contacts.length === 0) {
    return {
      name: "Data Hygiene",
      score: 0,
      maxPoints,
      description: "No contacts found",
      details: ["No contacts to analyze"],
    };
  }

  // Orphan rate (contacts with no email and no company)
  const orphanCount = contacts.filter(
    (c) => !c.properties.email && !c.properties.company
  ).length;
  const orphanRate = (orphanCount / contacts.length) * 100;
  const orphanPenalty = Math.round(orphanRate / 10);
  score -= orphanPenalty;
  details.push(`Orphan contacts (no email/company): ${orphanRate.toFixed(1)}% (${orphanCount}/${contacts.length})`);

  // Potential duplicates estimate (same email)
  const emailMap: Record<string, number> = {};
  contacts.forEach((c) => {
    const email = c.properties.email;
    if (email) {
      emailMap[email] = (emailMap[email] || 0) + 1;
    }
  });
  const duplicateCount = Object.values(emailMap).filter((count) => count > 1).length;
  const duplicateRate = (duplicateCount / contacts.length) * 100;
  const dupPenalty = Math.round(duplicateRate / 5);
  score -= dupPenalty;
  details.push(`Potential duplicates: ${duplicateRate.toFixed(1)}% (${duplicateCount}/${contacts.length})`);

  return {
    name: "Data Hygiene",
    score: Math.max(0, Math.min(score, maxPoints)),
    maxPoints,
    description: "Orphan contacts and duplicate detection",
    details,
  };
}

export function runAudit(
  contacts: any[],
  deals: any[],
  companies: any[]
): AuditResult {
  const categories = [
    calculateContactQuality(contacts),
    calculateDealPipelineHealth(deals),
    calculateCompanyDataQuality(companies),
    calculateEngagementHealth(contacts),
    calculateDataHygiene(contacts),
  ];

  const overallScore = Math.round(
    categories.reduce((sum, cat) => sum + (cat.score / cat.maxPoints) * 20, 0)
  );

  const issues: string[] = [];
  const recommendations: string[] = [];

  // Generate issues and recommendations based on scores
  categories.forEach((cat) => {
    const percentage = (cat.score / cat.maxPoints) * 100;
    if (percentage < 50) {
      issues.push(`${cat.name} is critical: ${percentage.toFixed(0)}% score`);
      recommendations.push(
        `Focus on improving ${cat.name.toLowerCase()} - ${cat.details[0]}`
      );
    } else if (percentage < 75) {
      issues.push(`${cat.name} needs attention: ${percentage.toFixed(0)}% score`);
      recommendations.push(
        `Consider improving ${cat.name.toLowerCase()} - ${cat.details[0]}`
      );
    }
  });

  // Limit to top 5 issues
  const topIssues = issues.slice(0, 5);
  const topRecommendations = recommendations.slice(0, 5);

  return {
    overallScore,
    categories,
    issues: topIssues,
    recommendations: topRecommendations,
  };
}
