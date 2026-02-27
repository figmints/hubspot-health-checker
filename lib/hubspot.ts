import axios from "axios";

const HUBSPOT_API_BASE = "https://api.hubapi.com";
const HUBSPOT_OAUTH_BASE = "https://app.hubspot.com/oauth/authorize";
const HUBSPOT_TOKEN_URL = "https://api.hubapi.com/oauth/v1/token";

export function getOAuthUrl() {
  const clientId = process.env.HUBSPOT_CLIENT_ID;
  const redirectUri = process.env.HUBSPOT_REDIRECT_URI;

  const scopes = [
    "crm.objects.contacts.read",
    "crm.objects.contacts.write",
    "crm.objects.companies.read",
    "crm.objects.companies.write",
    "crm.objects.deals.read",
    "crm.objects.deals.write",
    "crm.schemas.contacts.read",
    "crm.schemas.companies.read",
    "crm.schemas.deals.read",
  ];

  const params = new URLSearchParams({
    client_id: clientId || "",
    redirect_uri: redirectUri || "",
    scope: scopes.join(" "),
  });

  return `${HUBSPOT_OAUTH_BASE}?${params.toString()}`;
}

export async function exchangeCodeForToken(code: string) {
  try {
    const response = await axios.post(HUBSPOT_TOKEN_URL, {
      grant_type: "authorization_code",
      client_id: process.env.HUBSPOT_CLIENT_ID,
      client_secret: process.env.HUBSPOT_CLIENT_SECRET,
      redirect_uri: process.env.HUBSPOT_REDIRECT_URI,
      code,
    });

    return {
      accessToken: response.data.access_token,
      refreshToken: response.data.refresh_token,
      expiresIn: response.data.expires_in,
    };
  } catch (error) {
    console.error("Error exchanging code for token:", error);
    throw error;
  }
}

export async function getContacts(accessToken: string, limit = 100) {
  try {
    const response = await axios.get(`${HUBSPOT_API_BASE}/crm/v3/objects/contacts`, {
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
      params: {
        limit,
        properties: [
          "firstname",
          "lastname",
          "email",
          "phone",
          "company",
          "industry",
          "lifecyclestage",
          "hs_lead_status",
          "hs_analytics_num_page_views",
          "hs_analytics_last_visit_timestamp",
          "hubspotsalesdeveloper",
        ],
      },
    });

    return response.data;
  } catch (error) {
    console.error("Error fetching contacts:", error);
    throw error;
  }
}

export async function getDeals(accessToken: string, limit = 100) {
  try {
    const response = await axios.get(`${HUBSPOT_API_BASE}/crm/v3/objects/deals`, {
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
      params: {
        limit,
        properties: [
          "dealname",
          "dealstage",
          "amount",
          "closedate",
          "hs_lastmodifieddate",
          "hs_created_date",
        ],
      },
    });

    return response.data;
  } catch (error) {
    console.error("Error fetching deals:", error);
    throw error;
  }
}

export async function getCompanies(accessToken: string, limit = 100) {
  try {
    const response = await axios.get(`${HUBSPOT_API_BASE}/crm/v3/objects/companies`, {
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
      params: {
        limit,
        properties: ["name", "industry", "numberofemployees", "annualrevenue", "website", "domain"],
      },
    });

    return response.data;
  } catch (error) {
    console.error("Error fetching companies:", error);
    throw error;
  }
}

// ============================================================
// WRITE OPERATIONS (Premium Features - Automated Remediation)
// ============================================================

/**
 * Update a contact's properties
 */
export async function updateContact(
  accessToken: string,
  contactId: string,
  properties: Record<string, any>
) {
  try {
    const response = await axios.patch(
      `${HUBSPOT_API_BASE}/crm/v3/objects/contacts/${contactId}`,
      { properties },
      {
        headers: {
          Authorization: `Bearer ${accessToken}`,
          "Content-Type": "application/json",
        },
      }
    );
    return response.data;
  } catch (error) {
    console.error("Error updating contact:", error);
    throw error;
  }
}

/**
 * Update a company's properties
 */
