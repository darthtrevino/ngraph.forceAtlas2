import { FA2Algorithm } from './algorithm'
import { Nodes } from './core/Nodes'
import { Edges } from './core/Edges'

let algorithm: FA2Algorithm

/**
 * Message reception & sending
 */

// Sending data back to the supervisor
function sendNewCoords() {
	const nodes = algorithm.nodes.buffer
	self.postMessage({ nodes }, [nodes])
}

// Algorithm run
function run(iterations: number) {
	for (let i = 0; i < iterations; i++) {
		algorithm.pass()
	}
	sendNewCoords()
}

// On supervisor message
var listener = function(e) {
	switch (e.data.action) {
		case 'start':
			algorithm = new FA2Algorithm(
				new Nodes(new Float32Array(e.data.nodes)),
				new Edges(new Float32Array(e.data.edges)),
				e.data.config,
			)
			// First iteration(s)
			run(algorithm.configuration.startingIterations)
			break

		case 'loop':
			algorithm.nodes = new Float32Array(e.data.nodes)
			run(algorithm.configuration.iterationsPerRender)
			break

		case 'config':
			// Merging new settings
			algorithm.configure(e.data.config)
			break

		case 'kill':
			// Deleting context for garbage collection
			algorithm = undefined
			self.removeEventListener('message', listener)
			break

		default:
	}
}

// Adding event listener
self.addEventListener('message', listener)
