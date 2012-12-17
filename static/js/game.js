var SCREEN_HEIGHT = window.innerHeight,
    SCREEN_WIDTH = window.innerWidth,
    DISPLAY_HEIGHT = 2 * 70 * Math.tan(45 / 2 * (Math.PI / 180)),
    DISPLAY_WIDTH = DISPLAY_HEIGHT * (SCREEN_WIDTH / SCREEN_HEIGHT),
    RINK_HEIGHT = 40,
    RINK_WIDTH = 80,
    MAX_POWER = 100;

// Variables for world and scene
var world,
    timeStep = 1/60,
    camera,
    scene,
    renderer,
    loader,
    tween;

// Goal
var goalBody,
    goalMass = 50,
    goalGraphic;

// Ball
var ball,
    ballMass = 0.5,
    ballLinearDamping = 0.01,
    ballMesh,
    velocityVector = new CANNON.Vec3(),
    SPEED_MULTIPLIER = 1.5; // A scalar used to multiply the velocityVector.

// Objects
var bodies = [],
    visuals = [];

// Info about mouse-events is registered here for use in the render loop.
var clickInfo = {
    x: 0,
    y: 0,
    userHasClicked: false
};

// Variables for keeping track of the game
var scored = false,
    shotCount = 0;

var sounds = (new Audio()).canPlayType('audio/wav')
    ? {
        ding: 'static/sounds/ding.wav',
        boing: 'static/sounds/boing.wav',
        punch: 'static/sounds/punch.wav',
        applause: 'static/sounds/applause.wav'
    }
    : {
        ding: 'static/sounds/ding.mp3',
        boing: 'static/sounds/boing.mp3',
        punch: 'static/sounds/punch.mp3',
        applause: 'static/sounds/applause.mp3'
    };


function initGame() {
    initThree();
    initCannon();
    addBorders();
    addGoal();
    initCameraAnimation();
}

function initCameraAnimation() {
    var position = { x : 100, z: 30 };
    var target = { x : 0, z: 70 };
    tween = new TWEEN.Tween(position).to(target, 5500);

    tween.onUpdate(function() {
        camera.position.x = position.x;
        camera.position.z = position.z;
        camera.lookAt(scene.position);
        renderer.render(scene, camera);
    });

    tween.onComplete(function () {
        initEvents();
    });

    tween.delay = 2500;
    tween.easing(TWEEN.Easing.Exponential.InOut);
    tween.start();
}

function initCannon() {
    // World
    world = new CANNON.World();
    world.gravity.set(0, 0, -10);
    world.broadphase = new CANNON.NaiveBroadphase();
    world.solver.iterations = 10;

    // Ball
    var sphereShape = new CANNON.Sphere(0.9);
    ball = new CANNON.RigidBody(ballMass, sphereShape);
    ball.position.set(0, 0, 1);
    ball.linearDamping = ballLinearDamping;
    world.add(ball);

    // Ground
    var normal = new CANNON.Vec3(0, 0, 1);
    var groundShape = new CANNON.Plane(normal);
    var groundBody = new CANNON.RigidBody(0, groundShape);
    world.add(groundBody);

    initCannonEvents();
}

function initThree() {
    // Scene
    scene = new THREE.Scene();

    loader = new THREE.JSONLoader();

    // Camera
    camera = new THREE.PerspectiveCamera(45, SCREEN_WIDTH / SCREEN_HEIGHT, 1, 1000);
    camera.position.z = 30;
    scene.add(camera);

    // Point light
    var pointLight = new THREE.PointLight(0xFFFFFF);
    pointLight.position.x = 10;
    pointLight.position.y = 50;
    pointLight.position.z = 130;
    scene.add(pointLight);

    // Plane and graphics for the rink
    var planeMaterial = new THREE.MeshBasicMaterial({
        map: THREE.ImageUtils.loadTexture('static/images/rink@2x.png')
    });

    var plane = new THREE.Mesh(
        new THREE.PlaneGeometry(80, 40),
        planeMaterial
    );
    scene.add(plane);

    // Ball with graphics
    loader.load('static/js/ball.js', function (geometry, materials) {
        var material = new THREE.MeshFaceMaterial(materials);
        ballMesh = new THREE.Mesh(geometry, material);
        ballMesh.scale.x = ballMesh.scale.y = ballMesh.scale.z = 0.8;
        ballMesh.useQuaternion = true;
        scene.add(ballMesh);
    });

    // Renderer
    renderer = new THREE.CanvasRenderer();
    renderer.setSize(window.innerWidth, window.innerHeight);

    document.body.appendChild(renderer.domElement);
    initEvents($(renderer.domElement));
}