export async function updateCompany(
  accessToken: string,
  companyId: string,
  properties: Record<string, any>
) {
  try {
    const response = await axios.patch(
      `${HUBSPOT_API_BASE}/crm/v3/objects/companies/${companyId}`,
      { properties },
      {
        headers: {
          Authorization: `Bearer ${accessToken}`,
          "Content-Type": "application/json",
        },
      }
    );
    return response.data;
  } catch (error) {
    console.error("Error updating company:", error);
    throw error;
  }
}

/**
 * Update a deal's properties
 */
export async function updateDeal(
  accessToken: string,
  dealId: string,
  properties: Record<string, any>
) {
  try {
    const response = await axios.patch(
      `${HUBSPOT_API_BASE}/crm/v3/objects/deals/${dealId}`,
      { properties },
      {
        headers: {
          Authorization: `Bearer ${accessToken}`,
          "Content-Type": "application/json",
        },
      }
    );
    return response.data;
  } catch (error) {
    console.error("Error updating deal:", error);
    throw error;
  }
}

/**
 * Archive (soft delete) a contact
 */
export async function archiveContact(accessToken: string, contactId: string) {
  try {
    await axios.delete(
      `${HUBSPOT_API_BASE}/crm/v3/objects/contacts/${contactId}`,
      {
        headers: {
          Authorization: `Bearer ${accessToken}`,
        },
      }
    );
    return { success: true, contactId };
  } catch (error) {
    console.error("Error archiving contact:", error);
    throw error;
  }
}

/**
 * Archive (soft delete) a company
 */
export async function archiveCompany(accessToken: string, companyId: string) {
  try {
    await axios.delete(
      `${HUBSPOT_API_BASE}/crm/v3/objects/companies/${companyId}`,
      {
        headers: {
          Authorization: `Bearer ${accessToken}`,
        },
      }
    );
    return { success: true, companyId };
  } catch (error) {
    console.error("Error archiving company:", error);
    throw error;
  }
}

/**
 * Archive (soft delete) a deal
 */
export async function archiveDeal(accessToken: string, dealId: string) {
  try {
    await axios.delete(
      `${HUBSPOT_API_BASE}/crm/v3/objects/deals/${dealId}`,
      {
        headers: {
          Authorization: `Bearer ${accessToken}`,
        },
      }
    );
    return { success: true, dealId };
  } catch (error) {
    console.error("Error archiving deal:", error);
    throw error;
  }
}

/**
 * Batch update contacts
 */
export async function batchUpdateContacts(
  accessToken: string,
  updates: Array<{ id: string; properties: Record<string, any> }>
) {
  try {
    const response = await axios.post(
      `${HUBSPOT_API_BASE}/crm/v3/objects/contacts/batch/update`,
      { inputs: updates },
      {
        headers: {
          Authorization: `Bearer ${accessToken}`,
          "Content-Type": "application/json",
        },
      }
    );
    return response.data;
  } catch (error) {
    console.error("Error batch updating contacts:", error);
    throw error;
  }
}

/**
 * Batch update companies
 */
export async function batchUpdateCompanies(
  accessToken: string,
  updates: Array<{ id: string; properties: Record<string, any> }>
) {
  try {
    const response = await axios.post(
      `${HUBSPOT_API_BASE}/crm/v3/objects/companies/batch/update`,
      { inputs: updates },
      {
        headers: {
          Authorization: `Bearer ${accessToken}`,
          "Content-Type": "application/json",
        },
      }
    );
    return response.data;
  } catch (error) {
    console.error("Error batch updating companies:", error);
    throw error;
  }
}

/**
 * Merge duplicate companies (keeps first, archives second)
 */
export async function mergeCompanies(
  accessToken: string,
  primaryCompanyId: string,
  secondaryCompanyId: string
) {
  try {
    const response = await axios.post(
      `${HUBSPOT_API_BASE}/crm/v3/objects/companies/merge`,
      {
        primaryObjectId: primaryCompanyId,
        objectIdToMerge: secondaryCompanyId,
      },
      {
        headers: {
          Authorization: `Bearer ${accessToken}`,
          "Content-Type": "application/json",
        },
      }
    );
    return response.data;
  } catch (error) {
    console.error("Error merging companies:", error);
    throw error;
  }
}

