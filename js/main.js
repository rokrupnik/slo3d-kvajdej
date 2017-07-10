clock = new THREE.Clock();
// Tiles that sit next to a tile of a greater scale need to have their edges morphed to avoid
// edges. Mark which edges need morphing using flags. These flags are then read by the vertex
// shader which performs the actual morph
var Edge = {
    NONE: 0,
    TOP: 1,
    LEFT: 2,
    BOTTOM: 4,
    RIGHT: 8
};

function init(heights, dataWidth, dataDepth) {

    World.initializeScene();

    World.initializeRenderer();

    Controls.initializeCamera(
        World.center.x,//World.offset.x + (0.43 * World.size.x),//0,//
        World.center.y + 200,//World.offset.y + (0.33 * World.size.y),//0,//
        3*World.size.y/4
    );

    Controls.initializeControls();

    //

    Texture.loader.load(
        Texture.generateUrl([World.offset.x,World.offset.y], [(World.offset.x + World.size.x),(World.offset.y+World.size.y)], [2048, 2048]),
        function (ortoFotoTexture) {
            var triangles = (dataWidth - 1) * (dataDepth - 1) * 2;
            var geometry = new THREE.BufferGeometry();
            var indices = new Uint32Array( triangles * 3 );
            for ( var i = 0; i < indices.length; i ++ ) {
                indices[ i ] = i;
            }
            var positions = new Float32Array( triangles * 3 * 3 );
            var normals = new Int16Array( triangles * 3 * 3 );
            var uvs = new Float32Array( triangles * 3 * 2 );

            var pA = new THREE.Vector3();
            var pB = new THREE.Vector3();
            var pC = new THREE.Vector3();
            var pD = new THREE.Vector3();
            var cb = new THREE.Vector3();
            var ab = new THREE.Vector3();
            var db = new THREE.Vector3();

            var widthScale = World.size.x / dataWidth;
            var depthScale = World.size.y / dataDepth;
            var heightScale = 0.1;

            var start = performance.now();
            for (var d = 0, ipnc = 0, iuv = 0; d < dataDepth - 1; d++) {
                for (var w = 0; w < dataWidth - 1; w++) {
                    var ih = d * dataDepth + w;

                    var ax = World.offset.x + w                                * widthScale;
                    var ay = World.offset.y + (dataDepth - d)                  * depthScale;
                    var az =               (heights[ ih ])                  ;//* heightScale;
                    var bx = World.offset.x + w                                * widthScale;
                    var by = World.offset.y + (dataDepth - (d + 1))            * depthScale;
                    var bz = (heights[ ih + dataWidth ])                    ;//* heightScale;
                    var cx = World.offset.x + (w + 1)                          * widthScale;
                    var cy = World.offset.y + (dataDepth - d)                  * depthScale;
                    var cz =               (heights[ ih + 1 ])              ;//* heightScale;
                    var dx = World.offset.x + (w + 1)                          * widthScale;
                    var dy = World.offset.y + (dataDepth - (d + 1))            * depthScale;
                    var dz =               (heights[ ih + dataWidth + 1 ])  ;//* heightScale;

                    // First triangle - mind the triangles orientation
                    positions[ ipnc ]     = ax;
                    positions[ ipnc + 1 ] = ay;
                    positions[ ipnc + 2 ] = az;
                    positions[ ipnc + 3 ] = bx;
                    positions[ ipnc + 4 ] = by;
                    positions[ ipnc + 5 ] = bz;
                    positions[ ipnc + 6 ] = cx;
                    positions[ ipnc + 7 ] = cy;
                    positions[ ipnc + 8 ] = cz;
                    // Second triangle
                    positions[ ipnc + 9 ]  = bx;
                    positions[ ipnc + 10 ] = by;
                    positions[ ipnc + 11 ] = bz;
                    positions[ ipnc + 12 ] = dx;
                    positions[ ipnc + 13 ] = dy;
                    positions[ ipnc + 14 ] = dz;
                    positions[ ipnc + 15 ] = cx;
                    positions[ ipnc + 16 ] = cy;
                    positions[ ipnc + 17 ] = cz;

                    // flat face normals
                    pA.set( ax, ay, az );
                    pB.set( bx, by, bz );
                    pC.set( cx, cy, cz );
                    pD.set( dx, dy, dz );
                    // First triangle
                    cb.subVectors( pC, pB );
                    ab.subVectors( pA, pB );
                    ab.cross( cb );
                    ab.normalize();
                    var nx0 = ab.x;
                    var ny0 = ab.y;
                    var nz0 = ab.z;
                    normals[ ipnc ]     = nx0 * 32767;
                    normals[ ipnc + 1 ] = ny0 * 32767;
                    normals[ ipnc + 2 ] = nz0 * 32767;
                    normals[ ipnc + 3 ] = nx0 * 32767;
                    normals[ ipnc + 4 ] = ny0 * 32767;
                    normals[ ipnc + 5 ] = nz0 * 32767;
                    normals[ ipnc + 6 ] = nx0 * 32767;
                    normals[ ipnc + 7 ] = ny0 * 32767;
                    normals[ ipnc + 8 ] = nz0 * 32767;
                    // Second triangle
                    db.subVectors( pD, pB );
                    cb.subVectors( pC, pB );
                    cb.cross( db );
                    cb.normalize();
                    var nx1 = cb.x;
                    var ny1 = cb.y;
                    var nz1 = cb.z;
                    normals[ ipnc + 9 ]  = nx1 * 32767;
                    normals[ ipnc + 10 ] = ny1 * 32767;
                    normals[ ipnc + 11 ] = nz1 * 32767;
                    normals[ ipnc + 12 ] = nx1 * 32767;
                    normals[ ipnc + 13 ] = ny1 * 32767;
                    normals[ ipnc + 14 ] = nz1 * 32767;
                    normals[ ipnc + 15 ] = nx1 * 32767;
                    normals[ ipnc + 16 ] = ny1 * 32767;
                    normals[ ipnc + 17 ] = nz1 * 32767;

                    // uvs
                    // First triangle
                    uvs[ iuv ]     = w  / dataWidth;
                    uvs[ iuv + 1 ] = d / dataDepth;
                    uvs[ iuv + 2 ] = w  / dataWidth;
                    uvs[ iuv + 3 ] = (d + 1) / dataDepth;
                    uvs[ iuv + 4 ] = (w + 1)  / dataWidth;
                    uvs[ iuv + 5 ] = d / dataDepth;
                    // Second triangle
                    uvs[ iuv + 6 ]  = (w + 1)  / dataWidth;
                    uvs[ iuv + 7 ]  = d / dataDepth;
                    uvs[ iuv + 8 ]  = w  / dataWidth;
                    uvs[ iuv + 9 ]  = (d + 1) / dataDepth;
                    uvs[ iuv + 10 ] = (w + 1)  / dataWidth;
                    uvs[ iuv + 11 ] = (d + 1) / dataDepth;

                    ipnc += 18;
                    iuv += 12;
                }
            }

            console.log('basic mesh', performance.now() - start);

            geometry.setIndex( new THREE.BufferAttribute( indices, 1 ) );
            geometry.addAttribute( 'position', new THREE.BufferAttribute( positions, 3 ) );
            geometry.addAttribute( 'normal', new THREE.BufferAttribute( normals, 3, true ) );
            geometry.addAttribute( 'uv', new THREE.BufferAttribute( uvs, 2 ) );

            //geometry.computeBoundingSphere();

            // axes

            // var axes = new THREE.AxisHelper( World.size.y );
            // scene.add( axes );

            // material

            ortoFotoTexture.flipY = false;
            var material = new THREE.ShaderMaterial({
                    uniforms: {
                        uOrtoFoto: { value: ortoFotoTexture }
                    },
                    vertexShader: document.getElementById( 'vertexShader'   ).textContent,
                    fragmentShader: document.getElementById( 'fragmentShader' ).textContent,
                    //wireframe: true
            });

            // mesh

            var baseMesh = new THREE.Mesh( geometry, material );
            World.scene.add( baseMesh );

            // axes

            // var axes = new THREE.AxisHelper( World.size.y );
            // World.scene.add( axes );

            container.innerHTML = "";

            container.appendChild( World.renderer.domElement );

            // stats = new Stats();
            // container.appendChild( stats.dom );

            //

            window.addEventListener( 'resize', onWindowResize, false );

            Controls.signalRequestEnd();

            animate();
        }
    );
}

function onWindowResize() {
    Controls.camera.aspect = window.innerWidth / window.innerHeight;
    Controls.camera.updateProjectionMatrix();

    World.renderer.setSize( window.innerWidth, window.innerHeight );
}

//

function animate() {
    requestAnimationFrame( animate );

    render();
    // stats.update();
}

function render() {
    Controls.controls.update( clock.getDelta() );

    World.renderer.render( World.scene, Controls.camera );
}
