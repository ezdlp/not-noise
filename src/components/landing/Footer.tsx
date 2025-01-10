import { Instagram, Music2, Youtube } from "lucide-react";
import { Link } from "react-router-dom";

export const Footer = () => {
  return (
    <footer className="bg-onyx text-gray-100">
      <div className="max-w-6xl mx-auto px-4 py-12">
        <div className="flex justify-center space-x-8 mb-8">
          <a href="https://www.instagram.com/soundraiser.io/" target="_blank" rel="noopener noreferrer" className="text-gray-300 hover:text-white transition-colors">
            <Instagram className="h-5 w-5" strokeWidth={1.5} />
          </a>
          <a href="https://www.tiktok.com/@soundraiser.io" target="_blank" rel="noopener noreferrer" className="text-gray-300 hover:text-white transition-colors">
            <svg className="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
              <path d="M19 9.5V15c0 2.76-2.24 5-5 5s-5-2.24-5-5 2.24-5 5-5c.28 0 .56.02.83.07" />
              <path d="M17 5.5v4l-3-.01" />
              <path d="M11.5 9.5V15" />
              <path d="M14 9.5c-2.76 0-5 2.24-5 5" />
            </svg>
          </a>
          <a href="https://twitter.com/Soundraiser_" target="_blank" rel="noopener noreferrer" className="text-gray-300 hover:text-white transition-colors">
            <svg className="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
              <path d="M4 4l11.733 16h4.267l-11.733-16zM4 20l6.768-6.768M20 4l-6.768 6.768" />
            </svg>
          </a>
          <a href="https://open.spotify.com/user/rocktails" target="_blank" rel="noopener noreferrer" className="text-gray-300 hover:text-white transition-colors">
            <Music2 className="h-5 w-5" strokeWidth={1.5} />
          </a>
          <a href="https://www.youtube.com/@Soundraiser" target="_blank" rel="noopener noreferrer" className="text-gray-300 hover:text-white transition-colors">
            <Youtube className="h-5 w-5" strokeWidth={1.5} />
          </a>
        </div>
        <div className="text-center text-sm">
          <div className="flex justify-center space-x-6 mb-4">
            <Link to="/privacy" className="text-gray-300 hover:text-white transition-colors">Privacy Policy</Link>
            <Link to="/terms" className="text-gray-300 hover:text-white transition-colors">Terms of Use</Link>
            <Link to="/refund" className="text-gray-300 hover:text-white transition-colors">Refund Policy</Link>
            <Link to="/contact" className="text-gray-300 hover:text-white transition-colors">Contact Us</Link>
          </div>
          <p className="text-gray-400">© 2024 Soundraiser. All rights reserved.</p>
        </div>
      </div>
    </footer>
  );
};