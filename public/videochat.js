const { RTCPeerConnection, RTCSessionDescription } = window;
const rtcConf = { iceServers: [
    {
      urls: "stun:openrelay.metered.ca:80",
    },
    {
      urls: "turn:openrelay.metered.ca:80",
      username: "openrelayproject",
      credential: "openrelayproject",
    },
    {
      urls: "turn:openrelay.metered.ca:443",
      username: "openrelayproject",
      credential: "openrelayproject",
    },
    {
      urls: "turn:openrelay.metered.ca:443?transport=tcp",
      username: "openrelayproject",
      credential: "openrelayproject",
    },
  ],
}
var peer = new RTCPeerConnection(rtcConf);

peer.addEventListener('connectionstatechange', event => {
    if(peer.connectionState === 'connected') {
        console.log('peers connected');
    }
})

var myVideo;
var otherVideo;
var searchButton;
var stopButton;
var nextButton;
var testText;
var testButton;

var localStream = new MediaStream();
var remoteStream = new MediaStream();

var socket;

let isAlreadyCalling = false;

window.onload = async () => {
    loadingScreen(1000);

    // const serverCert = $.get('cert.pem', (data) => {return data}}
    // const clientCert = $.get('client-cert.pem', (data) => {return data})
    // const clientKey = $.get('client-key.pem', (data) => {return data})

    socket = io(undefined, {
        transports: ['polling'],
        upgrade: false,
        reconnectionDelay: 1000,
        reconnection:true,
        reconnectionAttempts: 5
    });

    socket.on('connect_error', (e) => console.log('SOCKETIO: connection error', e));
    socket.on('connect_timeout', (e) => console.log('SOCKETIO: timeout error', e));
    socket.on('reconnect_failed', (e) => console.log('SOCKETIO: reconnect error', e));
    
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
    videochatHandler();
    
    //Buttons
    searchButton.addEventListener('click', e => {
        console.log('search-button');
        e.preventDefault();
    
        socket.emit('button-search');
    })
    
    stopButton.addEventListener('click', e => {
        console.log('stop-button');
        e.preventDefault();
    
        sendStop()
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

    socket.on('receive-search', () => {
        DisplayMessage('Searching')
        console.log('Now searching')
        searchButton.style.visibility = 'hidden'
        stopButton.style.visibility = 'visible'
    })

    socket.on('receive-stop', () => {
        DisplayMessage('Stopped')

        endCall()

        console.log('Call stopped')
        searchButton.style.visibility = 'visible'
        stopButton.style.visibility = 'hidden'

    })

    socket.on('receive-matched', (_matchedUserId, _caller)=> {
        console.log(`Matched with ${_matchedUserId}`)
        DisplayMessage(`Matched with ${_matchedUserId}`)

        if(peer.connectionState != 'new'){
            peer = null
            peer = new RTCPeerConnection(rtcConf);
        }
        videochatHandler();
        if(_caller){
            callUser();
        }
    })

    socket.on('receive-endCall', (_matchedUserId) => {
        DisplayMessage('Call ended')

        endCall()

        searchButton.style.visibility = 'visible'
        stopButton.style.visibility = 'hidden'
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
            stream.getTracks().forEach(track => {
                peer.addTrack(track, stream)
            });
        });
    }catch (e){
        console.log('could not find video device: ', e);
    }
}

function AddVideoStream(video, stream){
    if(video != null){
        searchButton.disabled = false;
        stopButton.disabled = false;
        nextButton.disabled = false;
        $(".nocam-wrapper").fadeOut("fast");
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

function videochatHandler(){
    
    localStream.getTracks().forEach((track) => {
        peer.addTrack(track);
    });

    peer.ontrack = event => {
        console.log('Track added');
        event.streams[0].getTracks().forEach(track => {
            remoteStream.addTrack(track);
        })
        AddVideoStream(otherVideo, remoteStream);
    }
    
    socket.on('receive-offer', async (offer) => {
        console.log('Received offer')
        peer.onicecandidate = event => {
            socket.emit('send-ice', (event.candidate));
        }
        console.log(peer.connectionState)
        console.log(peer.iceConnectionState)
        await peer.setRemoteDescription(new RTCSessionDescription(offer));

        const answerDesc = await peer.createAnswer();
        try {
            await peer.setLocalDescription(answerDesc);
        }catch(e){
            console.log('Failed to set local desc: ', e);
        }
        const answer = {
            sdp: answerDesc.sdp,
            type: answerDesc.type
        };

        socket.emit('send-answer', (answer));

        socket.on('receive-ice', ice => {
            addIceCandidate(ice)
        });
        console.log(peer);
    });
}

async function callUser(){
    console.log('call user')
    var offerCandidates = [];

    peer.onicecandidate = event => {
        console.log("New Ice Candidate!");
        socket.emit('send-ice', (event.candidate));
    }

    const offerDesc = await peer.createOffer();
    await peer.setLocalDescription(offerDesc);

    const offer = {
        sdp: offerDesc.sdp,
        type: offerDesc.type
    };

    socket.emit('send-offer', offer, offerCandidates);

    socket.on('receive-answer', async (answer) => {
        if(!peer.currentRemoteDescription) {
            const answerDesc = new RTCSessionDescription(answer);
            await peer.setRemoteDescription(new RTCSessionDescription(answerDesc));
        }
        console.log(peer);
    })
    socket.on('receive-ice', ice => {
        console.log("New Ice Candidate received!")
        addIceCandidate(ice)
    })
}

function endCall(){
    console.log('endCall called');
    peer.close();

    peer = null;
    peer = new RTCPeerConnection(rtcConf);

    RemoveVideoStream(otherVideo, remoteStream);
}

function addIceCandidate(ice) {
    if(ice){
        if(peer.iceConnectionState == 'connected'){
            console.log('user is already in a call');
            return;
        }
        try{
            peer.addIceCandidate(new RTCIceCandidate(ice))
        }catch (e){
            sendStop()
            console.log("Error adding ice candidate: " ,e);
        }
    }
}

function sendStop() {
    socket.emit('button-stop');
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