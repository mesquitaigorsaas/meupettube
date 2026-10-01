import { requireUser } from "@/lib/auth";
import { get } from "@/lib/db";
import { PageContainer, PageTitle } from "@/components/ui";
import { PasswordForm } from "./PasswordForm";

export const metadata = { title: "Trocar senha" };

export default async function PasswordPage() {
  const user = await requireUser("/password");
  const row = await get<{ google_sub: string | null }>("SELECT google_sub FROM users WHERE id = ?", user.id);
  return (
    <PageContainer className="max-w-xl">
      <PageTitle icon="shield" title="Trocar senha" subtitle={user.email} />
      <PasswordForm googleAccount={!!row?.google_sub} />
      <p className="mt-4 text-xs text-muted">Ao trocar a senha, os outros aparelhos conectados à sua conta são desconectados. Este continua conectado.</p>
    </PageContainer>
  );
}
