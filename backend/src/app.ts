import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';

import authRoutes from './routes/auth.routes';
import usersRoutes from './routes/users.routes';
import propertiesRoutes from './routes/properties.routes';
import unitsRoutes from './routes/units.routes';
import tenantsRoutes from './routes/tenants.routes';
import assignmentsRoutes from './routes/assignments.routes';
import paymentsRoutes from './routes/payments.routes';
import bookingsRoutes from './routes/bookings.routes';
import reportsRoutes from './routes/reports.routes';
import auditLogsRoutes from './routes/auditLogs.routes';
import { errorHandler } from './middleware/errorHandler';

const app = express();

app.use(helmet());
app.use(cors({ origin: process.env.FRONTEND_URL ?? '*', credentials: true }));
app.use(morgan('dev'));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.use('/api/auth', authRoutes);
app.use('/api/users', usersRoutes);
app.use('/api/properties', propertiesRoutes);
app.use('/api/units', unitsRoutes);
app.use('/api/tenants', tenantsRoutes);
app.use('/api/assignments', assignmentsRoutes);
app.use('/api/payments', paymentsRoutes);
app.use('/api/bookings', bookingsRoutes);
app.use('/api/reports', reportsRoutes);
app.use('/api/audit-logs', auditLogsRoutes);

app.get('/api/health', (_req, res) => res.json({ status: 'ok', timestamp: new Date() }));

app.use(errorHandler);

export default app;
