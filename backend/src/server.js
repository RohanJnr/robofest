require('dotenv').config()

const express = require('express')
const app = express()
const server = require('http').createServer(app);
const WebSocket = require('ws');

const wss = new WebSocket.Server({ server:server });

// Import the functions you need from the SDKs you need
const firebase = require("firebase");
// TODO: Add SDKs for Firebase products that you want to use
// https://firebase.google.com/docs/web/setup#available-libraries

// Your web app's Firebase configuration
firebase.initializeApp({
  apiKey: process.env.API_KEY,
  authDomain: process.env.AUTH_DOMAIN,
  projectId: process.env.PROJECT_ID,
})

let db = firebase.firestore();


let currentPlayer = null
const activePlayerQueue = [] // usernames
const usernameWsMap = {} // username: ws
const playerState = {} // username:score,rounds,state
// states: in-queue, in-game, idle, awaiting-start, fail-start

const protoclMap = {
  "play": playProtocol,
  "start": startProtocol,
  "result": resultProtocol
}


const confirm_protocol = (data, ws) => {
  const confirmed = data.confirmed
  if (confirmed){
    currentPlayer = activePlayerQueue.shift()
    currentPlayer.send()
    // send signal to master to start game
  }
}

function dashboardInfo() {
  const dashinfo = {
    playerState,
    currentPlayer    
  }

  db.collection("users").add(dashinfo)
  .then((docRef) => {
      console.log("Document written with ID: ", docRef.id);
  })
  .catch((error) => {
      console.error("Error adding document: ", error);
  });

  // TODO send to camera/image processing client.
  // ...

}

function playProtocol(data, ws) {
  // Client willing to play a game.
  const username = data.username

  usernameWsMap[username] = ws

  playerState[username] = {
    score: 0,
    rounds: 0,
    state: "in-queue",
    queuePosition: 0
  }
  if (currentPlayer === null){
    currentPlayer = username
    playerState[username]["state"] = "in-game"
    ws.send(JSON.stringify(playerState[username]))
    return
  }

  activePlayerQueue.push(username)

  playerState[username]["queuePosition"] = activePlayerQueue.indexOf(username) + 1

  ws.send(JSON.stringify(playerState[ws]))

}

function startProtocol(data) {
  const username = data.username

}

function resultProtocol(data) {
  const username = data.username

  playerState[username].score = data.score
  playerState[username].rounds = data.rounds
  playerState[username].state = "idle"

  broadcastState()
}


function broadcastState(){
  activePlayerQueue.forEach(username => {
    playerState[username].queuePosition -= 1
    if (playerState[username].queuePosition === 0){
      playerState[username].state = "awaiting-start"
      
      setTimeout(() => {
        if (playerState[username].state !== "in-game"){
          playerState[username].state = "fail-start"
          activePlayerQueue.filter(player => player !== username)
          usernameWsMap[username].send(JSON.stringify(playerState[username]))
        }
      }, 15000)

    }
    usernameWsMap[username].send(JSON.stringify(playerState[username]))
  })
}



wss.on('connection', ws => {
  console.log("connected websocket !")

  ws.on('message', message => {
    let data = JSON.parse(message)
    
    protoclMap[data.protocol](data, ws)
    dashboardInfo()
  })


});

wss.on("close", ws => {
  console.log("CLOSED")
  console.log(ws)
})

app.get('/', (req, res) => res.send('Hello'))

server.listen(8080, () => console.log(`Lisening on port: 8080`))
