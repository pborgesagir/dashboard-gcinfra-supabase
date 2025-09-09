# Guia de Deploy no Vercel

Este guia explica como fazer o deploy da aplicação healthcare-saas no Vercel usando o dashboard.

## Pré-requisitos

- Conta no Vercel (https://vercel.com)
- Repositório Git (GitHub, GitLab ou Bitbucket)
- Variáveis de ambiente configuradas

## Passo a Passo para Deploy

### 1. Preparar o Repositório

Certifique-se de que seu código está commitado e enviado para o repositório Git:

```bash
git add .
git commit -m "Prepare for Vercel deployment"
git push origin main
```

### 2. Conectar no Vercel Dashboard

1. Acesse https://vercel.com/dashboard
2. Clique em "New Project" ou "Add New..."
3. Selecione "Project"

### 3. Importar Repositório Git

1. Na seção "Import Git Repository", escolha seu provedor (GitHub, GitLab, Bitbucket)
2. Autorize o Vercel a acessar seu repositório se necessário
3. Selecione o repositório `healthcare-saas`
4. Clique em "Import"

### 4. Configurar o Projeto

1. **Framework**: Vercel deve detectar automaticamente "Next.js"
2. **Project Name**: Mantenha o nome ou altere conforme desejado
3. **Root Directory**: Deixe como "./". Se seu código estiver em uma subpasta, ajuste aqui
4. **Build Command**: Deixe vazio (usa `npm run build` automaticamente)
5. **Output Directory**: Deixe vazio (usa `.next` automaticamente)

### 5. Configurar Variáveis de Ambiente

Clique em "Environment Variables" e adicione as seguintes variáveis:

#### Variáveis Obrigatórias:

```
NEXT_PUBLIC_SUPABASE_URL=sua_url_do_supabase
NEXT_PUBLIC_SUPABASE_ANON_KEY=sua_chave_anonima_do_supabase
SUPABASE_SERVICE_ROLE_KEY=sua_service_role_key_do_supabase
```

#### Variáveis Opcionais para E-mail:

```
RESEND_API_KEY=sua_api_key_do_resend
FROM_EMAIL=noreply@seudominio.com
NEXT_PUBLIC_APP_URL=https://seu-projeto.vercel.app
```

**Como obter as variáveis do Supabase:**
1. Acesse seu projeto no Supabase Dashboard
2. Vá em Settings > API
3. Copie a URL e as chaves necessárias

### 6. Deploy

1. Clique em "Deploy"
2. Aguarde o processo de build (pode levar alguns minutos)
3. Quando concluído, você verá "Congratulations!" e o link para sua aplicação

## Configurações Pós-Deploy

### 1. Domínio Personalizado (Opcional)

1. Na dashboard do projeto, vá em "Settings" > "Domains"
2. Clique em "Add Domain"
3. Digite seu domínio personalizado
4. Siga as instruções para configurar DNS

### 2. Atualizar URL da Aplicação

Se não configurou `NEXT_PUBLIC_APP_URL` inicialmente:
1. Vá em "Settings" > "Environment Variables"
2. Adicione `NEXT_PUBLIC_APP_URL` com a URL da sua aplicação
3. Faça redeploy clicando em "Redeploy" na aba "Deployments"

### 3. Configurar Webhooks (Se necessário)

Para atualizações automáticas quando o código mudar:
1. Vá em "Settings" > "Git"
2. Configure "Auto-deploy" conforme necessário

## Funcionalidades da Aplicação

Após o deploy bem-sucedido, sua aplicação terá:

- ✅ Dashboard principal com métricas de manutenção
- ✅ Sistema de autenticação com Supabase
- ✅ API para envio de convites por e-mail
- ✅ Interface responsiva com Material-UI
- ✅ Visualizações interativas com Plotly.js
- ✅ Filtragem e análise de dados de manutenção

## Solução de Problemas

### Build Falha
- Verifique se todas as variáveis de ambiente estão configuradas
- Consulte os logs de build na aba "Deployments"
- Certifique-se de que o código está buildando localmente

### Erro de Conexão com Banco
- Verifique as URLs e chaves do Supabase
- Certifique-se de que o projeto Supabase está ativo
- Verifique as configurações de RLS (Row Level Security)

### Problemas com E-mail
- A aplicação funcionará mesmo sem configuração de e-mail
- Logs mostrarão "e-mail simulado" se RESEND_API_KEY não estiver configurada

## Atualizações

Para atualizar a aplicação:
1. Faça as alterações no código
2. Commit e push para o repositório
3. Vercel fará deploy automático da branch main

## Suporte

- Documentação Vercel: https://vercel.com/docs
- Documentação Next.js: https://nextjs.org/docs
- Documentação Supabase: https://supabase.com/docs