'use client'

import { IconButton, Tooltip } from '@mui/material'
import { LightMode, DarkMode } from '@mui/icons-material'
import { useCustomTheme } from '@/components/providers/ThemeProvider'

export default function ThemeToggle() {
  const { isDarkMode, toggleTheme } = useCustomTheme()

  return (
    <Tooltip title={isDarkMode ? 'Alternar para modo claro' : 'Alternar para modo escuro'}>
      <IconButton 
        onClick={toggleTheme} 
        color="inherit"
        sx={{
          transition: 'transform 0.2s ease-in-out',
          '&:hover': {
            transform: 'scale(1.1)'
          }
        }}
      >
        {isDarkMode ? <LightMode /> : <DarkMode />}
      </IconButton>
    </Tooltip>
  )
}