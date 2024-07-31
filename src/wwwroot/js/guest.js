"use strict";

let connection = new signalR.HubConnectionBuilder()
    .withUrl("/chatHub")
    .build();

connection.on("ReceiveMessage", function (message) {
    var li = document.createElement("li");
    li.textContent = message;
    document.getElementById("messagesList").appendChild(li)
});
connection.start().then(function () {
    connection.invoke("joinAsGuest", document.getElementById("userName").value)
}).catch(function (err) {
    return console.error(err.toString());
});


document.getElementById("send").addEventListener("click", function (event) {
    var user = document.getElementById("userName").value;
    var message = document.getElementById("message").value;
    connection.invoke("SendMessage", message).catch(function (err) {
        return console.error(err.toString());
    });
    event.preventDefault();
})