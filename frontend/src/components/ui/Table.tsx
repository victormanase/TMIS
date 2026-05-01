import type { HTMLAttributes, ThHTMLAttributes, TdHTMLAttributes } from 'react';
import { Table as BsTable } from 'react-bootstrap';

export function Table({ className, ...props }: HTMLAttributes<HTMLTableElement>) {
  return (
    <div className="table-responsive">
      <BsTable hover className={`mb-0 ${className ?? ''}`} {...(props as any)} />
    </div>
  );
}

export function TableHead({ ...props }: HTMLAttributes<HTMLTableSectionElement>) {
  return <thead {...props} />;
}

export function TableBody({ ...props }: HTMLAttributes<HTMLTableSectionElement>) {
  return <tbody {...props} />;
}

export function TableRow({ ...props }: HTMLAttributes<HTMLTableRowElement>) {
  return <tr {...props} />;
}

export function Th({ className, ...props }: ThHTMLAttributes<HTMLTableCellElement>) {
  return <th className={className} {...props} />;
}

export function Td({ className, ...props }: TdHTMLAttributes<HTMLTableCellElement>) {
  return <td className={className} {...props} />;
}

interface PaginationProps {
  page: number;
  totalPages: number;
  onPageChange: (page: number) => void;
}

export function Pagination({ page, totalPages, onPageChange }: PaginationProps) {
  return (
    <div className="d-flex align-items-center justify-content-between px-3 py-2 border-top bg-white">
      <small className="text-muted">Page {page} of {totalPages}</small>
      <div className="d-flex gap-2">
        <button
          className="btn btn-sm btn-outline-secondary"
          onClick={() => onPageChange(page - 1)}
          disabled={page <= 1}
        >
          Previous
        </button>
        <button
          className="btn btn-sm btn-outline-secondary"
          onClick={() => onPageChange(page + 1)}
          disabled={page >= totalPages}
        >
          Next
        </button>
      </div>
    </div>
  );
}
