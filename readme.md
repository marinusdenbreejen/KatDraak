
# KatHond Project

## Overview

The KatHond project is a web-based application for managing and displaying a counter for cats and dogs. It includes functionality for starting, pausing, and resetting a timer, as well as incrementing and resetting counts for cats and dogs (both angry and nice variants). The application is built using Flask and Flask-SocketIO and is designed to run on a Raspberry Pi. 

## Features

- Real-time updates using WebSockets.
- Timer functionality with start, pause, and reset options.
- Counter for angry and nice cats and dogs.
- Full page refresh functionality for all connected clients.
- Secure handling of secrets using environment variables.

## Installation

### Prerequisites

- Python 3.x
- pip (Python package installer)
- A Raspberry Pi or any other system with Python installed

### Step-by-Step Installation

1. **Clone the Repository:**

   ```sh
   git clone <repository-url>
   cd KatHond
   ```

2. **Create a Virtual Environment:**

   ```sh
   python3 -m venv venv
   source venv/bin/activate
   ```

3. **Install Dependencies:**

   ```sh
   pip install -r requirements.txt
   ```

4. **Set Up Environment Variables:**

   Create a `.env` file in the root directory of your project to store your secrets.

   ```sh
   # .env file
   SECRET_KEY=your_secret_key
   DATABASE_PASSWORD=your_database_password
   ```

   Make sure your `.env` file is added to `.gitignore`.

5. **Create `.gitignore` File:**

   ```sh
   # .gitignore
   .env
   ```

6. **Run the Application:**

   ```sh
   python KatHond.py
   ```

7. **Access the Application:**

   Open your web browser and go to `http://<your-raspberry-pi-ip>:8080` to access the application.

## Project Structure

```
KatHond/
│
├── static/
│   ├── Favicon.png
│   ├── style.css
│   ├── script.js
│   └── TimeTimer/
│       ├── timeTimer.js
│       └── alarm.mp3
│
├── templates/
│   ├── display.html
│   ├── login.html
│   └── overzicht.html
│
├── KatHond.py
├── requirements.txt
└── README.md
```

## How It Works

### Backend

- **Flask**: A micro web framework used for routing and handling HTTP requests.
- **Flask-SocketIO**: Enables real-time communication between the server and clients using WebSockets.
- **Threading**: Used for handling periodic tasks like resetting counters and updating elapsed time.

### Frontend

- **HTML/CSS**: For structuring and styling the web pages.
- **JavaScript**: For handling client-side functionality and WebSocket communication.

### Timer Functionality

- The timer can be started, paused, and reset using WebSocket events.
- The server tracks the elapsed time and sends updates to clients every second.

### Counters

- Counters for angry and nice cats and dogs can be incremented or reset.
- The current counts are updated in real-time and displayed to all connected clients.

### Full Page Refresh

- A button in the interface allows sending a full page refresh command to all connected clients.

## Security

- Secrets are handled using environment variables and the `python-dotenv` package.
- Ensure the `.env` file is not checked into version control by adding it to `.gitignore`.

## Contributing

Feel free to open issues or submit pull requests with improvements. Make sure to follow the code style and include tests where appropriate.

## License

This project is licensed under the MIT License. See the LICENSE file for more details.
