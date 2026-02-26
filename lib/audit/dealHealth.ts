import { HubSpotDeal, AuditCategory } from './types';

export interface DealHealthStats {
  totalDeals: number;
  stalePercentage: number;
  staleDealCount: number;
  amountFillRate: number;
  closeDateFillRate: number;
}

const MAX_SCORE = 25;
const STALE_DAYS = 30;

export function auditDealHealth(deals: HubSpotDeal[]): AuditCategory {
  if (deals.length === 0) {
    return {
      score: 0,
      max: MAX_SCORE,
      issues: ['No deals found in CRM'],
    };
  }

  const stats = calculateDealStats(deals);
  const issues: string[] = [];
  let score = MAX_SCORE;

  const staleScore = Math.max(0, 10 - (stats.stalePercentage / 10));
  score -= 10 - staleScore;
  if (stats.stalePercentage > 0.50) {
    issues.push(
      `${stats.staleDealCount} deals (${(stats.stalePercentage * 100).toFixed(1)}%) haven't been modified in ${STALE_DAYS}+ days`
    );
  }

  const amountScore = Math.round(stats.amountFillRate * 8);
  score -= 8 - amountScore;
  if (stats.amountFillRate < 0.80) {
    const missingAmount = Math.round((1 - stats.amountFillRate) * stats.totalDeals);
    issues.push(
      `${missingAmount} deals missing deal amount - can't forecast revenue accurately`
    );
  }

  const closeDateScore = Math.round(stats.closeDateFillRate * 7);
  score -= 7 - closeDateScore;
  if (stats.closeDateFillRate < 0.85) {
    const missingDate = Math.round((1 - stats.closeDateFillRate) * stats.totalDeals);
    issues.push(
      `${missingDate} deals missing close date - can't predict cash flow`
    );
  }

  return {
    score: Math.max(0, Math.round(score)),
    max: MAX_SCORE,
    issues,
  };
}

function calculateDealStats(deals: HubSpotDeal[]): DealHealthStats {
  const now = new Date().getTime();
  const staleDaysMs = STALE_DAYS * 24 * 60 * 60 * 1000;

  let amountCount = 0;
  let closeDateCount = 0;
  let staleCount = 0;

  deals.forEach((deal) => {
    const props = deal.properties;

    if (props.amount && props.amount.trim() && props.amount !== '0') {
      amountCount++;
    }

    if (props.closedate && props.closedate.trim()) {
      closeDateCount++;
    }

    const lastModified = props.hs_lastmodifieddate
      ? new Date(props.hs_lastmodifieddate).getTime()
      : new Date(props.hs_created_date || 0).getTime();

    if (now - lastModified > staleDaysMs) {
      staleCount++;
    }
  });

  const totalDeals = deals.length;

  return {
    totalDeals,
    stalePercentage: staleCount / totalDeals,
    staleDealCount: staleCount,
    amountFillRate: amountCount / totalDeals,
    closeDateFillRate: closeDateCount / totalDeals,
  };
}

export function getDealHealthStats(deals: HubSpotDeal[]): DealHealthStats {
  return calculateDealStats(deals);
}
