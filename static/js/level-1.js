function initLevel() {
    addBlocks();
    ball.position.set(-25, 0, 1);
}

function addBlocks() {
    var colors = [
        0xccaaff,
        //0xaaccff,
        0xccffaa,
        0xffaacc,
        0xffccaa,
        0xaaffcc,
    ];

    var dimensions = [
        //[2, 1, 2],
        //[2, 1, 2],
        [12, 1, 2],
        [1, 10, 2],
        [1, 5, 2],
        [18, 1, 2],
        [1, 1, 2],
        [1, 1, 2],
        [1, 1, 2],
        [1, 1, 2],
        [4, 8, 2],
        [1, 5, 2],
        [11, 1, 2],
    ];

    var positions = [
        // [-38, 3],
        // [-38, -18],
        [-28, 7],
        [-9, 9],
        [-32, -7],
        [-15, -13],
        [-9, -3],
        [-9, -6.5],
        [-9, -10],
        [27, 0],
        [14, -9],
        [25, -15],
        [12.5, 12],
    ];

    var rotations = [
        0, 0, 0, 0, 0.5, 0.5, 0.5
    ];

    var masses = [
        20,
        20,
        20,
        20,
        1,
        1,
        1,
        1,
        20,
        20,
        20
    ];

    for (var i = 0; i < positions.length; i += 1) {
        var color = colors[i % colors.length];
        var dimension = dimensions[i % dimensions.length];
        var position = positions[i];
        var rotation = rotations[i % rotations.length];
        var mass = masses[i % masses.length];

        addBlock(
            new CANNON.Vec3(dimension[0], dimension[1], dimension[2]),
            mass,
            new CANNON.Vec3(position[0], position[1], dimension[2]),
            color
            //rotation
        );
    }
}
