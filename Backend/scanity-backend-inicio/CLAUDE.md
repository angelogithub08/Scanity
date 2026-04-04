# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Development Commands

### Build and Run

- `npm run build` - Build the application
- `npm run start` - Start the application
- `npm run start:dev` - Start in development mode with watch
- `npm run start:debug` - Start in debug mode with watch
- `npm run start:prod` - Start in production mode

### Testing

- `npm run test` - Run unit tests
- `npm run test:watch` - Run tests in watch mode
- `npm run test:cov` - Run tests with coverage report
- `npm run test:debug` - Run tests in debug mode
- `npm run test:e2e` - Run end-to-end tests

### Code Quality

- `npm run lint` - Run ESLint with auto-fix
- `npm run format` - Format code with Prettier

### Database

- `npm run db:migrate` - Run all pending migrations
- `npm run db:rollback` - Rollback the last migration
- `npm run db:seed` - Run database seeds
- `npx knex migrate:make <migration_name> -x ts` - Create new migration
- `npx knex migrate:up <migration_file>` - Run specific migration

### Code Generation

- `npx plop` - Interactive code generator for modules, auth, database setup, etc.

## Architecture Overview

### Core Framework

- **NestJS** application with TypeScript
- **Knex.js** for database operations with PostgreSQL
- **Swagger** for API documentation (available at `/api` in development)
- **Jest** for testing

### Database Architecture

- Uses Knex.js query builder with PostgreSQL
- Migration-based schema management
- Multi-tenant architecture with `accounts` as the root entity
- Main entities: accounts, users, departments, profiles, permissions
- Soft deletion pattern with `deleted_at` timestamps

### Project Structure

```
src/
├── app.module.ts           # Root application module
├── main.ts                 # Application entry point
├── infra/                  # Infrastructure layer
│   └── database/           # Database configuration and providers
├── modules/                # Business logic modules
│   └── accounts/           # Example module structure
│       ├── entities/       # Database entities
│       ├── dto/            # Data Transfer Objects
│       ├── *.controller.ts # HTTP controllers
│       ├── *.service.ts    # Business logic services
│       ├── *.repository.ts # Data access layer
│       └── *.module.ts     # Module definition
└── utils/                  # Utility functions
    ├── encrypt.util.ts     # Password hashing utilities
    └── swagger.util.ts     # Swagger configuration helpers
```

### Module Pattern

Each business module follows a consistent structure:

- **Entity**: Database model definition
- **DTOs**: Create, Update, and Params DTOs for request/response
- **Repository**: Data access layer using Knex.js
- **Service**: Business logic with comprehensive error handling
- **Controller**: HTTP endpoints with Swagger documentation
- **Module**: NestJS module definition with dependency injection

### Database Connection

- Uses custom Knex.js integration via `KNEX_CONNECTION` provider
- Configuration in `knexfile.ts` with environment-specific settings
- Connection string via `DB_CONNECTION_URI` environment variable

### Code Generation

The project uses Plop.js for consistent code generation:

- `plop module` - Generate complete CRUD module
- `plop auth` - Generate authentication module
- `plop database` - Setup database configuration
- `plop swagger` - Setup Swagger documentation
- `plop encrypt` - Setup password encryption utilities

### Repository Pattern

Repositories use a standardized interface:

- `findAll(params)` - Paginated results with filtering
- `list(params)` - Simple list without pagination
- `findOne(id)` - Single record by ID
- `create(dto)` - Create new record
- `update(id, dto)` - Update existing record
- `remove(id)` - Soft delete record

### Error Handling

Services implement comprehensive error handling:

- Structured logging with NestJS Logger
- Custom exception handling with appropriate HTTP status codes
- Consistent error message formatting
- Error propagation from repository to service to controller

### Configuration

- Environment-based configuration with dotenv
- CORS enabled for all origins in development
- Global validation pipes with class-validator
- Swagger documentation auto-generated from decorators

## Development Notes

### Database Migrations

- All migrations are in TypeScript format
- Use descriptive names: `npx knex migrate:make create_users_table -x ts`
- Follow the existing pattern with `id`, `created_at`, `updated_at`, `deleted_at`

### Module Creation

- Use `npx plop module` for consistent module generation
- Follow the established naming conventions (kebab-case for files, PascalCase for classes)
- Include comprehensive test files for both services and controllers

### Testing

- Unit tests for all services and controllers
- Mock external dependencies in tests
- Follow the established testing patterns in existing spec files

### Code Quality

- ESLint configuration allows `any` type but warns on unsafe operations
- Prettier for consistent formatting
- All TypeScript strict mode enabled
- Considere também essas regras .cursor/rules
