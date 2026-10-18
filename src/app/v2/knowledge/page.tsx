import { AuthGate } from "@/components/auth/auth-gate"
import { WorkspaceShell } from "@/components/layout/workspace-shell"
import { V2Knowledge } from "@/components/v2/v2-knowledge"

export default function V2KnowledgePage() {
  return (
    <AuthGate>
      <WorkspaceShell>
        <V2Knowledge />
      </WorkspaceShell>
    </AuthGate>
  )
}
