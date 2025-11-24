import express, { Request, Response } from "express";
import { authenticate, requireAdmin } from "../middleware";
import { automatedSalesforceSetup } from "../salesforce-metadata";
import { updateSalesforceConfig, logActivity } from "../db";

const router = express.Router();

/**
 * POST /api/setup/salesforce/auto
 * Automated Salesforce Connected App setup
 * Requires: Admin role, Salesforce credentials
 */
router.post("/salesforce/auto", authenticate, requireAdmin, async (req: Request, res: Response) => {
  try {
    const { username, password, securityToken, contactEmail } = req.body;

    if (!username || !password || !securityToken) {
      res.status(400).json({
        error: "Salesforce username, password, and security token are required",
      });
      return;
    }

    // Get app URL from request
    const appUrl = `${req.protocol}://${req.get("host")}`;

    // Run automated setup
    const result = await automatedSalesforceSetup(
      username,
      password,
      securityToken,
      appUrl,
      contactEmail || req.user?.email || "admin@example.com"
    );

    if (req.user) {
      await logActivity(
        req.user.id,
        result.success ? "salesforce_setup_success" : "salesforce_setup_failed",
        result.message,
        req.ip,
        req.headers["user-agent"]
      );
    }

    res.json(result);
  } catch (error: any) {
    console.error("[Setup] Automated Salesforce setup error:", error);
    res.status(500).json({
      error: "Automated setup failed",
      message: error.message,
    });
  }
});

/**
 * POST /api/setup/salesforce/complete
 * Complete Salesforce setup by providing Consumer Secret
 */
router.post("/salesforce/complete", authenticate, requireAdmin, async (req: Request, res: Response) => {
  try {
    const { consumerKey, consumerSecret, instanceUrl } = req.body;

    if (!consumerKey || !consumerSecret || !instanceUrl) {
      res.status(400).json({
        error: "Consumer Key, Consumer Secret, and Instance URL are required",
      });
      return;
    }

    // Update Salesforce configuration
    await updateSalesforceConfig({
      clientId: consumerKey,
      clientSecret: consumerSecret,
      instanceUrl,
    });

    if (req.user) {
      await logActivity(
        req.user.id,
        "salesforce_config_completed",
        "Salesforce Connected App configuration completed",
        req.ip,
        req.headers["user-agent"]
      );
    }

    res.json({
      success: true,
      message: "Salesforce configuration completed successfully",
    });
  } catch (error: any) {
    console.error("[Setup] Complete Salesforce setup error:", error);
    res.status(500).json({
      error: "Failed to complete setup",
      message: error.message,
    });
  }
});

/**
 * GET /api/setup/salesforce/download-xml
 * Download Connected App XML for manual deployment
 */
router.get("/salesforce/download-xml", authenticate, requireAdmin, async (req: Request, res: Response) => {
  try {
    const appUrl = `${req.protocol}://${req.get("host")}`;
    const callbackUrl = `${appUrl}/api/salesforce/oauth/callback`;
    const contactEmail = req.user?.email || "admin@example.com";

    const xml = `<?xml version="1.0" encoding="UTF-8"?>
<ConnectedApp xmlns="http://soap.sforce.com/2006/04/metadata">
    <label>SF Connect Outlook Integration</label>
    <contactEmail>${contactEmail}</contactEmail>
    <oauthConfig>
        <callbackUrl>${callbackUrl}</callbackUrl>
        <scopes>Full</scopes>
        <scopes>RefreshToken</scopes>
    </oauthConfig>
</ConnectedApp>`;

    res.setHeader("Content-Type", "application/xml");
    res.setHeader("Content-Disposition", 'attachment; filename="SFConnect.connectedApp"');
    res.send(xml);

    if (req.user) {
      await logActivity(
        req.user.id,
        "salesforce_xml_downloaded",
        "Downloaded Connected App XML for manual deployment",
        req.ip,
        req.headers["user-agent"]
      );
    }
  } catch (error: any) {
    console.error("[Setup] Download XML error:", error);
    res.status(500).json({
      error: "Failed to generate XML",
      message: error.message,
    });
  }
});

/**
 * GET /api/setup/outlook/download-manifest
 * Download Outlook Add-in manifest with dynamic app URL
 */
