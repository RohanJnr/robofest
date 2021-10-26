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
  // TODO send to camera/image processing client.
  // ...

}

function playProtocol(data, ws) {
  // Client willing to play a game.
  const username = data.username

  usernameWsMap[username] = ws

  // DEV: Not persisting user information after session-temporary.
  playerState[username] = {
    score: 0,
    rounds: 0,
    state: "in-queue",
    queuePosition: 0
  }
  // if (!playerState.hasOwnProperty(username)){
  //   playerState[username] = {
  //     score: 0,
  //     rounds: 0,
  //     state: "in-queue",
  //     queuePosition: 0
  //   }
  // }
  // else {
  //   ws.send(JSON.stringify({
  //     state: "duplicate-username",
  //     message: "Username already taken"
  //   }))
  //   return
  // }
  
  if (currentPlayer === null){
    currentPlayer = username
    playerState[username]["state"] = "in-game"

    initiateRound(username)
    return
  }

  else {
    // temporary
    ws.send(JSON.stringify({
      state: "waiting",
      message: "Someone else is already playing, wait for them to finish!"
    }))
    return
  }

  activePlayerQueue.push(username)

  playerState[username]["queuePosition"] = activePlayerQueue.indexOf(username) + 1

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

function resultProtocol(data) {
  playerState[currentPlayer].score += data.score
  playerState[currentPlayer].rounds += 1
  dashboardInfo()
  if (playerState[currentPlayer].rounds % 3 !== 0){
    // 1 match is 3 rounds.
    console.log("Another round.")
    initiateRound(currentPlayer)
    return
  }

  else {
    console.log("No rounds.")
    // done playing 1 match
    playerState[currentPlayer].state = "idle"
    usernameWsMap[currentPlayer].send(JSON.stringify(playerState[currentPlayer]))

    currentPlayer = null

    dashboardInfo()
  }
  // broadcastState()
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
    if (data.username === "camCamera-123456"){
      camClient = ws
      return
    }
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
