import express, { Request, Response } from "express";
import axios from "axios";
import { authenticate, requireOperator } from "../middleware";
import { getSalesforceConfig, updateSalesforceConfig, createSubmission, logActivity } from "../db";

const router = express.Router();

/**
 * GET /api/salesforce/oauth/authorize
 * Initiate Salesforce OAuth flow
 */
router.get("/oauth/authorize", authenticate, async (req: Request, res: Response) => {
  try {
    const redirectUri = `${req.protocol}://${req.get("host")}/api/salesforce/oauth/callback`;
    const clientId = process.env.SALESFORCE_CLIENT_ID || "PLACEHOLDER_CLIENT_ID";

    const authUrl = `https://login.salesforce.com/services/oauth2/authorize?` +
      `response_type=code&` +
      `client_id=${clientId}&` +
      `redirect_uri=${encodeURIComponent(redirectUri)}&` +
      `scope=api refresh_token`;

    res.redirect(authUrl);
  } catch (error: any) {
    console.error("[Salesforce] OAuth authorize error:", error);
    res.status(500).json({ error: "Failed to initiate OAuth" });
  }
});

/**
 * GET /api/salesforce/oauth/callback
 * Handle Salesforce OAuth callback
 */
router.get("/oauth/callback", async (req: Request, res: Response) => {
  try {
    const { code } = req.query;

    if (!code || typeof code !== "string") {
      res.status(400).json({ error: "Authorization code required" });
      return;
    }

    const redirectUri = `${req.protocol}://${req.get("host")}/api/salesforce/oauth/callback`;
    const clientId = process.env.SALESFORCE_CLIENT_ID || "";
    const clientSecret = process.env.SALESFORCE_CLIENT_SECRET || "";

    // Exchange code for tokens
    const tokenResponse = await axios.post("https://login.salesforce.com/services/oauth2/token", null, {
      params: {
        grant_type: "authorization_code",
        code,
        client_id: clientId,
        client_secret: clientSecret,
        redirect_uri: redirectUri,
      },
    });

    const { access_token, refresh_token, instance_url } = tokenResponse.data;

    // Save tokens to database
    await updateSalesforceConfig({
      accessToken: access_token,
      refreshToken: refresh_token,
      instanceUrl: instance_url,
      clientId,
      clientSecret,
    });

    res.redirect("/admin?salesforce=connected");
  } catch (error: any) {
    console.error("[Salesforce] OAuth callback error:", error);
    res.status(500).json({ error: "OAuth callback failed" });
  }
});

/**
 * GET /api/salesforce/accounts
 * Get Salesforce accounts
 */
router.get("/accounts", authenticate, async (req: Request, res: Response) => {
  try {
    const config = await getSalesforceConfig();

    if (!config || !config.accessToken || !config.instanceUrl) {
      res.status(400).json({ error: "Salesforce not connected" });
      return;
    }

    const response = await axios.get(`${config.instanceUrl}/services/data/v57.0/query`, {
      params: {
        q: "SELECT Id, Name FROM Account ORDER BY Name LIMIT 1000",
      },
      headers: {
        Authorization: `Bearer ${config.accessToken}`,
      },
    });

    res.json({ accounts: response.data.records });
  } catch (error: any) {
    console.error("[Salesforce] Get accounts error:", error);
    res.status(500).json({ error: "Failed to fetch accounts" });
  }
});

/**
 * GET /api/salesforce/contacts
 * Get contacts for an account
 */
router.get("/contacts", authenticate, async (req: Request, res: Response) => {
  try {
    const { accountId } = req.query;

    if (!accountId || typeof accountId !== "string") {
      res.status(400).json({ error: "Account ID required" });
      return;
    }

    const config = await getSalesforceConfig();

    if (!config || !config.accessToken || !config.instanceUrl) {
      res.status(400).json({ error: "Salesforce not connected" });
      return;
    }

    const response = await axios.get(`${config.instanceUrl}/services/data/v57.0/query`, {
      params: {
        q: `SELECT Id, Name, Title, Phone, MobilePhone FROM Contact WHERE AccountId = '${accountId}' ORDER BY CreatedDate DESC LIMIT 3`,
      },
      headers: {
        Authorization: `Bearer ${config.accessToken}`,
      },
    });

    res.json({ contacts: response.data.records });
  } catch (error: any) {
    console.error("[Salesforce] Get contacts error:", error);
    res.status(500).json({ error: "Failed to fetch contacts" });
  }
});

