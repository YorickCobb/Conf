/**
 *             A-Frame Environment Map Assigner
 * This script assigns HDR environment maps to meshes in A-Frame.
 * 
 * Don't use this system to apply regular images as cube maps; it
 *   expects .hdr image files. Low-dynamic range formats (png, jpeg, etc)
 *   are supported natively by A-Frame, and don't need this script.
 * 
 * To do: more robust mesh-type checking. There has to be a better way
 *   to find out if an object is a primitive or a loaded mesh.
 * 
 * This script hasn't been tested with custom components, and will break
 *   for OBJ- or GlTF-based components with different tagNames, as well
 *   as with .Collada meshes.
 * 
 * This script assumes meshes are using the standard material, and
 *   will probably break if applied to other shader models.
 * 
 * To apply this system to an entity, add to the entity's HTML
 *   attributes:
 * 			envmap-assigner
 * 
 * To change the cube map's filepath, add to the <a-scene>'s HTML
 *   attributes:
 * 			envmap-assigner="filepath: filepath/"
 * 
 * Works with A-Frame version 0.9.2, other versions may break anything
 *   and everything.
 * 
 * To improve blur quality on rough surfaces, increase the value at line 31
 *   in PMREMGenerator.js - but be aware that high numbers will impact
 *   page load times.
 * 
 * Throws an error when the environment-mapped mesh has another mesh as a
 *   child. I think it has to do with two loaded events being emitted, but
 *   I'm not sure. That wouldn't explain why getObject3D('mesh') returns null.
 *   Fixed by checking if obj is null, but that's a bit hacky.
 * 
 */

//Check whether aframe is included
if (typeof AFRAME === 'undefined') {
  throw new Error('Component attempted to register before AFRAME' +
    ' was available.');
}

AFRAME.registerSystem('envmap-assigner', {
	schema: { //system schema, parses into 'this.data'
		filepath: {type: 'string', default: 'envmap/HDRcube/'}
	},
	
	init: function () {
		
		//AFrame system setup
		this.entities = [];
		
		var hdriLoaded = false;
		var tempEnvMap;
		
		var filepath = this.data.filepath;
		
		var el = this.el;
		var hdrCubeRenderTarget;
		
		var renderer = el.sceneEl.renderer;
		
		var hdrURLs = ['posx.hdr', 'negx.hdr',
						'posy.hdr', 'negy.hdr',
						'posz.hdr', 'negz.hdr'];
		
		//Load the cubemap and compute pmrem, then emit load status
		var hdrCubeMap = new THREE.HDRCubeTextureLoader()
			.setPath( filepath )
			.load(THREE.UnsignedByteType,
				hdrURLs,
				function () {
					var pmremGenerator = new THREE.PMREMGenerator( hdrCubeMap );
					pmremGenerator.update( renderer );
					
					var pmremCubeUVPacker = new THREE.PMREMCubeUVPacker( pmremGenerator.cubeLods );
					pmremCubeUVPacker.update( renderer );
					
					hdrCubeRenderTarget = pmremCubeUVPacker.CubeUVRenderTarget;
					
					hdrCubeMap.magFilter = THREE.LinearFilter;
					hdrCubeMap.needsUpdate = true;
					
					pmremGenerator.dispose();
					pmremCubeUVPacker.dispose();
					
					console.log("Loaded Cube Map");
					hdriLoaded = true;
					el.emit("cubeMapComplete", tempEnvMap);
				}
			);
		
		//Listen for objects to apply cubemap to
		this.el.addEventListener('entityRegistered', (e) => {
			var obj = e.detail.getObject3D('mesh');
			
			tempEnvMap = hdrCubeRenderTarget ? hdrCubeRenderTarget.texture : null;
			
			if(!obj) return;
			
			//if the cubemap is already lodaed, apply it
			if (hdriLoaded) {
				obj.traverse(node => {
					if (node.isMesh) {
						if (node.material && 'envMap' in node.material) {
							node.material.envMap = tempEnvMap;
							node.material.needsUpdate = true;
						}
					}
				});
			} //otherwise, wait for the loaded status before applying
			else {	
				this.el.addEventListener('cubeMapComplete', (e) => {
					console.log("cubemap completed");
					obj.traverse(node => {
						if (node.isMesh) {
							if (node.material && 'envMap' in node.material) {
								node.material.envMap = tempEnvMap;
								node.material.needsUpdate = true;
							}
						}
					});
				});
			}
		});
	},
	
	registerMe: function(el, url) {
		//don't register the component if it's already in
			//(not really necessary here, but it's best practice)
			
		if (this.entities.indexOf(el) == -1) {
			this.entities.push(el);
			
			//when an entity is added, send it back to init() to assign the cubemap
			this.el.emit('entityRegistered', el);
		} else {
			//is this even possible?
			console.log("Registered the same entity twice");
			
			//yes. will happen whenever the object has a child, because when you climb up the node structure you hit the child once, and then again when the child itself is added
			
			//comment this line out when you fix the child issue
			this.el.emit('entityRegistered', el);
		}
	}
});

AFRAME.registerComponent('envmap-assigner', {
	schema: {},
	
	init: function() {
		var object = this;
		//console.log("This entity's attribute is: " + this.el.getAttribute('geometry'));
		
		//this might be cleaner - it seems like only objects based on primitives have a geometry component?
		if(this.el.getAttribute('geometry')) {
			this.el.addEventListener('loaded', (e) => {
				//console.log("Loaded generic or primitive");
				object.system.registerMe(object.el);
			});
		} else {
			this.el.addEventListener('model-loaded', (e) => {
				//console.log("Loaded model");
				object.system.registerMe(object.el);
			});
		}
		
		/**
		//this might break with custom components, if they get different tagNames
		if(this.el.tagName !== "A-GLTF-MODEL" && this.el.tagName !== "A-OBJ-MODEL") {
			this.el.addEventListener('loaded', (e) => {
				//console.log("Loaded generic or primitive");
				object.system.registerMe(object.el);
			});
		} else {
			this.el.addEventListener('model-loaded', (e) => {
				//console.log("Loaded model");
				object.system.registerMe(object.el);
			});
		}*/
	},
	
	remove: function() {
		this.system.unregisterMe(this.el);
		this.mesh.material.envMap = null;
	}
});
			