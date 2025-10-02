// src/components/RoleCard.jsx
import React from 'react';

const RoleCard = ({ title, subtitle, icon: IconComponent, selected, onTap }) => {
  return (
    <button
      type="button"
      onClick={onTap}
      className={`
        group w-full p-4 md:p-5 rounded-xl border transition-all duration-200 text-left
        ${selected
          ? 'bg-white/15 border-white/30 ring-2 ring-white/30 scale-[1.01]'
          : 'bg-white/10 border-white/20 hover:bg-white/15 hover:border-white/30'
        }
        backdrop-blur-xs
      `}
    >
      <div className="flex items-center gap-3">
        <div className={`w-12 h-12 rounded-full flex items-center justify-center
          ${selected ? 'bg-white/25' : 'bg-white/15'}
        `}>
          {IconComponent && <IconComponent className="w-6 h-6 text-white" />}
        </div>
        <div className="flex-1">
          <h3 className="text-white text-lg md:text-xl font-semibold">{title}</h3>
          <p className="text-white/70 text-sm md:text-base">{subtitle}</p>
        </div>
        {selected && (
          <div className="w-5 h-5 rounded-full bg-white/30 flex items-center justify-center">
            <div className="w-2 h-2 rounded-full bg-white" />
          </div>
        )}
      </div>
    </button>
  );
};

export default RoleCard;
