import { Suspense } from "react";
import { AuthForm } from "@/features/auth";

export default function AuthPage() {
  return (
    <Suspense>
      <AuthForm />
    </Suspense>
  );
}
