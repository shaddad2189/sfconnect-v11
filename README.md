# SF Connect - Salesforce Outlook Integration

A standalone Salesforce contact management application with Outlook Add-in capabilities, built for easy deployment on Railway.

## Features

- ✅ **Zero Manual Configuration** - JWT secrets auto-generated on first run
- ✅ **Email/Password Authentication** - Secure bcrypt password hashing
- ✅ **Role-Based Access Control** - Admin, Operator, and Read-Only roles
- ✅ **Salesforce OAuth Integration** - Connect to any Salesforce org
- ✅ **Two-Tab Outlook Add-in Interface**:
  - **Submit Contact** - Add/update contacts with company selection
  - **Company Contacts** - View top 3 contacts for any company
- ✅ **Admin Dashboard** - User management, submission tracking, analytics
- ✅ **Activity Logging** - Complete audit trail of all actions
- ✅ **No Manus Dependencies** - Completely standalone codebase

## Tech Stack

- **Frontend**: React 19, Tailwind CSS 4, shadcn/ui
- **Backend**: Express.js, Node.js 18+
- **Database**: MySQL/TiDB (Railway PostgreSQL compatible)
- **Authentication**: JWT with auto-generated secrets
- **Password Hashing**: bcrypt (12 rounds)
- **Salesforce**: OAuth 2.0, REST API v57.0

## Quick Start

### Prerequisites

- Node.js 18+ and pnpm
- MySQL/PostgreSQL database
- Salesforce Connected App (optional, can be configured later)

### Local Development

1. **Clone the repository**
   ```bash
   git clone <your-repo-url>
   cd sf-connect
   ```

2. **Install dependencies**
   ```bash
   pnpm install
   ```

3. **Set up environment variables**
   Create a `.env` file:
   ```env
   DATABASE_URL=mysql://user:password@localhost:3306/sf_connect
   PORT=3000
   NODE_ENV=development
   
   # Optional: Salesforce credentials (can be added later via UI)
   SALESFORCE_CLIENT_ID=your_client_id
   SALESFORCE_CLIENT_SECRET=your_client_secret
   ```

4. **Run database migrations**
   ```bash
   pnpm db:push
   ```

5. **Start the development server**
   ```bash
   pnpm dev
   ```

6. **Access the application**
   - Open http://localhost:3000
   - Login with default credentials:
     - Email: `admin@sfconnect.local`
     - Password: `Ch@ngE33#!!!`
   - **⚠️ CHANGE THESE CREDENTIALS IMMEDIATELY!**

## Railway Deployment

### One-Click Deploy

