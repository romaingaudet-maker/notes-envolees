/* ------------------------------------------------------------------
   Ce que la page voit de la version laine
------------------------------------------------------------------- */
const KIT = {
  T, TAU, DEG, clamp, sat, lerp, smooth, easeOut, easeIn, easeInOut, easeOutBack, bump, v3, v2, col, rng, hashi, vnoise3, fbm3,
  NOTE_COL, NOTE_ORDER, wool, fuzz, plastic, woodMat, glassMat, metalMat, glowMat, resinMat, lighten, darken,
  blobGeo, latheGeo, yarnGeo, feltGeo, curveOf, scaleUV, mergeGeos, applyM,
  circleShape, ellipseShape, roundRectShape, starShape, heartShape, leafShape, cloudShape, crescentShape, polyShape, blobShape,
  mesh, woolBall, yarn, felt, feltPiece, stitches, insetPoly, outline2D, bead, sewnButton, contactShadow,
  makeView, frameCamera, boilable, studioLights, practical, cyclo, terrain, flatLayer, hillShape, hang, swingAnim,
  tree, grass, grassTuft, flower, cloud, sun, moon, star, addFace, stone, cottage, fence, water, wallPanel, scatter, flame,
  pointCloud, confetti, fallers,
  at, grp, surf, faceTo, limb, faceOn, blinker, doll, critter, bird, noteBird,
  sprite, pattern,
};
window.Laine = Object.assign(window.Laine || {}, { Engine, SCENES, KIT, FPS });
