# Team Task Manager Repository Structure

This document describes the full repository structure of the Team Task Manager app, with each file and folder purpose clearly listed.

## Repo tree

```
.
├── .github/
│   └── copilot-instructions.md
├── app/
│   ├── api/
│   │   ├── auth/
│   │   │   ├── login/route.ts
│   │   │   └── signup/route.ts
│   │   ├── projects/route.ts
│   │   └── tasks/route.ts
│   ├── dashboard/page.tsx
│   ├── globals.css
│   ├── layout.tsx
│   ├── login/page.tsx
│   ├── page.tsx
│   └── signup/page.tsx
├── lib/
│   └── mongodb.ts
├── models/
│   ├── Project.ts
│   ├── Task.ts
│   └── User.ts
├── .gitignore
├── middleware.ts
├── next.config.js
├── next-env.d.ts
├── package.json
├── postcss.config.js
├── tailwind.config.js
├── tsconfig.json
└── README.md
```

## What each section contains

### `app/`
Contains frontend pages, shared layout, styles, and server API routes.

- `app/layout.tsx` — root layout for the application.
- `app/globals.css` — global CSS imports and Tailwind directives.
- `app/page.tsx` — landing page with login and signup links.

#### `app/login/`
- `app/login/page.tsx` — login page component.

#### `app/signup/`
- `app/signup/page.tsx` — signup page component.

#### `app/dashboard/`
- `app/dashboard/page.tsx` — dashboard page showing projects, tasks, and overdue items.

#### `app/api/`
- `app/api/auth/login/route.ts` — API route for user login.
- `app/api/auth/signup/route.ts` — API route for user registration.
- `app/api/projects/route.ts` — API route for fetching and creating projects.
- `app/api/tasks/route.ts` — API route for fetching and creating tasks.

### `models/`
MongoDB data models used by the API.

- `models/User.ts` — user schema with name, email, password, role, and creation date.
- `models/Project.ts` — project schema with owner, members, and description.
- `models/Task.ts` — task schema with project, assignee, status, priority, and due date.

### `lib/`
Shared backend utilities.

- `lib/mongodb.ts` — database connection helper for MongoDB.

### `.github/`
GitHub-specific workflows and instructions.

- `.github/copilot-instructions.md` — workspace instruction checklist for Copilot.

### Top-level files
- `.gitignore` — files and folders excluded from Git.
- `README.md` — project overview, setup, and deployment guide.
- `next.config.js` — Next.js config.
- `next-env.d.ts` — TypeScript environment declarations for Next.js.
- `package.json` — dependencies and scripts.
- `postcss.config.js` — PostCSS plugins.
- `tailwind.config.js` — Tailwind CSS config.
- `tsconfig.json` — TypeScript configuration.

## Notes

- The app uses JWT authentication and role-based access control.
- API routes are protected by `middleware.ts`, except for `/api/auth/*`.
- The frontend uses Next.js App Router and Tailwind CSS.
- Environment variables required: `MONGODB_URI`, `JWT_SECRET`.

## Requirements covered by this repo

- Build a web app where users can create projects, assign tasks, and track progress with role-based access (Admin/Member).
- Authentication (Signup/Login).
- Project & team management.
- Task creation, assignment, and status tracking.
- Dashboard for tasks, status, and overdue tracking.
- REST APIs with database support, proper validations, and relationships.
- Role-based access control.
