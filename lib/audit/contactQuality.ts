import { HubSpotContact, AuditCategory } from './types';

export interface ContactQualityStats {
  totalContacts: number;
  emailFillRate: number;
  nameFillRate: number;
  companyAssociationRate: number;
  orphanContacts: number;
  industryFillRate: number;
  leadStatusFillRate: number;
}

const MAX_SCORE = 25;

export function auditContactQuality(contacts: HubSpotContact[]): AuditCategory {
  if (contacts.length === 0) {
    return {
      score: 0,
      max: MAX_SCORE,
      issues: ['No contacts found in CRM'],
    };
  }

  const stats = calculateContactStats(contacts);
  const issues: string[] = [];
  let score = MAX_SCORE;

  const emailScore = Math.round(stats.emailFillRate * 5);
  score -= 5 - emailScore;
  if (stats.emailFillRate < 0.95) {
    issues.push(
      `Only ${(stats.emailFillRate * 100).toFixed(1)}% of contacts have email addresses`
    );
  }

  const nameScore = Math.round(stats.nameFillRate * 5);
  score -= 5 - nameScore;
  if (stats.nameFillRate < 0.90) {
    issues.push(
      `${Math.round((1 - stats.nameFillRate) * stats.totalContacts)} contacts missing first or last names`
    );
  }

  const companyScore = Math.round(stats.companyAssociationRate * 7);
  score -= 7 - companyScore;
  if (stats.companyAssociationRate < 0.60) {
    issues.push(
      `${stats.orphanContacts} orphan contacts (${(stats.orphanContacts / stats.totalContacts * 100).toFixed(1)}%) without company association`
    );
  }

  const industryScore = Math.round(stats.industryFillRate * 4);
  score -= 4 - industryScore;
  if (stats.industryFillRate < 0.50) {
    issues.push(
      `Only ${(stats.industryFillRate * 100).toFixed(1)}% of contacts have industry data`
    );
  }

  const statusScore = Math.round(stats.leadStatusFillRate * 4);
  score -= 4 - statusScore;
  if (stats.leadStatusFillRate < 0.70) {
    issues.push(
      `Only ${(stats.leadStatusFillRate * 100).toFixed(1)}% of contacts have lead status defined`
    );
  }

  return {
    score: Math.max(0, Math.round(score)),
    max: MAX_SCORE,
    issues,
  };
}

function calculateContactStats(contacts: HubSpotContact[]): ContactQualityStats {
  let emailCount = 0;
  let nameCount = 0;
  let companyCount = 0;
  let industryCount = 0;
  let leadStatusCount = 0;

  contacts.forEach((contact) => {
    const props = contact.properties;

    if (props.email && props.email.trim()) {
      emailCount++;
    }

    if ((props.firstname && props.firstname.trim()) || 
        (props.lastname && props.lastname.trim())) {
      nameCount++;
    }

    if (props.company && props.company.trim()) {
      companyCount++;
    }

    if (props.industry && props.industry.trim()) {
      industryCount++;
    }

    if (props.hs_lead_status && props.hs_lead_status.trim()) {
      leadStatusCount++;
    }
  });

  const totalContacts = contacts.length;
  const orphanContacts = totalContacts - companyCount;

  return {
    totalContacts,
    emailFillRate: emailCount / totalContacts,
    nameFillRate: nameCount / totalContacts,
    companyAssociationRate: companyCount / totalContacts,
    orphanContacts,
    industryFillRate: industryCount / totalContacts,
    leadStatusFillRate: leadStatusCount / totalContacts,
  };
}

export function getContactQualityStats(
  contacts: HubSpotContact[]
): ContactQualityStats {
  return calculateContactStats(contacts);
}
