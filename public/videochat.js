var myVideo;
var otherVideo;
var searchButton;
var stopButton;
var nextButton;
var testText;
var testButton;

var localStream = new MediaStream();
var remoteStream;

var socket;
var peer;
var peerId;

var currentCall = null;

window.onload = async () => {
    await sleep(1000)
    loadingScreen(0)

    socket = io();
    peer = new Peer(undefined, { debug: 3 });
    stopButton = document.getElementById('stop-button');
    searchButton = document.getElementById('search-button');
    nextButton = document.getElementById('next-button');
    testText = document.getElementById('info-text');
    myVideo = document.getElementById('video-localVid');
    otherVideo = document.getElementById('video-remoteVid');

    //setting up
    searchButton.style.visibility = 'visible';
    stopButton.style.visibility = 'hidden';
    
    searchButton.disabled = true;
    stopButton.disabled = true;
    nextButton.disabled = true;

    SetVideo();

    peer.on('open', id =>{
        peerId = id;
    })

    peer.on('error', (err) => {
        console.log(err);
    })

    peer.on('connection', function(conn) {
        conn.on('data', function(data){
          // Will print 'hi!'
          console.log(data);
        });
      });

    peer.on('call', (call) => {
        console.log('Call received');
        call.answer(localStream);
        currentCall = call
        call.on('stream', function(remoteStream) {
            console.log('nice');
            AddVideoStream(otherVideo, stream)
          });
        call.on('error', (err) => {
            console.log(err);
        })
    })
    
    //Buttons
    searchButton.addEventListener('click', e => {
        console.log('search-button');
        e.preventDefault();
    
        socket.emit('button-search');
    })
    
    stopButton.addEventListener('click', e => {
        console.log('stop-button');
        e.preventDefault();
    
        socket.emit('button-stop');
    })
    
    nextButton.addEventListener('click', e => {
        console.log('next-button');
        e.preventDefault();
    
        socket.emit('button-next');
    })

    //incomming connection
    socket.on('connect', () => {
        console.log(`You connected with the id: ${socket.id}`)
        searchButton.style.visibility = 'visible'
        stopButton.style.visibility = 'hidden'
        DisplayMessage(`You connected with the id: ${socket.id}`)
    })

    socket.on('receive-message', message => {
        DisplayMessage(message)
    })

    socket.on('receive-test', (users, searchingUsers) => {

        DisplayMessage(`${users.length} user/s online. ${searchingUsers.length} user/s searching`)

        console.log(users)
    })

    socket.on('receive-search', () => {
        DisplayMessage('Searching')
        searchButton.style.visibility = 'hidden'
        stopButton.style.visibility = 'visible'
        socket.emit('send-peer', peerId)
    })

    socket.on('receive-stop', () => {
        DisplayMessage('Stopped')
        searchButton.style.visibility = 'visible'
        stopButton.style.visibility = 'hidden'
        if(otherVideo != undefined){
            otherVideo.pause()
            otherVideo.srcObject = null
        }
    })

    socket.on('receive-matched', (_matchedUserId, _matchedUserPeer, _caller)=> {
        console.log(`Matched with ${_matchedUserId}. PeerId: ${_matchedUserPeer}`)
        DisplayMessage(`Matched with ${_matchedUserId}. PeerId: ${_matchedUserPeer}`)

        if(_matchedUserPeer != null){
            if(_caller){
                Testing(_matchedUserPeer);
            }
        }else{
            console.log('PeerId was empty')
        }
    })

    socket.on('receive-endCall', (_matchedUserPeer) => {
        DisplayMessage('Call ended')
        searchButton.style.visibility = 'visible'
        stopButton.style.visibility = 'hidden'

        if(currentCall != null) currentCall.close();
        currentCall = null;

        otherVideo.pause()
        otherVideo.srcObject = null
    })

    // Receive debug
    socket.on('receive-debug', (method, ans) =>{
        switch(method){
            case 'log':
                console.log(ans);
                break;
            case 'table':
                console.table(ans);
                break;
            case 'tables':
                ans.forEach(element => {
                    console.table(element);
                });
                break;
            default:
                console.log(ans);
                break;
        }
    });
}

//functions
function DisplayMessage(message) {
    testText.textContent = message;
}

async function SetVideo() {
    console.log('get Video')
    try{
        await navigator.mediaDevices.getUserMedia({
            video: true, 
            audio: true 
        }).then(stream => {
            localstream = stream;
            AddVideoStream(myVideo, localstream);
        });
    }catch{
        console.log('could not find video device');
    }
}

function AddVideoStream(video, stream){
    if(video != null){
        searchButton.disabled = false;
        stopButton.disabled = false;
        nextButton.disabled = false;
        video.srcObject = stream;
        video.addEventListener('loadedmetadata', () => {
            video.play();
        })
    }else{
        searchButton.disabled = true;
        stopButton.disabled = true;
        nextButton.disabled = true;
        console.log('no video obj found');
    }
}

function RemoveVideoStream(video, stream){
    video.pause();
    video.srcObject = null;
    if (stream!= null || undefined) {
        stream.getTracks().map(function (val) {
            val.stop();
        });
    } 
}

function callUser(peerId){
    console.log('You are caller. now calling');
    const call = peer.call(peerId, localStream)
    call.on('stream', (otherStream) => {
        console.log('Received stream')
        remoteStream = otherStream
        AddVideoStream(otherVideo, remoteStream)
    })
    call.on('data', (otherStream) => {
        console.log('Received data')
        remoteStream = otherStream
        AddVideoStream(otherVideo, remoteStream)
    })
    call.on('error', (err) => {
        console.log(err);
    })
    call.on('close', () => {
        console.log('DISCONNECTED');
        RemoveVideoStream(otherVideo, remoteStream);
    })

    currentCall = call;
}

function Testing(peerId){
    console.log(peerId);
    var call = peer.call(peerId, localStream);
    call.on('stream', function(stream) {
        console.log('nice');
        AddVideoStream(otherVideo, stream)
    });
}

// Send Debug
function debug(arg) {
    socket.emit('send-debug', (arg));
    return 'debug was send';
}

//Loader
var loadingScreen = async (time) => {
    await sleep(time);

    $(".loader-wrapper").fadeOut("slow");
}

//Sleep
function sleep(milliseconds) {
    return new Promise(resolve => setTimeout(resolve, milliseconds));
}