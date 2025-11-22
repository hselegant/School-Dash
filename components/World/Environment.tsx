/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
*/


import React, { useRef, useMemo } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { useStore } from '../../store';
import { LANE_WIDTH } from '../../types';

const CloudField: React.FC = () => {
  const speed = useStore(state => state.speed);
  const count = 40;
  const meshRef = useRef<THREE.InstancedMesh>(null);
  const dummy = useMemo(() => new THREE.Object3D(), []);
  
  const particles = useMemo(() => {
    const data = [];
    for (let i = 0; i < count; i++) {
      const x = (Math.random() - 0.5) * 200;
      // Keep away from center
      const xOffset = x > 0 ? 30 : -30;
      const finalX = x + xOffset;
      
      data.push({
        position: new THREE.Vector3(finalX, 15 + Math.random() * 20, -Math.random() * 200),
        scale: 3 + Math.random() * 5,
        speedMulti: 0.5 + Math.random() * 0.5
      });
    }
    return data;
  }, []);

  useFrame((state, delta) => {
    if (!meshRef.current) return;
    const activeSpeed = speed > 0 ? speed : 2;

    particles.forEach((p, i) => {
        p.position.z += activeSpeed * delta * p.speedMulti * 0.5;
        
        if (p.position.z > 50) {
            p.position.z = -200;
            p.position.x = (Math.random() - 0.5) * 200;
            if (Math.abs(p.position.x) < 30) p.position.x += 40;
        }

        dummy.position.copy(p.position);
        dummy.scale.setScalar(p.scale);
        dummy.updateMatrix();
        meshRef.current!.setMatrixAt(i, dummy.matrix);
    });
    meshRef.current.instanceMatrix.needsUpdate = true;
  });

  return (
    <instancedMesh ref={meshRef} args={[undefined, undefined, count]}>
       <sphereGeometry args={[1, 7, 7]} />
       <meshStandardMaterial color="white" flatShading opacity={0.9} transparent />
    </instancedMesh>
  );
};

const TreeLine: React.FC = () => {
    const speed = useStore(state => state.speed);
    const groupRef = useRef<THREE.Group>(null);
    const trees = useMemo(() => {
        const items = [];
        for (let i = 0; i < 40; i++) {
            items.push({
                x: (i % 2 === 0 ? 1 : -1) * (15 + Math.random() * 10),
                z: -Math.random() * 200,
                scale: 0.8 + Math.random() * 0.5,
                type: Math.random() > 0.5 ? 'pine' : 'round'
            });
        }
        return items;
    }, []);

    useFrame((state, delta) => {
        if (groupRef.current) {
             const activeSpeed = speed > 0 ? speed : 2;
             groupRef.current.children.forEach((child) => {
                 child.position.z += activeSpeed * delta;
                 if (child.position.z > 20) {
                     child.position.z = -200;
                 }
             });
        }
    });

    return (
        <group ref={groupRef}>
            {trees.map((t, i) => (
                <group key={i} position={[t.x, 0, t.z]} scale={[t.scale, t.scale, t.scale]}>
                    {/* Trunk */}
                    <mesh position={[0, 1, 0]}>
                        <cylinderGeometry args={[0.3, 0.4, 2, 6]} />
                        <meshStandardMaterial color="#5D4037" />
                    </mesh>
                    {/* Leaves */}
                    {t.type === 'pine' ? (
                        <mesh position={[0, 3, 0]}>
                            <coneGeometry args={[1.5, 4, 7]} />
                            <meshStandardMaterial color="#2E7D32" />
                        </mesh>
                    ) : (
                        <mesh position={[0, 3.5, 0]}>
                            <dodecahedronGeometry args={[1.5]} />
                            <meshStandardMaterial color="#4CAF50" />
                        </mesh>
                    )}
                </group>
            ))}
        </group>
    );
};

const SchoolTrack: React.FC = () => {
    const { laneCount } = useStore();
    
    const trackWidth = laneCount * LANE_WIDTH + 2;
    
    return (
        <group>
             {/* Grass Field */}
            <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -0.1, -50]}>
                <planeGeometry args={[300, 300]} />
                <meshStandardMaterial color="#7CB342" />
            </mesh>

            {/* Running Track Clay */}
            <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -0.05, -50]}>
                <planeGeometry args={[trackWidth, 300]} />
                <meshStandardMaterial color="#D84315" roughness={1} />
            </mesh>

            {/* Lane Lines */}
            {Array.from({ length: laneCount + 1 }).map((_, i) => {
                const x = -(laneCount * LANE_WIDTH) / 2 + (i * LANE_WIDTH);
                return (
                    <mesh key={i} position={[x, -0.04, -50]} rotation={[-Math.PI / 2, 0, 0]}>
                        <planeGeometry args={[0.1, 300]} />
                        <meshBasicMaterial color="white" opacity={0.6} transparent />
                    </mesh>
                );
            })}
        </group>
    );
};

const Sun: React.FC = () => {
    return (
        <group position={[50, 80, -100]}>
             <mesh>
                 <sphereGeometry args={[15, 32, 32]} />
                 <meshBasicMaterial color="#FDB813" />
             </mesh>
             <pointLight intensity={1.5} color="#FFF9C4" distance={500} decay={0} />
        </group>
    );
};

export const Environment: React.FC = () => {
  return (
    <>
      <color attach="background" args={['#87CEEB']} />
      <fog attach="fog" args={['#87CEEB', 40, 140]} />
      
      <ambientLight intensity={0.8} color="#ffffff" />
      <directionalLight 
        position={[50, 100, 50]} 
        intensity={1.2} 
        color="#ffffff" 
        castShadow 
        shadow-mapSize={[1024, 1024]}
      />
      
      <Sun />
      <CloudField />
      <TreeLine />
      <SchoolTrack />
    </>
  );
};