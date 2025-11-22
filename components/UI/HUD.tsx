
/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
*/


import React, { useState, useEffect } from 'react';
import { Heart, Zap, Trophy, MoveRight, Shield, Activity, PlusCircle, Play, User, ArrowLeft, Shirt, GraduationCap, Palette, Sparkles, Scissors, Smile, Headphones, Backpack } from 'lucide-react';
import { useStore } from '../../store';
import { GameStatus, GEMINI_COLORS, ShopItem, RUN_SPEED_BASE, SKIN_COLORS, CLOTH_COLORS, HAIR_COLORS, HairStyle, AccessoryType } from '../../types';
import { audio } from '../System/Audio';

const SHOP_ITEMS: ShopItem[] = [
    {
        id: 'DOUBLE_JUMP',
        name: 'GYM SHOES',
        description: 'Double jump! Perfect for dodgeball... or skipping homework.',
        cost: 1000,
        icon: MoveRight,
        oneTime: true
    },
    {
        id: 'MAX_LIFE',
        name: 'LUNCH BOX',
        description: 'Packed with nutrition. Adds an extra heart slot.',
        cost: 1500,
        icon: Activity
    },
    {
        id: 'HEAL',
        name: 'RED APPLE',
        description: 'An apple a day keeps the doctor away. Heals 1 Heart.',
        cost: 800,
        icon: PlusCircle
    },
    {
        id: 'IMMORTAL',
        name: 'HALL PASS',
        description: 'Invincible for 5 seconds! "I have permission!"',
        cost: 2500,
        icon: Shield,
        oneTime: true
    }
];

const PencilButton: React.FC<{ onClick: () => void }> = ({ onClick }) => {
    return (
        <button 
            onClick={onClick}
            className="group relative w-full max-w-md h-16 flex items-center justify-center transition-transform hover:scale-105 active:scale-95 drop-shadow-xl mx-auto my-4"
        >
            <div className="flex items-stretch w-full h-full filter drop-shadow-md">
                 {/* Eraser */}
                <div className="w-12 bg-pink-400 rounded-l-lg border-y-4 border-l-4 border-pink-600 relative shadow-inner flex-shrink-0">
                    <div className="absolute inset-0 bg-white/10 rounded-l-lg"></div>
                </div>
                
                {/* Ferrule */}
                <div className="w-6 bg-gray-300 border-y-4 border-gray-400 flex flex-col justify-evenly py-1 px-0.5 z-10 flex-shrink-0">
                    <div className="w-full h-0.5 bg-gray-400/50"></div>
                    <div className="w-full h-0.5 bg-gray-400/50"></div>
                </div>
                
                {/* Body */}
                <div className="flex-grow bg-yellow-400 border-y-4 border-yellow-600 flex items-center justify-center relative">
                     <span className="relative z-20 text-yellow-900 font-black text-xl tracking-wider flex items-center group-hover:scale-105 transition-transform">
                        START RUNNING <Play className="ml-2 w-5 h-5 fill-yellow-900" />
                     </span>
                     <div className="absolute inset-0 bg-gradient-to-b from-white/20 to-transparent pointer-events-none"></div>
                </div>
                
                {/* Tip Section */}
                <div className="relative w-8 h-full flex-shrink-0">
                    {/* Wood Cone */}
                    <div 
                        className="absolute top-0 left-0"
                        style={{
                             width: 0,
                             height: 0,
                             borderTop: '32px solid transparent', 
                             borderBottom: '32px solid transparent',
                             borderLeft: '32px solid #E0AA66', 
                        }}
                    ></div>
                    
                    {/* Graphite Tip */}
                    <div 
                        className="absolute"
                        style={{
                             left: '22px', 
                             top: '50%',
                             transform: 'translateY(-50%)',
                             width: 0,
                             height: 0,
                             borderTop: '10px solid transparent',
                             borderBottom: '10px solid transparent',
                             borderLeft: '10px solid #222',
                        }}
                    ></div>
                </div>
            </div>
        </button>
    );
};

const ColorPicker: React.FC<{ colors: string[], selected: string, onSelect: (c: string) => void }> = ({ colors, selected, onSelect }) => {
    return (
        <div className="flex flex-wrap gap-3 justify-center">
            {colors.map(c => (
                <button
                    key={c}
                    onClick={() => onSelect(c)}
                    className={`w-10 h-10 rounded-full border-4 transition-transform hover:scale-110 ${selected === c ? 'border-white shadow-lg scale-110 ring-2 ring-blue-500' : 'border-transparent opacity-80 hover:opacity-100'}`}
                    style={{ backgroundColor: c }}
                />
            ))}
        </div>
    );
};

