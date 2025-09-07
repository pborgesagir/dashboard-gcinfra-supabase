'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/contexts/AuthContext'
import { CircularProgress, Box } from '@mui/material'

export default function Home() {
  const { user, userProfile, loading } = useAuth()
  const router = useRouter()

  useEffect(() => {
    if (!loading) {
      if (!user) {
        router.push('/auth/login')
      } else if (userProfile) {
        // Redirect based on role
        if (userProfile.role === 'admin') {
          router.push('/admin/dashboard')
        } else {
          router.push('/dashboard')
        }
      } else if (user && !userProfile) {
        // User exists but profile is null - redirect to login to retry auth
        console.warn('User exists but profile could not be loaded, redirecting to login')
        router.push('/auth/login')
      }
    }
  }, [user, userProfile, loading, router])

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
