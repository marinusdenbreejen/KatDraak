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
        updateCountsAndImages(data);
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
    function updateCountsAndImages(data) {
        const FlorentineImage = 'static/Florentine.png';
        const PieterImage = 'static/Pieter.png';
        const catImage = 'static/AngryCat.png';
        const dogImage = 'static/AngryDog.png';
        const niceCatImage = 'static/NiceCat.png';
        const niceDogImage = 'static/NiceDog.png';
        const kadoImage = 'static/present_with_white_background.png';
    
        // Update images for each animal and kado
        updateImages('angryCatsContainer', FlorentineImage, catImage, data.angryCat, "angryCat");
        updateImages('angryDogsContainer', PieterImage, dogImage, data.angryDog, "angryDog");
       
        updateImages('niceCatsContainer', FlorentineImage, niceCatImage, data.niceCat, "niceCat");
        updateImages('niceDogsContainer', PieterImage, niceDogImage, data.niceDog, "niceDog");
    
        updateImages('kadoPContainer', PieterImage, kadoImage, data.kadoP, "kadoP");
        updateImages('kadoFContainer', FlorentineImage, kadoImage, data.kadoF, "kadoF");
    }
    
/*
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
*/

/*
function updateImages(containerId, startImageUrl, imageUrl, count,animal) {
    const container = document.getElementById(containerId);
    container.innerHTML = ''; // Clear existing images
    let img = document.createElement('img');
    img.src = startImageUrl;
    img.classList.add('item');
    container.appendChild(img);

    // Ensure there are always 5 images
    for (let i = 0; i < 5; i++) {
        let img = document.createElement('img');
        img.src = imageUrl;
        img.classList.add('item');
        img.style.opacity = i < count ? '1' : '0.2'; // Fully visible if within count, otherwise semi-transparent
        container.appendChild(img);
    }
}
*/


    function updateImages(containerId, startImageUrl, imageUrl, count, animal) {
        const container = document.getElementById(containerId);
        if (!container) {
            return; // Exit the function if the container does not exist
        }

        container.innerHTML = ''; // Clear existing images
        
        // Create and append the start image
        let startImg = document.createElement('img');
        startImg.src = startImageUrl;
        startImg.classList.add('item');
        startImg.addEventListener('click', function() {
            setAnimalCount(animal, 0); // Set count to 0 on start image click
        });
        container.appendChild(startImg);

        // Create and append the animal images
        for (let i = 0; i < 5; i++) {
            let img = document.createElement('img');
            img.src = imageUrl;
            img.classList.add('item');
            img.style.opacity = i < count ? '1' : '0.2'; // Fully visible if within count, otherwise semi-transparent
            img.addEventListener('click', function() {
                setAnimalCount(animal, i + 1); // Set count to i+1 on image click
            });
            container.appendChild(img);
        }
    }

    function setAnimalCount(animal, count) {
        socket.emit('set_counter', { name: animal, value: count });
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

    // Add event listener for the new iPad button
    safelyAddEventListener('ipadButton', 'click', function() {
        socket.emit('ipad_action');
    });

    // Refresh button functionality
    safelyAddEventListener('refreshButton', 'click', function() {
        socket.emit('refresh_all_clients');
    });

    // Listen for refresh event from the server
    socket.on('refresh_page', function() {
        location.reload();
    });




});



    
