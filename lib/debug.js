var lib = {}

lib.handler = (io, socket, arg, userSessions, searchingUsers) => {
    console.log('\nDEBUG RECEIVED: \n',arg);
    var ans;
    var method = 'log';

    switch(arg) {
        case 'users':
            method = 'tables';
            ans = lib.logUsers(userSessions, searchingUsers);
            break;
        case 'active':
            method = 'table';
            ans = lib.logActiveUsers(userSessions);
            break;
        default:
            ans = 'Command not found. No debug was performed.'
            break;
    }

    if(ans.length <= 0 || undefined){
        ans = 'Debug was printed on the server console';
    }
    console.log('\nDEBUG SENT:\nMethod: ', method, '\nAnswer: ', ans);
    io.to(socket.id).emit('receive-debug', method, ans);
}

lib.logUsers = (userSessions, searchingUsers) => {
    var ans = [];
    var active = [];
    if(userSessions.length > 0){
        userSessions.forEach(element => {
            e = new User(element);
            active.push(e);
        });
        ans.push(active);
    }else{
        ans.push('No User is active');
    }

    var searching = [];
    if(searchingUsers.length > 0){
        searchingUsers.forEach(element => {
            e = new User(element);
            searching.push(e);
        });
        ans.push(searching);
    }else{
        ans.push('No User is searching');
    }
    return ans;
}

lib.logActiveUsers = (userSessions) => {
    var ans = [];
    if(userSessions.length > 0){
        userSessions.forEach(element => {
            e = new User(element);
            ans.push(e);
        });
    }else{
        ans.push('No User is active');
    }
    return ans;
}

function User(element){
    this.id = element.id;
    this.peerId = element.peerId;
    this.connectedTo = element.connectedTo;
}

module.exports = lib;