
const usernameForm = document.getElementById("username-form")
const usernameInput = document.getElementById("username-input")
const contentDiv = document.getElementById("info")

const heading1 = document.getElementById("content-heading-1")
const heading2 = document.getElementById("content-heading-2")
const paragraph = document.getElementById("content-p")
const score = document.getElementById("score-value")
const round = document.getElementById("round-value")


const content_button = document.getElementById("play-button")

const invisClass = "invis"


let state
let username

if (document.cookie){
    username = username
    usernameForm.classList.add(invisClass)
    contentDiv.classList.remove(invisClass)

    content_button.classList.remove(invisClass)
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
const stateMapping = {
    "in-queue": inQueueState,
    "in-game": inGameState,
    "idle": idleState,
    "awaiting-start": awaitingStartState,
    "fail-start": failStartState,
}


function inQueueState(data) {

}

function inGameState(data) {
    content_button.classList.add(invisClass)
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

    content_button.classList.remove(invisClass)
    
}

function awaitingStartState(data) {
    
}

function failStartState(data) {
    
}


const ws = new WebSocket("ws://localhost:8080")


usernameForm.addEventListener("submit", event => {
    event.preventDefault()
    username = usernameInput.value
    // document.cookie = username
    ws.send(JSON.stringify(
        {
            protocol: "play",
            username
        }
        ))
})

content_button.addEventListener("click", event => {
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

    state = data.state
    stateMapping[state](data)
})
