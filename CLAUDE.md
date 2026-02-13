# CLAUDE.md

This file provides essential guidance for Claude Code instances working on this codebase. It captures non-obvious architectural patterns, development commands, and key technical decisions that require reading multiple files to understand.

---

## Development Commands

### Core Commands
```bash
npm run dev          # Start development server on 0.0.0.0:8080
npm run build        # Production build with TypeScript checking
npm run build:test   # Staging build (uses .env.stag)
npm run lint         # Run ESLint with auto-fix
```

### Environment Configuration
- Environment files are located in `env/` directory
- `.env` - Development environment
- `.env.production` - Production environment
- `.env.stag` - Staging environment
- Configuration includes API backend host and DJI app credentials (appId, appKey, appLicense)

### Testing
- No testing framework is currently configured in this project

---

## Architecture Overview

### Core Technology Stack
- **Framework**: React 18.2 with TypeScript 5.3
- **Build Tool**: Vite 5.1
- **State Management**: Zustand (lightweight state management)
- **Routing**: React Router v6
- **UI Library**: Ant Design (antd)

### Key Third-Party Integrations
- **Agora SDK**: Real-time video streaming for drone livestreams
- **MQTT.js**: Pub-sub messaging for device telemetry and commands
- **AMap (高德地图)**: Map visualization and geospatial operations
- **reconnecting-websocket**: Auto-reconnecting WebSocket client

### Directory Structure Highlights
```
src/
├── pages/
│   ├── page-web/          # Desktop web platform UI
│   └── page-pilot/        # Mobile pilot app UI
├── api/                   # HTTP API client (modular by domain)
├── websocket/             # WebSocket client infrastructure
├── mqtt/                  # MQTT client (UranusMqtt class)
├── store/                 # Zustand state stores (per domain)
├── hooks/                 # Custom React hooks (map, websocket, etc.)
├── components/            # Reusable UI components
├── event-bus/             # EventEmitter-based event bus (mitt)
└── types/                 # TypeScript type definitions
```

---

## Communication Layers

This application uses a **three-layer communication strategy** for different purposes:

### 1. HTTP (Axios)
- **Purpose**: CRUD operations, authentication, configuration management
- **Location**: `src/api/` (modular structure)
- **Key Files**:
  - `src/api/http/request.ts` - Axios instance with interceptors
  - `src/api/http/config.ts` - Base URL and credentials configuration
- **Usage**: User login, device management, wayline CRUD, media queries, firmware updates

### 2. WebSocket (ReconnectingWebSocket)
- **Purpose**: Real-time bidirectional updates and notifications
- **Location**: `src/websocket/`
- **Key Class**: `ConnectWebSocket` (src/websocket/index.ts)
- **Features**: Auto-reconnection (5s-20s delay, max 5 retries)
- **Usage**: Device online/offline events, OSD (On-Screen Display) updates, flight task progress, HMS (Health Management System) alerts

### 3. MQTT (mqtt.js)
- **Purpose**: Pub-sub messaging for device telemetry and command/control
- **Location**: `src/mqtt/`
- **Key Class**: `UranusMqtt` (src/mqtt/index.ts, extends EventEmitter3)
- **Usage**: Subscribe to device telemetry topics, publish control commands to drones/docks

**Guideline**: Use HTTP for request-response, WebSocket for server-push notifications, and MQTT for device-level pub-sub communication.

---

## State Management Pattern

This codebase uses a **hybrid state management approach**:

### 1. Zustand Stores (Domain-Specific)
Stores are modular and organized by domain in `src/store/`:
- `useDeviceStore` - Device/drone/dock state and online status
- `useLivestreamStore` - Video stream state (Agora)
- `useLayerStore` - Map layer visibility and configuration
- `useWaylineStore` - Flight route/wayline data
- `useMqttStore` - MQTT connection state and subscriptions

**Pattern**: Each store manages its own domain. Components subscribe to only the slices they need.

### 2. EventBus (Cross-Component Communication)
- **Location**: `src/event-bus/` (uses `mitt` library)
- **Purpose**: Decouple communication between unrelated components
- **Common Events**: Device state changes, map interactions, WebSocket message routing
- **Usage Pattern**: Components emit events, other components listen without direct coupling

