import { HubSpotContact, AuditCategory } from './types';

export interface EngagementStats {
  totalContacts: number;
  emailOpenRate: number;
  marketingRatio: number;
  engagedCount: number;
  activeMarketingCount: number;
}

const MAX_SCORE = 15;
const NINETY_DAYS_MS = 90 * 24 * 60 * 60 * 1000;

export function auditEngagement(contacts: HubSpotContact[]): AuditCategory {
  if (contacts.length === 0) {
    return {
      score: 0,
      max: MAX_SCORE,
      issues: ['No contacts found in CRM'],
    };
  }

  const stats = calculateEngagementStats(contacts);
  const issues: string[] = [];
  let score = MAX_SCORE;

  const openScore = Math.round(stats.emailOpenRate * 8);
  score -= 8 - openScore;
  if (stats.emailOpenRate < 0.20) {
    issues.push(
      `Only ${(stats.emailOpenRate * 100).toFixed(1)}% of contacts show engagement (emails/page views) in last 90 days`
    );
  }

  if (stats.marketingRatio > 0.80) {
    const marketing = Math.round(stats.marketingRatio * stats.totalContacts);
    issues.push(
      `${marketing} contacts are marketing contacts - consider diversifying your contact base for better sales development`
    );
    score -= 4;
  } else if (stats.marketingRatio < 0.20) {
    issues.push(
      `Very low marketing contact ratio - may indicate poor list building or marketing integration`
    );
    score -= 2;
  }

  return {
    score: Math.max(0, Math.round(score)),
    max: MAX_SCORE,
    issues,
  };
}

function calculateEngagementStats(contacts: HubSpotContact[]): EngagementStats {
  const now = new Date().getTime();
  let engagedCount = 0;
  let activeMarketingCount = 0;

  contacts.forEach((contact) => {
    const props = contact.properties;

    const lastVisit = props.hs_analytics_last_visit_timestamp
      ? new Date(props.hs_analytics_last_visit_timestamp).getTime()
      : 0;
    const pageViews = props.hs_analytics_num_page_views
      ? parseInt(props.hs_analytics_num_page_views, 10)
      : 0;

    if (lastVisit > 0 && now - lastVisit < NINETY_DAYS_MS && pageViews > 0) {
      engagedCount++;
    }

    if (props.hubspotsalesdeveloper && 
        (props.hubspotsalesdeveloper === '1' || props.hubspotsalesdeveloper === 'true')) {
      activeMarketingCount++;
    }
  });

  const totalContacts = contacts.length;

  return {
    totalContacts,
    emailOpenRate: engagedCount / totalContacts,
    marketingRatio: activeMarketingCount / totalContacts,
    engagedCount,
    activeMarketingCount,
  };
}

export function getEngagementStats(contacts: HubSpotContact[]): EngagementStats {
  return calculateEngagementStats(contacts);
}
