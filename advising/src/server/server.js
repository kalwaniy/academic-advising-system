  /* eslint-disable no-undef */
  import 'dotenv/config';
  import express from 'express';
  import bodyParser from 'body-parser';
  import cors from 'cors';

  import globalRoutes from './routes/globalRoutes.js';
  import studentroutes from './routes/studentroutes.js'; 
  import advisorRoutes from './routes/advisorRoutes.js';
  import { verifyToken } from './middleware/auth.js';

  const app = express();
  const PORT = process.env.PORT || 5000;

  app.use(bodyParser.json());
  app.use(cors());

  app.use('/api', globalRoutes);
  app.use('/api', studentroutes); // Use student routes
  app.use('/api', advisorRoutes);


  app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
  });
