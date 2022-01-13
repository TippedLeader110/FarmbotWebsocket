const { Console } = require("console");
const express = require("express");
const { createServer } = require("http");
const { Server } = require("socket.io");

const app = express();
const httpServer = createServer(app);
const io = new Server(httpServer, { /* options */ });

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

io.on('connection', (socket)=>{
    
    socket.on('refreshTask', (data) => {
        console.log(data)
    })
    database.table('task').filter({status : {$ne: 2} ,date : { $lt: Date.now() }}).limit(1).getAll().then(data => {
        if(data.length>0){
            console.log('Start Task')
            io.emit('initial', data[0])       
        }else{

            setTimeout(()=>{
                console.log("Empty Task")
                io.emit('TaskEmpty', {data:0})       
            }, 5000)
        }
    }).catch(err => console.log(err))

    socket.on("TaskStart", (data) => {
        database.table('task').filter({status : {$ne: 2} ,date : { $lt: Date.now() }}).limit(1).getAll().then(data => {
            if(data.length>0){
                console.log('Next Task')
                io.emit('initial', data[0])       
            }else{
                console.log("Empty Task")
                io.emit('TaskEmpty', {data:0})       
            }
        }).catch(err => console.log(err))
    })

    socket.on("TaskProc", (data) => {
        console.log('Task Processed : ' + data['task_id'])
        database.table('task').filter({task_id: data['task_id']}).update({
            status : 1
        }).then(resUpdate => {
            // console.log(resUpdate)
        }).catch(err => {console.log(err)})
    })

    socket.on("TaskDone", (data) => {
        console.log('Task Done ID :' + data['task_id'])
        if(data['status']){
            nStatus = 2
        }else{
            nStatus = 3
        }

        database.table('task').filter({task_id: data['task_id']}).update({
            status : nStatus
        }).then(resUpdate => {
            // console.log(resUpdate)
            if(nStatus == 2){
                g = true;
            }else g = false
            io.emit('TaskComplete', {status:g})      
        }).catch(err => {console.log(err)})
    })
})


// wss.on('connection', function connection(ws) {
//     console.log("new lient connected")
    
//     ws.on('message', function incoming(data){
//         console.log("Client : %s", data)
//     })
// })


httpServer.listen(3100, () => {
    console.log('Server running on port 3100');
})