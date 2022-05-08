/**
 * @file Terrain.js - A simple 3D terrain model for WebGL
 * @author Ian Rudnick <itr2@illinois.edu>
 * @brief Starter code for CS 418 MP2 at the University of Illinois at
 * Urbana-Champaign.
 * 
 * Updated Spring 2021 for WebGL 2.0/GLSL 3.00 ES.
 * 
 * You'll need to implement the following functions:
 * setVertex(v, i) - convenient vertex access for 1-D array
 * getVertex(v, i) - convenient vertex access for 1-D array
 * generateTriangles() - generate a flat grid of triangles
 * shapeTerrain() - shape the grid into more interesting terrain
 * calculateNormals() - calculate normals after warping terrain
 * 
 * Good luck! Come to office hours if you get stuck!
 */

class Terrain {   
    /**
     * Initializes the members of the Terrain object.
     * @param {number} div Number of triangles along the x-axis and y-axis.
     * @param {number} minX Minimum X coordinate value.
     * @param {number} maxX Maximum X coordinate value.
     * @param {number} minY Minimum Y coordinate value.
     * @param {number} maxY Maximum Y coordinate value.
     */
    constructor(div, minX, maxX, minY, maxY) {
        this.div = div;
        this.minX = minX;
        this.minY = minY;
        this.maxX = maxX;
        this.maxY = maxY;
        
        // Allocate the vertex array
        this.positionData = [];
        // Allocate the normal array.
        this.normalData = [];
        // Allocate the triangle array.
        this.faceData = [];
        // Allocate an array for edges so we can draw a wireframe.
        this.edgeData = [];
        console.log("Terrain: Allocated buffers");
        
        this.generateTriangles();
        console.log("Terrain: Generated triangles");
        
        this.generateLines();
        console.log("Terrain: Generated lines");

        this.shapeTerrain();
        console.log("Terrain: Sculpted terrain");

        this.calculateNormals();
        console.log("Terrain: Generated normals");

        // You can use this function for debugging your buffers:
        // this.printBuffers();
    }
    

    //-------------------------------------------------------------------------
    // Vertex access and triangle generation - your code goes here!
    /**
     * Set the x,y,z coords of the ith vertex
     * @param {Object} v An array of length 3 holding the x,y,z coordinates.
     * @param {number} i The index of the vertex to set.
     */
    setVertex(v, i) {
        // MP2: Implement this function!
        this.positionData[i*3] = v[0];
        this.positionData[i*3+1] = v[1];
        this.positionData[i*3+2] = v[2];
    }
    
    /**
     * Returns the x,y,z coords of the ith vertex.
     * @param {Object} v An array of length 3 to hold the x,y,z coordinates.
     * @param {number} i The index of the vertex to get.
     */
    getVertex(v, i) {
        // MP2: Implement this function!
        v[0] = this.positionData[i*3];
        v[1] = this.positionData[i*3+1];
        v[2] = this.positionData[i*3+2];
    }

    
    /**
     * Returns the x,y,z coords of the ith per-vertex normal.
     * @param {Object} v An array of length 3 to hold the x,y,z coordinates.
     * @param {number} i The index of the normal to get.
     */
    getNormal(v, i) {
        // MP2: Implement this function!
        v[0] = this.normalData[i*3];
        v[1] = this.normalData[i*3+1];
        v[2] = this.normalData[i*3+2];
    }

    /**
     * Set the x,y,z coords of the ith per-vertex normal
     * @param {Object} v An array of length 3 holding the x,y,z coordinates.
     * @param {number} i The index of the normal to set.
     */
    setNormal(v, i) {
        // MP2: Implement this function!
        this.normalData[i*3] = v[0];
        this.normalData[i*3+1] = v[1];
        this.normalData[i*3+2] = v[2];
    }
    
    /**
     * Returns the max z coordinate in the terrain.
     */
    getMaxElevation() {
        var MaxZ = this.positionData[2];
        for(var i = 1; i < this.numVertices; i++){
            var Z = this.positionData[i*3+2];
            if(Z > MaxZ)  MaxZ = Z;
        }
        return MaxZ;
    }

    /**
     * Returns the min z coordinate in the terrain.
     */
     getMinElevation() {
        var MinZ = this.positionData[2];
        for(var i = 1; i < this.numVertices; i++){
            var Z = this.positionData[i*3+2];
            if(Z < MinZ)  MinZ = Z;
        }
        return MinZ;
    }

