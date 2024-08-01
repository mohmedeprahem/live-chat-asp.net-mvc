"use strict";
let mediaRecorder = null;
let audioChunks = [];
let audioBlob = null;

let connection = new signalR.HubConnectionBuilder()
    .withUrl("/chatHub")
    .build();

connection.on("ReceiveMessageFromAdmin", function (message) {
    displayMessage(message, true);
});
connection.start().then(function () {
    connection.invoke("joinAsGuest", document.getElementById("userName").value)
}).catch(function (err) {
    return console.error(err.toString());
});

connection.on("ReceiveFileFromAdmin", function (file) {
    let li = document.createElement("li");
    li.textContent = `Admin: ${file.name}`;
    document.getElementById("messagesList").appendChild(li)

    if (file.name.match(/\.(jpg|jpeg|png|gif)$/)) { 
        let img = document.createElement("img");
        img.src = file.url; 
        img.width = 100;
        img.height = 100; 
        document.getElementById("messagesList").appendChild(img);
    } 
    let a = document.createElement("a");
    a.href = file.url; 
    a.download = file.name; 
    a.textContent = "Download"; 
    document.getElementById("messagesList").appendChild(a);
})

connection.on("ReceiveAudioFromAdmin", function (file) {
    console.log(file)
    displayAudio(file.url, true);
});
function displayAudio(url, isAdmin = false) {
    let li = document.createElement("li");
    let audioPlayer = document.createElement("audio");
    audioPlayer.src = url;
    audioPlayer.controls = true;
    li.textContent = `${isAdmin ? "Admin: " : ""}`;
    li.appendChild(audioPlayer);
    document.getElementById("messagesList").appendChild(li);
}

document.getElementById("startRecording").addEventListener("click", function (event) {
    audioChunks = [];
    setupAudio();
});

document.getElementById("stopRecording").addEventListener("click", function (event) {
    if (mediaRecorder) {
        mediaRecorder.stop();
        document.getElementById("sendRecording").style.display = 'inline-block';
    } else {
        console.error("MediaRecorder is not initialized.");
    }
});

document.getElementById("sendRecording").addEventListener("click", function (event) {
    if (audioChunks.length > 0) {
        const formData = new FormData();
        formData.append('file', audioBlob, 'recording.ogg');
        formData.append('toAdmin', true);
        formData.append('userConnectionId', connection.connectionId);

        fetch('/Chat/Upload-Audio', {
            method: 'POST',
            body: formData
        })
            .then(response => response.json())
            .then(result => {
                console.log('Upload successful:', result);
                document.getElementById("sendRecording").style.display = 'none';
                displayAudio(result.fileUrl, false);
            })
            .catch(error => {
                console.error('Upload error:', error);
            });
    } else {
        console.error("No audio recording available to send.");
    }
});

function setupAudio() {
    const audioPlayer = document.getElementById("audioPlayer");

    if (navigator.mediaDevices && navigator.mediaDevices.getUserMedia) {
        navigator.mediaDevices.getUserMedia({ audio: true })
            .then(stream => {
                mediaRecorder = new MediaRecorder(stream);
                mediaRecorder.ondataavailable = function (e) {
                    audioChunks.push(e.data);
                }
                mediaRecorder.onstop = function () {

                    audioBlob = new Blob(audioChunks, { 'type': 'audio/ogg; codecs=opus' });
                    const audioUrl = URL.createObjectURL(audioBlob);
                    audioPlayer.src = audioUrl;
                }
                mediaRecorder.start();
            })
            .catch(error => {
                console.error("Error accessing media devices.", error);
            });
    } else {
        console.error("Media Devices API not supported.");
    }
}

document.getElementById("sendFile").addEventListener("click", function (event) {
    event.preventDefault();
    var fileInput = document.getElementById("fileInput");
    if (!fileInput.files || fileInput.files.length === 0) {
        console.error("No file selected.");
        return;
    }
    const file = fileInput.files[0];
    const formData = new FormData();
    formData.append("file", file);
    formData.append("toAdmin", true);
    formData.append("userConnectionId", connection.connectionId);

    fetch("/Chat/uploadFile", {
        method: "POST",
        body: formData
    })
        .then(response => response.json())
        .then(result => {
            console.log("File uploaded:", result);
            fileInput.value = '';
            let li = document.createElement("li");
            li.textContent = `${file.name}`;
            document.getElementById("messagesList").appendChild(li)
        })
        .catch(error => {
            console.error("Error uploading file:", error);
        });
})


document.getElementById("send").addEventListener("click", function (event) {
    var message = document.getElementById("message").value;
    connection.invoke("sendMessageToAdmin", message).catch(function (err) {
        return console.error(err.toString());
    });
    displayMessage(message);
    document.getElementById("message").value = '';
    event.preventDefault();
})

function displayMessage(message, isAdmin = false) {
    var li = document.createElement("li");
    li.textContent = `${isAdmin ? "Admin: " : ""}: ${message}`;
    document.getElementById("messagesList").appendChild(li)
}