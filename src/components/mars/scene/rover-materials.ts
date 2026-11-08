import * as THREE from "three";

/**
 * The NASA file marks every material fully metallic, which renders near-black
 * without a studio HDR. Clone and re-balance so the textures read under scene light.
 */
export function balanceRoverMaterial(mat: THREE.Material): THREE.Material {
  const sm = (mat as THREE.MeshStandardMaterial).clone();
  if (!sm.isMeshStandardMaterial) return mat;
  const name = sm.name.toLowerCase();
  if (name.includes("silver") || name.includes("foil")) {
    sm.metalness = 0.85;
    sm.roughness = 0.35;
  } else if (name.includes("panels")) {
    sm.metalness = 0.35;
    sm.roughness = 0.38;
  } else {
    sm.metalness = 0.2;
    sm.roughness = Math.max(sm.roughness, 0.5);
  }
  sm.envMapIntensity = 1;
  return sm;
}

export function prepareRoverMesh(o: THREE.Object3D) {
  const mesh = o as THREE.Mesh;
  if (!mesh.isMesh) return;
  mesh.castShadow = true;
  mesh.receiveShadow = true;
  mesh.material = Array.isArray(mesh.material)
    ? mesh.material.map(balanceRoverMaterial)
    : balanceRoverMaterial(mesh.material);
}
