"use strict";

let connection = new signalR.HubConnectionBuilder()
    .withUrl("/chatHub")
    .build();

connection.on("ReceiveMessageFromUser", function (userConnectionId, message) {
    
});

connection.on("NewUserJoin", function (userConnectionId, userName) {
    const li = document.createElement("li");
    li.classList.add("list-group-item");
    li.dataset.userConnectionId = userConnectionId;
    li.textContent = userName;
    li.addEventListener("click", function () {
        document.querySelectorAll('#userList .list-group-item').forEach(item => item.classList.remove('active'));
        this.classList.add('active');
        showChatWindow(userConnectionId);
    });
    userList.appendChild(li);
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

function createUserList(users) {
    users.forEach(user => {
        const li = document.createElement("li");
        li.classList.add("list-group-item");
        li.dataset.userId = user.connectionId;
        li.textContent = user.userName;
        li.addEventListener("click", function () {
            document.querySelectorAll('#userList .list-group-item').forEach(item => item.classList.remove('active'));
            this.classList.add('active');
            showChatWindow(user.connectionId);
        });
        userList.appendChild(li);
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