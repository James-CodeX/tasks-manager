# Worker Tracking System

A comprehensive worker tracking system for online jobs with task management, session tracking, and payment calculation.

## Features

### Phase 1: Foundation & Authentication ✅
- **User Authentication**: JWT-based authentication with role-based access control
- **User Management**: Managers can create and manage tasker accounts
- **Role System**: Manager and Tasker roles with different permissions
- **Security**: Password hashing, token validation, and audit logging

### Phase 2: Account Management ✅
- **Account CRUD Operations**: Create, read, update, and delete work accounts
- **Account Types**: Support for Outlier and Handshake account types
- **Browser Configuration**: IX Browser, GoLogin, and MoreLogin support
- **Tasker Assignment**: Assign/unassign taskers to accounts
- **Validation**: Account name uniqueness, hourly rate validation
- **Role-Based Views**: Managers see all accounts, taskers see only assigned accounts
- **Advanced Filtering**: Filter by type, browser, assignment status, and search

### Database Schema
- **Users**: Core user management with roles and authentication
- **Accounts**: Work accounts with browser configurations and hourly rates
- **Task Submissions**: Hourly task submissions for Handshake accounts (planned)
- **Work Sessions**: Time tracking for payment calculation (planned)
- **Payment Records**: Aggregated payment records for payroll (planned)
- **Audit Logs**: Comprehensive audit trail for compliance

## Technology Stack

- **Frontend**: Next.js 15 with TypeScript
- **Styling**: Tailwind CSS with shadcn/ui components
- **Database**: SQLite with Prisma ORM
- **Authentication**: JWT tokens with bcrypt password hashing
- **UI Components**: Complete shadcn/ui component library

## Getting Started

### Prerequisites
- Node.js 18+ or Bun
- SQLite (included with the project)

### Installation

1. **Clone and install dependencies**
   ```bash
   git clone <repository-url>
   cd worker-tracking-system
   bun install
   ```

2. **Set up the database**
   ```bash
   bun run db:push
   bun run db:generate
   bun run db:seed
   ```

3. **Start the development server**
   ```bash
   bun run dev
   ```

4. **Access the application**
   - Open http://localhost:3000
   - Use the seed accounts to test:
     - Manager: `manager@workertracking.com` / `manager123`
     - Tasker: `tasker@workertracking.com` / `tasker123`

## Project Structure

```
src/
├── app/                    # Next.js app router pages
│   ├── api/               # API routes
│   │   ├── auth/          # Authentication endpoints
│   │   └── users/         # User management endpoints
│   ├── dashboard/         # Main dashboard
│   ├── login/             # Login page
│   ├── register/          # Registration page
│   └── users/             # User management pages
├── components/            # React components
│   ├── ui/               # shadcn/ui components
│   └── protected-route.tsx # Authentication wrapper
├── contexts/             # React contexts
│   └── auth-context.tsx  # Authentication context
└── lib/                  # Utility libraries
    ├── auth.ts           # Authentication utilities
    ├── db.ts             # Database client
    └── utils.ts          # General utilities
```

## API Endpoints

### Authentication
- `POST /api/auth/register` - Register new user
- `POST /api/auth/login` - User login
- `GET /api/auth/me` - Get current user

### User Management (Manager only)
- `GET /api/users` - List all users
- `POST /api/users` - Create new user
- `GET /api/users/[id]` - Get user by ID
- `PUT /api/users/[id]` - Update user
- `DELETE /api/users/[id]` - Deactivate user

### Account Management
- `GET /api/accounts` - List all accounts (Manager) / Get assigned accounts (Tasker)
- `POST /api/accounts` - Create new account (Manager only)
- `GET /api/accounts/[id]` - Get account by ID
- `PUT /api/accounts/[id]` - Update account (Manager only)
- `DELETE /api/accounts/[id]` - Deactivate account (Manager only)
- `PUT /api/accounts/[id]/assign` - Assign/unassign tasker (Manager only)
- `GET /api/accounts/my` - Get current tasker's assigned accounts

## Database Schema

### Users
- Core user management with authentication
- Role-based access control (Manager/Tasker)
- Soft delete functionality

### Accounts
- Work account configurations with browser types and hourly rates
- Support for Outlier and Handshake account types
- Browser configurations for IX Browser, GoLogin, and MoreLogin
- Tasker assignment and management

### Work Sessions (Planned)
- Time tracking functionality
- Payment calculation
- Session management

## Development

### Available Scripts
- `bun run dev` - Start development server
- `bun run build` - Build for production
- `bun run lint` - Run ESLint
- `bun run db:push` - Push database schema
- `bun run db:generate` - Generate Prisma client
- `bun run db:seed` - Seed database with sample data

### Code Quality
- TypeScript for type safety
- ESLint for code quality
- Prisma for database management
- shadcn/ui for consistent UI

### Future Features

### Phase 3: Work Session Tracking
- Session start/stop functionality
- Real-time time tracking
- Automatic payment calculation

### Phase 4: Task Submissions
- Screenshot upload functionality
- Task ID tracking
- Approval workflow

### Phase 5: Payment Management
- Payment record generation
- Payroll processing
- Financial reporting

## Security Features

- **Authentication**: JWT tokens with expiration
- **Password Security**: bcrypt hashing with salt rounds
- **Role-Based Access**: Different permissions for managers and taskers
- **Audit Trail**: Complete logging of system actions
- **Input Validation**: Zod schema validation
- **CORS Protection**: Next.js built-in CORS handling

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Run tests and linting
5. Submit a pull request

## License

This project is licensed under the MIT License.

## Support

For support and questions, please contact the development team.