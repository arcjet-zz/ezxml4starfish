# EzXML - Starfish Configuration Tool

A visual XML configuration tool for Starfish simulation software.

## Overview

EzXML is a web-based application that provides an intuitive interface for creating and managing Starfish simulation configurations. It eliminates the need for manual XML editing by offering visual geometry drawing and form-based parameter configuration.

**✅ Fully compatible with Starfish v0.25** - Features automatic type mapping and intelligent parameter configuration to ensure generated XML files work seamlessly with Starfish.

## Features

- 🎨 **Visual 2D Geometry Editor** - Draw simulation boundaries with point-and-click interface
- 📝 **Form-based Configuration** - Configure materials, sources, and interactions through user-friendly forms
- 📁 **Project Management** - Create, load, and export complete simulation projects
- 🔄 **XML Generation** - Automatically generate valid Starfish XML configuration files
- 💾 **Import/Export** - Load existing projects and export ready-to-run simulation packages
- 🎯 **Smart Type Mapping** - Automatically maps unsupported types to Starfish-compatible alternatives
- ⚙️ **Intelligent Defaults** - Provides appropriate default parameters for mapped types

## Quick Start

### Option 1: One-Click Start (Recommended)

**Windows:**
```bash
start.bat
```

**Linux/Mac:**
```bash
chmod +x start.sh
./start.sh
```

### Option 2: Docker Compose (Development)

```bash
# Start all services
docker-compose up -d

# Access the application
# Frontend: http://localhost:3000
# API Documentation: http://localhost:8000/docs
```

### Option 3: Production Deployment

**Quick Deploy:**
```bash
# Linux/macOS
./deploy.sh start

# Windows
deploy.bat start
```

**Access:**
- Frontend: http://localhost:3000
- API Documentation: http://localhost:3000/api/v1/docs

📖 **详细部署指南**: [DEPLOYMENT.md](./DEPLOYMENT.md) | [快速部署](./QUICK_DEPLOY.md)

### Option 4: Manual Setup

**Backend:**
```bash
cd backend
pip install -r requirements.txt
uvicorn app.main:app --reload --host 0.0.0.0 --port 8000
```

**Frontend:**
```bash
cd frontend
npm install
npm start
```

## Project Structure

```
ezxml/
├── backend/                 # FastAPI backend service
│   ├── app/
│   │   ├── main.py         # FastAPI application entry
│   │   ├── models/         # Pydantic data models
│   │   ├── api/            # API routes
│   │   ├── services/       # Business logic services
│   │   └── utils/          # Utility functions
│   └── requirements.txt    # Python dependencies
├── frontend/               # React frontend application
│   ├── src/
│   │   ├── components/     # React components
│   │   ├── pages/          # Page components
│   │   ├── services/       # API services
│   │   └── types/          # TypeScript type definitions
│   └── package.json
├── docker-compose.yml      # Docker Compose configuration
└── README.md              # Project documentation
```

## Technology Stack

- **Backend**: Python + FastAPI + Pydantic
- **Frontend**: React + TypeScript + Material-UI
- **Deployment**: Docker + Docker Compose

## API Documentation

The backend API follows OpenAPI 3.0 specification. After starting the backend service, you can access:
- Swagger UI: http://localhost:8000/docs
- ReDoc: http://localhost:8000/redoc

## Usage

1. **Create New Project**: Start with a blank simulation configuration
2. **Draw Geometry**: Use the visual editor to define simulation boundaries
3. **Configure Parameters**: Set up materials, sources, and global settings through forms
4. **Export Project**: Generate a complete Starfish-ready project package

## Target Users

- **Academic Researchers**: Students and researchers new to Starfish who need an intuitive way to create simulation configurations
- **Experienced Users**: Researchers who want to streamline repetitive configuration tasks and reduce manual XML editing errors

## License

This project is developed for academic and research purposes.
