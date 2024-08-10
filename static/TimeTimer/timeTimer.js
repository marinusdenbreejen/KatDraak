document.addEventListener('DOMContentLoaded', function() {
    const canvas = document.getElementById('timerCanvas');
    if (!canvas) return;

    const alarmSound = new Audio('/static/TimeTimer/alarm.mp3');
    const ctx = canvas.getContext('2d');
    const radius = canvas.height / 2;
    ctx.translate(radius, radius);

    let totalSeconds = 60;
    let timerStatus = 'paused';
    let pastSeconds = 0;
    let interval;

    // Initial interval setup to start the timer immediately on page load
    setInterval(() => {
        if (timerStatus === 'running') {
            pastSeconds++;    
        }
        drawClock(pastSeconds, totalSeconds);
    }, 1000);
    


    // Initialize a WebSocket connection
    const socket = io.connect(location.protocol + '//' + document.domain + ':' + location.port);
    socket.emit('request_status');

    alarmSound.addEventListener('canplaythrough', event => {
        console.log('Audio is ready to play');
    });
    
    alarmSound.addEventListener('error', event => {
        console.error('Error loading the audio file');
    });

    
// Request the current timer status on load
    socket.emit('get_timer');

    // Listen for timer updates from the server
    socket.on('timer_update', function(data) {
        console.log("Timer update received:", data);
        // Update your timer based on received data
        timerStatus = data.status;
        totalSeconds = data.timer * 60;
        if (timerStatus == "paused") {
            pastSeconds = data.elapsed_seconds; // always update when paused
        }

        if (Math.abs(data.elapsed_seconds - pastSeconds) > 2) {
            pastSeconds = data.elapsed_seconds;
        }
        drawClock(pastSeconds, totalSeconds); 
    });


  

    
    //////////////////////////////////////////////////////////////////////////////////
    // Draw Clock
    /////////////////////////////////////////////////////////////////////////////////

    function drawClockPositions(numberOfPositions, totalSeconds) {
  
        const timeIntervals = Array.from({length: numberOfPositions}, (_, i) => totalSeconds - (totalSeconds / numberOfPositions) * i);
        ctx.font = '40px Arial';
        ctx.fillStyle = 'black';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        for (let num = 0; num < numberOfPositions; num++) {
            const angle = (-num * 2 * Math.PI / numberOfPositions);
            ctx.save();
            ctx.rotate(angle);
            ctx.translate(0, -radius * 0.85);
            ctx.rotate(-angle);
    
            // Ensure time intervals are calculated correctly
            const intervalSeconds = Math.floor(timeIntervals[num]);
            const minutes = Math.floor(intervalSeconds / 60);
            const seconds = intervalSeconds % 60;
    
            let displayText;
            if (seconds === 0) {
                displayText = `${minutes}m`;
            } else if (totalSeconds > 60) {
                displayText = `${minutes}:${seconds < 10 ? '0' : ''}${seconds}`;
            } else {
                displayText = `${intervalSeconds}s`;
            }
    
            ctx.fillText(displayText, 0, 0);
            ctx.restore();
        }
    }
    
    

    function drawLines(totalLines, numberMajorLines) {
        // Calculate the interval at which to draw major lines based on the total number of lines and the number of major lines
        const majorLineInterval = totalLines / numberMajorLines;
    
        for (let i = 0; i < totalLines; i++) {
            ctx.save();
            // Calculate the rotation based on the total number of lines
            ctx.rotate(i * (Math.PI * 2) / totalLines);
            ctx.beginPath();
            ctx.moveTo(0, -radius * 0.75);
            if (i % majorLineInterval === 0) {
                // Draw major line
                ctx.lineTo(0, -radius * 0.65);
                ctx.strokeStyle = 'black';
                ctx.lineWidth = 2;
            } else {
                // Draw minor line
                ctx.lineTo(0, -radius * 0.7);
                ctx.strokeStyle = 'grey';
                ctx.lineWidth = 1;
            }
            ctx.stroke();
            ctx.restore();
        }
    }
    

    function drawTimeLeft() {
        const minutes = Math.floor((totalSeconds - pastSeconds) / 60);
        const seconds = (totalSeconds - pastSeconds) % 60;
        const timeString = `${minutes}:${seconds < 10 ? '0' : ''}${seconds}`;
    
        ctx.font = '60px Arial'; // Set the font size and face
        ctx.fillStyle = 'black'; // Set the text color
        ctx.textAlign = 'right'; // Align text to the right
        ctx.textBaseline = 'top'; // Align text to the top
        ctx.fillText(timeString, radius - 10, -radius + 10); // Position text in the top right corner
    }


    function drawClock(pastSeconds, totalSeconds) {
        console.log("Start Draw Clock");
        ctx.fillStyle = '#f5f5f5';
        ctx.fillRect(-radius, -radius, canvas.width, canvas.height);

        const endAngle = -(Math.PI / 2) - (Math.PI * 2 * (pastSeconds / totalSeconds));

        // Set shadow properties
        ctx.shadowColor = 'rgba(11, 20, 26, 0.24)';
        ctx.shadowBlur = 15;
        ctx.shadowOffsetX = 0;
        ctx.shadowOffsetY = 12;


        // Clockface
        ctx.beginPath();
        ctx.arc(0, 0, radius * 0.75, 0, Math.PI * 2);
        ctx.fillStyle = 'white';
        ctx.fill();

        // Thin purple line around the clock
        ctx.lineWidth = 1; // Set the thickness of the line
        ctx.strokeStyle = 'gray'; // Material purple, the color of the line
        ctx.stroke(); // Apply the stroke to the current path

        // Reset shadow for other elements
        ctx.shadowColor = 'rgba(0, 0, 0, 0)';
        ctx.shadowBlur = 0;
        ctx.shadowOffsetX = 0;
        ctx.shadowOffsetY = 0;

        ctx.beginPath();
        ctx.moveTo(0, 0);
        ctx.arc(0, 0, radius * 0.75, -Math.PI / 2, endAngle, true);
        ctx.closePath();
        ctx.fillStyle = 'red';
        ctx.fill();



        const { minorTicks, majorTicks } = calculateTicks(totalSeconds);

        // Now, call the drawing functions with the calculated values
        drawClockPositions(majorTicks,totalSeconds);  // Pass the number of major positions
        drawLines(minorTicks, majorTicks); // Pass both minor and major ticks
        drawTimeLeft();
        console.log("End Draw Clock");
    }
    
    
    function calculateTicks(totalSeconds) {
        const maxMinorTicks = 100;
        const maxMajorTicks = 15;
        const minMinorTicks = 30;
        const minMajorTicks = 5;
    
        // Calculate the number of minor ticks, adhering to constraints
        let minorTicks = Math.min(maxMinorTicks, Math.max(minMinorTicks, totalSeconds));
        if (minorTicks > totalSeconds) {
            minorTicks = totalSeconds;
        }
    
        // Determine the number of major ticks
        let majorTicks;
        if (totalSeconds <= 60) {
            majorTicks = Math.max(minMajorTicks, Math.floor(totalSeconds / 10));
        } else if (totalSeconds <= 120) {
            majorTicks = 12; // Standard clock with 12 major ticks
        } else if (totalSeconds <= 300) { // Up to 5 minutes, use minute intervals
            majorTicks = Math.floor(totalSeconds / 60);
        } else {
            // For longer durations, adjust major ticks based on constraints
            majorTicks = Math.min(maxMajorTicks, Math.floor(minorTicks / 10));
            if (majorTicks < minMajorTicks) {
                majorTicks = minMajorTicks;
            }
        }

        if (totalSeconds == 60) { majorTicks = 12; minorTicks = 60;}
        if (totalSeconds % 10 ==0) { majorTicks = 10; minorTicks = 60;}
        if (totalSeconds % 12 ==0) majorTicks = 12
        if (totalSeconds % 60 ==0) majorTicks = (totalSeconds / 60) 

        if (totalSeconds == 60)  { majorTicks = 12; minorTicks = 60;}
        if (totalSeconds == 120) { majorTicks = 12; minorTicks = 60;}
        if (totalSeconds == 180) { majorTicks = 12; minorTicks = 60;}
        if (totalSeconds == 1200) { majorTicks = 12; minorTicks = 100;}
        if (totalSeconds == 1500) { majorTicks = 5; minorTicks = 100;}
        if (totalSeconds == 2700) { majorTicks = 15; minorTicks = 60;}
        if (totalSeconds == 3600) { majorTicks = 12; minorTicks = 60;}


        // Ensure majorTicks does not exceed maxMajorTicks
        majorTicks = Math.min(majorTicks, maxMajorTicks);
    
        return { minorTicks, majorTicks };
    }

    
   
});
