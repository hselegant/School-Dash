
/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
*/


import React, { useRef, useEffect, useState, useMemo } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { Text3D, Center, Float } from '@react-three/drei';
import { v4 as uuidv4 } from 'uuid';
import { useStore } from '../../store';
import { GameObject, ObjectType, LANE_WIDTH, SPAWN_DISTANCE, REMOVE_DISTANCE, GameStatus, GEMINI_COLORS } from '../../types';
import { audio } from '../System/Audio';

// --- Geometries ---

// Homework Pile (Obstacle)
const BOOK_GEO = new THREE.BoxGeometry(0.8, 0.2, 0.6);

// Teacher (Alien)
const TEACHER_BODY = new THREE.CylinderGeometry(0.3, 0.3, 1.2, 8);
const TEACHER_HEAD = new THREE.SphereGeometry(0.35, 16, 16);
const GLASSES_GEO = new THREE.TorusGeometry(0.1, 0.02, 8, 16);

// Paper Airplane (Missile)
const PLANE_GEO = new THREE.ConeGeometry(0.4, 1.0, 3);
PLANE_GEO.scale(1, 0.2, 1); 

// Medal (Gem)
const MEDAL_GEO = new THREE.CylinderGeometry(0.3, 0.3, 0.05, 16);
const RIBBON_GEO = new THREE.TorusGeometry(0.3, 0.05, 8, 16);

// Pencil (Gem Variant)
const PENCIL_BODY = new THREE.CylinderGeometry(0.08, 0.08, 0.8, 8);
const PENCIL_TIP = new THREE.ConeGeometry(0.08, 0.2, 8);

// Shop
const SHOP_BODY_GEO = new THREE.BoxGeometry(1, 4, 2); // Bus body look
const SHOP_WHEEL_GEO = new THREE.CylinderGeometry(0.5, 0.5, 0.4, 12);

// Shadow
const SHADOW_GEO = new THREE.CircleGeometry(0.6, 16);

// Font
const FONT_URL = "https://cdn.jsdelivr.net/npm/three/examples/fonts/helvetiker_bold.typeface.json";

const PARTICLE_COUNT = 200;
const BASE_LETTER_INTERVAL = 150; 

const getLetterInterval = (level: number) => {
    return BASE_LETTER_INTERVAL * Math.pow(1.5, Math.max(0, level - 1));
};

const MISSILE_SPEED = 25; // Paper planes are fast

// --- Particle System (Confetti/Chalk dust) ---
const ParticleSystem: React.FC = () => {
    const mesh = useRef<THREE.InstancedMesh>(null);
    const dummy = useMemo(() => new THREE.Object3D(), []);
    
    const particles = useMemo(() => new Array(PARTICLE_COUNT).fill(0).map(() => ({
        life: 0,
        pos: new THREE.Vector3(),
        vel: new THREE.Vector3(),
        rot: new THREE.Vector3(),
        color: new THREE.Color()
    })), []);

    useEffect(() => {
        const handleExplosion = (e: CustomEvent) => {
            const { position, color } = e.detail;
            let spawned = 0;
            const burstAmount = 30; 

            for(let i = 0; i < PARTICLE_COUNT; i++) {
                const p = particles[i];
                if (p.life <= 0) {
                    p.life = 1.0 + Math.random() * 0.5; 
                    p.pos.set(position[0], position[1], position[2]);
                    
                    p.vel.set(
                        (Math.random() - 0.5) * 5,
                        (Math.random() * 5) + 2,
                        (Math.random() - 0.5) * 5
                    );
                    
                    p.color.set(color);
                    spawned++;
                    if (spawned >= burstAmount) break;
                }
            }
        };
        
        window.addEventListener('particle-burst', handleExplosion as any);
        return () => window.removeEventListener('particle-burst', handleExplosion as any);
    }, [particles]);

    useFrame((state, delta) => {
        if (!mesh.current) return;
        const safeDelta = Math.min(delta, 0.1);

        particles.forEach((p, i) => {
            if (p.life > 0) {
                p.life -= safeDelta * 2.0;
                p.pos.addScaledVector(p.vel, safeDelta);
                p.vel.y -= safeDelta * 9.8; // Gravity
                
                dummy.position.copy(p.pos);
                const scale = Math.max(0, p.life * 0.3);
                dummy.scale.set(scale, scale, scale);
                dummy.updateMatrix();
                
                mesh.current!.setMatrixAt(i, dummy.matrix);
                mesh.current!.setColorAt(i, p.color);
            } else {
                dummy.scale.set(0,0,0);
                dummy.updateMatrix();
                mesh.current!.setMatrixAt(i, dummy.matrix);
            }
        });
        
        mesh.current.instanceMatrix.needsUpdate = true;
        if (mesh.current.instanceColor) mesh.current.instanceColor.needsUpdate = true;
    });

    return (
        <instancedMesh ref={mesh} args={[undefined, undefined, PARTICLE_COUNT]}>
            <planeGeometry args={[0.3, 0.3]} />
            <meshBasicMaterial side={THREE.DoubleSide} toneMapped={false} transparent opacity={0.9} />
        </instancedMesh>
    );
};

