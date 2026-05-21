import { LoginForm } from "@/features/auth/components/LoginForm";

export default function LoginPage() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center bg-slate-50 p-6">
      <div className="mb-8 text-center">
        <h1 className="bg-primary-linear bg-clip-text text-5xl font-black text-transparent">
          Meshi At PLAY
        </h1>
      </div>
      <div className="w-full max-w-[520px]">
        <LoginForm />
      </div>
    </main>
  );
}
