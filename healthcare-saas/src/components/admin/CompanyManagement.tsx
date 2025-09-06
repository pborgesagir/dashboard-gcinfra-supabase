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
  Alert,
  CircularProgress
} from '@mui/material'
import {
  Add,
  Edit,
  Delete,
  Refresh,
  Business
} from '@mui/icons-material'
import { supabase } from '@/lib/supabase/client'
import { Database } from '@/lib/supabase/database.types'

type Company = Database['public']['Tables']['companies']['Row'] & {
  user_count?: number
  maintenance_order_count?: number
  building_order_count?: number
}

export default function CompanyManagement() {
  const [companies, setCompanies] = useState<Company[]>([])
  const [loading, setLoading] = useState(true)
  const [dialogOpen, setDialogOpen] = useState(false)
  const [editMode, setEditMode] = useState(false)
  const [selectedCompany, setSelectedCompany] = useState<Company | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)

  const [companyForm, setCompanyForm] = useState({
    name: '',
    slug: '',
    is_active: true
  })

  const generateSlug = (name: string) => {
    return name
      .toLowerCase()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '') // Remove accents
      .replace(/[^a-z0-9]/g, '-')
      .replace(/-+/g, '-')
      .replace(/^-|-$/g, '')
  }

  const fetchCompanies = async () => {
    try {
      setLoading(true)
      
      // Get companies with user counts
      const { data: companiesData, error: companiesError } = await supabase
        .from('companies')
        .select('*')
        .order('created_at', { ascending: false })

      if (companiesError) throw companiesError

      // Get user counts for each company
      const companiesWithCounts = await Promise.all(
        (companiesData || []).map(async (company) => {
          const [usersResult, maintenanceResult, buildingResult] = await Promise.all([
            supabase
              .from('users')
              .select('id', { count: 'exact' })
              .eq('company_id', company.id),
            supabase
              .from('maintenance_orders')
              .select('id', { count: 'exact' })
              .eq('company_id', company.id),
            supabase
              .from('building_orders')
              .select('id', { count: 'exact' })
              .eq('company_id', company.id)
          ])

          return {
            ...company,
            user_count: usersResult.count || 0,
            maintenance_order_count: maintenanceResult.count || 0,
            building_order_count: buildingResult.count || 0
          }
        })
      )

      setCompanies(companiesWithCounts)
    } catch (error: any) {
      console.error('Error fetching companies:', error)
      setError(error.message || 'Failed to load companies')
    } finally {
      setLoading(false)
    }
  }

  const saveCompany = async () => {
    try {
      setLoading(true)
      setError(null)

      const companyData = {
        name: companyForm.name,
        slug: companyForm.slug || generateSlug(companyForm.name),
        is_active: companyForm.is_active
      }

      if (editMode && selectedCompany) {
        const { error } = await supabase
          .from('companies')
          .update(companyData)
          .eq('id', selectedCompany.id)

        if (error) throw error
        setSuccess('Company updated successfully!')
      } else {
        const { error } = await supabase
          .from('companies')
          .insert(companyData)

        if (error) throw error
        setSuccess('Company created successfully!')
      }

      setDialogOpen(false)
      resetForm()
      fetchCompanies()
    } catch (error: any) {
      setError(error.message || 'Failed to save company')
    } finally {
      setLoading(false)
    }
  }

  const deleteCompany = async (companyId: string, companyName: string) => {
    if (!confirm(`Are you sure you want to delete "${companyName}"? This will also delete all associated users and data.`)) {
      return
    }

    try {
      setLoading(true)
      const { error } = await supabase
        .from('companies')
        .delete()
        .eq('id', companyId)

      if (error) throw error

      setSuccess('Company deleted successfully!')
      fetchCompanies()
    } catch (error: any) {
      setError(error.message || 'Failed to delete company')
    } finally {
      setLoading(false)
    }
  }

  const openCreateDialog = () => {
    resetForm()
    setEditMode(false)
    setDialogOpen(true)
  }

  const openEditDialog = (company: Company) => {
    setCompanyForm({
      name: company.name,
      slug: company.slug,
      is_active: company.is_active
    })
    setSelectedCompany(company)
    setEditMode(true)
    setDialogOpen(true)
  }

  const resetForm = () => {
    setCompanyForm({
      name: '',
      slug: '',
      is_active: true
    })
    setSelectedCompany(null)
  }

  useEffect(() => {
    fetchCompanies()
  }, [])

  if (loading && companies.length === 0) {
    return (
      <Box display="flex" justifyContent="center" p={4}>
        <CircularProgress />
      </Box>
    )
  }

  return (
    <Box>
      <Box display="flex" justifyContent="space-between" alignItems="center" mb={3}>
        <Typography variant="h4">Company Management</Typography>
        <Box gap={2} display="flex">
          <Button
            variant="outlined"
            startIcon={<Refresh />}
            onClick={fetchCompanies}
            disabled={loading}
          >
            Refresh
          </Button>
          <Button
            variant="contained"
            startIcon={<Add />}
            onClick={openCreateDialog}
          >
            Add Company
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

      <Card>
        <CardContent>
          <Typography variant="h6" gutterBottom>
            Companies ({companies.length})
          </Typography>
          <TableContainer component={Paper}>
            <Table>
              <TableHead>
                <TableRow>
                  <TableCell>Name</TableCell>
                  <TableCell>Slug</TableCell>
                  <TableCell>Users</TableCell>
                  <TableCell>Clinical Orders</TableCell>
                  <TableCell>Building Orders</TableCell>
                  <TableCell>Status</TableCell>
                  <TableCell>Created</TableCell>
                  <TableCell>Actions</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {companies.map((company) => (
                  <TableRow key={company.id}>
                    <TableCell>
                      <Box display="flex" alignItems="center" gap={1}>
                        <Business />
                        {company.name}
                      </Box>
                    </TableCell>
                    <TableCell>
                      <code>{company.slug}</code>
                    </TableCell>
                    <TableCell>
                      <Chip 
                        label={company.user_count || 0} 
                        size="small" 
                        color="primary"
                      />
                    </TableCell>
                    <TableCell>
                      <Chip 
                        label={company.maintenance_order_count || 0} 
                        size="small" 
                        color="secondary"
                      />
                    </TableCell>
                    <TableCell>
                      <Chip 
                        label={company.building_order_count || 0} 
                        size="small" 
                        color="info"
                      />
                    </TableCell>
                    <TableCell>
                      <Chip 
                        label={company.is_active ? 'Active' : 'Inactive'} 
                        size="small" 
                        color={company.is_active ? 'success' : 'default'}
                      />
                    </TableCell>
                    <TableCell>
                      {new Date(company.created_at).toLocaleDateString()}
                    </TableCell>
                    <TableCell>
                      <IconButton
                        size="small"
                        onClick={() => openEditDialog(company)}
                      >
                        <Edit />
                      </IconButton>
                      <IconButton
                        size="small"
                        color="error"
                        onClick={() => deleteCompany(company.id, company.name)}
                        disabled={company.user_count! > 0}
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

      {/* Company Dialog */}
      <Dialog open={dialogOpen} onClose={() => setDialogOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle>
          {editMode ? 'Edit Company' : 'Add New Company'}
        </DialogTitle>
        <DialogContent>
          <Box display="flex" flexDirection="column" gap={2} pt={2}>
            <TextField
              label="Company Name"
              value={companyForm.name}
              onChange={(e) => {
                const name = e.target.value
                setCompanyForm({ 
                  ...companyForm, 
                  name,
                  slug: companyForm.slug || generateSlug(name)
                })
              }}
              fullWidth
              required
            />
            <TextField
              label="Slug (URL identifier)"
              value={companyForm.slug}
              onChange={(e) => setCompanyForm({ 
                ...companyForm, 
                slug: e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, '-')
              })}
              fullWidth
              required
              helperText="Used in URLs. Only lowercase letters, numbers, and hyphens allowed."
            />
            <TextField
              select
              label="Status"
              value={companyForm.is_active ? 'active' : 'inactive'}
              onChange={(e) => setCompanyForm({
                ...companyForm,
                is_active: e.target.value === 'active'
              })}
              fullWidth
              SelectProps={{
                native: true
              }}
            >
              <option value="active">Active</option>
              <option value="inactive">Inactive</option>
            </TextField>
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDialogOpen(false)}>Cancel</Button>
          <Button 
            onClick={saveCompany} 
            variant="contained"
            disabled={!companyForm.name.trim() || !companyForm.slug.trim() || loading}
          >
            {editMode ? 'Update' : 'Create'} Company
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  )
}