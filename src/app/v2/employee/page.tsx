import { AuthGate } from "@/components/auth/auth-gate"
import { WorkspaceShell } from "@/components/layout/workspace-shell"
import { V2Employee } from "@/components/v2/v2-employee"

export default function V2EmployeePage() {
  return (
    <AuthGate>
      <WorkspaceShell>
        <V2Employee />
      </WorkspaceShell>
    </AuthGate>
  )
}
