
import React from 'react';

export const TMCLogo: React.FC<{ className?: string, size?: number }> = ({ className = "", size = 48 }) => (
  <svg 
    width={size} 
    height={size} 
    viewBox="0 0 200 200" 
    fill="none" 
    xmlns="http://www.w3.org/2000/svg"
    className={className}
  >
    {/* 
      TMC AUTHENTIC ISOMETRIC LOGO 
      Color: #1D1964 (Navy Blue from original image)
    */}
    
    <g id="TMC-Logo-Group" fill="#1D1964">
      
      {/* Top Face - Letter T */}
      <path 
        d="M100 25 L165 62 L150 71 L112 50 V100 H88 V50 L50 71 L35 62 L100 25Z" 
      />

      {/* Left Face - Letter M */}
      <path 
        d="M30 80 V155 L45 163 V110 L65 130 L85 110 V185 L100 193 V100 L65 120 L30 80Z" 
      />

      {/* Right Face - Letter C */}
      <path 
        d="M170 80 V105 L130 90 V155 L170 170 V193 L112 170 V62 L170 80Z" 
      />

    </g>

    {/* Optional: Subtle depth mask if needed, but the original is solid */}
  </svg>
);
