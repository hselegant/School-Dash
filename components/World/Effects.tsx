/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
*/


import React from 'react';
import { EffectComposer, Bloom, Vignette } from '@react-three/postprocessing';

export const Effects: React.FC = () => {
  return (
    <EffectComposer disableNormalPass multisampling={0}>
      {/* Subtle bloom for the sun and white items, not overwhelming */}
      <Bloom 
        luminanceThreshold={0.9} 
        mipmapBlur 
        intensity={0.4} 
        radius={0.4}
      />
      <Vignette eskil={false} offset={0.1} darkness={0.2} />
    </EffectComposer>
  );
};