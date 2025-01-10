import { Link } from "react-router-dom";
import { Instagram, Twitter, Facebook, Youtube } from "lucide-react";

export const Footer = () => {
  return (
    <footer className="bg-onyx text-gray-100">
      <div className="max-w-6xl mx-auto px-4 py-12">
        <div className="flex justify-center space-x-6 mb-8">
          <a href="https://instagram.com" target="_blank" rel="noopener noreferrer" className="text-gray-100 hover:text-white transition-colors">
            <Instagram className="h-6 w-6" />
          </a>
          <a href="https://twitter.com" target="_blank" rel="noopener noreferrer" className="text-gray-100 hover:text-white transition-colors">
            <Twitter className="h-6 w-6" />
          </a>
          <a href="https://facebook.com" target="_blank" rel="noopener noreferrer" className="text-gray-100 hover:text-white transition-colors">
            <Facebook className="h-6 w-6" />
          </a>
          <a href="https://youtube.com" target="_blank" rel="noopener noreferrer" className="text-gray-100 hover:text-white transition-colors">
            <Youtube className="h-6 w-6" />
          </a>
        </div>
        <div className="text-center text-sm text-gray-300">
          <div className="flex justify-center space-x-4 mb-4">
            <Link to="/privacy" className="hover:text-white transition-colors">Privacy Policy</Link>
            <Link to="/terms" className="hover:text-white transition-colors">Terms of Use</Link>
            <Link to="/refund" className="hover:text-white transition-colors">Refund Policy</Link>
            <Link to="/contact" className="hover:text-white transition-colors">Contact Us</Link>
          </div>
          <p className="text-gray-400">© 2024 Soundraiser. All rights reserved.</p>
        </div>
      </div>
    </footer>
  );
};