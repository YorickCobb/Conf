/**
		This is backburnered until I decide I
		  REALLY want to waste an hour playing
		  with three.js' transform matrices
													*/
													
/**
		Ohhhhhhhh but now that I've dipped my
		  toes into three.js' matrices - can I
		  just set local matrices on each tick
		  and totally bypass parenting?
		Should be possible and very easy - only
		  problem is performance. Give it a shot.
													*/


/**
 * Problem 1: right now we need to load each animation once for each object it's applied to.
 *   Would love to just use three.js' clone() method, but it breaks links between animations
 *   and objects, and in fact cloned GLTF models vanish entirely.
 *   Might be able to solve this by loading fresh GLTF models inside this component (URL
 *   would be passed in) but that would be a headache re: loading a GLTF model outside of
 *   A-Frame and probably having to pass it back into A-Frame.
 *       (I think I've seen something about attaching objects to the aframe scene? research)
 * 
 * Problem 2: 'model-loaded' fires twice, once for the parent and once for the child. Figure
 *   out how to distinguish between them to reduce overhead.
 * 
 * Problem 3: I solved this but hey why can't I overwrite the animation's whole position
 *   vector in one go? why do I have to do it on each axis individually?
 * 
 * Problem 4: Matching the source to the target so that transforms are unchanged is very messy.
 * 	 Figure out push/pop matrix logic, which is really just the right way to do this anyway.
 *   (Also goes a bit of the way toward solving problem 2)
 * 
 * A better way to do all this:
 *   -Get passed a URL to a GlTF animation
 *   -Load it in this component
 *   -Attach it to the a-scene
 *   -Parent the target to it, preserving original transform
 *   -Be ready to un-parent from the animation, either maintaining current (animated)
 *      position or reverting to original transform (via lerp?)
 * 
 * There's a problem that that approach won't solve: Once the target is parented to the
 *   animation, it depends on that animation being position right at its origin. If we naively
 *   move the target object with some other component, then the model will be moved away from 
 *   the origin of the animation and our transforms will stack wrong.
 * 
 *   Solution: Create empty node as a container, above both the target and its animations, and
 *     try to redirect other manipulations to that? Doesn't sound easy.
 * 
 *   Different solution: Right now, the target mesh is this.el.object3D... could we parent this.el
 *     to the animation? Is this.el an A-Frame/Three.js object at all? Research this. And check
 *     with Mike about it later, if it's not solved by then.
 * 
 * I cleaned up the parenting so it now works with every type of object (that I tested)
 * Issues listed above still not fixed.
 * 
 */





AFRAME.registerComponent('parent-animation', {
	
	schema: {
		animationSource: { default: '#animator' },
		animationTarget:{ default: '' }
	},

	init: function()
	{
		var animParent;
		var animChild;
		
		console.log("Entered animation parent component");
		
		this.el.addEventListener('model-loaded', (e) => {
			//assignment function (to be called when ready)
			var assignAnim = function(source, target) {
				
				var targetWorldPos = new THREE.Vector3(0, 0, 0);
				
				//needed to get accurate world position - without this, children are at the origin?
				target.updateMatrixWorld();
				source.updateMatrixWorld();
				
				target.getWorldPosition(targetWorldPos);
				
				
				source.position.x = targetWorldPos.x;
				source.position.y = targetWorldPos.y;
				source.position.z = targetWorldPos.z;
				
				//these tweaks to rotation happen twice - once, then once again when the outline child loads
				target.rotation.x -= source.rotation.x / 2;
				target.rotation.y -= source.rotation.y;
				target.rotation.z -= source.rotation.z;
				
				/**
				 * To-do:
				 *   -Push/pop matrix logic
				 * 		-Get target's current world matrix, save it.
				 * 		-Extract position from this matrix, and move source to this position.
				 * 		-Subtract source's world matrix from target's world matrix, then parent target
				 *			to source (should result in unchanged world transforms for target)
				 * 		-When the time comes, pull up that original world matrix, and repeat this
				 * 			process to parent target back onto its original parent.
				 */
				
				let locator = source.getObjectByName("locator1");
				
				locator.add(target);
				
				target.position.x = 0;
				target.position.y = 0;
				target.position.z = 0;
			};
			
			var sourceEl = document.querySelector(this.data.animationSource);
			var targetEl = this.el.object3D;
			
			var mesh = sourceEl.object3D;
			
			var locator = mesh.getObjectByName("locator1");
			
			
			if (locator) {
				//this means the source gltf has finished(?) loading
				
				locator = mesh.getObjectByName("locator1");
				
				assignAnim(mesh, targetEl);
				
			} else {
				//this means the source gltf isn't properly loaded yet
				sourceEl.addEventListener('model-loaded', (e) => {
					// console.log("Received loaded event in parentEl");
				
					locator = mesh.getObjectByName("locator1");
					
					// console.log("Locator is (in eventlistener): ");
					// console.log(locator);
					
					assignAnim(mesh, targetEl);
				});
			}
		});
	},

	remove: function() {
		//unparent them? idk how I should handle this
	}

});