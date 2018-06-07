/**
 * @fileoverview Terrain - A simple 3D terrain using WebGL
 * @author Troy Houchin
 */

/** Class implementing 3D terrain. */
class Terrain{   
/**
 * Initialize members of a Terrain object
 * @param {number} div Number of triangles along x axis and y axis
 * @param {number} minX Minimum X coordinate value
 * @param {number} maxX Maximum X coordinate value
 * @param {number} minY Minimum Y coordinate value
 * @param {number} maxY Maximum Y coordinate value
 */
    constructor(div,minX,maxX,minY,maxY){
        this.div = div;
        this.minX=minX;
        this.minY=minY;
        this.maxX=maxX;
        this.maxY=maxY;
        this.smoothing = 6;
        
        this.index = 0;
        this.normal = []
        
        // Allocate vertex array
        this.vBuffer = [];
        // Allocate triangle array
        this.fBuffer = [];
        // Allocate normal array
        this.nBuffer = [];
        // Allocate array for edges so we can draw wireframe
        this.eBuffer = [];
        
        this.cTerrain = [];
        
        console.log("Terrain: Allocated buffers");
        
        this.generateTriangles();
        
        console.log("Terrain: Generated triangles");
        
        this.generateLines();
        console.log("Terrain: Generated lines");
        
        this.addColorToTerrain(this.vBuffer,this.cTerrain, this.vBuffer.numItems);
        
        //this.printBuffers();
        
        // Get extension for 4 byte integer indices for drwElements
        var ext = gl.getExtension('OES_element_index_uint');
        if (ext ==null){
            alert("OES_element_index_uint is unsupported by your browser and terrain generation cannot proceed.");
        }
    }
    
    /**
    * Set the x,y,z coords of a vertex at location(i,j)
    * @param {Object} v an an array of length 3 holding x,y,z coordinates
    * @param {number} i the ith row of vertices
    * @param {number} j the jth column of vertices
    */
    setVertex(v,i,j)
    {
        //Your code here
        var vid = 3 * (i * (this.div + 1) + j);
        this.vBuffer[vid] = v[0];
        this.vBuffer[vid + 1] = v[1];
        this.vBuffer[vid + 2] = v[2];
    }
    
    /**
    * Return the x,y,z coordinates of a vertex at location (i,j)
    * @param {Object} v an an array of length 3 holding x,y,z coordinates
    * @param {number} i the ith row of vertices
    * @param {number} j the jth column of vertices
    */
    getVertex(v,i,j)
    {
        //Your code here
        var vid = 3 * (i * (this.div + 1) + j);
        v[0] = this.vBuffer[vid];
        v[1] = this.vBuffer[vid + 1];
        v[2] = this.vBuffer[vid + 2];
    }
    
    /**
    * Send the buffer objects to WebGL for rendering 
    */
    loadBuffers()
    {
        // Specify the vertex coordinates
        this.VertexPositionBuffer = gl.createBuffer();
        gl.bindBuffer(gl.ARRAY_BUFFER, this.VertexPositionBuffer);      
        gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(this.vBuffer), gl.STATIC_DRAW);
        this.VertexPositionBuffer.itemSize = 3;
        this.VertexPositionBuffer.numItems = this.numVertices;
        console.log("Loaded ", this.VertexPositionBuffer.numItems, " vertices");
    
