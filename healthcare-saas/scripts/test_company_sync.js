// Test script for automatic company synchronization
// This script tests the automatic company synchronization functionality
// Run with: node test_company_sync.js

const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('Missing required environment variables');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
});

async function testCompanySynchronization() {
  console.log('🧪 Testing Automatic Company Synchronization System\n');

  try {
    // Step 1: Get initial company count
    console.log('📊 Step 1: Getting initial company count...');
    const { data: initialCompanies, error: initialError } = await supabase
      .from('companies')
      .select('*');
    
    if (initialError) throw initialError;
    console.log(`   Initial companies: ${initialCompanies.length}\n`);

    // Step 2: Test manual synchronization function
    console.log('🔄 Step 2: Testing manual synchronization function...');
    const { data: syncResults, error: syncError } = await supabase
      .rpc('manual_sync_companies');
    
    if (syncError) throw syncError;
    
    console.log('   Synchronization results:');
    syncResults.forEach((result, index) => {
      console.log(`   ${index + 1}. Action: ${result.action}`);
      if (result.company_name && result.company_slug) {
        console.log(`      Company: ${result.company_name}`);
        console.log(`      Slug: ${result.company_slug}`);
      } else {
        console.log(`      Message: ${result.company_name}`);
      }
    });
    console.log('');

    // Step 3: Get updated company count
    console.log('📊 Step 3: Getting updated company count...');
    const { data: updatedCompanies, error: updatedError } = await supabase
      .from('companies')
      .select('*')
      .order('created_at', { ascending: false });
    
    if (updatedError) throw updatedError;
    console.log(`   Updated companies: ${updatedCompanies.length}\n`);

    // Step 4: Display all companies with their sources
    console.log('📋 Step 4: Current companies in the system:');
    console.log('   %-40s %-25s %-12s', 'Company Name', 'Slug', 'Created');
    console.log('   ' + '-'.repeat(80));
    
    updatedCompanies.forEach((company, index) => {
      const createdDate = new Date(company.created_at).toLocaleDateString();
      console.log(`   %-40s %-25s %-12s`, 
        company.name?.substring(0, 38) || 'N/A',
        company.slug?.substring(0, 23) || 'N/A',
        createdDate
      );
    });
    console.log('');

    // Step 5: Test that building_orders trigger is working
    console.log('🏗️  Step 5: Checking building_orders data source...');
    const { data: buildingOrdersCompanies, error: buildingError } = await supabase
      .from('building_orders')
      .select('empresa, razaosocial')
      .not('empresa', 'is', null)
      .not('razaosocial', 'is', null);
    
    if (buildingError) throw buildingError;

    // Get unique companies from building_orders
    const uniqueBuildingCompanies = buildingOrdersCompanies
      .reduce((acc, order) => {
        const key = `${order.empresa}|${order.razaosocial}`;
        if (!acc.some(item => `${item.empresa}|${item.razaosocial}` === key)) {
          acc.push(order);
        }
        return acc;
      }, []);

    console.log(`   Unique companies in building_orders: ${uniqueBuildingCompanies.length}`);
    console.log(`   Companies in companies table: ${updatedCompanies.length}`);
    
    // Check if all companies from building_orders exist in companies table
    const missingCompanies = uniqueBuildingCompanies.filter(buildingCompany =>
      !updatedCompanies.some(company => company.name === buildingCompany.razaosocial)
    );

    if (missingCompanies.length > 0) {
      console.log(`   ⚠️  Found ${missingCompanies.length} companies that should be synchronized:`);
      missingCompanies.forEach((missing, index) => {
        console.log(`      ${index + 1}. ${missing.razaosocial} (from: ${missing.empresa})`);
      });
    } else {
      console.log(`   ✅ All companies from building_orders are properly synchronized!`);
    }
    console.log('');

    // Step 6: Test insert trigger by simulating a building_order insert
    console.log('🔧 Step 6: Testing automatic trigger on new building_order...');
    
    // Create a test building order with a new company
    const testCompanyEmpresa = `TEST_COMPANY_${Date.now()}`;
    const testCompanyRazao = `Test Company Ltda ${Date.now()}`;
    
    // Insert test building order
    const { data: insertResult, error: insertError } = await supabase
      .from('building_orders')
      .insert({
        empresa: testCompanyEmpresa,
        razaosocial: testCompanyRazao,
        os: `TEST_OS_${Date.now()}`,
        abertura: new Date().toISOString()
      })
      .select();
    
    if (insertError) throw insertError;
    
    console.log(`   ✅ Inserted test building order with company: ${testCompanyRazao}`);
    
    // Check if company was automatically created
    const { data: newCompany, error: companyCheckError } = await supabase
      .from('companies')
      .select('*')
      .eq('name', testCompanyRazao);
    
    if (companyCheckError) throw companyCheckError;
    
    if (newCompany && newCompany.length > 0) {
      console.log(`   ✅ Company automatically created via trigger!`);
      console.log(`      Name: ${newCompany[0].name}`);
      console.log(`      Slug: ${newCompany[0].slug}`);
      
      // Clean up test data
      await supabase.from('building_orders').delete().eq('id', insertResult[0].id);
      await supabase.from('companies').delete().eq('id', newCompany[0].id);
      console.log(`   🧹 Test data cleaned up`);
    } else {
      console.log(`   ❌ Company was NOT automatically created via trigger!`);
    }
    
    console.log('\n✅ Company synchronization test completed successfully!');

  } catch (error) {
    console.error('❌ Test failed:', error.message);
    process.exit(1);
  }
}

// Run the test
testCompanySynchronization();