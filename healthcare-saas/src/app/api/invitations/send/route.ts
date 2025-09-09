import { NextRequest, NextResponse } from 'next/server'
import { Resend } from 'resend'

// Interface para dados do convite
interface InviteData {
  email: string
  role: string
  companyId?: string
  token: string
  inviteUrl: string
}

// Função para enviar email usando Resend
async function sendInvitationEmail(inviteData: InviteData) {
  // Verificar se a API key do Resend está configurada
  const apiKey = process.env.RESEND_API_KEY
  
  if (!apiKey) {
    console.log('RESEND_API_KEY não configurada, simulando envio de e-mail')
    console.log('Enviando e-mail de convite para:', inviteData.email)
    console.log('URL do convite:', inviteData.inviteUrl)
    return { success: true, simulated: true }
  }

  try {
    const resend = new Resend(apiKey)
    
    const emailContent = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
        <div style="text-align: center; margin-bottom: 30px;">
          <h1 style="color: #2196f3; margin-bottom: 10px;">360° - GCINFRA</h1>
          <h2 style="color: #333; margin: 0;">Convite para Acesso ao Sistema</h2>
        </div>
        
        <div style="background-color: #e8f5e8; padding: 20px; border-radius: 8px; margin-bottom: 20px; border-left: 4px solid #4caf50;">
          <p style="margin: 0 0 15px 0; font-size: 18px; font-weight: bold; color: #2e7d32;">
            🎉 Bem-vindo ao GCINFRA 360°!
          </p>
          <p style="margin: 0 0 15px 0; font-size: 16px;">Olá!</p>
          <p style="margin: 0 0 15px 0; font-size: 16px;">
            Você foi convidado para se juntar ao sistema de gestão inteligente de infraestrutura 
            <strong>GCINFRA 360°</strong> com o perfil de 
            <strong>${inviteData.role === 'admin' ? 'Administrador' : 'Gerente'}</strong>.
          </p>
          <p style="margin: 0; font-size: 14px; color: #666; font-style: italic;">
            Uma nova era na gestão de infraestrutura hospitalar te aguarda!
          </p>
        </div>
        
        <div style="text-align: center; margin: 30px 0;">
          <a href="${inviteData.inviteUrl}" 
             style="background-color: #2196f3; 
                    color: white; 
                    padding: 15px 30px; 
                    text-decoration: none; 
                    border-radius: 6px; 
                    display: inline-block; 
                    font-size: 16px; 
                    font-weight: bold;">
            Completar Cadastro
          </a>
        </div>
        
        <div style="background-color: #fff3cd; border: 1px solid #ffeaa7; padding: 15px; border-radius: 6px; margin: 20px 0;">
          <p style="margin: 0; color: #856404;">
            <strong>⚠️ Importante:</strong> Este convite expira em 7 dias.
          </p>
        </div>
        
        <div style="margin: 30px 0;">
          <p style="font-size: 14px; color: #666;">
            Se você não conseguir clicar no botão, copie e cole o link abaixo no seu navegador:
          </p>
          <p style="background-color: #f8f9fa; padding: 10px; border-radius: 4px; word-break: break-all; font-family: monospace; font-size: 12px;">
            ${inviteData.inviteUrl}
          </p>
        </div>
        
        <hr style="border: none; border-top: 1px solid #eee; margin: 30px 0;">
        
        <div style="text-align: center;">
          <p style="color: #666; font-size: 12px; margin: 0;">
            Este é um e-mail automático, não responda a esta mensagem.
          </p>
          <p style="color: #666; font-size: 12px; margin: 5px 0 0 0;">
            360° - GCINFRA © ${new Date().getFullYear()}
          </p>
        </div>
      </div>
    `
    
    const result = await resend.emails.send({
      from: process.env.FROM_EMAIL || 'noreply@resend.dev',
      to: inviteData.email,
      subject: 'Convite para acessar o sistema 360° - GCINFRA',
      html: emailContent
    })

    return { success: true, messageId: result.data?.id }
  } catch (error) {
    console.error('Erro ao enviar e-mail:', error)
    throw error
  }
}

export async function POST(request: NextRequest) {
  try {
    const { email, role, companyId, token } = await request.json()

    if (!email || !role || !token) {
      return NextResponse.json(
        { error: 'Email, perfil e token são obrigatórios' },
        { status: 400 }
      )
    }

    // Construir URL do convite
    const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'
    const inviteUrl = `${baseUrl}/auth/complete-invitation?token=${token}`

    // Preparar dados do convite
    const inviteData: InviteData = {
      email,
      role,
      companyId,
      token,
      inviteUrl
    }

    // Enviar e-mail
    const emailResult = await sendInvitationEmail(inviteData)

    return NextResponse.json({ 
      success: true, 
      message: emailResult.simulated 
        ? 'Convite criado com sucesso (e-mail simulado para desenvolvimento)'
        : 'E-mail de convite enviado com sucesso',
      inviteUrl, // Retorna a URL para debug/teste
      messageId: emailResult.messageId
    })

  } catch (error) {
    console.error('Erro ao enviar convite:', error)
    return NextResponse.json(
      { error: 'Falha ao enviar e-mail de convite' },
      { status: 500 }
    )
  }
}