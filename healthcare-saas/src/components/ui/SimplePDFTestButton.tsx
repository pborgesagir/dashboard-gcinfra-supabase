'use client'

import React from 'react'
import { Button } from '@mui/material'
import { PictureAsPdf as PdfIcon } from '@mui/icons-material'

interface SimplePDFTestButtonProps {
  disabled?: boolean
}

export default function SimplePDFTestButton({ disabled = false }: SimplePDFTestButtonProps) {
  const handleClick = () => {
    alert('Botão PDF funcionando!')
  }

  return (
    <Button
      variant="contained"
      startIcon={<PdfIcon />}
      onClick={handleClick}
      disabled={disabled}
      sx={{
        bgcolor: '#d32f2f',
        '&:hover': {
          bgcolor: '#b71c1c'
        }
      }}
    >
      Exportar PDF (Teste)
    </Button>
  )
}