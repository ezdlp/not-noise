import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faInstagram, faTiktok, faXTwitter, faSpotify, faYoutube } from "@fortawesome/free-brands-svg-icons";
import { Link } from "react-router-dom";

export const Footer = () => {
  return (
    <footer className="bg-night text-white py-12">
      <div className="max-w-6xl mx-auto px-4 py-8">
        <div className="flex justify-center space-x-8 mb-8">
          {[
            { icon: faInstagram, href: "https://www.instagram.com/soundraiser.io/" },
            { icon: faTiktok, href: "https://www.tiktok.com/@soundraiser.io" },
            { icon: faXTwitter, href: "https://twitter.com/soundraiser_" },
            { icon: faSpotify, href: "https://open.spotify.com/user/soundraiser" },
            { icon: faYoutube, href: "https://www.youtube.com/@soundraiser" }
          ].map((social) => (
            <a 
              key={social.href}
              href={social.href} 
              target="_blank" 
              rel="noopener noreferrer" 
              className="text-white hover:text-primary transition-colors duration-200"
            >
              <FontAwesomeIcon icon={social.icon} className="h-6 w-6" />
            </a>
          ))}
        </div>
        <div className="text-center text-sm font-sans">
          <div className="flex flex-wrap justify-center gap-8 mb-6">
            {[
              { to: "/privacy", text: "Privacy Policy" },
              { to: "/terms", text: "Terms of Use" },
              { to: "/refund", text: "Refund Policy" },
              { to: "/contact", text: "Contact Us" }
            ].map((link) => (
              <Link 
                key={link.to}
                to={link.to} 
                className="text-white hover:text-primary transition-colors duration-200"
              >
                {link.text}
              </Link>
            ))}
          </div>
          <p className="text-white/60">© 2024 Soundraiser. All rights reserved.</p>
        </div>
      </div>
    </footer>
  );
};