const { Console } = require("console");
const express = require("express");
const { createServer } = require("http");
const { Server } = require("socket.io");

const { io } = require("socket.io-client");
const socket = io("http://localhost:3000");

const app = express();
const httpServer = createServer(app);


const SerialPort = require('serialport'); 
const Readline = SerialPort.parsers.Readline;
const port = new SerialPort('COM3', 9600);
const parser = port.pipe(new Readline({delimiter: '\r\n'}));
// const io = new Server(httpServer, { /* options */ });

// const websocket = require('ws')
// const wss = new websocket.Server({server: server})

app.use(express.json());
app.use(express.urlencoded({extended: false}));

const {database} = require('./mysqlConf')

var getTask = (task) => {
    var curTask
    for(let i = 0; i < data.length ; i++){
        if (data[i]['date'] < Date.now()){
            curTask = data[i]
        }
        break;
    }
    return curTask
}


socket.on("connect", () => {
    console.log(socket.id); // x8WIv7-mJelg7on_ALbx
    setTimeout(()=>[
        socket.emit("TaskStart", {id: 0, status: true})
    ], 5000)
});
  
socket.on("disconnect", () => {
    console.log(socket.id); // undefined
});

socket.on("TaskEmpty", (data)=> {
    setTimeout(()=>[
        socket.emit("TaskStart", {id: 0, status: true})
    ], 5000)
})

socket.on("initial", (data) =>{
    console.log(data)
    // prosesTask(data)
    socket.emit("TaskProc", {task_id: data["task_id"], status: true})
    setTimeout(()=>{    
        socket.emit("TaskDone", {task: data,task_id: data["task_id"], status: true})
    }, 10000)
})

socket.on("TaskComplete", (data) => {
    if(!data){
        console.log("Retrying Failed Task")
    }
    setTimeout(()=>{
        socket.emit("TaskStart", {id: data["task_id"], status: true})
    }, 5000)
})


parser.on('data', (data) => {
    console.log(data);
    // const responseArray = JSON.parse(data);  // Incoming Data from arduino
    // console.log("got response from port COM3\n " + responseArray)
    // posisiX = responseArray['x'];
    // posisiY = responseArray['y'];
    // posisiZ = responseArray['z'];
  });

// wss.on('connection', function connection(ws) {
//     console.log("new lient connected")
    
//     ws.on('message', function incoming(data){
//         console.log("Client : %s", data)
//     })
// })


httpServer.listen(3100, () => {
    console.log('Server running on port 3100');
})