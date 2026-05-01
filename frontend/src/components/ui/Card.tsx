import { Card as BsCard } from 'react-bootstrap';
import type { HTMLAttributes } from 'react';

export function Card({ className, ...props }: HTMLAttributes<HTMLDivElement>) {
  return <BsCard className={className} {...props} />;
}

export function CardHeader({ className, ...props }: HTMLAttributes<HTMLDivElement>) {
  return <BsCard.Header className={className} {...props} />;
}

export function CardContent({ className, ...props }: HTMLAttributes<HTMLDivElement>) {
  return <BsCard.Body className={className} {...props} />;
}

export function CardTitle({ className, ...props }: HTMLAttributes<HTMLHeadingElement>) {
  return <h5 className={`mb-0 fw-semibold ${className ?? ''}`} style={{ fontSize: 15 }} {...props} />;
}
