"use strict";
let mediaRecorder = null;
let audioChunks = [];
let audioBlob = null;

let connection = new signalR.HubConnectionBuilder()
    .withUrl("/chatHub")
    .build();

connection.on("ReceiveMessageFromUser", function (userConnectionId, message) {
    displayMessage(userConnectionId, message);
});

connection.on("NewUserJoin", function (userConnectionId, userName) {
    console.log(userConnectionId, userName, "new user join");
    updateUserList({ connectionId: userConnectionId, userName });
    createChatWindow(userConnectionId);
})

connection.on("UserLeft", function (userConnectionId) {
    document.getElementById(`chatWindow-${userConnectionId}`).remove();
    document.querySelectorAll('#userList .list-group-item').forEach(item => {
        if (item.dataset.userConnectionId === userConnectionId) {
            item.remove();
        }
    });
})

connection.start().then(() => {
    fetchActiveUsers();
    connection.invoke("joinAsAdmin")
}).catch(function (err) {
    return console.error(err.toString());
});

connection.on("ReceiveFileFromUser", function (userConnectionId, file) {
    let chatWindow = document.getElementById(`chatWindow-${userConnectionId}`);

    let li = document.createElement("li");
    li.textContent = `User: ${file.name}`;
    chatWindow.querySelector('ul').appendChild(li);

    if (file.name.match(/\.(jpg|jpeg|png|gif)$/)) {
        let img = document.createElement("img");
        img.src = file.url;
        img.width = 100;
        img.height = 100;
        chatWindow.querySelector('ul').appendChild(img);
    }

    let a = document.createElement("a");
    a.href = file.url;
    a.download = file.name;
    chatWindow.querySelector('ul').appendChild(a);

})

connection.on("ReceiveAudioFromUser", function (userConnectionId, file) {
    console.log(file, userConnectionId);
    displayAudio(file.url, userConnectionId, false);
})

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
        const receiverConnectionId = document.getElementById("userList").querySelector(".active").dataset.userConnectionId;
        formData.append('file', audioBlob, 'recording.ogg');
        formData.append('toAdmin', false);
        formData.append('userConnectionId', receiverConnectionId);

        fetch('/Chat/Upload-Audio', {
            method: 'POST',
            body: formData
        })
            .then(response => response.json())
            .then(result => {
                console.log('Upload successful:', result);
                document.getElementById("sendRecording").style.display = 'none';
                displayAudio(result.fileUrl, receiverConnectionId, true);
            })
            .catch(error => {
                console.error('Upload error:', error);
            });
    } else {
        console.error("No audio recording available to send.");
    }
});
function displayAudio(url, userConnectionId, isAdmin = false) {
    let chatWindow = document.getElementById(`chatWindow-${userConnectionId}`);
    let messageElement = document.createElement("li");
    messageElement.textContent = ` ${isAdmin ? "" : "User:"} `;
    let audioElement = document.createElement("audio");
    audioElement.src = url;
    audioElement.controls = true;
    messageElement.appendChild(audioElement);
    chatWindow.querySelector('ul').appendChild(messageElement);
}


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

document.getElementById("sendMessage").addEventListener("click", function (event) {
    const message = document.getElementById("messageInput").value;
    const userConnectionId = document.getElementById("userList").querySelector(".active").dataset.userConnectionId;

    connection.invoke("sendMessageToUser", userConnectionId, message).catch(function (err) {
        return console.error(err.toString());
    });
    displayMessage(userConnectionId, message, true);
    document.getElementById("messageInput").value = '';
    event.preventDefault();
})

document.getElementById("sendFile").addEventListener("click", function (event) {
    event.preventDefault();

    const activeUserElement = document.getElementById("userList").querySelector(".active");
    if (!activeUserElement) {
        console.error("No active user found.");
        return;
    }

    const userConnectionId = activeUserElement.dataset.userConnectionId;
    const fileInput = document.getElementById("fileInput");

    if (!fileInput.files || fileInput.files.length === 0) {
        console.error("No file selected.");
        return;
    }

    const file = fileInput.files[0];
    const formData = new FormData();
    formData.append("file", file);
    formData.append("userConnectionId", userConnectionId);
    formData.append("toAdmin", false);

    console.log("Uploading file for user:", userConnectionId);

    fetch("/Chat/uploadFile", {
        method: "POST",
        body: formData
    })
        .then(response => response.json())
        .then(data => {
            console.log("File uploaded successfully:", data);
            fileInput.value = '';
            displayMessage(userConnectionId, file.name, true);
        })
        .catch(error => {
            console.error("Error uploading file:", error);
        });
});

function displayMessage(userConnectionId, message, isAdmin = false) {
    let chatWindow = document.getElementById(`chatWindow-${userConnectionId}`);

    const messageElement = document.createElement("li");
    messageElement.textContent = ` ${isAdmin ? "" : "User:"} ${message}`;
    chatWindow.querySelector('ul').appendChild(messageElement);
}
function updateUserList(user) {
    const li = document.createElement("li");
    li.classList.add("list-group-item");
    li.dataset.userConnectionId = user.connectionId;
    li.textContent = user.userName;
    li.addEventListener("click", function () {
        document.querySelectorAll('#userList .list-group-item').forEach(item => item.classList.remove('active'));
        this.classList.add('active');
        showChatWindow(user.connectionId);
    });
    userList.appendChild(li);
}

function createUserList(users) {
    users.forEach(user => {
        updateUserList(user);
    });
}
function showChatWindow(userConnectionId) {
    document.querySelectorAll('.chat-window').forEach(chatWindow => {
        chatWindow.style.display = 'none';
    });
    const chatWindow = document.getElementById(`chatWindow-${userConnectionId}`);
    chatWindow.style.display = 'block';
}

function createChatWindow(userConnectionId) {
    const chatWindowContainer = document.createElement("div");
    chatWindowContainer.id = `chatWindow-${userConnectionId}`;
    chatWindowContainer.classList.add('chat-window');
    chatWindowContainer.style.display = 'none';
    const messagesList = document.createElement("ul");
    messagesList.classList.add('messages-list');
    chatWindowContainer.appendChild(messagesList);

    document.getElementById('chatWindows').appendChild(chatWindowContainer);

    return chatWindowContainer;
}

function fetchActiveUsers() {
    fetch('/api/user/active')
        .then(response => response.json())
        .then(users => {
            createUserList(users);
            users.forEach(user => createChatWindow(user.connectionId));
        })
        .catch(error => console.error('Error fetching active users:', error));
}