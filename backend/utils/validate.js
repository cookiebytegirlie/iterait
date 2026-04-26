// Returns true only for a string or number that represents a whole positive integer.
function isPositiveInt(v) {
  const n = Number(v);
  return Number.isInteger(n) && n > 0;
}

// Max lengths for user-supplied strings stored in the DB.
const MAX = {
  projectName: 200,
  fileName:    200,
  label:       200,
  chainName:   200,
  targetTool:  100,
  sourceTool:  100,
};

module.exports = { isPositiveInt, MAX };
