import { forwardRef } from 'react';
import type { InputHTMLAttributes } from 'react';
import { Form } from 'react-bootstrap';

interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
}

export const Input = forwardRef<HTMLInputElement, InputProps>(
  ({ className, label, error, id, ...props }, ref) => (
    <Form.Group className="mb-0">
      {label && <Form.Label htmlFor={id}>{label}</Form.Label>}
      <Form.Control
        ref={ref}
        id={id}
        isInvalid={!!error}
        className={className}
        {...props}
      />
      {error && <Form.Control.Feedback type="invalid">{error}</Form.Control.Feedback>}
    </Form.Group>
  )
);
Input.displayName = 'Input';
