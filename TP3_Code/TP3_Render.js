TP3.Render = {
	


	drawTreeRough: function (rootNode, scene, alpha, radialDivisions = 8, leavesCutoff = 0.1, leavesDensity = 10, applesProbability = 0.05, matrix = new THREE.Matrix4()) {
		// Function to create a branch
		function createBranch(p0, p1, radialDivisions) {
			const direction = new THREE.Vector3().subVectors(p1, p0);
			const length = direction.length();
			direction.normalize();
	
			const geometry = new THREE.CylinderGeometry(0.05, 0.05, length, radialDivisions);
			const material = new THREE.MeshLambertMaterial({ color: 0x8B5A2B });
	
			const branch = new THREE.Mesh(geometry, material);
	
			const midpoint = p0.clone().add(p1).multiplyScalar(0.5);
			branch.position.copy(midpoint);
	
			const up = new THREE.Vector3(0, 1, 0); // Default up direction
			const quaternion = new THREE.Quaternion().setFromUnitVectors(up, direction);
			branch.setRotationFromQuaternion(quaternion);
	
			return branch;
		}
	
		// Function to create leaves
		function createLeaves(p1, leavesDensity, alpha) {
			const leaves = [];
			const numLeaves = Math.floor(Math.random() * leavesDensity);
	
			for (let i = 0; i < numLeaves; i++) {
				const leafGeometry = new THREE.PlaneGeometry(0.2, 0.2);
				const leafMaterial = new THREE.MeshPhongMaterial({
					color: 0x3A5F0B,
					side: THREE.DoubleSide,
					transparent: true,
					opacity: alpha // Adjust opacity based on alpha value
				});
	
				const leaf = new THREE.Mesh(leafGeometry, leafMaterial);
	
				const offset = new THREE.Vector3(
					(Math.random() - 0.5) * 0.4,
					Math.random() * 0.2,
					(Math.random() - 0.5) * 0.4
				);
				leaf.position.copy(p1).add(offset);
				
				// Randomly rotate the leaf for natural variation
				leaf.rotation.z = Math.random() * Math.PI * 2;
	
				leaf.lookAt(p1.clone().add(new THREE.Vector3(0, 1, 0))); // Orient leaf upwards
	
				leaves.push(leaf);
			}
	
			return leaves;
		}
	
		const stack = [];
		stack.push(rootNode);
	
		const branches = [];
		const leaves = [];
	
		// Traverse the tree
		while (stack.length > 0) {
			const currentNode = stack.pop();
	
			for (let i = 0; i < currentNode.childNode.length; i++) {
				const child = currentNode.childNode[i];
	
				// Create a branch from currentNode to child
				const branch = createBranch(currentNode.p0, child.p0, radialDivisions);
				branches.push(branch);
	
				// Create leaves if the branch is above the cutoff
				if (child.p1.y > leavesCutoff) {
					const branchLeaves = createLeaves(child.p1, leavesDensity, alpha);
					leaves.push(...branchLeaves);
				}
	
				// Push child to stack to continue traversing
				stack.push(child);
			}
		}
	
		// Merge branch geometries
		const branchGeometries = branches.map(branch => branch.geometry);
		const mergedBranchGeometry = THREE.BufferGeometryUtils.mergeGeometries(branchGeometries,false);
		const branchesMesh = new THREE.Mesh(mergedBranchGeometry, new THREE.MeshLambertMaterial({ color: 0x8B5A2B }));
	
		// Merge leaf geometries
		const leafGeometries = leaves.map(leaf => leaf.geometry);
		const mergedLeavesGeometry = THREE.BufferGeometryUtils.mergeGeometries(leafGeometries,false);
		const leavesMesh = new THREE.Mesh(mergedLeavesGeometry, new THREE.MeshPhongMaterial({ color: 0x3A5F0B, side: THREE.DoubleSide }));
	
		// Apply transformation matrices to merged meshes
		branchesMesh.applyMatrix4(matrix);
		leavesMesh.applyMatrix4(matrix);
	
		// Add meshes to the scene
		scene.add(branchesMesh);
		scene.add(leavesMesh);
	
		return { branches: branchesMesh, leaves: leavesMesh };
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