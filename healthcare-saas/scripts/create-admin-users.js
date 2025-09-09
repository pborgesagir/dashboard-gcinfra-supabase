#!/usr/bin/env node

/**
 * Script para criar múltiplos usuários admin
 */

const { createClient } = require('@supabase/supabase-js')
require('dotenv').config({ path: '.env.local' })

const adminUsers = [
  'gerson.bailona@agirsaude.org.br',
  'arthur.pires@agirsaude.org.br', 
  'vitor.peixoto@agirsaude.org.br',
  'kaio.razotto@agirsaude.org.br',
  'jamile.lopes@agirsaude.org.br',
  'polyanna.inacio@agirsaude.org.br',
  'regilane.ribeiro@agirsaude.org.br',
  'francinelli.calil@agirsaude.org.br',
  'guilherme.morais@agirsaude.org.br'
]

const defaultPassword = 'AtleticoGO1937'

async function createAdminUsers() {
  console.log('🚀 Criando usuários admin...')
  console.log('================================\n')

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY

  if (!supabaseUrl || !serviceKey) {
    console.error('❌ Variáveis de ambiente não encontradas!')
    return
  }

  const supabase = createClient(supabaseUrl, serviceKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false
    }
  })

  for (const email of adminUsers) {
    try {
      console.log(`📧 Criando usuário: ${email}`)
      
      // 1. Criar usuário na autenticação
      const { data: authUser, error: authError } = await supabase.auth.admin.createUser({
        email: email,
        password: defaultPassword,
        email_confirm: true,
        user_metadata: {
          role: 'admin'
        }
      })

      if (authError) {
        console.error(`❌ Erro ao criar auth para ${email}:`, authError.message)
        continue
      }

      if (authUser?.user) {
        // 2. Criar perfil na tabela users
        const { error: profileError } = await supabase
          .from('users')
          .insert({
            id: authUser.user.id,
            email: email,
            role: 'admin',
            company_id: null // Admin global
          })

        if (profileError) {
          console.error(`❌ Erro ao criar perfil para ${email}:`, profileError.message)
        } else {
          console.log(`✅ Usuário criado com sucesso: ${email}`)
        }
      }

      // Pequena pausa entre criações
      await new Promise(resolve => setTimeout(resolve, 500))

    } catch (error) {
      console.error(`❌ Erro geral para ${email}:`, error.message)
    }
  }

  console.log('\n🎉 Processo concluído!')
  console.log(`📋 Senha padrão para todos: ${defaultPassword}`)
  console.log('👥 Usuários devem trocar a senha no primeiro login')
}

createAdminUsers().catch(console.error)