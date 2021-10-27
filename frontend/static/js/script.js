const nameInputDiv = document.getElementById("name-input")
const usernameInput = document.getElementById("username-input")
const inGameDiv = document.getElementById("in-game")
const instructionsDiv = document.getElementById("instructions")


const scoreHeading = document.getElementById("score-heading")

const scoreSpan = document.getElementById("score-span")
const roundSpan = document.getElementById("rounds-span")


const playButton = document.getElementById("play-button")

const invisClass = "invis"


let state
let username

if (document.cookie){
    username = username
    usernameForm.classList.add(invisClass)
    contentDiv.classList.remove(invisClass)

    contentButton.classList.remove(invisClass)
}

function setContentDiv(heading1Value, paragraphValue, heading2Value, scoreValue, roundValue){
    heading1.innerHTML = heading1Value
    paragraph.innerHTML = paragraphValue
    heading2.innerHTML = heading2Value
}

function setScoreRound(scoreValue, roundValue){
    score.innerHTML = scoreValue
    round.innerHTML = roundValue
}

// states: in-queue, in-game, idle, awaiting-start, fail-start
const protocolMapping = {
    "play": playProtocol,
    "done": doneProtocol,
    "alert": alertProtocol
}

function alertProtocol(data){
    alert(data.message)
}

function doneProtocol(data) {
    scoreHeading.innerHTML = `
    ${username}, thanks for playing!
    IEEE and Robofest additional details: <a href="https://ieee-ras-pesu.github.io/website/">HERE</a>
    `

    updateScoreRounds(data)

}

function playProtocol(data){
    nameInputDiv.classList.add(invisClass)
    instructionsDiv.classList.add(invisClass)

    inGameDiv.classList.remove(invisClass)

    scoreHeading.innerHTML = username

    updateScoreRounds(data)
}

function updateScoreRounds(data){
    scoreSpan.innerHTML = data.score
    roundSpan.innerHTML = data.rounds
}

function duplicateUsername(data) {
    formHeading.innerHTML = "Username already taken!"
}

function waitingState(data) {
    formHeading.innerHTML = "Waiting for another user to finish playing, please try again later."
}

function inQueueState(data) {

}

function inGameState(data) {
    formHeading.innerHTML = ""
    contentButton.classList.add(invisClass)
    console.log(data)
    usernameForm.classList.add(invisClass)
    contentDiv.classList.remove(invisClass)

    setContentDiv(
        "You are currently playing!",
        "Show your gesture to the camera within 5 seconds",
        "",
    )
    setScoreRound(
        data.score,
        data.rounds
    )

}

function idleState(data) {
    setScoreRound(
        data.score,
        data.rounds
    )
    console.log("idle state")

    contentButton.classList.remove(invisClass)
    
}

function awaitingStartState(data) {
    
}

function failStartState(data) {
    
}


const ws = new WebSocket("ws://localhost:8080")
// const ws = new WebSocket("ws://localhost:8080")


playButton.addEventListener("click", event => {
    username = usernameInput.value.trim()
    if (!username){
        alert("Please provide a valid username.")
        return
    }
    ws.send(JSON.stringify(
        {
            protocol: "play",
            username
        }
        ))
})


ws.addEventListener("open", event => {
    console.log("connected.")
})

ws.addEventListener("message", event => {
    const data = JSON.parse(event.data)
    console.log(data)

    protocolMapping[data.protocol](data)
})
