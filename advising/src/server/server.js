/* eslint-disable no-undef */
import 'dotenv/config';
import express from 'express';
import bodyParser from 'body-parser';
import cors from 'cors';

import globalRoutes from './routes/globalRoutes.js';
import studentroutes from './routes/studentroutes.js'; 
import { verifyToken } from './middleware/verifytoken.js';

const app = express();
const PORT = process.env.PORT || 5000;

app.use(bodyParser.json());
app.use(cors());

app.use('/api', globalRoutes);
app.use('/api', studentroutes); // Use student routes


// Apply token verification for secure routes
app.use('/api', verifyToken, globalRoutes);
app.use('/api', verifyToken, studentroutes);

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