const getRandomLane = (laneCount: number) => {
    const max = Math.floor(laneCount / 2);
    return Math.floor(Math.random() * (max * 2 + 1)) - max;
};

export const LevelManager: React.FC = () => {
  const { 
    status, speed, collectGem, collectLetter, collectedLetters,
    laneCount, setDistance, openShop, level
  } = useStore();
  
  const objectsRef = useRef<GameObject[]>([]);
  const [renderTrigger, setRenderTrigger] = useState(0);
  const prevStatus = useRef(status);
  const prevLevel = useRef(level);
  const playerObjRef = useRef<THREE.Object3D | null>(null);
  const distanceTraveled = useRef(0);
  const nextLetterDistance = useRef(BASE_LETTER_INTERVAL);

  // State Reset Logic
  useEffect(() => {
    const isRestart = status === GameStatus.PLAYING && prevStatus.current === GameStatus.GAME_OVER;
    const isMenuReset = status === GameStatus.MENU;
    const isLevelUp = level !== prevLevel.current && status === GameStatus.PLAYING;
    const isVictoryReset = status === GameStatus.PLAYING && prevStatus.current === GameStatus.VICTORY;

    if (isMenuReset || isRestart || isVictoryReset) {
        objectsRef.current = [];
        setRenderTrigger(t => t + 1);
        distanceTraveled.current = 0;
        nextLetterDistance.current = getLetterInterval(1);

    } else if (isLevelUp && level > 1) {
        objectsRef.current = objectsRef.current.filter(obj => obj.position[2] > -80);
        // School Bus Portal
        objectsRef.current.push({
            id: uuidv4(),
            type: ObjectType.SHOP_PORTAL,
            position: [0, 0, -120], 
            active: true,
        });
        nextLetterDistance.current = distanceTraveled.current - SPAWN_DISTANCE + getLetterInterval(level);
        setRenderTrigger(t => t + 1);
        
    } else if (status === GameStatus.GAME_OVER || status === GameStatus.VICTORY) {
        setDistance(Math.floor(distanceTraveled.current));
    }
    
    prevStatus.current = status;
    prevLevel.current = level;
  }, [status, level, setDistance]);

  useFrame((state) => {
      if (!playerObjRef.current) {
          const group = state.scene.getObjectByName('PlayerGroup');
          if (group && group.children.length > 0) playerObjRef.current = group.children[0];
      }
  });

  useFrame((state, delta) => {
    if (status !== GameStatus.PLAYING) return;

    const safeDelta = Math.min(delta, 0.05); 
    const dist = speed * safeDelta;
    distanceTraveled.current += dist;

    let hasChanges = false;
    let playerPos = new THREE.Vector3(0, 0, 0);
    if (playerObjRef.current) playerObjRef.current.getWorldPosition(playerPos);

    const currentObjects = objectsRef.current;
    const keptObjects: GameObject[] = [];
    const newSpawns: GameObject[] = [];

    for (const obj of currentObjects) {
        let moveAmount = dist;
        if (obj.type === ObjectType.MISSILE) moveAmount += MISSILE_SPEED * safeDelta;
        const prevZ = obj.position[2];
        obj.position[2] += moveAmount;
        
        // Teacher logic (Throwing paper planes/chalk)
        if (obj.type === ObjectType.ALIEN && obj.active && !obj.hasFired) {
             if (obj.position[2] > -80) {
                 obj.hasFired = true;
                 newSpawns.push({
                     id: uuidv4(),
                     type: ObjectType.MISSILE,
                     position: [obj.position[0], 1.5, obj.position[2] + 1],
                     active: true,
                     color: '#FFFFFF'
                 });
                 hasChanges = true;
             }
        }

        let keep = true;
        if (obj.active) {
            const zThreshold = 2.0; 
            const inZZone = (prevZ < playerPos.z + zThreshold) && (obj.position[2] > playerPos.z - zThreshold);
            
            if (obj.type === ObjectType.SHOP_PORTAL) {
                if (Math.abs(obj.position[2] - playerPos.z) < 3) { 
                     openShop();
                     obj.active = false;
                     hasChanges = true;
                     keep = false; 
                }
            } else if (inZZone) {
                const dx = Math.abs(obj.position[0] - playerPos.x);
                if (dx < 0.9) { 
                     const isDamageSource = obj.type === ObjectType.OBSTACLE || obj.type === ObjectType.ALIEN || obj.type === ObjectType.MISSILE;
                     
                     if (isDamageSource) {
                         const playerBottom = playerPos.y;
                         const playerTop = playerPos.y + 1.6;

                         let objBottom = obj.position[1] - 0.5;
                         let objTop = obj.position[1] + 0.5;

                         if (obj.type === ObjectType.OBSTACLE) { // Homework Pile
                             objBottom = 0;
                             objTop = 1.0; // Slightly shorter
                         } else if (obj.type === ObjectType.MISSILE) {
                             objBottom = 1.0;
                             objTop = 2.0;
                         }

                         if ((playerBottom < objTop) && (playerTop > objBottom)) { 
                             window.dispatchEvent(new Event('player-hit'));
                             obj.active = false; 
                             hasChanges = true;
                             if (obj.type === ObjectType.MISSILE) {
                                window.dispatchEvent(new CustomEvent('particle-burst', { 
                                    detail: { position: obj.position, color: '#ffffff' } 
                                }));
                             }
                         }
                     } else {
                         // Collectibles
                         if (Math.abs(obj.position[1] - playerPos.y) < 2.5) { 
                            if (obj.type === ObjectType.GEM) {
                                collectGem(obj.points || 75);
                                audio.playGemCollect();
                            }
                            if (obj.type === ObjectType.LETTER && obj.targetIndex !== undefined) {
                                collectLetter(obj.targetIndex);
                                audio.playLetterCollect();
                            }
                            window.dispatchEvent(new CustomEvent('particle-burst', { 
                                detail: { position: obj.position, color: obj.color || '#FFD700' } 
                            }));
                            obj.active = false;
                            hasChanges = true;
                         }
                     }
                }
            }
        }

        if (obj.position[2] > REMOVE_DISTANCE) {
            keep = false;
            hasChanges = true;
        }
        if (keep) keptObjects.push(obj);
    }

    if (newSpawns.length > 0) keptObjects.push(...newSpawns);

    // Spawning
    let furthestZ = -20;
    const staticObjects = keptObjects.filter(o => o.type !== ObjectType.MISSILE);
    if (staticObjects.length > 0) furthestZ = Math.min(...staticObjects.map(o => o.position[2]));

    if (furthestZ > -SPAWN_DISTANCE) {
         const minGap = 14 + (speed * 0.4); 
         const spawnZ = Math.min(furthestZ - minGap, -SPAWN_DISTANCE);
         
         const isLetterDue = distanceTraveled.current >= nextLetterDistance.current;

         if (isLetterDue) {
             const lane = getRandomLane(laneCount);
             const target = ['G','E','M','I','N','I'];
             const availableIndices = target.map((_, i) => i).filter(i => !collectedLetters.includes(i));

             if (availableIndices.length > 0) {
                 const chosenIndex = availableIndices[Math.floor(Math.random() * availableIndices.length)];
                 keptObjects.push({
                    id: uuidv4(),
                    type: ObjectType.LETTER,
                    position: [lane * LANE_WIDTH, 1.0, spawnZ], 
                    active: true,
                    color: GEMINI_COLORS[chosenIndex],
                    value: target[chosenIndex],
                    targetIndex: chosenIndex
                 });
                 nextLetterDistance.current += getLetterInterval(level);
                 hasChanges = true;
             } else {
                // Fallback to medal
                keptObjects.push({
                    id: uuidv4(),
                    type: ObjectType.GEM,
                    position: [lane * LANE_WIDTH, 1.0, spawnZ],
                    active: true,
                    color: '#FFD700',
                    points: 75, // Ensure 75 points
                    subType: 'medal'
                });
                hasChanges = true;
             }

         } else if (Math.random() > 0.1) { 
            const isObstacle = Math.random() > 0.30; // 70% Obstacle/Teacher

            if (isObstacle) {
                const spawnTeacher = level >= 2 && Math.random() < 0.3;
                
                if (spawnTeacher) {
                    // Spawn Teacher
                    const lane = getRandomLane(laneCount);
                    keptObjects.push({
                        id: uuidv4(),
                        type: ObjectType.ALIEN,
                        position: [lane * LANE_WIDTH, 1.0, spawnZ],
                        active: true,
                        color: '#3F51B5',
                        hasFired: false
                    });
                } else {
                    // Spawn Homework Pile
                    const lane = getRandomLane(laneCount);
                    keptObjects.push({
                        id: uuidv4(),
                        type: ObjectType.OBSTACLE,
                        position: [lane * LANE_WIDTH, 0.4, spawnZ],
                        active: true,
                        color: '#ffffff'
                    });
                    
                    // Maybe another pile next to it
                    if (Math.random() > 0.5 && laneCount > 1) {
                        let lane2 = lane + (Math.random() > 0.5 ? 1 : -1);
                        if (lane2 >= -(Math.floor(laneCount/2)) && lane2 <= Math.floor(laneCount/2)) {
                             keptObjects.push({
                                id: uuidv4(),
                                type: ObjectType.OBSTACLE,
                                position: [lane2 * LANE_WIDTH, 0.4, spawnZ],
                                active: true,
                                color: '#ffffff'
                            });
                        }
                    }
                }
            } else {
                // Spawn Collectible
                const lane = getRandomLane(laneCount);
                const isStationery = Math.random() > 0.5;
                keptObjects.push({
                    id: uuidv4(),
                    type: ObjectType.GEM,
                    position: [lane * LANE_WIDTH, 1.0, spawnZ],
                    active: true,
                    color: isStationery ? '#FF4081' : '#FFD700',
                    points: 75, // Ensure 75 points
                    subType: isStationery ? 'pencil' : 'medal'
                });
            }
            hasChanges = true;
         }
    }

    if (hasChanges) {
        objectsRef.current = keptObjects;
        setRenderTrigger(t => t + 1);
    }
  });

  return (
    <group>
      <ParticleSystem />
      {objectsRef.current.map(obj => {
        if (!obj.active) return null;
        return <GameEntity key={obj.id} data={obj} />;
      })}
    </group>
  );
};

