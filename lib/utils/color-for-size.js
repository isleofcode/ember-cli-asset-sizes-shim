module.exports = function colorForSize(size) {
  var color = 'grey';
  if (size > 1024) {
    color = 'white';
  }
  if (size > 1024 * 5) {
    color = 'green';
  }
  if (size > (1024 * 10)) {
    color = 'yellow';
  }
  if (size > (1024 * 50)) {
    color = 'magenta';
  }
  if (size > (1024 * 500)) {
    color = 'red';
  }

  return color;
};
