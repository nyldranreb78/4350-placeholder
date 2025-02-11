import 'dotenv/config';

import express, { Request, Response, NextFunction } from 'express';
import cors from 'cors';
import authRoutes from './routes/api/auth';
import cookieParser from 'cookie-parser';
import mongoose from 'mongoose';
import path from 'path';
import corsOptions from './config/cors';
import connectDB from './config/database';
import credentials from './middleware/credentials';
import errorHandlerMiddleware from './middleware/error_handler';
import authenticationMiddleware from './middleware/authentication';

const app = express();
const PORT = process.env.PORT;

connectDB();

// Allow Credentials
app.use(credentials);

// CORS
app.use(cors(corsOptions));

// application/x-www-form-urlencoded
app.use(express.urlencoded({ extended: false }));

// application/json response
app.use(express.json());

// middleware for cookies
app.use(cookieParser());

app.use(authenticationMiddleware);

// static files
app.use('/static', express.static(path.join(__dirname, 'public')));

// Default error handler
app.use(errorHandlerMiddleware);

// Routes
app.use('/api/auth', authRoutes);

app.all('*', (req: Request, res: Response) => {
  res.status(404);

  if (req.accepts('json')) {
    res.json({ error: '404 Not Found' });
  } else {
    res.type('text').send('404 Not Found');
  }
});

mongoose.connection.once('open', () => {
  app.listen(PORT, () => { console.log(`Listening on port ${PORT}`); });
});

