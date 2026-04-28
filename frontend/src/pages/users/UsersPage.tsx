import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import {
  Plus, Pencil, ToggleLeft, ToggleRight, Trash2, Search,
  Check, X, ShieldCheck, Briefcase, Calculator, Eye as EyeIcon,
  Users, UserCheck, UserX,
} from 'lucide-react';
import { usersApi, type User } from '@/api/users';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Select } from '@/components/ui/Select';
import { Modal } from '@/components/ui/Modal';
import { Table, TableHead, TableBody, TableRow, Th, Td, Pagination } from '@/components/ui/Table';
import { Badge } from '@/components/ui/Badge';
import { Alert } from '@/components/ui/Alert';
import { cn } from '@/lib/utils';

// ─── Schemas ────────────────────────────────────────────────────────────────

const createSchema = z.object({
  firstName: z.string().min(1, 'Required'),
  lastName: z.string().min(1, 'Required'),
  email: z.string().email('Invalid email'),
  phone: z.string().optional(),
  role: z.enum(['ADMIN', 'MANAGER', 'ACCOUNTANT', 'VIEWER']),
  password: z.string().min(8, 'Minimum 8 characters'),
});

const editSchema = z.object({
  firstName: z.string().min(1, 'Required'),
  lastName: z.string().min(1, 'Required'),
  email: z.string().email('Invalid email'),
  phone: z.string().optional(),
  role: z.enum(['ADMIN', 'MANAGER', 'ACCOUNTANT', 'VIEWER']),
  password: z.string().min(8, 'Minimum 8 characters').optional().or(z.literal('')),
});

type CreateForm = z.infer<typeof createSchema>;
type EditForm = z.infer<typeof editSchema>;

// ─── Role config ─────────────────────────────────────────────────────────────

const roleConfig = {
  ADMIN: {
    label: 'Admin',
    color: 'bg-red-100 text-red-700 border-red-200',
    icon: ShieldCheck,
    iconColor: 'text-red-500',
    description: 'Full system access. Can manage users, all properties, units, tenants, payments, bookings, reports and audit logs.',
  },
  MANAGER: {
    label: 'Manager',
    color: 'bg-blue-100 text-blue-700 border-blue-200',
    icon: Briefcase,
    iconColor: 'text-blue-500',
    description: 'Manages properties, units, tenants, payments and AirBnB bookings. Can view and export all reports. Cannot manage users or view audit logs.',
  },
  ACCOUNTANT: {
    label: 'Accountant',
    color: 'bg-amber-100 text-amber-700 border-amber-200',
    icon: Calculator,
    iconColor: 'text-amber-500',
    description: 'Records and views payments. Can view and export financial and AirBnB reports including upcoming collections. Read-only access to properties, units and tenants.',
  },
  VIEWER: {
    label: 'Viewer',
    color: 'bg-slate-100 text-slate-600 border-slate-200',
    icon: EyeIcon,
    iconColor: 'text-slate-400',
    description: 'Dashboard access only. Can view the system overview but cannot make any changes or access detailed records.',
  },
} as const;

type RoleKey = keyof typeof roleConfig;

