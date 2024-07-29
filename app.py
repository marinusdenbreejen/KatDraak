from flask import Flask, jsonify
from flask_socketio import SocketIO, emit

app = Flask(__name__)
app.config['SECRET_KEY'] = 'secret!'
socketio = SocketIO(app, async_mode='gevent')

counter = {'count': 0}

@app.route('/')
def hello_world():
    return jsonify(message='Hello World', counter=counter['count'])

@socketio.on('increment')
def handle_increment():
    counter['count'] += 1
    emit('counter_update', {'counter': counter['count']}, broadcast=True)

if __name__ == '__main__':
    socketio.run(app, debug=True)
