import { AuthGate } from "@/components/auth/auth-gate"
import { WorkspaceShell } from "@/components/layout/workspace-shell"
import { V2Reminders } from "@/components/v2/v2-reminders"

export default function V2RemindersPage() {
  return (
    <AuthGate>
      <WorkspaceShell>
        <V2Reminders />
      </WorkspaceShell>
    </AuthGate>
  )
}
