import { auth } from '@/lib/auth'
import connectDB from '@/lib/db/mongodb'
import DataAccessLog from '@/lib/db/models/DataAccessLog'
import { redirect } from 'next/navigation'

export default async function PrivacyCenterPage() {
  const session = await auth()
  if (!session?.user || (!['SUPER_ADMIN', 'ADMIN', 'SUPER_ADMIN'].includes(session.user.role))) {
    redirect('/forbidden')
  }
  await connectDB()
  const logs = await DataAccessLog.find().sort({ createdAt: -1 }).limit(100).lean()
  return (
    <div className="space-y-4 h-screen overflow-y-auto scroll-smooth p-6">
      <h1 className="text-2xl font-semibold">Privacy & Governance</h1>
      <p className="text-sm text-gray-600">Recent access logs (last 100). Exports and views are recorded for auditing.</p>
      <div className="border rounded overflow-auto">
        <table className="min-w-full text-sm">
          <thead>
            <tr>
              <th className="px-2 py-1 text-left">User</th>
              <th className="px-2 py-1 text-left">Entity</th>
              <th className="px-2 py-1 text-left">Action</th>
              <th className="px-2 py-1 text-left">When</th>
            </tr>
          </thead>
          <tbody>
            {logs.map((log) => (
              <tr key={String(log._id)} className="border-t">
                <td className="px-2 py-1">{String(log.userId)}</td>
                <td className="px-2 py-1">{log.entity} / {log.entityId}</td>
                <td className="px-2 py-1">{log.action}</td>
                <td className="px-2 py-1">{log.createdAt?.toISOString?.() ?? ''}</td>
              </tr>
            ))}
            {!logs.length && (
              <tr>
                <td className="px-2 py-2" colSpan={4}>
                  No access logged yet.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
      <div className="space-y-2">
        <h2 className="text-lg font-semibold">Data Portability</h2>
        <p className="text-sm text-gray-700">Export candidate data on request (stub). Implement download links tied to GDPR requests.</p>
      </div>
      <div className="space-y-2">
        <h2 className="text-lg font-semibold">Retention</h2>
        <p className="text-sm text-gray-700">Retain audit logs for 7 years. Soft deletes are archived for 30 days before anonymization.</p>
      </div>
    </div>
  )
}
