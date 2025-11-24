# SF Connect - Project TODO

## Core Infrastructure
- [x] Auto-generate JWT secret on first run (stored in database)
- [ ] Auto-detect APP_URL from request headers
- [x] Database schema for users, setup_config, activity_log, submissions
- [x] Database initialization with default admin user
- [x] Remove all Manus dependencies from codebase

## Authentication & Security
- [x] Email/password authentication with JWT
- [x] Password hashing with bcrypt
- [ ] Multi-factor authentication (MFA) with TOTP
- [x] Password change functionality
- [x] Login/logout/register endpoints
- [x] Authentication middleware for protecte- [x] Role-based access control (admin, operator, readonly)

## Salesforce Integration
- [x] OAuth 2.0 flow with Salesforce
- [ ] Auto-create Connected App via Metadata API
- [x] Store Salesforce credentials in database
- [x] Fetch Salesforce accounts
- [x] Fetch Salesforce contacts by account
- [x] Create/update contacts in Salesforce
- [x] Duplicate detection (by email)
- [x] Error handling and logging

## Admin Dashboard
- [x] Dashboard statistics and analytics
- [x] User management (list, create, update role, delete)
- [x] Activity log viewer (via admin API)
- [x] Submission tracking
- [ ] System health check endpoint
- [ ] Salesforce connection status

## Outlook Add-in
- [x] Add-in interface page
- [x] Email-to-contact form (Submit Contact tab)
- [x] Company/account selector
- [x] Top 3 contacts display (Company Contacts tab)
- [x] Contact submission with notes
- [ ] Dynamic manifest.xml generation
- [ ] Office.js integration

## Frontend Pages
- [x] Login page
- [ ] Register page (if needed)
- [x] Admin dashboard page
- [x] Outlook add-in page
- [ ] Settings/profile page

## Railway Deployment
- [x] Dockerfile for production build
- [x] Fix TypeScript build errors
- [x] Production environment configuration
- [x] Database migration on startup
- [ ] Health check endpoint for Railway

## Documentation
- [ ] README.md with setup instructions
- [ ] Railway deployment guide
- [ ] Quick start guide
- [ ] API documentation
- [ ] Environment variables reference (minimal)

## Testing & Validation
- [ ] Test build process
- [ ] Test authentication flow
- [ ] Test Salesforce integration
- [ ] Test admin dashboard
- [ ] Test Outlook add-in interface

## Deployment
- [x] Railway-optimized Dockerfile
- [x] Environment variable documentation (DEPLOYMENT.md)
- [x] GitHub repository setup instructions
- [x] CI/CD pipeline (GitHub Actions)
- [x] Production build configuration
- [x] Comprehensive deployment guide created
- [x] Outlook Add-in manifest template
- [x] Troubleshooting guide
- [x] Security best practices documented
- [x] Comprehensive README with deployment guide

## Testing
- [x] Authentication tests (password hashing, JWT tokens)
- [x] Database initialization tests (auto-generated secrets, default admin)
- [x] All tests passing (11/11 tests)

## New Features (In Progress)

### Salesforce Connected App Auto-Creation - IN PROGRESS
- [x] Implement Salesforce Metadata API client
- [x] Create Connected App XML template
- [x] Auto-generate callback URLs based on deployment URL
- [x] Deploy Connected App via Metadata API
- [x] Retrieve and store Consumer Key automatically
- [ ] Build setup wizard UI with step-by-step flow
- [ ] Add Salesforce credentials input form
- [ ] Implement automated deployment trigger
- [ ] Show deployment status and progress
- [ ] Handle errors and provide troubleshooting guidance

### Outlook Email Import - COMPLETED
- [x] Add Office.js SDK integration
- [x] Implement email context detection (useOfficeContext hook)
- [x] Extract sender name, email, and company from current email
- [x] Complete "Import from Email" button implementation
- [x] Auto-populate form fields with extracted data
- [x] Parse sender name into first/last name
- [x] Handle edge cases (no email selected, invalid data)
- [x] Company matching from email domain
- [ ] Test in Outlook desktop and web (requires Outlook Add-in deployment)

### Multi-Factor Authentication (MFA) - IN PROGRESS
- [x] MFA setup endpoint (generate TOTP secret and QR code)
- [x] MFA enable/disable with verification
- [x] MFA verification during login flow
- [x] Backup codes generation and storage (10 codes)
- [x] MFA recovery flow with backup codes
- [x] MFA settings UI component (MFASetup.tsx)
- [x] QR code display for authenticator app setup
- [x] MFA verification dialog for login
- [x] Integrate MFA settings into Admin page (Security tab)
- [ ] Test MFA flow end-to-end

## Railway Build Fix - COMPLETED
- [x] Fix package.json start script to use correct entry point
- [x] Fix Dockerfile CMD to use correct build output path
- [x] Fix __dirname polyfill for ESM bundling
- [x] Test production build locally
- [x] Keeping MySQL (no PostgreSQL conversion needed)

## Railway Runtime Fix - COMPLETED
- [x] Fixed vite.ts with proper __dirname handling for dev and production
- [x] Restored serveStatic function export
- [x] Test production build and runtime - ALL PASSING
- [x] Verified no duplicate declaration errors
- [x] All 12 tests passing

## Automatic Database Migration - COMPLETED
- [x] Create migration script that runs on server startup
- [x] Update server/_core/index.ts to run migrations before initialization
- [x] Production build successful with migration support
- [x] Migration will run automatically on Railway first startup

## Railway Build Fix - Login Import Error
- [x] Build works locally - issue was outdated code on Railway

## CORS Fix - Frontend/Backend Communication
- [x] Add CORS middleware to server/_core/index.ts
- [x] Configure proper origin handling for production (allow all origins with credentials)
- [ ] Test login flow after CORS fix

## Salesforce Setup Integration - NEW
- [x] Add Salesforce Setup tab to admin dashboard
- [x] Integrate existing SalesforceSetup page into admin panel
- [x] Enable Connected App auto-creation from admin dashboard
- [x] Add Outlook manifest XML generation and download button
