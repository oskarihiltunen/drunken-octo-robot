function initLevel() {
    addBlocks();
    ball.position.set(-25, 0, 1);
}


function addBlocks() {
    var blue = 0x0000ff;
    var green = 0x00ff00;
    var purple = 0xff00ff;

    var dimensions = new CANNON.Vec3(2, 2, 2);
    var position = new CANNON.Vec3(-4, -7, 2);
    addBlock(dimensions, 20, position, green);
    position = new CANNON.Vec3(10, 8, 2);
    addBlock(dimensions, 20, position, blue);
    position = new CANNON.Vec3(-13, -2, 2);
    addBlock(dimensions, 20, position, purple);

    dimensions = new CANNON.Vec3(1, 1, 1);
    position = new CANNON.Vec3(-2, 9, 1);
    addBlock(dimensions, 10, position, purple);
    position = new CANNON.Vec3(13, 17, 1);
    addBlock(dimensions, 10, position, purple);

    dimensions = new CANNON.Vec3(1, 3, 1);
    position = new CANNON.Vec3(-4, 17, 1);
    addBlock(dimensions, 10, position, green);
    position = new CANNON.Vec3(17, -5, 1);
    addBlock(dimensions, 10, position, blue);
}
