/* eslint-disable no-undef */
import 'dotenv/config';
import express from 'express';
import bodyParser from 'body-parser';
import cors from 'cors';

import globalRoutes from './routes/globalRoutes.js';
import studentroutes from './routes/studentroutes.js'; 
import advisorRoutes from './routes/advisorRoutes.js';
import departmentChairRoutes from './routes/departmentChairRoutes.js';
import facultyRoutes from './routes/facultyRoutes.js';
import coordinatorRoutes from './routes/coordinatorRoutes.js';
import notificationRoutes from './routes/notificationRoutes.js'

const app = express();

const PORT = process.env.PORT || 5000;

app.use(bodyParser.json());
app.use(cors());

  app.use('/api', globalRoutes);
  app.use('/api', studentroutes); // Use student routes
  app.use((req, res, next) => {
    console.log(`[${new Date().toISOString()}] ${req.method} ${req.url}`);
    next();
  });
  app.use('/api/advisor', advisorRoutes);
  app.use('/api/department-chair', departmentChairRoutes);
  app.use('/api/faculty', facultyRoutes);
  app.use('/api/coordinator', coordinatorRoutes)

// Routes
app.use('/api', globalRoutes);
app.use('/api', studentroutes);
app.use('/api/advisor', advisorRoutes);
app.use('/api/department-chair', departmentChairRoutes);
app.use('/api/faculty', facultyRoutes);
app.use('/api/coordinator', coordinatorRoutes);
app.use('/api', notificationRoutes);

// Start server
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
