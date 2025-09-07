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
      setError('Failed to load users')
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

      const { error } = await supabase
        .from('user_invitations')
        .insert({
          email: inviteForm.email,
          role: inviteForm.role,
          company_id: inviteForm.role === 'admin' ? null : inviteForm.companyId || null,
          token,
          expires_at: expiresAt.toISOString()
        })

      if (error) throw error

      setSuccess('Invitation sent successfully!')
      setInviteDialogOpen(false)
      setInviteForm({ email: '', role: 'manager', companyId: '' })
      fetchInvitations()
    } catch (error: unknown) {
      setError(error instanceof Error ? error.message : 'Failed to send invitation')
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

      setSuccess('User updated successfully!')
      setEditDialogOpen(false)
      setSelectedUser(null)
      fetchUsers()
    } catch (error: unknown) {
      setError(error instanceof Error ? error.message : 'Failed to update user')
    } finally {
      setLoading(false)
    }
  }

  const deleteUser = async (userId: string) => {
    if (!confirm('Are you sure you want to delete this user?')) return

    try {
      setLoading(true)
      const { error } = await supabase
        .from('users')
        .delete()
        .eq('id', userId)

      if (error) throw error

      setSuccess('User deleted successfully!')
      fetchUsers()
    } catch (error: unknown) {
      setError(error instanceof Error ? error.message : 'Failed to delete user')
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
        <Typography variant="h4">User Management</Typography>
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
            Refresh
          </Button>
          <Button
            variant="contained"
            startIcon={<Add />}
            onClick={() => setInviteDialogOpen(true)}
          >
            Invite User
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
              Pending Invitations ({invitations.length})
            </Typography>
            <TableContainer>
              <Table size="small">
                <TableHead>
                  <TableRow>
                    <TableCell>Email</TableCell>
                    <TableCell>Role</TableCell>
                    <TableCell>Company</TableCell>
                    <TableCell>Expires</TableCell>
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
                        <Chip label={invitation.status} size="small" color="warning" />
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
            Users ({users.length})
          </Typography>
          <TableContainer component={Paper}>
            <Table>
              <TableHead>
                <TableRow>
                  <TableCell>Email</TableCell>
                  <TableCell>Role</TableCell>
                  <TableCell>Company</TableCell>
                  <TableCell>Status</TableCell>
                  <TableCell>Created</TableCell>
                  <TableCell>Actions</TableCell>
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
                        label={user.is_active ? 'Active' : 'Inactive'} 
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
        <DialogTitle>Invite New User</DialogTitle>
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
              <MenuItem value="manager">Manager</MenuItem>
            </TextField>
            {inviteForm.role === 'manager' && (
              <TextField
                select
                label="Company"
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
          <Button onClick={() => setInviteDialogOpen(false)}>Cancel</Button>
          <Button 
            onClick={sendInvitation} 
            variant="contained" 
            startIcon={<Send />}
            disabled={!inviteForm.email || (inviteForm.role === 'manager' && !inviteForm.companyId)}
          >
            Send Invitation
          </Button>
        </DialogActions>
      </Dialog>

      {/* Edit User Dialog */}
      <Dialog open={editDialogOpen} onClose={() => setEditDialogOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle>Edit User</DialogTitle>
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
                <MenuItem value="manager">Manager</MenuItem>
              </TextField>
              {selectedUser.role === 'manager' && (
                <TextField
                  select
                  label="Company"
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
                <MenuItem value="active">Active</MenuItem>
                <MenuItem value="inactive">Inactive</MenuItem>
              </TextField>
            </Box>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setEditDialogOpen(false)}>Cancel</Button>
          <Button onClick={updateUser} variant="contained">
            Update User
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  )
}