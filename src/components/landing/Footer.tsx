import { Link } from "react-router-dom";
import { Instagram, Twitter, Facebook, Youtube } from "lucide-react";

export const Footer = () => {
  return (
    <footer className="bg-gray-50 border-t border-gray-200">
      <div className="max-w-6xl mx-auto px-4 py-12">
        <div className="flex justify-center space-x-6 mb-8">
          <a href="https://instagram.com" target="_blank" rel="noopener noreferrer" className="text-gray-400 hover:text-gray-500">
            <Instagram className="h-6 w-6" />
          </a>
          <a href="https://twitter.com" target="_blank" rel="noopener noreferrer" className="text-gray-400 hover:text-gray-500">
            <Twitter className="h-6 w-6" />
          </a>
          <a href="https://facebook.com" target="_blank" rel="noopener noreferrer" className="text-gray-400 hover:text-gray-500">
            <Facebook className="h-6 w-6" />
          </a>
          <a href="https://youtube.com" target="_blank" rel="noopener noreferrer" className="text-gray-400 hover:text-gray-500">
            <Youtube className="h-6 w-6" />
          </a>
        </div>
        <div className="text-center text-sm text-gray-500">
          <div className="flex justify-center space-x-4 mb-4">
            <Link to="/privacy" className="hover:text-gray-600">Privacy Policy</Link>
            <Link to="/terms" className="hover:text-gray-600">Terms of Use</Link>
            <Link to="/refund" className="hover:text-gray-600">Refund Policy</Link>
            <Link to="/contact" className="hover:text-gray-600">Contact Us</Link>
          </div>
          <p>© 2024 Soundraiser. All rights reserved.</p>
        </div>
      </div>
    </footer>
  );
};