[![Deploy on Railway](https://railway.app/button.svg)](https://railway.app/new)

### Manual Deployment

1. **Create a new Railway project**
   ```bash
   railway login
   railway init
   ```

2. **Add a MySQL database**
   - In Railway dashboard, click "New" → "Database" → "MySQL"
   - Railway will automatically set the `DATABASE_URL` environment variable

3. **Deploy the application**
   ```bash
   railway up
   ```

4. **Access your deployed app**
   - Railway will provide a public URL
   - Login with default credentials and change them immediately

### Environment Variables (Railway)

Railway automatically provides:
- `DATABASE_URL` - MySQL connection string (auto-set by Railway)
- `PORT` - Port number (auto-set by Railway)

**No manual environment variables needed!** JWT secrets are auto-generated on first run.

Optional (for Salesforce integration):
- `SALESFORCE_CLIENT_ID` - Your Salesforce Connected App Client ID
- `SALESFORCE_CLIENT_SECRET` - Your Salesforce Connected App Client Secret

## Database Schema

The application automatically creates these tables on first run:

- **users** - User accounts with roles and authentication
- **setupConfig** - System configuration (JWT secrets, etc.)
- **salesforceConfig** - Salesforce OAuth tokens and credentials
- **activityLog** - Audit trail of all user actions
- **submissions** - Contact submission history

## API Endpoints

### Authentication
- `POST /api/auth/login` - Login with email/password
- `POST /api/auth/register` - Register new user
- `POST /api/auth/logout` - Logout
- `GET /api/auth/me` - Get current user info
- `POST /api/auth/change-password` - Change password

### Salesforce
- `GET /api/salesforce/oauth/authorize` - Initiate Salesforce OAuth
- `GET /api/salesforce/oauth/callback` - OAuth callback handler
- `GET /api/salesforce/accounts` - Get Salesforce accounts
- `GET /api/salesforce/contacts?accountId=xxx` - Get contacts for account
- `POST /api/salesforce/contacts` - Create/update contact
- `GET /api/salesforce/status` - Check connection status

### Admin (Admin role required)
- `GET /api/admin/users` - List all users
- `PUT /api/admin/users/:id` - Update user
- `DELETE /api/admin/users/:id` - Delete user
- `POST /api/admin/users/:id/reset-password` - Reset user password
- `GET /api/admin/submissions` - View submission history

## Salesforce Setup

### Creating a Connected App

1. **Log in to Salesforce**
   - Go to Setup → App Manager → New Connected App

2. **Configure OAuth Settings**
   - Enable OAuth Settings: ✅
   - Callback URL: `https://your-app-url.railway.app/api/salesforce/oauth/callback`
   - Selected OAuth Scopes:
     - Full access (full)
     - Perform requests at any time (refresh_token, offline_access)

3. **Get Credentials**
   - Copy Consumer Key → Set as `SALESFORCE_CLIENT_ID`
   - Copy Consumer Secret → Set as `SALESFORCE_CLIENT_SECRET`

4. **Connect via UI**
   - Login to SF Connect admin dashboard
   - Click "Connect Salesforce"
   - Authorize the app

## Security Features

- ✅ **Auto-generated JWT secrets** - Stored securely in database
- ✅ **bcrypt password hashing** - 12 rounds, industry standard
- ✅ **Role-based access control** - Admin, Operator, Read-Only
- ✅ **Activity logging** - Complete audit trail
- ✅ **Token-based authentication** - 7-day expiration
- ✅ **SQL injection protection** - Drizzle ORM with parameterized queries
- ✅ **XSS protection** - React automatic escaping

## Default Credentials

**⚠️ SECURITY WARNING**

Default admin account created on first run:
- Email: `admin@sfconnect.local`
- Password: `Ch@ngE33#!!!`

**CHANGE THESE IMMEDIATELY AFTER FIRST LOGIN!**

## User Roles

- **Admin** - Full access to all features, user management, system config
- **Operator** - Can submit contacts, view companies, use add-in
- **Read-Only** - View-only access (future feature)

## Outlook Add-in Usage

### Submit Contact Tab
1. Fill in contact details (name, email, phone, title)
2. Select company from dropdown
3. Add optional notes
4. Click "Submit Contact"
5. Contact is created/updated in Salesforce

### Company Contacts Tab
1. Select a company from dropdown
2. Click "Search"
3. View top 3 contacts for that company
4. Click "Call" to initiate phone call

## Troubleshooting

### Database Connection Issues
- Verify `DATABASE_URL` is set correctly
- Check database is accessible from Railway
- Ensure database exists and user has permissions

### Salesforce OAuth Errors
- Verify callback URL matches exactly
- Check client ID and secret are correct
- Ensure Connected App is approved

### Build Errors on Railway
- Check Node.js version is 18+
- Verify all dependencies are in package.json
- Review Railway build logs for specific errors

## Development

### Project Structure
```
sf-connect/
├── client/               # React frontend
│   ├── src/
│   │   ├── pages/       # Page components
│   │   ├── components/  # Reusable UI components
│   │   └── App.tsx      # Main app component
├── server/              # Express backend
│   ├── routes/          # API route handlers
│   ├── _core/           # Core server setup
│   ├── auth.ts          # Authentication utilities
│   ├── middleware.ts    # Express middleware
│   └── db.ts            # Database queries
├── drizzle/             # Database schema
│   └── schema.ts        # Table definitions
├── Dockerfile           # Railway deployment
└── package.json         # Dependencies
```

### Running Tests
```bash
pnpm test
```

### Building for Production
```bash
pnpm build
```

### Database Migrations
```bash
# Generate migration
pnpm drizzle-kit generate

# Apply migration
pnpm drizzle-kit migrate

# Push schema changes directly
pnpm db:push
```

## License

MIT

## Support

For issues or questions:
1. Check this README
2. Review Railway deployment logs
3. Check Salesforce Connected App configuration
4. Open an issue on GitHub

---

**Built with ❤️ for seamless Salesforce-Outlook integration**
