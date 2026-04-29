import React from 'react';

interface ThumbnailPlaceholderProps {
  type: string;
  name?: string;
  className?: string;
}

const ThumbnailPlaceholder: React.FC<ThumbnailPlaceholderProps> = ({ type, name, className = "" }) => {
  // 타입을 기반으로 색상 테마 결정
  const getTheme = (type: string) => {
    switch (type) {
      case 'vc_plugin':
        return 'from-blue-600/20 to-blue-900/40 border-blue-500/30 text-blue-400';
      case 'ns_plugin':
      case 'ns_model':
        return 'from-emerald-600/20 to-emerald-900/40 border-emerald-500/30 text-emerald-400';
      case 'vc_model':
        return 'from-purple-600/20 to-purple-900/40 border-purple-500/30 text-purple-400';
      case 'etc':
      default:
        return 'from-gray-600/20 to-gray-800/40 border-gray-500/20 text-gray-400';
    }
  };

  const getInitials = (type: string) => {
    switch (type) {
      case 'vc_plugin':
        return 'VC';
      case 'ns_plugin':
        return 'NS';
      case 'vc_model':
        return 'VM';
      case 'ns_model':
        return 'NM';
      case 'etc':
      default:
        return 'ETC';
    }
  };

  const themeClasses = getTheme(type);
  const initials = getInitials(type);

  return (
    <div className={`relative w-full h-full flex flex-col items-center justify-center bg-gradient-to-br border ${themeClasses} ${className}`}>
      <div className="flex flex-col items-center opacity-40">
        <span className="text-xl font-black tracking-tighter mb-1">{initials}</span>
        {name && (
          <span className="text-[10px] font-medium uppercase tracking-[0.2em] max-w-[80%] truncate">
            {name}
          </span>
        )}
      </div>
      {/* Subtle glassmorphism effect */}
      <div className="absolute inset-0 bg-white/5 opacity-10 pointer-events-none"></div>
    </div>
  );
};

export default ThumbnailPlaceholder;