        // Specify normals to be able to do lighting calculations
        this.VertexNormalBuffer = gl.createBuffer();
        gl.bindBuffer(gl.ARRAY_BUFFER, this.VertexNormalBuffer);
        gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(this.nBuffer),
                  gl.STATIC_DRAW);
        this.VertexNormalBuffer.itemSize = 3;
        this.VertexNormalBuffer.numItems = this.numVertices;
        console.log("Loaded ", this.VertexNormalBuffer.numItems, " normals");
    
        // Specify faces of the terrain 
        this.IndexTriBuffer = gl.createBuffer();
        gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, this.IndexTriBuffer);
        gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, new Uint32Array(this.fBuffer),
                  gl.STATIC_DRAW);
        this.IndexTriBuffer.itemSize = 1;
        this.IndexTriBuffer.numItems = this.fBuffer.length;
        console.log("Loaded ", this.IndexTriBuffer.numItems, " triangles");
        
        // Specify the color of each vertex based off of cTerrain
        this.vertexColorBuffer = gl.createBuffer();
        gl.bindBuffer(gl.ARRAY_BUFFER, this.vertexColorBuffer);
        gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(this.cTerrain), gl.STATIC_DRAW);
        this.vertexColorBuffer.itemSize = 3;
        this.vertexColorBuffer.numItems = this.VertexPositionBuffer.numItems;
    
        //Setup Edges  
        this.IndexEdgeBuffer = gl.createBuffer();
        gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, this.IndexEdgeBuffer);
        gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, new Uint32Array(this.eBuffer),
                  gl.STATIC_DRAW);
        this.IndexEdgeBuffer.itemSize = 1;
        this.IndexEdgeBuffer.numItems = this.eBuffer.length;
        
        console.log("triangulatedPlane: loadBuffers");
    }
    
    /**
    * Render the triangles 
    */
    drawTriangles(){
        gl.polygonOffset(0,0);
        gl.bindBuffer(gl.ARRAY_BUFFER, this.VertexPositionBuffer);
        gl.vertexAttribPointer(shaderProgram.vertexPositionAttribute, this.VertexPositionBuffer.itemSize, 
                         gl.FLOAT, false, 0, 0);

        // Bind normal buffer
        gl.bindBuffer(gl.ARRAY_BUFFER, this.VertexNormalBuffer);
        gl.vertexAttribPointer(shaderProgram.vertexNormalAttribute, 
                           this.VertexNormalBuffer.itemSize,
                           gl.FLOAT, false, 0, 0); 
        
        // Bind Color Buffer
        gl.bindBuffer(gl.ARRAY_BUFFER, this.vertexColorBuffer);
        gl.vertexAttribPointer(shaderProgram.vertexColorAttribute, this.vertexColorBuffer.itemSize, gl.FLOAT, false, 0, 0);
    
        //Draw 
        gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, this.IndexTriBuffer);
        gl.drawElements(gl.TRIANGLES, this.IndexTriBuffer.numItems, gl.UNSIGNED_INT,0);
    }
    
    /**
    * Render the triangle edges wireframe style 
    */
    drawEdges(){
        gl.polygonOffset(1,1);
    
        gl.bindBuffer(gl.ARRAY_BUFFER, this.VertexPositionBuffer);
        gl.vertexAttribPointer(shaderProgram.vertexPositionAttribute, this.VertexPositionBuffer.itemSize, 
                         gl.FLOAT, false, 0, 0);

        // Bind normal buffer
        gl.bindBuffer(gl.ARRAY_BUFFER, this.VertexNormalBuffer);
        gl.vertexAttribPointer(shaderProgram.vertexNormalAttribute, 
                           this.VertexNormalBuffer.itemSize,
                           gl.FLOAT, false, 0, 0);
        
        // Bind Color Buffer
        gl.bindBuffer(gl.ARRAY_BUFFER, this.VertexColorBuffer);
        gl.vertexAttribPointer(shaderProgram.vertexColorAttribute, this.VertexColorBuffer.itemSize, gl.FLOAT, false, 0, 0);
    
        //Draw 
        gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, this.IndexEdgeBuffer);
        gl.drawElements(gl.LINES, this.IndexEdgeBuffer.numItems, gl.UNSIGNED_INT,0);   
    }

    getIndexFromXY(x, y, gridSize) {
            var x = (x + 1)*gridSize/2;
            var y = (y + 1)*gridSize/2;
            this.index = (y*(gridSize+1) + x)*3 + 2;
    }

    getNormal(x, y, gridSize, vert) {
        var n = gridSize/2
        
        this.getIndexFromXY(x + 1/n, y + 1/n, gridSize);
        var vi1 = this.index;
        this.getIndexFromXY(x, y, gridSize);
        var vi2 = this.index;
        var v1 = vec3.fromValues(1/n, 1/n , vert[vi1]
                         - vert[vi2]);
        
        this.getIndexFromXY(x - 1/n, y + 1/n, gridSize);
        var vi3 = this.index;
        this.getIndexFromXY(x, y, gridSize);
        var vi4 = this.index;
        
        var v2 = vec3.fromValues(-1/n, 1/n , vert[vi3]
                         - vert[vi4]);
        
        this.getIndexFromXY(x - 1/n, y - 1/n, gridSize);
        var vi5 = this.index;
        this.getIndexFromXY(x, y, gridSize);
        var vi6 = this.index;
        
        var v3 = vec3.fromValues(-1/n, -1/n , vert[vi5]
                         - vert[vi6]);
        
        this.getIndexFromXY(x + 1/n, y - 1/n, gridSize);
        var vi7 = this.index;
        this.getIndexFromXY(x, y, gridSize);
        var vi8 = this.index;
        
        var v4 = vec3.fromValues(1/n, -1/n , vert[vi7]
                         - vert[vi8]);
        
        var n1 = vec3.create();
        var n2 = vec3.create();
        var n3 = vec3.create();
        var n4 = vec3.create();

        //take cross products to get normal vectors
        vec3.cross(n1, v1, v2);
        vec3.cross(n2, v2, v3);
        vec3.cross(n3, v3, v4);
        vec3.cross(n4, v4, v1);

        vec3.normalize(n1, n1);
        vec3.normalize(n2, n2);
        vec3.normalize(n3, n3);
        vec3.normalize(n4, n4);

            //add the normal vectors and normalize them to one normal
        var n0 = vec3.create();
        vec3.add(n0, n1, n2);
        vec3.add(n0, n0, n3);
        vec3.add(n0, n0, n4);

        vec3.normalize(n0, n0);
        this.normal = n0;
    }

    diamond(x, y, size, gridSize, vert) {
        var rand = Math.random() / this.smoothing;

        this.getIndexFromXY(x, y, gridSize);
        var zMid = this.index;
        this.getIndexFromXY(x - size, y - size, gridSize);
        var zBottomLeft = this.index;
        this.getIndexFromXY(x + size, y - size, gridSize);
        var zBottomRight = this.index;
        this.getIndexFromXY(x - size, y + size, gridSize);
        var zTopLeft = this.index
        this.getIndexFromXY(x + size, y + size, gridSize);
        var zTopRight = this.index;
        vert[zMid] = ((vert[zTopRight] || 0) + (vert[zTopLeft] || 0)
                        + (vert[zBottomRight] || 0) + (vert[zBottomLeft] || 0))
                        /4 + rand*Math.log2(gridSize*size)/Math.log2(gridSize);
    }

    square(x, y, size, gridSize, vert) {
        this.getIndexFromXY(x, y, gridSize);
        var zMid = this.index;
        this.getIndexFromXY(x, y + size, gridSize);
        var zTop = this.index;
        this.getIndexFromXY(x, y - size, gridSize);
        var zBottom = this.index;
        this.getIndexFromXY(x - size, y, gridSize);
        var zLeft = this.index;
        this.getIndexFromXY(x + size, y, gridSize);
        var zRight = this.index;

        var rand = Math.random() / this.smoothing;
        vert[zMid] = ((vert[zRight] || 0) + (vert[zLeft] || 0)
                            + (vert[zTop] || 0) + (vert[zBottom] || 0))
                            /4 + rand*Math.log2(gridSize*size)/Math.log2(gridSize);

    }

    diamondSquare(x, y, size, gridSize, vert) {
        //size  = size / gridSize;
        while(size != 1/(gridSize)){
        
            for(var i = x; i <= 1; i += 2*size) {
                for(var j = y; j <= 1; j += 2*size) {
                    this.diamond(i, j, size, gridSize, vert);
                }
            }

            for(var i = x - size; i <= 1; i += size) {
                for(var j = (i+1 + size)%(2*size); j <= 2; j += 2 * size) {
                    this.square(i, j-1, size, gridSize, vert);
                }
            }
            
            x -= size / 2;
            y -= size / 2;
            size = size / 2;
        }
    }

    /**
     * Fill the vertex and buffer arrays 
     */    
    generateTriangles()
    {
        //Your code here
        var deltaX = (this.maxX - this.minX) / this.div;
        var deltaY = (this.maxY - this.minY) / this.div;

        for(var i = 0; i <= this.div; i++)
            for(var j = 0; j <= this.div; j++){
                this.vBuffer.push(this.minX + deltaX * j);
                this.vBuffer.push(this.minY + deltaY * i);
                this.vBuffer.push(0);
                
                this.cTerrain.push(0);
                this.cTerrain.push(0);
                this.cTerrain.push(0);
            }

        for(var i = 0; i < this.div; i++)
            for(var j = 0; j < this.div; j++){
                var vid = i * (this.div + 1) + j;
                this.fBuffer.push(vid);
                this.fBuffer.push(vid + 1);
                this.fBuffer.push(vid + this.div + 1);

                this.fBuffer.push(vid + 1);
                this.fBuffer.push(vid + 1 + this.div + 1);
                this.fBuffer.push(vid + this.div + 1);
            }
        
        this.getIndexFromXY(-1,-1,this.div);
        this.vBuffer[this.index] = 0;
        this.getIndexFromXY(-1,1,this.div);
        this.vBuffer[this.index] = 0;
        this.getIndexFromXY(1,-1,this.div);
        this.vBuffer[this.index] = 0;
        this.getIndexFromXY(1,1,this.div);
        this.vBuffer[this.index] = 0;

        this.diamondSquare(0,0,1,this.div,this.vBuffer)

        for(var i = 0; i <= this.div; i++) {
           for(var j = 0; j <= this.div; j++) {
               this.getNormal(this.minX + deltaX * j, this.minY + deltaY * i, this.div, this.vBuffer);
               for(var n_i = 0; n_i < 3; n_i++) {
                   this.nBuffer.push(this.normal[n_i]);
               }
           }
       }
        
        this.addColorToTerrain(this.vBuffer, this.cTerrain,this.vBuffer.numItems);

        //
        this.numVertices = this.vBuffer.length/3;
        this.numFaces = this.fBuffer.length/3;
        
        this.addColorToTerrain(this.vBuffer, this.cTerrain,this.numVertices);
    }

    /**
     * Print vertices and triangles to console for debugging
     */
    printBuffers()
        {

        for(var i=0;i<this.numVertices;i++)
              {
               console.log("v ", this.vBuffer[i*3], " ", 
                                 this.vBuffer[i*3 + 1], " ",
                                 this.vBuffer[i*3 + 2], " ");

              }

          for(var i=0;i<this.numFaces;i++)
              {
               console.log("f ", this.fBuffer[i*3], " ", 
                                 this.fBuffer[i*3 + 1], " ",
                                 this.fBuffer[i*3 + 2], " ");

              }
            
        for(var i=0;i<this.numFaces;i++)
              {
               console.log("n ", this.nBuffer[i*3], " ", 
                                 this.nBuffer[i*3 + 1], " ",
                                 this.nBuffer[i*3 + 2], " ");

              }
        console.log(this.vBuffer.length);
        
    }
    
    /**
 * Generates line values from faces in faceArray
 * to enable wireframe rendering
 */
    generateLines(){
        var numTris=this.fBuffer.length/3;
        for(var f=0;f<numTris;f++){
            var fid=f*3;
            this.eBuffer.push(this.fBuffer[fid]);
            this.eBuffer.push(this.fBuffer[fid+1]);

            this.eBuffer.push(this.fBuffer[fid+1]);
            this.eBuffer.push(this.fBuffer[fid+2]);

            this.eBuffer.push(this.fBuffer[fid+2]);
            this.eBuffer.push(this.fBuffer[fid]);
        }

    } 
    
    addColorToTerrain(vertexArray, colorArray, size){
    // loop through all of the z values of all the vertices
        for(var i=0;i<=size;i++){
            for(var j=0;j<=size*3;j+=3){
                if(vertexArray[i*(size+1)*3+j+2] < 0){       // if below 0 set to red
                    colorArray[i*(size+1)*3 + j + 0] = 0;
                    colorArray[i*(size+1)*3 + j + 1] = 0.3;
                    colorArray[i*(size+1)*3 + j + 2] = 0.3;
                
                }else if(vertexArray[i*(size+1)*3+j+2] < .1){ // if in between -0 and -0.05 set to yellow
                    colorArray[i*(size+1)*3 + j + 0] = 0.3;
                    colorArray[i*(size+1)*3 + j + 1] = 0.3;
                    colorArray[i*(size+1)*3 + j + 2] = 0;
                
                }else if(vertexArray[i*(size+1)*3+j+2] < .15){    // if in between -0.1 and 0 set to green
                    colorArray[i*(size+1)*3 + j + 0] = 0;
                    colorArray[i*(size+1)*3 + j + 1] = 0.6;
                    colorArray[i*(size+1)*3 + j + 2] = 0;
                
                }else if(vertexArray[i*(size+1)*3+j+2] > 0.3){  // if greater than 0.2 set to magenta
                    colorArray[i*(size+1)*3 + j + 0] = 0.3;
                    colorArray[i*(size+1)*3 + j + 1] = 0;
                    colorArray[i*(size+1)*3 + j + 2] = 0.3;
                
                }else if(vertexArray[i*(size+1)*3+j+2] > 0.25){  // if in between 0.1 and 0.2 set to blue
                    colorArray[i*(size+1)*3 + j + 0] = 0;
                    colorArray[i*(size+1)*3 + j + 1] = 0;
                    colorArray[i*(size+1)*3 + j + 2] = 0.6;
                
                }else if(vertexArray[i*(size+1)*3+j+2] > .2){    // if in between 0 and 0.1 set to cyan
                    colorArray[i*(size+1)*3 + j + 0] = .6;
                    colorArray[i*(size+1)*3 + j + 1] = 0;
                    colorArray[i*(size+1)*3 + j + 2] = 0;
                }
            }
        }
    }
}