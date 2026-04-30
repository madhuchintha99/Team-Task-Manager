export default function Home() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center p-24 bg-gray-100">
      <div className="text-center">
        <h1 className="text-4xl font-bold mb-4">Team Task Manager</h1>
        <p className="text-lg mb-8">Manage your projects and tasks efficiently</p>
        <div className="space-x-4">
          <a href="/login" className="bg-blue-500 text-white px-6 py-2 rounded">Login</a>
          <a href="/signup" className="bg-green-500 text-white px-6 py-2 rounded">Sign Up</a>
        </div>
      </div>
    </main>
  )
}