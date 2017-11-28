
/* Calculates the transformations from photo to world space and vice versa. */
function computeTransforms(pins) {
  var coords = [];
  for (var i = 0; i < 4; i++) {
    coords.push({'sx': pins[i].photo[0], 'sy': pins[i].photo[1],
                 'tx': pins[i].world[0], 'ty': pins[i].world[1]});
  }
  photoToWorld = solveProjection(coords);

  var coords = [];
  for (var i = 0; i < 4; i++) {
    coords.push({'sx': pins[i].world[0], 'sy': pins[i].world[1],
                 'tx': pins[i].photo[0], 'ty': pins[i].photo[1]});
  }
  worldToPhoto = solveProjection(coords);

  return [photoToWorld, worldToPhoto];
}

/* Finds the coefficients for a projective transform. */
function solveProjection(coords) {
  var a = [];
  var b = [];
  for (var i = 0; i < 4; i++) {
    var c = coords[i];
    a.push([c.sx, c.sy, 1, 0, 0, 0, -c.sx*c.tx, -c.sy*c.tx]);
    a.push([0, 0, 0, c.sx, c.sy, 1, -c.sx*c.ty, -c.sy*c.ty]);
    b.push(c.tx);
    b.push(c.ty);
  }
  return solveSystem(a, b);
}

/* Solves a system of linear equations. */
function solveSystem(a, b) {
  var pivoted = [];

  for (var i = 0; i < a.length; i++) {
    // Select a pivot.
    var rc = findLargestMagnitude(a, pivoted);
    var prow = rc[0], pcol = rc[1];
    if (a[prow][pcol] === 0) {
      return null;  // singular matrix, boo :(
    }
    pivoted[pcol] = 1;

    // Move the pivot row into position.
    swapElements(a, prow, pcol);
    swapElements(b, prow, pcol);

    // Divide the pivot row so that the pivot cell becomes 1.
    divideRow(a, b, pcol, a[pcol][pcol]);

    // Use the pivot row to zero out the pivot column in all the other rows.
    for (var r = 0; r < a.length; r++) {
      if (r !== pcol) {
        addRow(a, b, pcol, -a[r][pcol], r);
      }
    }
  }

  // At this point a is the identity matrix, so the answers are in b!
  return b;
}

function findLargestMagnitude(a, pivoted) {
  var largest = 0;
  var prow, pcol;
  for (var r = 0; r < a.length; r++) {
    if (!pivoted[r]) {  // in a row that hasn't been the pivot yet
      for (var c = 0; c < a.length; c++) {
        if (!pivoted[c]) {  // in a column that hasn't been the pivot yet
          var magnitude = Math.abs(a[r][c]);
          if (magnitude >= largest) {
            largest = magnitude;
            prow = r;
            pcol = c;
          }
        }
      }
    }
  }
  return [prow, pcol];
}

function swapElements(array, i, j) {
  if (i !== j) {
    var temp = array[i];
    array[i] = array[j];
    array[j] = temp;
  }
}

function divideRow(matrix, array, r, divisor) {
  var row = matrix[r];
  for (var c = 0; c < row.length; c++) {
    row[c] /= divisor;
  }
  array[r] /= divisor;
}

function addRow(matrix, array, sourceRow, multiplier, targetRow) {
  for (var c = 0; c < matrix[sourceRow].length; c++) {
    matrix[targetRow][c] += matrix[sourceRow][c] * multiplier;
  }
  array[targetRow] += array[sourceRow] * multiplier;
}

function applyTransform(coeffs, x, y) {
  if (coeffs) {
    var divisor = coeffs[6]*x + coeffs[7]*y + 1;
    return [(coeffs[0]*x + coeffs[1]*y + coeffs[2]) / divisor,
            (coeffs[3]*x + coeffs[4]*y + coeffs[5]) / divisor];
  }
}
