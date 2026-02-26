import { AuditResult, HubSpotContact, HubSpotDeal, HubSpotCompany } from './types';
import { auditContactQuality, getContactQualityStats } from './contactQuality';
import { auditDealHealth, getDealHealthStats } from './dealHealth';
import { auditCompanyQuality, getCompanyQualityStats } from './companyQuality';
import { auditEngagement, getEngagementStats } from './engagement';
import { auditDataHygiene, getDataHygieneStats } from './dataHygiene';

export function runAudit(
  contacts: HubSpotContact[],
  deals: HubSpotDeal[],
  companies?: HubSpotCompany[]
): AuditResult {
  const contactQuality = auditContactQuality(contacts);
  const dealHealth = auditDealHealth(deals);
  const companyQuality = auditCompanyQuality(companies || []);
  const engagement = auditEngagement(contacts);
  const dataHygiene = auditDataHygiene(contacts, companies);

  const totalPossible = 
    contactQuality.max + 
    dealHealth.max + 
    companyQuality.max + 
    engagement.max + 
    dataHygiene.max;

  const totalScore = 
    contactQuality.score + 
    dealHealth.score + 
    companyQuality.score + 
    engagement.score + 
    dataHygiene.score;

  const score = Math.round((totalScore / totalPossible) * 100);

  const recommendations = generateRecommendations(
    contactQuality.issues,
    dealHealth.issues,
    companyQuality.issues,
    engagement.issues,
    dataHygiene.issues,
    {
      contactCount: contacts.length,
      dealCount: deals.length,
      companyCount: companies?.length || 0,
    }
  );

  return {
    score,
    percentage: `${score}%`,
    lastAudit: new Date().toISOString(),
    categories: {
      contactQuality: { ...contactQuality, max: contactQuality.max },
      dealHealth: { ...dealHealth, max: dealHealth.max },
      companyQuality: { ...companyQuality, max: companyQuality.max },
      engagement: { ...engagement, max: engagement.max },
      dataHygiene: { ...dataHygiene, max: dataHygiene.max },
    },
    recommendations,
  };
}

function generateRecommendations(
  contactIssues: string[],
  dealIssues: string[],
  companyIssues: string[],
  engagementIssues: string[],
  hygieneIssues: string[],
  stats: { contactCount: number; dealCount: number; companyCount: number }
): string[] {
  const recommendations: string[] = [];

  if (contactIssues.length > 0) {
    if (contactIssues.some((i) => i.includes('email'))) {
      recommendations.push(
        '📧 Email audit: Add emails to contacts missing them. Use enrichment tools for popular domains.'
      );
    }
    if (contactIssues.some((i) => i.includes('orphan'))) {
      recommendations.push(
        '🔗 Orphan contacts: Manually associate high-value contacts to companies, or flag personal email addresses for cleanup.'
      );
    }
    if (contactIssues.some((i) => i.includes('name'))) {
      recommendations.push(
        '👤 Name data: Require first/last name at contact creation. Use enrichment APIs for company records.'
      );
    }
    if (contactIssues.some((i) => i.includes('industry'))) {
      recommendations.push(
        '🏢 Industry classification: Enrich contacts with company industry during sync. Make it required for B2B contacts.'
      );
    }
    if (contactIssues.some((i) => i.includes('lead status'))) {
      recommendations.push(
        '🎯 Lead status: Define and enforce lead status workflow. Track status changes for pipeline visibility.'
      );
    }
  }

  if (dealIssues.length > 0) {
    if (dealIssues.some((i) => i.includes('stale'))) {
      recommendations.push(
        '⏰ Stale deals: Review inactive deals. Archive won/lost deals. Set reminders for follow-ups on active deals.'
      );
    }
    if (dealIssues.some((i) => i.includes('amount'))) {
      recommendations.push(
        '💰 Deal amount: Make deal amount required at creation. Validate realistic values to improve forecasting.'
      );
    }
    if (dealIssues.some((i) => i.includes('close date'))) {
      recommendations.push(
        '📅 Close date: Require close date and make it realistic based on sales cycle. Use it for revenue forecasting.'
      );
    }
  }

  if (companyIssues.length > 0) {
    if (companyIssues.some((i) => i.includes('industry'))) {
      recommendations.push(
        '🏭 Company enrichment: Bulk enrich companies with industry, employee count, and revenue data for better segmentation.'
      );
    }
    if (companyIssues.some((i) => i.includes('employee'))) {
      recommendations.push(
        '👥 Employee count: Use enrichment APIs (Apollo, ZoomInfo) to add employee counts for account-based marketing.'
      );
    }
    if (companyIssues.some((i) => i.includes('revenue'))) {
      recommendations.push(
        '💵 Revenue data: Enrich companies with annual revenue for deal sizing and account prioritization.'
      );
    }
  }

  if (engagementIssues.length > 0) {
    if (engagementIssues.some((i) => i.includes('engagement'))) {
      recommendations.push(
        '📊 Engagement: Low engagement indicates stale data. Clean up inactive contacts, re-segment, and reactivate campaigns.'
      );
    }
    if (engagementIssues.some((i) => i.includes('marketing'))) {
      recommendations.push(
        '📢 Marketing mix: Diversify contact sources. Use marketing automation to build high-quality prospect lists.'
      );
    }
  }

  if (hygieneIssues.length > 0) {
    if (hygieneIssues.some((i) => i.includes('orphan'))) {
      recommendations.push(
        '🗑️ Data cleanup: Remove contacts with personal emails (gmail, yahoo). Auto-associate b2b emails to companies.'
      );
    }
    if (hygieneIssues.some((i) => i.includes('duplicate'))) {
      recommendations.push(
        '🔍 Duplicate removal: Use HubSpot\'s merge contacts feature or third-party tools to deduplicate your database.'
      );
    }
  }

  if (recommendations.length === 0) {
    recommendations.push(
      '✅ Great job! Your CRM data is in excellent shape. Focus on maintaining data quality going forward.'
    );
  } else if (recommendations.length < 3) {
    recommendations.push(
      '📈 Once you address these issues, run the audit again to see your score improve.'
    );
  }

  return recommendations;
}

export function getAuditStats(
  contacts: HubSpotContact[],
  deals: HubSpotDeal[],
  companies?: HubSpotCompany[]
) {
  return {
    contact: getContactQualityStats(contacts),
    deals: getDealHealthStats(deals),
    companies: getCompanyQualityStats(companies || []),
    engagement: getEngagementStats(contacts),
    hygiene: getDataHygieneStats(contacts, companies),
  };
}

export * from './types';
