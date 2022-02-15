const { Console } = require("console");
const express = require("express");
const { createServer } = require("http");
const { Server } = require("socket.io");

const { io } = require("socket.io-client");
const socket = io("http://192.168.43.90:3000");

const app = express();
const httpServer = createServer(app);


const SerialPort = require('serialport');
const Readline = SerialPort.parsers.Readline;
const port = new SerialPort('/dev/ttyACM0', 9600);
// const port = new SerialPort('COM3', 9600);
const parser = port.pipe(new Readline({ delimiter: '\r\n' }));

// const io = new Server(httpServer, { /* options */ });

// const websocket = require('ws')
// const wss = new websocket.Server({server: server})
var fserial = false;
app.use(express.json());
app.use(express.urlencoded({ extended: false }));

const { database } = require('./mysqlConf');
const { exec } = require("child_process");
var currentTask
var currentCMDrasp
// 1 = Gerak stepper 
// 2 = 1 + Siram
// 3 = 1 + Ambil gambar
// 4 = 1 + Ambil NPK
// 5 = 1 + Siram NPK
// 6 = set Speed + Accel

var taskQueue = []
var taskNomorAntrian = 0

var getTask = (task) => {
    var curTask
    for (let i = 0; i < data.length; i++) {
        if (data[i]['date'] < Date.now()) {
            curTask = data[i]
        }
        break;
    }
    return curTask
}

var onConnect = () => {
    if(fserial){
        socket.emit("TaskStart", { id: 0, status: true, id:socket.id })
    }else{
        if(trySerial==1) {
            console.log("["+ trySerial +"]Mencoba menghubungkan ke Arduino MEGA 2560 via Serial....");
            trySerial=2;
        }else if(trySerial==10){
            throw new Error("Tidak dapat terhubung dengan Arduino Mego 2560");
        }else{
            console.log("["+ trySerial +"]Mencoba ulang dalam 5 detik..");
        }
        setTimeout(() => {
            onConnect()
            // socket.emit("TaskStart", { id: data["task_id"], status: true, id:socket.id })
            trySerial++;
        }, 5000)
    }
}

socket.on("connect", () => {
    console.log(socket.id); // x8WIv7-mJelg7on_ALbx
    console.log("Serial : " + fserial);

    setTimeout(() => [
        onConnect()
        // socket.emit("TaskStart", { id: 0, status: true, id:socket.id })
    ], 5000)
    
});

socket.on("disconnect", () => {
    console.log(socket.id); // undefined
});

socket.on("setting", (data) => {
    currentCMD = 5;
    startCommand(currentCMD)
    port.write("m\n");
    port.write(data.max + "\n");
    port.write("a\n");
    port.write(data.accel + "\n");
    endCommand()
    port.flush((err,results) => {})
})

socket.on("TaskEmpty", (data) => {
    setTimeout(() => [
        socket.emit("TaskStart", { id: 0, status: true, id:socket.id })
    ], 5000)
})

var trySerial = 1;

socket.on("initial", (data) => {
    console.log(data)
    // prosesTask(data)
    currentTask = data
    if(fserial){
        socket.emit("TaskProc", { task_id: data["task_id"], status: true, id:socket.id })
        currentCMD = data.cmd
        console.log("Type Command : " + data.cmd)
        getLocation(data.target)
    
    }
    // setTimeout(() => {
    //     socket.emit("TaskDone", { task: data, task_id: data["task_id"], status: true, id:socket.id })
    // }, 10000)
})

socket.on("locationPush", (data) => {
    console.log("Location")
    console.log(data)
    // console.log("Start Command")
    // startCommand()
    // var stringCMD = ""
    taskQueue = []
    if (currentCMD == 1) {
        // data.forEach(pos => {
        //     command = command + moveCommand(pos)
        // })
        for(let i = 0; i < data.length; i++){
            taskQueue.append(moveCommand(data[i]))
            // console.log(typeof stringCMD)
        }
    } else if (currentCMD == 2) {

    } else if (currentCMD == 3) {

    } else if(currentCMD == 4){
        for(let i = 0; i < data.length; i++){
            taskQueue.append(getnpkCommand(data[i]))
            // console.log(typeof stringCMD)
        }
    }
    // console.log("End Command")
    // console.log(stringCMD)
    // command = 
    taskNomorAntrian = 0;
    executeCommandType(currentCMD)
    executeCommand(taskQueue)
    // console.log("Command \n" + command);
    // endCommand()

})

socket.on("TaskComplete", (data) => {
    if (!data) {
        console.log("Retrying Failed Task")
    }
    console.log("Task Complete")
    setTimeout(() => {
        socket.emit("TaskStart", { id: data["task_id"], status: true, id:socket.id })
    }, 5000)
})


parser.on('data', (res) => {
    // fserial=true;
    // console.log("Response");
    if(res="DIR :5 STEP :2 STEPROTATION :200")
    fserial=true;
    console.log(res + "(" + typeof res + ")");
    port.flush((err,results) => {
        if (res.match("{")) {
            data = JSON.parse(res)
            console.log(data)
            if (data.status==1 && data.cmd == currentCMD) {
                if(taskNomorAntrian<taskQueue.length){
                    executeCommand(taskQueue)
                }else{
                    endCommand()
                }
            }else if(data.status==2 && data.cmd == currentCMD) {
                currentCMD = 0
                socket.emit("TaskDone", { task: currentTask, task_id: currentTask["task_id"], status: true, id:socket.id })
            } else {
                console.log("Error : " + res.msg)
            }
        }
    });
});

var getLocation = (location) => {
    location = location.split(",")
    console.log("Target : " + location)
    socket.emit("getLocation", { location: location , id : socket.id})
}

var startCommand = (id) => {
    // console.log("WDADAWDWA" + id)
    let cmd = "c\n" + id + "\n"
    // port.write("c\n");
    // port.write(currentCMD + "\n");
    return cmd;
}

var writeCommand = (st, cmd, end) =>{
    return st + cmd + end
}

var executeCommandType = (id) => {
    let cmd = startCommand(id);
    console.log("Start Command : " + cmd.replace(/\n/g, ":"))
    port.write(cmd)
}

var executeCommand = (cmd) => {
    console.log("Executing : " + cmd[taskNomorAntrian].replace(/\n/g, ":"))    
    port.write(cmd[taskNomorAntrian])
    taskNomorAntrian++;
}

var endCommand = () => {
    // port.write("e\n");
    // port.write("0" + "\n");
    let endCommand = "e\n0\n"; 
    console.log("End Command : " + endCommand.replace(/\n/g, ":"))    
    port.write(endCommand)
}

var moveCommand = (data) => {
    let cmd = "x\n" + data.x + "\ny\n" + data.y + "\n";
    // console.log("cmd" + cmd);
    // await port.flush(function(err,results){});
    // console.log("MOVE : " + data.x + ", " + data.y + " (x,y)")
    // port.write("x\n");
    // port.write(data.x + "\n");
    // port.write("y\n");
    // port.write(data.y + "\n");
    return cmd
}

var siramCommand = (data) => {

}

var getnpkCommand = (data) => {
    let cmd = "x\n" + data.x + "\ny\n" + data.y + "\nz\n" + 10 + "\nd\n5000\nz\n0\n";
    return cmd
}



httpServer.listen(3100, () => {
    console.log('Server running on port 3100');
})