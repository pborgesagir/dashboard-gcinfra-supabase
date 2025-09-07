'use client'

import { createContext, useContext, useEffect, useState, ReactNode } from 'react'
import { User, Session } from '@supabase/supabase-js'
import { supabase } from '@/lib/supabase/client'
import { UserRole } from '@/lib/supabase/database.types'

export interface UserProfile {
  id: string
  email: string
  role: UserRole
  company_id: string | null
  company?: {
    id: string
    name: string
    acronym: string
  }
}

interface AuthContextType {
  user: User | null
  userProfile: UserProfile | null
  session: Session | null
  loading: boolean
  signInWithEmail: (email: string, password: string) => Promise<{ error: Error | null }>
  signOut: () => Promise<void>
  isAdmin: boolean
  isManager: boolean
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export const useAuth = () => {
  const context = useContext(AuthContext)
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider')
  }
  return context
}

interface AuthProviderProps {
  children: ReactNode
}

export const AuthProvider = ({ children }: AuthProviderProps) => {
  const [user, setUser] = useState<User | null>(null)
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null)
  const [session, setSession] = useState<Session | null>(null)
  const [loading, setLoading] = useState(true)

  const fetchUserProfile = async (userId: string): Promise<UserProfile | null> => {
    try {
      const { data, error } = await supabase
        .from('users')
        .select(`
          id,
          email,
          role,
          company_id,
          companies:company_id (
            id,
            name,
            acronym
          )
        `)
        .eq('id', userId)
        .single()

      if (error) {
        console.error('Error fetching user profile:', error)
        return null
      }

      return {
        id: data.id,
        email: data.email,
        role: data.role,
        company_id: data.company_id,
        company: data.companies ? {
          id: data.companies.id,
          name: data.companies.name,
          acronym: data.companies.acronym
        } : undefined
      } as UserProfile
    } catch (error) {
      console.error('Error fetching user profile:', error)
      return null
    }
  }

  const signInWithEmail = async (email: string, password: string) => {
    const { error } = await supabase.auth.signInWithPassword({
      email,
      password
    })
    return { error }
  }

  const signOut = async () => {
    await supabase.auth.signOut()
    setUser(null)
    setUserProfile(null)
    setSession(null)
  }

  useEffect(() => {
    // Get initial session
    const getInitialSession = async () => {
      try {
        const { data: { session } } = await supabase.auth.getSession()
        setSession(session)
        setUser(session?.user || null)
        
        if (session?.user) {
          const profile = await fetchUserProfile(session.user.id)
          setUserProfile(profile)
        }
      } catch (error) {
        console.error('Error getting initial session:', error)
      } finally {
        setLoading(false)
      }
    }

    // Set a timeout to prevent indefinite loading
    const timeout = setTimeout(() => {
      console.warn('Auth initialization timeout, setting loading to false')
      setLoading(false)
    }, 10000) // 10 seconds timeout

    getInitialSession().then(() => clearTimeout(timeout))

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        try {
          setSession(session)
          setUser(session?.user || null)
          
          if (session?.user) {
            const profile = await fetchUserProfile(session.user.id)
            setUserProfile(profile)
          } else {
            setUserProfile(null)
          }
        } catch (error) {
          console.error('Error handling auth state change:', error)
        } finally {
          setLoading(false)
        }
      }
    )

    return () => {
      clearTimeout(timeout)
      subscription.unsubscribe()
    }
  }, [])

  const value = {
    user,
    userProfile,
    session,
    loading,
    signInWithEmail,
    signOut,
    isAdmin: userProfile?.role === 'admin',
    isManager: userProfile?.role === 'manager'
  }

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  )
}