import express from "express";
import WebSocket, { WebSocketServer } from "ws";
import { v4 as uuidv4 } from "uuid";

const app = express();

const httpServer = app.listen(8080, () => {
  console.log("App is listening on post 8080");
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