const GameEntity: React.FC<{ data: GameObject }> = React.memo(({ data }) => {
    const groupRef = useRef<THREE.Group>(null);
    const { laneCount } = useStore();
    
    useFrame((state, delta) => {
        if (groupRef.current) {
            groupRef.current.position.set(data.position[0], 0, data.position[2]);
            
            if (data.type === ObjectType.GEM || data.type === ObjectType.LETTER) {
                groupRef.current.rotation.y += delta * 3;
                groupRef.current.position.y = data.position[1] + Math.sin(state.clock.elapsedTime * 5) * 0.2;
            } else if (data.type === ObjectType.MISSILE) {
                groupRef.current.position.y = data.position[1];
                groupRef.current.rotation.z += delta * 10; 
            } else {
                groupRef.current.position.y = data.position[1];
            }
        }
    });

    return (
        <group ref={groupRef} position={[data.position[0], 0, data.position[2]]}>
            <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.03, 0]} geometry={SHADOW_GEO}>
                <meshBasicMaterial color="#000000" opacity={0.2} transparent />
            </mesh>

            {/* --- SHOP PORTAL (School Bus) --- */}
            {data.type === ObjectType.SHOP_PORTAL && (
                <group position={[0, 1.5, 0]}>
                     <mesh geometry={SHOP_BODY_GEO} scale={[laneCount * LANE_WIDTH, 1, 1]}>
                         <meshStandardMaterial color="#FDB813" roughness={0.4} />
                     </mesh>
                     <mesh position={[0, 0.5, 1.01]}>
                         <planeGeometry args={[laneCount * LANE_WIDTH - 0.5, 1.5]} />
                         <meshBasicMaterial color="#333" />
                     </mesh>
                     <Text3D position={[-3, 1.5, 1.1]} font={FONT_URL} size={0.8} height={0.1}>
                         SCHOOL BUS
                         <meshBasicMaterial color="black" />
                     </Text3D>
                </group>
            )}

            {/* --- OBSTACLE (Homework) --- */}
            {data.type === ObjectType.OBSTACLE && (
                <group position={[0, 0, 0]}>
                    <mesh position={[0, 0, 0]} geometry={BOOK_GEO}>
                        <meshStandardMaterial color="white" />
                    </mesh>
                    <mesh position={[0.05, 0.2, 0]} rotation={[0, 0.2, 0]} geometry={BOOK_GEO}>
                        <meshStandardMaterial color="#eee" />
                    </mesh>
                    <mesh position={[-0.05, 0.4, 0]} rotation={[0, -0.1, 0]} geometry={BOOK_GEO}>
                        <meshStandardMaterial color="white" />
                    </mesh>
                    {/* Red cover top */}
                    <mesh position={[-0.05, 0.51, 0]} rotation={[0, -0.1, 0]}>
                        <planeGeometry args={[0.8, 0.6]} rotation={[-Math.PI/2, 0, 0]} />
                        <meshStandardMaterial color="#D32F2F" />
                    </mesh>
                </group>
            )}

            {/* --- TEACHER --- */}
            {data.type === ObjectType.ALIEN && (
                <group position={[0, 0.6, 0]}>
                    <mesh geometry={TEACHER_BODY}>
                        <meshStandardMaterial color="#3F51B5" /> {/* Suit */}
                    </mesh>
                    <mesh position={[0, 0.8, 0]} geometry={TEACHER_HEAD}>
                        <meshStandardMaterial color="#FFCC80" /> {/* Skin */}
                    </mesh>
                    <mesh position={[0, 0.8, 0.3]} geometry={GLASSES_GEO}>
                        <meshStandardMaterial color="#333" />
                    </mesh>
                </group>
            )}

            {/* --- MISSILE (Paper Plane) --- */}
            {data.type === ObjectType.MISSILE && (
                <group rotation={[Math.PI/2, 0, 0]} scale={[0.5, 0.5, 0.5]}>
                    <mesh geometry={PLANE_GEO}>
                        <meshStandardMaterial color="white" side={THREE.DoubleSide} />
                    </mesh>
                </group>
            )}

            {/* --- GEM (Medal / Pencil) --- */}
            {data.type === ObjectType.GEM && (
                <group>
                    {data.subType === 'medal' ? (
                        <group rotation={[Math.PI/2, 0, 0]}>
                             <mesh geometry={MEDAL_GEO}>
                                 <meshStandardMaterial color="#FFD700" metalness={0.8} roughness={0.2} />
                             </mesh>
                             <mesh geometry={RIBBON_GEO}>
                                 <meshStandardMaterial color="#D32F2F" />
                             </mesh>
                        </group>
                    ) : (
                        <group rotation={[0, 0, Math.PI/4]}>
                            <mesh geometry={PENCIL_BODY}>
                                <meshStandardMaterial color="#FFC107" />
                            </mesh>
                            <mesh position={[0, 0.5, 0]} geometry={PENCIL_TIP}>
                                <meshStandardMaterial color="#FFCC80" />
                            </mesh>
                             <mesh position={[0, 0.58, 0]} geometry={PENCIL_TIP} scale={[0.3, 0.3, 0.3]}>
                                <meshStandardMaterial color="#333" />
                            </mesh>
                             <mesh position={[0, -0.45, 0]}>
                                <cylinderGeometry args={[0.08, 0.08, 0.1, 8]} />
                                <meshStandardMaterial color="#F48FB1" /> {/* Eraser */}
                            </mesh>
                        </group>
                    )}
                </group>
            )}

            {/* --- LETTER --- */}
            {data.type === ObjectType.LETTER && (
                <group scale={[1.5, 1.5, 1.5]}>
                     <Center>
                         <Text3D 
                            font={FONT_URL} 
                            size={0.6} 
                            height={0.2} 
                            bevelEnabled
                            bevelThickness={0.02}
                            bevelSize={0.02}
                            bevelSegments={5}
                         >
                            {data.value}
                            <meshStandardMaterial color={data.color} />
                         </Text3D>
                     </Center>
                </group>
            )}
        </group>
    );
});
