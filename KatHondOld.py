from flask import Flask, jsonify, render_template, request, redirect, flash, session, url_for
from flask_socketio import SocketIO, emit
import threading
from datetime import datetime, time
import time as tm
import logging

########################################################################################
#   Initiatilisation
########################################################################################

# Configure logging
logging.basicConfig(level=logging.INFO,
                    format='%(asctime)s - %(levelname)s - %(message)s')

app = Flask(__name__)
socketio = SocketIO(app)  # Default async_mode is threading

# Needed for session management and flashing messages
app.secret_key = 'hond-kat-draak'

# Initialize values
values = {"cat": 0, "dog": 0, "niceCat": 0, "niceDog": 0, "timer": 0, "timer_status": "paused"}

def reset_values():
    logging.info("Reset thread started")
    while True:
        now = datetime.now().time()
        if now >= time(18, 0):  # Reset at 18:00
            logging.info("Resetting values at 18:00")
            values["cat"] = 0
            values["dog"] = 0
            values["niceCat"] = 0
            values["niceDog"] = 0
            tm.sleep(86400)  # Sleep for a day
        else:
            tm.sleep(60)  # Check every minute

# Start the reset thread
reset_thread = threading.Thread(target=reset_values)
reset_thread.daemon = True  # Make the thread a daemon thread
reset_thread.start()

########################################################################################
#   Timer functionality
########################################################################################

@socketio.on('set_timer')
def handle_set_timer(data):
    seconds = data.get('seconds', 0)
    values["timer"] = seconds
    values["timer_status"] = "paused"
    logging.info(f"Timer set to {seconds} seconds")
    emit('timer_update', {
         'timer': values["timer"], 'status': values["timer_status"]}, broadcast=True)

@socketio.on('get_timer')
def handle_get_timer():
    emit('timer_update', {
         'timer': values["timer"], 'status': values["timer_status"]})

@socketio.on('control_timer')
def handle_control_timer(data):
    action = data.get('action', '').lower()
    if action in ['play', 'pause', 'reset']:
        values["timer_status"] = action
        if action == 'reset':
            values["timer"] = 0
            values["timer_status"] = "reset"
        elif action == 'play':
            values["timer_status"] = "running"
        elif action == 'pause':
            values["timer_status"] = "paused"
        logging.info(f"Timer {action} action received")
        emit('timer_update', {
             'timer': values["timer"], 'status': values["timer_status"]}, broadcast=True)
    else:
        logging.error("Invalid timer control action received")

########################################################################################
#   Manage Cat and Dogs (now only angry, later also nice)
########################################################################################

@socketio.on('increment_count')
def handle_increment_count(data):
    animal = data['animal']
    if animal in ['cat', 'dog', 'niceCat', 'niceDog']:
        values[animal] += 1
        logging.info(f"{animal} count incremented")
        emit('counts_update', {key: values[key] for key in ['cat', 'dog', 'niceCat', 'niceDog']}, broadcast=True)

@socketio.on('reset_count')
def handle_reset_count(data):
    animal = data['animal']
    if animal in ['cat', 'dog', 'niceCat', 'niceDog']:
        values[animal] = 0
        logging.info(f"{animal} count reset")
        emit('counts_update', {key: values[key] for key in ['cat', 'dog', 'niceCat', 'niceDog']}, broadcast=True)

@socketio.on('request_status')
def handle_request_status():
    emit('counts_update', {key: values[key] for key in ['cat', 'dog', 'niceCat', 'niceDog']})
    emit('timer_update', {'timer': values["timer"], 'status': values["timer_status"]})

########################################################################################
#   Webserver
########################################################################################

@app.route('/display')
def display():
    return render_template('display.html')

@app.route('/values', methods=['GET'])
def get_values():
    return jsonify(values)

PASSWORD = "hond"

@app.route('/login', methods=['GET', 'POST'])
def login():
    if request.method == 'POST':
        password = request.form.get('password')
        if password == PASSWORD:
            session['logged_in'] = True
            return redirect(url_for('index'))
        else:
            flash('Incorrect password, please try again.', 'danger')
    return render_template('login.html')

@app.route('/')
def index():
    if not session.get('logged_in'):
        return redirect(url_for('login'))
    return render_template('overzicht.html')

if __name__ == '__main__':
    logging.info("Starting the Flask-SocketIO server")
    socketio.run(app, host='0.0.0.0', port=8080)