// Permission matrix — what each role can do
const permissions: { feature: string; admin: boolean; manager: boolean; accountant: boolean; viewer: boolean }[] = [
  { feature: 'Dashboard & KPIs',          admin: true,  manager: true,  accountant: true,  viewer: true  },
  { feature: 'Upcoming collections alert', admin: true,  manager: true,  accountant: true,  viewer: false },
  { feature: 'View properties & units',    admin: true,  manager: true,  accountant: true,  viewer: false },
  { feature: 'Create / edit properties',   admin: true,  manager: true,  accountant: false, viewer: false },
  { feature: 'Create / edit units',        admin: true,  manager: true,  accountant: false, viewer: false },
  { feature: 'Assign tenants to units',    admin: true,  manager: true,  accountant: false, viewer: false },
  { feature: 'View tenants',              admin: true,  manager: true,  accountant: true,  viewer: false },
  { feature: 'Create / edit tenants',     admin: true,  manager: true,  accountant: false, viewer: false },
  { feature: 'Record payments',           admin: true,  manager: true,  accountant: true,  viewer: false },
  { feature: 'View payment history',      admin: true,  manager: true,  accountant: true,  viewer: false },
  { feature: 'Manage AirBnB bookings',    admin: true,  manager: true,  accountant: false, viewer: false },
  { feature: 'View AirBnB bookings',      admin: true,  manager: true,  accountant: true,  viewer: false },
  { feature: 'Rental reports & export',   admin: true,  manager: true,  accountant: true,  viewer: false },
  { feature: 'AirBnB reports & export',   admin: true,  manager: true,  accountant: true,  viewer: false },
  { feature: 'Upcoming collections report',admin: true, manager: true,  accountant: true,  viewer: false },
  { feature: 'Manage users',              admin: true,  manager: false, accountant: false, viewer: false },
  { feature: 'Audit logs',               admin: true,  manager: false, accountant: false, viewer: false },
];

// ─── Helpers ─────────────────────────────────────────────────────────────────

function Initials({ name, role }: { name: string; role: RoleKey }) {
  const cfg = roleConfig[role];
  const parts = name.split(' ');
  const initials = (parts[0]?.[0] ?? '') + (parts[1]?.[0] ?? '');
  return (
    <span className={cn(
      'inline-flex items-center justify-center w-9 h-9 rounded-full text-sm font-bold border',
      cfg.color
    )}>
      {initials.toUpperCase()}
    </span>
  );
}

function Tick({ yes }: { yes: boolean }) {
  return yes
    ? <Check size={15} className="text-emerald-500 mx-auto" />
    : <X size={15} className="text-slate-300 mx-auto" />;
}

// ─── Page ────────────────────────────────────────────────────────────────────

