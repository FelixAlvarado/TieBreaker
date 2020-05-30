const express = require('express');
const app = express();
const path = require('path');
const server = require('http').createServer(app);
const io = require('socket.io')(server);
const port = process.env.PORT || 3000

server.listen(port, () => {
    console.log(`Server listening at port: ${port}`)
})
// routing
app.use(express.static(path.join(__dirname, 'public')));

//Dashboard
let numUsers = 0;
let players = [];

io.sockets.on('connect', function(socket) {
  const sessionID = socket.id;
  console.log('here is the socket id', sessionID);
});

io.on('connection', (socket) => {
  console.log('here is the socKet', socket.id);
    var addedUser = false;

  // when the client emits 'new message', this listens and executes
  socket.on('new message', (data) => {
    // we tell the client to execute 'new message'
    socket.broadcast.emit('new message', {
      username: socket.username,
      message: data
    });
  });

  // when the client emits 'add user', this listens and executes
  socket.on('add user', (data) => {
    if (addedUser) return;
    
    // we store the username in the socket session for this client
    if (players.indexOf(socket.username == -1)){
        socket.username = data.username;
    }else{
        socket.username = data.username+'_'
    }
    ++numUsers;
    players.push(socket.username);
    
    addedUser = true;
    socket.emit('login', {
      numUsers: numUsers
    });
    // echo globally (all clients) that a person has connected
    socket.broadcast.emit('user joined', {
      username: socket.username,
      numUsers: numUsers,
      id:data.id
    });
  });

  // when the client emits 'typing', we broadcast it to others
  socket.on('typing', () => {
    socket.broadcast.emit('typing', {
      username: socket.username
    });
  });

  // when the client emits 'stop typing', we broadcast it to others
  socket.on('stop typing', () => {
    socket.broadcast.emit('stop typing', {
      username: socket.username
    });
  });

//updating new player with host information
socket.on('update new player', (data) => {
  console.log(data.players)
  io.to(data.id).emit('game data', data.players);
});

// updating  all players with host information
socket.on('update players', (data) => {
  console.log("made it to update players")
  console.log(data)
  socket.broadcast.emit('game data', data);
});

  // when the user disconnects.. perform this
  socket.on('disconnect', () => {
    if (addedUser) {
      --numUsers;
      let idx = players.indexOf(socket.username);
      players.splice(idx,1);
      // echo globally that this client has left
      socket.broadcast.emit('user left', {
        username: socket.username,
        numUsers: numUsers
      });
    }
  });
})