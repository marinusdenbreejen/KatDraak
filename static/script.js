document.addEventListener('DOMContentLoaded', function() {


    // Initialize a WebSocket connection
    const socket = io.connect(location.protocol + '//' + document.domain + ':' + location.port);
    socket.emit('request_status');
    
    // Request the current status from the server as soon as the connection is established
    socket.on('connect', function() {
        console.log('Connection established with the server');
        // Request the current status/values again to ensure the client is up-to-date
        socket.emit('request_status');
    });

   
    // Listen for custom events for cat, dog, niceCat, and niceDog count updates
    socket.on('counts_update', function(data) {
        console.log("Counts update received:", data);
        // Process the incoming counts data for all animals
        const { cat, dog, niceCat, niceDog } = data;

        // Update images and counts for all received data
        updateCountsAndImages(cat, dog, niceCat, niceDog);
    });

    // Increment and reset counts for animals
    safelyAddEventListener('incrementAngryCatButton', 'click', function() {
        socket.emit('increment_count', { animal: 'cat' });    
    });
    safelyAddEventListener('incrementAngryDogButton', 'click', function() {
        socket.emit('increment_count', { animal: 'dog' });
    });
    safelyAddEventListener('resetAngryCatButton', 'click', function() {
        socket.emit('reset_count', { animal: 'cat' });
    });
    safelyAddEventListener('resetAngryDogButton', 'click', function() {
        socket.emit('reset_count', { animal: 'dog' });
    });


    // Extend the increment and reset event listeners to include niceCat and niceDog
    safelyAddEventListener('incrementNiceCatButton', 'click', function() {
        socket.emit('increment_count', { animal: 'niceCat' });
    });
    safelyAddEventListener('incrementNiceDogButton', 'click', function() {
        socket.emit('increment_count', { animal: 'niceDog' });
    });
    safelyAddEventListener('resetNiceCatButton', 'click', function() {
        socket.emit('reset_count', { animal: 'niceCat' });
    });
    safelyAddEventListener('resetNiceDogButton', 'click', function() {
        socket.emit('reset_count', { animal: 'niceDog' });
    });




    // Timer control functionality
    safelyAddEventListener('setTimerButton', 'click', function() {
        const seconds = parseInt(document.getElementById('timerMinutesInput').value, 10);
        setTimer(seconds);
    });
    safelyAddEventListener('startTimerButton', 'click', function() {
        controlTimer('play');
    });
    safelyAddEventListener('pauseTimerButton', 'click', function() {
        controlTimer('pause');
    });
    safelyAddEventListener('resetTimerButton', 'click', function() {
        controlTimer('reset');
    });

    // Refactored function to update images based on new cat and dog counts
    // Adjusted function to handle new cat and dog counts, including niceCat and niceDog
    function updateCountsAndImages(catCount, dogCount, niceCatCount, niceDogCount) {
        // Ensure counts do not exceed 5 for each animal
        catCount = Math.min(catCount, 5);
        dogCount = Math.min(dogCount, 5);
        niceCatCount = Math.min(niceCatCount, 5);
        niceDogCount = Math.min(niceDogCount, 5);

        // Determine the images to use for each animal
        const catImage = catCount > 0 ? 'static/AngryCat.png' : 'static/Florentine.png';
        const dogImage = dogCount > 0 ? 'static/AngryDog.png' : 'static/Pieter.png';
        const niceCatImage = niceCatCount > 0 ? 'static/NiceCat.png' : 'static/Florentine.png'; // Assume you have a 'NiceCat.png'
        const niceDogImage = niceDogCount > 0 ? 'static/NiceDog.png' : 'static/Pieter.png'; // Assume you have a 'NiceDog.png'

        // Update images for each animal
        updateImages('angryCatsContainer', catImage, Math.max(catCount, 1));
        updateImages('angryDogsContainer', dogImage, Math.max(dogCount, 1));
        updateImages('niceCatsContainer', niceCatImage, Math.max(niceCatCount, 1)); // Assume you have a 'niceCatsContainer'
        updateImages('niceDogsContainer', niceDogImage, Math.max(niceDogCount, 1)); // Assume you have a 'niceDogsContainer'
    }

    function updateImages(containerId, imageUrl, count) {
        const container = document.getElementById(containerId);
        // Clear existing images only if necessary (moved inside the condition in fetchAndUpdateImages)
        container.innerHTML = '';
        for (let i = 0; i < count; i++) {
            let img = document.createElement('img');
            img.src = imageUrl;
            img.classList.add('item');
            container.appendChild(img);
        }
    }



    function safelyAddEventListener(selector, event, handler) {
        const element = document.getElementById(selector);
        if (element) {
            element.addEventListener(event, handler);
        }
    }

    // Function to set the timer through WebSocket
    function setTimer(seconds) {
        socket.emit('set_timer', { seconds: seconds });
    }

    // Function to control the timer through WebSocket
    function controlTimer(action) {
        socket.emit('control_timer', { action: action });
    }




});



    
