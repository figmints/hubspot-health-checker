import { HubSpotContact, HubSpotCompany, AuditCategory } from './types';

export interface DataHygieneStats {
  totalContacts: number;
  orphanContactCount: number;
  orphanContactRate: number;
  estimatedDuplicates: number;
  estimatedDuplicateRate: number;
}

const MAX_SCORE = 15;

export function auditDataHygiene(
  contacts: HubSpotContact[],
  companies?: HubSpotCompany[]
): AuditCategory {
  if (contacts.length === 0) {
    return {
      score: 0,
      max: MAX_SCORE,
      issues: ['No contacts found in CRM'],
    };
  }

  const stats = calculateDataHygieneStats(contacts, companies);
  const issues: string[] = [];
  let score = MAX_SCORE;

  if (stats.orphanContactRate > 0.40) {
    const penalty = Math.min(7, Math.round((stats.orphanContactRate - 0.40) * 10));
    score -= penalty;
    issues.push(
      `${stats.orphanContactCount} orphan contacts (${(stats.orphanContactRate * 100).toFixed(1)}%) without company association`
    );
  }

  if (stats.orphanContactRate > 0.50) {
    issues.push(
      `High orphan rate indicates poor data governance. Most orphans likely have personal emails that can't be auto-associated.`
    );
  }

  if (stats.estimatedDuplicates > 0) {
    const penalty = Math.min(
      8,
      Math.round((stats.estimatedDuplicateRate / 0.05) * 8)
    );
    score -= penalty;
    issues.push(
      `Estimated ${stats.estimatedDuplicates} duplicate contacts (${(stats.estimatedDuplicateRate * 100).toFixed(2)}%) based on email/name collisions`
    );
  }

  return {
    score: Math.max(0, Math.round(score)),
    max: MAX_SCORE,
    issues,
  };
}

function calculateDataHygieneStats(
  contacts: HubSpotContact[],
  companies?: HubSpotCompany[]
): DataHygieneStats {
  let orphanCount = 0;
  contacts.forEach((contact) => {
    const company = contact.properties.company;
    if (!company || !company.trim()) {
      orphanCount++;
    }
  });

  const emailMap = new Map<string, number>();
  contacts.forEach((contact) => {
    const email = contact.properties.email?.toLowerCase().trim();
    if (email) {
      emailMap.set(email, (emailMap.get(email) || 0) + 1);
    }
  });

  let estimatedDuplicates = 0;
  emailMap.forEach((count) => {
    if (count > 1) {
      estimatedDuplicates += count - 1;
    }
  });

  const totalContacts = contacts.length;

  return {
    totalContacts,
    orphanContactCount: orphanCount,
    orphanContactRate: orphanCount / totalContacts,
    estimatedDuplicates,
    estimatedDuplicateRate: estimatedDuplicates / totalContacts,
  };
}

export function getDataHygieneStats(
  contacts: HubSpotContact[],
  companies?: HubSpotCompany[]
): DataHygieneStats {
  return calculateDataHygieneStats(contacts, companies);
}
