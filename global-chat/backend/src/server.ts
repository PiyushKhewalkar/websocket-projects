import express from "express";
import WebSocket, { WebSocketServer } from "ws";
import { v4 as uuidv4 } from "uuid";
import dotenv from "dotenv";
import rateLimit from "express-rate-limit";
import cors from "cors";

dotenv.config()

const app = express();

// CORS configuration
const corsOptions = {
  origin: [
    'https://globalchat.billiondollardevs.com',
    'http://localhost:5173'
  ],
  credentials: true,
  optionsSuccessStatus: 200
};

// Apply CORS middleware
app.use(cors(corsOptions));

// Rate limiting configuration
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // limit each IP to 100 requests per windowMs
  message: {
    error: 'Too many requests from this IP, please try again later.',
    retryAfter: '15 minutes'
  },
  standardHeaders: true, // Return rate limit info in the `RateLimit-*` headers
  legacyHeaders: false, // Disable the `X-RateLimit-*` headers
});

// Apply rate limiting to all requests
app.use(limiter);

// Basic health check endpoint
app.get('/health', (req, res) => {
  res.json({ 
    status: 'OK', 
    timestamp: new Date().toISOString(),
    onlineUsers: clients.size 
  });
});

// Root endpoint
app.get('/', (req, res) => {
  res.json({ 
    message: 'Global Chat WebSocket Server',
    status: 'running',
    onlineUsers: clients.size
  });
});

const PORT = process.env.PORT

const httpServer = app.listen(PORT, () => {
  console.log("App is listening on port", PORT);
});

const wss = new WebSocketServer({ server: httpServer });

const clients = new Map<WebSocket, { id: string; username: string }>();

const broadcast = (msg: any) => {
  const data = JSON.stringify(msg);

  wss.clients.forEach(function each(client) {
    if (client.readyState === WebSocket.OPEN) {
      client.send(data);
    }
  });
};

const broadcastOnlineCount = () => {
    const onlineCount = clients.size;
  
    broadcast({
      type: "online_count",
      count: onlineCount,
    });
  };
  

wss.on("connection", function connection(socket) {
  socket.on("error", (err) => console.error(err));

  socket.on("message", function message(rawData, isBinary) {
    let data;

    try {
      data = JSON.parse(rawData.toString());
    } catch (error) {
      console.error("Invalid JSON:", rawData.toString());
      return;
    }

    if (data.type === "register") {
      const userId = uuidv4();
      clients.set(socket, { id: userId, username: data.username });

      // Confirm registration to user
      socket.send(
        JSON.stringify({
          type: "register_success",
          userId,
          username: data.username,
        })
      );

      broadcast({
        type: "system",
        message: `${data.username} has joined the server`,
      });

      broadcastOnlineCount()
    }

    if (data.type === "chat") {
      const user = clients.get(socket);

      if (!user) return;

      broadcast({
        type: "chat",
        message: data.message,
        username: user.username,
        userId: user.id,
      });
    }
  });

  socket.on("close", function close() {
    const user = clients.get(socket);

    if (user) {
      broadcast({
        type: "system",
        message: `${user?.username} has left the server`,
      });

      clients.delete(socket);
      broadcastOnlineCount(); // Broadcast updated count when user disconnects
    }
  });

  socket.send(JSON.stringify({ type: "system", message: "Hello from socket server" }));

});
