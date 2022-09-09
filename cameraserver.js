const { database } = require('./mysqlConf');
const { exec } = require("child_process");
var fs = require('fs');
const { finished } = require("stream");
const { Console } = require("console");
const express = require("express");
const { createServer } = require("http");
const { Server } = require("socket.io");

const { io } = require("socket.io-client");
const socket = io("http://103.163.139.230:3000");

const app = express();
const httpServer = createServer(app);


var seconds = 0;
var counter
var currentTimer = 0;

function delay(delayInms) {
    return new Promise(resolve => {
        countDelay()
        currentTimer = delayTimer
        setTimeout(() => {
            clearInterval(counter);
            currentTimer = 0;
            resolve(2);
        }, delayInms);
    });
}

function countDelay(){
    seconds = 0;
    counter = setInterval(function(){
        seconds++;
    }, 1000);
}

function checkTime(min, max) {
    const d = new Date();
    let hour = d.getHours();
    if (hour > min && hour < max) {
        return true
    }
    return false;
}


function base64_encode(file) {
    // read binary data
    var bitmap = fs.readFileSync(file);
    // convert binary data to base64 encoded string
    return new Buffer(bitmap).toString('base64');
}

var fbFinished = true;
var delayTimer = 1800000;

async function fotoBadan() {
    return new Promise((resolve, reject) => {
        if (checkTime(8, 16) && fbFinished) {
            console.log("foto")
            fbFinished = false;
            const spawn = require('child_process').spawn;
            var scriptExecution = spawn('python3', ["./cambody.py", 'args']);
            var file
            scriptExecution.stdout.on('data', async (data) => {
                // console.log(data)
                var resp = new TextDecoder("utf-8").decode(data);
                // console.log(resp[1])
                var result = {}
                resp = resp.replace('\n', '');
                result['nama'] = resp
                result['file'] = base64_encode('./camera/body_' + resp);
                // resp = JSON.parse(resp);
                console.log("Sending pict")
                socket.emit("BodyImg", result);
                console.log("Delay 1800000ms")
                console.log(result["nama"])
                await delay(delayTimer);
                console.log("Delay Done")
                fbFinished = true;
                resolve(result)
            });

            scriptExecution.stdout.on('end', (data) => {
                var resp = new TextDecoder("utf-8").decode(data);
                // console.log()
                // console.log('end' + file);
                // console.log(string);
                // resolve(string);
                // console.log(uint8arrayToString(data));
                // res.json({result: 'done'});
            });

            // Handle error output
            scriptExecution.stderr.on('data', async (data) => {
                var string = new TextDecoder("utf-8").decode(data);
                console.log('error', string);
                // As said before, convert the Uint8Array to a readable string.
                // console.log(data);
                // res.json({result: data});
                await delay(30000);
                fbFinished = true;
                reject({ message: string });
            });

            scriptExecution.on('exit', (code) => {
                // console.log("Process quit with code : " + code);
                // resolve(file)
            });
            scriptExecution.stdin.write('start');
            scriptExecution.stdin.end();
        } else {
            resolve({ skip: true })
        }
    })
}

var rundude = true

var unlimitedPower = async () => {
    while (rundude) {
        await fotoBadan()
    }
}

var printstatus = async () => {
    console.log({rundude})
    socket.emit("cameraresponse", { "status": rundude })
}

socket.on("connect", async () => {
    rundude = true
    console.log(socket.id); // x8WIv7-mJelg7on_ALbx
    console.log("Socket Get")
    unlimitedPower()
});

socket.on("disconnect", async () => {
    rundude = false;
})

socket.on("cameraserversts", async () => {
    printstatus()
})

socket.on("forcestartcs", async () => {
    rundude = true;
    printstatus()
    unlimitedPower()
    console.log("started")
})

socket.on("checkTimer", async () => {
    responseTimer()
})

function responseTimer(){
    console.log({
        rundude,
        delayTimer,
        currentTimer,
        seconds
    })
    socket.emit("responseTimer", {delayTimer, currentTimer, seconds})
}

socket.on("setTimer", async(data) => {
    delayTimer = data.timer
    responseTimer()
})

app.post('/forcestartcs', (req, res) => {
    rundude = true;
    printstatus()
    res.json({"status" : true})
    unlimitedPower()
})


socket.on("forcestopcs", async () => {
    rundude = false;
    printstatus()
})

app.post('/forcestopcs', (req, res) => {
    rundude = false;
    printstatus()
    res.json({"status" : true})
})