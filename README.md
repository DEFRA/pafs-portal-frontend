# PAFS Portal Frontend

[![License](https://img.shields.io/badge/license-OGL--UK--3.0-blue.svg)](http://www.nationalarchives.gov.uk/doc/open-government-licence/version/3)
[![Node.js](https://img.shields.io/badge/node-22-brightgreen.svg)](https://nodejs.org/)
[![Hapi.js](https://img.shields.io/badge/hapi.js-21-blue.svg)](https://hapi.dev/)
[![GOV.UK Frontend](https://img.shields.io/badge/GOV.UK-6.x-green.svg)](https://frontend.design-system.service.gov.uk/)
[![CDP](https://img.shields.io/badge/CDP-Platform-green.svg)](https://github.com/DEFRA/cdp-documentation)
[![Quality Gate Status](https://sonarcloud.io/api/project_badges/measure?project=DEFRA_pafs-portal-frontend&metric=alert_status)](https://sonarcloud.io/summary/new_code?id=DEFRA_pafs-portal-frontend)
[![Security Rating](https://sonarcloud.io/api/project_badges/measure?project=DEFRA_pafs-portal-frontend&metric=security_rating)](https://sonarcloud.io/summary/new_code?id=DEFRA_pafs-portal-frontend)
[![Coverage](https://sonarcloud.io/api/project_badges/measure?project=DEFRA_pafs-portal-frontend&metric=coverage)](https://sonarcloud.io/summary/new_code?id=DEFRA_pafs-portal-frontend)

Frontend web application for the Project Application and Funding Service (PAFS) - managing flood and coastal erosion risk management project applications.

## Overview

**Purpose:** User interface for RMAs, PSOs, EA staff, and administrators to manage funding applications

**Tech Stack:**

- Node.js 22 + Hapi.js 21
- GOV.UK Frontend 6.x + Nunjucks
- Redis sessions (production) / Memory (development)
- Webpack 5 + Vitest
- Docker + CDP deployment

**User Roles:**

- **RMA** - Submit funding applications
- **PSO** - Support and guidance
- **EA Staff** - Review and approve
- **Admin** - User and system management

## Table of Contents

- [Requirements](#requirements)
- [Quick Start](#quick-start)
- [VS Code Setup](#vs-code-setup)
- [Development](#development)
- [Session Caching](#session-caching)
- [Docker](#docker)
- [Environment Variables](#environment-variables)
- [Deployment](#deployment)
- [Related Links](#related-links)
- [Licence](#licence)

## Requirements

**Node.js:** >= 22  
**npm:** >= 11  
**Redis:** >= 7 (production only, optional for development)

**Install Node.js:**

```bash
# Using nvm (recommended)
nvm install 22
nvm use 22

# Or download from nodejs.org
```

## Quick Start

```bash
# Clone repository
git clone https://github.com/DEFRA/pafs-portal-frontend.git
cd pafs-portal-frontend

# Install dependencies
nvm use  # Use Node version from .nvmrc
npm install

# Run development server
npm run dev
```

Application runs at `http://localhost:3000`

## VS Code Setup

**Recommended for debugging and development.**

Create `.vscode/launch.json`:

```json
{
  "version": "0.2.0",
  "configurations": [
    {
      "type": "node",
      "request": "launch",
      "name": "Dev Server",
      "runtimeExecutable": "npm",
      "runtimeArgs": ["run", "dev"],
      "skipFiles": ["<node_internals>/**"],
      "console": "integratedTerminal",
      "env": {
        "NODE_ENV": "development",
        "PORT": "3000"
      }
    }
  ]
}
```

**Run:** Press `F5` or use Run and Debug panel

## Development

**Run Development Server:**

```bash
npm run dev  # Webpack + Nodemon with hot reload
```

**Run Tests:**

```bash
npm test              # Run tests with coverage
npm run test:watch    # Watch mode
```

**Available Scripts:**

```bash
npm run dev           # Development server
npm start             # Production server
npm test              # Run tests
npm run lint          # Lint code
npm run format        # Format code
npm run build:frontend # Build assets
```

## Session Caching

**Production:** Redis (ElastiCache) - Distributed sessions  
**Development:** Catbox Memory - In-memory cache

**Override:**

```bash
SESSION_CACHE_ENGINE=redis  # Use Redis
SESSION_CACHE_ENGINE=memory # Use memory
```

## Docker

**Build:**

```bash
# Development
docker build --target development -t pafs-portal-frontend:dev .

# Production
docker build -t pafs-portal-frontend .
```

**Run:**

```bash
docker run -p 3000:3000 pafs-portal-frontend
```

**Docker Compose:**

```bash
docker compose up --build -d  # Start all services
docker compose down           # Stop all services
```

## Environment Variables

| Variable               | Description     | Default                        |
| ---------------------- | --------------- | ------------------------------ |
| `NODE_ENV`             | Environment     | `development`                  |
| `PORT`                 | Server port     | `3000`                         |
| `LOG_LEVEL`            | Log level       | `info`                         |
| `SESSION_CACHE_ENGINE` | Cache engine    | `memory` (dev), `redis` (prod) |
| `API_BASE_URL`         | Backend API URL | -                              |

**CDP Environments:** Manage secrets via [CDP Portal](https://portal.cdp-int.defra.cloud/)

## Deployment

**Automated (GitHub Actions):**

1. Push to `main` → Build & test
2. Tests pass → Docker image built
3. Image published to CDP
4. Deploy via CDP Portal

**Manual:**

- [CDP Portal](https://portal.cdp-int.defra.cloud/) → Select service → Choose environment → Deploy

## Related Links

- [PAFS Backend API](https://github.com/DEFRA/pafs-backend-api)
- [CDP Documentation](https://github.com/DEFRA/cdp-documentation)
- [GOV.UK Design System](https://design-system.service.gov.uk/)

## Licence

THIS INFORMATION IS LICENSED UNDER THE CONDITIONS OF THE OPEN GOVERNMENT LICENCE found at:

<http://www.nationalarchives.gov.uk/doc/open-government-licence/version/3>

The following attribution statement MUST be cited in your products and applications when using this information.

> Contains public sector information licensed under the Open Government license v3

### About the licence

The Open Government Licence (OGL) was developed by the Controller of Her Majesty's Stationery Office (HMSO) to enable
information providers in the public sector to license the use and re-use of their information under a common open
licence.

It is designed to encourage use and re-use of information freely and flexibly, with only a few conditions.
