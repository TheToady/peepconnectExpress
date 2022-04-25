var myVideo;
var otherVideo;
var searchButton;
var stopButton;
var nextButton;
var testText;
var testButton;

var localStream = new MediaStream();
var remoteStream

var socket;

window.onload = () => {
    socket = io();
    stopButton = document.getElementById('stop-button');
    searchButton = document.getElementById('search-button');
    nextButton = document.getElementById('next-button');
    testText = document.getElementById('info-text');

    //setting up
    searchButton.style.visibility = 'visible'
    stopButton.style.visibility = 'hidden'

    socket.on('connect', () => {
        console.log(`You connected with the id: ${socket.id}`);
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
        DisplayMessage(`You connected with the id: ${socket.id}`)
        socket.emit('send-purpose', 'videochat')
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
        SetVideo()
    })

    socket.on('receive-stop', () => {
        DisplayMessage('Stopped')
        searchButton.style.visibility = 'visible'
        stopButton.style.visibility = 'hidden'
        RemoveVideoStream(myVideo, localStream)
        otherVideo.pause()
        otherVideo.srcObject = null
    })

    socket.on('receive-matched', (_matchedUserId, _matchedUserPeer)=> {
        console.log(`Matched with ${_matchedUserId}`)
        DisplayMessage(`Matched with ${_matchedUserId}`)

        //StartCall(_matchedUserPeer, localStream)
    })

    socket.on('receive-endCall', (_matchedUserPeer) => {
        DisplayMessage('Call ended')
        searchButton.style.visibility = 'visible'
        stopButton.style.visibility = 'hidden'

        //if (peers[_matchedUserPeer]) peers[_matchedUserPeer].close()

        RemoveVideoStream(myVideo, localStream)
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
            myVideo = document.getElementById('video-localVid');
            localstream = stream;
            AddVideoStream(myVideo, localstream);
        });
    }catch{
        console.log('could not find video device');
    }
}

function AddVideoStream(video, stream){
    if(video != null){
        video.srcObject = stream;
        video.addEventListener('loadedmetadata', () => {
            video.play();
        })
    }else{
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

//

// Send Debug
function debug(arg) {
    socket.emit('send-debug', (arg));
    return 'debug was send';
}