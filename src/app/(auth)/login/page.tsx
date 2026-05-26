import { LoginForm } from "@/features/auth/components/LoginForm";

export default function LoginPage() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center bg-slate-50 p-6">
      <div className="mb-6 text-center md:mb-8">
        <h1 className="bg-primary-linear bg-clip-text text-4xl font-black text-transparent md:text-5xl">
          Meshi At PLAY
        </h1>
      </div>
      <div className="w-full max-w-[520px]">
        <LoginForm />
      </div>
    </main>
  );
}
