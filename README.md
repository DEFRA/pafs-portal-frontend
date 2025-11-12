# PAFS Portal Frontend

[![License](https://img.shields.io/badge/license-OGL--UK--3.0-blue.svg)](http://www.nationalarchives.gov.uk/doc/open-government-licence/version/3)
[![Node.js Version](https://img.shields.io/badge/node-%3E%3D22-brightgreen.svg)](https://nodejs.org/)
[![Hapi.js](https://img.shields.io/badge/hapi.js-21.4-blue.svg)](https://hapi.dev/)
[![GOV.UK Frontend](https://img.shields.io/badge/GOV.UK%20Frontend-5.11-green.svg)](https://frontend.design-system.service.gov.uk/)
[![CDP](https://img.shields.io/badge/CDP-Core%20Delivery%20Platform-green.svg)](https://github.com/DEFRA/cdp-documentation)
[![Quality Gate Status](https://sonarcloud.io/api/project_badges/measure?project=DEFRA_pafs-portal-frontend&metric=alert_status)](https://sonarcloud.io/summary/new_code?id=DEFRA_pafs-portal-frontend)
[![Security Rating](https://sonarcloud.io/api/project_badges/measure?project=DEFRA_pafs-portal-frontend&metric=security_rating)](https://sonarcloud.io/summary/new_code?id=DEFRA_pafs-portal-frontend)
[![Coverage](https://sonarcloud.io/api/project_badges/measure?project=DEFRA_pafs-portal-frontend&metric=coverage)](https://sonarcloud.io/summary/new_code?id=DEFRA_pafs-portal-frontend)

Frontend web application for the **Project Application and Funding Service (PAFS)** built on the Core Delivery Platform (CDP). This service provides a user-friendly interface for managing flood and coastal erosion risk management project applications.

> **PAFS Portal** enables Risk Management Authorities (RMAs), Project Support Officers (PSOs), Environment Agency (EA) staff, and administrators to submit, review, and manage funding applications for flood and coastal erosion risk management projects across England.

## Features

- **GOV.UK Design System** - Accessible, user-friendly interface following government standards
- **Multi-Role Support** - Tailored experiences for RMAs, PSOs, EA staff, and administrators
- **Hapi.js Framework** - Robust server-side rendering with Nunjucks templates
- **Session Management** - Redis-backed sessions with Catbox caching
- **Automated Testing** - Comprehensive test coverage with Vitest
- **Docker Support** - Containerized deployment ready
- **CDP Integration** - Deployed on Core Delivery Platform
- **CI/CD Pipeline** - Automated testing and deployment via GitHub Actions
- **Webpack Build** - Optimized asset bundling and compilation
- **Monitoring & Logging** - Integrated observability with ECS logging

## User Roles

The portal supports four primary user roles:

- **RMA (Risk Management Authorities)** - Local authorities and other organizations submitting funding applications
- **PSO (Partnership and Strategic Overview)** - Officers who provide support and guidance to RMAs
- **EA (Environment Agency)** - Staff who review and approve funding applications
- **Administrators** - System administrators who manage users and system configuration

## Table of Contents

- [PAFS Portal Frontend](#pafs-portal-frontend)
  - [Features](#features)
  - [User Roles](#user-roles)
  - [Table of Contents](#table-of-contents)
  - [Requirements](#requirements)
    - [Node.js](#nodejs)
    - [Redis](#redis)
  - [Getting Started](#getting-started)
    - [Clone Repository](#clone-repository)
    - [Install Dependencies](#install-dependencies)
    - [VS Code Launch Configuration](#vs-code-launch-configuration)
  - [Local Development](#local-development)
    - [Run with npm](#run-with-npm)
    - [Run with VS Code](#run-with-vs-code)
    - [Testing](#testing)
    - [Production Mode](#production-mode)
    - [Npm Scripts](#npm-scripts)
  - [Server-side Caching](#server-side-caching)
  - [Development Helpers](#development-helpers)
    - [Proxy](#proxy)
    - [Update Dependencies](#update-dependencies)
    - [Formatting](#formatting)
      - [Windows Prettier Issue](#windows-prettier-issue)
  - [Docker](#docker)
    - [Development Image](#development-image)
    - [Production Image](#production-image)
    - [Docker Compose](#docker-compose)
  - [Related Links](#related-links)
  - [Environment Variables](#environment-variables)
    - [Local Development](#local-development-1)
    - [CDP Environments](#cdp-environments)
  - [Deployment](#deployment)
    - [CDP Deployment (Automated)](#cdp-deployment-automated)
  - [Additional Resources](#additional-resources)
    - [Dependabot](#dependabot)
    - [SonarCloud](#sonarcloud)
  - [Licence](#licence)
    - [About the licence](#about-the-licence)

## Requirements

### Node.js

**Required Version:** Node.js `>= v22` and npm `>= v9`

**Option 1: Using Node Version Manager (Recommended)**

1. Install [nvm (Node Version Manager)](https://github.com/nvm-sh/nvm):

   **Windows:**
   - Download and install [nvm-windows](https://github.com/coreybutler/nvm-windows/releases)

   **macOS/Linux:**

   ```bash
   curl -o- https://raw.githubusercontent.com/nvm-sh/nvm/v0.39.0/install.sh | bash
   ```

2. Install Node.js v22:

   ```bash
   nvm install 22
   nvm use 22
   ```

3. Verify installation:
   ```bash
   node --version  # Should show v22.x.x
   npm --version   # Should show v9.x.x or higher
   ```

**Option 2: Direct Installation**

Download and install Node.js v22+ from [nodejs.org](https://nodejs.org/)

**Using .nvmrc:**

This project includes an `.nvmrc` file. If you have nvm installed:

```bash
cd pafs-portal-frontend
nvm use
```

### Redis

Redis `>= v6` is required for session management in production environments.

**Local Development:**

- Redis is optional - the application uses in-memory caching by default
- For production-like testing, install Redis:
  - **Windows**: [Download Redis](https://redis.io/download) or use Docker
  - **Mac**: `brew install redis`
  - **Linux**: `sudo apt-get install redis-server`

## Getting Started

### Clone Repository

```bash
git clone https://github.com/DEFRA/pafs-portal-frontend.git
cd pafs-portal-frontend
```

### Install Dependencies

1. **Use the correct Node version (if using nvm):**

   ```bash
   nvm use
   ```

   This reads the version from `.nvmrc` file.

2. **Install dependencies:**
   ```bash
   npm install
   ```

### VS Code Launch Configuration

**Recommended approach for running the application in VS Code.**

1. **Create `.vscode/launch.json`** in the project root:

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

2. **Benefits of using launch.json:**
   - No need to create `.env` file
   - Can be committed to Git (no secrets)
   - Easy to switch between configurations
   - Integrated debugging in VS Code
   - Team members get the same setup

## Local Development

### Run with npm

To run the application in `development` mode:

```bash
npm run dev
```

This starts:

- **Webpack** in watch mode for frontend asset compilation
- **Nodemon** for automatic server restart on file changes

The server will start on `http://localhost:3000`

### Run with VS Code

**Option 1: Using VS Code (Recommended)**

1. Open the project in VS Code
2. Press `F5` or go to **Run and Debug** panel (Ctrl+Shift+D)
3. Select **Dev Server** configuration
4. Click the green play button or press `F5`

**Option 2: Command Line**

```bash
# Development mode (with hot reload)
npm run dev

# Production mode
npm start
```

The application will be available at **http://localhost:3000**

**VS Code Extensions (Recommended):**

- **Prettier** - Code formatter
- **ESLint** - JavaScript linting
- **Docker** - Container management
- **Nunjucks** - Template syntax highlighting

### Testing

To test the application run:

```bash
npm run test
```

**Test with coverage:**

```bash
npm run test
```

**Watch mode for development:**

```bash
npm run test:watch
```

### Production Mode

To mimic the application running in `production` mode locally:

```bash
npm start
```

This will:

1. Build frontend assets with Webpack
2. Start the server in production mode

### Npm Scripts

All available npm scripts:

```bash
npm run                    # List all scripts
npm run dev                # Start development server with hot reload
npm run test               # Run tests with coverage
npm run test:watch         # Run tests in watch mode
npm start                  # Start production server
npm run format             # Format code with Prettier
npm run format:check       # Check code formatting
npm run lint               # Lint JavaScript and SCSS
npm run lint:js:fix        # Auto-fix JavaScript linting issues
npm run build:frontend     # Build frontend assets
```

View all scripts in [package.json](./package.json).

## Server-side Caching

We use **Catbox** for server-side caching. By default:

- **Production/CDP**: Uses `CatboxRedis` for shared session storage
- **Local Development**: Uses `CatboxMemory` for simplicity

**Override default behavior:**

Set the `SESSION_CACHE_ENGINE` environment variable:

- `redis` - Use Redis (requires Redis server)
- `memory` - Use in-memory cache (not suitable for production)
- `false` - Disable caching

**Important:** CatboxMemory is _not_ suitable for production use! The cache will not be shared between instances and will not persist between restarts.

**Redis Configuration:**

Redis is an in-memory key-value store. All frontend services are given access to a namespaced prefix that matches the service name (e.g., `pafs-portal-frontend` will have access to everything in Redis prefixed with `pafs-portal-frontend`).

## Development Helpers

### Proxy

We are using forward-proxy which is set up by default. To make use of this: `import { fetch } from 'undici'` then
because of the `setGlobalDispatcher(new ProxyAgent(proxyUrl))` calls will use the ProxyAgent Dispatcher

If you are not using Wreck, Axios or Undici or a similar http that uses `Request`. Then you may have to provide the
proxy dispatcher:

To add the dispatcher to your own client:

```javascript
import { ProxyAgent } from 'undici'

return await fetch(url, {
  dispatcher: new ProxyAgent({
    uri: proxyUrl,
    keepAliveTimeout: 10,
    keepAliveMaxTimeout: 10
  })
})
```

### Update Dependencies

To update dependencies use [npm-check-updates](https://github.com/raineorshine/npm-check-updates):

```bash
ncu --interactive --format group
```

### Formatting

#### Windows Prettier Issue

If you are having issues with formatting of line breaks on Windows:

```bash
git config --global core.autocrlf false
```

## Docker

### Development Image

> [!TIP]
> For Apple Silicon users, you may need to add `--platform linux/amd64` to the `docker run` command to ensure
> compatibility. Example: `docker build --platform=linux/arm64 --no-cache --tag pafs-portal-frontend`

**Build:**

```bash
docker build --target development --no-cache --tag pafs-portal-frontend:development .
```

**Run:**

```bash
docker run -p 3000:3000 pafs-portal-frontend:development
```

### Production Image

**Build:**

```bash
docker build --no-cache --tag pafs-portal-frontend .
```

**Run:**

```bash
docker run -p 3000:3000 pafs-portal-frontend
```

### Docker Compose

A local environment with:

- **Localstack** - AWS services (S3, SQS)
- **Redis** - Session storage
- **MongoDB** - Database (if needed)
- **This service** - PAFS Portal Frontend
- **Backend API** - (commented out example)

**Start all services:**

```bash
docker compose up --build -d
```

**Stop all services:**

```bash
docker compose down
```

## Related Links

- **[PAFS Backend API](https://github.com/DEFRA/pafs-backend-api)** - Backend API for PAFS
- **[PAFS Prototype](https://github.com/DEFRA/pafs-prototype)** - GOV.UK Prototype Kit frontend for PAFS
- **[CDP Documentation](https://github.com/DEFRA/cdp-documentation)** - Core Delivery Platform documentation
- **[CDP PAFS Team](https://portal.cdp-int.defra.cloud/teams/pafs-updates)** - Manage team member, deployments and secrets of all PAFS services
- **[GOV.UK Design System](https://design-system.service.gov.uk/)** - Design patterns and components

## Environment Variables

### Local Development

**For Local Development:**

- Use `launch.json` (recommended) - See [VS Code Launch Configuration](#vs-code-launch-configuration)
- Environment variables can be set in launch configurations

**Available Variables:**

| Variable               | Description                                  | Default                        |
| ---------------------- | -------------------------------------------- | ------------------------------ |
| `NODE_ENV`             | Environment mode                             | `development`                  |
| `PORT`                 | Server port                                  | `3000`                         |
| `LOG_LEVEL`            | Logging level                                | `info`                         |
| `SESSION_CACHE_ENGINE` | Cache engine (`redis`, `memory`, or `false`) | `memory` (dev), `redis` (prod) |

### CDP Environments

**All environment variables and secrets are managed via CDP Portal:**

1. Go to [CDP Portal](https://portal.cdp-int.defra.cloud/)
2. Navigate to your service → **Secrets** tab
3. Add secrets as key-value pairs
4. Re-deploy the service

**Never commit secrets to Git!**

## Deployment

### CDP Deployment (Automated)

Deployment to CDP environments is automated via GitHub Actions:

1. **Push to main branch** → Triggers build and test
2. **Tests pass** → Docker image is built
3. **Image published** → Available in CDP artifact repository
4. **Deploy via CDP Portal** → Select environment and deploy

**Workflow:** `.github/workflows/publish.yml`

**Manual Deployment:**

1. Go to [CDP Portal](https://portal.cdp-int.defra.cloud/)
2. Select **pafs-portal-frontend** service
3. Choose target environment (dev, test, prod)
4. Select image version
5. Click **Deploy**

## Additional Resources

### Dependabot

We have added an example dependabot configuration file to the repository. You can enable it by renaming
the [.github/example.dependabot.yml](.github/example.dependabot.yml) to `.github/dependabot.yml`

### SonarCloud

Instructions for setting up SonarCloud can be found in [sonar-project.properties](./sonar-project.properties).

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
