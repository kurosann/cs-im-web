import { AuthGate } from "@/components/auth/auth-gate"
import { WorkspaceShell } from "@/components/layout/workspace-shell"
import { V2Chat } from "@/components/v2/v2-chat"

export default function V2ChatPage() {
  return (
    <AuthGate>
      <WorkspaceShell>
        <V2Chat />
      </WorkspaceShell>
    </AuthGate>
  )
}