/**
 * POST /api/salesforce/contacts
 * Create or update a contact in Salesforce
 */
router.post("/contacts", authenticate, requireOperator, async (req: Request, res: Response) => {
  try {
    const { firstName, lastName, email, phone, title, accountId, description } = req.body;

    if (!firstName || !lastName || !email || !accountId) {
      res.status(400).json({ error: "First name, last name, email, and account ID are required" });
      return;
    }

    const config = await getSalesforceConfig();

    if (!config || !config.accessToken || !config.instanceUrl) {
      res.status(400).json({ error: "Salesforce not connected" });
      return;
    }

    // Check for existing contact by email
    const searchResponse = await axios.get(`${config.instanceUrl}/services/data/v57.0/query`, {
      params: {
        q: `SELECT Id FROM Contact WHERE Email = '${email}' LIMIT 1`,
      },
      headers: {
        Authorization: `Bearer ${config.accessToken}`,
      },
    });

    const contactData = {
      FirstName: firstName,
      LastName: lastName,
      Email: email,
      Phone: phone || null,
      Title: title || null,
      AccountId: accountId,
      Description: description || null,
    };

    let contactId: string;
    let action: "created" | "updated";

    if (searchResponse.data.records.length > 0) {
      // Update existing contact
      contactId = searchResponse.data.records[0].Id;
      await axios.patch(
        `${config.instanceUrl}/services/data/v57.0/sobjects/Contact/${contactId}`,
        contactData,
        {
          headers: {
            Authorization: `Bearer ${config.accessToken}`,
            "Content-Type": "application/json",
          },
        }
      );
      action = "updated";
    } else {
      // Create new contact
      const createResponse = await axios.post(
        `${config.instanceUrl}/services/data/v57.0/sobjects/Contact`,
        contactData,
        {
          headers: {
            Authorization: `Bearer ${config.accessToken}`,
            "Content-Type": "application/json",
          },
        }
      );
      contactId = createResponse.data.id;
      action = "created";
    }

    // Get account name
    const accountResponse = await axios.get(`${config.instanceUrl}/services/data/v57.0/sobjects/Account/${accountId}`, {
      headers: {
        Authorization: `Bearer ${config.accessToken}`,
      },
    });

    const accountName = accountResponse.data.Name;

    // Log submission
    if (req.user) {
      await createSubmission({
        userId: req.user.id,
        contactName: `${firstName} ${lastName}`,
        contactEmail: email,
        contactPhone: phone || null,
        contactPosition: title || null,
        companyName: accountName,
        companyId: accountId,
        salesforceContactId: contactId,
        notes: description || null,
        status: "success",
      });

      await logActivity(
        req.user.id,
        "contact_submitted",
        `Contact ${action}: ${firstName} ${lastName} at ${accountName}`,
        req.ip,
        req.headers["user-agent"]
      );
    }

    res.json({
      success: true,
      action,
      contactId,
      message: `Contact ${action} successfully`,
    });
  } catch (error: any) {
    console.error("[Salesforce] Create/update contact error:", error);

    // Log failed submission
    if (req.user) {
      await createSubmission({
        userId: req.user.id,
        contactName: `${req.body.firstName} ${req.body.lastName}`,
        contactEmail: req.body.email,
        contactPhone: req.body.phone || null,
        contactPosition: req.body.title || null,
        companyName: "Unknown",
        companyId: req.body.accountId,
        notes: req.body.description || null,
        status: "failed",
        errorMessage: error.message,
      });
    }

    res.status(500).json({ error: "Failed to create/update contact" });
  }
});

/**
 * GET /api/salesforce/status
 * Check Salesforce connection status
 */
router.get("/status", authenticate, async (req: Request, res: Response) => {
  try {
    const config = await getSalesforceConfig();

    if (!config || !config.accessToken) {
      res.json({ connected: false });
      return;
    }

    res.json({
      connected: true,
      instanceUrl: config.instanceUrl,
    });
  } catch (error: any) {
    console.error("[Salesforce] Status check error:", error);
    res.status(500).json({ error: "Failed to check status" });
  }
});

export default router;
