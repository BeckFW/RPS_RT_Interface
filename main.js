const axios = require('axios');
const { exec } = require('child_process'); // open image for testing
const fs = require('fs'); // open image for testing
const sharp = require('sharp'); // convert image to png

// Setup 

const RT_API = process.env.RT_API_URL; 
const RT_API_KEY = process.env.RT_API_KEY;
const RPS_API = process.env.RPS_API_URL;
const RPS_API_KEY = process.env.RPS_API_KEY;


let gameRunning = false; 
let playerScore = 0;
let npcScore = 0;
let playerMove = "";
let npcMove = "";


class RT_API_Sequence_Request {
// Class to create a request object to play sequences on RT
    constructor(sequenceName, offset, duration, loop) {
        this.method = 'put';
        this.url = RT_API + `/sequence_player/play/${sequenceName}`;
        this.headers = {
            'tritium-auth-token': RT_API_KEY
        }; 
        this.body = {
            "offset_seconds": offset || 0, 
            "duration_seconds": duration || null,
            "loop": loop || false,
        }
    }
}
// Functions

// Play welcome message
const welcomeMessage = () => {
    console.log("Welcome to Rock, Paper, Scissors!");
}

const startGame = () => {
    gameRunning = true;
}


// Play countdown sequence
const playCountdown = async () => {
}

// Capture Image
const captureImage = () => {
    return new Promise((resolve, reject) => {
        // config object for axios request
        const config = {
            method: 'get',
            url: RT_API + `/video_capture/jpeg`,
            headers: {
                'X-Tritium-Auth-Token': RT_API_KEY
            }, 
            responseType: 'arraybuffer'
        }

        axios.request(config)
        .then((response) => {
            console.log("Image Captured!");
            
            // Convert response to png
            sharp(response.data)
                    .toFormat('png')
                    .toBuffer()
                    .then((pngBuffer) => {
                        // Resolve with the PNG buffer
                        resolve(pngBuffer);
                    })
                    .catch((err) => {
                        console.error('Error converting image to PNG:', err);
                        reject(err);
                    });
        })
        .catch((error) => {
            console.error("Error Capturing Image!");
            reject(error);
        });
    });
}

// Determine move
const checkGesture = async (imageBuffer) => {
    // config object for axios request
    let config = {
        method: 'post',
        maxBodyLength: Infinity,
        url: process.env.RPS_API_URL + '/gestures/recognise',
        headers: { 
            'Content-Type': 'image/png',
            'api-key': process.env.RPS_API_KEY,
        },
        data: imageBuffer
        };

    axios.request(config)
    .then((response) => {
        console.log("Image processed!"); 
        speak("You made a " + response.data + " gesture.");
        console.log(response.data);
    })
    .catch((error) => {
        console.error("Error!");
        if (error.response.status === 500) {
            speak("Sorry, I was unable to find a gesture.");
            console.log("500: Internal Server Error");
        } 
        //console.log(error.message)
    });

}

const speak = async (text) => {
    const config = {
        method: 'put',
        url: RT_API + '/text_to_speech/say',
        headers: {
            'content-type': 'text/plain; charset=UTF-8', 
            'X-Tritium-Auth-Token': RT_API_KEY
        },
        data: text
    }
    
    console.log("Speaking: " + text);

    /*
    axios.request(config)
    .then((response) => {
        //console.log(text);
    })
    .catch((error) => {
        console.error("TTS Error");
        console.log(error);
        //console.log(error.response.statusText); 
    });
    */

}

// Determine result
const calculateResult = (playerMove, npcMove) => {
    let config = {
        method: 'get',
        url: process.env.API_URL + `/moves/respond?playerMove=${playerMove}&npcMove=${npcMove}`,
        headers: { 
            'api-key': process.env.API_KEY,
        },
        };
        
    return axios.request(config)
    .then((response) => {
        console.log("success");
        return response.data.result; 
    })
    .catch((error) => {
        console.log("error");
   
    });
}

// Play result sequence
const playMoveSequence = async (move) => {
}
// Play scores sequence/CF
const playScoresSequence = async () => {
}

// Wait for x seconds for sequences to finish
const waitForSequence = async (duration) => {
    return new Promise(resolve => setTimeout(resolve, duration * 1000));
}

const test = async () => {
    // Countdown from 5
    for(let i = 3; i > 0; i--) {
        speak(i.toString());
        //console.log(i);
        await new Promise(resolve => setTimeout(resolve, 2000)); // wait for 1 second
    }
    await captureImage()
    .then((image) => {
        fs.writeFileSync('test.png', image);
        exec('open test.png'); 
        //checkGesture(image);
    })
    .catch((err) => {
        console.log(err);
    });
}
// ---------------- //
// ----- Main ----- // 
// ---------------- //

speak("Hello, welcome to Rock, Paper, Scissors!");
speak("Press ENTER on the keyboard to start the game."); 

process.stdin.on('keypress', function (ch, key) {
    if (key && key.name == 'enter') {
        startGame(); 
    }
});

while (gameRunning) { 
    // Play countdown on RT
    speak("Let's play."); 

    let npcMove, playerMove;

    // Play countdown sequence on RT
    playCountdownSequence();

    // Generate a random NPC move
    npcMove = await generateMove();

    // Wait for sequence to finish playing
    await waitForSequence(5); 

    // Capture image from RT camera
    await captureImage()
    .then(async (image) => {
        fs.writeFileSync('test.png', image);
        exec('open test.png'); 
        playerMove = await checkGesture(image);
    })
    
    playMoveSequence(npcMove)
    
    // Determine move and response
    const result = calculateResult(playerMove, npcMove);

    switch(result) {
        case "win":
            playerScore++;
            speak("You win!");
            break;
        case "lose":
            npcScore++;
            speak("You lose!");
            break;
        case "draw":
            speak("It's a draw!");
            break;
    }

    /*
    await waitForSequence(5);

    // Play scores sequence on RT
    playScoresSequence();
    */
}




