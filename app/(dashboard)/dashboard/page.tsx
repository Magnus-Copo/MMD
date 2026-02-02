import { auth } from "@/lib/auth"
import { redirect } from "next/navigation"

export default async function DashboardPage() {
  const session = await auth()

  if (!session?.user) {
    redirect("/login")
  }

  return (
    <div className="min-h-screen bg-background p-8">
      <div className="max-w-7xl mx-auto">
        <div className="bg-card border border-border rounded-lg p-6">
          <h1 className="text-3xl font-bold text-primary mb-4">Dashboard</h1>
          
          <div className="space-y-4">
            <div className="p-4 bg-secondary rounded-md">
              <h2 className="text-xl font-semibold text-foreground mb-2">Welcome, {session.user.name}</h2>
              <div className="space-y-1 text-sm text-muted-foreground">
                <p><span className="font-medium text-foreground">Email:</span> {session.user.email}</p>
                <p><span className="font-medium text-foreground">Role:</span> <span className="px-2 py-1 bg-primary/20 text-primary rounded">{session.user.role}</span></p>
                <p><span className="font-medium text-foreground">Status:</span> <span className={`px-2 py-1 rounded ${session.user.isActive ? 'bg-success/20 text-success' : 'bg-destructive/20 text-destructive'}`}>{session.user.isActive ? 'Active' : 'Inactive'}</span></p>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              <div className="p-4 bg-secondary border border-border rounded-md">
                <h3 className="text-lg font-semibold text-foreground">Companies</h3>
                <p className="text-2xl font-bold text-primary mt-2">0</p>
              </div>
              
              <div className="p-4 bg-secondary border border-border rounded-md">
                <h3 className="text-lg font-semibold text-foreground">Requirements</h3>
                <p className="text-2xl font-bold text-accent mt-2">0</p>
              </div>
              
              <div className="p-4 bg-secondary border border-border rounded-md">
                <h3 className="text-lg font-semibold text-foreground">Candidates</h3>
                <p className="text-2xl font-bold text-success mt-2">0</p>
              </div>
              
              <div className="p-4 bg-secondary border border-border rounded-md">
                <h3 className="text-lg font-semibold text-foreground">Placements</h3>
                <p className="text-2xl font-bold text-warning mt-2">0</p>
              </div>
            </div>

            <div className="p-4 bg-secondary/50 border border-border rounded-md">
              <h3 className="text-lg font-semibold text-foreground mb-2">System Status</h3>
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-muted-foreground">Database:</span>
                  <span className="px-2 py-1 bg-success/20 text-success rounded text-sm">Connected</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-muted-foreground">Authentication:</span>
                  <span className="px-2 py-1 bg-success/20 text-success rounded text-sm">Active</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-muted-foreground">Role:</span>
                  <span className="px-2 py-1 bg-primary/20 text-primary rounded text-sm">{session.user.role} Access</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
