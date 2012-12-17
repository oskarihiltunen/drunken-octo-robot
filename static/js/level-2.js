function initLevel() {
    addBlocks();
    ball.position.set(-25, 0, 1);
}

function addBlocks() {
    var colors = [
        0xccaaff,
        0xaaccff,
        0xccffaa,
        0xffaacc,
        0xffccaa,
        0xaaffcc,
    ];

    var dimensions = [
        [1, 10, 2],
        [6, 1, 2],
        [10, 3.5, 2],
        [1, 7, 2],
        [1, 9, 2],
        [15, 1, 2],
        [1, 9, 2],
        [2, 1, 2],
        [1, 4, 2],
    ];

    var positions = [
        [-10, 0],
        [-17, 9],
        [-14, -15.5],
        [2, -8.5],
        [2, 11],
        [18, -6],
        [8, 4],
        [-7, -9],
        [29, 16],
    ];

    for (var i = 0; i < positions.length; i += 1) {
        var color = colors[i % colors.length];
        var dimension = dimensions[i % dimensions.length];
        var position = positions[i];

        addBlock(
            new CANNON.Vec3(dimension[0], dimension[1], dimension[2]),
            20,
            new CANNON.Vec3(position[0], position[1], dimension[2]),
            color
        );
    }
}
