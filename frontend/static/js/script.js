let state;


// states: in-queue, in-game, idle, awaiting-start, fail-start
const stateMapping = {
    "in-queue": inQueueState(),
    "in-game": inGameState(),
    "idle": idleState(),
    "awaiting-start": awaitingStartState(),
    "fail-start": failStartState(),
}


function inQueueState(data) {

}

function inGameState(data) {

}

function idleState(data) {
    
}

function awaitingStartState(data) {
    
}

function failStartState(data) {
    
}


const usernameForm = document.getElementById("username-form")
const usernameInput = document.getElementById("username-input")

const ws = new WebSocket("ws://localhost:8080")


usernameForm.addEventListener("submit", event => {
    event.preventDefault()
    let username = usernameInput.value
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
