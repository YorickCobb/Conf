/**
 * Renders a mesh with flat colors and vertices extruded along normals, with
 *   distance varying over time (loose 3-osc approximation of a squarewave)
 * 
 * color: Self-explanatory. Note that no shading or textures will be applied.
 * 
 * timeMsec: Passed in by A-Frame internally, do not set manually. Time, in
 *   milliseconds, since scene start.
 * 
 * objScale: Scale of object, used to normalize outline thickness between
 *   objects with different scale. It may be possible to calculate this
 *   inside the shader later on, but no promises. This is 1-dimensional
 *   for now and won't work with non-uniform scale; if we need to
 *   accomodate that I can update the shader, but for now I am prioritizing
 *   simplicity.
 * 
 * pulseRate: Speed the outline should pulse in and out for emphasis, in hertz.
 *   Set to zero for a solid outline.
 * 
 * IMPORTANT: Specify "side: back;" in the A-Frame material properties. This
 *   reverses the mesh's winding order so that front-faces are culled, creating
 *   the outline effect.
 * 
 * To use: Leave original object as-is. Attach a duplicate of the object as a
 *   child and apply this shader, then use the visibility of the child object to
 *   show and hide the outline.
 * 
 * Sample usage in A-Frame:
 
		material="shader: outline;
			color: #5fa;
			side: back;
			objScale: 0.01;
			pulseRate: 0;"
			
 * 
 * 
 * 
 * 
 */

AFRAME.registerShader('outline', {
	schema: {
		color: {type: 'color', is: 'uniform'},
		timeMsec: {type: 'time', is: 'uniform'},
		objScale: {type: 'float', is: 'uniform', default: '1.0'},
		pulseRate: {type: 'float', is: 'uniform', default: '2.0'}
	},
	
	/** This doesn't work because A-Frame is bad.
	init: function () {
		//return 0;
		
	},*/

	vertexShader: `
		uniform float timeMsec; // A-Frame time in milliseconds. (Will I have to fix this bit when we move away from A-Frame?)
		uniform float objScale; // scale of object
		uniform float pulseRate;

		void main() {
			//convert input time (ms) to seconds
			float time = timeMsec / 1000.0;
			
			//set oscillation speed by converting to radians/sec
			float osc = time * 6.28318530718 * pulseRate;
							
			//approximate a squarewave (if performance is a problem, it'll be here)
			float offset = (0.0085 + 0.005 * (
							cos(osc) + 
							cos(osc * 3.0) / 2.7 +
							cos(osc * 5.0) / 8.0)) / objScale; //adjust offset to model scale
			
			//apply offset along normal to find new vertex position
			vec3 newPosition = position + normal * offset;
			
			//bring the new vertex position into gl coordinate space (in view frustum, I believe?)
			gl_Position = projectionMatrix * modelViewMatrix * vec4( newPosition, 1.0 );
		}
	`,
	
	fragmentShader: `
		uniform vec3 color;

		void main() {
			//send out the color
			gl_FragColor = vec4(color, 1.0);
		}
		`
});