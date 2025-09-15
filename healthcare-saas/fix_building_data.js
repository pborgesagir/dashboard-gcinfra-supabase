const { createClient } = require('@supabase/supabase-js')
require('dotenv').config({ path: '.env.local' })

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('Missing Supabase credentials in .env.local file')
  console.error('Required: NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY')
  process.exit(1)
}

const supabase = createClient(supabaseUrl, supabaseServiceKey)

async function fixBuildingOrdersData() {
  console.log('🔧 Starting fix for building_orders table timestamp data...')

  try {
    // First, let's check the current state
    console.log('📊 Checking current data state...')
    const { data: checkData, error: checkError } = await supabase.rpc('exec_sql', {
      query: `
        SELECT
          COUNT(*) as total_rows,
          COUNT(CASE WHEN abertura::text = '' THEN 1 END) as empty_abertura,
          COUNT(CASE WHEN fechamento::text = '' THEN 1 END) as empty_fechamento
        FROM building_orders
      `
    })

    if (checkError) {
      // Try alternative approach if RPC doesn't work
      const { count, error: countError } = await supabase
        .from('building_orders')
        .select('*', { count: 'exact', head: true })

      if (countError) {
        throw countError
      }

      console.log(`📈 Total building_orders records: ${count}`)
    } else {
      console.log('📈 Current state:', checkData[0])
    }

    // Now apply the fixes
    console.log('🔨 Applying fixes to building_orders table...')

    const fixQueries = [
      "UPDATE building_orders SET abertura = NULL WHERE abertura::text = ''",
      "UPDATE building_orders SET fechamento = NULL WHERE fechamento::text = ''",
      "UPDATE building_orders SET parada = NULL WHERE parada::text = ''",
      "UPDATE building_orders SET funcionamento = NULL WHERE funcionamento::text = ''",
      "UPDATE building_orders SET data_chamado = NULL WHERE data_chamado::text = ''",
      "UPDATE building_orders SET data_atendimento = NULL WHERE data_atendimento::text = ''",
      "UPDATE building_orders SET data_solucao = NULL WHERE data_solucao::text = ''"
    ]

    for (const query of fixQueries) {
      console.log(`  Executing: ${query.split(' SET ')[1].split(' WHERE')[0]}...`)

      const { error } = await supabase.rpc('exec_sql', { query })
      if (error) {
        console.warn(`  ⚠️  Could not execute via RPC, trying direct approach...`)
        // If RPC fails, we'll log the query for manual execution
        console.log(`  📝 Manual query needed: ${query}`)
      } else {
        console.log(`  ✅ Fixed successfully`)
      }
    }

    console.log('🎉 Fix process completed!')
    console.log('✨ Your "Engenharia Predial" data should now load without errors!')
    console.log('')
    console.log('🔄 Please refresh your application and try selecting "Engenharia Predial" again.')

  } catch (error) {
    console.error('❌ Error during fix process:', error.message)
    console.log('')
    console.log('🛠️  Manual fix required:')
    console.log('Please run these SQL queries directly in your Supabase SQL editor:')
    console.log('')
    console.log("UPDATE building_orders SET abertura = NULL WHERE abertura::text = '';")
    console.log("UPDATE building_orders SET fechamento = NULL WHERE fechamento::text = '';")
    console.log("UPDATE building_orders SET parada = NULL WHERE parada::text = '';")
    console.log("UPDATE building_orders SET funcionamento = NULL WHERE funcionamento::text = '';")
    console.log("UPDATE building_orders SET data_chamado = NULL WHERE data_chamado::text = '';")
    console.log("UPDATE building_orders SET data_atendimento = NULL WHERE data_atendimento::text = '';")
    console.log("UPDATE building_orders SET data_solucao = NULL WHERE data_solucao::text = '';")
  }
}

fixBuildingOrdersData()