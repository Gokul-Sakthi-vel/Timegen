import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import subjectsRouter from './routes/subjects';
import roomsRouter from './routes/rooms';
import classesRouter from './routes/classes';
import facultyRouter from './routes/faculty';
import testRouter from './routes/test';
import authRouter from './routes/auth';
import timetablesRouter from './routes/timetables';

dotenv.config();

const app = express();
const port = process.env.PORT || 5000;

app.use(cors());
app.use(express.json());

app.use('/api/subjects', subjectsRouter);
app.use('/api/rooms', roomsRouter);
app.use('/api/classes', classesRouter);
app.use('/api/faculty', facultyRouter);
app.use('/api/test', testRouter);
app.use('/api/auth', authRouter);
app.use('/api/timetables', timetablesRouter);

app.get('/', (req, res) => {
  res.send('Hello from the backend!');
});

app.listen(port, () => {
  console.log(`Server is running on port: ${port}`);
});
