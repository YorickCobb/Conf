/**
 *             A-Frame UV Map Doubler
 * This script assigns a duplicate UV map to Aframe objects.
 *   (for Ambient Occlusion or light maps)
 */

//Check whether aframe is included
if (typeof AFRAME === 'undefined') {
  throw new Error('Component attempted to register before AFRAME' +
    ' was available.');
}

AFRAME.registerComponent('uvdoubler', {
	schema: {
	},
	
	init: function() {
		var object = this;
		
		//this might be cleaner - it seems like only objects based on primitives have a geometry component?
		if(this.el.getAttribute('geometry')) {
			this.el.addEventListener('loaded', (e) => {
				console.log("==Primitive Loaded in UVDoubler?==");
			});
		} else {
			this.el.addEventListener('model-loaded', (e) => {
				//OBJs come in as this one
				
				//var geom = this.el.getAttribute('Object3D');
				var object = this.el.object3D;
				//console.log(object);
				object.traverse(function(child){
					//if (child instanceof THREE.BufferGeometry) {
					if (child instanceof THREE.Mesh) {
						//console.log("is instanceof Geometry", child);
						
						var geom = child.geometry;
						
						//console.log(geom);
						if (geom!=null) {
							geom.addAttribute( 'uv2', new THREE.BufferAttribute( geom.attributes.uv.array, 2 ) );
						}
					}
				});
			});
		}
	},
	
	remove: function() {
	}
});
			