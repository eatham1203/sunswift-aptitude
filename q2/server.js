/*
 * Telemetry API with two simple endpoints implemented directly in the server for simplicity.
 * Design decisions: used array-based in-memory storage for fast, lightweight operations; separated validation and storage logic for clarity.
 * Validation ensures required fields are present, types are correct, and components are one of battery, motor, or gps.
 * Errors return detailed, user-friendly messages to aid debugging while keeping API responses clean.
 * Assumptions: values may be integers or floats, timestamps are positive integers, and persistence across server restarts is not required.
 */

/*
Start server using: "npm run dev start"
Tested using:
Check summary: curl http://localhost:3000/logs/summary

Send data: curl -X POST http://localhost:3000/logs/upload \
  -H "Content-Type: application/json" \
  -d '[
    {"timestamp": 1638360000000, "component": "battery", "value": 75.2},
    {"timestamp": 1638360030000, "component": "motor", "value": 85.0},
    {"timestamp": 1638360060000, "component": "gps", "value": 0.045},
    {"timestamp": 1638360090000, "component": "battery", "value": 72.8}
  ]'
*/

const express = require('express');
const app = express()

app.use(express.json());

// In-memory storage for telemetry logs
const logs = [];

// Allowed components
const allowedComponents = ['battery', 'motor', 'gps'];

app.post('/logs/upload', (req, res) => {
  const entries = req.body;

  // Check if it receive array
  if (!Array.isArray(entries)) {
    return res.status(400).json({ error: 'Request body must be an array of log entries' });
  }

  const invalidEntries = [];
  const validEntries = [];

  entries.forEach((entry, index) => {
    const { timestamp, component, value } = entry;

    // Validation checks
    const isValidTimestamp = Number.isInteger(timestamp) && timestamp > 0;
    const isValidValue = typeof value === 'number' && !isNaN(value) && isFinite(value);
    const isValidComponent = allowedComponents.includes(component);

    if (!isValidTimestamp || !isValidValue || !isValidComponent) {
      let reasons = [];
      if (!isValidTimestamp) reasons.push('timestamp must be a positive integer');
      if (!isValidValue) reasons.push('value must be a valid finite number');
      if (!isValidComponent) reasons.push(`component must be one of: ${allowedComponents.join(', ')}`);
      
      invalidEntries.push({
        index,
        entry,
        reason: reasons.join('; ')
      });
    } else {
      validEntries.push({ timestamp, component, value });
    }
  });

  if (invalidEntries.length > 0) {
    return res.status(400).json({
      error: 'Some entries are invalid',
      details: invalidEntries
    });
  }

  // Add valid entries to storage
  logs.push(...validEntries);
  res.status(200).json({ message: `${validEntries.length} logs uploaded successfully` });
});

app.get('/logs/summary', (req, res) => {
  if (logs.length === 0) {
    return res.json({
      count: 0,
      components: {},
      latest: null,
    });
  }

  const summary = {
    count: logs.length,
    components: {},
    latest: logs.reduce((latest, log) => { // reduce used to find entry with latest timestamp
      return (!latest || log.timestamp > latest.timestamp) ? log : latest;
    }, null)
  };

  allowedComponents.forEach(component => {
    const compLogs = logs.filter(log => log.component === component);
    if (compLogs.length === 0) return;

    const values = compLogs.map(l => l.value);
    summary.components[component] = {
      min: Math.min(...values),
      max: Math.max(...values),
      avg: values.reduce((a, b) => a + b, 0) / values.length,
      count: compLogs.length
    };
  });

  res.json(summary);
});

// Start server
const PORT = 3000;
app.listen(PORT, () => {
  console.log(`Telemetry server running on port ${PORT}`);
});