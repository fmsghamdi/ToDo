interface LogoProps {
  size?: 'sm' | 'md' | 'lg' | 'xl' | 'xxl';
  variant?: 'full' | 'icon' | 'text' | 'logo-only';
  className?: string;
  tenantLogoUrl?: string | null;
}

export default function Logo({ size = 'lg', variant = 'logo-only', className = '', tenantLogoUrl }: LogoProps) {
  const sizeClasses = {
    sm: 'w-12 h-12',
    md: 'w-16 h-16',
    lg: 'w-24 h-24',
    xl: 'w-32 h-32',
    xxl: 'w-40 h-40'
  };

  const textSizeClasses = {
    sm: 'text-lg',
    md: 'text-xl',
    lg: 'text-2xl',
    xl: 'text-3xl',
    xxl: 'text-4xl'
  };

  const defaultLogoPath = '/images/todooos-logo.svg';
  const logoUrl = tenantLogoUrl || defaultLogoPath;
  const tenantName = localStorage.getItem('tenantName') || 'ToDoOS';
  const primaryColor = getComputedStyle(document.documentElement).getPropertyValue('--primary').trim() || '#4A7C59';
  const primaryDark = getComputedStyle(document.documentElement).getPropertyValue('--primary-dark').trim() || '#2D5A3D';

  if (variant === 'icon') {
    return (
      <div className={`inline-flex items-center justify-center ${sizeClasses[size]} ${className}`}>
        <img
          src={logoUrl}
          alt={tenantName}
          className="w-full h-full object-contain"
          style={{
            filter: 'brightness(1.2) contrast(1.3) drop-shadow(0 2px 4px rgba(0,0,0,0.1))',
            background: 'transparent',
            mixBlendMode: 'multiply'
          }}
        />
      </div>
    );
  }

  if (variant === 'text') {
    return (
      <span className={`font-bold ${textSizeClasses[size]} ${className}`} style={{
        background: `linear-gradient(135deg, ${primaryDark} 0%, ${primaryColor} 100%)`,
        WebkitBackgroundClip: 'text',
        WebkitTextFillColor: 'transparent',
        backgroundClip: 'text',
        color: primaryDark
      }}>
        {tenantName}
      </span>
    );
  }

  if (variant === 'logo-only') {
    return (
      <div className={`inline-flex items-center justify-center ${sizeClasses[size]} ${className}`}>
        <img
          src={logoUrl}
          alt={tenantName}
          className="w-full h-full object-contain"
          style={{
            filter: 'brightness(1.2) contrast(1.3) drop-shadow(0 2px 4px rgba(0,0,0,0.1))',
            background: 'transparent',
            mixBlendMode: 'multiply'
          }}
        />
      </div>
    );
  }

  return (
    <div className={`inline-flex items-center gap-3 sm:gap-4 ${className}`}>
      <div className={`${sizeClasses[size]} relative flex-shrink-0`}>
        <img
          src={logoUrl}
          alt={tenantName}
          className="w-full h-full object-contain"
          style={{
            filter: 'brightness(1.2) contrast(1.3) drop-shadow(0 2px 4px rgba(0,0,0,0.1))',
            background: 'transparent',
            mixBlendMode: 'multiply'
          }}
        />
      </div>
      <span className={`font-bold ${textSizeClasses[size]} truncate`} style={{
        background: `linear-gradient(135deg, ${primaryDark} 0%, ${primaryColor} 100%)`,
        WebkitBackgroundClip: 'text',
        WebkitTextFillColor: 'transparent',
        backgroundClip: 'text',
        color: primaryDark
      }}>
        {tenantName}
      </span>
    </div>
  );
}
