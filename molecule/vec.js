const NULL_VEC = { x: 0, y: 0, z: 0 };

function vecMag(vect1) {
  return Math.sqrt(vect1.x ** 2 + vect1.y ** 2 + vect1.z ** 2);
}
function vecAdd(vect1, vect2) {
  return {
    x: vect1.x + vect2.x,
    y: vect1.y + vect2.y,
    z: vect1.z + vect2.z,
  };
}
function vecSub(vect1, vect2) {
  return {
    x: vect1.x - vect2.x,
    y: vect1.y - vect2.y,
    z: vect1.z - vect2.z,
  };
}
function unitVec(vect1) {
  let mag = vecMag(vect1);
  if (mag == 0) return { x: 0, y: 0, z: 0 };
  return {
    x: vect1.x / mag,
    y: vect1.y / mag,
    z: vect1.z / mag,
  };
}

function posToVec(pos) {
  return {
    x: pos.x,
    y: pos.y,
    z: pos.z,
  };
}
function vecMultiply(vect1, scalar) {
  if (isNaN(scalar)) console.log("GK");
  return {
    x: vect1.x * scalar,
    y: vect1.y * scalar,
    z: vect1.z * scalar,
  };
}
function vecDot(vect1, vect2) {
  return vect1.x * vect2.x + vect1.y * vect2.y + vect1.z * vect2.z;
}
export {
  vecMag,
  vecAdd,
  vecSub,
  unitVec,
  posToVec,
  vecMultiply,
  vecDot,
  NULL_VEC,
};
