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
  Alert,
  CircularProgress
} from '@mui/material'
import {
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
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)



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
    } catch (error: unknown) {
      console.error('Error fetching companies:', error)
      setError(error instanceof Error ? error.message : 'Failed to load companies')
    } finally {
      setLoading(false)
    }
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
        <Box>
          <Typography variant="h4">Company Management</Typography>
          <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
            Companies are automatically synchronized from building_orders data. No manual management required.
          </Typography>
        </Box>
        <Button
          variant="outlined"
          startIcon={<Refresh />}
          onClick={fetchCompanies}
          disabled={loading}
        >
          Refresh
        </Button>
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
                  <TableCell>Source</TableCell>
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
                      <code>{company.acronym}</code>
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
                      <Chip 
                        label="Auto-synced" 
                        size="small" 
                        color="info"
                        variant="outlined"
                      />
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
        </CardContent>
      </Card>

    </Box>
  )
}