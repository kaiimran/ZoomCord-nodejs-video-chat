const path = require('path');
const http = require('http');
const express = require('express');
const socketio = require('socket.io');
const formatMessage = require('./utils/messages');
const { userJoin, getCurrentUser, userLeave, getRoomUsers } = require('./utils/users');

const app = express();
const server = http.createServer(app);
const io = socketio(server);

app.use(express.static(path.join(__dirname, 'public')));

const botName = 'ChatCord Bot';

// Run when client connets
io.on('connection', socket => {
    socket.on('joinRoom', ({ username, room }) => {
        const user = userJoin(socket.id, username, room);

        if (!user) {
            socket.emit('sameName');
        } else {

            socket.join(user.room);
        
            // only show in client to the user connecting
            socket.emit('message', formatMessage(botName, 'Welcome to ChatCord!'));

            // Broadcast to all except the user itself in a specif room
            socket.broadcast
                .to(user.room)
                .emit(
                    'message',
                    formatMessage(botName, `${user.username} has joined the chat`)
                );

            // Send users and room info
            io.to(user.room).emit('roomUsers', {
                room: user.room,
                users: getRoomUsers(user.room)
            });

            // Runs when client disconnects
            socket.on('disconnect', () => {
                const user = userLeave(socket.id);

                if (user) {
                    io
                    .to(user.room)
                    .emit('message', formatMessage(botName, `${user.username} has left the chat`));
                }

                // Send users and room info
                io.to(user.room).emit('roomUsers', {
                    room: user.room,
                    users: getRoomUsers(user.room)
                });
            });
        }
    });

    // Listen for chatMessage
    socket.on('chatMessage', msg => {
        const user = getCurrentUser(socket.id);

        // Broadcast to all clients in the room
        io
            .to(user.room)
            .emit('message', formatMessage(user.username, msg));
    });
});

const PORT = process.env.PORT || 3000;

server.listen(PORT, () => console.log(`Server running on port ${PORT}`));