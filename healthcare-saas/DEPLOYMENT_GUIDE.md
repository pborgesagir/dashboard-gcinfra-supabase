# Healthcare Infrastructure SaaS - Deployment Guide

This guide provides step-by-step instructions for deploying the Healthcare Infrastructure SaaS platform to production.

## 📋 Pre-Deployment Checklist

### Required Accounts & Services

- [ ] Supabase account and project
- [ ] Vercel account
- [ ] GitHub repository (optional but recommended)
- [ ] External API credentials for data extraction

### Environment Setup

- [ ] Node.js 18+ installed locally
- [ ] Git configured
- [ ] Environment variables prepared

## 🗄️ Database Setup (Supabase)

### 1. Create Supabase Project

1. Go to [supabase.com](https://supabase.com)
2. Create a new project
3. Note down your project URL and API keys
4. Wait for the project to be fully provisioned

### 2. Set Up Database Schema

Execute the SQL files in the following order in your Supabase SQL editor:

```sql
-- Execute: database/schema.sql
-- This creates:
-- - User roles enum
-- - Companies table
-- - Users table
-- - User invitations table
-- - Updates existing maintenance_orders and building_orders tables
```

#### Step 2: Enable Row Level Security

```sql
-- Execute: database/rls_policies.sql
-- This creates:
-- - RLS policies for all tables
-- - Helper functions for user context
-- - Multi-tenant data isolation
```

#### Step 3: Add Sample Data (Optional)

```sql
-- Execute: database/seed_data.sql
-- This creates:
-- - Sample companies
-- - Sample admin and manager users
-- - Example data mapping
```

### 3. Configure Authentication

1. Go to **Authentication → Settings**
2. Configure email templates (optional)
3. Set up any additional auth providers if needed
4. Update site URL to your production domain

### 4. Set Up Storage (Optional)

If you plan to store files:

1. Go to **Storage**
2. Create necessary buckets
3. Set up storage policies

## 🚀 Frontend Deployment (Vercel)

### 1. Prepare Repository

```bash
# Clone your repository or initialize a new one
git init
git add .
git commit -m "Initial commit"

# Push to GitHub (recommended)
git remote add origin <your-repo-url>
git push -u origin main
```

### 2. Deploy to Vercel

#### Option A: GitHub Integration (Recommended)

1. Go to [vercel.com](https://vercel.com)
2. Click "New Project"
3. Import your GitHub repository
4. Vercel will auto-detect Next.js settings
5. Configure environment variables (see below)
6. Deploy

#### Option B: Vercel CLI

```bash
npm install -g vercel
cd healthcare-saas
vercel
```

### 3. Configure Environment Variables

In Vercel dashboard, add these environment variables:

#### Required Variables

```
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key
NEXTAUTH_URL=https://your-domain.vercel.app
NEXTAUTH_SECRET=your-random-secret-key
```

#### Optional Variables (for ETL)

```
API_TOKEN=your-external-api-token
API_USER=your-external-api-user
AGIR_API_TOKEN=your-building-api-token
AGIR_API_USER=your-building-api-user
AGIR_API_EMAIL=your-building-api-email
```

### 4. Custom Domain (Optional)

1. Go to your Vercel project settings
2. Navigate to "Domains"
3. Add your custom domain
4. Configure DNS records as instructed
5. Update `NEXTAUTH_URL` to your custom domain

## 🔧 Post-Deployment Configuration

### 1. Create Initial Admin User

Since the app uses Supabase Auth, you'll need to:

1. Create the first user through Supabase Auth Dashboard:

   - Go to **Authentication → Users**
   - Click "Invite a user"
   - Enter admin email

2. Update the user's role in the database:
   ```sql
   -- Replace 'admin@yourcompany.com' with actual email
   INSERT INTO users (id, email, role, company_id)
   VALUES (
     '<user-id-from-auth>',
     'admin@yourcompany.com',
     'admin',
     NULL
   );
   ```

### 2. Set Up Companies

Use the admin panel to:

1. Create your first companies
2. Set up the company mapping for data extraction

### 3. Configure Data Extraction Pipeline

#### Option A: Manual Data Extraction

1. Set up a server/VM with Python 3.8+
2. Install dependencies:
   ```bash
   pip install requests pandas python-dotenv supabase numpy
   ```
3. Copy `data_extraction_multitenant.py` to your server
4. Create `.env` file with API credentials
5. Run the script:
   ```bash
   python data_extraction_multitenant.py
   ```

#### Option B: Automated ETL (GitHub Actions)

Create `.github/workflows/etl.yml`:

```yaml
name: ETL Data Extraction

on:
  schedule:
    - cron: "25 17 * * *" # Daily at 17:25 UTC
  workflow_dispatch:

jobs:
  extract-data:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3

      - name: Set up Python
        uses: actions/setup-python@v4
        with:
          python-version: "3.9"

      - name: Install dependencies
        run: |
          pip install requests pandas python-dotenv supabase numpy

      - name: Run data extraction
        env:
          SUPABASE_URL: ${{ secrets.SUPABASE_URL }}
          SUPABASE_KEY: ${{ secrets.SUPABASE_SERVICE_KEY }}
          API_TOKEN: ${{ secrets.API_TOKEN }}
          API_USER: ${{ secrets.API_USER }}
        run: python data_extraction_multitenant.py
```

Add the required secrets to your GitHub repository.

## 🔍 Monitoring & Maintenance

### 1. Monitor Application Performance

- Use Vercel Analytics for frontend performance
- Monitor Supabase dashboard for database performance
- Set up error tracking (optional: Sentry integration)

### 2. Database Maintenance

- Monitor table sizes and query performance
- Set up automated backups in Supabase
- Regularly review RLS policies

### 3. User Management

- Monitor user invitations and activations
- Regularly review company and user associations
- Clean up expired invitations

## 🚨 Troubleshooting

### Common Issues

#### Authentication Problems

```
Error: Invalid JWT
```

**Solution**: Check that `NEXTAUTH_URL` matches your domain exactly.

#### Database Connection Issues

```
Error: Failed to connect to Supabase
```

**Solution**: Verify Supabase URL and API keys are correct.

#### RLS Policy Errors

```
Error: Row level security policy violated
```

**Solution**: Check user roles and company associations in the database.

#### Build Failures

```
Error: Module not found
```

**Solution**: Ensure all dependencies are installed. Run `npm install`.

### Performance Issues

#### Slow Dashboard Loading

1. Check Supabase query performance
2. Review database indexes
3. Optimize data fetching logic
4. Consider pagination for large datasets

#### High Memory Usage

1. Review image optimizations
2. Check for memory leaks in React components
3. Optimize bundle size

## 📊 Scaling Considerations

### Database Scaling

- Monitor connection pools in Supabase
- Consider read replicas for analytics queries
- Implement query optimization for large datasets

### Application Scaling

- Vercel automatically handles scaling
- Consider Vercel Pro for advanced features
- Monitor function execution times

### ETL Scaling

- Implement batch processing for large data volumes
- Add retry mechanisms for API failures
- Consider parallel processing for multiple companies

## 🔒 Security Checklist

- [ ] All environment variables are properly configured
- [ ] RLS policies are active and tested
- [ ] User roles are properly assigned
- [ ] API keys have appropriate permissions
- [ ] HTTPS is enabled (automatic with Vercel)
- [ ] Database backups are configured
- [ ] Error logs don't expose sensitive information

## 📈 Monitoring Setup

### Key Metrics to Monitor

1. **Application Performance**

   - Page load times
   - API response times
   - Error rates

2. **Database Performance**

   - Query execution times
   - Connection pool usage
   - Storage usage

3. **Business Metrics**
   - User activity
   - Company data volume
   - ETL success rates

### Alerting

Set up alerts for:

- Application downtime
- Database performance issues
- ETL failures
- High error rates

## 🎯 Go-Live Checklist

Final checklist before going live:

- [ ] All environment variables configured
- [ ] Database schema deployed
- [ ] RLS policies active
- [ ] Initial admin user created
- [ ] Companies set up
- [ ] ETL pipeline tested
- [ ] Custom domain configured (if applicable)
- [ ] Monitoring enabled
- [ ] Backup systems in place
- [ ] Documentation updated
- [ ] Team trained on admin functions

---

## 🆘 Support

For deployment issues:

1. Check the troubleshooting section above
2. Review Vercel deployment logs
3. Check Supabase logs and metrics
4. Contact the development team

**Congratulations! Your Healthcare Infrastructure SaaS platform is now live! 🎉**
