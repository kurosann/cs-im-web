import { AuthGate } from "@/components/auth/auth-gate"
import { WorkspaceShell } from "@/components/layout/workspace-shell"
import { V2Overview } from "@/components/v2/v2-overview"

export default function V2Page() {
  return (
    <AuthGate>
      <WorkspaceShell>
        <V2Overview />
      </WorkspaceShell>
    </AuthGate>
  )
}
