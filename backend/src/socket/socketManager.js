let io = null;

const initSocket = (server) => {
  const socketIO = require("socket.io");

  io = socketIO(server, {
    cors: {
      origin: "*",
    },
  });

  console.log("✔ Socket.io initialized");
};

const getIO = () => {
  return io; // safe (no error throw)
};

module.exports = { initSocket, getIO };