const AvatarEditor: React.FC = () => {
    const { avatarConfig, setAvatarConfig, setStatus } = useStore();
    const [activeTab, setActiveTab] = useState<'HAIR' | 'CLOTHES' | 'BODY'>('CLOTHES');

    const TABS = [
        { id: 'HAIR', label: 'HAIR', icon: Scissors },
        { id: 'CLOTHES', label: 'OUTFIT', icon: Shirt },
        { id: 'BODY', label: 'BODY', icon: Smile },
    ];

    return (
        <div className="absolute inset-0 z-[100] pointer-events-none font-display flex flex-col">
             {/* Header */}
             <div className="bg-white/90 backdrop-blur p-4 pointer-events-auto flex justify-between items-center shadow-sm">
                 <button 
                    onClick={() => setStatus(GameStatus.MENU)}
                    className="bg-gray-100 hover:bg-gray-200 p-2 rounded-full transition-colors"
                >
                    <ArrowLeft className="w-6 h-6 text-gray-600" />
                </button>
                <h2 className="text-2xl font-black text-blue-500 tracking-wider">WARDROBE</h2>
                <div className="w-10"></div> 
             </div>

             {/* Main Area - Transparent for 3D view */}
             <div className="flex-grow pointer-events-none relative">
                 {/* Floating Controls for Accessories - Absolute positioned */}
                 <div className="absolute right-4 top-20 flex flex-col gap-4 pointer-events-auto">
                     <div className="bg-white/80 backdrop-blur p-2 rounded-xl shadow-sm">
                         <div className="text-xs font-bold text-gray-400 text-center mb-2">GEAR</div>
                         <div className="flex flex-col gap-2">
                             {[
                                 { id: 'NONE', icon: User },
                                 { id: 'GLASSES', icon: Sparkles },
                                 { id: 'CAP', icon: GraduationCap }, // Using graduation cap as generic hat icon
                                 { id: 'BACKPACK', icon: Backpack },
                                 { id: 'HEADPHONES', icon: Headphones }
                             ].map((acc) => (
                                 <button
                                    key={acc.id}
                                    onClick={() => setAvatarConfig({ accessory: acc.id as AccessoryType })}
                                    className={`p-3 rounded-lg transition-all ${avatarConfig.accessory === acc.id ? 'bg-blue-500 text-white' : 'bg-gray-100 text-gray-500 hover:bg-blue-100'}`}
                                 >
                                     <acc.icon className="w-6 h-6" />
                                 </button>
                             ))}
                         </div>
                     </div>
                 </div>
             </div>

             {/* Bottom Panel - Editor Controls */}
             <div className="bg-white/95 backdrop-blur-md shadow-[0_-4px_20px_rgba(0,0,0,0.1)] pointer-events-auto rounded-t-3xl">
                 {/* Tabs */}
                 <div className="flex justify-center space-x-1 p-2 border-b border-gray-100">
                     {TABS.map(tab => {
                         const Icon = tab.icon;
                         const isActive = activeTab === tab.id;
                         return (
                             <button
                                key={tab.id}
                                onClick={() => setActiveTab(tab.id as any)}
                                className={`flex items-center px-6 py-3 rounded-xl font-black transition-all ${
                                    isActive 
                                    ? 'bg-blue-500 text-white shadow-md translate-y-[-2px]' 
                                    : 'text-gray-400 hover:bg-gray-100'
                                }`}
                             >
                                 <Icon className="w-5 h-5 mr-2" />
                                 {tab.label}
                             </button>
                         );
                     })}
                 </div>

                 {/* Content */}
                 <div className="p-6 max-w-2xl mx-auto h-64 overflow-y-auto">
                     
                     {/* HAIR TAB */}
                     {activeTab === 'HAIR' && (
                         <div className="space-y-6">
                             <div>
                                 <h3 className="text-gray-400 text-sm font-bold mb-3 uppercase tracking-wider">Style</h3>
                                 <div className="flex gap-3 justify-center">
                                     {['SHORT', 'SPIKY', 'PIGTAILS'].map(style => (
                                         <button
                                            key={style}
                                            onClick={() => setAvatarConfig({ hairStyle: style as HairStyle })}
                                            className={`px-4 py-2 rounded-lg font-bold border-2 transition-all ${
                                                avatarConfig.hairStyle === style 
                                                ? 'border-blue-500 bg-blue-50 text-blue-600' 
                                                : 'border-gray-200 text-gray-500 hover:border-blue-300'
                                            }`}
                                         >
                                             {style}
                                         </button>
                                     ))}
                                 </div>
                             </div>
                             <div>
                                 <h3 className="text-gray-400 text-sm font-bold mb-3 uppercase tracking-wider">Color</h3>
                                 <ColorPicker 
                                    colors={HAIR_COLORS} 
                                    selected={avatarConfig.hairColor}
                                    onSelect={(c) => setAvatarConfig({ hairColor: c })}
                                 />
                             </div>
                         </div>
                     )}

                     {/* CLOTHES TAB */}
                     {activeTab === 'CLOTHES' && (
                         <div className="space-y-6">
                             <div>
                                 <h3 className="text-gray-400 text-sm font-bold mb-3 uppercase tracking-wider">Shirt Color</h3>
                                 <ColorPicker 
                                    colors={CLOTH_COLORS} 
                                    selected={avatarConfig.shirtColor}
                                    onSelect={(c) => setAvatarConfig({ shirtColor: c })}
                                 />
                             </div>
                             <div>
                                 <h3 className="text-gray-400 text-sm font-bold mb-3 uppercase tracking-wider">Pants Color</h3>
                                 <ColorPicker 
                                    colors={CLOTH_COLORS} 
                                    selected={avatarConfig.pantsColor}
                                    onSelect={(c) => setAvatarConfig({ pantsColor: c })}
                                 />
                             </div>
                         </div>
                     )}

                     {/* BODY TAB */}
                     {activeTab === 'BODY' && (
                         <div className="space-y-6">
                             <div>
                                 <h3 className="text-gray-400 text-sm font-bold mb-3 uppercase tracking-wider">Skin Tone</h3>
                                 <ColorPicker 
                                    colors={SKIN_COLORS} 
                                    selected={avatarConfig.skinColor}
                                    onSelect={(c) => setAvatarConfig({ skinColor: c })}
                                 />
                             </div>
                         </div>
                     )}
                 </div>
             </div>
        </div>
    );
};

