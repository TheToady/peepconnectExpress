const { Server } = require("socket.io");

//Server Vars


//Server classes
class userSession {
    constructor(id, peerId, connectedTo){
        this.id = id
        this.peerId = peerId
        this.connectedTo = connectedTo
    }
}

var videochat = {};

videochat.userSessions = []
videochat.searchingUsers = []

videochat.init = (http) => {
    const io = require('socket.io')(http);

    //Whenever someone connects this gets executed
    io.on('connection', function(socket) {
        console.log('A user connected');

        videochat.userSessions.push(new userSession(socket.id, null, null))

        thisUser = videochat.userSessions[videochat.userFinder(videochat.userSessions, socket.id)]

        buttonHandler(socket, thisUser);
        disconnectHandler(socket, thisUser);
    });
}

//Commands send by buttons
buttonHandler = (socket, thisUser) => {
    socket.on('send-test', () => {
        console.log(videochat.userSessions, videochat.searchingUsers)
        socket.emit('receive-test', videochat.userSessions, videochat.searchingUsers)
    })

    socket.on('send-next', () => {
        console.log(`User ${socket.id} not searching anymore`)
        if(videochat.searchingUsers[videochat.userFinder(videochat.searchingUsers, socket.id)] != undefined){
            videochat.searchingUsers.splice(videochat.userFinder(videochat.searchingUsers, socket.id), 1)
        }

        if(thisUser.connectedTo != null){
            io.to(thisUser.connectedTo).emit('receive-endCall', thisUser.peerId)
            videochat.userSessions[videochat.userFinder(videochat.userSessions, thisUser.connectedTo)].connectedTo = null
        }
        thisUser.connectedTo = null

        io.to(socket.id).emit('receive-stop')

        console.log(`User ${socket.id} searching`)
        videochat.searchingUsers.push(videochat.userSessions[videochat.userFinder(videochat.userSessions, socket.id)])
        io.to(socket.id).emit('receive-search')
    })
}

function disconnectHandler(socket, thisUser){
    //Whenever someone disconnects this piece of code executed
    socket.on('disconnect', function () {
        endCall(socket, thisUser);
    });
}

function endCall(socket, thisUser) {
    if(thisUser.connectedTo != null){
        console.log(`User ${socket.id} ended the call with ${thisUser.connectedTo}`)
        try {io.to(thisUser.connectedTo).emit('receive-endCall')} catch (error) {console.log('The user isnt online anymore')}
        try {videochat.userSessions[videochat.userFinder(videochat.userSessions, thisUser.connectedTo)].connectedTo = null} catch (error) {console.log('The user isnt online anymore')}
    }else{
        console.log(`User ${socket.id} disconnected`);
    }

    videochat.userSessions.splice(videochat.userFinder(videochat.userSessions, socket.id), 1);
    if(videochat.searchingUsers[videochat.userFinder(videochat.searchingUsers, socket.id)] != undefined){
        videochat.searchingUsers.splice(videochat.userFinder(videochat.searchingUsers, socket.id), 1);
    }
    console.log(videochat.userSessions);
}

videochat.userFinder = (_array, _socketId) => {
    for (let i = 0; i < _array.length; i++) {
        if(_array[i].id == _socketId){
            return i
        }
    }
}

module.exports = videochat;