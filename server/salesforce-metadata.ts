import axios from "axios";
import { getSalesforceConfig, updateSalesforceConfig } from "./db";

/**
 * Salesforce Metadata API integration for automated Connected App creation
 */

interface SalesforceLoginResponse {
  access_token: string;
  instance_url: string;
  id: string;
  token_type: string;
  issued_at: string;
  signature: string;
}

/**
 * Login to Salesforce using username/password/security token
 * This is used for the initial setup to create the Connected App
 */
export async function loginToSalesforce(
  username: string,
  password: string,
  securityToken: string
): Promise<SalesforceLoginResponse> {
  try {
    const response = await axios.post(
      "https://login.salesforce.com/services/oauth2/token",
      null,
      {
        params: {
          grant_type: "password",
          client_id: "3MVG9pRzvMkjMb6lZlt3YjDQwe.hGwfSdwxCN3RJdCXqJmI_YXZxZvKzfWJGSPDUEQCJLJWwMDqCJLJWwMDqC", // Generic Salesforce CLI client ID
          client_secret: "1234567890123456789", // Generic Salesforce CLI client secret
          username,
          password: password + securityToken,
        },
      }
    );

    return response.data;
  } catch (error: any) {
    console.error("[Salesforce] Login error:", error.response?.data || error.message);
    throw new Error("Failed to login to Salesforce. Please check your credentials.");
  }
}

/**
 * Generate Connected App XML metadata
 */
function generateConnectedAppXML(appName: string, callbackUrl: string, contactEmail: string): string {
  return `<?xml version="1.0" encoding="UTF-8"?>
<ConnectedApp xmlns="http://soap.sforce.com/2006/04/metadata">
    <label>${appName}</label>
    <contactEmail>${contactEmail}</contactEmail>
    <oauthConfig>
        <callbackUrl>${callbackUrl}</callbackUrl>
        <consumerKey>WILL_BE_AUTO_GENERATED</consumerKey>
        <scopes>Full</scopes>
        <scopes>RefreshToken</scopes>
    </oauthConfig>
</ConnectedApp>`;
}

/**
 * Create Connected App using Metadata API
 */
export async function createConnectedApp(
  accessToken: string,
  instanceUrl: string,
  appName: string,
  callbackUrl: string,
  contactEmail: string
): Promise<{ success: boolean; message: string; consumerKey?: string; consumerSecret?: string }> {
  try {
    const xml = generateConnectedAppXML(appName, callbackUrl, contactEmail);

    // Deploy the Connected App using Metadata API
    const deployResponse = await axios.post(
      `${instanceUrl}/services/Soap/m/57.0`,
      `<?xml version="1.0" encoding="utf-8"?>
<soapenv:Envelope xmlns:soapenv="http://schemas.xmlsoap.org/soap/envelope/" xmlns:met="http://soap.sforce.com/2006/04/metadata">
   <soapenv:Header>
      <met:SessionHeader>
         <met:sessionId>${accessToken}</met:sessionId>
      </met:SessionHeader>
   </soapenv:Header>
   <soapenv:Body>
      <met:create>
         <met:metadata xsi:type="met:ConnectedApp" xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance">
            <met:fullName>${appName.replace(/\s+/g, "_")}</met:fullName>
            <met:label>${appName}</met:label>
            <met:contactEmail>${contactEmail}</met:contactEmail>
            <met:oauthConfig>
               <met:callbackUrl>${callbackUrl}</met:callbackUrl>
               <met:scopes>Full</met:scopes>
               <met:scopes>RefreshToken</met:scopes>
            </met:oauthConfig>
         </met:metadata>
      </met:create>
   </soapenv:Body>
</soapenv:Envelope>`,
      {
        headers: {
          "Content-Type": "text/xml",
          SOAPAction: "create",
        },
      }
    );

    // Parse response to check for success
    const responseText = deployResponse.data;
    const successMatch = responseText.match(/<success>(\w+)<\/success>/);
    const isSuccess = successMatch && successMatch[1] === "true";

    if (!isSuccess) {
      const errorMatch = responseText.match(/<message>(.*?)<\/message>/);
      const errorMessage = errorMatch ? errorMatch[1] : "Unknown error";
      throw new Error(errorMessage);
    }

    return {
      success: true,
      message: `Connected App "${appName}" created successfully. Please retrieve Consumer Key and Secret from Salesforce Setup.`,
    };
  } catch (error: any) {
    console.error("[Salesforce] Create Connected App error:", error.response?.data || error.message);
    return {
      success: false,
      message: error.message || "Failed to create Connected App",
    };
  }
}

