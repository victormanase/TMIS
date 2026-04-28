import { useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import { ArrowLeft, UserPlus, LogOut } from 'lucide-react';
import { unitsApi, assignmentsApi, type Assignment } from '@/api/units';
import { tenantsApi } from '@/api/tenants';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { Modal } from '@/components/ui/Modal';
import { Select } from '@/components/ui/Select';
import { Input } from '@/components/ui/Input';
import { Table, TableHead, TableBody, TableRow, Th, Td } from '@/components/ui/Table';
import { Alert } from '@/components/ui/Alert';
import { formatCurrency, formatDate } from '@/lib/utils';
import { useAuth } from '@/hooks/useAuth';

const assignSchema = z.object({
  tenantId: z.string().min(1, 'Select a tenant'),
  checkInDate: z.string().min(1, 'Check-in date is required'),
});
type AssignForm = z.infer<typeof assignSchema>;

export default function UnitDetailPage() {
  const { id } = useParams<{ id: string }>();
  const { isManagerOrAdmin } = useAuth();
  const qc = useQueryClient();
  const [assignModal, setAssignModal] = useState(false);
  const [formError, setFormError] = useState('');

  const { data: unit, isLoading } = useQuery({
    queryKey: ['unit', id],
    queryFn: () => unitsApi.get(id!),
  });

  const { data: tenantsData } = useQuery({
    queryKey: ['tenants-all'],
    queryFn: () => tenantsApi.list({ limit: 200 }),
  });

  const { register, handleSubmit, reset, formState: { errors, isSubmitting } } = useForm<AssignForm>({
    resolver: zodResolver(assignSchema),
  });

  const assignMutation = useMutation({
    mutationFn: (data: AssignForm) => assignmentsApi.assign({ unitId: id!, ...data }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['unit', id] });
      setAssignModal(false);
      reset();
    },
    onError: (err: any) => setFormError(err.response?.data?.message ?? 'Assignment failed'),
  });

  const checkoutMutation = useMutation({
    mutationFn: (assignmentId: string) => assignmentsApi.checkout(assignmentId),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['unit', id] }),
  });

  if (isLoading) return <div className="animate-pulse space-y-4"><div className="h-8 w-64 bg-slate-200 rounded" /><div className="h-40 bg-slate-100 rounded-xl" /></div>;
  if (!unit) return <p>Unit not found</p>;

  const activeAssignment = unit.assignments?.find((a: Assignment) => a.isActive);
  const tenants = tenantsData?.data ?? [];

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <Link to="/units" className="p-2 hover:bg-slate-100 rounded-lg text-slate-500"><ArrowLeft size={18} /></Link>
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Unit {unit.unitNumber}</h1>
          <p className="text-sm text-slate-500">{unit.property?.name} · {unit.property?.location}</p>
        </div>
        <Badge variant={activeAssignment ? 'success' : 'default'} className="ml-auto">
          {activeAssignment ? 'Occupied' : 'Vacant'}
        </Badge>
      </div>

      {/* Unit Info */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardContent className="py-4">
            <p className="text-xs text-slate-400 mb-1">Unit Type</p>
            <p className="font-semibold">{unit.unitType}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="py-4">
            <p className="text-xs text-slate-400 mb-1">Bedrooms</p>
            <p className="font-semibold">{unit.bedrooms}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="py-4">
            <p className="text-xs text-slate-400 mb-1">
              {unit.unitType === 'AIRBNB' ? 'Daily Rate' : 'Monthly Rent'}
            </p>
            <p className="font-semibold">
              {unit.unitType === 'AIRBNB'
                ? formatCurrency(unit.dailyRate ?? 0)
                : formatCurrency(unit.monthlyRent ?? 0)}
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Current Tenant */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle>Current Occupant</CardTitle>
          {isManagerOrAdmin() && !activeAssignment && (
            <Button size="sm" onClick={() => { setFormError(''); setAssignModal(true); }}>
              <UserPlus size={14} className="mr-1" /> Assign Tenant
            </Button>
          )}
        </CardHeader>
        <CardContent>
          {activeAssignment ? (
            <div className="flex items-center justify-between">
              <div>
                <p className="font-medium">
                  {activeAssignment.tenant?.firstName} {activeAssignment.tenant?.lastName}
                </p>
                <p className="text-sm text-slate-500">{activeAssignment.tenant?.phone}</p>
                <p className="text-xs text-slate-400 mt-1">
                  Check-in: {formatDate(activeAssignment.checkInDate)}
                </p>
              </div>
              {isManagerOrAdmin() && (
                <Button
                  variant="danger"
                  size="sm"
                  loading={checkoutMutation.isPending}
                  onClick={() => checkoutMutation.mutate(activeAssignment.id)}
                >
                  <LogOut size={14} className="mr-1" /> Check Out
                </Button>
              )}
            </div>
          ) : (
            <p className="text-slate-400 text-sm">No active tenant assigned</p>
          )}
        </CardContent>
      </Card>

      {/* Assignment History */}
      <Card>
        <CardHeader><CardTitle>Assignment History</CardTitle></CardHeader>
        <CardContent className="p-0">
          <Table>
            <TableHead>
              <tr>
                <Th>Tenant</Th>
                <Th>Phone</Th>
                <Th>Check-In</Th>
                <Th>Check-Out</Th>
                <Th>Status</Th>
              </tr>
            </TableHead>
            <TableBody>
              {(unit.assignments ?? []).map((a: Assignment) => (
                <TableRow key={a.id}>
                  <Td>{a.tenant?.firstName} {a.tenant?.lastName}</Td>
                  <Td>{a.tenant?.phone}</Td>
                  <Td>{formatDate(a.checkInDate)}</Td>
                  <Td>{a.checkOutDate ? formatDate(a.checkOutDate) : '—'}</Td>
                  <Td>
                    <Badge variant={a.isActive ? 'success' : 'default'}>
                      {a.isActive ? 'Active' : 'Ended'}
                    </Badge>
                  </Td>
                </TableRow>
              ))}
              {(unit.assignments ?? []).length === 0 && (
                <TableRow><Td colSpan={5} className="text-center text-slate-400 py-6">No assignment history</Td></TableRow>
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Assign Modal */}
      <Modal isOpen={assignModal} onClose={() => setAssignModal(false)} title="Assign Tenant" size="sm">
        {formError && <Alert variant="error" message={formError} className="mb-4" />}
        <form onSubmit={handleSubmit((d) => assignMutation.mutate(d))} className="space-y-4">
          <Select
            id="tenantId"
            label="Select Tenant *"
            error={errors.tenantId?.message}
            options={tenants.map((t: any) => ({ value: t.id, label: `${t.firstName} ${t.lastName} (${t.phone})` }))}
            placeholder="Choose a tenant"
            {...register('tenantId')}
          />
          <Input id="checkInDate" label="Check-In Date *" type="date" error={errors.checkInDate?.message} {...register('checkInDate')} />
          <div className="flex justify-end gap-3">
            <Button variant="outline" type="button" onClick={() => setAssignModal(false)}>Cancel</Button>
            <Button type="submit" loading={isSubmitting || assignMutation.isPending}>Assign</Button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
