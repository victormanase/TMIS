import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import { Plus, Pencil, Trash2, Search, Eye } from 'lucide-react';
import { Link } from 'react-router-dom';
import { tenantsApi, type Tenant } from '@/api/tenants';
import { Card, CardContent } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Modal } from '@/components/ui/Modal';
import { Table, TableHead, TableBody, TableRow, Th, Td, Pagination } from '@/components/ui/Table';
import { Badge } from '@/components/ui/Badge';
import { Alert } from '@/components/ui/Alert';
import { useAuth } from '@/hooks/useAuth';

const schema = z.object({
  firstName: z.string().min(1, 'First name is required'),
  middleName: z.string().optional(),
  lastName: z.string().min(1, 'Last name is required'),
  phone: z.string().min(1, 'Phone number is required'),
});
type FormData = z.infer<typeof schema>;

export default function TenantsPage() {
  const { isManagerOrAdmin } = useAuth();
  const qc = useQueryClient();
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState('');
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState<Tenant | null>(null);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [formError, setFormError] = useState('');

  const { data, isLoading } = useQuery({
    queryKey: ['tenants', page, search],
    queryFn: () => tenantsApi.list({ page, limit: 20, search: search || undefined }),
  });

  const { register, handleSubmit, reset, formState: { errors, isSubmitting } } = useForm<FormData>({ resolver: zodResolver(schema) });

  const saveMutation = useMutation({
    mutationFn: (d: FormData) => editing ? tenantsApi.update(editing.id, d) : tenantsApi.create(d),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['tenants'] }); closeModal(); },
    onError: (err: any) => setFormError(err.response?.data?.message ?? 'Save failed'),
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => tenantsApi.delete(id),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['tenants'] }); setDeleteId(null); },
  });

  function openCreate() { setEditing(null); reset({}); setFormError(''); setModalOpen(true); }
  function openEdit(t: Tenant) {
    setEditing(t);
    reset({ firstName: t.firstName, middleName: t.middleName ?? '', lastName: t.lastName, phone: t.phone });
    setFormError('');
    setModalOpen(true);
  }
  function closeModal() { setModalOpen(false); setEditing(null); reset({}); setFormError(''); }

  const tenants = data?.data ?? [];
  const pagination = data?.pagination;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Tenants</h1>
          <p className="text-sm text-slate-500 mt-1">Manage registered tenants</p>
        </div>
        {isManagerOrAdmin() && (
          <Button onClick={openCreate}><Plus size={16} className="mr-1" /> Add Tenant</Button>
        )}
      </div>

      <Card>
        <CardContent className="py-3">
          <div className="relative max-w-sm">
            <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              className="w-full pl-9 pr-3 py-2 text-sm border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="Search by name or phone…"
              value={search}
              onChange={(e) => { setSearch(e.target.value); setPage(1); }}
            />
          </div>
        </CardContent>
      </Card>

      {isLoading ? (
        <div className="space-y-2">{Array.from({ length: 5 }).map((_, i) => <div key={i} className="h-14 bg-slate-100 rounded-lg animate-pulse" />)}</div>
      ) : (
        <>
          <Table>
            <TableHead>
              <tr>
                <Th>Name</Th>
                <Th>Phone</Th>
                <Th>Current Unit</Th>
                <Th>Actions</Th>
              </tr>
            </TableHead>
            <TableBody>
              {tenants.length === 0 ? (
                <TableRow><Td colSpan={4} className="text-center text-slate-400 py-8">No tenants found</Td></TableRow>
              ) : (
                tenants.map((t: Tenant) => {
                  const active = t.assignments?.find((a) => a.isActive);
                  return (
                    <TableRow key={t.id}>
                      <Td className="font-medium">{t.firstName} {t.middleName ? `${t.middleName} ` : ''}{t.lastName}</Td>
                      <Td>{t.phone}</Td>
                      <Td>
                        {active ? (
                          <Badge variant="success">{active.unit.property.name} — {active.unit.unitNumber}</Badge>
                        ) : (
                          <Badge variant="default">Unassigned</Badge>
                        )}
                      </Td>
                      <Td>
                        <div className="flex gap-2">
                          <Link to={`/tenants/${t.id}`} className="p-1.5 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded transition-colors">
                            <Eye size={14} />
                          </Link>
                          {isManagerOrAdmin() && (
                            <>
                              <button onClick={() => openEdit(t)} className="p-1.5 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded transition-colors"><Pencil size={14} /></button>
                              <button onClick={() => setDeleteId(t.id)} className="p-1.5 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded transition-colors"><Trash2 size={14} /></button>
                            </>
                          )}
                        </div>
                      </Td>
                    </TableRow>
                  );
                })
              )}
            </TableBody>
          </Table>
          {pagination && pagination.totalPages > 1 && (
            <Pagination page={page} totalPages={pagination.totalPages} onPageChange={setPage} />
          )}
        </>
      )}

      <Modal isOpen={modalOpen} onClose={closeModal} title={editing ? 'Edit Tenant' : 'Add Tenant'}>
        {formError && <Alert variant="error" message={formError} className="mb-4" />}
        <form onSubmit={handleSubmit((d) => saveMutation.mutate(d))} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <Input id="firstName" label="First Name *" error={errors.firstName?.message} {...register('firstName')} />
            <Input id="middleName" label="Middle Name" {...register('middleName')} />
            <Input id="lastName" label="Last Name *" error={errors.lastName?.message} {...register('lastName')} />
            <Input id="phone" label="Phone Number *" type="tel" error={errors.phone?.message} {...register('phone')} />
          </div>
          <div className="flex justify-end gap-3 pt-2">
            <Button variant="outline" type="button" onClick={closeModal}>Cancel</Button>
            <Button type="submit" loading={isSubmitting || saveMutation.isPending}>{editing ? 'Save Changes' : 'Create Tenant'}</Button>
          </div>
        </form>
      </Modal>

      <Modal isOpen={!!deleteId} onClose={() => setDeleteId(null)} title="Delete Tenant" size="sm">
        <p className="text-slate-600 text-sm mb-4">Are you sure you want to delete this tenant?</p>
        <div className="flex justify-end gap-3">
          <Button variant="outline" onClick={() => setDeleteId(null)}>Cancel</Button>
          <Button variant="danger" loading={deleteMutation.isPending} onClick={() => deleteId && deleteMutation.mutate(deleteId)}>Delete</Button>
        </div>
      </Modal>
    </div>
  );
}
