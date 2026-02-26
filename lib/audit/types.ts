/**
 * HubSpot Audit Engine Types
 * Defines the shape of audit results and category scores
 */

export interface AuditCategory {
  score: number;
  max: number;
  issues: string[];
}

export interface AuditResult {
  score: number; // 0-100
  percentage: string;
  lastAudit: string;
  categories: {
    contactQuality: AuditCategory & { max: 25 };
    dealHealth: AuditCategory & { max: 25 };
    companyQuality: AuditCategory & { max: 20 };
    engagement: AuditCategory & { max: 15 };
    dataHygiene: AuditCategory & { max: 15 };
  };
  recommendations: string[];
}

// HubSpot API response types
export interface HubSpotObject {
  id: string;
  properties: Record<string, any>;
  createdAt?: string;
  updatedAt?: string;
}

export interface HubSpotContact extends HubSpotObject {
  properties: {
    firstname?: string;
    lastname?: string;
    email?: string;
    phone?: string;
    company?: string;
    industry?: string;
    lifecyclestage?: string;
    hs_lead_status?: string;
    hs_analytics_num_page_views?: string;
    hs_analytics_last_visit_timestamp?: string;
    hubspotsalesdeveloper?: string;
  };
}

export interface HubSpotDeal extends HubSpotObject {
  properties: {
    dealname?: string;
    dealstage?: string;
    amount?: string;
    closedate?: string;
    hs_lastmodifieddate?: string;
    hs_created_date?: string;
  };
}

export interface HubSpotCompany extends HubSpotObject {
  properties: {
    name?: string;
    industry?: string;
    numberofemployees?: string;
    annualrevenue?: string;
    website?: string;
  };
}

export interface AuditStats {
  contactQuality: {
    totalContacts: number;
    emailFillRate: number;
    nameFillRate: number;
    companyAssociationRate: number;
    orphanContacts: number;
    industryFillRate: number;
    leadStatusFillRate: number;
  };
  dealHealth: {
    totalDeals: number;
    stalePercentage: number;
    amountFillRate: number;
    closeDateFillRate: number;
    staleDealCount: number;
  };
  companyQuality: {
    totalCompanies: number;
    industryFillRate: number;
    employeeCountFillRate: number;
    revenueFillRate: number;
  };
  engagement: {
    totalContacts: number;
    emailOpenRate: number;
    marketingRatio: number;
  };
  dataHygiene: {
    orphanContactRate: number;
    duplicateEstimate: number;
  };
}
