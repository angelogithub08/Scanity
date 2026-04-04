# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Common Development Commands

### Development

- `quasar dev` - Start development server with hot-reload
- `npm run dev` - Alternative command for development server

### Build and Deploy

- `quasar build` - Build for production
- `npm run build:prod` - Build and deploy to production server (copies to /www/wwwroot/app2.meugarcon.com.br/public/)

### Code Quality

- `npm run lint` - Lint TypeScript and Vue files using ESLint
- `npm run format` - Format code using Prettier
- No test command configured (test script just exits)

### Code Generation

- `npx plop` - Interactive code generator for components, pages, CRUD operations, dashboards
- `npx plop setup` - Initialize basic project components and composables
- `npx plop crud-pages` - Generate complete CRUD pages with interfaces, resources, and stores
- `npx plop component` - Generate individual Vue components
- `npx plop dashboard` - Generate dashboard pages with chart components

## Project Architecture

### Framework Stack

- **Frontend Framework**: Vue 3 with Composition API
- **UI Framework**: Quasar Framework v2 (Material Design components)
- **Build Tool**: Vite (via Quasar CLI)
- **State Management**: Pinia stores
- **Routing**: Vue Router 4
- **Language**: TypeScript with strict mode enabled
- **Styling**: SCSS with Quasar variables

### Key Dependencies

- **Rich Text Editor**: TipTap with extensions for tables, links, images, task lists
- **Charts**: ApexCharts with Vue3 integration
- **API Client**: Axios for HTTP requests
- **WebSocket**: Socket.io-client for real-time features
- **Utilities**: Lodash, dayjs for date handling, maska for input masking
- **Drag & Drop**: vuedraggable for Kanban board functionality
- **QR Code**: qrcode library for QR code generation
- **Currency**: v-money3 for currency input formatting

### Directory Structure

#### Core Application Files

- `src/App.vue` - Root Vue component
- `src/boot/` - Quasar boot files for plugins (axios, i18n, apexcharts, money, maska)
- `src/layouts/` - Page layouts (MainLayout.vue, AuthLayout.vue)
- `src/router/` - Vue Router configuration and route definitions

#### Feature Organization

- `src/pages/` - Page components organized by feature modules
- `src/components/` - Reusable Vue components organized by domain
- `src/stores/` - Pinia stores for each feature module
- `src/interfaces/` - TypeScript interfaces for data models
- `src/composables/` - Composition API functions and utilities

#### Business Domain Structure

This is a legal workflow management system (Scanity) for managing leads, customers, and sales with the following modules:

- **Authentication**: Login, user management, token-based auth
- **Lead Management**: Leads with status tracking, notes, interactions, tags
- **Kanban/Board System**: Visual boards with columns for lead pipeline management (drag-and-drop)
- **Customer Management**: Customer records and relationships
- **Sales**: Sales tracking and management
- **Areas**: Legal practice areas or service categories
- **Origins**: Lead source tracking
- **Products**: Service/product catalog
- **Lost Reasons**: Tracking why leads are lost
- **Notifications**: System notifications
- **Logs**: Activity logging and audit trail

### State Management Pattern

Each feature module follows this Pinia store pattern:

- Resource composables in `src/composables/api/` handle API calls
- Stores in `src/stores/` manage local state and business logic
- Interfaces in `src/interfaces/` define TypeScript models

### Component Architecture

- **Shared Components**: Generic reusable components in `src/components/shared/`
- **Feature Components**: Domain-specific components organized by module
- **Page Structure**: Consistent list/record page pattern using DefaultPage wrapper
- **Form Handling**: Centralized validation using useValidation composable

### Real-time Features

- WebSocket integration for live updates via Socket.io
- Real-time board/Kanban updates for collaborative lead management
- Notification system

### Code Generation System

Extensive Plop.js templates for rapid development:

- **CRUD page generation**: Automatically creates interface, list page, and record page with form
- **Component scaffolding**: Consistent component patterns
- **Dashboard creation**: Creates counter cards, chart cards, and table cards
- **Field definitions**: Use format `name: type; email: string; phone: string;`
- **Field markers**: `[optional]`, `[email]`, `[phone]`, `[document]`, `[zipcode]`, `[state]`, `[price]`, `[number]`
- **Auto-detection**: Automatically applies validation based on field names (email, phone, document, etc.)
- **Form columns**: Configure 1-4 column layouts for forms

### Configuration Files

- `quasar.config.ts` - Main Quasar configuration with Vite plugins
- `eslint.config.js` - ESLint configuration with Vue and TypeScript rules
- `tsconfig.json` - TypeScript configuration extending Quasar defaults
- `plopfile.js` - Comprehensive code generation templates and documentation

### Development Workflow

1. Use Plop generators for consistent code scaffolding
2. Follow established patterns for stores, composables, and components
3. Leverage existing validation, formatting, and utility composables
4. Maintain TypeScript strict mode compliance
5. Use ESLint and Prettier for code quality

### API Integration

- Centralized axios configuration in boot file
- Resource pattern for API endpoints with composables
- Consistent error handling through useHandleException
- File upload utilities through useFiles composable

### Coding Conventions (from .cursor/rules)

- **Commit messages**: Use Conventional Commits format in Portuguese (pt-BR)
- **Functions**: Use traditional function syntax (`function name() {}`) instead of arrow functions unless necessary
- **Vue components**:
  - Prioritize Quasar components over custom implementations
  - Use Quasar helper classes instead of custom CSS when possible
  - Implement responsive designs
- **TypeScript interfaces**: Database-related properties use snake_case
- **Composables**: Reuse existing composables from `src/composables/` before creating new utilities

### Available Composables

#### API Resources (`src/composables/api/`)

- useAuthResource, useLeadsResource, useCustomersResource, useSalesResource
- useBoardsResource, useBoardColumnsResource, useBoardColumnLeadsResource
- useUsersResource, useAreasResource, useOriginsResource, useProductsResource
- useTagsResource, useLeadTagsResource, useLeadNotesResource, useLeadInteractionsResource
- useTokensResource, useNotificationsResource, useLogsResource, useLostReasonsResource
- useAccountsResource, useDashboardsResource, useViaCepsResource

#### Utilities (`src/composables/`)

- useValidation - Form validation
- useHandleException - Error handling
- useFiles - File upload/download
- useDate - Date formatting and manipulation
- useCurrency - Currency formatting
- useMask - Input masking
- useString - String utilities
- useClipboard - Clipboard operations
- useCache - Caching utilities
- useBase64 - Base64 encoding/decoding
- useAudio - Audio playback
- useKanban - Kanban board utilities
- useWebsocket - WebSocket connection management
- useOptions - Select option formatting
- useDownload - File download utilities
