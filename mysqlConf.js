let mysql = require('mysqli');

let conn = new mysql({
    host: 'localhost',
    post: '3306',
    user: 'root',
    passwd: '',
    db: 'farmbot'
})

let db = conn.emit(false, '')

module.exports = {
    database : db
}