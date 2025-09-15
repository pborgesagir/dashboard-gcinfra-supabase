const { createClient } = require('@supabase/supabase-js')
require('dotenv').config({ path: '.env.local' })

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ Missing Supabase credentials in .env.local file')
  console.error('Required: NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY')
  process.exit(1)
}

const supabase = createClient(supabaseUrl, supabaseServiceKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
})

async function executeSQL(query, description) {
  console.log(`🔧 ${description}...`)
  try {
    const { data, error } = await supabase.rpc('exec', { sql: query })
    if (error) {
      console.error(`❌ Error: ${error.message}`)
      return false
    }
    console.log(`✅ ${description} - Success`)
    return true
  } catch (err) {
    console.error(`❌ ${description} - Exception:`, err.message)
    return false
  }
}

async function fixDatabase() {
  console.log('🚀 Starting database fix for timestamp columns...\n')

  const queries = [
    // Fix maintenance_orders table
    {
      sql: "UPDATE maintenance_orders SET abertura = NULL WHERE abertura::text = '';",
      desc: "Fixing maintenance_orders abertura column"
    },
    {
      sql: "UPDATE maintenance_orders SET fechamento = NULL WHERE fechamento::text = '';",
      desc: "Fixing maintenance_orders fechamento column"
    },
    {
      sql: "UPDATE maintenance_orders SET parada = NULL WHERE parada::text = '';",
      desc: "Fixing maintenance_orders parada column"
    },
    {
      sql: "UPDATE maintenance_orders SET funcionamento = NULL WHERE funcionamento::text = '';",
      desc: "Fixing maintenance_orders funcionamento column"
    },
    {
      sql: "UPDATE maintenance_orders SET data_chamado = NULL WHERE data_chamado::text = '';",
      desc: "Fixing maintenance_orders data_chamado column"
    },
    {
      sql: "UPDATE maintenance_orders SET data_atendimento = NULL WHERE data_atendimento::text = '';",
      desc: "Fixing maintenance_orders data_atendimento column"
    },
    {
      sql: "UPDATE maintenance_orders SET data_solucao = NULL WHERE data_solucao::text = '';",
      desc: "Fixing maintenance_orders data_solucao column"
    },

    // Fix building_orders table
    {
      sql: "UPDATE building_orders SET abertura = NULL WHERE abertura::text = '';",
      desc: "Fixing building_orders abertura column"
    },
    {
      sql: "UPDATE building_orders SET fechamento = NULL WHERE fechamento::text = '';",
      desc: "Fixing building_orders fechamento column"
    },
    {
      sql: "UPDATE building_orders SET parada = NULL WHERE parada::text = '';",
      desc: "Fixing building_orders parada column"
    },
    {
      sql: "UPDATE building_orders SET funcionamento = NULL WHERE funcionamento::text = '';",
      desc: "Fixing building_orders funcionamento column"
    },
    {
      sql: "UPDATE building_orders SET data_chamado = NULL WHERE data_chamado::text = '';",
      desc: "Fixing building_orders data_chamado column"
    },
    {
      sql: "UPDATE building_orders SET data_atendimento = NULL WHERE data_atendimento::text = '';",
      desc: "Fixing building_orders data_atendimento column"
    },
    {
      sql: "UPDATE building_orders SET data_solucao = NULL WHERE data_solucao::text = '';",
      desc: "Fixing building_orders data_solucao column"
    }
  ]

  let successCount = 0
  let failedQueries = []

  for (const query of queries) {
    const success = await executeSQL(query.sql, query.desc)
    if (success) {
      successCount++
    } else {
      failedQueries.push(query)
    }
  }

  console.log(`\n📊 Summary:`)
  console.log(`✅ Successful: ${successCount}/${queries.length}`)

  if (failedQueries.length > 0) {
    console.log(`❌ Failed: ${failedQueries.length}`)
    console.log('\n🛠️  Manual execution required for failed queries:')
    console.log('Copy and paste these into your Supabase SQL Editor:\n')

    failedQueries.forEach(query => {
      console.log(query.sql)
    })

    console.log('\n📝 Instructions:')
    console.log('1. Go to your Supabase Dashboard')
    console.log('2. Navigate to SQL Editor')
    console.log('3. Paste and run each query above')
  } else {
    console.log('\n🎉 All fixes applied successfully!')
    console.log('✨ Your application should now work with "Engenharia Predial" data!')
    console.log('🔄 Please refresh your browser and try again.')
  }
}

// Test connection first
async function testConnection() {
  console.log('🔍 Testing Supabase connection...')
  try {
    const { data, error } = await supabase
      .from('building_orders')
      .select('id')
      .limit(1)

    if (error) {
      console.error('❌ Connection test failed:', error.message)
      return false
    }

    console.log('✅ Connection successful!')
    return true
  } catch (err) {
    console.error('❌ Connection test exception:', err.message)
    return false
  }
}

async function main() {
  const connected = await testConnection()
  if (!connected) {
    console.log('\n🛠️  Since automatic execution failed, here are the manual queries to run:')
    console.log('\nCopy these into your Supabase SQL Editor:\n')
    console.log("UPDATE maintenance_orders SET abertura = NULL WHERE abertura::text = '';")
    console.log("UPDATE maintenance_orders SET fechamento = NULL WHERE fechamento::text = '';")
    console.log("UPDATE maintenance_orders SET parada = NULL WHERE parada::text = '';")
    console.log("UPDATE maintenance_orders SET funcionamento = NULL WHERE funcionamento::text = '';")
    console.log("UPDATE maintenance_orders SET data_chamado = NULL WHERE data_chamado::text = '';")
    console.log("UPDATE maintenance_orders SET data_atendimento = NULL WHERE data_atendimento::text = '';")
    console.log("UPDATE maintenance_orders SET data_solucao = NULL WHERE data_solucao::text = '';")
    console.log("UPDATE building_orders SET abertura = NULL WHERE abertura::text = '';")
    console.log("UPDATE building_orders SET fechamento = NULL WHERE fechamento::text = '';")
    console.log("UPDATE building_orders SET parada = NULL WHERE parada::text = '';")
    console.log("UPDATE building_orders SET funcionamento = NULL WHERE funcionamento::text = '';")
    console.log("UPDATE building_orders SET data_chamado = NULL WHERE data_chamado::text = '';")
    console.log("UPDATE building_orders SET data_atendimento = NULL WHERE data_atendimento::text = '';")
    console.log("UPDATE building_orders SET data_solucao = NULL WHERE data_solucao::text = '';")
    return
  }

  await fixDatabase()
}

main().catch(console.error)