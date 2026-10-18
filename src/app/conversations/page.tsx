import { AuthGate } from "@/components/auth/auth-gate"
import { ConversationsView } from "@/components/conversations/conversations-view"
import { WorkspaceShell } from "@/components/layout/workspace-shell"

export default function ConversationsPage() {
  return (
    <AuthGate>
      <WorkspaceShell>
        <ConversationsView />
      </WorkspaceShell>
    </AuthGate>
  )
}
