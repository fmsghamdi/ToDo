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
  const primaryColor = getComputedStyle(document.documentElement).getPropertyValue('--primary').trim() || '#2563EB';
  const primaryDark = getComputedStyle(document.documentElement).getPropertyValue('--primary-dark').trim() || '#1D4ED8';

  if (variant === 'icon') {
    return (
      <div className={`inline-flex items-center justify-center ${sizeClasses[size]} ${className}`}>
        <img
          src={logoUrl}
          alt={tenantName}
          className="w-full h-full object-contain"
          style={{
            filter: 'drop-shadow(0 1px 2px rgba(0,0,0,0.08))',
            background: 'transparent'
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
            filter: 'drop-shadow(0 1px 2px rgba(0,0,0,0.08))',
            background: 'transparent'
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
            filter: 'drop-shadow(0 1px 2px rgba(0,0,0,0.08))',
            background: 'transparent'
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
