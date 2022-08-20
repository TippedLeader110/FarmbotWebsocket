const { Console } = require("console");
const express = require("express");
const { createServer } = require("http");
const { Server } = require("socket.io");

const { io } = require("socket.io-client");
const socket = io("http://103.163.139.230:3000");

const app = express();
const httpServer = createServer(app);
const mqtt = require('mqtt')

const SerialPort = require('serialport');
const Readline = SerialPort.parsers.Readline;
const port = new SerialPort('/dev/ttyACM0', 9600);
// const port = new SerialPort('COM3', 9600);
const parser = port.pipe(new Readline({ delimiter: '\r\n' }));

// const io = new Server(httpServer, { /* options */ });
const hostmqtt = "103.163.139.230";
const portmqtt = "1883";
const clientId = "mqtt_websocket_farmbot-agribot";
const mqtt_username = "farmbot-mqtt";
const mqtt_password = "farmbot0123";
const topic_to_sub = "farmbot/sendnpk";
const connectUrl = "mqtt://" + hostmqtt + ":" + portmqtt;


const client = mqtt.connect(connectUrl, {
    clientId,
    clean: true,
    connectTimeout: 4000,
    username: mqtt_username,
    password: mqtt_password,
    reconnectPeriod: 1000,
})

client.on('connect', () => {
    console.log('MQTT Conected');
    client.subscribe([topic_to_sub], () => {
        console.log("subscribe ke topic => " + topic_to_sub)
    })
})

client.on('message', (topic, payload) => {
    console.log('Pesan MQTT => ', topic, payload.toString())
})
// const websocket = require('ws')
// const wss = new websocket.Server({server: server})

app.use(express.json());
app.use(express.urlencoded({ extended: false }));

function delay(delayInms) {
    return new Promise(resolve => {
        setTimeout(() => {
            resolve(2);
        }, delayInms);
    });
}

function checkTime(min, max) {
    const d = new Date();
    let hour = d.getHours();
    if (hour > min && hour < max) {
        return true
    }
    return false;
}


const { database } = require('./mysqlConf');
const { exec } = require("child_process");
var currentTask
var currentCMD
var daftarAntrian = [];
var nomorAntrian = 0;
// 1 = Gerak stepper 
// 2 = 1 + Siram
// 3 = 1 + Ambil gambar
// 4 = 1 + Ambil NPK
// 5 = 1 + Siram NPK
// 6 = set Speed + Accel
var fs = require('fs');
const { finished } = require("stream");

function base64_encode(file) {
    // read binary data
    var bitmap = fs.readFileSync(file);
    // convert binary data to base64 encoded string
    return new Buffer(bitmap).toString('base64');
}

var fbFinished = true;