    /**
     * Generate a mesh using an indexed face representation. Specifically, 
     * it fills in an array called positionData which contains the x,y,z coordinates 
     * of each vertex and generates the triangles for the mesh by filling faceData.
     */    
    generateTriangles() {
        // MP2: Implement the rest of this function!

        var deltaX = (this.maxX - this.minX) / this.div;
        var deltaY = (this.maxY - this.minY) / this.div;
        
        // fill in positionData
        for(var i = 0; i <= this.div; i++)
            for(var j = 0; j <= this.div; j++){ 
                this.positionData.push(this.minX+deltaX*j);
                this.positionData.push(this.minY+deltaY*i);
                this.positionData.push(0);
            }
        // fill in faceData
        for(var i = 0; i < (this.div + 1) * this.div; i++){
            if((i + 1) % (this.div + 1) == 0)  continue;
            this.faceData.push(i);
            this.faceData.push(i+1);
            this.faceData.push(i+this.div+1);

            this.faceData.push(i+1);
            this.faceData.push(i+this.div+2);
            this.faceData.push(i+this.div+1);
        }
        
        // We'll need these to set up the WebGL buffers.
        this.numVertices = this.positionData.length / 3;
        this.numFaces = this.faceData.length / 3;
    }


    /**
     * Generate the terrain using the faulting method. To be specific,
     * it repeatedly, randomly generate an imaginary fault plane cutting through 
     * the terrain that partitions the vertices. On one side of the plane we will 
     * increase the height of each vertex by some amount Δ. On the other side, 
     * we decrease the vertex heights by Δ. After enough iterations, you should see 
     * something resembling a 3D terrain. 
     */
    shapeTerrain() {
        // MP2: Implement this function!
        // some constants
        var iter = 200, delta = 0.01, H = 0.01, R = this.maxX - this.minX;
        while(iter --){
            // random point
            var dx = this.maxX - this.minX, dy = this.maxY - this.minY;
            var p = glMatrix.vec3.fromValues(this.minX+Math.random()*dx, 
                                             this.minY+Math.random()*dy, 0);
            // normal vector
            var nxy = glMatrix.vec2.create();
            glMatrix.vec2.random(nxy);
            var n = glMatrix.vec3.fromValues(nxy[0], nxy[1], 0);
            
            for(var i = 0; i < this.numVertices; i++){
                var b = glMatrix.vec3.create();
                var res = glMatrix.vec3.create();
                this.getVertex(b, i);
                var r = Math.abs(n[0]*(b[0]-p[0])+n[1]*(b[1]-p[1])) / Math.sqrt(n[0]*n[0]+n[1]*n[1]);
                if(r >= R)  continue;

                // calculate f based on distance
                var f = delta * (1 - (r/R)**2) ** 2;
                glMatrix.vec3.subtract(res, b, p);
                res = glMatrix.vec3.dot(res, n);

                // lower on one half, raise the other half
                if(res < 0)  b[2] -= f;
                else  b[2] += f;
                this.setVertex(b, i);
            }
            delta /= Math.pow(2, H);
        }
    }


    /**
     * Generates per-vertex normals for the mesh. 
     */
    calculateNormals() {
        // MP2: Implement this function!
        // initialize the normals to be zeros
        for(var i = 0; i < this.numVertices * 3; i++)
            this.normalData.push(0);
        // calculate per-vertex normals
        for(var i = 0; i < this.numFaces; i++){
            var v1 = glMatrix.vec3.create();
            var v2 = glMatrix.vec3.create();
            var v3 = glMatrix.vec3.create();
            var n1 = this.faceData[i*3], n2 = this.faceData[i*3+1], n3 = this.faceData[i*3+2];
            this.getVertex(v1, n1);
            this.getVertex(v2, n2);
            this.getVertex(v3, n3);
            // compute the cross product
            glMatrix.vec3.subtract(v2, v2, v1);
            glMatrix.vec3.subtract(v3, v3, v1);
            glMatrix.vec3.cross(v1, v2, v3);

            // add to each per-vertex normal
            var nor = glMatrix.vec3.create();
            this.getNormal(nor, n1);
            glMatrix.vec3.add(nor, nor, v1);
            this.setNormal(nor, n1);
            this.getNormal(nor, n2);
            glMatrix.vec3.add(nor, nor, v1);
            this.setNormal(nor, n2);
            this.getNormal(nor, n3);
            glMatrix.vec3.add(nor, nor, v1);
            this.setNormal(nor, n3);
        }
        // normalize each normal
        for(var i = 0; i < this.numVertices; i++){
            var nor = glMatrix.vec3.create();
            this.getNormal(nor, i);
            glMatrix.vec3.normalize(nor, nor);
            this.setNormal(nor, i);
        }
    }


    //-------------------------------------------------------------------------
    // Setup code (run once)
    /**
     * Generates line data from the faces in faceData for wireframe rendering.
     */
    generateLines() {
        for (var f = 0; f < this.faceData.length/3; f++) {
            // Calculate index of the face
            var fid = f*3;
            this.edgeData.push(this.faceData[fid]);
            this.edgeData.push(this.faceData[fid+1]);
            
            this.edgeData.push(this.faceData[fid+1]);
            this.edgeData.push(this.faceData[fid+2]);
            
            this.edgeData.push(this.faceData[fid+2]);
            this.edgeData.push(this.faceData[fid]);
        }
    }


