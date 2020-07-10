const TextToSpeechV1 = require('ibm-watson/text-to-speech/v1');
const { IamAuthenticator } = require('ibm-watson/auth');
const fs = require('fs');
const express = require('express')
const app = express()
const port = 3000
const SoxAsync = require('sox-async')
const fetch = require('node-fetch')
const textToSpeech = new TextToSpeechV1({
    authenticator: new IamAuthenticator({
        apikey: 'i1wcQA2sjOCIdc5QJDieFVjp7JUuO7-wCvlPPwdJAccY',
    }),
    url: 'https://api.us-south.text-to-speech.watson.cloud.ibm.com/instances/39c0d4df-1415-4567-bfa3-13857ec4f7f2',
});

var led = false;
var motion = false;
var light = false;

app.get('/intro.wav', (req, res) => {
    //res.download('./intro.wav')
    getAudio('Please press button one if you want get heart rate information. Press button two for step count. Press button 3 for getting sleep. Press button 4 for air quality. Press button 5 or 6 to turn on/off bulb sensor. Press button 7 to get information from motion sensor. Press button 8 to get information about lightning.', './intro.wav', './intro-8.wav', (filePath) => res.download(filePath))
})

app.get('/heart-rate.wav', (req, res) => {
    fetch('http://192.168.0.248:4000/mg/heart-rate', {
        headers: { 'Content-Type': 'application/json' },
    })
    .then(res => res.json())
    .then(json => {
        console.log(json)
        const msg = 'Heart rate is ' + json.heartRate.toString() + ' bmp.'
        getAudio(msg, 'heart-rate.wav', './heart-rate-8.wav', (filePath) => res.download(filePath))
    });
})

app.get('/step-count.wav', (req, res) => {
    app.get('/heart-rate.wav', (req, res) => {
    fetch('http://192.168.0.248:4000/mg/step-count', {
        headers: { 'Content-Type': 'application/json' },
    })
    .then(res => res.json())
    .then(json => {
        console.log(json)
        const msg = 'You have ' + json.stepCount.toString() + ' steps today.'
        getAudio(msg, 'heart-rate.wav', './heart-rate-8.wav', (filePath) => res.download(filePath))
    });
})
    
})
app.get('/sleep.wav', (req, res) => {
    fetch('http://192.168.0.248:4000/mg/sleep', {
        headers: { 'Content-Type': 'application/json' },
    })
    .then(res => res.json())
    .then(json => {
        console.log(json)
        console.log(msToTime(Math.abs(new Date(json.startDate) - new Date(json.endDate))))
        const msg = 'You sleep ' + msToTime(Math.abs(new Date(json.startDate) - new Date(json.endDate))) + '.'
        getAudio(msg, './sleep.wav', './sleep-8.wav', (filePath) => res.download(filePath))
    });
    
})


app.get('/air-quality.wav', (req, res) => {
    getAudio('air-quality', './air-quality.wav', './air-quality-8.wav', (filePath) => res.download(filePath))
})

app.get('/led-off.wav', (req, res) => {
     
    fetch('http://localhost:4000/pi/led', {
        method: 'post',
        body:    JSON.stringify({onoff: false}),
        headers: { 'Content-Type': 'application/json' },
    })
    .then(res => res.json())
    .then(json => {
        console.log(json)
        let msg = '';
        if(json.status == 1) {
            msg = 'Led sensor turn on'
        } else {
            msg = 'Led sensor turn off'
        }
        getAudio(msg, './led.wav', './led-8.wav', (filePath) => res.download(filePath))
    });
})
app.get('/led-on.wav', (req, res) => {
    fetch('http://localhost:4000/pi/led', {
        method: 'post',
        body:    JSON.stringify({onoff: true}),
        headers: { 'Content-Type': 'application/json' },
    })
    .then(res => res.json())
    .then(json => {
        console.log(json)
        let msg = '';
        if(json.status == 1) {
            msg = 'Led sensor turn on'
        } else {
            msg = 'Led sensor turn off'
        }
        getAudio(msg, './led.wav', './led-8.wav', (filePath) => res.download(filePath))
    });
    
})
app.get('/motion.wav', (req, res) => {
    fetch('http://localhost:4000/pi/motion', {
        method: 'GET',
        headers: { 'Content-Type': 'application/json' },
    })
    .then(res => res.json())
    .then(json => {
        console.log(json)
        let msg = '';
        if(json.status == 1) {
            msg = 'Motion detected'
        } else {
            msg = 'Motion undetected'
        }
        getAudio(msg, './motion.wav', './motion-8.wav', (filePath) => res.download(filePath))
    });
    
})

app.get('/light.wav', (req, res) => {
    fetch('http://localhost:4000/pi/light', {
        method: 'GET',
        headers: { 'Content-Type': 'application/json' },
    })
    .then(res => res.json())
    .then(json => {
        console.log(json)
        let msg = '';
        if(json.status == 1) {
            msg = "It's dark now"
        } else {
            msg = "It's light now"
        }
        getAudio(msg, './light.wav', './light-8.wav', (filePath) => res.download(filePath))
    });
    
})

app.listen(port, () => console.log(`Example app listening at http://localhost:${port}`))

function getAudio(text, inputFile, outputFile, callback) {
    const synthesizeParams = {
        text: text,
        accept: 'audio/wav',
        voice: 'en-US_AllisonVoice',
    };
    textToSpeech.synthesize(synthesizeParams)
        .then(response => {
            const audio = response.result;
            return textToSpeech.repairWavHeaderStream(audio);
        })
        .then(repairedFile => {
            fs.writeFileSync('intro.wav', repairedFile);
            const sox = new SoxAsync()
            sox.run({
                inputFile: './intro.wav',
                outputFile: './intro-8.wav',
                output: {
                    bits: 16,
                    rate: 8000,
           
                    channels: 1
                }
            })
                .then(outputFilePath => {
                    callback(outputFilePath)
                })
                .catch(err => console.log(err))
        })
        .catch(err => {
            console.log(err);
        });
}

function msToTime(duration) {
  var milliseconds = parseInt((duration % 1000) / 100),
    seconds = Math.floor((duration / 1000) % 60),
    minutes = Math.floor((duration / (1000 * 60)) % 60),
    hours = Math.floor((duration / (1000 * 60 * 60)) % 24);

  hours = (hours < 10) ? "" + hours : hours;
  minutes = (minutes < 10) ? "" + minutes : minutes;
  seconds = (seconds < 10) ? "0" + seconds : seconds;

  return hours + " hours " + minutes + " minutes";
}
