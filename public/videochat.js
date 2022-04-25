const { RTCPeerConnection, RTCSessionDescription } = window;
const peerConnection = new RTCPeerConnection();

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

let isAlreadyCalling = false;

window.onload = async () => {
    await sleep(1000)
    loadingScreen(0)

    socket = io("https://eric.huelsebus.com/", {
        
    });
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

    socket.on('receive-matched', (_matchedUserId, _caller)=> {
        console.log(`Matched with ${_matchedUserId}`)
        DisplayMessage(`Matched with ${_matchedUserId}`)

        if(_caller){
            callUser(_matchedUserId);
        }
    })

    socket.on('receive-endCall', (_matchedUserId) => {
        DisplayMessage('Call ended')
        searchButton.style.visibility = 'visible'
        stopButton.style.visibility = 'hidden'

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

    socket.on("call-made", async data => {
        await peerConnection.setRemoteDescription(
            new RTCSessionDescription(data.offer)
        );
        const answer = await peerConnection.createAnswer();
        await peerConnection.setLocalDescription(new RTCSessionDescription(answer));
        
        socket.emit("make-answer", {
            answer,
            to: data.socket
        });
    });


    socket.on("answer-made", async data => {
        await peerConnection.setRemoteDescription(
            new RTCSessionDescription(data.answer)
        );
        
        if (!isAlreadyCalling) {
            callUser(data.socket);
            isAlreadyCalling = true;
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
            stream.getTracks().forEach(track => peerConnection.addTrack(track, stream));
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

async function callUser(socketId){
    const offer = await peerConnection.createOffer();
    await peerConnection.setLocalDescription(new RTCSessionDescription(offer));

    socket.emit("call-user", {
        offer,
        to: socketId
    });
}

peerConnection.ontrack = function({ streams: [stream] }) {
    const remoteVideo = document.getElementById("video-remoteVid");
    if (remoteVideo) {
        remoteVideo.srcObject = stream;
    }
};

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