
interface AuthLayoutProps {
  children: React.ReactNode;
}

export function AuthLayout({ children }: AuthLayoutProps) {
  return (
    <div className="container relative min-h-screen flex-col items-center justify-center grid lg:max-w-none lg:grid-cols-2 lg:px-0">
      <div className="relative flex-col h-full flex items-center justify-center p-8">
        <div className="w-full flex flex-col items-start space-y-6 sm:w-[350px] lg:w-[400px]">
          <img 
            src="/lovable-uploads/soundraiser-logo/Logo A.svg" 
            alt="Soundraiser" 
            className="h-8 w-auto mb-4" 
          />
          {children}
        </div>
      </div>
      <div className="relative hidden h-full flex-col bg-muted p-10 text-white lg:flex overflow-hidden">
        {/* Base Image Layer */}
        <div className="absolute inset-0">
          <img 
            src="https://owtufhdsuuyrgmxytclj.supabase.co/storage/v1/object/public/media-library/concert.jpg" 
            alt="Concert background" 
            className="object-cover w-full h-full animate-fade-in transition-transform duration-[2s] hover:scale-105"
          />
          {/* Dark Overlay for better text contrast */}
          <div className="absolute inset-0 bg-black/30" />
        </div>
        
        {/* Gradient Overlay */}
        <div 
          className="absolute inset-0 opacity-70 mix-blend-soft-light"
          style={{
            background: "linear-gradient(135deg, rgba(104, 81, 251, 0.8), rgba(55, 210, 153, 0.4))"
          }}
        />
        
        {/* Texture Overlay */}
        <div 
          className="absolute inset-0 bg-cover opacity-25 mix-blend-overlay"
          style={{
            backgroundImage: `url(/lovable-uploads/hero-gradient.svg)`
          }}
        />

        {/* Content */}
        <div className="relative z-20 mt-auto">
          <img 
            src="/lovable-uploads/soundraiser-logo/Logo D.svg" 
            alt="Soundraiser" 
            className="h-10 w-auto opacity-0" 
          />
        </div>
        <div className="relative z-20 flex flex-col items-start justify-center flex-1">
          <h1 className="text-4xl font-bold text-white/90">Your Music, Elevated</h1>
          <p className="mt-4 text-lg font-medium text-white/80">
            Soundraiser helps you to break through the noise
          </p>
        </div>
      </div>
    </div>
  );
}
