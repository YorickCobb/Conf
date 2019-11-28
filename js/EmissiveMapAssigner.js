/**
 *             A-Frame Emission Map Assigner
 * This script assigns emission maps to meshes in A-Frame.
 * 
 * Emission maps are natively supported by Three.js, but A-Frame (in
 *   its infinite wisdom) does not support them in its standard material
 *   wrapper. This component access the underlying three.js material to
 *   assign the emission map anyway.
 * 
 * Note that in many cases, it will be better to build the emission map
 *   into a GlTF model, which ought to work natively. This component is
 *   mostly only needed if the emission map needs to be changed. So if
 *   you have a model with lights on it, bake it into the GlTF. If you
 *   you have a model of a TV and you want to put arbitrary images on
 *   the screen, use this component.
 * 
 * (Also, A-Frame doesn't support video textures natively in GlTFs, as
 *   far as I know.)
 * 
 * Can be given either an image or a video, loaded using either <img> or
 *   <video> html tags.
 * 
 * If your object's material has an 'emissive' value of zero, then it will
 *   automatically be assigned 0xffffff. Otherwise, the original value will
 *   be preserved. (I am assuming you won't want to apply an emission map
 *   and then have it be invisible) Be careful of this when overwriting
 *   existing emission maps on GlTF models - the original emissive value
 *   may be brighter or darker than you want, and will not be overwritten.
 * 
 * This component has not yet been extensively tested. It may break in edge cases.
 * 
 * Am I going crazy or are the textures upside-down on GlTF models?
 *     Yeah, they are. Fixed.
 */

//Check whether aframe is included
if (typeof AFRAME === 'undefined') {
  throw new Error('Component attempted to register before AFRAME' +
    ' was available.');
}

AFRAME.registerSystem('emitmap-assigner', {
	schema: { //system schema, parses into 'this.data'
		filepath: {type: 'string', default: 'envmap/HDRcube/'}
	},
	
	init: function () {
		//AFrame system setup
		
		//fetch emitmap from arguments
		this.emitMaps = [];
		this.emitMapsGLTF = [];
		this.emitMapsDirectory = [];
		this.entities = [];
		
	},
	
	/**
	 * Call this from the component, and this will call registerMap()
	 *     and then carry on to register the object itself
	 */
	registerMe: function(el, emit) {
		//register the texture and get its index in the system's storage arrays
		var mapIndex = this.registerMap(emit);
		
		//don't register the component if it's already in
			//(not really necessary here, but it's best practice)
		if (this.entities.indexOf(el) == -1) {
			this.entities.push(el);
			
			
			const obj = el.getObject3D('mesh');
			
			if(obj){
				obj.traverse(node => {
					if (node.isMesh) {
						if (node.material && 'emissiveMap' in node.material) {
							
							if (el.tagName == "A-GLTF-MODEL") {
								node.material.emissiveMap = this.emitMapsGLTF[mapIndex];
							} else {
								node.material.emissiveMap = this.emitMaps[mapIndex];
							}
							
							//this is a bit hacky
							if (node.material.emissive.r + node.material.emissive.g + node.material.emissive.b == 0)
								node.material.emissive = new THREE.Color( 0xffffff );
							
							node.material.needsUpdate = true;
							
						}
					}
				});
			}
		} else {
			//is this even possible?
			console.log("Registered the same entity twice");
		}
	},
	
	/**
	 * Expects to be given the uri(?) of either an <img> or a <video>
	 * Not sure if an a-asset-item pointing to an image file will work
	 * Returns the index of the given texture in the system's internal array
	 *     (which will be added to the array if it wasn't already loaded)
	 */
	registerMap: function(emit) {
		var testGrab = document.querySelector(emit);
		
		
		var texIndex = this.emitMapsDirectory.indexOf(testGrab);
		
		if (texIndex == -1) { //the texture is not already loaded in the system
			var newTexture;
			var newGLTFTexture;
			
			//instantiate it as the appropriate type of three.js texture
			if (testGrab instanceof HTMLVideoElement) {
				testGrab.play();
				
				newTexture = new THREE.VideoTexture( testGrab );
				
				newTexture.minFilter = THREE.LinearFilter;
				newTexture.magFilter = THREE.LinearFilter;
				newTexture.format = THREE.RGBFormat;
				newTexture.encoding = THREE.sRGBEncoding;
				newTexture.needsUpdate = true;
				
				newGLTFTexture = new THREE.VideoTexture( testGrab );
				
				newGLTFTexture.minFilter = THREE.LinearFilter;
				newGLTFTexture.magFilter = THREE.LinearFilter;
				newGLTFTexture.format = THREE.RGBFormat;
				newGLTFTexture.flipY = false;
				newGLTFTexture.encoding = THREE.sRGBEncoding;
				newGLTFTexture.needsUpdate = true;
				
			} else if (testGrab instanceof HTMLImageElement) {
				
				newTexture = new THREE.Texture( testGrab );
				newTexture.needsUpdate = true;
				
				newGLTFTexture = new THREE.Texture( testGrab );
				newGLTFTexture.flipY = false;
				newGLTFTexture.needsUpdate = true;
				
			} else {
				console.log("Texture was neither image nor video");
				return -1;
			}
			
			//push it on to emitMaps
			this.emitMaps.push(newTexture);
			this.emitMapsGLTF.push(newGLTFTexture);
			this.emitMapsDirectory.push(testGrab);
			texIndex = this.emitMapsDirectory.indexOf(testGrab);
			
			//and return its new index (length of emitMaps, I think)
			return texIndex;
			
		} else { //the texture already exists in the system
			//return texIndex
			return (this.emitMapsDirectory.indexOf(testGrab));
		}
		
		return "-1";
	}
});

AFRAME.registerComponent('emitmap-assigner', {
	schema: {
		map: {default: ''}
	},
	
	init: function() {
		
		var object = this;
		var emit = this.data.map;
		
		//this might be cleaner - it seems like only objects based on primitives have a geometry component?
		if(this.el.getAttribute('geometry')) {
			this.el.addEventListener('loaded', (e) => {
				object.system.registerMe(object.el, emit);
			});
		} else {
			this.el.addEventListener('model-loaded', (e) => {
				object.system.registerMe(object.el, emit);
			});
		}
	},
	
	remove: function() {
		this.system.unregisterMe(this.el);
		this.mesh.material.envMap = null;
	}
});
			