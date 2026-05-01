import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import { propertiesApi, type Property } from '@/api/properties';
import { Card, CardContent } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Modal } from '@/components/ui/Modal';
import { Table, TableHead, TableBody, TableRow, Th, Td, Pagination } from '@/components/ui/Table';
import { Badge } from '@/components/ui/Badge';
import { Alert } from '@/components/ui/Alert';
import { useAuth } from '@/hooks/useAuth';

const schema = z.object({
  name: z.string().min(1, 'Name is required'),
  location: z.string().min(1, 'Location is required'),
  description: z.string().optional(),
});
type FormData = z.infer<typeof schema>;

export default function PropertiesPage() {
  const { isManagerOrAdmin } = useAuth();
  const qc = useQueryClient();
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState('');
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState<Property | null>(null);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [formError, setFormError] = useState('');

  const { data, isLoading } = useQuery({
    queryKey: ['properties', page, search],
    queryFn: () => propertiesApi.list({ page, limit: 20, search: search || undefined }),
  });

  const { register, handleSubmit, reset, formState: { errors, isSubmitting } } = useForm<FormData>({
    resolver: zodResolver(schema),
  });

  const saveMutation = useMutation({
    mutationFn: (data: FormData) =>
      editing
        ? propertiesApi.update(editing.id, data)
        : propertiesApi.create(data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['properties'] });
      closeModal();
    },
    onError: (err: any) => setFormError(err.response?.data?.message ?? 'Save failed'),
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => propertiesApi.delete(id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['properties'] });
      setDeleteId(null);
    },
  });

  function openCreate() {
    setEditing(null);
    reset({});
    setFormError('');
    setModalOpen(true);
  }

  function openEdit(p: Property) {
    setEditing(p);
    reset({ name: p.name, location: p.location, description: p.description ?? '' });
    setFormError('');
    setModalOpen(true);
  }

  function closeModal() {
    setModalOpen(false);
    setEditing(null);
    reset({});
    setFormError('');
  }

  const properties = data?.data ?? [];
  const pagination = data?.pagination;

  return (
    <div className="d-flex flex-column gap-4">
      <div className="d-flex align-items-center justify-content-between">
        <div>
          <h1 className="fw-bold mb-1" style={{ fontSize: 22, color: '#333' }}>Properties</h1>
          <p className="text-muted small mt-1">Manage your rental properties</p>
        </div>
        {isManagerOrAdmin() && (
          <Button onClick={openCreate} className="gap-2">
            <i className="fas fa-plus" /> Add Property
          </Button>
        )}
      </div>

      {/* Search */}
      <Card>
        <CardContent className="py-3">
          <div className="position-relative" style={{ maxWidth: 320 }}>
            <Search style={{ position: 'absolute', left: 10, top: '50%', transform: 'translateY(-50%)', color: '#aaa', fontSize: 13 }} />
            <input
              className="form-control form-control-sm ps-5"
              placeholder="Search properties…"
              value={search}
              onChange={(e) => { setSearch(e.target.value); setPage(1); }}
            />
          </div>
        </CardContent>
      </Card>

      {/* Table */}
      <div>
        {isLoading ? (
          <div className="d-flex flex-column gap-2">
            {Array.from({ length: 5 }).map((_, i) => (
              <div key={i} className="rounded animate-pulse-lbd" style={{ height: 56, background: '#f0f0f0' }} />
            ))}
          </div>
        ) : (
          <>
            <Table>
              <TableHead>
                <tr>
                  <Th>Name</Th>
                  <Th>Location</Th>
                  <Th>Units</Th>
                  <Th>Description</Th>
                  {isManagerOrAdmin() && <Th>Actions</Th>}
                </tr>
              </TableHead>
              <TableBody>
                {properties.length === 0 ? (
                  <TableRow>
                    <Td colSpan={5} className="text-center text-muted py-5">
                      No properties found
                    </Td>
                  </TableRow>
                ) : (
                  properties.map((p: Property) => (
                    <TableRow key={p.id}>
                      <Td className="fw-medium">
                        <div className="d-flex align-items-center gap-2">
                          <i className="fas fa-building" style={{ color: 'var(--lbd-primary)' }} />
                          {p.name}
                        </div>
                      </Td>
                      <Td>{p.location}</Td>
                      <Td>
                        <Badge variant="info">{p._count?.units ?? 0} units</Badge>
                      </Td>
                      <Td className="text-slate-400 text-xs max-w-xs truncate">
                        {p.description ?? '—'}
                      </Td>
                      {isManagerOrAdmin() && (
                        <Td>
                          <div className="d-flex align-items-center gap-2">
                            <button
                              onClick={() => openEdit(p)}
                              className="btn btn-sm btn-outline-secondary border-0 px-2 py-1"
                            >
                              <i className="fas fa-edit" />
                            </button>
                            <button
                              onClick={() => setDeleteId(p.id)}
                              className="btn btn-sm btn-outline-danger border-0 px-2 py-1"
                            >
                              <i className="fas fa-trash-alt" />
                            </button>
                          </div>
                        </Td>
                      )}
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
            {pagination && pagination.totalPages > 1 && (
              <Pagination page={page} totalPages={pagination.totalPages} onPageChange={setPage} />
            )}
          </>
        )}
      </div>

      {/* Create/Edit Modal */}
      <Modal
        isOpen={modalOpen}
        onClose={closeModal}
        title={editing ? 'Edit Property' : 'Add Property'}
      >
        {formError && <Alert variant="error" message={formError} className="mb-4" />}
        <form onSubmit={handleSubmit((d) => saveMutation.mutate(d))} className="d-flex flex-column gap-3">
          <Input id="name" label="Property Name *" error={errors.name?.message} {...register('name')} />
          <Input id="location" label="Location *" error={errors.location?.message} {...register('location')} />
          <div className="d-flex flex-column gap-1">
            <label htmlFor="description" className="text-sm font-medium text-slate-700">Description</label>
            <textarea
              id="description"
              rows={3}
              className="rounded-lg border border-slate-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="Optional description…"
              {...register('description')}
            />
          </div>
          <div className="d-flex justify-content-end gap-3 pt-2">
            <Button variant="outline" type="button" onClick={closeModal}>Cancel</Button>
            <Button type="submit" loading={isSubmitting || saveMutation.isPending}>
              {editing ? 'Save Changes' : 'Create Property'}
            </Button>
          </div>
        </form>
      </Modal>

      {/* Delete Confirm */}
      <Modal isOpen={!!deleteId} onClose={() => setDeleteId(null)} title="Delete Property" size="sm">
        <p className="text-slate-600 text-sm mb-4">
          Are you sure you want to delete this property? The property will be soft-deleted and can be recovered.
        </p>
        <div className="d-flex justify-content-end gap-3">
          <Button variant="outline" onClick={() => setDeleteId(null)}>Cancel</Button>
          <Button
            variant="danger"
            loading={deleteMutation.isPending}
            onClick={() => deleteId && deleteMutation.mutate(deleteId)}
          >
            Delete
          </Button>
        </div>
      </Modal>
    </div>
  );
}