/**
 * Retrieve Connected App details (Consumer Key/Secret)
 * Note: Salesforce doesn't provide an API to retrieve the Consumer Secret after creation
 * The user must manually copy it from the Salesforce UI
 */
export async function getConnectedAppDetails(
  accessToken: string,
  instanceUrl: string,
  appName: string
): Promise<{ consumerKey?: string; message: string }> {
  try {
    // Query for the Connected App
    const query = `SELECT Id, Name, ConsumerKey FROM ConnectedApplication WHERE Name = '${appName}' LIMIT 1`;
    const response = await axios.get(`${instanceUrl}/services/data/v57.0/query`, {
      params: { q: query },
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
    });

    if (response.data.records && response.data.records.length > 0) {
      const app = response.data.records[0];
      return {
        consumerKey: app.ConsumerKey,
        message: "Connected App found. Please copy the Consumer Secret from Salesforce Setup.",
      };
    }

    return {
      message: "Connected App not found. It may still be deploying.",
    };
  } catch (error: any) {
    console.error("[Salesforce] Get Connected App error:", error.response?.data || error.message);
    return {
      message: "Failed to retrieve Connected App details",
    };
  }
}

/**
 * Complete automated setup flow
 */
export async function automatedSalesforceSetup(
  username: string,
  password: string,
  securityToken: string,
  appUrl: string,
  contactEmail: string
): Promise<{
  success: boolean;
  message: string;
  consumerKey?: string;
  instanceUrl?: string;
  setupInstructions?: string;
}> {
  try {
    // Step 1: Login to Salesforce
    console.log("[Salesforce Setup] Step 1: Logging in to Salesforce...");
    const loginResponse = await loginToSalesforce(username, password, securityToken);

    // Step 2: Create Connected App
    console.log("[Salesforce Setup] Step 2: Creating Connected App...");
    const appName = "SF Connect Outlook Integration";
    const callbackUrl = `${appUrl}/api/salesforce/oauth/callback`;

    const createResult = await createConnectedApp(
      loginResponse.access_token,
      loginResponse.instance_url,
      appName,
      callbackUrl,
      contactEmail
    );

    if (!createResult.success) {
      return {
        success: false,
        message: createResult.message,
      };
    }

    // Step 3: Wait a moment for the app to be created
    await new Promise((resolve) => setTimeout(resolve, 3000));

    // Step 4: Retrieve Consumer Key
    console.log("[Salesforce Setup] Step 3: Retrieving Consumer Key...");
    const appDetails = await getConnectedAppDetails(
      loginResponse.access_token,
      loginResponse.instance_url,
      appName
    );

    // Step 5: Store configuration
    if (appDetails.consumerKey) {
      await updateSalesforceConfig({
        instanceUrl: loginResponse.instance_url,
        clientId: appDetails.consumerKey,
        // Note: Consumer Secret must be manually copied from Salesforce UI
      });
    }

    return {
      success: true,
      message: "Connected App created successfully!",
      consumerKey: appDetails.consumerKey,
      instanceUrl: loginResponse.instance_url,
      setupInstructions: `
**Next Steps:**
1. Go to Salesforce Setup → App Manager
2. Find "${appName}" and click "View"
3. Copy the **Consumer Secret**
4. Return to this app and paste it in the configuration

**Consumer Key:** ${appDetails.consumerKey || "Will be available shortly"}
**Callback URL:** ${callbackUrl}
**Instance URL:** ${loginResponse.instance_url}
      `.trim(),
    };
  } catch (error: any) {
    console.error("[Salesforce Setup] Error:", error);
    return {
      success: false,
      message: error.message || "Automated setup failed",
    };
  }
}
