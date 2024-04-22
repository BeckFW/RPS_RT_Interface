const axios = require('axios');
const { exec } = require('child_process'); // open image for testing
const fs = require('fs'); // open image for testing
const sharp = require('sharp'); // convert image to png

// Setup 

const RT_API = process.env.RT_API_URL; 
const RT_API_KEY = process.env.RT_API_KEY;
const RPS_API = process.env.RPS_API_URL;
const RPS_API_KEY = process.env.RPS_API_KEY;
const SEQUENCE_PREFIX = "beck_rps_";


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
const playWelcomeSequence = async () => {
    const options = new RT_API_Sequence_Request(SEQUENCE_PREFIX + "play", 0, null, false);

    axios.request(options)
    .then((response) => {
        console.log("Welcome sequence played!");
    })
    .catch((error) => {
        console.error("Error playing welcome sequence");
        console.log(error);
    });
}
const playHelloSequence = async () => {
    const options = new RT_API_Sequence_Request(SEQUENCE_PREFIX + "welcome", 0, null, false);

    axios.request(options)
    .then((response) => {
        console.log("Hello sequence played!");
    })
    .catch((error) => {
        console.error("Error playing hello sequence");
        console.log(error);
    });
}

// Play result sequence
const playMoveSequence = async (move) => {
    const options = new RT_API_Sequence_Request(SEQUENCE_PREFIX + "move_" + move.trim(), 0, null, false);

    axios.request(options)
    .then((response) => {
        console.log("Move sequence played!");
    }) 
    .catch((error) => {
        console.error("Error playing move sequence");
        console.log(error);
    });

}
// Play scores sequence/CF
const playWinLossSequence = async (robotWinState) => {
    // robotWinState = "win" | "loss" | "draw". From RT's perspective
    const options = new RT_API_Sequence_Request(SEQUENCE_PREFIX + "robo_" + robotWinState.trim(), 0, null, false);

    axios.request(options)
    .then((response) => {
        console.log("Win/Loss sequence played!");
    })
    .catch((error) => {
        console.error("Error playing win/loss sequence");
        console.log(error);
    });
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


//speak("Hello, welcome to Rock, Paper, Scissors!");
//speak("Press ENTER on the keyboard to start the game."); 
//speak("Hello, welcome to Rock, Paper, Scissors!");
//speak("Press ENTER on the keyboard to start the game.");

playHelloSequence();

process.stdin.on('data', async () => {
if (!gameRunning) {
        startGame(); 
    gameRunning = true;
} else { 
    while (playerScore < 2 && npcScore < 2) {
        try {
            // To hold moves
    let npcMove, playerMove;
    // Generate a random NPC move
    npcMove = await generateMove();

            // Play countdown on RT
            playWelcomeSequence();
    // Wait for sequence to finish playing
            await waitForSequence(6); 

            // Play RT's move
            playMoveSequence(npcMove);
            waitForSequence(2);

    // Capture image from RT camera
    await captureImage()
    .then(async (image) => {
        fs.writeFileSync('test.png', image);
        exec('open test.png'); 
        playerMove = await checkGesture(image);
    })
    
    // Determine move and response
            const result = await calculateResult(playerMove, npcMove)
            
            console.log("Waiting for sequence to finish...");
            await waitForSequence(1); 
            console.log("Waited."); 

            // Play result sequence
            console.log(`Result: ${result}`);
            switch(result.toLowerCase()) {
        case "win":
            playerScore++;
                    playWinLossSequence("loss");
            break;
                case "loss":
            npcScore++;
                    playWinLossSequence("win");
            break;
        case "draw":
                    speak(`I played ${npcMove}. It's a draw!`);
            break;
    }

            await waitForSequence(3); 
            speak(`The score is ${playerScore}, ${npcScore}.`);
            waitForSequence(2);
            speak("Next round!");
    await waitForSequence(5);


        } catch (error) {
            console.log(error?.code); 
            speak("Something went wrong. Let's try again.");
            await waitForSequence(5);
        }
    }
   

    
    //await waitForSequence(5);

    // Play scores sequence on RT
    //playScoresSequence();
}
});