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

var sounds = {
    ding: $('audio#ding').get(0),
    boing: $('audio#boing').get(0),
    punch: $('audio#punch').get(0)
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
    scene.add( camera );

    // create a point light
    var pointLight = new THREE.PointLight(0xFFFFFF);
    pointLight.position.x = 10;
    pointLight.position.y = 50;
    pointLight.position.z = 130;
    scene.add(pointLight);

    // Ball
    var radius = 1,
        segments = 16,
        rings = 16;
    var sphereMaterial = new THREE.MeshLambertMaterial(
    {
      color: 0xCC0000
    }
    );
    ballMesh = new THREE.Mesh(
        new THREE.SphereGeometry(radius, segments, rings),
        sphereMaterial
    );
    ballMesh.useQuaternion = true;
    scene.add(ballMesh);

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
        playSound('boing', volume);
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
    var sound = sounds[soundName];
    sound.volume = volume;
    sound.play();
}
