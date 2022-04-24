var myVideo;
var otherVideo;

var localstream;

const socket = io();

socket.on('connect', () => {
    console.log(`You connected with the id: ${socket.id}`)
})

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
        })
    }catch{
        console.log('could not find video device');
    }
}

function AddVideoStream(video, stream){
    if(video != null){
        video.srcObject = stream;
        video.addEventListener('loadedmetadata', () => {
            video.play()
        })
    }else{
        console.log('no video obj found')
    }
}

function RemoveVideoStream(video, stream){
    video.pause()
    video.srcObject = null
    if (stream!= null || undefined) {
        stream.getTracks().map(function (val) {
            val.stop();
        });
    } 
}

//SetVideo();