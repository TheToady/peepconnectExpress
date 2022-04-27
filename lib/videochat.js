const { Server } = require("socket.io");
const debug = require("./debug");
const colors = require('colors');

//Server Vars
var videochat = {};

var io;

var userSessions = [];
var searchingUsers = [];

//Server classes
class userSession {
    constructor(id, connectedTo){
        this.id = id
        this.connectedTo = connectedTo
    }
}

videochat.init = (http) => {
    io = new Server(http, {
        
    })

    //Whenever someone connects this gets executed
    io.on('connection', function(socket) {
        console.log(`${'CONNECTED'.green}: ${socket.id.cyan}`);

        userSessions.push(new userSession(socket.id, null))

        thisUser = userSessions[userFinder(userSessions, socket.id)]

        socket.on('send-debug', (arg) => {
            debug.handler(io, socket, arg, userSessions, searchingUsers);
        });

        // Button commands
        buttonHandler(socket, thisUser, io);

        // Disconnects
        disconnectHandler(socket, thisUser);

        // Everything else
        elseHandler(socket, thisUser, io)
    });
}

var disconnectHandler = (socket, thisUser) => {
    //Whenever someone disconnects this piece of code executed
    socket.on('disconnect', function () {
        if(thisUser.connectedTo != null){
            console.log('USER: '.cyan + `${socket.id.cyan} ended the call with ${thisUser.connectedTo.cyan}`)
            try {io.to(thisUser.connectedTo).emit('receive-endCall')} catch (error) {console.log('The user isnt online anymore')}
            try {userSessions[userFinder(userSessions, thisUser.connectedTo)].connectedTo = null} catch (error) {console.log('The user isnt online anymore')}
        }else{
            console.log(`${'DISCONNECTED'.red}: ${socket.id.cyan}`);
        }
    
        userSessions.splice(userFinder(userSessions, socket.id), 1);
        if(searchingUsers[userFinder(searchingUsers, socket.id)] != undefined){
            searchingUsers.splice(userFinder(searchingUsers, socket.id), 1);
        }
        debug.logUsers(userSessions, searchingUsers);
    });
}

var buttonHandler = (socket, thisUser, io) => {
    socket.on('button-next', () => {
        stopCall(socket, thisUser, io);

        console.log(`USER: ${socket.id.cyan} searching for a new match`)
        searchingUsers.push(userSessions[userFinder(userSessions, socket.id)])
        io.to(socket.id).emit('receive-search')
    })

    socket.on('button-search', () => {
        console.log(`USER: ${socket.id.cyan} is now searching`)
        searchingUsers.push(userSessions[userFinder(userSessions, socket.id)])
        io.to(socket.id).emit('receive-search');
    });

    socket.on('button-stop', () => {
        if(thisUser.connectedTo == null){
            console.log(`USER: ${socket.id.cyan} is not searching anymore`);
        }else{
            console.log(`USER: ${socket.id.cyan} ended call with ${thisUser.connectedTo.cyan}`);
        }
        stopCall(socket, thisUser, io);
    });
}

var elseHandler = (socket, thisUser, io) => {
    socket.on('send-offer', (offer) => {
        io.to(thisUser.connectedTo).emit('receive-offer', offer);
    });
    socket.on('send-answer', (answer) => {
        io.to(thisUser.connectedTo).emit('receive-answer', answer);
    })
    socket.on('send-ice', (ice) => {
        io.to(thisUser.connectedTo).emit('receive-ice', ice);
    })
}

function stopCall(socket, thisUser, io) {
        if(searchingUsers[userFinder(searchingUsers, socket.id)] != undefined){
            searchingUsers.splice(userFinder(searchingUsers, socket.id), 1)
        }

        if(thisUser.connectedTo != null){
            io.to(thisUser.connectedTo).emit('receive-endCall', socket.id)
            userSessions[userFinder(userSessions, thisUser.connectedTo)].connectedTo = null
        }
        thisUser.connectedTo = null

        io.to(socket.id).emit('receive-stop')
}

userFinder = (_array, _socketId) => {
    for (let i = 0; i < _array.length; i++) {
        if(_array[i].id == _socketId){
            return i
        }
    }
}

var matchTimer = setInterval(function() {
    if(userSessions.length >= 2) {
        if(searchingUsers.length >= 2) {
            matchUser()
        }
    }else{
        //console.log('not enought users')
    }
}, 5000)

function matchUser() {
    for(i = 0; i < searchingUsers.length; i++){
        if(i%2!=0){
            lastUserI = i - 1
            lastUser = searchingUsers[lastUserI]
            user = searchingUsers[i]

            if(lastUser.id == user.id){
                return;
            }

            user.connectedTo = lastUser.id
            lastUser.connectedTo = user.id
            
            io.to(user.id).emit('receive-matched', user.connectedTo, true)
            io.to(lastUser.id).emit('receive-matched', lastUser.connectedTo, false)

            console.log(`${'MATCHED'.yellow}: ${lastUser.id.cyan} and ${user.id.cyan} matched`)

            searchingUsers.splice(i, 1);
            searchingUsers.splice(i - 1, 1);
        }
    }
}

module.exports = videochat;