TP3.Render = {
	


	drawTreeRough: function (rootNode, scene, alpha, radialDivisions = 8, leavesCutoff = 0.1, leavesDensity = 10, applesProbability = 0.05, matrix = new THREE.Matrix4()) {
		
		// Function to create a branch
		function createBranchGeometry(node,p0, p1, radialDivisions) {
			const direction = new THREE.Vector3().subVectors(p1, p0);
			const length = direction.length();
			direction.normalize();
	
			const geometry = new THREE.CylinderBufferGeometry(node.a1, node.a0, length, radialDivisions);
			const midpoint = p0.clone().add(p1).multiplyScalar(0.5);
			const up = new THREE.Vector3(0, 1, 0); // Default up direction
			const quaternion = new THREE.Quaternion().setFromUnitVectors(up, direction);
			geometry.applyMatrix4(new THREE.Matrix4().makeRotationFromQuaternion(quaternion)); // Apply rotation
			geometry.applyMatrix4(new THREE.Matrix4().makeTranslation(midpoint.x, midpoint.y, midpoint.z)); // Position the geometry
			
			geometry.applyMatrix4(matrix); // Apply transformation
			
			return geometry;
		}
	
		function createLeavesGeometry(branch, branchLength, branchWidth, isTerminal, leavesDensity, alpha, leavesCutoff) {
			const leaves = [];

    if (branchWidth >= alpha * leavesCutoff) return leaves;
    const midpoint = branch.p0.clone().add(branch.p1.clone()).multiplyScalar(0.5);
    const radius = alpha / 2; 
    const numLeaves = Math.floor(Math.random() * leavesDensity); 

    for (let i = 0; i < numLeaves; i++) {
        const leafGeometry = new THREE.PlaneBufferGeometry(alpha, alpha); 
        leafGeometry.applyMatrix4(new THREE.Matrix4().makeRotationFromEuler(new THREE.Euler(Math.random() * Math.PI * 2, Math.random() * Math.PI * 2, Math.random() * Math.PI * 2)));

        const offset = new THREE.Vector3(
            (Math.random() - 0.5) * radius * 2,
            -Math.random() * branchLength + (isTerminal ? alpha : 0), // Leaf placement on the branch
            (Math.random() - 0.5) * radius * 2
        );
        const leafPos = midpoint.clone().add(offset);
        leafGeometry.applyMatrix4(new THREE.Matrix4().makeTranslation(leafPos.x, leafPos.y, leafPos.z)); // Position the leaf
        leafGeometry.applyMatrix4(matrix); // Apply transformation

        leaves.push(leafGeometry);
		}

   	 return leaves;
		}
		
		function createApples(branch, applesProbability, alpha,branchWidth) {
			const apples = [];
			// Random chance to place an apple or below cutoff like leaves 
			if (Math.random() > applesProbability|| branchWidth >= alpha * leavesCutoff) return apples;
			const midpoint = branch.p0.clone().add(branch.p1).multiplyScalar(0.5);
			const appleGeometry = new THREE.BoxBufferGeometry(alpha, alpha, alpha); // Cube for the apple
			const appleMaterial = new THREE.MeshPhongMaterial({ color: 0xff0000 });
			const apple = new THREE.Mesh(appleGeometry, appleMaterial);
		
			apple.position.copy(midpoint.clone()); // Position the apple
		
			apples.push(apple);
			return apples;
		}
		
	
		const stack = [];
	stack.push(rootNode);

	const branches = [];
	const leaves = [];
	while (stack.length > 0) {
		const currentNode = stack.pop();
	
		for (let i = 0; i < currentNode.childNode.length; i++) {
			const child = currentNode.childNode[i];
			const branchLength = child.p0.clone().sub(currentNode.p0).length();
			const branchWidth = currentNode.a0;
	
			//init stuff i need that i would want to only pass the node or something as argument not super important 
			const branchGeometry = createBranchGeometry(currentNode, currentNode.p0, child.p0, radialDivisions);
			branches.push(branchGeometry);
	
			const isTerminal = child.childNode.length === 0;
	
			// could be improved redudent inputs
			const branchLeavesGeometries = createLeavesGeometry(
				currentNode, // Branch position
				branchLength,   // Branch length
				branchWidth,    // Branch width
				isTerminal,     // Is terminal
				leavesDensity,  // Leaves density
				alpha,          // Alpha (leaf size)
				leavesCutoff    // Leaves cutoff (no longer restricting)
			);
			leaves.push(...branchLeavesGeometries);
			// Create apples
			const branchApples = createApples(
				currentNode,    // Branch position
				applesProbability, // Apple probability
				alpha,             // Apple size
				branchWidth
			);
			//add everything in the scene that i would want a single mesh to take care of the stuff at least

			for (const apple of branchApples) {
				scene.add(apple);
				currentNode.appleIndices +=1;
			}
			stack.push(child);
		}
	}
	// Merge branch geometries into a single geometry
	const mergedBranchesGeometry = THREE.BufferGeometryUtils.mergeBufferGeometries(branches);
	const branchesMaterial = new THREE.MeshPhongMaterial({ color: 0x8b4513 }); // Brown color for branches
	const branchesMesh = new THREE.Mesh(mergedBranchesGeometry, branchesMaterial);


	// Add merged branches mesh to the scene
	scene.add(branchesMesh);

	// Merge leaf geometries into a single geometry (for better performance)
	if (leaves.length > 0) {
		const mergedLeavesGeometry = THREE.BufferGeometryUtils.mergeBufferGeometries(leaves);
		const leavesMaterial = new THREE.MeshPhongMaterial({ color: 0x3A5F0B, side: THREE.DoubleSide });
		const leavesMesh = new THREE.Mesh(mergedLeavesGeometry, leavesMaterial);
		// Add merged leaves mesh to the scene
		scene.add(leavesMesh);
	}
},
	
	drawTreeHermite: function (rootNode, scene, alpha, leavesCutoff = 0.1, leavesDensity = 10, applesProbability = 0.05, matrix = new THREE.Matrix4()) {
		//TODO
	},

	updateTreeHermite: function (trunkGeometryBuffer, leavesGeometryBuffer, applesGeometryBuffer, rootNode) {
		//TODO
	},

	drawTreeSkeleton: function (rootNode, scene, color = 0xffffff, matrix = new THREE.Matrix4()) {

		var stack = [];
		stack.push(rootNode);

		var points = [];

		while (stack.length > 0) {
			var currentNode = stack.pop();

			for (var i = 0; i < currentNode.childNode.length; i++) {
				stack.push(currentNode.childNode[i]);
			}

			points.push(currentNode.p0);
			points.push(currentNode.p1);

		}

		var geometry = new THREE.BufferGeometry().setFromPoints(points);
		var material = new THREE.LineBasicMaterial({ color: color });
		var line = new THREE.LineSegments(geometry, material);
		line.applyMatrix4(matrix);
		scene.add(line);

		return line.geometry;
	},

	updateTreeSkeleton: function (geometryBuffer, rootNode) {

		var stack = [];
		stack.push(rootNode);

		var idx = 0;
		while (stack.length > 0) {
			var currentNode = stack.pop();

			for (var i = 0; i < currentNode.childNode.length; i++) {
				stack.push(currentNode.childNode[i]);
			}
			geometryBuffer[idx * 6] = currentNode.p0.x;
			geometryBuffer[idx * 6 + 1] = currentNode.p0.y;
			geometryBuffer[idx * 6 + 2] = currentNode.p0.z;
			geometryBuffer[idx * 6 + 3] = currentNode.p1.x;
			geometryBuffer[idx * 6 + 4] = currentNode.p1.y;
			geometryBuffer[idx * 6 + 5] = currentNode.p1.z;

			idx++;
		}
	},


	drawTreeNodes: function (rootNode, scene, color = 0x00ff00, size = 0.05, matrix = new THREE.Matrix4()) {

		var stack = [];
		stack.push(rootNode);

		var points = [];

		while (stack.length > 0) {
			var currentNode = stack.pop();

			for (var i = 0; i < currentNode.childNode.length; i++) {
				stack.push(currentNode.childNode[i]);
			}

			points.push(currentNode.p0);
			points.push(currentNode.p1);

		}

		var geometry = new THREE.BufferGeometry().setFromPoints(points);
		var material = new THREE.PointsMaterial({ color: color, size: size });
		var points = new THREE.Points(geometry, material);
		points.applyMatrix4(matrix);
		scene.add(points);

	},


	drawTreeSegments: function (rootNode, scene, lineColor = 0xff0000, segmentColor = 0xffffff, orientationColor = 0x00ff00, matrix = new THREE.Matrix4()) {

		var stack = [];
		stack.push(rootNode);

		var points = [];
		var pointsS = [];
		var pointsT = [];

		while (stack.length > 0) {
			var currentNode = stack.pop();

			for (var i = 0; i < currentNode.childNode.length; i++) {
				stack.push(currentNode.childNode[i]);
			}

			const segments = currentNode.sections;
			for (var i = 0; i < segments.length - 1; i++) {
				points.push(TP3.Geometry.meanPoint(segments[i]));
				points.push(TP3.Geometry.meanPoint(segments[i + 1]));
			}
			for (var i = 0; i < segments.length; i++) {
				pointsT.push(TP3.Geometry.meanPoint(segments[i]));
				pointsT.push(segments[i][0]);
			}

			for (var i = 0; i < segments.length; i++) {

				for (var j = 0; j < segments[i].length - 1; j++) {
					pointsS.push(segments[i][j]);
					pointsS.push(segments[i][j + 1]);
				}
				pointsS.push(segments[i][0]);
				pointsS.push(segments[i][segments[i].length - 1]);
			}
		}

		var geometry = new THREE.BufferGeometry().setFromPoints(points);
		var geometryS = new THREE.BufferGeometry().setFromPoints(pointsS);
		var geometryT = new THREE.BufferGeometry().setFromPoints(pointsT);

		var material = new THREE.LineBasicMaterial({ color: lineColor });
		var materialS = new THREE.LineBasicMaterial({ color: segmentColor });
		var materialT = new THREE.LineBasicMaterial({ color: orientationColor });

		var line = new THREE.LineSegments(geometry, material);
		var lineS = new THREE.LineSegments(geometryS, materialS);
		var lineT = new THREE.LineSegments(geometryT, materialT);

		line.applyMatrix4(matrix);
		lineS.applyMatrix4(matrix);
		lineT.applyMatrix4(matrix);

		scene.add(line);
		scene.add(lineS);
		scene.add(lineT);

	}
}