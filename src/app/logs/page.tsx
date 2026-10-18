import { AuthGate } from "@/components/auth/auth-gate"
import { WorkspaceShell } from "@/components/layout/workspace-shell"
import { V1Management } from "@/components/workspace/v1-management"

export default function LogsPage() {
  return (
    <AuthGate>
      <WorkspaceShell>
        <V1Management kind="logs" />
      </WorkspaceShell>
    </AuthGate>
  )
}
