from flask import Flask, jsonify, render_template, request, redirect, flash, session, url_for
from flask_socketio import SocketIO, emit
import threading
from datetime import datetime, time as dt_time, timedelta
import time as tm
import logging
import socket
from dotenv import load_dotenv
import os
import json
from WakeUpIPAD import send_notification  # Import the send_notification function

# Load environment variables from .env file
load_dotenv()

########################################################################################
#   Initialization
########################################################################################

# Configure logging
logging.basicConfig(level=logging.INFO,
                    format='%(asctime)s - %(levelname)s - %(message)s')

app = Flask(__name__)
socketio = SocketIO(app, async_mode='gevent')  # Use Gevent instead of Eventlet

# Needed for session management and flashing messages
app.secret_key = os.getenv('FLASK_SESSION_KEY')

# Initialize values
values = {
    "angryCat": 0, 
    "angryDog": 0, 
    "niceCat": 0, 
    "niceDog": 0, 
    "kadoF": 0,
    "kadoP" : 0,
    "timer": 0, 
    "timer_status": "paused",
    "elapsed_seconds": 0,
    "start_time": None,
    "paused_duration": 0
}

# Load existing values from file if it exists
if os.path.exists('counters.json'):
    try:
        with open('counters.json', 'r') as f:
            if os.stat('counters.json').st_size != 0:  # Check if file is not empty
                values.update(json.load(f))
            else:
                print("counters.json is empty, starting with default values.")
    except json.JSONDecodeError:
        print("Error decoding JSON, starting with default values.")




#reset angry cat and dog values every day at 18:00
def reset_values():
    logging.info("Reset thread started")
    while True:
        now = datetime.now().time()
        if now >= dt_time(18, 0):  # Reset at 18:00
            logging.info("Resetting values at 18:00")
            values["angryCat"] = 0
            values["angryDog"] = 0
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

def update_elapsed_time():
    if values["timer_status"] == "running":
        now = datetime.now()
        if values["start_time"]:
            elapsed = now - values["start_time"]
            values["elapsed_seconds"] = round(values["paused_duration"] + elapsed.total_seconds())
            logging.info(f"Elapsed seconds: {values['elapsed_seconds']}")
            if values["elapsed_seconds"] >= (values["timer"] * 60):  # timer value is in minutes
                values["timer_status"] = "completed"
                values["elapsed_seconds"] = (values["timer"] * 60)
                logging.info("Timer completed")        
        socketio.emit('timer_update', {
            'timer': values["timer"], 
            'status': values["timer_status"], 
            'elapsed_seconds': values["elapsed_seconds"]
        }, broadcast=True)

@socketio.on('set_timer')
def handle_set_timer(data):
    seconds = data.get('seconds', 0)
    values["timer"] = seconds
    values["timer_status"] = "paused"
    values["elapsed_seconds"] = 0
    values["start_time"] = None
    values["paused_duration"] = 0
    logging.info(f"Timer set to {seconds} minutes")
    emit('timer_update', {
        'timer': values["timer"], 
        'status': values["timer_status"],
        'elapsed_seconds': values["elapsed_seconds"]
    }, broadcast=True)

@socketio.on('get_timer')
def handle_get_timer():
    emit('timer_update', {
        'timer': values["timer"], 
        'status': values["timer_status"],
        'elapsed_seconds': values["elapsed_seconds"]
    })

@socketio.on('control_timer')
def handle_control_timer(data):
    action = data.get('action', '').lower()
    if action in ['play', 'pause', 'reset']:
        if action == 'reset':
            values["timer_status"] = "paused"
            values["timer"] = 0
            values["elapsed_seconds"] = 0
            values["start_time"] = None
            values["paused_duration"] = 0
            logging.info("Timer reset")
        elif action == 'play':
            values["timer_status"] = "running"
            if values["start_time"] is None:
                values["start_time"] = datetime.now()
            logging.info("Timer started")
        elif action == 'pause':
            values["timer_status"] = "paused"
            if values["start_time"]:
                now = datetime.now()
                elapsed = now - values["start_time"]
                values["paused_duration"] += elapsed.total_seconds()
                values["start_time"] = None
            logging.info("Timer paused")
        socketio.emit('timer_update', {
            'timer': values["timer"], 
            'status': values["timer_status"], 
            'elapsed_seconds': values["elapsed_seconds"]
        }, broadcast=True)
    else:
        logging.error("Invalid timer control action received")

# Background thread to update elapsed time every second when the timer is running
def elapsed_time_updater():
    while True:
        if values["timer_status"] == "running":
            update_elapsed_time()
        tm.sleep(1)

elapsed_time_thread = threading.Thread(target=elapsed_time_updater)
elapsed_time_thread.daemon = True
elapsed_time_thread.start()

########################################################################################
#   Manage Cat and Dogs (both angry and nice) and iPadButton (for remote wakeup)
########################################################################################

@socketio.on('set_counter')
def handle_set_counter(data):
    name = data.get('name')
    value = data.get('value')
    if session.get('logged_in'):
        logging.info(f"{name} count set to {value}")
        if name in values and isinstance(value, int):
            values[name] = value
            with open('counters.json', 'w') as f:
                json.dump(values, f)
            emit('counts_update', {key: values[key] for key in values}, broadcast=True)

@socketio.on('request_status')
def handle_request_status():
    emit('counts_update', {key: values[key] for key in values})
    emit('timer_update', {
        'timer': values["timer"], 
        'status': values["timer_status"], 
        'elapsed_seconds': values["elapsed_seconds"]
    })



@socketio.on('ipad_action')
def handle_ipad_action():
    logging.info("iPad aanzetten button pressed")
    send_notification()
    tm.sleep(3)
    emit('refresh_page', broadcast=True)

@socketio.on('refresh_all_clients')
def handle_refresh_all_clients():
    logging.info("Sending refresh command to all clients")
    emit('refresh_page', broadcast=True)

########################################################################################
#   Webserver
########################################################################################

@app.route('/display')
def display():
    return render_template('display.html')

@app.route('/timer')
def timer():
    return render_template('timeTimer.html')

@app.route('/values', methods=['GET'])
def get_values():
    return jsonify(values)

PASSWORD = os.getenv('PASSWORD')

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
    # Get the host IP address
    hostname = socket.gethostname()
    host_ip = socket.gethostbyname(hostname)
    logging.info(f"Host IP address: {host_ip}")
    logging.info("Starting the Flask-SocketIO server")
    socketio.run(app, host='0.0.0.0', port=8080)
