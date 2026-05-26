import { SignupForm } from "@/features/auth/components/SignupForm";

type SignupPageProps = {
  searchParams: Promise<{
    inviteCode?: string | string[];
  }>;
};

export default async function SignupPage({ searchParams }: SignupPageProps) {
  const { inviteCode } = await searchParams;
  const initialInviteCode = Array.isArray(inviteCode) ? inviteCode[0] : inviteCode;

  return (
    <main className="flex min-h-screen flex-col items-center justify-center bg-slate-50 p-6">
      <div className="mb-6 text-center md:mb-8">
        <h1 className="bg-primary-linear bg-clip-text text-4xl font-black text-transparent md:text-5xl">
          Meshi At PLAY
        </h1>
      </div>
      <div className="w-full max-w-130">
        <SignupForm initialInviteCode={initialInviteCode ?? ""} />
      </div>
    </main>
  );
}
