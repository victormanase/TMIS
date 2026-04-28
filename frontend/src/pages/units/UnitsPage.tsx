import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import { Plus, Pencil, Trash2, Search, Eye } from 'lucide-react';
import { Link } from 'react-router-dom';
import { unitsApi, type Unit } from '@/api/units';
import { propertiesApi } from '@/api/properties';
import { Card, CardContent } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Select } from '@/components/ui/Select';
import { Modal } from '@/components/ui/Modal';
import { Table, TableHead, TableBody, TableRow, Th, Td, Pagination } from '@/components/ui/Table';
import { Badge } from '@/components/ui/Badge';
import { Alert } from '@/components/ui/Alert';
import { useAuth } from '@/hooks/useAuth';
import { formatCurrency, UNIT_TYPES } from '@/lib/utils';

const schema = z.object({
  propertyId: z.string().min(1, 'Property is required'),
  unitNumber: z.string().min(1, 'Unit number is required'),
  unitType: z.enum(['APARTMENT', 'STUDIO', 'AIRBNB', 'OTHER']),
  bedrooms: z.coerce.number().int().min(0),
  monthlyRent: z.coerce.number().optional(),
  dailyRate: z.coerce.number().optional(),
  serviceCharge: z.coerce.number().min(0),
}).refine((d) => d.unitType === 'AIRBNB' ? !!d.dailyRate : !!d.monthlyRent, {
  message: 'Rate is required for this unit type',
  path: ['monthlyRent'],
});

type FormData = z.infer<typeof schema>;

