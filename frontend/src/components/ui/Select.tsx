import { forwardRef } from 'react';
import type { SelectHTMLAttributes } from 'react';
import { Form } from 'react-bootstrap';

interface SelectProps extends SelectHTMLAttributes<HTMLSelectElement> {
  label?: string;
  error?: string;
  options: { value: string; label: string }[];
  placeholder?: string;
}

export const Select = forwardRef<HTMLSelectElement, SelectProps>(
  ({ className, label, error, id, options, placeholder, ...props }, ref) => (
    <Form.Group className="mb-0">
      {label && <Form.Label htmlFor={id}>{label}</Form.Label>}
      <Form.Select ref={ref} id={id} isInvalid={!!error} className={className} {...props}>
        {placeholder && <option value="">{placeholder}</option>}
        {options.map((opt) => (
          <option key={opt.value} value={opt.value}>
            {opt.label}
          </option>
        ))}
      </Form.Select>
      {error && <Form.Control.Feedback type="invalid">{error}</Form.Control.Feedback>}
    </Form.Group>
  )
);
Select.displayName = 'Select';
