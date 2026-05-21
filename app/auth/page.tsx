import { Suspense } from "react";
import { AuthForm } from "@/features/auth/components/AuthForm";

export default function AuthPage() {
  return (
    <Suspense>
      <AuthForm />
    </Suspense>
  );
}
