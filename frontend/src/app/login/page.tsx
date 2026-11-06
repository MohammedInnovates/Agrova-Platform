import Link from "next/link";
import LoginForm from "@/components/LoginForm";

export default function LoginPage() {
  return (
    <main className="min-h-screen bg-[#faf7f0] flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <Link href="/" className="text-sm text-gray-500 hover:text-[#15803d] mb-6 inline-block">
          ← Back to Home
        </Link>
        <div className="bg-white p-8 rounded-xl shadow-lg border border-green-100">
          <div className="text-center mb-8">
            <h1 className="text-3xl font-bold text-[#14532d]">Welcome Back</h1>
            <p className="text-gray-500 mt-2">Log in to manage your orders</p>
          </div>
          <LoginForm />
        </div>
      </div>
    </main>
  );
}