function addBorders() {
    var borderMass = 100;
    var borderColor = 0xaaaaaa;
    var borderWidth = 0.5;
    var borders = {
        top: {
            dimensions: new CANNON.Vec3(RINK_WIDTH / 2, borderWidth, 2),
            position: new CANNON.Vec3(0, RINK_HEIGHT / 2 + borderWidth, 2)
        },
        right: {
            dimensions: new CANNON.Vec3(borderWidth, RINK_HEIGHT / 2, 2),
            position: new CANNON.Vec3(RINK_WIDTH / 2 + borderWidth, 0, 2)
        },
        bottom: {
            dimensions: new CANNON.Vec3(RINK_WIDTH / 2, borderWidth, 2),
            position: new CANNON.Vec3(0, -RINK_HEIGHT / 2 - borderWidth, 2)
        },
        left: {
            dimensions: new CANNON.Vec3(borderWidth, RINK_HEIGHT / 2, 2),
            position: new CANNON.Vec3(-RINK_WIDTH / 2 - borderWidth, 0, 2)
        }
    };

    for (var i in borders) {
        if (borders.hasOwnProperty(i)) {
            var border = borders[i];
            addBlock(border.dimensions, borderMass, border.position, borderColor, false);
        }
    }
}

function addGoal() {
    var sides = {
        left: {
            dimensions: new CANNON.Vec3(1.85, 0.1, 2.25),
            offset: new CANNON.Vec3(0, -3.10, 0)
        },
        right: {
            dimensions: new CANNON.Vec3(1.85, 0.1, 2.25),
            offset: new CANNON.Vec3(0, 3.10, 0)
        },
        back: {
            dimensions: new CANNON.Vec3(0.1, 3.00, 2.25),
            offset: new CANNON.Vec3(1.85, 0, 0)
        }
    };

    var goalShape = new CANNON.Compound();

    for (var i in sides) {
        if (sides.hasOwnProperty(i)) {
            var side = sides[i];
            var shape = new CANNON.Box(side.dimensions);
            goalShape.addChild(shape, side.offset);
        }
    }

    goalBody = new CANNON.RigidBody(goalMass, goalShape);
    goalBody.position.set(30.8, 0, 2.1);
    world.add(goalBody);

    // Graphics
    loader.load('static/js/goal.js', function (geometry, materials) {
        var material = new THREE.MeshFaceMaterial(materials);
        goalGraphic = new THREE.Mesh(geometry, material);
        goalGraphic.scale.x = goalGraphic.scale.y = goalGraphic.scale.z = 0.77;
        goalGraphic.position.set(29.3, 0, -0.5);
        goalGraphic.rotation.y = Math.PI;
        goalGraphic.rotation.x = Math.PI / 2;
        scene.add(goalGraphic);
    });
}

// Creates a block with given properties and adds it to cannon.js world and
// three.js scene.
// If updatePhysics is true also adds the block body and its visuals to arrays
// holding the cannon.js and three.js objects.
function addBlock(dimensions, mass, position, color, updatePhysics) {
    if (typeof updatePhysics === 'undefined') {
        updatePhysics = true;
    }

    // Cannon
    var shape = new CANNON.Box(dimensions);
    var block = new CANNON.RigidBody(mass, shape);
    block.position.set(position.x, position.y, position.z);
    world.add(block);
    if (updatePhysics) {
        bodies.push(block);
    }

    // Scene
    var geometry = new THREE.CubeGeometry(2 * dimensions.x, 2 * dimensions.y, 2 * dimensions.z);
    var material = new THREE.MeshLambertMaterial( { color: color, wireframe: false } );
    var blockMesh = new THREE.Mesh(geometry, material);
    blockMesh.useQuaternion = true;
    block.position.copy(blockMesh.position);
    block.quaternion.copy(blockMesh.quaternion);
    scene.add(blockMesh);
    if (updatePhysics) {
        visuals.push(blockMesh);
    }
}

