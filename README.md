# Team Task Manager

A full-stack React app to manage projects, team members, and task workflows with role-based access.

## Repo Structure

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
├── package.json
├── postcss.config.js
├── tailwind.config.js
├── tsconfig.json
└── README.md
```

## What this app includes

- Signup and login with JWT authentication
- Role-based access: `admin` and `member`
- Project creation and team membership
- Task creation, assignment, status, priority, and due date
- Dashboard showing projects, task list, and overdue tasks
- MongoDB database connection via Mongoose
- API routes built using Next.js App Router

## Requirements covered

- REST APIs + Database (MongoDB / NoSQL)
- Proper validations and relationships across users, projects, and tasks
- Role-based access control for admin/member workflows

## Key Features

- Authentication (Signup/Login)
- Project & team management
- Task creation, assignment & status tracking
- Dashboard with tasks, status, and overdue tracking

## Core API routes

- `POST /api/auth/signup` - register a new user
- `POST /api/auth/login` - authenticate and get token
- `GET /api/projects` - list projects for the current user
- `POST /api/projects` - create a new project
- `GET /api/tasks` - list tasks for accessible projects
- `POST /api/tasks` - create a new task

## Quick start

1. Install dependencies:
   ```bash
   npm install
   ```
2. Create `.env.local` with:
   ```bash
   MONGODB_URI=your_mongodb_connection_string
   JWT_SECRET=your_jwt_secret
   ```
3. Start the app:
   ```bash
   npm run dev
   ```
4. Open the app at:
   ```bash
   http://localhost:3000
   ```

## Deployment

This app is ready for deployment on Vercel (recommended for Next.js apps).

### Steps to Deploy:

1. **Set up MongoDB Atlas** (free tier available):
   - Go to [MongoDB Atlas](https://www.mongodb.com/atlas)
   - Create a free cluster
   - Get the connection string (replace `<password>` and `<dbname>`)

2. **Push to GitHub**:
   ```bash
   git init
   git add .
   git commit -m "Initial Team Task Manager app"
   git branch -M main
   git remote add origin <your-github-repo-url>
   git push -u origin main
   ```

3. **Deploy on Vercel**:
   - Go to [Vercel](https://vercel.com)
   - Import your GitHub repository
   - Set environment variables:
     - `MONGODB_URI`: your MongoDB Atlas connection string
     - `JWT_SECRET`: a secure random string (generate one)
   - Deploy

The app will be live at your Vercel URL!
  git push -u origin main
  ```
- The `.gitignore` file already excludes build artifacts and local files.

## Deployment

This app is ready for Railway deployment. Make sure the Railway environment includes:

- `MONGODB_URI`
- `JWT_SECRET`

Then deploy the repository from GitHub.

## License

MIT