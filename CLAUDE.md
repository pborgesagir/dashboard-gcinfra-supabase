# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

This is a Python-based maintenance dashboard application built with Streamlit that displays clinical engineering maintenance data. The application consists of two main components:

- **bi_dashboard.py**: Main Streamlit dashboard application with interactive visualizations
- **data_extraction.py**: Data extraction service that fetches maintenance data from external APIs and stores it in Supabase

## Architecture

The application follows a two-tier architecture:

1. **Data Layer**: `MaintenanceDataExtractor` class handles API integration with external maintenance systems and Supabase database operations
2. **Presentation Layer**: `MaintenanceDashboard` class in Streamlit provides interactive KPI visualizations, charts, and filtering capabilities

### Key Components

- **External API Integration**: Connects to Neovero maintenance system API for work orders and equipment data
- **Database**: Uses Supabase for data persistence with tables for maintenance orders and equipment
- **Visualization**: Plotly-based charts for maintenance KPIs, heatmaps, and performance metrics
- **Authentication**: Environment-based API token and database credentials

## Development Commands

### Running the Application
```bash
streamlit run bi_dashboard.py
```

### Data Extraction
```bash
python data_extraction.py
```

### Install Dependencies
```bash
pip install -r requirements.txt
```

## Configuration

The application requires environment variables set in `.env`:
- `SUPABASE_URL`: Supabase project URL
- `SUPABASE_KEY`: Supabase API key
- `API_TOKEN`: External API authentication token
- `API_USER`: External API username

Streamlit secrets are configured in `.streamlit/secrets.toml` for deployment.

## Automated Data Updates

A GitHub Action workflow (`.github/workflows/update_database.yml`) runs daily at 17:25 UTC to automatically extract and update maintenance data using `data_extraction.py`.

## Data Structure

The application works with maintenance data containing:
- Work orders (OS) with priorities, complexity levels, and timestamps
- Equipment information with serial numbers, models, and locations  
- Maintenance metrics like MTTR, MTBF, and availability calculations
- Cost tracking for parts, labor, and external services