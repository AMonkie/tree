TP3.Render = {
	drawTreeRough: function (rootNode, scene, alpha, radialDivisions = 8, leavesCutoff = 0.1, leavesDensity = 10, applesProbability = 0.05, matrix = new THREE.Matrix4()) {
		// Utility function to create a branch cylinder
		function createBranch(p0, p1, radialDivisions) {
			const direction = new THREE.Vector3().subVectors(p1, p0);
			const length = direction.length();
			direction.normalize();
			
			const geometry = new THREE.CylinderBufferGeometry(0.05, 0.05, length, radialDivisions);
			const material = new THREE.MeshLambertMaterial({ color: 0x8B5A2B });
			
			const branch = new THREE.Mesh(geometry, material);
			branch.position.copy(p0);
			
			const axis = new THREE.Vector3(0, 1, 0).cross(direction).normalize();
			const angle = Math.acos(new THREE.Vector3(0, 1, 0).dot(direction));
			branch.rotation.setFromAxisAngle(axis, angle);
			
			return branch;
		}
	
		// Utility function to create leaves (using PlaneBufferGeometry)
		function createLeaves(p1, leavesDensity) {
			const leaves = [];
			const numLeaves = Math.floor(Math.random() * leavesDensity);
			
			for (let i = 0; i < numLeaves; i++) {
				const leafGeometry = new THREE.PlaneBufferGeometry(0.2, 0.2);
				const leafMaterial = new THREE.MeshPhongMaterial({ color: 0x3A5F0B });
				
				const leaf = new THREE.Mesh(leafGeometry, leafMaterial);
				const offset = new THREE.Vector3(
					(Math.random() - 0.5) * 0.1,
					Math.random() * 0.2, 
					(Math.random() - 0.5) * 0.1
				);
				leaf.position.copy(p1).add(offset);
				leaves.push(leaf);
			}
			
			return leaves;
		}
	
		var stack = [];
		stack.push(rootNode);
	
		var branches = [];
		var leaves = [];
	
		while (stack.length > 0) {
			var currentNode = stack.pop();
	
			for (var i = 0; i < currentNode.childNode.length; i++) {
				const child = currentNode.childNode[i];
				
				// Create a branch from the current node to the child node
				const branch = createBranch(currentNode.p0, currentNode.p1, radialDivisions);
				branches.push(branch);
	
				// Create leaves for the branch
				if (currentNode.p1.y > leavesCutoff) {
					const branchLeaves = createLeaves(currentNode.p1, leavesDensity);
					leaves.push(...branchLeaves);
				}
	
				// Add the child to the stack
				stack.push(child);
			}
		}
	
		// Merge the branch geometries into one mesh
		const branchGeometries = branches.map(branch => branch.geometry);
		const mergedBranchGeometry = THREE.BufferGeometryUtils.mergeBufferGeometries(branchGeometries);
		const branchMaterial = new THREE.MeshLambertMaterial({ color: 0x8B5A2B });
		const mergedBranchMesh = new THREE.Mesh(mergedBranchGeometry, branchMaterial);
	
		// Merge the leaf geometries into one mesh
		const leafGeometries = leaves.map(leaf => leaf.geometry);
		const mergedLeafGeometry = THREE.BufferGeometryUtils.mergeBufferGeometries(leafGeometries);
		const leafMaterial = new THREE.MeshPhongMaterial({ color: 0x3A5F0B });
		const mergedLeafMesh = new THREE.Mesh(mergedLeafGeometry, leafMaterial);
	
		// Apply the transformation matrix to the entire tree
		mergedBranchMesh.applyMatrix4(matrix);
		mergedLeafMesh.applyMatrix4(matrix);
	
		// Add the branches and leaves to the scene
		scene.add(mergedBranchMesh);
		scene.add(mergedLeafMesh);
	
		return { branches: mergedBranchMesh, leaves: mergedLeafMesh };
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