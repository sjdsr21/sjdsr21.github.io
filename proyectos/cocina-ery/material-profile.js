// Appearance identity is independent of thickness, product offer and price.
export function connectProfiles(palette, registry) {
  const profiles = new Map(registry.entries.map(p => [p.appearanceId, p]));
  for (const finish of palette) {
    const profile = profiles.get(finish.id);
    if (!profile) continue;
    finish.appearanceId = profile.appearanceId;
    finish.renderProfile = profile;
    finish.roughness = profile.roughness;
    finish.metalness = profile.metalness;
    // Preserve project UV calibration when the central scale is provisional.
    if (profile.scaleStatus === 'declarada_no_calibrada') finish.size = [...profile.sizeMetres];
  }
  return palette;
}

export function applyRenderProfile(material, finish) {
  const p = finish?.renderProfile;
  if (!p) return;
  material.roughness = p.roughness;
  material.metalness = p.metalness;
  material.opacity = p.opacity;
  material.transparent = p.opacity < 1;
  material.depthWrite = p.opacity >= 1;
  if (material.isMeshPhysicalMaterial) {
    material.ior = p.ior;
    material.transmission = p.transmission;
    material.anisotropy = p.anisotropy;
    // Physical transmission carries transparency; don't attenuate twice.
    if (p.transmission > 0) {material.opacity = 1; material.transparent = false; material.depthWrite = true;}
  }
  material.userData.appearanceId = p.appearanceId;
  material.userData.renderProfile = p;
  material.needsUpdate = true;
}
