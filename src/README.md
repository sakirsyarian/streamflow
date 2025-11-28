# StreamFlow v2.1 - Feature-Based Architecture

## Directory Structure

```
src/
├── config/                    # Application configuration
│   ├── index.js              # Main config (env, paths, limits)
│   └── session.js            # Session configuration
│
├── core/                      # Core utilities & middleware
│   ├── database/
│   │   └── index.js          # Database connection & helpers
│   ├── middleware/
│   │   ├── auth.js           # Authentication middleware
│   │   ├── csrf.js           # CSRF protection
│   │   ├── rateLimiter.js    # Rate limiting
│   │   └── index.js          # Export all middleware
│   └── helpers/
│       └── viewHelpers.js    # EJS template helpers
│
├── features/                  # Feature modules (domain-driven)
│   ├── auth/                 # Authentication feature
│   │   ├── auth.controller.js
│   │   ├── auth.routes.js
│   │   ├── auth.service.js
│   │   └── index.js
│   │
│   ├── user/                 # User management feature
│   │   ├── user.controller.js
│   │   ├── user.routes.js
│   │   ├── user.service.js
│   │   └── index.js
│   │
│   ├── video/                # Video management feature
│   │   ├── video.controller.js
│   │   ├── video.routes.js
│   │   ├── video.service.js
│   │   └── index.js
│   │
│   ├── stream/               # Streaming feature
│   │   ├── stream.controller.js
│   │   ├── stream.routes.js
│   │   ├── stream.service.js
│   │   └── index.js
│   │
│   ├── playlist/             # Playlist feature
│   │   ├── playlist.controller.js
│   │   ├── playlist.routes.js
│   │   ├── playlist.service.js
│   │   └── index.js
│   │
│   ├── history/              # Stream history feature
│   │   ├── history.controller.js
│   │   ├── history.routes.js
│   │   ├── history.service.js
│   │   └── index.js
│   │
│   └── system/               # System & settings feature
│       ├── system.controller.js
│       ├── system.routes.js
│       └── index.js
│
├── shared/                    # Shared resources
│   ├── services/             # Shared services
│   │   └── index.js
│   └── utils/                # Shared utilities
│       └── index.js
│
└── app.js                     # Application entry point
```

## Architecture Principles

### 1. Separation of Concerns
- **Controllers**: Handle HTTP requests/responses
- **Services**: Business logic and data operations
- **Routes**: Define API endpoints
- **Middleware**: Cross-cutting concerns (auth, rate limiting)

### 2. Single Responsibility
Each module has one clear purpose:
- `auth` - Authentication & authorization
- `user` - User management
- `video` - Video operations
- `stream` - Streaming operations
- `playlist` - Playlist management
- `history` - Stream history
- `system` - System monitoring & settings

### 3. Feature-Based Organization
Code is organized by feature/domain rather than technical layer, making it easier to:
- Find related code
- Add new features
- Maintain existing features
- Test in isolation

### 4. Clean Code Practices
- Consistent naming conventions
- Small, focused functions
- Clear error handling
- Meaningful comments

### 5. KISS (Keep It Simple, Stupid)
- Simple, straightforward implementations
- Avoid over-engineering
- Clear data flow

## Running the Application

```bash
# Development (with hot reload)
npm run dev

# Production
npm start

# Legacy mode (original app.js)
npm run start:legacy
```

## Adding a New Feature

1. Create feature directory: `src/features/[feature-name]/`
2. Create files:
   - `[feature].controller.js` - HTTP handlers
   - `[feature].service.js` - Business logic
   - `[feature].routes.js` - Route definitions
   - `index.js` - Module exports
3. Register routes in `src/app.js`
4. Add to `src/features/index.js`

## Configuration

All configuration is centralized in `src/config/`:
- Environment variables
- Session settings
- Rate limits
- File paths

## Database

Database operations use promisified helpers:
- `dbRun(sql, params)` - INSERT, UPDATE, DELETE
- `dbGet(sql, params)` - SELECT single row
- `dbAll(sql, params)` - SELECT multiple rows
