/* eslint-disable no-undef */
import 'dotenv/config'; // Import dotenv to load environment variables
import express from 'express';
import bodyParser from 'body-parser';
import cors from 'cors';

import globalRoutes from './routes/globalRoutes.js'; // Make sure to include the `.js` extension
import studentroutes from './routes/studentroutes.js'

const app = express();
const PORT = process.env.PORT || 5000;

app.use(bodyParser.json());
app.use(cors());

app.use('/api', globalRoutes);
app.use('/api', studentroutes);

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