export default function UsersPage() {
  const qc = useQueryClient();
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState('');
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState<User | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<User | null>(null);
  const [formError, setFormError] = useState('');
  const [showMatrix, setShowMatrix] = useState(false);

  const { data, isLoading } = useQuery({
    queryKey: ['users', page, search],
    queryFn: () => usersApi.list({ page, limit: 20, search: search || undefined }),
  });

  const createForm = useForm<CreateForm>({ resolver: zodResolver(createSchema) });
  const editForm = useForm<EditForm>({ resolver: zodResolver(editSchema) });
  const activeForm = editing ? editForm : createForm;

  const saveMutation = useMutation({
    mutationFn: (d: CreateForm | EditForm) => {
      const payload = { ...d, password: d.password || undefined };
      return editing ? usersApi.update(editing.id, payload) : usersApi.create(payload as any);
    },
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['users'] }); closeModal(); },
    onError: (err: any) => setFormError(err.response?.data?.message ?? 'Save failed'),
  });

  const toggleMutation = useMutation({
    mutationFn: (id: string) => usersApi.toggleActive(id),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['users'] }),
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => usersApi.delete(id),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['users'] }); setDeleteTarget(null); },
  });

  function openCreate() {
    setEditing(null);
    createForm.reset({});
    setFormError('');
    setModalOpen(true);
  }

  function openEdit(u: User) {
    setEditing(u);
    editForm.reset({ firstName: u.firstName, lastName: u.lastName, email: u.email, phone: u.phone ?? '', role: u.role, password: '' });
    setFormError('');
    setModalOpen(true);
  }

  function closeModal() {
    setModalOpen(false);
    setEditing(null);
    createForm.reset({});
    editForm.reset({});
    setFormError('');
  }

  const users: User[] = data?.data ?? [];
  const pagination = data?.pagination;

  // Role stats
  const roleCounts = users.reduce<Record<string, number>>((acc, u) => {
    acc[u.role] = (acc[u.role] ?? 0) + 1;
    return acc;
  }, {});
  const activeCount = users.filter((u) => u.isActive).length;
  const inactiveCount = users.length - activeCount;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">User Management</h1>
          <p className="text-sm text-slate-500 mt-1">Create accounts, assign roles and control access</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" onClick={() => setShowMatrix(!showMatrix)}>
            {showMatrix ? 'Hide' : 'Show'} Permissions
          </Button>
          <Button onClick={openCreate}><Plus size={16} className="mr-1" /> Add User</Button>
        </div>
      </div>

      {/* Role cards — what each role can do */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {(Object.entries(roleConfig) as [RoleKey, typeof roleConfig[RoleKey]][]).map(([role, cfg]) => {
          const Icon = cfg.icon;
          return (
            <Card key={role} className={cn('border', cfg.color.split(' ').find(c => c.startsWith('border')))}>
              <CardContent className="py-4 space-y-2">
                <div className="flex items-center justify-between">
                  <span className={cn('inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold border', cfg.color)}>
                    <Icon size={12} /> {cfg.label}
                  </span>
                  <span className="text-2xl font-bold text-slate-700">{roleCounts[role] ?? 0}</span>
                </div>
                <p className="text-xs text-slate-500 leading-relaxed">{cfg.description}</p>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Permission matrix (collapsible) */}
      {showMatrix && (
        <Card>
          <CardHeader><CardTitle>Role Permissions Matrix</CardTitle></CardHeader>
          <CardContent className="p-0 overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-slate-100 bg-slate-50">
                  <th className="text-left px-4 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wide w-64">Feature</th>
                  {(['ADMIN', 'MANAGER', 'ACCOUNTANT', 'VIEWER'] as RoleKey[]).map((r) => {
                    const cfg = roleConfig[r];
                    const Icon = cfg.icon;
                    return (
                      <th key={r} className="px-4 py-3 text-center text-xs font-semibold text-slate-500 uppercase tracking-wide">
                        <span className={cn('inline-flex items-center gap-1 px-2 py-1 rounded-full border text-xs', cfg.color)}>
                          <Icon size={11} /> {cfg.label}
                        </span>
                      </th>
                    );
                  })}
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50">
                {permissions.map((p) => (
                  <tr key={p.feature} className="hover:bg-slate-50">
                    <td className="px-4 py-2.5 text-slate-700">{p.feature}</td>
                    <td className="px-4 py-2.5 text-center"><Tick yes={p.admin} /></td>
                    <td className="px-4 py-2.5 text-center"><Tick yes={p.manager} /></td>
                    <td className="px-4 py-2.5 text-center"><Tick yes={p.accountant} /></td>
                    <td className="px-4 py-2.5 text-center"><Tick yes={p.viewer} /></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </CardContent>
        </Card>
      )}

      {/* Stats bar */}
      <div className="flex gap-4">
        <div className="flex items-center gap-2 text-sm text-slate-500">
          <Users size={15} /> <span className="font-medium text-slate-700">{users.length}</span> total
        </div>
        <div className="flex items-center gap-2 text-sm text-slate-500">
          <UserCheck size={15} className="text-emerald-500" /> <span className="font-medium text-emerald-600">{activeCount}</span> active
        </div>
        {inactiveCount > 0 && (
          <div className="flex items-center gap-2 text-sm text-slate-500">
            <UserX size={15} className="text-red-400" /> <span className="font-medium text-red-500">{inactiveCount}</span> inactive
          </div>
        )}
      </div>

      {/* Search */}
      <Card>
        <CardContent className="py-3">
          <div className="relative max-w-sm">
            <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              className="w-full pl-9 pr-3 py-2 text-sm border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="Search by name or email…"
              value={search}
              onChange={(e) => { setSearch(e.target.value); setPage(1); }}
            />
          </div>
        </CardContent>
      </Card>

      {/* Users table */}
      {isLoading ? (
        <div className="space-y-2">
          {Array.from({ length: 5 }).map((_, i) => <div key={i} className="h-16 bg-slate-100 rounded-lg animate-pulse" />)}
        </div>
      ) : (
        <>
          <Table>
            <TableHead>
              <tr>
                <Th>User</Th>
                <Th>Email</Th>
                <Th>Phone</Th>
                <Th>Role</Th>
                <Th>Status</Th>
                <Th>Actions</Th>
              </tr>
            </TableHead>
            <TableBody>
              {users.length === 0 ? (
                <TableRow>
                  <Td colSpan={6} className="text-center text-slate-400 py-10">No users found</Td>
                </TableRow>
              ) : (
                users.map((u) => {
                  const cfg = roleConfig[u.role as RoleKey];
                  const Icon = cfg?.icon ?? EyeIcon;
                  return (
                    <TableRow key={u.id}>
                      <Td>
                        <div className="flex items-center gap-3">
                          <Initials name={`${u.firstName} ${u.lastName}`} role={u.role as RoleKey} />
                          <div>
                            <p className="font-medium text-slate-900">{u.firstName} {u.lastName}</p>
                            <p className="text-xs text-slate-400">Since {new Date(u.createdAt).toLocaleDateString()}</p>
                          </div>
                        </div>
                      </Td>
                      <Td className="text-slate-600">{u.email}</Td>
                      <Td className="text-slate-600">{u.phone ?? '—'}</Td>
                      <Td>
                        <span className={cn(
                          'inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold border',
                          cfg?.color ?? 'bg-slate-100 text-slate-600 border-slate-200'
                        )}>
                          <Icon size={11} /> {u.role}
                        </span>
                      </Td>
                      <Td>
                        <Badge variant={u.isActive ? 'success' : 'danger'}>
                          {u.isActive ? 'Active' : 'Inactive'}
                        </Badge>
                      </Td>
                      <Td>
                        <div className="flex items-center gap-1">
                          {/* Edit */}
                          <button
                            onClick={() => openEdit(u)}
                            title="Edit user"
                            className="p-1.5 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded transition-colors"
                          >
                            <Pencil size={14} />
                          </button>

                          {/* Toggle active */}
                          <button
                            onClick={() => toggleMutation.mutate(u.id)}
                            title={u.isActive ? 'Deactivate' : 'Activate'}
                            className={cn(
                              'p-1.5 rounded transition-colors',
                              u.isActive
                                ? 'text-emerald-500 hover:text-amber-500 hover:bg-amber-50'
                                : 'text-slate-400 hover:text-emerald-600 hover:bg-emerald-50'
                            )}
                          >
                            {u.isActive ? <ToggleRight size={16} /> : <ToggleLeft size={16} />}
                          </button>

                          {/* Delete */}
                          <button
                            onClick={() => setDeleteTarget(u)}
                            title="Delete user"
                            className="p-1.5 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded transition-colors"
                          >
                            <Trash2 size={14} />
                          </button>
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

      {/* Create / Edit modal */}
      <Modal
        isOpen={modalOpen}
        onClose={closeModal}
        title={editing ? `Edit — ${editing.firstName} ${editing.lastName}` : 'Add New User'}
        size="lg"
      >
        {formError && <Alert variant="error" message={formError} className="mb-4" />}

        {editing && (
          <div className="flex items-center gap-3 p-3 bg-slate-50 rounded-lg mb-4">
            <Initials name={`${editing.firstName} ${editing.lastName}`} role={editing.role as RoleKey} />
            <div>
              <p className="text-sm font-medium text-slate-900">{editing.firstName} {editing.lastName}</p>
              <p className="text-xs text-slate-500">{editing.email}</p>
            </div>
            <Badge variant={editing.isActive ? 'success' : 'danger'} className="ml-auto">
              {editing.isActive ? 'Active' : 'Inactive'}
            </Badge>
          </div>
        )}

        <form
          onSubmit={activeForm.handleSubmit((d) => saveMutation.mutate(d as any))}
          className="space-y-4"
        >
          <div className="grid grid-cols-2 gap-4">
            <Input
              id="firstName" label="First Name *"
              error={activeForm.formState.errors.firstName?.message}
              {...activeForm.register('firstName')}
            />
            <Input
              id="lastName" label="Last Name *"
              error={activeForm.formState.errors.lastName?.message}
              {...activeForm.register('lastName')}
            />
            <Input
              id="email" label="Email Address *" type="email"
              error={activeForm.formState.errors.email?.message}
              {...activeForm.register('email')}
            />
            <Input
              id="phone" label="Phone Number" type="tel"
              {...activeForm.register('phone')}
            />
          </div>

          {/* Role selector with description */}
          <div className="space-y-2">
            <label className="text-sm font-medium text-slate-700">Role *</label>
            <div className="grid grid-cols-2 gap-3">
              {(Object.entries(roleConfig) as [RoleKey, typeof roleConfig[RoleKey]][]).map(([role, cfg]) => {
                const Icon = cfg.icon;
                const selected = activeForm.watch('role') === role;
                return (
                  <label
                    key={role}
                    className={cn(
                      'flex items-start gap-3 p-3 rounded-lg border-2 cursor-pointer transition-all',
                      selected ? 'border-blue-500 bg-blue-50' : 'border-slate-200 hover:border-slate-300'
                    )}
                  >
                    <input type="radio" className="sr-only" value={role} {...activeForm.register('role')} />
                    <Icon size={18} className={cn('mt-0.5 shrink-0', cfg.iconColor)} />
                    <div>
                      <p className="text-sm font-semibold text-slate-800">{cfg.label}</p>
                      <p className="text-xs text-slate-500 leading-relaxed mt-0.5">{cfg.description}</p>
                    </div>
                  </label>
                );
              })}
            </div>
            {activeForm.formState.errors.role && (
              <p className="text-xs text-red-500">{activeForm.formState.errors.role.message}</p>
            )}
          </div>

          <Input
            id="password"
            label={editing ? 'New Password (leave blank to keep current)' : 'Password *'}
            type="password"
            placeholder={editing ? '••••••••' : 'Minimum 8 characters'}
            error={activeForm.formState.errors.password?.message}
            {...activeForm.register('password')}
          />

          <div className="flex justify-end gap-3 pt-2 border-t border-slate-100">
            <Button variant="outline" type="button" onClick={closeModal}>Cancel</Button>
            <Button
              type="submit"
              loading={activeForm.formState.isSubmitting || saveMutation.isPending}
            >
              {editing ? 'Save Changes' : 'Create User'}
            </Button>
          </div>
        </form>
      </Modal>

      {/* Delete confirmation */}
      <Modal
        isOpen={!!deleteTarget}
        onClose={() => setDeleteTarget(null)}
        title="Delete User"
        size="sm"
      >
        {deleteTarget && (
          <>
            <div className="flex items-center gap-3 p-3 bg-red-50 rounded-lg mb-4">
              <Initials name={`${deleteTarget.firstName} ${deleteTarget.lastName}`} role={deleteTarget.role as RoleKey} />
              <div>
                <p className="text-sm font-medium text-slate-900">{deleteTarget.firstName} {deleteTarget.lastName}</p>
                <p className="text-xs text-slate-500">{deleteTarget.role} · {deleteTarget.email}</p>
              </div>
            </div>
            <p className="text-sm text-slate-600 mb-5">
              This user will be permanently removed. All their recorded actions in the audit log will be preserved, but they will no longer be able to log in.
            </p>
            <div className="flex justify-end gap-3">
              <Button variant="outline" onClick={() => setDeleteTarget(null)}>Cancel</Button>
              <Button
                variant="danger"
                loading={deleteMutation.isPending}
                onClick={() => deleteMutation.mutate(deleteTarget.id)}
              >
                Delete User
              </Button>
            </div>
          </>
        )}
      </Modal>
    </div>
  );
}
