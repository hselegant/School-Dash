
/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
*/


import React, { useRef, useEffect, useMemo } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { useStore } from '../../store';
import { LANE_WIDTH, GameStatus } from '../../types';
import { audio } from '../System/Audio';

// Physics
const GRAVITY = 50;
const JUMP_FORCE = 16; 

// Geometries
const HEAD_GEO = new THREE.SphereGeometry(0.25, 16, 16);
const BODY_GEO = new THREE.BoxGeometry(0.4, 0.5, 0.25);
const ARM_GEO = new THREE.BoxGeometry(0.12, 0.4, 0.12);
const LEG_GEO = new THREE.BoxGeometry(0.14, 0.5, 0.14);
const BACKPACK_GEO = new THREE.BoxGeometry(0.35, 0.4, 0.15);
const SHADOW_GEO = new THREE.CircleGeometry(0.5, 32);
const CAP_GEO = new THREE.SphereGeometry(0.26, 16, 16, 0, Math.PI * 2, 0, Math.PI / 2);
const VISOR_GEO = new THREE.CylinderGeometry(0.26, 0.26, 0.05, 16, 1, false, 0, Math.PI);

// Hair Geometries
const PIGTAIL_GEO = new THREE.SphereGeometry(0.12, 8, 8);
const SPIKE_GEO = new THREE.ConeGeometry(0.06, 0.15, 6);

