import http from "http";
import { Server as SocketIOServer, Socket } from "socket.io";

interface Room {
  socketId: string;
  userId: string;
}

interface Rooms {
  [roomId: string]: Room[];
}

const socketServer = http.createServer();

const io = new SocketIOServer(socketServer, {
  cors: {
    origin: "*",
    methods: ["GET", "POST"],
  },
});

const rooms: Rooms = {};

io.on("connection", (socket: Socket) => {
  console.log("connected", socket.id);

  socket.on("create-room", ({ roomId }) => {
    console.log("create-room", { roomId });
    rooms[roomId] = [];
  });

  socket.on("join-room", ({ roomId, userId }) => {
    console.log("join-room", { roomId, userId });

    if (!rooms[roomId]) {
      rooms[roomId] = [];
    }

    // Check if the user with the same userId is already in the room
    const userExists = rooms[roomId].some((user) => user.userId === userId);

    if (!userExists && rooms[roomId].length < 2) {
      rooms[roomId].push({ socketId: socket.id, userId: userId });
    }

    console.log(rooms[roomId].length);
    console.log(rooms);

    if (rooms[roomId].length === 2) {
      const otherUser = rooms[roomId].find(
        (user) => user.socketId !== socket.id
      );
      if (otherUser) {
        console.log("ready-to-call", { userId });

        io.to(otherUser.socketId).emit("ready-to-call", { userId });
      }
    }
  });

  socket.on(
    "offer",
    ({
      roomId,
      from,
      signal,
    }: {
      roomId: string;
      from: string;
      signal: any;
    }) => {
      console.log("offer", { roomId, from });

      const room = rooms[roomId];
      console.log(room);

      if (room) {
        room.forEach(({ socketId }) => {
          if (socketId !== from) {
            console.log("offer", { signal });

            io.to(socketId).emit("offer", { signal });
          }
        });
      }
    }
  );

  socket.on(
    "answer",
    ({
      roomId,
      from,
      signal,
    }: {
      roomId: string;
      from: string;
      signal: any;
    }) => {
      console.log("answer");
      const room = rooms[roomId];
      if (room) {
        room.forEach(({ socketId }) => {
          if (socketId !== from) {
            io.to(socketId).emit("answer", { signal });
          }
        });
      }
    }
  );

  socket.on(
    "call-accepted",
    ({ roomId, from }: { roomId: string; from: string }) => {
      const room = rooms[roomId];
      if (room) {
        room.forEach(({ socketId }) => {
          if (socketId !== from) {
            io.to(socketId).emit("call-accepted", { socketId });
          }
        });
      }
    }
  );

  socket.on(
    "end-call",
    ({ roomId, from }: { roomId: string; from: string }) => {
      console.log("call ended");

      const room = rooms[roomId];
      if (room) {
        room.forEach(({ socketId }) => {
          if (socketId !== from) {
            io.to(socketId).emit("call-ended");
          }
        });
        rooms[roomId] = rooms[roomId].filter((user) => user.socketId !== from);
      }
    }
  );

  socket.on(
    "toggle-audio",
    ({
      roomId,
      from,
      isOn,
    }: {
      roomId: string;
      from: string;
      isOn: boolean;
    }) => {
      const room = rooms[roomId];
      if (room) {
        room.forEach(({ socketId }) => {
          if (socketId !== from) {
            io.to(socketId).emit("audio-toggled", { isOn });
          }
        });
      }
    }
  );

  socket.on(
    "toggle-video",
    ({
      roomId,
      from,
      isOn,
    }: {
      roomId: string;
      from: string;
      isOn: boolean;
    }) => {
      const room = rooms[roomId];
      if (room) {
        room.forEach(({ socketId }) => {
          if (socketId !== from) {
            io.to(socketId).emit("video-toggled", { isOn });
          }
        });
      }
    }
  );

  socket.on("disconnect", () => {
    for (const roomId in rooms) {
      rooms[roomId] = rooms[roomId].filter(
        (user) => user.socketId !== socket.id
      );
      if (rooms[roomId].length === 0) {
        delete rooms[roomId];
      }
    }
  });
});

socketServer.listen(1100, "0.0.0.0", () => {
  console.log("Server started on port 1100");
});
