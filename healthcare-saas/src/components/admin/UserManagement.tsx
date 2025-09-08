'use client'

import { useState, useEffect } from 'react'
import {
  Box,
  Card,
  CardContent,
  Typography,
  Button,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  Chip,
  IconButton,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  MenuItem,
  Alert,
  CircularProgress
} from '@mui/material'
import {
  Add,
  Edit,
  Delete,
  Send,
  Refresh
} from '@mui/icons-material'
import { supabase } from '@/lib/supabase/client'
import { UserRole, Database } from '@/lib/supabase/database.types'

type User = Database['public']['Tables']['users']['Row'] & {
  company?: {
    name: string
    acronym: string
  }
}

type Company = Database['public']['Tables']['companies']['Row']

type UserInvitation = Database['public']['Tables']['user_invitations']['Row']

export default function UserManagement() {
  const [users, setUsers] = useState<User[]>([])
  const [companies, setCompanies] = useState<Company[]>([])
  const [invitations, setInvitations] = useState<UserInvitation[]>([])
  const [loading, setLoading] = useState(true)
  const [inviteDialogOpen, setInviteDialogOpen] = useState(false)
  const [editDialogOpen, setEditDialogOpen] = useState(false)
  const [selectedUser, setSelectedUser] = useState<User | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)

  const [inviteForm, setInviteForm] = useState({
    email: '',
    role: 'manager' as UserRole,
    companyId: ''
  })

  const fetchUsers = async () => {
    try {
      const { data, error } = await supabase
        .from('users')
        .select(`
          *,
          companies:company_id (
            name,
            acronym
          )
        `)
        .order('created_at', { ascending: false })

      if (error) throw error
      setUsers(data || [])
    } catch (error) {
      console.error('Error fetching users:', error)
      setError('Falha ao carregar usuários')
    }
  }

  const fetchCompanies = async () => {
    try {
      const { data, error } = await supabase
        .from('companies')
        .select('*')
        .eq('is_active', true)
        .order('name')

      if (error) throw error
      setCompanies(data || [])
    } catch (error) {
      console.error('Error fetching companies:', error)
    }
  }

  const fetchInvitations = async () => {
    try {
      const { data, error } = await supabase
        .from('user_invitations')
        .select('*')
        .eq('status', 'pending')
        .order('created_at', { ascending: false })

      if (error) throw error
      setInvitations(data || [])
    } catch (error) {
      console.error('Error fetching invitations:', error)
    }
  }

  const sendInvitation = async () => {
    try {
      setLoading(true)
      setError(null)

      // Generate invitation token
      const token = crypto.randomUUID()
      const expiresAt = new Date()
      expiresAt.setDate(expiresAt.getDate() + 7) // Expires in 7 days

      // Insert invitation in database
      const { error: dbError } = await supabase
        .from('user_invitations')
        .insert({
          email: inviteForm.email,
          role: inviteForm.role,
          company_id: inviteForm.role === 'admin' ? null : inviteForm.companyId || null,
          token,
          expires_at: expiresAt.toISOString()
        })

      if (dbError) throw dbError

      // Send email via API
      const response = await fetch('/api/invitations/send', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          email: inviteForm.email,
          role: inviteForm.role,
          companyId: inviteForm.role === 'admin' ? null : inviteForm.companyId,
          token
        })
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || 'Falha ao enviar e-mail')
      }

      setSuccess('Convite enviado com sucesso!')
      setInviteDialogOpen(false)
      setInviteForm({ email: '', role: 'manager', companyId: '' })
      fetchInvitations()
    } catch (error: unknown) {
      setError(error instanceof Error ? error.message : 'Falha ao enviar convite')
    } finally {
      setLoading(false)
    }
  }

  const updateUser = async () => {
    if (!selectedUser) return

    try {
      setLoading(true)
      setError(null)

      const { error } = await supabase
        .from('users')
        .update({
          role: selectedUser.role,
          company_id: selectedUser.role === 'admin' ? null : selectedUser.company_id,
          is_active: selectedUser.is_active
        })
        .eq('id', selectedUser.id)

      if (error) throw error

      setSuccess('Usuário atualizado com sucesso!')
      setEditDialogOpen(false)
      setSelectedUser(null)
      fetchUsers()
    } catch (error: unknown) {
      setError(error instanceof Error ? error.message : 'Falha ao atualizar usuário')
    } finally {
      setLoading(false)
    }
  }

  const deleteUser = async (userId: string) => {
    if (!confirm('Tem certeza que deseja excluir este usuário?')) return

    try {
      setLoading(true)
      const { error } = await supabase
        .from('users')
        .delete()
        .eq('id', userId)

      if (error) throw error

      setSuccess('Usuário excluído com sucesso!')
      fetchUsers()
    } catch (error: unknown) {
      setError(error instanceof Error ? error.message : 'Falha ao excluir usuário')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    const loadData = async () => {
      await Promise.all([
        fetchUsers(),
        fetchCompanies(),
        fetchInvitations()
      ])
      setLoading(false)
    }

    loadData()
  }, [])

  if (loading) {
    return (
      <Box display="flex" justifyContent="center" p={4}>
        <CircularProgress />
      </Box>
    )
  }

  return (
    <Box>
      <Box display="flex" justifyContent="space-between" alignItems="center" mb={3}>
        <Typography variant="h4">Gerenciar Usuários</Typography>
        <Box gap={2} display="flex">
          <Button
            variant="outlined"
            startIcon={<Refresh />}
            onClick={() => {
              fetchUsers()
              fetchCompanies()
              fetchInvitations()
            }}
          >
            ATUALIZAR
          </Button>
          <Button
            variant="contained"
            startIcon={<Add />}
            onClick={() => setInviteDialogOpen(true)}
          >
            CONVIDAR
          </Button>
        </Box>
      </Box>

      {error && (
        <Alert severity="error" sx={{ mb: 2 }} onClose={() => setError(null)}>
          {error}
        </Alert>
      )}

      {success && (
        <Alert severity="success" sx={{ mb: 2 }} onClose={() => setSuccess(null)}>
          {success}
        </Alert>
      )}

      {/* Pending Invitations */}
      {invitations.length > 0 && (
        <Card sx={{ mb: 3 }}>
          <CardContent>
            <Typography variant="h6" gutterBottom>
              Convites Pendentes ({invitations.length})
            </Typography>
            <TableContainer>
              <Table size="small">
                <TableHead>
                  <TableRow>
                    <TableCell>Email</TableCell>
                    <TableCell>Perfil</TableCell>
                    <TableCell>Empresa</TableCell>
                    <TableCell>Expira em</TableCell>
                    <TableCell>Status</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {invitations.map((invitation) => (
                    <TableRow key={invitation.id}>
                      <TableCell>{invitation.email}</TableCell>
                      <TableCell>
                        <Chip 
                          label={invitation.role} 
                          size="small" 
                          color={invitation.role === 'admin' ? 'error' : 'primary'}
                        />
                      </TableCell>
                      <TableCell>
                        {invitation.company_id ? 
                          companies.find(c => c.id === invitation.company_id)?.name || 'Unknown'
                          : 'N/A (Admin)'
                        }
                      </TableCell>
                      <TableCell>
                        {new Date(invitation.expires_at).toLocaleDateString()}
                      </TableCell>
                      <TableCell>
                        <Chip label={invitation.status === 'pending' ? 'Pendente' : invitation.status} size="small" color="warning" />
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>
          </CardContent>
        </Card>
      )}

      {/* Users Table */}
      <Card>
        <CardContent>
          <Typography variant="h6" gutterBottom>
            Usuários ({users.length})
          </Typography>
          <TableContainer component={Paper}>
            <Table>
              <TableHead>
                <TableRow>
                  <TableCell>Email</TableCell>
                  <TableCell>Perfil</TableCell>
                  <TableCell>Empresa</TableCell>
                  <TableCell>Status</TableCell>
                  <TableCell>Criado em</TableCell>
                  <TableCell>Ações</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {users.map((user) => (
                  <TableRow key={user.id}>
                    <TableCell>{user.email}</TableCell>
                    <TableCell>
                      <Chip 
                        label={user.role} 
                        size="small" 
                        color={user.role === 'admin' ? 'error' : 'primary'}
                      />
                    </TableCell>
                    <TableCell>
                      {user.company?.name || 'N/A (Admin)'}
                    </TableCell>
                    <TableCell>
                      <Chip 
                        label={user.is_active ? 'Ativo' : 'Inativo'} 
                        size="small" 
                        color={user.is_active ? 'success' : 'default'}
                      />
                    </TableCell>
                    <TableCell>
                      {new Date(user.created_at).toLocaleDateString()}
                    </TableCell>
                    <TableCell>
                      <IconButton
                        size="small"
                        onClick={() => {
                          setSelectedUser(user)
                          setEditDialogOpen(true)
                        }}
                      >
                        <Edit />
                      </IconButton>
                      <IconButton
                        size="small"
                        color="error"
                        onClick={() => deleteUser(user.id)}
                      >
                        <Delete />
                      </IconButton>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
        </CardContent>
      </Card>

      {/* Invite User Dialog */}
      <Dialog open={inviteDialogOpen} onClose={() => setInviteDialogOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle>Convidar Novo Usuário</DialogTitle>
        <DialogContent>
          <Box display="flex" flexDirection="column" gap={2} pt={2}>
            <TextField
              label="Email"
              type="email"
              value={inviteForm.email}
              onChange={(e) => setInviteForm({ ...inviteForm, email: e.target.value })}
              fullWidth
              required
            />
            <TextField
              select
              label="Role"
              value={inviteForm.role}
              onChange={(e) => setInviteForm({ ...inviteForm, role: e.target.value as UserRole })}
              fullWidth
            >
              <MenuItem value="admin">Admin</MenuItem>
              <MenuItem value="manager">Gerente</MenuItem>
            </TextField>
            {inviteForm.role === 'manager' && (
              <TextField
                select
                label="Empresa"
                value={inviteForm.companyId}
                onChange={(e) => setInviteForm({ ...inviteForm, companyId: e.target.value })}
                fullWidth
                required
              >
                {companies.map((company) => (
                  <MenuItem key={company.id} value={company.id}>
                    {company.name}
                  </MenuItem>
                ))}
              </TextField>
            )}
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setInviteDialogOpen(false)}>Cancelar</Button>
          <Button 
            onClick={sendInvitation} 
            variant="contained" 
            startIcon={<Send />}
            disabled={!inviteForm.email || (inviteForm.role === 'manager' && !inviteForm.companyId)}
          >
            Enviar Convite
          </Button>
        </DialogActions>
      </Dialog>

      {/* Edit User Dialog */}
      <Dialog open={editDialogOpen} onClose={() => setEditDialogOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle>Editar Usuário</DialogTitle>
        <DialogContent>
          {selectedUser && (
            <Box display="flex" flexDirection="column" gap={2} pt={2}>
              <TextField
                label="Email"
                value={selectedUser.email}
                disabled
                fullWidth
              />
              <TextField
                select
                label="Role"
                value={selectedUser.role}
                onChange={(e) => setSelectedUser({
                  ...selectedUser,
                  role: e.target.value as UserRole,
                  company_id: e.target.value === 'admin' ? null : selectedUser.company_id
                })}
                fullWidth
              >
                <MenuItem value="admin">Admin</MenuItem>
                <MenuItem value="manager">Gerente</MenuItem>
              </TextField>
              {selectedUser.role === 'manager' && (
                <TextField
                  select
                  label="Empresa"
                  value={selectedUser.company_id || ''}
                  onChange={(e) => setSelectedUser({
                    ...selectedUser,
                    company_id: e.target.value || null
                  })}
                  fullWidth
                  required
                >
                  {companies.map((company) => (
                    <MenuItem key={company.id} value={company.id}>
                      {company.name}
                    </MenuItem>
                  ))}
                </TextField>
              )}
              <TextField
                select
                label="Status"
                value={selectedUser.is_active ? 'active' : 'inactive'}
                onChange={(e) => setSelectedUser({
                  ...selectedUser,
                  is_active: e.target.value === 'active'
                })}
                fullWidth
              >
                <MenuItem value="active">Ativo</MenuItem>
                <MenuItem value="inactive">Inativo</MenuItem>
              </TextField>
            </Box>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setEditDialogOpen(false)}>Cancelar</Button>
          <Button onClick={updateUser} variant="contained">
            Atualizar Usuário
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  )
}