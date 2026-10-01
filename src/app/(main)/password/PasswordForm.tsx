"use client";

import { useActionState } from "react";
import { changePasswordAction } from "@/actions/auth";
import { Field, FormError, FormSuccess, SubmitButton } from "@/components/forms";

export function PasswordForm({ googleAccount }: { googleAccount: boolean }) {
  const [state, action] = useActionState(changePasswordAction, {});
  const fe = state.fieldErrors ?? {};
  return (
    <form action={action} key={state.ok ? "ok" : "form"} className="card flex flex-col gap-4 p-5 sm:p-6">
      <FormSuccess message={state.message} />
      <FormError message={state.error} />
      <Field
        label="Senha atual"
        name="current"
        type="password"
        autoComplete="current-password"
        error={fe.current}
        hint={googleAccount ? "Entrou pelo Google e nunca criou senha? Deixe em branco." : undefined}
      />
      <Field label="Nova senha" name="password" type="password" autoComplete="new-password" minLength={8} error={fe.password} hint="Pelo menos 8 caracteres." />
      <Field label="Repita a nova senha" name="confirm" type="password" autoComplete="new-password" error={fe.confirm} />
      <div className="flex justify-end border-t border-line pt-4">
        <SubmitButton className="btn-primary px-6" pendingText="Salvando…">
          Trocar senha
        </SubmitButton>
      </div>
    </form>
  );
}
