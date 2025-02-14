
import { Link } from "react-router-dom";

interface AuthLayoutProps {
  children: React.ReactNode;
}

export function AuthLayout({ children }: AuthLayoutProps) {
  return (
    <div className="container relative min-h-screen flex-col items-center justify-center grid lg:max-w-none lg:grid-cols-2 lg:px-0">
      <Link 
        to="/"
        className="absolute left-4 top-4 md:left-8 md:top-8 z-20"
      >
        <img 
          src="/lovable-uploads/soundraiser-logo/Logo A.svg" 
          alt="Soundraiser"
          className="h-8 w-auto"
        />
      </Link>
      <div className="relative flex h-full flex-col p-10 lg:p-8 xl:p-12">
        <div className="mx-auto flex w-full flex-col justify-center space-y-6 sm:w-[350px] lg:w-[400px]">
          {children}
        </div>
      </div>
      <div className="relative hidden h-full flex-col bg-muted p-10 text-white lg:flex dark:border-r">
        <div className="absolute inset-0 bg-cover" style={{ backgroundImage: `url(/lovable-uploads/hero-gradient.svg)` }} />
        <div className="relative z-20 flex items-center text-lg font-medium">
          <img src="/lovable-uploads/soundraiser-logo/Logo D.svg" alt="Soundraiser" className="h-10 w-auto opacity-0" />
        </div>
        <div className="relative z-20 mt-auto">
          <h1 className="text-4xl font-bold">Your Music, Elevated</h1>
          <p className="mt-4 text-lg font-medium">
            Soundraiser helps you to break through the noise
          </p>
        </div>
      </div>
    </div>
  );
}
