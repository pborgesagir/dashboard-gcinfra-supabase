# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

This is a professional multi-tenant SaaS platform called **GCINFRA 360º** built with React/Next.js for managing and analyzing hospital infrastructure maintenance data. The platform provides role-based access control, real-time dashboards, and comprehensive analytics for healthcare organizations.

## Architecture

The application follows a modern full-stack architecture:

1. **Frontend**: React/Next.js application with TypeScript, Material-UI, and Tailwind CSS
2. **Backend**: Next.js API routes for server-side operations
3. **Database**: Supabase with row-level security for multi-tenant data isolation
4. **Authentication**: Supabase Auth with role-based access control
5. **Data Processing**: Python scripts for ETL operations and data extraction

### Key Components

- **Multi-tenant Architecture**: Complete data isolation between healthcare organizations
- **Role-Based Access Control**: Admin and Manager roles with appropriate permissions
- **Real-time Dashboards**: Interactive visualizations using Recharts and Material-UI components
- **External API Integration**: Python scripts for data extraction from Neovero maintenance system
- **Authentication System**: Secure login with user profiles and company associations
- **Responsive Design**: Mobile-first approach with dark/light theme support

## Development Commands

### Running the Application

```bash
npm run dev
```

### Building for Production

```bash
npm run build
npm run start
```

### Linting

```bash
npm run lint
```

### Install Dependencies

```bash
npm install
```

### Data Extraction (Python)

```bash
python data_extraction_multitenant.py
```

## Configuration

The application requires environment variables:

### Next.js Environment Variables (.env.local)
- `NEXT_PUBLIC_SUPABASE_URL`: Supabase project URL
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`: Supabase anonymous key
- `SUPABASE_SERVICE_ROLE_KEY`: Supabase service role key (server-side only)
- `RESEND_API_KEY`: Email service API key for invitations

### Python Scripts Environment Variables (.env)
- `SUPABASE_URL`: Supabase project URL
- `SUPABASE_KEY`: Supabase API key
- `API_TOKEN`: External API authentication token
- `API_USER`: External API username

## Project Structure

```
src/
├── app/                    # Next.js app directory
│   ├── api/               # API routes
│   ├── auth/              # Authentication pages
│   ├── admin/             # Admin dashboard pages
│   ├── dashboard/         # User dashboard page
│   └── layout.tsx         # Root layout
├── components/            # React components
│   ├── admin/            # Admin-specific components
│   ├── auth/             # Authentication components
│   ├── dashboard/        # Dashboard charts and widgets
│   ├── layout/           # Layout components
│   └── ui/               # UI components
├── contexts/             # React contexts
│   ├── AuthContext.tsx   # Authentication state
│   └── DataContext.tsx   # Data management
└── lib/                  # Utilities
    └── supabase/         # Supabase client and types
```

## Key Technologies

- **Frontend**: Next.js 15, React 19, TypeScript
- **Styling**: Material-UI (MUI), Tailwind CSS
- **Charts**: Recharts, React-Plotly.js
- **Database**: Supabase (PostgreSQL)
- **Authentication**: Supabase Auth
- **Email**: Resend for invitation system
- **Data Processing**: Python with Supabase client

## User Roles and Access

- **Admin**: Full access to all companies, user management, and system analytics
- **Manager**: Access to their company's data and dashboards

## Data Structure

The application manages maintenance data including:

- Work orders (OS) with priorities, complexity levels, and timestamps
- Equipment information with serial numbers, models, and locations
- Multi-tenant company data with complete isolation
- User profiles with role-based permissions
- Maintenance metrics like MTTR, MTBF, and availability calculations
- Cost tracking for parts, labor, and external services

## Language

The users of this application are Brazilian, so all UI elements must be displayed in Brazilian Portuguese. This includes sidebar navigation, column names, buttons, labels, and all user-facing text.

# important-instruction-reminders
Do what has been asked; nothing more, nothing less.
NEVER create files unless they're absolutely necessary for achieving your goal.
ALWAYS prefer editing an existing file to creating a new one.
NEVER proactively create documentation files (*.md) or README files. Only create documentation files if explicitly requested by the User.