    /**
     * Sets up the WebGL buffers and vertex array object.
     * @param {object} shaderProgram The shader program to link the buffers to.
     */
    setupBuffers(shaderProgram) {
        // Create and bind the vertex array object.
        this.vertexArrayObject = gl.createVertexArray();
        gl.bindVertexArray(this.vertexArrayObject);

        // Create the position buffer and load it with the position data.
        this.vertexPositionBuffer = gl.createBuffer();
        gl.bindBuffer(gl.ARRAY_BUFFER, this.vertexPositionBuffer);      
        gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(this.positionData),
                      gl.STATIC_DRAW);
        this.vertexPositionBuffer.itemSize = 3;
        this.vertexPositionBuffer.numItems = this.numVertices;
        console.log("Loaded ", this.vertexPositionBuffer.numItems, " vertices.");

        // Link the position buffer to the attribute in the shader program.
        gl.vertexAttribPointer(shaderProgram.locations.vertexPosition,
                               this.vertexPositionBuffer.itemSize, gl.FLOAT, 
                               false, 0, 0);
        gl.enableVertexAttribArray(shaderProgram.locations.vertexPosition);
    
        // Specify normals to be able to do lighting calculations
        this.vertexNormalBuffer = gl.createBuffer();
        gl.bindBuffer(gl.ARRAY_BUFFER, this.vertexNormalBuffer);
        gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(this.normalData),
                      gl.STATIC_DRAW);
        this.vertexNormalBuffer.itemSize = 3;
        this.vertexNormalBuffer.numItems = this.numVertices;
        console.log("Loaded ", this.vertexNormalBuffer.numItems, " normals.");

        // Link the normal buffer to the attribute in the shader program.
        gl.vertexAttribPointer(shaderProgram.locations.vertexNormal,
                               this.vertexNormalBuffer.itemSize, gl.FLOAT, 
                               false, 0, 0);
        gl.enableVertexAttribArray(shaderProgram.locations.vertexNormal);
    
        // Set up the buffer of indices that tells WebGL which vertices are
        // part of which triangles.
        this.triangleIndexBuffer = gl.createBuffer();
        gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, this.triangleIndexBuffer);
        gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, new Uint32Array(this.faceData),
                      gl.STATIC_DRAW);
        this.triangleIndexBuffer.itemSize = 1;
        this.triangleIndexBuffer.numItems = this.faceData.length;
        console.log("Loaded ", this.triangleIndexBuffer.numItems, " triangles.");
    
        // Set up the index buffer for drawing edges.
        this.edgeIndexBuffer = gl.createBuffer();
        gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, this.edgeIndexBuffer);
        gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, new Uint32Array(this.edgeData),
                      gl.STATIC_DRAW);
        this.edgeIndexBuffer.itemSize = 1;
        this.edgeIndexBuffer.numItems = this.edgeData.length;
        
        // Unbind everything; we want to bind the correct element buffer and
        // VAO when we want to draw stuff
        gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, null);
        gl.bindBuffer(gl.ARRAY_BUFFER, null);
        gl.bindVertexArray(null);
    }
    

    //-------------------------------------------------------------------------
    // Rendering functions (run every frame in draw())
    /**
     * Renders the terrain to the screen as triangles.
     */
    drawTriangles() {
        gl.bindVertexArray(this.vertexArrayObject);
        gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, this.triangleIndexBuffer);
        gl.drawElements(gl.TRIANGLES, this.triangleIndexBuffer.numItems,
                        gl.UNSIGNED_INT,0);
    }
    

    /**
     * Renders the terrain to the screen as edges, wireframe style.
     */
    drawEdges() {
        gl.bindVertexArray(this.vertexArrayObject);
        gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, this.edgeIndexBuffer);
        gl.drawElements(gl.LINES, this.edgeIndexBuffer.numItems,
                        gl.UNSIGNED_INT,0);   
    }


    //-------------------------------------------------------------------------
    // Debugging
    /**
     * Prints the contents of the buffers to the console for debugging.
     */
    printBuffers() {
        for (var i = 0; i < this.numVertices; i++) {
            console.log("v ", this.positionData[i*3], " ", 
                              this.positionData[i*3 + 1], " ",
                              this.positionData[i*3 + 2], " ");
        }
        for (var i = 0; i < this.numVertices; i++) {
            console.log("n ", this.normalData[i*3], " ", 
                              this.normalData[i*3 + 1], " ",
                              this.normalData[i*3 + 2], " ");
        }
        for (var i = 0; i < this.numFaces; i++) {
            console.log("f ", this.faceData[i*3], " ", 
                              this.faceData[i*3 + 1], " ",
                              this.faceData[i*3 + 2], " ");
        }  
    }

} // class Terrain