async function fotoBadan() {
    return new Promise((resolve, reject) => {
        if (checkTime(8, 16) && fbFinished) {
            fbFinished = false;
            const spawn = require('child_process').spawn;
            var scriptExecution = spawn('python3', ["./cambody.py", 'args']);
            var file
            scriptExecution.stdout.on('data',async (data) => {
                // console.log(data)
                var resp = new TextDecoder("utf-8").decode(data);
                // console.log(resp[1])
                var result = {}
                resp = resp.replace('\n', '');
                result['nama'] = resp
                result['file'] = base64_encode('./camera/' + resp);
                // resp = JSON.parse(resp);
                socket.emit("BodyImg", result);
                await delay(1800000);
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
        }else{
            resolve({skip : true})
        }
    })
}

setInterval(fotoBadan(), 10000);
// fotoBadan()

function ambilGambarPython() {
    return new Promise((resolve, reject) => {
        const spawn = require('child_process').spawn;
        var scriptExecution = spawn('python3', ["./cam.py", 'args']);
        var file
        scriptExecution.stdout.on('data', (data) => {
            // console.log(data)
            var resp = new TextDecoder("utf-8").decode(data);
            // console.log(resp[1])
            var result = {}
            resp = resp.replace('\n', '');
            result['nama'] = resp
            result['file'] = base64_encode('./camera/' + resp);
            // resp = JSON.parse(resp);
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
        scriptExecution.stderr.on('data', (data) => {
            var string = new TextDecoder("utf-8").decode(data);
            console.log('error', string);
            // As said before, convert the Uint8Array to a readable string.
            // console.log(data);
            // res.json({result: data});
            reject({ message: string });
        });

        scriptExecution.on('exit', (code) => {
            // console.log("Process quit with code : " + code);
            // resolve(file)
        });
        scriptExecution.stdin.write('start');
        scriptExecution.stdin.end();
    })
}


socket.on("cekrek", () => {
    console.log(socket.id); // x8WIv7-mJelg7on_ALbx
    console.log("Mengambil gambar");
    ambilGambarPython().then(resz => {
        console.log("Nama file : " + resz)
        socket.emit("cekrek", resz);
    }).catch(err => {
        console.error(err)
        socket.emit("error", err);
    })
});

app.get('/getGambar', (req, res) => {
    ambilGambarPython().then(resz => {
        console.log("Nama file : " + resz)
        res.send(resz);
    }).catch(err => {
        console.error(err)
    })
})

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

var fserial = false;
var tryN = 0;
var sendded = false;

var checkConnect = () => {
    tryN++;
    if (fserial) {
        console.log("Get Task");
        socket.emit("TaskStart", { id: 0, status: true, id: socket.id })
        // if(!sendded){
        //     sendded=true;
        // }
    } else {
        console.log("Mencoba kembali.....(" + tryN + ")")
        if (tryN == 10) {
            throw new Error("Tidak dapat terhubung dengan Arduino Mego 2560");
        } else {
            setTimeout(() => [
                checkConnect()
            ], 5000)
        }
    }
}

socket.on("connect", () => {
    console.log(socket.id); // x8WIv7-mJelg7on_ALbx
    console.log("Mencoba menghubungkan ke Arduino.....")
    checkConnect()
    // setTimeout(() => [
    // ], 5000)
});

socket.on("disconnect", () => {
    console.log(socket.id); // undefined
});

socket.on("taskCamera", (data) => {
    ambilGambarPython().then(namafile => {
        socket.emit("TaskDone", { task: data.cmd, task_id: data.task_id, status: true, id: socket.id })
    }).catch(err => console.error(err))
})

socket.on("setting", (data) => {
    currentCMD = 5;
    startCommand(currentCMD)
    port.write("m\n");
    port.write(data.max + "\n");
    port.write("a\n");
    port.write(data.accel + "\n");
    // endCommand()
    port.flush((err, results) => { })
})

socket.on("TaskEmpty", (data) => {
    socket.emit("TaskStart", { id: 0, status: true, id: socket.id })
    // setTimeout(() => [
    // ], 5000)
})

var reset = 0;

socket.on("initial", (data) => {
    console.log(data)
    // prosesTask(data)
    currentTask = data
    reset = data.r;
    socket.emit("TaskProc", { task_id: data["task_id"], status: true, id: socket.id })
    currentCMD = data.cmd
    console.log("Type Command : " + data.cmd)
    getLocation(data.target)
    // setTimeout(() => {
    //     socket.emit("TaskDone", { task: data, task_id: data["task_id"], status: true, id:socket.id })
    // }, 10000)
})
var nomorAntrian = 0;
var workingTaskLocation;
socket.on("locationPush", async (data) => {
    console.log("Location")
    console.log(data)

    workingTaskLocation = moveCommand(data[0]);
    port.write(startCommand(currentCMD));
})

var startTask = () => {
    port.write(workingTaskLocation);
}

socket.on("TaskComplete", (data) => {
    console.log("TaskComplete Seq => ", data);
    if (!data) {
        console.log("Retrying Failed Task")
    }
    socket.emit("TaskStart", { id: data["task_id"], status: true, id: socket.id })
    // setTimeout(() => {
    // }, 5000)
})

var tfile;
parser.on('data', (res) => {
    console.log("Response => " + res);
    if (res == "start") {
        fserial = true;
        console.log("Terhubung")
    } else {
        console.log(res + "(" + typeof res + ")");
    }
    port.flush(async (err, results) => {
        if (res.match("{")) {
            data = JSON.parse(res)
            console.log(data)
            if (data.status == "c") {
                startTask();
            } else if (data.status == "1") {
                if (data.cmd == 6) {
                    reset = 1;
                    console.log("Ambil nilai npk \nMengirim perintah mqtt id => \n");
                    console.log(currentTask["task_id"]);
                    console.log("Topik => " + topic_to_sub);
                    client.publish(topic_to_sub, currentTask["task_id"].toString(), { qos: 0, retain: false }, (error) => {
                        if (error) {
                            console.error(error)
                        }
                    });
                }

                if (data.cmd == 6) {
                    console.log("Delay")
                    await delay(30000);
                    console.log("Delay stop")
                }

                ambilGambarPython().then(async (file) => {
                    let t = "r\n" + reset + "\n"
                    port.write(t);
                    tfile = file;
                }).catch(err => console.error(err))
            } else if (data.status == "2") {
                socket.emit("TaskDone", { task: currentTask, task_id: currentTask["task_id"], status: true, id: socket.id, foto: tfile })

            }
        }
    });
});

var getLocation = (location) => {
    console.log("Target : " + location)
    socket.emit("getLocation", { location: location, id: socket.id })
}

var startCommand = (id) => {
    // console.log("WDADAWDWA" + id)
    let cmd = "c\n" + id + "\n"
    // port.write("c\n");
    // port.write(currentCMD + "\n");
    return cmd;
}

var writeCommand = (st, cmd, end) => {
    return st + cmd + end
}

var executeCommand = (cmd) => {
    console.log("Executing : " + cmd.replace(/\n/g, ":"))
    console.log('=====================')
    console.log(cmd)
    console.log('=====================')
    port.write(cmd);
}

var endCommand = () => {
    // port.write("e\n");
    // port.write("0" + "\n");
    return "e\n0\n";

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
    let cmd = "x\n" + data.x + "\ny\n" + data.y + "\nz\n" + 5 + "\nd\n5000\nz\n0\n";
    return cmd
}



httpServer.listen(3100, () => {
    console.log('Server running on port 3100');
})
