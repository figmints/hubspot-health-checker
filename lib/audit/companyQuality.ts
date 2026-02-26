import { HubSpotCompany, AuditCategory } from './types';

export interface CompanyQualityStats {
  totalCompanies: number;
  industryFillRate: number;
  employeeCountFillRate: number;
  revenueFillRate: number;
}

const MAX_SCORE = 20;

export function auditCompanyQuality(companies: HubSpotCompany[]): AuditCategory {
  if (companies.length === 0) {
    return {
      score: 0,
      max: MAX_SCORE,
      issues: ['No companies found in CRM'],
    };
  }

  const stats = calculateCompanyStats(companies);
  const issues: string[] = [];
  let score = MAX_SCORE;

  const industryScore = Math.round(stats.industryFillRate * 7);
  score -= 7 - industryScore;
  if (stats.industryFillRate < 0.60) {
    issues.push(
      `Only ${(stats.industryFillRate * 100).toFixed(1)}% of companies have industry classification`
    );
  }

  const employeeScore = Math.round(stats.employeeCountFillRate * 7);
  score -= 7 - employeeScore;
  if (stats.employeeCountFillRate < 0.40) {
    issues.push(
      `Only ${(stats.employeeCountFillRate * 100).toFixed(1)}% of companies have employee count`
    );
  }

  const revenueScore = Math.round(stats.revenueFillRate * 6);
  score -= 6 - revenueScore;
  if (stats.revenueFillRate < 0.30) {
    issues.push(
      `Only ${(stats.revenueFillRate * 100).toFixed(1)}% of companies have revenue data`
    );
  }

  return {
    score: Math.max(0, Math.round(score)),
    max: MAX_SCORE,
    issues,
  };
}

function calculateCompanyStats(companies: HubSpotCompany[]): CompanyQualityStats {
  let industryCount = 0;
  let employeeCount = 0;
  let revenueCount = 0;

  companies.forEach((company) => {
    const props = company.properties;

    if (props.industry && props.industry.trim()) {
      industryCount++;
    }

    if (props.numberofemployees && props.numberofemployees.trim() && 
        props.numberofemployees !== '0') {
      employeeCount++;
    }

    if (props.annualrevenue && props.annualrevenue.trim() && 
        props.annualrevenue !== '0') {
      revenueCount++;
    }
  });

  const totalCompanies = companies.length;

  return {
    totalCompanies,
    industryFillRate: industryCount / totalCompanies,
    employeeCountFillRate: employeeCount / totalCompanies,
    revenueFillRate: revenueCount / totalCompanies,
  };
}

export function getCompanyQualityStats(
  companies: HubSpotCompany[]
): CompanyQualityStats {
  return calculateCompanyStats(companies);
}
