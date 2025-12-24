I'm building a worker tracking system for online jobs. Managers add taskers and accounts (Outlier/Handshake types). Each account runs on specific browsers (IX Browser/GoLogin/MoreLogin) with hourly rates. Handshake accounts require hourly task submissions (Task ID + screenshot + timestamp). The system tracks work sessions and calculates payments automatically. Phase 1: Foundation & Authentication (Week 1-2)

### Goal

Set up project infrastructure and implement user authentication system.

### Database Tables

```sql
✓ users (complete implementation)
```

### Backend Tasks

1. **Project Setup**

- Initialize project structure (Express/FastAPI/etc.)
- Set up PostgreSQL database connection
- Configure environment variables
- Set up error handling middleware
- Create database migration system (e.g., Knex, Alembic, or Flyway)

2. **Database Setup**

- Create `users` table with all fields from schema
- Create necessary indexes
- Create `user_role` enum type
- Add database seed script for initial manager account

3. **Authentication Implementation**

- Password hashing with bcrypt
- JWT token generation (access token)
- Login endpoint
- Register endpoint (manager can create accounts)
- Token validation middleware
- Get current user endpoint

4. **User Management (Basic)**

- Get user by ID
- Update user profile
- List all users (manager only)
- Soft delete user (set is_active = false)

### Frontend Tasks

1. **Project Setup**

- Initialize frontend project
- Set up routing
- Configure API client
- Create auth context/state management

2. **Pages to Build**

- Login page
- Registration page (for initial manager)
- Basic dashboard layout (empty for now)
- User list page (manager only)
- User create/edit form

3. **Components**

- Protected route wrapper
- Navigation menu
- User form component
- Basic table component for user list

### API Endpoints

```
POST /api/auth/register (create first manager)
POST /api/auth/login
GET /api/auth/me
GET /api/users
GET /api/users/:id
POST /api/users (manager creates taskers)
PUT /api/users/:id
DELETE /api/users/:id (soft delete)
```

### Testing Checklist

- [ ] Manager can register
- [ ] Manager can login and receive JWT token
- [ ] Manager can create tasker accounts
- [ ] Manager can view all users
- [ ] Manager can update user details
- [ ] Manager can deactivate users
- [ ] Tasker cannot access manager-only endpoints
- [ ] Invalid tokens are rejected
- [ ] Passwords are hashed in database

Phase 2: Account Management (Week 3)

### Goal

Implement account creation and management system.

### Database Tables

```sql
✓ users (already exists)
✓ accounts (new)
```

### Database Migration

```sql
-- Migration: Create accounts table
CREATE TYPE account_type AS ENUM ('outlier', 'handshake');
CREATE TYPE browser_type AS ENUM ('ix_browser', 'gologin', 'morelogin');

CREATE TABLE accounts (
id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
account_name VARCHAR(255) NOT NULL,
account_type account_type NOT NULL,
browser_type browser_type NOT NULL,
hourly_rate DECIMAL(10,2) NOT NULL CHECK (hourly_rate >= 0),
tasker_id UUID REFERENCES users(id) ON DELETE SET NULL,
is_active BOOLEAN DEFAULT true,
created_by UUID NOT NULL REFERENCES users(id) ON DELETE RESTRICT,
created_at TIMESTAMP DEFAULT NOW(),
updated_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_accounts_tasker_id ON accounts(tasker_id);
CREATE INDEX idx_accounts_type ON accounts(account_type);
CREATE INDEX idx_accounts_active ON accounts(is_active);
CREATE INDEX idx_accounts_type_active ON accounts(account_type, is_active);
```

### Backend Tasks

1. **Account CRUD Operations**

- Create account (manager only)
- Get all accounts (with filters)
- Get account by ID
- Update account details
- Soft delete account
- Assign account to tasker
- Unassign account from tasker

2. **Validation Logic**

- Account name uniqueness
- Hourly rate must be positive
- Only one tasker per account
- Account type validation
- Browser type validation

3. **Authorization**

- Manager: full access to all accounts
- Tasker: view only their assigned accounts

### Frontend Tasks

1. **Pages**

- Accounts list page
- Account create form
- Account edit form
- Account details page
- Account assignment modal

2. **Components**

- Account table with filters (by type, browser, status)
- Account form (dropdowns for enums)
- Tasker selector (dropdown with search)
- Account card component

3. **Features**

- Filter accounts by type
- Filter accounts by assigned/unassigned
- Search accounts by name
- Assign/unassign tasker to account

### API Endpoints

```
GET /api/accounts
GET /api/accounts/:id
POST /api/accounts (manager only)
PUT /api/accounts/:id (manager only)
DELETE /api/accounts/:id (manager only)
PUT /api/accounts/:id/assign (manager only)
GET /api/accounts/my (tasker view assigned accounts)
```

### Testing Checklist

- [ ] Manager can create accounts with all field types
- [ ] Manager can view all accounts
- [ ] Manager can filter accounts by type
- [ ] Manager can assign account to tasker
- [ ] Manager can unassign account from tasker
- [ ] One account can only be assigned to one tasker
- [ ] Tasker can only see their assigned accounts
- [ ] Account names must be unique
- [ ] Hourly rate must be positive
- [ ] Soft delete preserves data integrity
