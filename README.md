# SMART e-Learning Platform

منصة تعليم إلكتروني ذكية مع متابعة شخصية لكل طالب

## 🎯 Overview

SMART e-Learning is an intelligent online learning platform designed to improve education through personalized follow-up. The platform serves three main user roles:

- **Teachers (أستاذ)**: Upload lessons, create exercises/quizzes, track performance
- **Parents (ولي)**: Monitor children's results, attendance, and receive alerts
- **Admin**: Manage users, moderate content, view system analytics

## 🛠️ Tech Stack

- **Frontend**: Next.js 15 (App Router) + React + TypeScript
- **Styling**: Tailwind CSS
- **Backend**: Next.js Route Handlers + Server Actions
- **Database**: Supabase (PostgreSQL)
- **Auth**: Supabase Auth
- **Storage**: Supabase Storage
- **Security**: Row Level Security (RLS)

## 📋 Prerequisites

- Node.js 18+ and npm
- Supabase account (free tier works)

## 🚀 Getting Started

### 1. Clone the repository

```bash
git clone <repository-url>
cd SMART-e-learning
```

### 2. Install dependencies

```bash
npm install
```

### 3. Set up Supabase

1. Create a new project at [supabase.com](https://supabase.com)
2. Go to Project Settings → API
3. Copy your project URL and anon key

### 4. Configure environment variables

```bash
cp .env.example .env.local
```

Edit `.env.local` and add your Supabase credentials:

```env
NEXT_PUBLIC_SUPABASE_URL=your_supabase_project_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
```

### 5. Run database migrations

In your Supabase project dashboard:

1. Go to SQL Editor
2. Run the migrations in order:
   - `supabase/migrations/001_initial_schema.sql`
   - `supabase/migrations/002_rls_policies.sql`

### 6. Start the development server

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) to see the application.

## 📁 Project Structure

```
SMART-e-learning/
├── app/                      # Next.js App Router
│   ├── login/               # Login page
│   ├── register/            # Register page
│   ├── parent/              # Parent dashboard
│   ├── teacher/             # Teacher dashboard
│   ├── admin/               # Admin dashboard
│   └── api/                 # API route handlers
├── lib/                     # Utilities & core logic
│   ├── supabase/           # Supabase clients
│   └── types/              # TypeScript types
├── supabase/               # Database migrations
│   └── migrations/         # SQL migration files
└── components/             # Shared React components
```

## 🔐 Authentication

The platform uses Supabase Auth with email/password authentication. Users select their role during registration:

- Parent (ولي أمر)
- Teacher (أستاذ)

Admin accounts must be created manually in the database.

## 🗄️ Database Schema

### Core Tables

- `profiles`: User profiles with role information
- Role-specific tables (coming soon):
  - `teachers`, `parents`, `children`
  - `parent_child_links`
  - `lessons`, `exercises`, `quizzes`
  - `attendance_logs`
  - `recommendations`, `alerts`

## 🔒 Security

- Row Level Security (RLS) enabled on all tables
- Role-based access control
- Teachers can only see their assigned children
- Parents can only see their children's data
- Admins have full access

## 📝 Current Status

✅ **Completed:**
- Project setup with Next.js + TypeScript
- Supabase integration
- Authentication (login/register)
- Home page
- Role-based routing
- Basic dashboard pages for all roles
- Database schema and RLS policies

🚧 **Next Steps:**
- Content management (lessons, exercises, quizzes)
- Parent-child linking system
- Attendance tracking
- Progress tracking
- Intelligence engine (recommendations & alerts)
- Admin user management

## 🤝 Contributing

This is an active development project. More features will be added incrementally.

## 📄 License

[Add your license here]