function animate() {
    requestAnimationFrame(animate);
    updatePhysics();
    render();
}

function updatePhysics() {
    // If mouse has been clicked, move the ball in the direction of the click.
    if (clickInfo.userHasClicked) {
        moveBall();
        shotCount += 1;
        clickInfo.userHasClicked = false;
    }

    // Step the physics world
    world.step(timeStep);

    if (!scored) {
        if (isGoal()) {
            scored = true;
            var args = saveScore();
            showVictoryScreen.apply(null, args);
        }
    }

    // Copy coordinates from Cannon.js to Three.js
    for (var i = 0, max = bodies.length; i < max; i++) {
        bodies[i].position.copy(visuals[i].position);
        bodies[i].quaternion.copy(visuals[i].quaternion);
    }

    ball.position.copy(ballMesh.position);
    ball.quaternion.copy(ballMesh.quaternion);
}

function render() {
    TWEEN.update();
    renderer.render(scene, camera);
}

// Gives the ball velocity according to where user has clicked on the screen.
function moveBall() {
    var target = new CANNON.Vec3(
        getWorldX(clickInfo.x),
        getWorldY(clickInfo.y),
        1
    );
    velocityVector = target.vsub(ball.position);
    var power = Math.min(velocityVector.norm(), MAX_POWER);
    velocityVector.normalize();
    velocityVector = velocityVector.mult(power).mult(SPEED_MULTIPLIER);
    ball.velocity.set(velocityVector.x, velocityVector.y, 0);

    if (clickInfo.userHasClicked) {
        playSound('punch', power / MAX_POWER);
    }
}

function initEvents() {
    $('canvas').on('click', function (event) {
        if (scored)
            return;

        if (Math.abs(ball.velocity.x) < 1.0 && Math.abs(ball.velocity.y) < 1.0) {
            clickInfo.x = event.clientX;
            clickInfo.y = event.clientY;
            clickInfo.userHasClicked = true;
        }
    });
}

function initCannonEvents() {
    ball.addEventListener('collide', function (event) {
        var volume = ball.velocity.norm() / (MAX_POWER * SPEED_MULTIPLIER);
        var sound = (event.with === goalBody) ? 'ding' : 'boing';
        playSound(sound, volume);
    });
}

// Translates mouse coordinate X into cannon world coordinates.
function getWorldX(mouseX) {
    var normalizedX = (mouseX / SCREEN_WIDTH) * 2 - 1;
    var worldX = normalizedX * DISPLAY_WIDTH / 2;
    return worldX;
}

// Translates mouse coordinate Y into cannon world coordinates.
function getWorldY(mouseY) {
    var normalizedY = -(mouseY / SCREEN_HEIGHT) * 2 + 1;
    var worldY = normalizedY * DISPLAY_HEIGHT / 2;
    return worldY;
}

// Plays given sound at given volume. Volume should be in range [0, 1].
function playSound(soundName, volume) {
    var sound = new Audio(sounds[soundName]);
    sound.volume = volume;
    sound.play();
}

// Returns true if the ball is in goal.
function isGoal() {
    if (ball.position.x > 29.5 && ball.position.x < 32.65) {
        if (ball.position.y > -3.5 && ball.position.y < 3.5) {
            return true;
        }
    }
    return false;
}

function showVictoryScreen(isBest, previousBest) {
    playSound('applause', 1);
    $('.shot-count').text(shotCount);
    $('.goal-text').removeClass('hidden');

    if (!isBest)
        $('.is-best').addClass('hidden');
    else if (!previousBest)
        $('.previous-best').addClass('hidden');
    else
        $('.previous-best-count').text(previousBest);

    setTimeout(function () {
        $('.goal-text').addClass('hidden');
    }, 3000);
    setTimeout(function () {
        $('.victory-box').fadeIn();
    }, 4000);
}

function saveScore() {
    var scores = JSON.parse(localStorage.getItem('highscores')) || [];
    var index = +$('body').data('level') - 1;
    var isBest = false;
    var previousBest = null;
    if (scores[index] == null || scores[index] > shotCount) {
        previousBest = scores[index];
        scores[index] = shotCount;
        isBest = true;
    }
    localStorage.setItem('highscores', JSON.stringify(scores));
    return [isBest, previousBest];
}
