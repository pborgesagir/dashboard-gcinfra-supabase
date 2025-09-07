# Automatic Company Synchronization Guide

This document explains the automated company synchronization system that keeps the `companies` table in sync with data from the `building_orders` table.

## 🎯 Objective

The companies table is now automatically populated and synchronized based on data from the building_orders table. It serves as a **read-only, system-managed list** that administrators cannot manually modify.

## 📋 Key Features

### 1. **Single Source of Truth**
- The `building_orders` table is the authoritative source for company information
- Data flows from Neovero API → `building_orders` → `companies` (automatic sync)

### 2. **Automatic Synchronization**
- **Database Triggers**: Automatically create companies when new `building_orders` are inserted
- **ETL Integration**: Existing data extraction process continues to work seamlessly  
- **Manual Sync**: Available via SQL function for one-time synchronizations

### 3. **Read-Only Access**
- Administrators can **view** companies but **cannot** create, edit, or delete them
- Admin interface shows companies as "Auto-synced" with clear messaging
- Database-level Row Level Security (RLS) enforces read-only access

## 🔧 Technical Implementation

### Database Components

#### 1. **Automatic Sync Function** (`sync_companies_from_building_orders()`)
```sql
-- Automatically creates missing companies from building_orders data
SELECT sync_companies_from_building_orders();
```

#### 2. **Slug Generation Function** (`generate_company_slug()`)
- Creates URL-friendly slugs from company names
- Handles Portuguese characters (ã, ç, etc.)
- Ensures uniqueness with automatic numbering

#### 3. **Database Trigger**
- Fires on INSERT/UPDATE of `empresa` or `razaosocial` columns in `building_orders`
- Automatically calls the sync function to create missing companies

#### 4. **Manual Sync Function** (`manual_sync_companies()`)
```sql
-- Returns detailed results of synchronization
SELECT * FROM manual_sync_companies();
```

### Field Mapping

| building_orders | companies | Description |
|----------------|-----------|-------------|
| `razaosocial` | `name` | Official company name |
| `empresa` | *(used for mapping)* | Used to identify unique companies |
| *(auto-generated)* | `slug` | URL-friendly identifier |

### Example Data Flow

```
building_orders:
├── empresa: "HUGOL"
├── razaosocial: "Hospital Geral de Goiânia Ltda"

    ↓ (automatic trigger)

companies:
├── name: "Hospital Geral de Goiânia Ltda"
├── slug: "hospital-geral-de-goiania-ltda"
├── is_active: true
```

## 🚀 Usage Instructions

### For Database Administrators

#### Initial Setup
1. Run the schema files in order:
   ```bash
   # 1. Basic schema (if not already applied)
   psql -f database/schema.sql
   
   # 2. Apply automatic sync functions and triggers
   psql -f database/automatic_company_sync.sql
   
   # 3. Update RLS policies
   psql -f database/rls_policies.sql
   ```

#### Manual Synchronization
```sql
-- Sync all companies from building_orders
SELECT sync_companies_from_building_orders();

-- Get detailed sync results
SELECT * FROM manual_sync_companies();
```

### For Application Developers

#### Read-Only Access
```typescript
// ✅ Allowed: Read companies
const { data: companies } = await supabase
  .from('companies')
  .select('*');

// ❌ Not allowed: Create/Update/Delete companies
// These operations will fail due to RLS policies
```

#### Admin Interface Changes
- Company management interface now shows read-only data
- No create/edit/delete buttons for companies
- Clear messaging about automatic synchronization

### For System Operators

#### ETL Process
The existing ETL process (`data_extraction_multitenant.py`) continues to work:
- Companies are automatically created during building data extraction
- No changes needed to existing data pipeline
- Synchronization happens at both ETL and database levels

#### Monitoring
```sql
-- Check sync status
SELECT 
    COUNT(*) as total_companies,
    COUNT(CASE WHEN created_at > NOW() - INTERVAL '1 day' THEN 1 END) as recent_companies
FROM companies;

-- View recent company creations
SELECT name, slug, created_at 
FROM companies 
ORDER BY created_at DESC 
LIMIT 10;
```

## 🧪 Testing

### Automated Test
Run the provided test script:
```bash
npm install @supabase/supabase-js dotenv
node test_company_sync.js
```

### Manual Testing
1. **Test Trigger**: Insert a building_order with new company data
2. **Verify Creation**: Check that company appears in companies table
3. **Test Read-Only**: Try to modify companies table (should fail)
4. **Test Admin UI**: Verify interface shows read-only state

## 📁 File Structure

```
healthcare-saas/
├── database/
│   ├── automatic_company_sync.sql    # New: Sync functions & triggers
│   ├── rls_policies.sql             # Updated: Read-only policies
│   └── schema.sql                   # Existing schema
├── src/components/admin/
│   └── CompanyManagement.tsx        # Updated: Read-only interface
├── test_company_sync.js             # New: Test script
├── COMPANY_SYNC_GUIDE.md           # This document
└── data_extraction_multitenant.py  # Existing: ETL process
```

## 🔍 Troubleshooting

### Common Issues

#### 1. **Companies Not Syncing**
```sql
-- Check if trigger exists
SELECT * FROM pg_trigger WHERE tgname = 'auto_sync_companies_trigger';

-- Manual sync
SELECT sync_companies_from_building_orders();
```

#### 2. **Duplicate Slugs**
```sql
-- Check for duplicate slugs
SELECT slug, COUNT(*) FROM companies GROUP BY slug HAVING COUNT(*) > 1;

-- The system should prevent this, but if it occurs:
UPDATE companies SET slug = slug || '-' || id WHERE slug IN (
  SELECT slug FROM companies GROUP BY slug HAVING COUNT(*) > 1
);
```

#### 3. **RLS Issues**
```sql
-- Check RLS policies
SELECT * FROM pg_policies WHERE tablename = 'companies';

-- Ensure policies are applied correctly
```

### Performance Monitoring

```sql
-- Monitor trigger performance
SELECT schemaname, tablename, n_tup_ins, n_tup_upd 
FROM pg_stat_user_tables 
WHERE tablename IN ('companies', 'building_orders');
```

## 🛡️ Security Considerations

1. **Data Integrity**: Only building_orders can create companies
2. **Access Control**: RLS prevents unauthorized modifications  
3. **Audit Trail**: All companies have creation timestamps
4. **Validation**: Slug generation handles special characters safely

## 🔄 Migration Notes

### From Manual to Automatic
If migrating from manual company management:

1. **Backup existing companies**: Export current companies table
2. **Apply new schema**: Run automatic_company_sync.sql
3. **Sync existing data**: Run initial synchronization
4. **Update applications**: Deploy read-only admin interface
5. **Test thoroughly**: Verify automatic sync works

### Rollback Plan
If needed to revert to manual management:
1. Drop the trigger: `DROP TRIGGER auto_sync_companies_trigger ON building_orders;`
2. Restore old RLS policies for companies table
3. Redeploy previous admin interface version

---

**📞 Support**: For issues with the automatic synchronization system, check the database logs and run the test script to identify problems.