#!/usr/bin/env node

/**
 * Setup script to create the first admin user
 * Run this script after setting up your database schema in Supabase
 */

const { createClient } = require('@supabase/supabase-js')
require('dotenv').config({ path: '.env.local' })

async function setupFirstAdmin() {
  console.log('🚀 Healthcare SaaS - Admin Setup')
  console.log('===============================\n')

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY

  if (!supabaseUrl || !serviceKey) {
    console.error('❌ Missing required environment variables:')
    console.error('- NEXT_PUBLIC_SUPABASE_URL')
    console.error('- SUPABASE_SERVICE_ROLE_KEY')
    console.error('\nPlease get your Service Role Key from Supabase Dashboard > Settings > API')
    return
  }

  if (serviceKey === 'your_service_role_key_here') {
    console.error('❌ Please update SUPABASE_SERVICE_ROLE_KEY in .env.local')
    console.error('Get it from: Supabase Dashboard > Settings > API > Service Role Key')
    return
  }

  const supabase = createClient(supabaseUrl, serviceKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false
    }
  })

  console.log('📧 To create your first admin user, you need to:')
  console.log('1. Go to Supabase Dashboard > Authentication > Users')
  console.log('2. Click "Add user" (manual)')
  console.log('3. Enter your email and temporary password')
  console.log('4. After user is created, run this script to make them an admin\n')

  // For now, let's just validate the connection and check database
  try {
    console.log('🔍 Checking database connection...')
    
    // Check if tables exist
    const { data: tables, error } = await supabase
      .from('companies')
      .select('count', { count: 'exact' })
      .limit(0)

    if (error) {
      console.error('❌ Database connection failed:', error.message)
      console.error('\n📋 Please run the database schema first:')
      console.error('1. Go to Supabase Dashboard > SQL Editor')
      console.error('2. Run the contents of database/schema.sql')
      console.error('3. Run the contents of database/rls_policies.sql')
      return
    }

    console.log('✅ Database connection successful')
    console.log('✅ Tables are set up correctly')
    
    console.log('\n🎯 Next steps to create admin user:')
    console.log('1. Create user in Supabase Auth (Dashboard > Authentication)')
    console.log('2. Note down the user ID')
    console.log('3. Run: node setup-admin.js <user-id>')
    console.log('\nExample: node setup-admin.js 12345678-1234-1234-1234-123456789abc')
    
  } catch (error) {
    console.error('❌ Setup failed:', error.message)
  }
}

async function makeUserAdmin(userId) {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY

  const supabase = createClient(supabaseUrl, serviceKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false
    }
  })

  try {
    console.log(`🔧 Making user ${userId} an admin...`)

    // First, get the user's email from Supabase Auth
    const { data: authUser, error: authError } = await supabase.auth.admin.getUserById(userId)
    
    if (authError || !authUser.user) {
      console.error('❌ Failed to get user from Supabase Auth:', authError?.message || 'User not found')
      console.error('💡 Make sure the user exists in Supabase Dashboard > Authentication > Users')
      return
    }

    if (!authUser.user.email) {
      console.error('❌ User does not have an email address')
      return
    }

    console.log(`📧 Found user: ${authUser.user.email}`)

    // Insert or update user in users table as admin
    const { data, error } = await supabase
      .from('users')
      .upsert({
        id: userId,
        email: authUser.user.email,
        role: 'admin',
        company_id: null, // Admins don't belong to a specific company
        is_active: true
      }, { 
        onConflict: 'id' 
      })
      .select()

    if (error) {
      console.error('❌ Failed to create admin user:', error.message)
      return
    }

    console.log('✅ Admin user created successfully!')
    console.log('🎉 You can now login to the application as an admin')
    console.log(`📧 Email: ${authUser.user.email}`)
    console.log(`📧 User ID: ${userId}`)
    console.log('🌐 Access the app at: http://localhost:3000')

  } catch (error) {
    console.error('❌ Failed to setup admin:', error.message)
  }
}

// Check if user ID was provided as argument
const userId = process.argv[2]

if (userId) {
  makeUserAdmin(userId)
} else {
  setupFirstAdmin()
}