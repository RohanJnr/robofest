require('dotenv').config()

const path = require('path');

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

let camClient = null // ws
let currentPlayer = null // username
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

  // db.collection("users").add(dashinfo)
  // .then((docRef) => {
  //     console.log("Document written with ID: ", docRef.id);
  // })
  // .catch((error) => {
  //     console.error("Error adding document: ", error);
  // });


  console.log(dashinfo)
  console.log(Object.keys(playerState).length)
  // TODO send to camera/image processing client.
  // ...

}

function playProtocol(data, ws) {
  // Client willing to play a game.
  const username = data.username

  if (playerState.hasOwnProperty(username)){
    ws.send(JSON.stringify({
      "protocol": "alert",
      "message": "Username already exists, try a different username."
    }))
    return
  }
  if (currentPlayer != null){
    ws.send(JSON.stringify({
      protocol: "alert",
      message: "Another user is currently playing his rounds, try again later."
    }))
    return
  }

  usernameWsMap[username] = ws

  // DEV: Not persisting user information after session-temporary.
  playerState[username] = {
    protocol: "play",
    score: 0,
    rounds: 0,
  }

  currentPlayer = username
  

  ws.send(JSON.stringify(playerState[username]))

}

function resultProtocol(data) {
  if (!currentPlayer)return

  const ws = usernameWsMap[currentPlayer]
  const username = currentPlayer

  const winner = data.result
  let score = 0

  if (winner == "User")score=2
  else if (winner == "Tie")score=1

  playerState[currentPlayer].score += score
  playerState[currentPlayer].rounds += 1

  if (playerState[currentPlayer].rounds == 6){
    playerState[currentPlayer].protocol = "done"
    currentPlayer = null
  }

  

  ws.send(JSON.stringify(playerState[username]))

}

function initiateRound(username) {
  camClient.send(JSON.stringify({
    state: "play",
  }))
  usernameWsMap[username].send(JSON.stringify(playerState[username]))
  
}

function startProtocol(data) {
  // not required
  const username = data.username

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

app.get('/', (req, res) => "hello")

server.listen(8080, () => console.log(`Lisening on port: 8080`))