const ShopScreen: React.FC = () => {
    const { score, buyItem, closeShop, hasDoubleJump, hasImmortality } = useStore();
    const [items, setItems] = useState<ShopItem[]>([]);

    useEffect(() => {
        let pool = SHOP_ITEMS.filter(item => {
            if (item.id === 'DOUBLE_JUMP' && hasDoubleJump) return false;
            if (item.id === 'IMMORTAL' && hasImmortality) return false;
            return true;
        });
        pool = pool.sort(() => 0.5 - Math.random());
        setItems(pool.slice(0, 3));
    }, []);

    return (
        <div className="absolute inset-0 bg-white/90 z-[100] text-gray-800 pointer-events-auto backdrop-blur-md overflow-y-auto font-display">
             <div className="flex flex-col items-center justify-center min-h-full py-8 px-4">
                 <h2 className="text-4xl md:text-5xl font-black text-blue-600 mb-2 tracking-wider text-center">SCHOOL STORE</h2>
                 <div className="flex items-center text-yellow-600 mb-6 md:mb-8 bg-yellow-100 px-4 py-2 rounded-full border-2 border-yellow-400">
                     <span className="text-lg mr-2 font-bold">TOKENS:</span>
                     <span className="text-2xl font-black">{score.toLocaleString()}</span>
                 </div>

                 <div className="grid grid-cols-1 md:grid-cols-3 gap-4 md:gap-6 max-w-4xl w-full mb-8">
                     {items.map(item => {
                         const Icon = item.icon;
                         const canAfford = score >= item.cost;
                         return (
                             <div key={item.id} className="bg-white border-4 border-blue-200 p-6 rounded-3xl flex flex-col items-center text-center hover:border-blue-400 hover:shadow-lg transition-all transform hover:-translate-y-1">
                                 <div className="bg-blue-100 p-4 rounded-full mb-4 text-blue-600">
                                     <Icon className="w-8 h-8" />
                                 </div>
                                 <h3 className="text-xl font-black text-gray-800 mb-2">{item.name}</h3>
                                 <p className="text-gray-500 text-sm mb-4 h-12 flex items-center justify-center font-sans font-bold">{item.description}</p>
                                 <button 
                                    onClick={() => buyItem(item.id as any, item.cost)}
                                    disabled={!canAfford}
                                    className={`px-6 py-3 rounded-xl font-black w-full text-base transition-all ${
                                        canAfford 
                                        ? 'bg-green-500 text-white hover:bg-green-600 shadow-[0_4px_0_rgb(21,128,61)] hover:shadow-[0_2px_0_rgb(21,128,61)] hover:translate-y-[2px]' 
                                        : 'bg-gray-200 text-gray-400 cursor-not-allowed'
                                    }`}
                                 >
                                     {item.cost} TOKENS
                                 </button>
                             </div>
                         );
                     })}
                 </div>

                 <button 
                    onClick={closeShop}
                    className="flex items-center px-10 py-4 bg-blue-500 text-white font-black text-xl rounded-2xl hover:bg-blue-600 transition-all shadow-[0_4px_0_rgb(29,78,216)] hover:translate-y-[2px] hover:shadow-[0_2px_0_rgb(29,78,216)]"
                 >
                     BACK TO CLASS <Play className="ml-2 w-6 h-6 fill-white" />
                 </button>
             </div>
        </div>
    );
};

