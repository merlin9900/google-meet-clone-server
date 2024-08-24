"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const http_1 = __importDefault(require("http"));
const socket_io_1 = require("socket.io");
const socketServer = http_1.default.createServer();
const io = new socket_io_1.Server(socketServer, {
    cors: {
        origin: "*",
        methods: ["GET", "POST"],
    },
});
const rooms = {};
io.on("connection", (socket) => {
    console.log("connected", socket.id);
    socket.on("create-room", ({ roomId }) => {
        console.log("create-room", { roomId });
        rooms[roomId] = [];
    });
    // socket.on(
    //    "join-room",
    //    ({ roomId }: { roomId: string }) => {
    //      if(!rooms[roomId]) {
    //       console.log("no room");
    //       io.to(socket.id).emit("no-room")
    //       return;
    //      }
    //      console.log("hello", rooms[roomId]);
    //       if (rooms[roomId].length < 2 && !rooms[roomId].find((user) => user.socketId === socket.id)) {
    //          rooms[roomId].push({ socketId: socket.id });
    //          console.log("pushed", rooms[roomId]);
    //       }
    //       if (rooms[roomId].length === 2) {
    //          const otherUser = rooms[roomId].find(
    //             (user) => user.socketId !== socket.id
    //          );
    //          if (otherUser) {
    //             io.to(otherUser.socketId).emit("ready-to-call", { socketId: socket.id });
    //          }
    //       }
    //    }
    // );
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
            const otherUser = rooms[roomId].find((user) => user.socketId !== socket.id);
            if (otherUser) {
                console.log("ready-to-call", { userId });
                io.to(otherUser.socketId).emit("ready-to-call", { userId });
            }
        }
    });
    socket.on("offer", ({ roomId, from, signal, }) => {
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
    });
    socket.on("answer", ({ roomId, from, signal, }) => {
        console.log("answer");
        const room = rooms[roomId];
        if (room) {
            room.forEach(({ socketId }) => {
                if (socketId !== from) {
                    io.to(socketId).emit("answer", { signal });
                }
            });
        }
    });
    socket.on("call-accepted", ({ roomId, from }) => {
        const room = rooms[roomId];
        if (room) {
            room.forEach(({ socketId }) => {
                if (socketId !== from) {
                    io.to(socketId).emit("call-accepted", { socketId });
                }
            });
        }
    });
    socket.on("end-call", ({ roomId, from }) => {
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
    });
    socket.on("toggle-audio", ({ roomId, from, isOn, }) => {
        const room = rooms[roomId];
        if (room) {
            room.forEach(({ socketId }) => {
                if (socketId !== from) {
                    io.to(socketId).emit("audio-toggled", { isOn });
                }
            });
        }
    });
    socket.on("toggle-video", ({ roomId, from, isOn, }) => {
        const room = rooms[roomId];
        if (room) {
            room.forEach(({ socketId }) => {
                if (socketId !== from) {
                    io.to(socketId).emit("video-toggled", { isOn });
                }
            });
        }
    });
    socket.on("disconnect", () => {
        for (const roomId in rooms) {
            rooms[roomId] = rooms[roomId].filter((user) => user.socketId !== socket.id);
            if (rooms[roomId].length === 0) {
                delete rooms[roomId];
            }
        }
    });
});
socketServer.listen(1110, "0.0.0.0", () => {
    console.log("Server started on port 1110");
});
