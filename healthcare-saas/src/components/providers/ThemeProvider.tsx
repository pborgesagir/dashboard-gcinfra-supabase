'use client'

import { ReactNode, createContext, useContext, useState, useEffect } from 'react'
import { ThemeProvider as MuiThemeProvider } from '@mui/material/styles'
import CssBaseline from '@mui/material/CssBaseline'
import { createTheme, Theme } from '@mui/material/styles'

const lightTheme = createTheme({
  palette: {
    mode: 'light',
    primary: {
      main: '#1976d2',
    },
    secondary: {
      main: '#dc004e',
    },
    background: {
      default: '#f5f5f5',
      paper: '#ffffff',
    },
  },
  typography: {
    fontFamily: 'Inter, sans-serif',
  },
})

const darkTheme = createTheme({
  palette: {
    mode: 'dark',
    primary: {
      main: '#90caf9',
    },
    secondary: {
      main: '#f48fb1',
    },
    background: {
      default: '#121212',
      paper: '#1e1e1e',
    },
  },
  typography: {
    fontFamily: 'Inter, sans-serif',
  },
})

interface ThemeContextType {
  isDarkMode: boolean
  toggleTheme: () => void
  theme: Theme
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined)

export const useCustomTheme = () => {
  const context = useContext(ThemeContext)
  if (context === undefined) {
    throw new Error('useCustomTheme must be used within a ThemeProvider')
  }
  return context
}

interface ThemeProviderProps {
  children: ReactNode
}

export default function ThemeProvider({ children }: ThemeProviderProps) {
  const [isDarkMode, setIsDarkMode] = useState(false)
  const [isInitialized, setIsInitialized] = useState(false)

  // Load theme preference from localStorage on component mount
  useEffect(() => {
    // Only run on client side
    if (typeof window !== 'undefined') {
      const savedTheme = localStorage.getItem('theme-mode')
      if (savedTheme === 'dark') {
        setIsDarkMode(true)
      } else if (savedTheme === 'light') {
        setIsDarkMode(false)
      } else {
        // Auto-detect system preference
        setIsDarkMode(window.matchMedia('(prefers-color-scheme: dark)').matches)
      }
    }
    setIsInitialized(true)
  }, [])

  // Save theme preference to localStorage whenever it changes (but only after initialization)
  useEffect(() => {
    if (isInitialized && typeof window !== 'undefined') {
      localStorage.setItem('theme-mode', isDarkMode ? 'dark' : 'light')
    }
  }, [isDarkMode, isInitialized])

  const toggleTheme = () => {
    setIsDarkMode(prev => !prev)
  }

  const currentTheme = isDarkMode ? darkTheme : lightTheme

  const contextValue: ThemeContextType = {
    isDarkMode,
    toggleTheme,
    theme: currentTheme
  }

  // Don't render until theme is initialized to prevent hydration mismatch
  if (!isInitialized) {
    return null
  }

  return (
    <ThemeContext.Provider value={contextValue}>
      <MuiThemeProvider theme={currentTheme}>
        <CssBaseline />
        {children}
      </MuiThemeProvider>
    </ThemeContext.Provider>
  )
}