export const HUD: React.FC = () => {
  const { score, lives, maxLives, collectedLetters, status, level, restartGame, startGame, gemsCollected, distance, isImmortalityActive, speed, setStatus } = useStore();
  const target = ['G', 'E', 'M', 'I', 'N', 'I'];
  const containerClass = "absolute inset-0 pointer-events-none flex flex-col justify-between p-4 md:p-8 z-50 font-display";

  if (status === GameStatus.SHOP) return <ShopScreen />;
  if (status === GameStatus.AVATAR_SELECT) return <AvatarEditor />;

  if (status === GameStatus.MENU) {
      return (
          <div className="absolute inset-0 flex items-center justify-center z-[100] bg-sky-300/90 p-4 pointer-events-auto font-display">
              <div className="relative w-full max-w-md bg-white rounded-3xl overflow-hidden shadow-2xl border-4 border-white transform rotate-1 hover:rotate-0 transition-transform duration-500">
                <div className="p-8 text-center bg-sky-50">
                    <h1 className="text-5xl font-black text-blue-500 mb-2 tracking-tighter drop-shadow-sm">SCHOOL DASH</h1>
                    <p className="text-gray-500 font-bold mb-8">Don't be late for class!</p>
                    
                    <div className="space-y-4">
                        <PencilButton onClick={() => { audio.init(); startGame(); }} />

                        <button 
                            onClick={() => setStatus(GameStatus.AVATAR_SELECT)}
                            className="w-full px-8 py-4 bg-white text-blue-500 border-4 border-blue-100 font-black text-xl rounded-2xl hover:bg-blue-50 transition-all hover:translate-y-[2px] flex items-center justify-center"
                        >
                            CUSTOMIZE AVATAR <User className="ml-3 w-6 h-6" />
                        </button>
                    </div>
                    
                    <div className="mt-8 flex justify-center space-x-4 text-gray-400 font-bold text-sm">
                        <span>SWIPE TO MOVE</span>
                        <span>•</span>
                        <span>TAP TO JUMP</span>
                    </div>
                </div>
              </div>
          </div>
      );
  }

  if (status === GameStatus.GAME_OVER) {
      return (
          <div className="absolute inset-0 bg-red-500/90 z-[100] text-white pointer-events-auto flex items-center justify-center p-4 font-display">
              <div className="bg-white text-gray-800 p-8 rounded-3xl shadow-2xl max-w-md w-full text-center border-8 border-red-200">
                <h1 className="text-5xl font-black text-red-500 mb-6">DETENTION!</h1>
                
                <div className="space-y-3 mb-8 font-bold text-lg">
                    <div className="flex justify-between border-b border-gray-100 pb-2">
                        <span className="text-gray-400">GRADE LEVEL</span>
                        <span>{level}</span>
                    </div>
                    <div className="flex justify-between border-b border-gray-100 pb-2">
                        <span className="text-gray-400">MEDALS</span>
                        <span className="text-yellow-500">{gemsCollected}</span>
                    </div>
                    <div className="flex justify-between border-b border-gray-100 pb-2">
                        <span className="text-gray-400">DISTANCE</span>
                        <span className="text-blue-500">{Math.floor(distance)}m</span>
                    </div>
                     <div className="flex justify-between pt-2 text-2xl">
                        <span>SCORE</span>
                        <span className="text-purple-600">{score.toLocaleString()}</span>
                    </div>
                </div>

                <div className="space-y-3">
                    <button 
                      onClick={() => { audio.init(); restartGame(); }}
                      className="w-full px-8 py-4 bg-blue-500 text-white font-black text-xl rounded-2xl hover:bg-blue-600 transition-all shadow-[0_4px_0_rgb(29,78,216)] active:translate-y-[2px] active:shadow-[0_2px_0_rgb(29,78,216)]"
                    >
                        TRY AGAIN
                    </button>
                    <button 
                      onClick={() => setStatus(GameStatus.MENU)}
                      className="w-full px-8 py-3 bg-gray-200 text-gray-600 font-black text-lg rounded-2xl hover:bg-gray-300 transition-all"
                    >
                        MAIN MENU
                    </button>
                </div>
              </div>
          </div>
      );
  }

  if (status === GameStatus.VICTORY) {
    return (
        <div className="absolute inset-0 bg-yellow-400/90 z-[100] flex items-center justify-center p-4 font-display">
            <div className="bg-white text-gray-800 p-8 rounded-3xl shadow-2xl max-w-md w-full text-center border-8 border-yellow-200">
                <Trophy className="w-20 h-20 text-yellow-500 mx-auto mb-4 animate-bounce" />
                <h1 className="text-5xl font-black text-yellow-500 mb-2">GRADUATED!</h1>
                <p className="text-gray-400 font-bold mb-8">You collected all the letters!</p>
                
                <div className="bg-gray-50 p-6 rounded-xl mb-8">
                    <div className="text-sm text-gray-400 font-bold mb-1">FINAL SCORE</div>
                    <div className="text-4xl font-black text-blue-600">{score.toLocaleString()}</div>
                </div>

                <button 
                  onClick={() => { audio.init(); restartGame(); }}
                  className="w-full px-8 py-4 bg-green-500 text-white font-black text-xl rounded-2xl hover:bg-green-600 transition-all shadow-[0_4px_0_rgb(21,128,61)] active:translate-y-[2px] active:shadow-[0_2px_0_rgb(21,128,61)]"
                >
                    PLAY AGAIN
                </button>
            </div>
        </div>
    );
  }

  return (
    <div className={containerClass}>
        <div className="flex justify-between items-start w-full">
            <div className="bg-white/80 backdrop-blur-sm px-4 py-2 rounded-xl border-2 border-white shadow-sm">
                <div className="text-3xl md:text-4xl font-black text-blue-500">
                    {score.toLocaleString()}
                </div>
            </div>
            
            <div className="flex space-x-1">
                {[...Array(maxLives)].map((_, i) => (
                    <Heart 
                        key={i} 
                        className={`w-8 h-8 md:w-10 md:h-10 transition-all ${i < lives ? 'text-red-500 fill-red-500 drop-shadow-sm' : 'text-gray-300 fill-gray-300'}`} 
                    />
                ))}
            </div>
        </div>
        
        <div className="absolute top-6 left-1/2 transform -translate-x-1/2 bg-white/90 backdrop-blur-sm px-4 py-1 rounded-full border-2 border-purple-100 shadow-sm">
            <span className="text-purple-500 font-bold tracking-wide">GRADE {level}</span>
        </div>

        {isImmortalityActive && (
             <div className="absolute top-24 left-1/2 transform -translate-x-1/2 bg-yellow-400 text-white px-6 py-2 rounded-full font-black text-xl shadow-lg animate-pulse flex items-center border-2 border-white">
                 <Shield className="mr-2 w-5 h-5 fill-white" /> HALL PASS
             </div>
        )}

        <div className="absolute top-20 md:top-24 left-1/2 transform -translate-x-1/2 flex space-x-2">
            {target.map((char, idx) => {
                const isCollected = collectedLetters.includes(idx);
                const color = GEMINI_COLORS[idx];

                return (
                    <div 
                        key={idx}
                        style={{
                            backgroundColor: isCollected ? color : 'rgba(255,255,255,0.5)',
                            color: isCollected ? 'white' : 'rgba(0,0,0,0.2)',
                            borderColor: isCollected ? 'white' : 'transparent'
                        }}
                        className={`w-10 h-10 md:w-12 md:h-12 flex items-center justify-center font-black text-xl rounded-lg shadow-sm border-2 transition-all duration-300 transform ${isCollected ? 'scale-110 -translate-y-1' : ''}`}
                    >
                        {char}
                    </div>
                );
            })}
        </div>

        <div className="w-full flex justify-end items-end">
             <div className="flex items-center space-x-2 bg-black/10 px-3 py-1 rounded-full text-white/80 font-bold text-sm">
                 <Zap className="w-4 h-4" />
                 <span>{Math.round((speed / RUN_SPEED_BASE) * 100)}% SPEED</span>
             </div>
        </div>
    </div>
  );
};