### 3. React Context (Shared Instances)
- **MapContext**: Shares AMap instance across components (see `src/hooks/use-g-map.ts`)
- **Usage**: Prevents prop drilling for map-related operations

**Guideline**: Use Zustand for domain state, EventBus for cross-cutting concerns, and Context for shared singleton instances.

---

## API Layer Organization

The API layer follows a **modular, domain-driven structure** in `src/api/`:

### Modular API Files
Each domain has its own API module:
- `manage.ts` - User authentication and workspace management
- `device.ts` - Device/drone/dock CRUD and status queries
- `wayline.ts` - Flight route management
- `live-stream.ts` - Livestream control (start/stop/quality)
- `device-cmd.ts` - Device command execution (reboot, format, open/close cover, etc.)
- `device-setting.ts` - Device configuration updates
- `device-firmware.ts` - OTA firmware upgrade
- `device-log.ts` - Device log download
- `flight-area.ts` - Custom flight area (geofencing)
- `drone-control.ts` - Flight control commands (fly-to-point, takeoff, DRC mode)

### Centralized HTTP Client
- **Axios Instance**: `src/api/http/request.ts`
- **Interceptors**: Adds auth token, handles errors, processes responses
- **Configuration**: `src/api/http/config.ts` (base URL from env variables)

**Guideline**: When adding new API endpoints, create a new module or extend existing domain modules. Never inline axios calls in components.

---

## Key Architectural Decisions

### 1. Dual Platform Support
This codebase serves **two distinct UIs from a single repository**:
- **Desktop Web Platform** (`src/pages/page-web/`): Full-featured drone fleet management
- **Mobile Pilot App** (`src/pages/page-pilot/`): Simplified interface for drone pilots

**Implication**: Routes, components, and state are shared where possible, but UI diverges significantly. Check `src/router/` for routing logic.

### 2. Lazy-Loaded Pages
All pages use `React.lazy()` for code splitting (see `src/router/`). This reduces initial bundle size for faster load times.

### 3. Map-Centric UI Design
The web platform is built around **AMap (高德地图)** as the primary UI:
- Map instance is initialized in `use-g-map.ts` and shared via MapContext
- Custom hooks (`use-g-map-cover.ts`, `use-g-map-tsa.ts`, `use-mouse-tool.ts`) provide map drawing/editing capabilities
- Drone positions, waylines, and geofences are rendered as map overlays

**Implication**: Most features interact with the map. When adding features, check if map integration is needed.

### 4. Domain Isolation Pattern
State, API, and business logic are **isolated by domain** (devices, waylines, livestream, etc.). This reduces coupling and makes it easier to modify one domain without affecting others.

**Guideline**: When adding new features, follow this isolation pattern. Create domain-specific stores, API modules, and components.

---

## Configuration Files

### DJI Cloud API Credentials
Critical configuration is in `src/api/http/config.ts`:
- `appId`, `appKey`, `appLicense` - Required for DJI Cloud API authentication
- `baseURL` - Backend API gateway URL (from environment variables)

**Important**: Never hardcode credentials. Use environment variables in `env/` directory.

### Build Configuration
- `vite.config.ts` - Vite build configuration with path aliases (`@/` → `src/`)
- `tsconfig.json` - TypeScript compiler options (strict mode enabled)
- `package.json` - Dependencies and scripts

---

## Common Patterns to Follow

### Adding a New API Endpoint
1. Add the endpoint to the appropriate module in `src/api/` (or create a new one)
2. Define TypeScript types in `src/types/`
3. Use the centralized axios instance from `src/api/http/request.ts`
4. Handle errors gracefully (use Ant Design `message` for user feedback)

### Adding a New WebSocket Event
1. Define the event in `src/types/enums.ts` under `EBizCode`
2. Handle the event in the WebSocket message handler (check `src/hooks/use-connect-websocket.ts`)
3. Emit to EventBus if multiple components need to react
4. Update relevant Zustand store if state needs to persist

### Adding a New Map Feature
1. Use `useGMap()` hook to access map instance
2. For drawing/editing, use `useMouseTool()` or `useMapTool()`
3. Store map elements in `useLayerStore` for visibility toggling
4. Follow AMap API documentation for overlay types (Marker, Polyline, Polygon, etc.)

---

**Last Updated**: 2026-02-13
