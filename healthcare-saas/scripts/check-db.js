#!/usr/bin/env node

const { createClient } = require('@supabase/supabase-js')
require('dotenv').config({ path: '.env.local' })

async function checkDatabase() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

  if (!supabaseUrl || !anonKey) {
    console.error('❌ Missing environment variables')
    return
  }

  const supabase = createClient(supabaseUrl, anonKey)

  console.log('🔍 Checking database setup...\n')
  console.log(`🌐 Supabase URL: ${supabaseUrl}`)
  
  const tablesToCheck = ['companies', 'users', 'maintenance_orders', 'building_orders']
  
  for (const table of tablesToCheck) {
    try {
      const { data, error } = await supabase
        .from(table)
        .select('*')
        .limit(1)
      
      if (error) {
        console.log(`❌ Table '${table}': ${error.message}`)
      } else {
        console.log(`✅ Table '${table}': OK`)
      }
    } catch (err) {
      console.log(`❌ Table '${table}': ${err.message}`)
    }
  }
}

checkDatabase()