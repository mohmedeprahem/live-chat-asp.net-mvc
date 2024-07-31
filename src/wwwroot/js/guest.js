"use strict";

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