export const Player: React.FC = () => {
  const groupRef = useRef<THREE.Group>(null);
  const bodyRef = useRef<THREE.Group>(null);
  const shadowRef = useRef<THREE.Mesh>(null);
  
  const leftArmRef = useRef<THREE.Group>(null);
  const rightArmRef = useRef<THREE.Group>(null);
  const leftLegRef = useRef<THREE.Group>(null);
  const rightLegRef = useRef<THREE.Group>(null);

  const { status, laneCount, takeDamage, hasDoubleJump, activateImmortality, isImmortalityActive, avatarConfig } = useStore();
  
  const [lane, setLane] = React.useState(0);
  const targetX = useRef(0);
  
  const isJumping = useRef(false);
  const velocityY = useRef(0);
  const jumpsPerformed = useRef(0); 
  const spinRotation = useRef(0); 

  const touchStartX = useRef(0);
  const touchStartY = useRef(0);
  const isInvincible = useRef(false);
  const lastDamageTime = useRef(0);

  // Materials dependent on avatar configuration
  const materials = useMemo(() => {
      return {
          skin: new THREE.MeshStandardMaterial({ color: avatarConfig.skinColor }),
          shirt: new THREE.MeshStandardMaterial({ color: avatarConfig.shirtColor }), 
          pants: new THREE.MeshStandardMaterial({ color: avatarConfig.pantsColor }), 
          hair: new THREE.MeshStandardMaterial({ color: avatarConfig.hairColor }),
          backpack: new THREE.MeshStandardMaterial({ color: '#FFEB3B' }), 
          cap: new THREE.MeshStandardMaterial({ color: avatarConfig.shirtColor }), // Match shirt
          glasses: new THREE.MeshStandardMaterial({ color: '#333' }),
          headphones: new THREE.MeshStandardMaterial({ color: '#1976D2' }),
          shadow: new THREE.MeshBasicMaterial({ color: '#000000', opacity: 0.2, transparent: true }),
      };
  }, [avatarConfig]);

  useEffect(() => {
      if (status === GameStatus.PLAYING) {
          isJumping.current = false;
          jumpsPerformed.current = 0;
          velocityY.current = 0;
          spinRotation.current = 0;
          if (groupRef.current) groupRef.current.position.y = 0;
          if (bodyRef.current) bodyRef.current.rotation.x = 0;
          setLane(0);
      }
  }, [status]);
  
  useEffect(() => {
      const maxLane = Math.floor(laneCount / 2);
      if (Math.abs(lane) > maxLane) {
          setLane(l => Math.max(Math.min(l, maxLane), -maxLane));
      }
  }, [laneCount, lane]);

  const triggerJump = () => {
    const maxJumps = hasDoubleJump ? 2 : 1;
    if (!isJumping.current) {
        audio.playJump(false);
        isJumping.current = true;
        jumpsPerformed.current = 1;
        velocityY.current = JUMP_FORCE;
    } else if (jumpsPerformed.current < maxJumps) {
        audio.playJump(true);
        jumpsPerformed.current += 1;
        velocityY.current = JUMP_FORCE; 
        spinRotation.current = 0; 
    }
  };

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (status !== GameStatus.PLAYING) return;
      const maxLane = Math.floor(laneCount / 2);
      if (e.key === 'ArrowLeft') setLane(l => Math.max(l - 1, -maxLane));
      else if (e.key === 'ArrowRight') setLane(l => Math.min(l + 1, maxLane));
      else if (e.key === 'ArrowUp' || e.key === 'w') triggerJump();
      else if (e.key === ' ' || e.key === 'Enter') activateImmortality();
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [status, laneCount, hasDoubleJump, activateImmortality]);

  useEffect(() => {
    const handleTouchStart = (e: TouchEvent) => {
      touchStartX.current = e.touches[0].clientX;
      touchStartY.current = e.touches[0].clientY;
    };
    const handleTouchEnd = (e: TouchEvent) => {
        if (status !== GameStatus.PLAYING) return;
        const deltaX = e.changedTouches[0].clientX - touchStartX.current;
        const deltaY = e.changedTouches[0].clientY - touchStartY.current;
        const maxLane = Math.floor(laneCount / 2);

        if (Math.abs(deltaX) > Math.abs(deltaY) && Math.abs(deltaX) > 30) {
             if (deltaX > 0) setLane(l => Math.min(l + 1, maxLane));
             else setLane(l => Math.max(l - 1, -maxLane));
        } else if (Math.abs(deltaY) > Math.abs(deltaX) && deltaY < -30) {
            triggerJump();
        } else if (Math.abs(deltaX) < 10 && Math.abs(deltaY) < 10) {
            activateImmortality();
        }
    };
    window.addEventListener('touchstart', handleTouchStart);
    window.addEventListener('touchend', handleTouchEnd);
    return () => {
        window.removeEventListener('touchstart', handleTouchStart);
        window.removeEventListener('touchend', handleTouchEnd);
    };
  }, [status, laneCount, hasDoubleJump, activateImmortality]);

  useFrame((state, delta) => {
    if (!groupRef.current) return;
    // Allow rendering in Shop and Avatar Select so we can see the character
    const allowedStates = [GameStatus.PLAYING, GameStatus.SHOP, GameStatus.AVATAR_SELECT, GameStatus.MENU];
    if (!allowedStates.includes(status)) return;
    
    // In Menu/Avatar Select, center the character
    if (status === GameStatus.MENU || status === GameStatus.AVATAR_SELECT) {
        targetX.current = 0;
        // Float animation
        const time = state.clock.elapsedTime;
        groupRef.current.rotation.y = Math.sin(time) * 0.1;
        groupRef.current.position.y = Math.sin(time * 2) * 0.1;
        
        // Reset limb rotations for idle pose
        if (leftArmRef.current) leftArmRef.current.rotation.x = 0;
        if (rightArmRef.current) rightArmRef.current.rotation.x = 0;
        if (leftLegRef.current) leftLegRef.current.rotation.x = 0;
        if (rightLegRef.current) rightLegRef.current.rotation.x = 0;
        
    } else {
        // Gameplay Physics
        targetX.current = lane * LANE_WIDTH;
        groupRef.current.rotation.y = 0;
        
        if (isJumping.current) {
            groupRef.current.position.y += velocityY.current * delta;
            velocityY.current -= GRAVITY * delta;

            if (groupRef.current.position.y <= 0) {
                groupRef.current.position.y = 0;
                isJumping.current = false;
                jumpsPerformed.current = 0;
                velocityY.current = 0;
                if (bodyRef.current) bodyRef.current.rotation.x = 0;
            }

            if (jumpsPerformed.current === 2 && bodyRef.current) {
                 spinRotation.current -= delta * 15;
                 bodyRef.current.rotation.x = spinRotation.current;
            }
        }
        
        // Running Animation
        const time = state.clock.elapsedTime * 20; 
        if (!isJumping.current) {
            if (leftArmRef.current) leftArmRef.current.rotation.x = Math.sin(time) * 0.8;
            if (rightArmRef.current) rightArmRef.current.rotation.x = Math.sin(time + Math.PI) * 0.8;
            if (leftLegRef.current) leftLegRef.current.rotation.x = Math.sin(time + Math.PI) * 1.0;
            if (rightLegRef.current) rightLegRef.current.rotation.x = Math.sin(time) * 1.0;
            if (bodyRef.current) bodyRef.current.position.y = 0.75 + Math.abs(Math.sin(time)) * 0.05;
        } else {
            if (bodyRef.current && jumpsPerformed.current !== 2) bodyRef.current.position.y = 0.8; 
            if (leftLegRef.current) leftLegRef.current.rotation.x = 0.5;
            if (rightLegRef.current) rightLegRef.current.rotation.x = -0.5;
        }
    }

    groupRef.current.position.x = THREE.MathUtils.lerp(groupRef.current.position.x, targetX.current, delta * 15);
    
    if (status === GameStatus.PLAYING) {
        const xDiff = targetX.current - groupRef.current.position.x;
        groupRef.current.rotation.z = -xDiff * 0.2; 
    } else {
        groupRef.current.rotation.z = 0;
    }

    if (shadowRef.current) {
        const height = groupRef.current.position.y;
        const scale = Math.max(0.2, 1 - (height / 2.5) * 0.5); 
        shadowRef.current.scale.setScalar(scale);
    }

    const showFlicker = (isInvincible.current || isImmortalityActive) && status === GameStatus.PLAYING;
    if (showFlicker) {
        if (isInvincible.current && Date.now() - lastDamageTime.current > 1500) {
            isInvincible.current = false;
            groupRef.current.visible = true;
        } else {
            groupRef.current.visible = Math.floor(Date.now() / 50) % 2 === 0;
        }
        if (isImmortalityActive) groupRef.current.visible = true; 
    } else {
        groupRef.current.visible = true;
    }
  });

  useEffect(() => {
     const checkHit = () => {
        if (isInvincible.current || isImmortalityActive) return;
        audio.playDamage();
        takeDamage();
        isInvincible.current = true;
        lastDamageTime.current = Date.now();
     };
     window.addEventListener('player-hit', checkHit);
     return () => window.removeEventListener('player-hit', checkHit);
  }, [takeDamage, isImmortalityActive]);

  // --- Render Components for Styles ---

  const renderHair = () => {
      if (avatarConfig.accessory === 'CAP') return null; // Hide hair under cap for simplicity

      switch(avatarConfig.hairStyle) {
          case 'SPIKY':
              return (
                  <group position={[0, 0.85, 0]}>
                      <mesh geometry={HEAD_GEO} material={materials.hair} scale={[0.95, 0.5, 0.95]} position={[0, 0, 0]} />
                      {[...Array(5)].map((_, i) => (
                          <mesh key={i} geometry={SPIKE_GEO} material={materials.hair} 
                              position={[(i-2)*0.12, 0.15, 0]} 
                              rotation={[0, 0, (i-2)*-0.2]} 
                          />
                      ))}
                  </group>
              );
          case 'PIGTAILS':
              return (
                  <group position={[0, 0.65, 0]}>
                       <mesh geometry={HEAD_GEO} material={materials.hair} scale={[1.02, 1.02, 1.02]} />
                       <mesh geometry={PIGTAIL_GEO} material={materials.hair} position={[0.25, 0.1, -0.1]} />
                       <mesh geometry={PIGTAIL_GEO} material={materials.hair} position={[-0.25, 0.1, -0.1]} />
                  </group>
              );
          case 'SHORT':
          default:
              return (
                  <mesh position={[0, 0.65, 0]} scale={[1.02, 1.02, 1.02]}>
                      <sphereGeometry args={[0.25, 16, 16, 0, Math.PI * 2, 0, Math.PI/1.8]} />
                      <meshStandardMaterial color={avatarConfig.hairColor} />
                  </mesh>
              );
      }
  };

  return (
    <group ref={groupRef}>
      <group ref={bodyRef} position={[0, 0.75, 0]}>
         {/* Body (Shirt) */}
         <mesh position={[0, 0.25, 0]} geometry={BODY_GEO} material={materials.shirt} />
         
         {/* Head */}
         <mesh position={[0, 0.65, 0]} geometry={HEAD_GEO} material={materials.skin} />

         {/* Hair */}
         {renderHair()}

         {/* Accessories */}
         {avatarConfig.accessory === 'BACKPACK' && (
             <mesh position={[0, 0.3, -0.2]} geometry={BACKPACK_GEO} material={materials.backpack} />
         )}
         
         {avatarConfig.accessory === 'CAP' && (
             <group position={[0, 0.7, 0]} rotation={[-0.2, 0, 0]}>
                 <mesh geometry={CAP_GEO} material={materials.cap} />
                 <mesh position={[0, -0.1, 0.25]} rotation={[Math.PI/2, 0, 0]} geometry={VISOR_GEO} material={materials.cap} />
             </group>
         )}

         {avatarConfig.accessory === 'GLASSES' && (
             <mesh position={[0, 0.65, 0.22]} rotation={[0, 0, 0]}>
                 <torusGeometry args={[0.08, 0.02, 8, 16]} />
                 <meshStandardMaterial color="#333" />
                 <mesh position={[0.18, 0, 0]}>
                     <torusGeometry args={[0.08, 0.02, 8, 16]} />
                     <meshStandardMaterial color="#333" />
                 </mesh>
             </mesh>
         )}

         {avatarConfig.accessory === 'HEADPHONES' && (
            <group position={[0, 0.68, 0]}>
                 {/* Band */}
                 <mesh rotation={[0, Math.PI/2, 0]}>
                    <torusGeometry args={[0.28, 0.03, 8, 16, Math.PI]} />
                    <meshStandardMaterial color="#333" />
                 </mesh>
                 {/* Cups */}
                 <mesh position={[0.26, -0.1, 0]} rotation={[0, 0, Math.PI/2]}>
                     <cylinderGeometry args={[0.08, 0.08, 0.05]} />
                     <meshStandardMaterial color={avatarConfig.shirtColor} />
                 </mesh>
                  <mesh position={[-0.26, -0.1, 0]} rotation={[0, 0, Math.PI/2]}>
                     <cylinderGeometry args={[0.08, 0.08, 0.05]} />
                     <meshStandardMaterial color={avatarConfig.shirtColor} />
                 </mesh>
            </group>
         )}

         {/* Arms */}
         <group position={[0.26, 0.4, 0]}>
             <mesh ref={rightArmRef} position={[0, -0.15, 0]} geometry={ARM_GEO} material={materials.skin} />
             {/* Sleeve */}
             <mesh position={[0, 0.1, 0]} geometry={new THREE.BoxGeometry(0.13, 0.15, 0.13)} material={materials.shirt} />
         </group>
         <group position={[-0.26, 0.4, 0]}>
             <mesh ref={leftArmRef} position={[0, -0.15, 0]} geometry={ARM_GEO} material={materials.skin} />
             {/* Sleeve */}
             <mesh position={[0, 0.1, 0]} geometry={new THREE.BoxGeometry(0.13, 0.15, 0.13)} material={materials.shirt} />
         </group>

         {/* Legs (Pants) */}
         <group position={[0.1, 0, 0]}>
             <mesh ref={rightLegRef} position={[0, -0.25, 0]} geometry={LEG_GEO} material={materials.pants} />
         </group>
         <group position={[-0.1, 0, 0]}>
             <mesh ref={leftLegRef} position={[0, -0.25, 0]} geometry={LEG_GEO} material={materials.pants} />
         </group>
         
         {/* Aura for Immortality */}
         {isImmortalityActive && (
             <mesh position={[0, 0.25, 0]} scale={[2, 2, 2]}>
                 <sphereGeometry args={[0.5, 16, 16]} />
                 <meshBasicMaterial color="white" transparent opacity={0.3} />
             </mesh>
         )}
      </group>
      <mesh ref={shadowRef} position={[0, 0.02, 0]} rotation={[-Math.PI/2, 0, 0]} geometry={SHADOW_GEO} material={materials.shadow} />
    </group>
  );
};