/**
 * Merge duplicate contacts (keeps first, archives second)
 */
export async function mergeContacts(
  accessToken: string,
  primaryContactId: string,
  secondaryContactId: string
) {
  try {
    const response = await axios.post(
      `${HUBSPOT_API_BASE}/crm/v3/objects/contacts/merge`,
      {
        primaryObjectId: primaryContactId,
        objectIdToMerge: secondaryContactId,
      },
      {
        headers: {
          Authorization: `Bearer ${accessToken}`,
          "Content-Type": "application/json",
        },
      }
    );
    return response.data;
  } catch (error) {
    console.error("Error merging contacts:", error);
    throw error;
  }
}

/**
 * Search for contacts with specific criteria
 */
export async function searchContacts(
  accessToken: string,
  filterGroups: any[],
  properties: string[] = ["email", "firstname", "lastname"],
  limit = 100
) {
  try {
    const response = await axios.post(
      `${HUBSPOT_API_BASE}/crm/v3/objects/contacts/search`,
      {
        filterGroups,
        properties,
        limit,
      },
      {
        headers: {
          Authorization: `Bearer ${accessToken}`,
          "Content-Type": "application/json",
        },
      }
    );
    return response.data;
  } catch (error) {
    console.error("Error searching contacts:", error);
    throw error;
  }
}

/**
 * Search for companies with specific criteria
 */
export async function searchCompanies(
  accessToken: string,
  filterGroups: any[],
  properties: string[] = ["name", "domain", "industry"],
  limit = 100
) {
  try {
    const response = await axios.post(
      `${HUBSPOT_API_BASE}/crm/v3/objects/companies/search`,
      {
        filterGroups,
        properties,
        limit,
      },
      {
        headers: {
          Authorization: `Bearer ${accessToken}`,
          "Content-Type": "application/json",
        },
      }
    );
    return response.data;
  } catch (error) {
    console.error("Error searching companies:", error);
    throw error;
  }
}

// ============================================================
// DATA STANDARDIZATION HELPERS
// ============================================================

/**
 * Standardize phone number to E.164 format
 */
export function standardizePhone(phone: string): string {
  if (!phone) return "";
  
  // Remove all non-digit characters except +
  let cleaned = phone.replace(/[^\d+]/g, "");
  
  // If starts with 1 and is 11 digits, it's US with country code
  if (cleaned.length === 11 && cleaned.startsWith("1")) {
    return `+${cleaned}`;
  }
  
  // If 10 digits, assume US and add +1
  if (cleaned.length === 10) {
    return `+1${cleaned}`;
  }
  
  // If already has +, return as is
  if (cleaned.startsWith("+")) {
    return cleaned;
  }
  
  // Otherwise return with + prefix if it looks like a country code
  return phone;
}

/**
 * Standardize email to lowercase
 */
export function standardizeEmail(email: string): string {
  if (!email) return "";
  return email.toLowerCase().trim();
}

/**
 * Standardize company name (title case, remove Inc./LLC)
 */
export function standardizeCompanyName(name: string): string {
  if (!name) return "";
  
  // Remove common suffixes
  let cleaned = name
    .replace(/,?\s*(Inc\.?|LLC|Ltd\.?|Corp\.?|Corporation|Company|Co\.?)$/i, "")
    .trim();
  
  // Title case
  return cleaned
    .split(" ")
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
    .join(" ");
}

/**
 * Extract domain from email or URL
 */
export function extractDomain(input: string): string {
  if (!input) return "";
  
  // If it's an email
  if (input.includes("@")) {
    return input.split("@")[1]?.toLowerCase() || "";
  }
  
  // If it's a URL
  try {
    const url = new URL(input.startsWith("http") ? input : `https://${input}`);
    return url.hostname.replace(/^www\./, "").toLowerCase();
  } catch {
    return input.toLowerCase().replace(/^www\./, "");
  }
}
