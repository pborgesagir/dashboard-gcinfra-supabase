# Healthcare Infrastructure SaaS Platform

A professional, multi-tenant SaaS platform for managing and analyzing hospital infrastructure data. This project represents an evolution from a Streamlit prototype to a production-ready web application with enhanced security, user management, and a refined interface.

## 🏥 Overview

The Healthcare Infrastructure SaaS centralizes and visualizes Work Orders (WO) for the maintenance of hospital equipment across multiple healthcare organizations. The platform provides role-based access control, comprehensive analytics, and multi-tenant data isolation.

## 🚀 Features

### Core Functionality
- **Multi-Tenant Architecture**: Complete data isolation between organizations
- **Role-Based Access Control**: Admin and Manager roles with appropriate permissions
- **Real-Time Dashboards**: Interactive visualizations of maintenance data
- **Advanced Analytics**: KPIs, trends, heatmaps, and performance metrics

### Technical Features
- **Modern Tech Stack**: Next.js 14, TypeScript, Material-UI
- **Secure Authentication**: Supabase Auth with row-level security
- **Responsive Design**: Mobile-first approach with Tailwind CSS
- **Data Visualization**: Advanced charts and heatmaps using Recharts
- **ETL Pipeline**: Automated data extraction from external APIs

## 🏗️ Architecture

### Frontend
- **Framework**: Next.js 14 with App Router
- **Language**: TypeScript
- **Styling**: Tailwind CSS + Material-UI (MUI)
- **Charts**: Recharts library
- **State Management**: React Context API

### Backend
- **Database**: Supabase (PostgreSQL)
- **Authentication**: Supabase Auth
- **API**: Next.js API routes
- **Security**: Row Level Security (RLS) policies

### Data Layer
- **ETL Process**: Python scripts for data extraction
- **Data Sources**: External maintenance system APIs
- **Storage**: Multi-tenant PostgreSQL database

## 🔐 Security & Multi-Tenancy

### Row Level Security (RLS)
- Database-level data isolation
- Automatic filtering based on user's company
- Prevents data leakage between tenants

### Role-Based Access Control
- **Admin**: Global access to all data and user management
- **Manager**: Company-specific access to assigned organization data

## 📊 Dashboard Features

### Key Performance Indicators (KPIs)
- Total maintenance orders
- Open orders tracking
- Average resolution time
- Total maintenance costs
- MTTR (Mean Time to Repair)
- MTBF (Mean Time Between Failures)

### Visualizations
- Time series analysis
- Status distribution charts
- Activity heatmaps by day/hour
- Equipment performance metrics
- Priority and cost breakdowns

## 🛠️ Development Setup

### Prerequisites
- Node.js 18+
- Python 3.8+
- Supabase account
- External API credentials

### Frontend Setup

```bash
cd healthcare-saas
npm install
```

### Environment Configuration

Create `.env.local` file:

```env
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key
NEXTAUTH_URL=http://localhost:3000
NEXTAUTH_SECRET=your_nextauth_secret

# ETL Configuration
API_TOKEN=your_external_api_token
API_USER=your_external_api_user
```

### Database Setup

1. **Create Supabase Project**
2. **Run Database Schema**:
   ```sql
   -- Execute files in order:
   -- 1. database/schema.sql
   -- 2. database/rls_policies.sql
   -- 3. database/seed_data.sql (optional)
   ```

### Running the Application

```bash
npm run dev
```

Access the application at `http://localhost:3000`

### Data Extraction Setup

```bash
cd ..
pip install -r requirements.txt

# For multi-tenant extraction
python data_extraction_multitenant.py
```

## 🚀 Deployment

### Vercel Deployment (Recommended)

1. **Connect Repository**: Link your Git repository to Vercel
2. **Configure Environment Variables**: Set all required environment variables
3. **Deploy**: Vercel automatically builds and deploys

### Environment Variables for Production

```env
NEXT_PUBLIC_SUPABASE_URL=your_production_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_production_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_production_service_key
```

## 👥 User Management

### Admin Functions
- Create and manage companies
- Invite users via email
- Assign roles and company associations
- View global analytics across all organizations

### Manager Functions
- View company-specific dashboards
- Access filtered maintenance data
- Generate reports for assigned organization

## 📈 Data Flow

```
External APIs → ETL Script → Supabase Database → Next.js Frontend
                     ↓
              Company Mapping & RLS Filtering
                     ↓
              Role-Based Dashboard Views
```

## 🔧 Configuration

### Company Mapping
The ETL process automatically maps external company names to internal company IDs:

```python
# Automatic company creation and mapping
company_mapping = {
    "External Company Name": "internal_company_uuid",
    # ...
}
```

### RLS Policies
Database policies ensure data isolation:

```sql
-- Managers only see their company's data
CREATE POLICY "company_isolation" ON maintenance_orders
FOR SELECT USING (company_id = auth.get_user_company_id());
```

## 📚 Documentation

### Project Structure
```
healthcare-saas/
├── src/
│   ├── app/                    # Next.js app router pages
│   ├── components/             # React components
│   │   ├── admin/             # Admin-specific components
│   │   ├── auth/              # Authentication components
│   │   ├── dashboard/         # Dashboard components
│   │   └── layout/            # Layout components
│   ├── contexts/              # React contexts
│   └── lib/                   # Utilities and configurations
├── database/                  # Database schema and policies
├── data_extraction_multitenant.py  # ETL script
└── public/                    # Static assets
```

### Key Components
- `AuthContext`: Authentication and user state management
- `DashboardContent`: Main dashboard with analytics
- `UserManagement`: Admin panel for user operations
- `CompanyManagement`: Company CRUD operations

## 🔄 Migration from Streamlit

This project represents a complete migration from the original Streamlit prototype:

### Original Architecture
- Single-tenant Streamlit application
- Basic authentication
- Limited scalability

### New Architecture
- Multi-tenant Next.js application
- Enterprise-grade security
- Scalable cloud deployment
- Professional UI/UX

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Implement changes with proper typing
4. Add tests if applicable
5. Submit a pull request

## 📄 License

This project is licensed under the MIT License - see the LICENSE file for details.

## 🆘 Support

For support, please contact the development team or create an issue in the repository.

---

**Healthcare Infrastructure SaaS Platform** - Transforming healthcare maintenance management through modern technology.
