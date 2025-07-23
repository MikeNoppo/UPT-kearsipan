import { LoginForm } from "@/components/auth/login-form"

export default function HomePage() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="max-w-md w-full space-y-8">
        <div className="text-center">
          <h2 className="mt-6 text-3xl font-extrabold text-gray-900">Sistem Informasi Kearsipan UPT</h2>
          <p className="mt-2 text-sm text-gray-600">UPT Kearsipan - Universitas Sam Ratulangi</p>
        </div>
        <LoginForm />
      </div>
    </div>
  )
}
