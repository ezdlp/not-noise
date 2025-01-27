import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faInstagram, faTiktok, faXTwitter, faSpotify, faYoutube } from "@fortawesome/free-brands-svg-icons";
import { Link } from "react-router-dom";

export const Footer = () => {
  return (
    <footer className="bg-footer-gradient text-white">
      <div className="max-w-6xl mx-auto px-4 py-12">
        <div className="flex justify-center space-x-8 mb-8">
          <a href="https://www.instagram.com/soundraiser.io/" target="_blank" rel="noopener noreferrer" className="text-neutral hover:text-accent hover:animate-pulse transition-colors">
            <FontAwesomeIcon icon={faInstagram} className="h-5 w-5" />
          </a>
          <a href="https://www.tiktok.com/@soundraiser.io" target="_blank" rel="noopener noreferrer" className="text-neutral hover:text-accent hover:animate-pulse transition-colors">
            <FontAwesomeIcon icon={faTiktok} className="h-5 w-5" />
          </a>
          <a href="https://twitter.com/soundraiser_" target="_blank" rel="noopener noreferrer" className="text-neutral hover:text-accent hover:animate-pulse transition-colors">
            <FontAwesomeIcon icon={faXTwitter} className="h-5 w-5" />
          </a>
          <a href="https://open.spotify.com/user/soundraiser" target="_blank" rel="noopener noreferrer" className="text-neutral hover:text-accent hover:animate-pulse transition-colors">
            <FontAwesomeIcon icon={faSpotify} className="h-5 w-5" />
          </a>
          <a href="https://www.youtube.com/@soundraiser" target="_blank" rel="noopener noreferrer" className="text-neutral hover:text-accent hover:animate-pulse transition-colors">
            <FontAwesomeIcon icon={faYoutube} className="h-5 w-5" />
          </a>
        </div>
        <div className="text-center text-sm">
          <div className="flex flex-wrap justify-center gap-4 md:gap-6 mb-4">
            <Link to="/privacy" className="text-neutral hover:text-accent transition-colors font-heading">Privacy Policy</Link>
            <Link to="/terms" className="text-neutral hover:text-accent transition-colors font-heading">Terms of Use</Link>
            <Link to="/refund" className="text-neutral hover:text-accent transition-colors font-heading">Refund Policy</Link>
            <Link to="/contact" className="text-neutral hover:text-accent transition-colors font-heading">Contact Us</Link>
          </div>
          <p className="text-neutral/80">© 2024 Soundraiser. All rights reserved.</p>
        
        </div>
      </div>
    </footer>
  );
};