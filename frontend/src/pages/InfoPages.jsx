export function ForbiddenPage() {
  return (
    <div className="min-h-screen flex items-center justify-center p-6">
      <div className="card max-w-md text-center">
        <h1 className="font-display text-3xl font-bold text-red-600">403</h1>
        <p className="mt-2 text-slate-700">You don't have permission to view this page.</p>
        <a href="/" className="btn-primary mt-4">Go home</a>
      </div>
    </div>
  )
}

export function NotFoundPage() {
  return (
    <div className="min-h-screen flex items-center justify-center p-6">
      <div className="card max-w-md text-center">
        <h1 className="font-display text-3xl font-bold text-slate-900">404</h1>
        <p className="mt-2 text-slate-700">Page not found.</p>
        <a href="/" className="btn-primary mt-4">Go home</a>
      </div>
    </div>
  )
}
