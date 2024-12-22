const socket = io();

const welcomeScreen = document.getElementById("welcome-screen");
const mainContainer = document.getElementById("main-container");
const userList = document.getElementById("user-list");
const chatBox = document.getElementById("chat-box");
const messageInput = document.getElementById("message");
const sendButton = document.getElementById("send");

let username;
let visitorList = [];
let currentVisitorIndex = 0;
let audioContext;

const noteFrequencies = {
    1: 261.63, // Do
    2: 293.66, // Re
    3: 329.63, // Mi
    4: 349.23, // Fa
    5: 392.00, // Sol
    6: 440.00, // La
    7: 493.88  // Si
};

function initAudio() {
    if (!audioContext) {
        audioContext = new AudioContext();
        console.log("AudioContext 已初始化");
    }
    if (audioContext.state === "suspended") {
        audioContext.resume()
            .then(() => console.log("AudioContext 恢复成功！"))
            .catch((err) => console.error(`无法恢复 AudioContext: ${err}`));
    }
}

function playSound(numbersSequence) {
    initAudio();
    if (!audioContext || audioContext.state !== "running") {
        console.error("音效播放失败：AudioContext 未运行！");
        return;
    }

    let time = audioContext.currentTime;

    numbersSequence.forEach((num) => {
        const osc = audioContext.createOscillator();
        const gainNode = audioContext.createGain();

        osc.type = "sine";
        osc.frequency.value = noteFrequencies[num] || 440; // 使用对应音高，默认值为 440 Hz (A4)
        gainNode.gain.setValueAtTime(0, time);
        gainNode.gain.linearRampToValueAtTime(0.8, time + 0.02);
        gainNode.gain.linearRampToValueAtTime(0, time + 0.2);

        osc.connect(gainNode).connect(audioContext.destination);
        osc.start(time);
        osc.stop(time + 0.2);

        time += 0.5; // 调整间隔
    });
}

welcomeScreen.addEventListener("click", () => {
    initAudio();

    welcomeScreen.style.display = "none";
    mainContainer.style.display = "flex";

    username = prompt("請輸入三個1到7之間的數字組成的名稱：");
    while (!isValidUsername(username)) {
        username = prompt("名稱不符合規範或已被使用，請重新輸入三個1到7之間的數字：");
    }

    const room = "main";
    socket.emit("join-room", { room, username });
});

socket.on("update-participants", (participants) => {
    userList.innerHTML = "<strong>Users in the room:</strong>";
    visitorList = [];

    participants.forEach((user) => {
        const li = document.createElement("div");
        li.textContent = user;
        userList.appendChild(li);

        const numbers = user.match(/[1-7]/g).map(Number);
        visitorList.push(numbers);
    });

    console.log(`更新访客列表：${visitorList}`);
});

socket.on("load-history", (history) => {
    history.forEach((message) => {
        displayMessage(message);
    });
});

socket.on("receive-message", (message) => {
    displayMessage(message);
});

function startTimedSoundPlayback() {
    const calculateDelay = () => {
        const currentTime = new Date();
        const seconds = currentTime.getSeconds();
        const milliseconds = currentTime.getMilliseconds();
        const nextTriggerInSeconds = 20 - (seconds % 20);
        const delay = nextTriggerInSeconds * 1000 - milliseconds;

        console.log(`距离下一次音效播放的时间：${delay} 毫秒`);
        return delay;
    };

    setTimeout(() => {
        setInterval(() => {
            if (visitorList.length > 0) {
                playSound(visitorList[currentVisitorIndex]);
                currentVisitorIndex = (currentVisitorIndex + 1) % visitorList.length;
            } else {
                console.log("访客列表为空，无法播放音效。");
            }
        }, 20000);
    }, calculateDelay());
}

startTimedSoundPlayback();

sendButton.addEventListener("click", sendMessage);
messageInput.addEventListener("keypress", (event) => {
    if (event.key === "Enter") sendMessage();
});

function sendMessage() {
    const message = messageInput.value.trim();
    if (message) {
        socket.emit("send-message", { room: "main", username, message });
        messageInput.value = "";
    }
}

function displayMessage(message) {
    const messageElement = document.createElement("div");
    messageElement.textContent = message;
    chatBox.appendChild(messageElement);
    chatBox.scrollTop = chatBox.scrollHeight;
}

function isValidUsername(name) {
    return /^[1-7]{3}$/.test(name);
}
    

function displayMessage(message) {
    const messageElement = document.createElement("div");
    messageElement.textContent = message;
    chatBox.appendChild(messageElement);
    chatBox.scrollTop = chatBox.scrollHeight;
}

function isValidUsername(name) {
    return /^[1-7]{3}$/.test(name);
}
