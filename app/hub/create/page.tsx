import { Trophy } from "lucide-react";
import { CreateHubForm } from "@/features/hub/components/CreateHubForm";

export default function CreateHubPage() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-4">
      <div className="w-full max-w-sm space-y-8">
        <div className="flex flex-col items-center gap-3">
          <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-primary/15">
            <Trophy className="h-8 w-8 text-primary" />
          </div>
          <div className="text-center">
            <h1 className="text-2xl font-bold">Create a Hub</h1>
            <p className="text-sm text-muted-foreground">
              Set up a hub for your football group
            </p>
          </div>
        </div>

        <CreateHubForm />
      </div>
    </div>
  );
}
