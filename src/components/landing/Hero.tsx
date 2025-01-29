import { CTAButton } from "@/components/ui/cta-button";
import { useNavigate } from "react-router-dom";
import { useEffect, useRef } from "react";

export const Hero = () => {
  const navigate = useNavigate();
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Set canvas size
    const setCanvasSize = () => {
      const container = canvas.parentElement;
      if (!container) return;
      canvas.width = container.offsetWidth;
      canvas.height = container.offsetHeight;
    };

    setCanvasSize();
    window.addEventListener('resize', setCanvasSize);

    // Particle system
    const particles: Array<{
      x: number;
      y: number;
      size: number;
      angle: number;
      radius: number;
      speed: number;
      color: string;
      opacity: number;
    }> = [];

    // Create particles in orbital paths
    const createParticles = () => {
      const particleCount = 80;
      const centerX = canvas.width * 0.75; // Center of orbits
      const centerY = canvas.height * 0.5;
      
      for (let i = 0; i < particleCount; i++) {
        const radius = 150 + Math.random() * 200; // Different orbital radiuses
        const angle = Math.random() * Math.PI * 2;
        const speed = 0.001 + Math.random() * 0.001; // Orbital speed
        
        particles.push({
          x: centerX + Math.cos(angle) * radius,
          y: centerY + Math.sin(angle) * radius,
          size: 0.5 + Math.random(),
          angle,
          radius,
          speed,
          color: Math.random() > 0.5 ? '#FE28A2' : '#6851FB',
          opacity: 0.3 + Math.random() * 0.3
        });
      }
    };

    // Animation
    const animate = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);

      // Update and draw particles
      particles.forEach((particle, index) => {
        // Update particle position in circular motion
        particle.angle += particle.speed;
        const centerX = canvas.width * 0.75;
        const centerY = canvas.height * 0.5;
        
        particle.x = centerX + Math.cos(particle.angle) * particle.radius;
        particle.y = centerY + Math.sin(particle.angle) * particle.radius;

        // Draw particle
        ctx.beginPath();
        ctx.arc(particle.x, particle.y, particle.size, 0, Math.PI * 2);
        ctx.fillStyle = `${particle.color}${Math.round(particle.opacity * 255).toString(16).padStart(2, '0')}`;
        ctx.fill();

        // Draw connections
        particles.forEach((particle2, index2) => {
          if (index2 <= index) return;
          
          const dx = particle.x - particle2.x;
          const dy = particle.y - particle2.y;
          const distance = Math.sqrt(dx * dx + dy * dy);

          if (distance < 50) {
            ctx.beginPath();
            ctx.moveTo(particle.x, particle.y);
            ctx.lineTo(particle2.x, particle2.y);
            ctx.strokeStyle = `${particle.color}${Math.round((particle.opacity * 0.3) * 255).toString(16).padStart(2, '0')}`;
            ctx.lineWidth = 0.3;
            ctx.stroke();
          }
        });
      });

      requestAnimationFrame(animate);
    };

    createParticles();
    animate();

    return () => {
      window.removeEventListener('resize', setCanvasSize);
    };
  }, []);

  return (
    <div className="min-h-[85vh] flex items-center px-4 md:px-8 py-20 bg-white overflow-hidden">
      <canvas
        ref={canvasRef}
        className="absolute inset-0 pointer-events-none"
        style={{ opacity: 0.8 }}
      />
      <div className="max-w-6xl mx-auto grid md:grid-cols-2 gap-12 items-center">
        <div className="text-left relative z-10">
          <h1 className="text-5xl md:text-[72px] leading-tight font-bold mb-6 font-heading text-night">
            Elevate Your Music With{" "}
            <span className="text-primary">
              Smart Links
            </span>
          </h1>
          <p className="text-lg md:text-[18px] text-[#333333] mb-8 max-w-xl leading-relaxed font-sans">
            Create powerful smart links that connect your fans to your music across all platforms. Built-in Meta Pixel integration and email capture to grow your audience faster.
          </p>
          <CTAButton 
            onClick={() => navigate("/create")}
            className="w-full md:w-auto px-8 py-4 shadow-md transition-all duration-200"
          >
            Get Started For Free
          </CTAButton>
        </div>
        <div className="relative order-first md:order-last">
          {/* Background with subtle grain texture */}
          <div 
            className="absolute inset-0 opacity-[0.06] pointer-events-none"
            style={{
              backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noiseFilter'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.85' numOctaves='3' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noiseFilter)'/%3E%3C/svg%3E")`,
            }}
          />
          
          {/* Decorative squares with gradient borders */}
          <div 
            className="absolute top-1/2 left-1/2 w-[600px] h-[600px] border-2 rounded-none"
            style={{ 
              borderImage: 'linear-gradient(45deg, rgba(104, 81, 251, 0.3), rgba(74, 71, 165, 0.5)) 1',
              transform: 'translate(-60%, -50%) rotate(-12deg)',
              animation: 'rotate 20s linear infinite',
            }}
          />
          
          {/* Second decorative square */}
          <div 
            className="absolute top-1/2 left-1/2 w-[500px] h-[500px] border-2 rounded-none"
            style={{ 
              borderImage: 'linear-gradient(45deg, rgba(254, 40, 162, 0.3), rgba(104, 81, 251, 0.5)) 1',
              transform: 'translate(-40%, -50%) rotate(12deg)',
              animation: 'rotate 15s linear infinite reverse',
            }}
          />
          
          {/* Smart Link Mockups Group */}
          <div 
            className="relative w-full h-[600px] group transition-all duration-500 ease-in-out hover:-translate-y-4"
          >
            {/* Taylor Swift Mockup */}
            <div 
              className="absolute top-0 left-0 w-[300px] transform -rotate-6 transition-all duration-300"
              style={{
                animation: 'float 6s ease-in-out infinite',
                boxShadow: '0 2px 4px rgba(15, 15, 15, 0.1)'
              }}
            >
              <img
                src="/lovable-uploads/1312b6ce-b7d7-473c-8627-3a0fdb32da04.png"
                alt="Taylor Swift Smart Link"
                className="w-full rounded-xl"
              />
            </div>
            
            {/* Olivia Rodrigo Mockup */}
            <div 
              className="absolute top-10 left-[120px] w-[300px] transform rotate-3 transition-all duration-300"
              style={{
                animation: 'float 6s ease-in-out infinite',
                animationDelay: '2s',
                boxShadow: '0 2px 4px rgba(15, 15, 15, 0.1)'
              }}
            >
              <img
                src="/lovable-uploads/d852ef07-009f-4bf3-b033-645c174fb5d5.png"
                alt="Olivia Rodrigo Smart Link"
                className="w-full rounded-xl"
              />
            </div>
            
            {/* Tyler Mockup */}
            <div 
              className="absolute top-20 left-[200px] w-[300px] transform rotate-12 transition-all duration-300"
              style={{
                animation: 'float 6s ease-in-out infinite',
                animationDelay: '4s',
                boxShadow: '0 2px 4px rgba(15, 15, 15, 0.1)'
              }}
            >
              <img
                src="/lovable-uploads/e709fc84-dd53-4a41-be18-f0a50ed7e297.png"
                alt="Tyler Smart Link"
                className="w-full rounded-xl"
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};