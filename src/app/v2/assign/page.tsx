import { AuthGate } from "@/components/auth/auth-gate"
import { WorkspaceShell } from "@/components/layout/workspace-shell"
import { V2Assign } from "@/components/v2/v2-assign"

export default function V2AssignPage() {
  return (
    <AuthGate>
      <WorkspaceShell>
        <V2Assign />
      </WorkspaceShell>
    </AuthGate>
  )
}
