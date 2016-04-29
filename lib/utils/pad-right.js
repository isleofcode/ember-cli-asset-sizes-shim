module.exports = function padRight(str, l, p) {
  var s = str;
  while (s.length < l) {
    s += p;
  }
  return s;
};
