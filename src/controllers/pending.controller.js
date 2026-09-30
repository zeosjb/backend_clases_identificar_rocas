// Placeholder handlers for the parts of Cátedra I that students implement themselves.
// Each pending route in src/routes/pending.route.js points here and answers 501 until it is replaced by a real
// controller (route -> controller -> service -> model, like recognition.route.js does).
//
// Suggested workflow per feature:
//   1. Read the matching `test.todo` in test/pendingStudent.test.js and turn it into a real failing test (RED).
//   2. Create a service in src/services (business rules, queries) and a controller (HTTP translation).
//   3. Replace `notImplemented(...)` in the route with your controller and delete the stub test for that route.
//   4. Tick the item in the README "Guía para estudiantes" checklist.
const notImplemented = feature => (req, res) => res.status(501).json({
  message: `Funcionalidad pendiente de implementar: ${feature}`,
  feature
})

module.exports = { notImplemented }
