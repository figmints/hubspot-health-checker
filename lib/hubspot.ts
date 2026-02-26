import axios from "axios";

const HUBSPOT_API_BASE = "https://api.hubapi.com";
const HUBSPOT_OAUTH_BASE = "https://app.hubspot.com/oauth/authorize";
const HUBSPOT_TOKEN_URL = "https://api.hubapi.com/oauth/v1/token";

export function getOAuthUrl() {
  const clientId = process.env.HUBSPOT_CLIENT_ID;
  const redirectUri = process.env.HUBSPOT_REDIRECT_URI;

  const scopes = [
    "crm.objects.contacts.read",
    "crm.objects.companies.read",
    "crm.objects.deals.read",
    "crm.schemas.contacts.read",
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
        properties: ["name", "industry", "numberofemployees", "annualrevenue", "website"],
      },
    });

    return response.data;
  } catch (error) {
    console.error("Error fetching companies:", error);
    throw error;
  }
}
