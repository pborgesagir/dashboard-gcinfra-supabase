const { createClient } = require('@supabase/supabase-js')
require('dotenv').config({ path: '.env.local' })

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY

const supabase = createClient(supabaseUrl, supabaseServiceKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
})

async function checkConstraints() {
  console.log('🔍 Checking table constraints...\n')

  try {
    // Check maintenance_orders constraints
    console.log('📊 Maintenance Orders table:')
    const { data: maintData, error: maintError } = await supabase
      .from('maintenance_orders')
      .select('os')
      .limit(5)

    if (maintError) {
      console.error('❌ Error accessing maintenance_orders:', maintError.message)
    } else {
      console.log(`✅ Table accessible, ${maintData.length} sample records found`)
    }

    // Check building_orders constraints
    console.log('\n📊 Building Orders table:')
    const { data: buildData, error: buildError } = await supabase
      .from('building_orders')
      .select('os')
      .limit(5)

    if (buildError) {
      console.error('❌ Error accessing building_orders:', buildError.message)
    } else {
      console.log(`✅ Table accessible, ${buildData.length} sample records found`)
    }

    // Test a simple insert/upsert to see what constraints exist
    console.log('\n🧪 Testing upsert operations...')

    const testRecord = {
      os: 'TEST-001',
      empresa: 'TEST',
      equipamento: 'TEST Equipment',
      company_id: null
    }

    // Try maintenance_orders first
    console.log('Testing maintenance_orders upsert...')
    const { error: maintUpsertError } = await supabase
      .from('maintenance_orders')
      .upsert([testRecord], { onConflict: 'id' })

    if (maintUpsertError) {
      console.log('❌ Maintenance upsert failed:', maintUpsertError.message)
    } else {
      console.log('✅ Maintenance upsert worked with id conflict resolution')
    }

    // Try building_orders
    console.log('Testing building_orders upsert...')
    const { error: buildUpsertError } = await supabase
      .from('building_orders')
      .upsert([testRecord], { onConflict: 'id' })

    if (buildUpsertError) {
      console.log('❌ Building upsert failed:', buildUpsertError.message)
    } else {
      console.log('✅ Building upsert worked with id conflict resolution')
    }

    // Clean up test records
    await supabase.from('maintenance_orders').delete().eq('os', 'TEST-001')
    await supabase.from('building_orders').delete().eq('os', 'TEST-001')

  } catch (error) {
    console.error('❌ General error:', error.message)
  }
}

checkConstraints()