export default function UnitsPage() {
  const { isManagerOrAdmin } = useAuth();
  const qc = useQueryClient();
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState('');
  const [filterProperty, setFilterProperty] = useState('');
  const [filterType, setFilterType] = useState('');
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState<Unit | null>(null);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [formError, setFormError] = useState('');

  const { data, isLoading } = useQuery({
    queryKey: ['units', page, search, filterProperty, filterType],
    queryFn: () =>
      unitsApi.list({
        page,
        limit: 20,
        search: search || undefined,
        propertyId: filterProperty || undefined,
        unitType: filterType || undefined,
      }),
  });

  const { data: propertiesData } = useQuery({
    queryKey: ['properties-all'],
    queryFn: () => propertiesApi.list({ limit: 100 }),
  });

  const { register, handleSubmit, reset, watch, formState: { errors, isSubmitting } } = useForm<FormData>({
    resolver: zodResolver(schema),
    defaultValues: { serviceCharge: 0, bedrooms: 1 },
  });

  const unitType = watch('unitType');

  const saveMutation = useMutation({
    mutationFn: (data: FormData) =>
      editing ? unitsApi.update(editing.id, data) : unitsApi.create(data as any),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['units'] });
      closeModal();
    },
    onError: (err: any) => setFormError(err.response?.data?.message ?? 'Save failed'),
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => unitsApi.delete(id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['units'] });
      setDeleteId(null);
    },
  });

  function openCreate() {
    setEditing(null);
    reset({ serviceCharge: 0, bedrooms: 1, unitType: 'APARTMENT' });
    setFormError('');
    setModalOpen(true);
  }

  function openEdit(u: Unit) {
    setEditing(u);
    reset({
      propertyId: u.propertyId,
      unitNumber: u.unitNumber,
      unitType: u.unitType,
      bedrooms: u.bedrooms,
      monthlyRent: Number(u.monthlyRent ?? 0) || undefined,
      dailyRate: Number(u.dailyRate ?? 0) || undefined,
      serviceCharge: Number(u.serviceCharge),
    });
    setFormError('');
    setModalOpen(true);
  }

  function closeModal() {
    setModalOpen(false);
    setEditing(null);
    reset({});
    setFormError('');
  }

  const units = data?.data ?? [];
  const pagination = data?.pagination;
  const properties = propertiesData?.data ?? [];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Rental Units</h1>
          <p className="text-sm text-slate-500 mt-1">Manage all rental units across properties</p>
        </div>
        {isManagerOrAdmin() && (
          <Button onClick={openCreate}><Plus size={16} className="mr-1" /> Add Unit</Button>
        )}
      </div>

      {/* Filters */}
      <Card>
        <CardContent className="py-3">
          <div className="flex flex-wrap gap-3">
            <div className="relative flex-1 min-w-48">
              <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                className="w-full pl-9 pr-3 py-2 text-sm border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="Search unit number…"
                value={search}
                onChange={(e) => { setSearch(e.target.value); setPage(1); }}
              />
            </div>
            <select
              className="border border-slate-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              value={filterProperty}
              onChange={(e) => { setFilterProperty(e.target.value); setPage(1); }}
            >
              <option value="">All Properties</option>
              {properties.map((p: any) => (
                <option key={p.id} value={p.id}>{p.name}</option>
              ))}
            </select>
            <select
              className="border border-slate-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              value={filterType}
              onChange={(e) => { setFilterType(e.target.value); setPage(1); }}
            >
              <option value="">All Types</option>
              {UNIT_TYPES.map((t) => <option key={t} value={t}>{t}</option>)}
            </select>
          </div>
        </CardContent>
      </Card>

      {/* Table */}
      {isLoading ? (
        <div className="space-y-2">
          {Array.from({ length: 5 }).map((_, i) => <div key={i} className="h-14 bg-slate-100 rounded-lg animate-pulse" />)}
        </div>
      ) : (
        <>
          <Table>
            <TableHead>
              <tr>
                <Th>Unit</Th>
                <Th>Property</Th>
                <Th>Type</Th>
                <Th>Bedrooms</Th>
                <Th>Rent / Rate</Th>
                <Th>Service Charge</Th>
                <Th>Status</Th>
                <Th>Actions</Th>
              </tr>
            </TableHead>
            <TableBody>
              {units.length === 0 ? (
                <TableRow><Td colSpan={8} className="text-center text-slate-400 py-8">No units found</Td></TableRow>
              ) : (
                units.map((u: Unit) => {
                  const isOccupied = (u.assignments?.length ?? 0) > 0;
                  return (
                    <TableRow key={u.id}>
                      <Td className="font-medium">{u.unitNumber}</Td>
                      <Td>{u.property?.name ?? '—'}</Td>
                      <Td><Badge variant="info">{u.unitType}</Badge></Td>
                      <Td>{u.bedrooms}</Td>
                      <Td>
                        {u.unitType === 'AIRBNB'
                          ? `${formatCurrency(u.dailyRate ?? 0)}/day`
                          : formatCurrency(u.monthlyRent ?? 0)}
                      </Td>
                      <Td>{formatCurrency(u.serviceCharge)}</Td>
                      <Td>
                        <Badge variant={isOccupied ? 'success' : 'default'}>
                          {isOccupied ? 'Occupied' : 'Vacant'}
                        </Badge>
                      </Td>
                      <Td>
                        <div className="flex gap-2">
                          <Link to={`/units/${u.id}`} className="p-1.5 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded transition-colors">
                            <Eye size={14} />
                          </Link>
                          {isManagerOrAdmin() && (
                            <>
                              <button onClick={() => openEdit(u)} className="p-1.5 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded transition-colors">
                                <Pencil size={14} />
                              </button>
                              <button onClick={() => setDeleteId(u.id)} className="p-1.5 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded transition-colors">
                                <Trash2 size={14} />
                              </button>
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

      {/* Create/Edit Modal */}
      <Modal isOpen={modalOpen} onClose={closeModal} title={editing ? 'Edit Unit' : 'Add Unit'} size="lg">
        {formError && <Alert variant="error" message={formError} className="mb-4" />}
        <form onSubmit={handleSubmit((d) => saveMutation.mutate(d))} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <Select
              id="propertyId"
              label="Property *"
              error={errors.propertyId?.message}
              options={properties.map((p: any) => ({ value: p.id, label: p.name }))}
              placeholder="Select property"
              {...register('propertyId')}
            />
            <Input id="unitNumber" label="Unit Number *" error={errors.unitNumber?.message} {...register('unitNumber')} />
            <Select
              id="unitType"
              label="Unit Type *"
              options={UNIT_TYPES.map((t) => ({ value: t, label: t }))}
              {...register('unitType')}
            />
            <Input id="bedrooms" label="Bedrooms *" type="number" min={0} error={errors.bedrooms?.message} {...register('bedrooms')} />
            {unitType === 'AIRBNB' ? (
              <Input id="dailyRate" label="Daily Rate (TSh) *" type="number" error={errors.dailyRate?.message} {...register('dailyRate')} />
            ) : (
              <Input id="monthlyRent" label="Monthly Rent (TSh) *" type="number" error={errors.monthlyRent?.message} {...register('monthlyRent')} />
            )}
            <Input id="serviceCharge" label="Service Charge (TSh)" type="number" error={errors.serviceCharge?.message} {...register('serviceCharge')} />
          </div>
          <div className="flex justify-end gap-3 pt-2">
            <Button variant="outline" type="button" onClick={closeModal}>Cancel</Button>
            <Button type="submit" loading={isSubmitting || saveMutation.isPending}>
              {editing ? 'Save Changes' : 'Create Unit'}
            </Button>
          </div>
        </form>
      </Modal>

      {/* Delete Confirm */}
      <Modal isOpen={!!deleteId} onClose={() => setDeleteId(null)} title="Delete Unit" size="sm">
        <p className="text-slate-600 text-sm mb-4">Are you sure you want to delete this unit?</p>
        <div className="flex justify-end gap-3">
          <Button variant="outline" onClick={() => setDeleteId(null)}>Cancel</Button>
          <Button variant="danger" loading={deleteMutation.isPending} onClick={() => deleteId && deleteMutation.mutate(deleteId)}>Delete</Button>
        </div>
      </Modal>
    </div>
  );
}
