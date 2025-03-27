import express from 'express';
import { createServer } from 'http';
import { Server } from 'socket.io';
import cors from 'cors';
import { config } from 'dotenv';
import { UserModel } from './models/user';
import { authenticateSocket, generateToken } from './middleware/auth';
import cookieParser from 'cookie-parser';
import prisma from './lib/prisma';

// Load environment variables
config();

const app = express();
const httpServer = createServer(app);
const io = new Server(httpServer, {
  cors: {
    origin: process.env.FRONTEND_URL || 'http://localhost:5173',
    methods: ['GET', 'POST'],
    credentials: true
  }
});

// Middleware
app.use(cors({
  origin: process.env.FRONTEND_URL || 'http://localhost:5173',
  credentials: true
}));
app.use(express.json());
app.use(cookieParser());

// Authentication endpoints
app.post('/api/auth/register', async (req, res) => {
  try {
    const { username, password } = req.body;
    
    if (!username || !password) {
      return res.status(400).json({ error: 'Username and password required' });
    }

    const existingUser = await UserModel.findByUsername(username);
    if (existingUser) {
      return res.status(400).json({ error: 'Username already exists' });
    }

    const user = await UserModel.create(username, password);
    const token = generateToken(user.id);

    return res.json({ token });
  } catch (error) {
    return res.status(500).json({ error: 'Server error' });
  }
});

app.post('/api/auth/login', async (req, res) => {
  try {
    const { username, password } = req.body;
    
    if (!username || !password) {
      return res.status(400).json({ error: 'Username and password required' });
    }

    const user = await UserModel.findByUsername(username);
    if (!user) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    const isValid = await UserModel.verifyPassword(user, password);
    if (!isValid) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    const token = generateToken(user.id);
    return res.json({ token });
  } catch (error) {
    return res.status(500).json({ error: 'Server error' });
  }
});

// Encounter endpoints
app.post('/api/encounters', async (req: any, res) => {
  try {
    const { name } = req.body;
    
    if (!name) {
      return res.status(400).json({ error: 'Encounter name required' });
    }

    const newEncounter = await prisma.encounter.create({
      data: {
        name,
        userId: req.userId,
        entries: [],
        isActive: false
      }
    });

    return res.json(newEncounter);
  } catch (error) {
    return res.status(500).json({ error: 'Server error' });
  }
});

app.get('/api/encounters', async (req: any, res) => {
  try {
    const encounters = await prisma.encounter.findMany({
      where: { userId: req.userId },
      orderBy: { updatedAt: 'desc' }
    });
    return res.json(encounters);
  } catch (error) {
    return res.status(500).json({ error: 'Server error' });
  }
});

app.get('/api/encounters/:id', async (req: any, res) => {
  try {
    const encounter = await prisma.encounter.findFirst({
      where: {
        id: req.params.id,
        userId: req.userId
      }
    });

    if (!encounter) {
      return res.status(404).json({ error: 'Encounter not found' });
    }

    return res.json(encounter);
  } catch (error) {
    return res.status(500).json({ error: 'Server error' });
  }
});

app.put('/api/encounters/:id', async (req: any, res) => {
  try {
    const { entries, isActive } = req.body;
    const encounter = await prisma.encounter.update({
      where: {
        id: req.params.id,
        userId: req.userId
      },
      data: {
        entries,
        isActive
      }
    });

    // Emit update to all connected clients
    io.emit(`encounter:${req.params.id}`, encounter);
    return res.json(encounter);
  } catch (error) {
    return res.status(500).json({ error: 'Server error' });
  }
});

app.delete('/api/encounters/:id', async (req: any, res) => {
  try {
    await prisma.encounter.delete({
      where: {
        id: req.params.id,
        userId: req.userId
      }
    });
    return res.json({ message: 'Encounter deleted' });
  } catch (error) {
    return res.status(500).json({ error: 'Server error' });
  }
});

// Socket.IO connection handling
io.use((socket, next) => {
  const token = socket.handshake.auth.token;
  const userId = authenticateSocket(token);
  
  if (!userId) {
    next(new Error('Authentication error'));
  } else {
    socket.data.userId = userId;
    next();
  }
});

io.on('connection', (socket) => {
  console.log('Client connected');

  socket.on('disconnect', () => {
    console.log('Client disconnected');
  });
});

const PORT = process.env.PORT || 5050;
httpServer.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});