'use client'

import { useState, useEffect } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import {
  Box,
  Card,
  CardContent,
  TextField,
  Button,
  Typography,
  Alert,
  CircularProgress,
  Container
} from '@mui/material'
import Image from 'next/image'
import { supabase } from '@/lib/supabase/client'

export default function CompleteInvitationPage() {
  const [invitation, setInvitation] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState(false)
  
  const [formData, setFormData] = useState({
    password: '',
    confirmPassword: '',
    fullName: ''
  })
  
  const router = useRouter()
  const searchParams = useSearchParams()
  const token = searchParams.get('token')

  useEffect(() => {
    if (token) {
      validateToken()
    } else {
      setError('Token de convite não fornecido')
      setLoading(false)
    }
  }, [token])

  const validateToken = async () => {
    try {
      const { data, error } = await supabase
        .from('user_invitations')
        .select(`
          *,
          companies:company_id (
            name,
            acronym
          )
        `)
        .eq('token', token)
        .eq('status', 'pending')
        .single()

      if (error || !data) {
        setError('Convite inválido ou expirado')
        return
      }

      // Verificar se o convite não expirou
      if (new Date(data.expires_at) < new Date()) {
        setError('Convite expirado')
        return
      }

      setInvitation(data)
    } catch (error) {
      console.error('Erro ao validar token:', error)
      setError('Erro ao validar convite')
    } finally {
      setLoading(false)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (formData.password !== formData.confirmPassword) {
      setError('As senhas não coincidem')
      return
    }

    if (formData.password.length < 6) {
      setError('A senha deve ter pelo menos 6 caracteres')
      return
    }

    setSubmitting(true)
    setError(null)

    try {
      // Criar usuário no Supabase Auth
      const { data: authData, error: authError } = await supabase.auth.signUp({
        email: invitation.email,
        password: formData.password,
        options: {
          data: {
            full_name: formData.fullName,
            role: invitation.role,
            company_id: invitation.company_id
          }
        }
      })

      if (authError) throw authError

      if (authData.user) {
        // Criar registro na tabela users
        const { error: userError } = await supabase
          .from('users')
          .insert({
            id: authData.user.id,
            email: invitation.email,
            full_name: formData.fullName,
            role: invitation.role,
            company_id: invitation.company_id,
            is_active: true
          })

        if (userError) throw userError

        // Marcar convite como aceito
        await supabase
          .from('user_invitations')
          .update({ 
            status: 'accepted',
            accepted_at: new Date().toISOString()
          })
          .eq('id', invitation.id)

        setSuccess(true)
        
        // Redirecionar após 3 segundos
        setTimeout(() => {
          router.push('/auth/login?message=Cadastro completado com sucesso!')
        }, 3000)
      }
    } catch (error: any) {
      console.error('Erro ao completar cadastro:', error)
      setError(error.message || 'Erro ao completar cadastro')
    } finally {
      setSubmitting(false)
    }
  }

  if (loading) {
    return (
      <Container maxWidth="sm">
        <Box display="flex" justifyContent="center" alignItems="center" minHeight="100vh">
          <CircularProgress />
        </Box>
      </Container>
    )
  }

  if (error && !invitation) {
    return (
      <Container maxWidth="sm">
        <Box display="flex" justifyContent="center" alignItems="center" minHeight="100vh">
          <Card>
            <CardContent>
              <Alert severity="error">{error}</Alert>
              <Box mt={2}>
                <Button 
                  variant="contained" 
                  onClick={() => router.push('/auth/login')}
                  fullWidth
                >
                  Ir para Login
                </Button>
              </Box>
            </CardContent>
          </Card>
        </Box>
      </Container>
    )
  }

  if (success) {
    return (
      <Container maxWidth="sm">
        <Box display="flex" justifyContent="center" alignItems="center" minHeight="100vh">
          <Card>
            <CardContent>
              <Box textAlign="center">
                <Alert severity="success" sx={{ mb: 2 }}>
                  Cadastro completado com sucesso!
                </Alert>
                <Typography variant="body2" color="text.secondary">
                  Você será redirecionado para a página de login...
                </Typography>
                <CircularProgress size={24} sx={{ mt: 2 }} />
              </Box>
            </CardContent>
          </Card>
        </Box>
      </Container>
    )
  }

  return (
    <Container maxWidth="sm">
      <Box
        display="flex"
        flexDirection="column"
        alignItems="center"
        justifyContent="center"
        minHeight="100vh"
        gap={4}
      >
        <Box display="flex" flexDirection="column" alignItems="center" gap={2}>
          <Image 
            src="/logodaagir.png" 
            alt="360° - GCINFRA Logo" 
            width={120} 
            height={120}
            style={{ objectFit: 'contain' }}
          />
          <Typography variant="h3" fontWeight="bold" color="primary.main">
            360° - GCINFRA
          </Typography>
        </Box>
        
        <Card sx={{ width: '100%', maxWidth: 500 }}>
          <CardContent sx={{ p: 4 }}>
            <Typography variant="h4" align="center" gutterBottom>
              Completar Cadastro
            </Typography>
            
            <Typography variant="body2" align="center" color="text.secondary" sx={{ mb: 3 }}>
              Complete seu cadastro para acessar o sistema
            </Typography>

            {/* Informações do convite */}
            <Box sx={{ mb: 3, p: 2, bgcolor: '#f8f9fa', borderRadius: 1 }}>
              <Typography variant="body2" color="text.secondary">
                <strong>Email:</strong> {invitation.email}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                <strong>Perfil:</strong> {invitation.role === 'admin' ? 'Administrador' : 'Gerente'}
              </Typography>
              {invitation.companies && (
                <Typography variant="body2" color="text.secondary">
                  <strong>Empresa:</strong> {invitation.companies.name}
                </Typography>
              )}
            </Box>

            {error && (
              <Alert severity="error" sx={{ mb: 3 }}>
                {error}
              </Alert>
            )}

            <form onSubmit={handleSubmit}>
              <TextField
                fullWidth
                label="Nome Completo"
                value={formData.fullName}
                onChange={(e) => setFormData({ ...formData, fullName: e.target.value })}
                required
                sx={{ mb: 2 }}
              />
              
              <TextField
                fullWidth
                label="Senha"
                type="password"
                value={formData.password}
                onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                required
                helperText="Mínimo 6 caracteres"
                sx={{ mb: 2 }}
              />

              <TextField
                fullWidth
                label="Confirmar Senha"
                type="password"
                value={formData.confirmPassword}
                onChange={(e) => setFormData({ ...formData, confirmPassword: e.target.value })}
                required
                sx={{ mb: 3 }}
              />
              
              <Button
                type="submit"
                fullWidth
                variant="contained"
                size="large"
                disabled={submitting}
                sx={{ mb: 2 }}
              >
                {submitting ? (
                  <Box display="flex" alignItems="center" gap={1}>
                    <CircularProgress size={20} color="inherit" />
                    <span>Processando...</span>
                  </Box>
                ) : 'Completar Cadastro'}
              </Button>
            </form>
          </CardContent>
        </Card>
      </Box>
    </Container>
  )
}