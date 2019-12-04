/**
 * Worker Script
 */

 import { pass, configure, init, getNodes, setNodes, getConfiguration } from './algorithm'
/**
 * Message reception & sending
 */

// Sending data back to the supervisor
function sendNewCoords() {
  const nodes = getNodes().buffer;
  self.postMessage({ nodes }, [nodes]);
}

// Algorithm run
function run(n) {
  for (var i = 0; i < n; i++) pass();
  sendNewCoords();
}

// On supervisor message
var listener = function(e) {
  switch (e.data.action) {
    case "start":
      init(
        new Float32Array(e.data.nodes),
        new Float32Array(e.data.edges),
        e.data.config
      );

      // First iteration(s)
      run(getConfiguration().startingIterations);
      break;

    case "loop":
      setNodes(new Float32Array(e.data.nodes));
      run(getConfiguration().iterationsPerRender);
      break;

    case "config":
      // Merging new settings
      configure(e.data.config);
      break;

    case "kill":
      // Deleting context for garbage collection
      __emptyObject(W);
      NodeMatrix = null;
      EdgeMatrix = null;
      RegionMatrix = null;
      self.removeEventListener("message", listener);
      break;

    default:
  }
};

// Adding event listener
self.addEventListener("message", listener);