router.get("/outlook/download-manifest", authenticate, requireAdmin, async (req: Request, res: Response) => {
  try {
    const appUrl = `${req.protocol}://${req.get("host")}`;
    const addinUrl = `${appUrl}/addin`;

    const manifest = `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<OfficeApp
  xmlns="http://schemas.microsoft.com/office/appforoffice/1.1"
  xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance"
  xmlns:bt="http://schemas.microsoft.com/office/officeappbasictypes/1.0"
  xmlns:mailappor="http://schemas.microsoft.com/office/mailappversionoverrides/1.0"
  xsi:type="MailApp">
  <Id>8c4c8c8c-8c8c-8c8c-8c8c-8c8c8c8c8c8c</Id>
  <Version>1.0.0.0</Version>
  <ProviderName>SF Connect</ProviderName>
  <DefaultLocale>en-US</DefaultLocale>
  <DisplayName DefaultValue="SF Connect - Salesforce Outlook Integration"/>
  <Description DefaultValue="Automatically sync Outlook contacts to Salesforce"/>
  <IconUrl DefaultValue="${appUrl}/icon-64.png"/>
  <HighResolutionIconUrl DefaultValue="${appUrl}/icon-128.png"/>
  <SupportUrl DefaultValue="${appUrl}"/>
  <AppDomains>
    <AppDomain>${appUrl}</AppDomain>
  </AppDomains>
  <Hosts>
    <Host Name="Mailbox"/>
  </Hosts>
  <Requirements>
    <Sets>
      <Set Name="Mailbox" MinVersion="1.1"/>
    </Sets>
  </Requirements>
  <FormSettings>
    <Form xsi:type="ItemRead">
      <DesktopSettings>
        <SourceLocation DefaultValue="${addinUrl}"/>
        <RequestedHeight>450</RequestedHeight>
      </DesktopSettings>
    </Form>
  </FormSettings>
  <Permissions>ReadWriteMailbox</Permissions>
  <Rule xsi:type="RuleCollection" Mode="Or">
    <Rule xsi:type="ItemIs" ItemType="Message" FormType="Read"/>
    <Rule xsi:type="ItemIs" ItemType="Message" FormType="Edit"/>
    <Rule xsi:type="ItemIs" ItemType="Appointment" FormType="Read"/>
    <Rule xsi:type="ItemIs" ItemType="Appointment" FormType="Edit"/>
  </Rule>
  <VersionOverrides xmlns="http://schemas.microsoft.com/office/mailappversionoverrides" xsi:type="VersionOverridesV1_0">
    <Requirements>
      <bt:Sets DefaultMinVersion="1.3">
        <bt:Set Name="Mailbox"/>
      </bt:Sets>
    </Requirements>
    <Hosts>
      <Host xsi:type="MailHost">
        <DesktopFormFactor>
          <FunctionFile resid="Commands.Url"/>
          <ExtensionPoint xsi:type="MessageReadCommandSurface">
            <OfficeTab id="TabDefault">
              <Group id="msgReadGroup">
                <Label resid="GroupLabel"/>
                <Control xsi:type="Button" id="msgReadOpenPaneButton">
                  <Label resid="TaskpaneButton.Label"/>
                  <Supertip>
                    <Title resid="TaskpaneButton.Label"/>
                    <Description resid="TaskpaneButton.Tooltip"/>
                  </Supertip>
                  <Icon>
                    <bt:Image size="16" resid="Icon.16x16"/>
                    <bt:Image size="32" resid="Icon.32x32"/>
                    <bt:Image size="80" resid="Icon.80x80"/>
                  </Icon>
                  <Action xsi:type="ShowTaskpane">
                    <SourceLocation resid="Taskpane.Url"/>
                  </Action>
                </Control>
              </Group>
            </OfficeTab>
          </ExtensionPoint>
        </DesktopFormFactor>
      </Host>
    </Hosts>
    <Resources>
      <bt:Images>
        <bt:Image id="Icon.16x16" DefaultValue="${appUrl}/icon-16.png"/>
        <bt:Image id="Icon.32x32" DefaultValue="${appUrl}/icon-32.png"/>
        <bt:Image id="Icon.80x80" DefaultValue="${appUrl}/icon-80.png"/>
      </bt:Images>
      <bt:Urls>
        <bt:Url id="Commands.Url" DefaultValue="${addinUrl}"/>
        <bt:Url id="Taskpane.Url" DefaultValue="${addinUrl}"/>
      </bt:Urls>
      <bt:ShortStrings>
        <bt:String id="GroupLabel" DefaultValue="SF Connect"/>
        <bt:String id="TaskpaneButton.Label" DefaultValue="Open SF Connect"/>
      </bt:ShortStrings>
      <bt:LongStrings>
        <bt:String id="TaskpaneButton.Tooltip" DefaultValue="Sync contacts to Salesforce"/>
      </bt:LongStrings>
    </Resources>
  </VersionOverrides>
</OfficeApp>`;

    res.setHeader("Content-Type", "application/xml");
    res.setHeader("Content-Disposition", 'attachment; filename="sf-connect-manifest.xml"');
    res.send(manifest);

    if (req.user) {
      await logActivity(
        req.user.id,
        "outlook_manifest_downloaded",
        "Downloaded Outlook Add-in manifest",
        req.ip,
        req.headers["user-agent"]
      );
    }
  } catch (error: any) {
    console.error("[Setup] Download manifest error:", error);
    res.status(500).json({
      error: "Failed to generate manifest",
      message: error.message,
    });
  }
});

export default router;
