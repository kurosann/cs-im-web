import { AuthGate } from "@/components/auth/auth-gate"
import { WorkspaceShell } from "@/components/layout/workspace-shell"
import { V1Management } from "@/components/workspace/v1-management"

export default function SettingsPage() {
  return (
    <AuthGate>
      <WorkspaceShell>
        <V1Management kind="settings" />
      </WorkspaceShell>
    </AuthGate>
  )
}
