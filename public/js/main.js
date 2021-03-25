const chatForm = document.getElementById('chat-form');
const chatMessages = document.querySelector('.chat-messages');
const roomName = document.getElementById('room-name');
const userList = document.getElementById('users');
const inputMessage =document.getElementById('msg');
const TYPING_TIMER_LENGTH = 400; // ms

let typing = false;
let lastTypingTime;

// Get username and room from URL
// ignoreQueryPrefix ignores the leading question mark. Can also use require('query-string')
const { username, room} = Qs.parse(location.search, {
    ignoreQueryPrefix: true
});

// Insert into io('url') if different than window.location / domain
const socket = io();

// On join chatroom
socket.emit('joinRoom', { username, room });

// Get room and users
socket.on('roomUsers', ({ room, users }) => {
    outputRoomName(room);
    outputUsers(users);
});

// Prevent duplicate username
socket.on('sameName', () => {
    alert("Username already exist, please choose another username.");
    window.history.back();
});

inputMessage.addEventListener("input", () => {
    updateTyping();
});

// Updates the typing event
const updateTyping = () => {
    if (!typing) {
        typing = true;
        socket.emit('typing');
    }
    lastTypingTime = (new Date()).getTime();

    setTimeout(() => {
    const typingTimer = (new Date()).getTime();
    const timeDiff = typingTimer - lastTypingTime;
    if (timeDiff >= TYPING_TIMER_LENGTH && typing) {
        socket.emit('stop typing');
        typing = false;
    }
    }, TYPING_TIMER_LENGTH);
}

socket.on('typing', (data) => {
    addChatTyping(data);
});

// Whenever the server emits 'stop typing', kill the typing message
socket.on('stop typing', (data) => {
    removeChatTyping(data);
});

// Adds the visual chat typing message
const addChatTyping = (data) => {
    data.typing = true;
    data.message = ' is typing..';
    addTypingMessage(data);
}

// Removes the visual chat typing message
const removeChatTyping = (data) => {
    const typingElement = document.getElementsByClassName('typing')

    while (typingElement.length > 0) typingElement[0].remove();
}

 // Adds the visual chat message to the message list
 const addTypingMessage = (data, options) => {
    const typingClass = data.typing ? 'typing' : '';
    const div = document.createElement('div');
    div.classList.add(typingClass);

    const p = document.createElement('p');
    p.innerText = data.username + data.message;

    div.appendChild(p);

    document.querySelector('.is-typing').appendChild(div);
}

// Message from server
socket.on('message', message => {
    console.log(message);
    outputMessage(message);

    // Scroll bottom
    chatMessages.scrollTop = chatMessages.scrollHeight;
});

// Message submit
chatForm.addEventListener('submit', (e) => {
    e.preventDefault();

    // Get message text
    const msg = e.target.elements.msg.value;

    // Emit message to server
    socket.emit('chatMessage', msg);
    socket.emit('stop typing');
    typing = false;

    // Clear input
    e.target.elements.msg.value = '';
    e.target.elements.msg.focus();
});

// Output message to DOM
function outputMessage(message) {
    const div = document.createElement('div');
    div.classList.add('message');

    const p = document.createElement('p');
    p.classList.add('meta');
    p.innerText = message.username + ' ';

    const spanTime = document.createElement('span');
    spanTime.innerText = message.time;
    p.appendChild(spanTime);

    div.appendChild(p);

    const para = document.createElement('p');
    para.classList.add('text');
    para.innerText = message.text;

    div.appendChild(para);

    document.querySelector('.chat-messages').appendChild(div);
}

// Add room name to DOM
function outputRoomName(room) {
    roomName.innerText = room;
}

// Add users list to DOM
function outputUsers(users) {
    // join the array to string. can also user foreach
    userList.innerHTML = `
        ${users.map(user => `<li>${user.username}</li>`).join('')}
    `;
}