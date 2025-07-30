/**
 * Creates a transformation function that maps values from a given domain (input range)
 * to a specified range (output range, typically a viewport like pixels).
 * This function is particularly useful for converting data coordinates to screen coordinates (e.g., for X or Y axes).
 *
 * @param {Array<number>} domain - The input range of values [min, max] (e.g., the minimum and maximum values in your dataset).
 * @param {Array<number>} range - The output range of values [min, max] (e.g., pixel coordinates on a screen).
 * The order of range[0] and range[1] determines the direction of the transformation.
 * For example, [0, 500] means values increase from top to bottom, while [500, 0] means values increase from bottom to top (common for Y-axes).
 * @returns {function(number): number} A new function that takes a single number (from the domain)
 * and returns its transformed value within the specified range.
 */
function createViewportTransformer(domain, range) {
  const dMin = domain[0];
  const dMax = domain[1];
  const rMin = range[0];
  const rMax = range[1];

  const dLength = dMax - dMin;
  const rLength = rMax - rMin;

  // Handle the edge case where the domain has a length of zero to prevent division by zero.
  if (dLength === 0) {
    console.warn("Warning: Domain length is zero. Transformation may be undefined.");
    // In this case, you might throw an error or return a function that always returns a specific value (e.g., the start of the range or its midpoint).
    return (x) => rMin;
  }

  // truncate the number to two decimal places
  function trunc2(n) {
    return Number(n.toFixed(2));
  }

  // Return the actual transformation function (a closure)
  return (x) => {
    // Normalize the input 'x' to a 0-1 scale within the domain.
    const normalizedX = (x - dMin) / dLength;
    // Map the normalized value to the output range.
    const transformedValue = rMin + (rLength * normalizedX);

    // Use Math.trunc to convert the value to an integer, matching the original 'trunc' intent.
    // If floating-point precision is needed, remove Math.trunc.
    return trunc2(transformedValue);
  };
};


export {
  createViewportTransformer,
}