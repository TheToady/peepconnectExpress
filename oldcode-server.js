//Standard Vars
var io = require('socket.io')(3000, {
    cors: {
        origin: '*',
        methods: ['GET', 'POST']
    },
});

//Server Vars
const userSessions = []
const searchingUsers = []

//Server classes
class userSession {
    constructor(id, peerId, connectedTo){
        this.id = id
        this.peerId = peerId
        this.connectedTo = connectedTo
    }
}

//connections
io.on('connection', socket => {
    console.log(`User ${socket.id} joined`)

    userSessions.push(new userSession(socket.id, null, null))

    thisUser = userSessions[userFinder(userSessions, socket.id)]

    socket.on('send-test', () => {
        console.log(userSessions, searchingUsers)
        socket.emit('receive-test', userSessions, searchingUsers)
    })

    socket.on('send-peer', (id) => {
        userSessions[userFinder(userSessions, socket.id)].peerId = id
    })

    socket.on('send-search', () => {
        console.log(`User ${socket.id} searching`)
        searchingUsers.push(userSessions[userFinder(userSessions, socket.id)])
        io.to(socket.id).emit('receive-search')
    })

    socket.on('send-stop', () => {
        console.log(`User ${socket.id} not searching anymore`)
        if(searchingUsers[userFinder(searchingUsers, socket.id)] != undefined){
            searchingUsers.splice(userFinder(searchingUsers, socket.id), 1)
        }

        if(thisUser.connectedTo != null){
            io.to(thisUser.connectedTo).emit('receive-endCall', thisUser.peerId)
            userSessions[userFinder(userSessions, thisUser.connectedTo)].connectedTo = null
        }
        thisUser.connectedTo = null

        io.to(socket.id).emit('receive-stop')
    })

    socket.on('send-next', () => {
        console.log(`User ${socket.id} not searching anymore`)
        if(searchingUsers[userFinder(searchingUsers, socket.id)] != undefined){
            searchingUsers.splice(userFinder(searchingUsers, socket.id), 1)
        }

        if(thisUser.connectedTo != null){
            io.to(thisUser.connectedTo).emit('receive-endCall', thisUser.peerId)
            userSessions[userFinder(userSessions, thisUser.connectedTo)].connectedTo = null
        }
        thisUser.connectedTo = null

        io.to(socket.id).emit('receive-stop')

        console.log(`User ${socket.id} searching`)
        searchingUsers.push(userSessions[userFinder(userSessions, socket.id)])
        io.to(socket.id).emit('receive-search')
    })

    if(thisUser.connectedTo != null){
        console.log('sendingVideo')
    }

    //disconnect
    socket.on('disconnect', () => {
        console.log(`User ${socket.id} disconnected`)

        if(thisUser.connectedTo != null){
            try {io.to(thisUser.connectedTo).emit('receive-endCall')} catch (error) {console.log('The user isnt online anymore')}
            try {userSessions[userFinder(userSessions, thisUser.connectedTo)].connectedTo = null} catch (error) {console.log('The user isnt online anymore')}
        }

        userSessions.splice(userFinder(userSessions, socket.id), 1);
        if(searchingUsers[userFinder(searchingUsers, socket.id)] != undefined){
            searchingUsers.splice(userFinder(searchingUsers, socket.id), 1);
        }
        console.log(userSessions)
    })
})

function userFinder(_array, _socketId) {
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
        }else{
            console.log('not enougth users searching')
        }
    }else{
        //console.log('not enought users')
    }
}, 5000)

function matchUser() {
    console.log('enougth users searching')
    for(i = 0; i < searchingUsers.length; i++){
        if(i%2!=0){
            console.log('matching')
            lastUserId = i - 1
            searchingUsers[i].connectedTo = searchingUsers[lastUserId].id
            searchingUsers[lastUserId].connectedTo = searchingUsers[i].id
            
            io.to(searchingUsers[i].id).emit('receive-matched', searchingUsers[lastUserId].id, searchingUsers[lastUserId].peerId)
            io.to(searchingUsers[lastUserId].id).emit('receive-matched', searchingUsers[i].id, searchingUsers[i].peerId)

            searchingUsers.splice(i, 1);
            searchingUsers.splice(i - 1, 1);
        }
    }
}

