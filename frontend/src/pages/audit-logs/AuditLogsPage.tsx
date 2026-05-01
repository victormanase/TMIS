import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { reportsApi } from '@/api/reports';
import { Card, CardContent } from '@/components/ui/Card';
import { Table, TableHead, TableBody, TableRow, Th, Td, Pagination } from '@/components/ui/Table';
import { Badge } from '@/components/ui/Badge';
import { formatDateTime } from '@/lib/utils';

const actionVariant: Record<string, 'success' | 'danger' | 'warning' | 'info'> = {
  CREATE: 'success', DELETE: 'danger', UPDATE: 'info', TOGGLE_ACTIVE: 'warning', CHECKOUT: 'warning',
};

export default function AuditLogsPage() {
  const [page, setPage] = useState(1);
  const [entity, setEntity] = useState('');

  const { data, isLoading } = useQuery({
    queryKey: ['audit-logs', page, entity],
    queryFn: () => reportsApi.auditLogs({ page, limit: 50, entity: entity || undefined }),
  });

  const logs = data?.data ?? [];
  const pagination = data?.pagination;

  const entities = ['users', 'properties', 'units', 'tenants', 'assignments', 'payments', 'bookings'];

  return (
    <div className="d-flex flex-column gap-4">
      <div>
        <h1 className="fw-bold mb-1" style={{ fontSize: 22, color: '#333' }}>Audit Logs</h1>
        <p className="text-muted small mt-1">Full trail of all system actions</p>
      </div>

      <Card>
        <CardContent className="py-3">
          <select
            className="form-select form-select-sm"
            value={entity}
            onChange={(e) => { setEntity(e.target.value); setPage(1); }}
          >
            <option value="">All Entities</option>
            {entities.map((e) => <option key={e} value={e}>{e}</option>)}
          </select>
        </CardContent>
      </Card>

      {isLoading ? (
        <div className="d-flex flex-column gap-2">{Array.from({ length: 10 }).map((_, i) => <div key={i} className="rounded mb-2" style={{ height: 48, background: '#f0f0f0' }} />)}</div>
      ) : (
        <>
          <Table>
            <TableHead>
              <tr><Th>Timestamp</Th><Th>User</Th><Th>Action</Th><Th>Entity</Th><Th>Entity ID</Th></tr>
            </TableHead>
            <TableBody>
              {logs.length === 0 ? (
                <TableRow><Td colSpan={5} className="text-center text-muted py-5">No audit logs found</Td></TableRow>
              ) : (
                logs.map((log: any) => (
                  <TableRow key={log.id}>
                    <Td className="text-xs text-slate-500 whitespace-nowrap">{formatDateTime(log.createdAt)}</Td>
                    <Td>
                      <p className="font-medium text-sm">{log.user?.firstName} {log.user?.lastName}</p>
                      <p className="text-muted small">{log.user?.email}</p>
                    </Td>
                    <Td><Badge variant={actionVariant[log.action] ?? 'default'}>{log.action}</Badge></Td>
                    <Td className="text-capitalize">{log.entity}</Td>
                    <Td className="text-xs text-slate-400 font-mono">{log.entityId.slice(0, 16)}…</Td>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
          {pagination && pagination.totalPages > 1 && <Pagination page={page} totalPages={pagination.totalPages} onPageChange={setPage} />}
        </>
      )}
    </div>
  );
}
