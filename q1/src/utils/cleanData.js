/* Process all the data by checking if they are a num or not,
  Interpolate if speed drops and clamp the speed(remove if speed is not real exp 345km/h)
*/ 

// Helper function to check if input data is correct type (Float)
const checkData = (value) => {
  if (value === null || value === undefined) return null;
  const num = parseFloat(value);
  return isNaN(num) ? null : num;
}

// Clean speed: handle interpolation / clamping
const processSpeeds = (data, minSpeed = 40, maxSpeed = 150) => {
  // Remove impossible spikes
  let filtered = data.filter(d => d.speed === null || d.speed <= maxSpeed);

  // interpolate temporary drops
  return filtered.map((entry, i, arr) => {
    const s = entry.speed;
    if (s === null || s >= minSpeed) return entry; 

    // First or last element: just clamp to minSpeed
    if (i === 0 || i === arr.length - 1) {
      return { ...entry, speed: minSpeed };
    }

    // interpolate speed data neighbors
    const prev = arr[i - 1].speed ?? minSpeed;
    const next = arr[i + 1].speed ?? minSpeed;

    return { ...entry, speed: (prev + next) / 2 };
  });
};

export const cleanData = (rawData) => {
  // Normalise the values
  const normalised = rawData.map(entry => {
    const timestamp = checkData(entry.timestamp);
    const speed = checkData(entry.speed);
    const battery = checkData(entry.battery);
    const motorTemp = checkData(entry.motorTemp);
    const lat = entry.gps ? checkData(entry.gps.lat) : null;
    const lng = entry.gps ? checkData(entry.gps.lng) : null;
    const gps = (lat !== null && lng !== null) ? { lat, lng } : null;

    return { timestamp, speed, battery, motorTemp, gps };
  })
  // Remove entries with missing timestamp
  .filter(e => e.timestamp !== null);

  // process speeds (interpolate drops, remove spikes)
  const cleanedSpeeds = processSpeeds(normalised);

  return cleanedSpeeds;
};
