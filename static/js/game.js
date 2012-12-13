var SCREEN_HEIGHT = window.innerHeight,
    SCREEN_WIDTH = window.innerWidth,
    DISPLAY_HEIGHT = 2 * 70 * Math.tan(45 / 2 * (Math.PI / 180)),
    DISPLAY_WIDTH = DISPLAY_HEIGHT * (SCREEN_WIDTH / SCREEN_HEIGHT),
    ARENA_HEIGHT = DISPLAY_HEIGHT * 0.7,
    ARENA_WIDHT = DISPLAY_WIDTH * 0.4,
    MAX_POWER = 100;

// Variables for world and scene
var world,
    timeStep = 1/60,
    camera,
    scene,
    renderer;

// Goal
var goal,
    goalMesh,
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

var sounds = (new Audio()).canPlayType('audio/wav')
    ? {
        ding: 'static/sounds/ding.wav',
        boing: 'static/sounds/boing.wav',
        punch: 'static/sounds/punch.wav'
    }
    : {
        ding: 'static/sounds/ding.mp3',
        boing: 'static/sounds/boing.mp3',
        punch: 'static/sounds/punch.mp3'
    };

function initGame() {
    initThree();
    initCannon();
    addBorders();
}

function initCannon() {
    // World
    world = new CANNON.World();
    world.gravity.set(0, 0, -10);
    world.broadphase = new CANNON.NaiveBroadphase();
    world.solver.iterations = 10;

    // Goal
    var goalShape = new CANNON.Box(new CANNON.Vec3(3, 6.5, 4.5));
    goal = new CANNON.RigidBody(100, goalShape);
    goal.position.set(ARENA_WIDHT * 0.6, 0, 4);
    world.add(goal);

    // Ball
    var sphereShape = new CANNON.Sphere(1);
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

    // Camera
    camera = new THREE.PerspectiveCamera(45, SCREEN_WIDTH / SCREEN_HEIGHT, 1, 100);
    camera.position.z = 70;
    scene.add(camera);

    // create a point light
    var pointLight = new THREE.PointLight(0xFFFFFF);
    pointLight.position.x = 10;
    pointLight.position.y = 50;
    pointLight.position.z = 130;
    scene.add(pointLight);

    // create a plane
    var planeMaterial = new THREE.MeshBasicMaterial({
        map: THREE.ImageUtils.loadTexture('static/images/rink@2x.png')
    });

    var plane = new THREE.Mesh(
        new THREE.PlaneGeometry(80, 40),
        planeMaterial
    );
    scene.add(plane);

    // Visualization of the cannon goal. Just to see where the goal is.
    var geometry = new THREE.CubeGeometry(6, 13, 9);
    var material = new THREE.MeshLambertMaterial( { color: 0xCC0000, wireframe: false } );
    goalMesh = new THREE.Mesh(geometry, material);
    goalMesh.useQuaternion = true;
    scene.add(goalMesh);


    var loader = new THREE.JSONLoader();

    // Goal
    loader.load('static/js/goal.js', function (geometry, materials) {
        var material = new THREE.MeshFaceMaterial(materials);
        goalGraphic = new THREE.Mesh(geometry, material);
        goalGraphic.scale.x = goalGraphic.scale.y = goalGraphic.scale.z = 1.5;
        goalGraphic.position.set(ARENA_WIDHT * 0.6, 0, -2);
        goalGraphic.rotation.y = Math.PI;
        goalGraphic.rotation.x = Math.PI / 2;
        scene.add(goalGraphic);
    });


    // Ball with graphics
    loader.load('static/js/ball.js', function (geometry, materials) {
        var material = new THREE.MeshFaceMaterial(materials);
        ballMesh = new THREE.Mesh(geometry, material);
        ballMesh.scale.x = ballMesh.scale.y = ballMesh.scale.z = 1;
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
    var borders = {
        top: {
            dimensions: new CANNON.Vec3(ARENA_WIDHT, 1, 2),
            position: new CANNON.Vec3(0, ARENA_HEIGHT / 2 + 1, 2)
        },
        right: {
            dimensions: new CANNON.Vec3(1, ARENA_HEIGHT / 2, 2),
            position: new CANNON.Vec3(ARENA_WIDHT - 1, 0, 2)
        },
        bottom: {
            dimensions: new CANNON.Vec3(ARENA_WIDHT, 1, 2),
            position: new CANNON.Vec3(0, -ARENA_HEIGHT / 2 - 1, 2)
        },
        left: {
            dimensions: new CANNON.Vec3(1, ARENA_HEIGHT / 2, 2),
            position: new CANNON.Vec3(-ARENA_WIDHT + 1, 0, 2)
        }
    };

    for (var i in borders) {
        if (borders.hasOwnProperty(i)) {
            var border = borders[i];
            addBlock(border.dimensions, borderMass, border.position, borderColor);
        }
    }
}

// Creates a block with given properties and and adds it to cannon.js world,
// three.js scene and to arrays holding the cannon.js and three.js objects.
function addBlock(dimensions, mass, position, color) {
    // Cannon
    var shape = new CANNON.Box(dimensions);
    var block = new CANNON.RigidBody(mass, shape);
    block.position.set(position.x, position.y, position.z);
    world.add(block);
    bodies.push(block);

    // Scene
    var geometry = new THREE.CubeGeometry(2 * dimensions.x, 2 * dimensions.y, 2 * dimensions.z);
    var material = new THREE.MeshLambertMaterial( { color: color, wireframe: false } );
    var blockMesh = new THREE.Mesh(geometry, material);
    blockMesh.useQuaternion = true;
    scene.add(blockMesh);
    visuals.push(blockMesh);
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
        clickInfo.userHasClicked = false;
    }

    // Step the physics world
    world.step(timeStep);

    // Copy coordinates from Cannon.js to Three.js
    for (var i = 0, max = bodies.length; i < max; i++) {
        bodies[i].position.copy(visuals[i].position);
        bodies[i].quaternion.copy(visuals[i].quaternion);
    }

    ball.position.copy(ballMesh.position);
    ball.quaternion.copy(ballMesh.quaternion);

    goal.position.copy(goalMesh.position);
    goal.quaternion.copy(goalMesh.quaternion);
}

function render() {
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

function initEvents($canvas) {
    $canvas.on('click', function (event) {
        if (Math.abs(ball.velocity.x) < 0.5 && Math.abs(ball.velocity.y) < 0.5) {
            clickInfo.x = event.clientX;
            clickInfo.y = event.clientY;
            clickInfo.userHasClicked = true;
        }
    });
}

function initCannonEvents() {
    ball.addEventListener('collide', function (event) {
        var volume = ball.velocity.norm() / (MAX_POWER * SPEED_MULTIPLIER);
        var sound = (event.with === goal) ? 'ding' : 'boing';
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
