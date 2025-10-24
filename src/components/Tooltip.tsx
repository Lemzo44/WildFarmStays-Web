import React, { useEffect } from 'react';

interface TooltipProps {
  children: React.ReactNode;
  text: string;
  visible: boolean;
  elementId: string;
  position: { x: number; y: number };
}

export const Tooltip: React.FC<TooltipProps> = ({ children, text, visible, elementId, position }) => {
  useEffect(() => {
    if (visible && typeof document !== 'undefined') {
      const tooltip = document.createElement('div');
      tooltip.id = `tooltip-${elementId}`;
      tooltip.style.cssText = `
        position: fixed;
        left: ${position.x}px;
        top: ${position.y}px;
        transform: translateX(-50%);
        background-color: #2E7D32;
        color: white;
        padding: 8px 12px;
        border-radius: 6px;
        font-size: 13px;
        font-family: Roboto, sans-serif;
        font-weight: 500;
        max-width: 300px;
        white-space: normal;
        text-align: center;
        z-index: 2147483647;
        box-shadow: 0 2px 8px rgba(0,0,0,0.2);
        pointer-events: none;
        opacity: 1;
        transition: opacity 0.2s ease-in-out;
      `;
      tooltip.textContent = text;
      document.body.appendChild(tooltip);
      
      return () => {
        if (document.body.contains(tooltip)) {
          document.body.removeChild(tooltip);
        }
      };
    }
  }, [visible, elementId, position, text]);
  
  return <>{children}</>;
};

export default Tooltip;



