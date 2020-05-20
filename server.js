const mongo = require('mongodb').MongoClient;
const ioclient = require('socket.io').listen(4000).sockets;
const http = require('http');
const fs = require('fs');
const path = require('path');

const dburl = 'mongodb+srv://admin:admin@cluster0-pes0o.mongodb.net/test?retryWrites=true&w=majority"'

// connect to mongo
mongo.connect(dburl, (err, client) => {
	if(err) {
		throw err;
	}
	console.log('MongoDB connected.');
	var db = client.db('msg1');

	// connect to socket.io
	ioclient.on('connection', (socket) => {
		let chat = db.collection('chats');

		// funtion to send status
		sendStatus = (s) => {
			socket.emit('status', s);
		}

		// get chats from mongo collection
		chat.find().limit(100).sort({_id:1}).toArray( (err, res) => {
			if(err) {
				throw err;
			}

			// emit the messages
			socket.emit('output', res);
		});

		// handling input
		socket.on('input', (data) => {
			let name = data.name;
			let msg = data.msg;

			if(name == '' || msg== ''){
				sendStatus('Please enter a name and a message!');
			}
			else {
				// insert message
				chat.insert({name: name, msg: msg}, () => {
					ioclient.emit('output', [data]);

					sendStatus({
						msg: 'Message sent',
						clear: true
					});
				});
			}
		});

		// handle clear
		socket.on('clear', (data) => {
			chat.remove({}, () => {
				socket.emit('cleared');
			});
		});
	});
});

const server = http.createServer( (req, res) => {
	if(req.url == '/')
	{
		fs.readFile('index.html', (err, content) => {
			if(err) throw err;
			//res.writeHead(200, {'Content-Type': 'text/html'});
			res.end(content);
		})
	}
});

server.listen(5000, () => {
	console.log('Server running on port.');
});