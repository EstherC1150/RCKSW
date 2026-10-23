import React from 'react';

interface ThumbnailPlaceholderProps {
  type: string;
  name?: string;
  className?: string;
}

const ThumbnailPlaceholder: React.FC<ThumbnailPlaceholderProps> = ({ type, name, className = "" }) => {
  // 타입을 기반으로 색상 테마 결정 (선 제거, 라이트모드 채도 보정 및 다크모드 유지)
  const getTheme = (type: string) => {
    switch (type) {
      case 'vc_plugin':
        return 'from-blue-500/25 to-indigo-500/35 text-blue-700 dark:from-blue-600/20 dark:to-blue-900/40 dark:text-blue-400';
      case 'ns_plugin':
      case 'ns_model':
        return 'from-emerald-500/25 to-teal-500/35 text-emerald-700 dark:from-emerald-600/20 dark:to-emerald-900/40 dark:text-emerald-400';
      case 'vc_model':
        return 'from-purple-500/25 to-indigo-500/35 text-purple-700 dark:from-purple-600/20 dark:to-purple-900/40 dark:text-purple-400';
      case 'etc':
      default:
        return 'from-slate-300/60 to-slate-400/60 text-slate-700 dark:from-gray-600/20 dark:to-gray-800/40 dark:text-gray-400';
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
    <div className={`relative w-full h-full flex flex-col items-center justify-center bg-gradient-to-br ${themeClasses} ${className}`}>
      <div className="flex flex-col items-center opacity-75 dark:opacity-40">
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
