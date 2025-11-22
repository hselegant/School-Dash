/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
*/


import * as THREE from 'three';
import React from 'react';

// Add R3F type support for JSX elements
// Using 'any' to ensure compatibility and avoid strict property checks for R3F elements
export type ThreeElement = any;

declare global {
  namespace JSX {
    interface IntrinsicElements {
      // Core
      group: any;
      mesh: any;
      instancedMesh: any;
      primitive: any;
      object3D: any;

      // Geometries
      sphereGeometry: any;
      boxGeometry: any;
      planeGeometry: any;
      cylinderGeometry: any;
      coneGeometry: any;
      dodecahedronGeometry: any;
      circleGeometry: any;
      torusGeometry: any;
      ringGeometry: any;
      tetrahedronGeometry: any;
      icosahedronGeometry: any;
      octahedronGeometry: any;
      extrudeGeometry: any;
      capsuleGeometry: any;
      
      // Materials
      meshStandardMaterial: any;
      meshBasicMaterial: any;
      meshPhongMaterial: any;
      meshPhysicalMaterial: any;
      shaderMaterial: any;
      shadowMaterial: any;
      pointsMaterial: any;
      lineBasicMaterial: any;
      spriteMaterial: any;
      
      // Lights
      pointLight: any;
      ambientLight: any;
      directionalLight: any;
      spotLight: any;
      hemisphereLight: any;
      rectAreaLight: any;
      
      // Others
      fog: any;
      color: any;
      axesHelper: any;
      gridHelper: any;
    }
  }
}

// Ensure compatibility with newer React types (React 18+ with react-jsx)
declare module 'react' {
    namespace JSX {
        interface IntrinsicElements {
            // Core
            group: any;
            mesh: any;
            instancedMesh: any;
            primitive: any;
            object3D: any;

            // Geometries
            sphereGeometry: any;
            boxGeometry: any;
            planeGeometry: any;
            cylinderGeometry: any;
            coneGeometry: any;
            dodecahedronGeometry: any;
            circleGeometry: any;
            torusGeometry: any;
            ringGeometry: any;
            tetrahedronGeometry: any;
            icosahedronGeometry: any;
            octahedronGeometry: any;
            extrudeGeometry: any;
            capsuleGeometry: any;
            
            // Materials
            meshStandardMaterial: any;
            meshBasicMaterial: any;
            meshPhongMaterial: any;
            meshPhysicalMaterial: any;
            shaderMaterial: any;
            shadowMaterial: any;
            pointsMaterial: any;
            lineBasicMaterial: any;
            spriteMaterial: any;
            
            // Lights
            pointLight: any;
            ambientLight: any;
            directionalLight: any;
            spotLight: any;
            hemisphereLight: any;
            rectAreaLight: any;
            
            // Others
            fog: any;
            color: any;
            axesHelper: any;
            gridHelper: any;
        }
    }
}

export enum GameStatus {
  MENU = 'MENU',
  PLAYING = 'PLAYING',
  SHOP = 'SHOP',
  GAME_OVER = 'GAME_OVER',
  VICTORY = 'VICTORY',
  AVATAR_SELECT = 'AVATAR_SELECT'
}

export type HairStyle = 'SHORT' | 'SPIKY' | 'PIGTAILS';
export type AccessoryType = 'NONE' | 'GLASSES' | 'CAP' | 'BACKPACK' | 'HEADPHONES';

export interface AvatarConfig {
    skinColor: string;
    shirtColor: string;
    pantsColor: string;
    hairStyle: HairStyle;
    hairColor: string;
    accessory: AccessoryType;
}

export enum ObjectType {
  OBSTACLE = 'OBSTACLE', // Homework Piles / Desks
  GEM = 'GEM', // Medals / Stationery
  LETTER = 'LETTER',
  SHOP_PORTAL = 'SHOP_PORTAL', // School Bus or Door
  ALIEN = 'ALIEN', // Teachers
  MISSILE = 'MISSILE' // Paper Airplanes / Chalk
}

export interface GameObject {
  id: string;
  type: ObjectType;
  position: [number, number, number]; // x, y, z
  active: boolean;
  value?: string; // For letters (G, E, M...)
  color?: string;
  targetIndex?: number; // Index in the GEMINI target word
  points?: number; // Score value for gems
  hasFired?: boolean; // For Teachers
  subType?: string; // 'pencil', 'book', etc.
}

export const LANE_WIDTH = 2.2;
export const JUMP_HEIGHT = 2.5;
export const JUMP_DURATION = 0.6; // seconds
export const RUN_SPEED_BASE = 20.0; // Slightly slower for "kid running" feel?
export const SPAWN_DISTANCE = 120;
export const REMOVE_DISTANCE = 20; // Behind player

// Primary School Colors
export const GEMINI_COLORS = [
    '#FF4136', // Red
    '#FFDC00', // Yellow
    '#2ECC40', // Green
    '#0074D9', // Blue
    '#FF851B', // Orange
    '#B10DC9', // Purple
];

export interface ShopItem {
    id: string;
    name: string;
    description: string;
    cost: number;
    icon: any; // Lucide icon component
    oneTime?: boolean; // If true, remove from pool after buying
}

// --- Customization Options ---
export const SKIN_COLORS = ['#FFCC80', '#E0AA66', '#8D5524', '#F5E0C3', '#FFDBAC', '#5D4037'];
export const CLOTH_COLORS = ['#F44336', '#2196F3', '#4CAF50', '#FFEB3B', '#9C27B0', '#333333', '#FFFFFF', '#FF9800'];
export const HAIR_COLORS = ['#000000', '#5D4037', '#E6C229', '#D84315', '#9E9E9E', '#F44336', '#283593'];