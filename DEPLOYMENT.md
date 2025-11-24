# SF Connect - Railway Deployment Guide

## 🚀 Quick Deploy to Railway

### Prerequisites
- GitHub account
- Railway account (https://railway.app)
- Salesforce Developer/Production account

### Step 1: Push to GitHub

```bash
# Initialize git repository (if not already done)
git init
git add .
git commit -m "Initial commit - SF Connect"

# Create a new repository on GitHub, then:
git remote add origin https://github.com/YOUR_USERNAME/sf-connect.git
git branch -M main
git push -u origin main
```

### Step 2: Deploy on Railway

1. Go to https://railway.app and sign in
2. Click **"New Project"**
3. Select **"Deploy from GitHub repo"**
4. Choose your `sf-connect` repository
5. Railway will automatically detect the Dockerfile and start building

### Step 3: Add MySQL Database

1. In your Railway project, click **"+ New"**
2. Select **"Database" → "Add MySQL"**
3. Railway will automatically set the `DATABASE_URL` environment variable
4. Wait for the database to provision (usually ~1 minute)

### Step 4: Access Your Application

1. Go to your service settings
2. Click **"Settings" → "Networking"**
3. Click **"Generate Domain"** to get a public URL
4. Your app will be available at: `https://your-app-name.up.railway.app`

### Step 5: Initial Setup

1. Navigate to your Railway URL
2. Login with default credentials:
   - **Email:** `admin@sfconnect.local`
   - **Password:** `Ch@ngE33#!!!`
3. **IMPORTANT:** Change the admin password immediately in the Security tab
4. Set up Salesforce integration (see below)

---

## 🔐 Security Setup

### Enable Multi-Factor Authentication (Recommended)

1. Login as admin
2. Go to **Security** tab
3. Click **"Enable Two-Factor Authentication"**
4. Scan QR code with authenticator app (Google Authenticator, Authy, etc.)
5. Enter verification code
6. **Save your backup codes** in a secure location

### Change Admin Password

1. Go to **Security** tab
2. Enter current password
3. Enter new strong password
4. Confirm new password

---

## 🔗 Salesforce Integration

### Option 1: Automated Setup (Recommended)

1. Login to SF Connect
2. Navigate to `/salesforce-setup`
3. Choose **"Automated Setup"** tab
4. Enter your Salesforce credentials:
   - Username
   - Password
   - Security Token (get from Salesforce: Setup → My Personal Information → Reset Security Token)
   - Contact Email
5. Click **"Start Automated Setup"**
6. The system will automatically:
   - Create a Connected App in Salesforce
   - Configure OAuth settings
   - Store credentials securely

### Option 2: Manual Setup

1. In Salesforce, go to **Setup → App Manager**
2. Click **"New Connected App"**
3. Fill in:
   - **Connected App Name:** SF Connect
   - **API Name:** SF_Connect
   - **Contact Email:** your-email@example.com
4. Enable OAuth Settings:
   - **Callback URL:** `https://your-railway-url.up.railway.app/api/salesforce/callback`
   - **Selected OAuth Scopes:**
     - Access and manage your data (api)
     - Perform requests on your behalf at any time (refresh_token, offline_access)
     - Access your basic information (id, profile, email, address, phone)
5. Click **Save**, then **Continue**
6. Copy the **Consumer Key** and **Consumer Secret**
7. In SF Connect, navigate to `/salesforce-setup`
8. Choose **"Manual Setup"** tab
9. Enter:
   - Consumer Key
   - Consumer Secret
   - Instance URL (e.g., `https://yourinstance.salesforce.com`)
10. Click **"Save Configuration"**

---

## 📱 Outlook Add-in Deployment

### Create Manifest File

Create `manifest.xml` with your Railway URL:

```xml
<?xml version="1.0" encoding="UTF-8"?>
<OfficeApp xmlns="http://schemas.microsoft.com/office/appforoffice/1.1"
           xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance"
           xmlns:bt="http://schemas.microsoft.com/office/officeappbasictypes/1.0"
           xsi:type="MailApp">
  <Id>12345678-1234-1234-1234-123456789012</Id>
  <Version>1.0.0.0</Version>
  <ProviderName>Your Company</ProviderName>
  <DefaultLocale>en-US</DefaultLocale>
  <DisplayName DefaultValue="SF Connect"/>
  <Description DefaultValue="Salesforce Contact Management for Outlook"/>
  <IconUrl DefaultValue="https://your-railway-url.up.railway.app/icon-64.png"/>
  <HighResolutionIconUrl DefaultValue="https://your-railway-url.up.railway.app/icon-128.png"/>
  <SupportUrl DefaultValue="https://your-company.com/support"/>
  
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
        <SourceLocation DefaultValue="https://your-railway-url.up.railway.app/addin"/>
        <RequestedHeight>450</RequestedHeight>
      </DesktopSettings>
    </Form>
  </FormSettings>
  
  <Permissions>ReadWriteMailbox</Permissions>
  
  <Rule xsi:type="RuleCollection" Mode="Or">
    <Rule xsi:type="ItemIs" ItemType="Message" FormType="Read"/>
  </Rule>
</OfficeApp>
```

### Deploy to Outlook

#### For Testing (Sideloading):
1. Open Outlook Web App
2. Go to **Settings → Manage Add-ins**
3. Click **"+ Add from file"**
4. Upload your `manifest.xml`
5. The add-in will appear in your Outlook ribbon

#### For Production (Office Store):
1. Package your add-in following Microsoft guidelines
2. Submit to Office Store: https://partner.microsoft.com/dashboard/office/overview
3. Wait for approval (typically 1-2 weeks)

---

## 🔧 Environment Variables

Railway automatically sets these variables:

| Variable | Description | Auto-Set |
|----------|-------------|----------|
| `DATABASE_URL` | MySQL connection string | ✅ Yes (by Railway MySQL) |
| `PORT` | Server port | ✅ Yes (Railway default: 3000) |
| `NODE_ENV` | Environment mode | ✅ Yes (production) |

**No manual environment variables needed!** JWT secrets and admin credentials are auto-generated on first run.

---

## 📊 Monitoring & Logs

### View Application Logs

1. In Railway project dashboard
2. Click on your service
3. Go to **"Deployments"** tab
4. Click on the latest deployment
5. View real-time logs in the **"Logs"** section

### Database Management

1. In Railway project dashboard
2. Click on your MySQL database
3. Go to **"Data"** tab to view tables
4. Or use the **"Connect"** tab to get connection details for external tools

---

## 🔄 Updates & Redeployment

Railway automatically redeploys when you push to GitHub:

```bash
# Make changes to your code
git add .
git commit -m "Your update message"
git push origin main
```

Railway will:
1. Detect the push
2. Build new Docker image
3. Run tests
4. Deploy if successful
5. Rollback if failed

---

## 🛠️ Troubleshooting

### Build Fails

**Check logs in Railway:**
- Go to Deployments → Latest deployment → Build logs
- Common issues:
  - Missing dependencies: Check `package.json`
  - TypeScript errors: Run `pnpm build` locally first
  - Docker issues: Verify `Dockerfile` syntax

### Database Connection Issues

**Verify DATABASE_URL:**
```bash
# In Railway service settings → Variables
# Should look like: mysql://user:password@host:port/database
```

**Test connection:**
- Railway automatically injects `DATABASE_URL`
- Check service logs for connection errors
- Ensure MySQL service is running

### Salesforce OAuth Fails

**Check callback URL:**
- Must match exactly in Salesforce Connected App
- Format: `https://your-railway-url.up.railway.app/api/salesforce/callback`
- No trailing slash!

**Verify OAuth scopes:**
- api
- refresh_token, offline_access
- id, profile, email, address, phone

### Outlook Add-in Not Loading

**Check manifest.xml:**
- Replace all instances of `your-railway-url.up.railway.app` with actual URL
- Ensure HTTPS (Railway provides this automatically)
- Validate XML syntax

**Clear Outlook cache:**
- Close Outlook completely
- Delete cache folder:
  - Windows: `%LOCALAPPDATA%\Microsoft\Office\16.0\Wef`
  - Mac: `~/Library/Containers/com.microsoft.Outlook/Data/Library/Caches`
- Restart Outlook

---

## 📈 Performance Optimization

### Enable Railway Metrics

1. In Railway project → Service settings
2. Go to **"Observability"**
3. Enable metrics collection
4. Monitor CPU, memory, and request rates

### Database Optimization

**Add indexes for common queries:**
```sql
-- Add index on email for faster user lookups
CREATE INDEX idx_users_email ON users(email);

-- Add index on submission status for dashboard
CREATE INDEX idx_submissions_status ON submissions(status);

-- Add index on activity log timestamp
CREATE INDEX idx_activity_log_timestamp ON activityLog(timestamp);
```

### Caching (Optional)

For high-traffic deployments, consider adding Redis:
1. In Railway, click **"+ New" → "Database" → "Add Redis"**
2. Update code to cache Salesforce API responses
3. Reduce API calls and improve response times

---

## 🔒 Security Best Practices

1. **Change default admin password immediately**
2. **Enable MFA for all admin accounts**
3. **Regularly rotate Salesforce credentials**
4. **Monitor activity logs for suspicious behavior**
5. **Keep backup codes in a secure location (password manager)**
6. **Use strong, unique passwords for all accounts**
7. **Limit user permissions based on role (admin, operator, readonly)**

---

## 📞 Support

For issues or questions:
- Check Railway logs first
- Review this deployment guide
- Verify all environment variables are set correctly
- Test locally with `pnpm dev` before deploying

---

## ✅ Deployment Checklist

- [ ] Code pushed to GitHub
- [ ] Railway project created
- [ ] MySQL database added
- [ ] Domain generated
- [ ] Application accessible via HTTPS
- [ ] Default admin login works
- [ ] Admin password changed
- [ ] MFA enabled (recommended)
- [ ] Salesforce Connected App configured
- [ ] Salesforce OAuth tested
- [ ] Outlook manifest.xml created
- [ ] Outlook add-in sideloaded and tested
- [ ] All tests passing (`pnpm test`)
- [ ] Logs reviewed for errors
- [ ] Backup codes saved securely

---

**Congratulations! Your SF Connect application is now live on Railway! 🎉**
