'use client'

import { ReactNode, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/contexts/AuthContext'
import { Box, CircularProgress } from '@mui/material'

interface ProtectedRouteProps {
  children: ReactNode
  requiredRole?: 'admin' | 'manager'
}

export default function ProtectedRoute({ children, requiredRole }: ProtectedRouteProps) {
  const { user, userProfile, loading } = useAuth()
  const router = useRouter()

  useEffect(() => {
    if (!loading) {
      // Not authenticated
      if (!user) {
        router.push('/auth/login')
        return
      }

      // Authenticated but no profile (shouldn't happen)
      if (!userProfile) {
        console.error('User authenticated but no profile found')
        router.push('/auth/login')
        return
      }

      // Check role requirements
      if (requiredRole && userProfile.role !== requiredRole) {
        // Redirect based on user's actual role
        if (userProfile.role === 'admin') {
          router.push('/admin/dashboard')
        } else {
          router.push('/dashboard')
        }
        return
      }
    }
  }, [user, userProfile, loading, requiredRole, router])

  // Show loading spinner while checking authentication
  if (loading) {
    return (
      <Box
        display="flex"
        alignItems="center"
        justifyContent="center"
        minHeight="100vh"
      >
        <CircularProgress />
      </Box>
    )
  }

  // Don't render children until authentication is confirmed
  if (!user || !userProfile) {
    return null
  }

  // Check role access
  if (requiredRole && userProfile.role !== requiredRole) {
    return null
  }

  return <>{children}</>
}