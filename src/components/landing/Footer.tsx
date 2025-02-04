
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faInstagram, faTiktok, faXTwitter, faSpotify, faYoutube } from "@fortawesome/free-brands-svg-icons";
import { Link } from "react-router-dom";

export const Footer = () => {
  const socialLinks = [
    { icon: faInstagram, href: "https://www.instagram.com/soundraiser.io/" },
    { icon: faTiktok, href: "https://www.tiktok.com/@soundraiser.io" },
    { icon: faXTwitter, href: "https://twitter.com/soundraiser_" },
    { icon: faSpotify, href: "https://open.spotify.com/user/rocktails" },
    { icon: faYoutube, href: "https://www.youtube.com/@soundraiser" }
  ];

  const footerLinks = [
    {
      title: "Product",
      links: [
        { text: "Smart Links", to: "/" },
        { text: "Spotify Playlist Promotion", to: "/" },
        { text: "News", to: "/" },
      ],
    },
    {
      title: "Resources",
      links: [
        { text: "Blog", to: "/blog" },
        { text: "Help Center", to: "/" },
        { text: "Contact Us", to: "/contact" },
      ],
    },
    {
      title: "Legal",
      links: [
        { text: "Privacy Policy", to: "https://not-noise.vercel.app/privacy-policy", external: true },
        { text: "Terms & Conditions", to: "https://not-noise.vercel.app/terms-of-use", external: true },
        { text: "Cookies", to: "https://not-noise.vercel.app/cookies-policy", external: true },
      ],
    },
  ];

  return (
    <footer className="bg-[#0F0F0F] text-white py-16">
      <div className="max-w-7xl mx-auto px-4 md:px-6 lg:px-8">
        <div className="grid grid-cols-1 md:grid-cols-12 gap-8 md:gap-12">
          {/* Logo and Social Links Column */}
          <div className="md:col-span-3 space-y-8">
            <Link to="/">
              <img 
                src="/lovable-uploads/7b845469-ae5d-4e0d-be6e-91b3cf1a808e.png"
                alt="Soundraiser"
                className="h-8 w-auto"
              />
            </Link>
            <div className="flex space-x-4">
              {socialLinks.map((social) => (
                <a
                  key={social.href}
                  href={social.href}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-white/60 hover:text-primary transition-colors duration-200"
                >
                  <FontAwesomeIcon icon={social.icon} className="h-5 w-5" />
                </a>
              ))}
            </div>
          </div>

          {/* Separator */}
          <div className="hidden md:block md:col-span-1">
            <div className="w-px h-full bg-white/10" />
          </div>

          {/* Links Columns */}
          <div className="md:col-span-8 grid grid-cols-1 sm:grid-cols-3 gap-8">
            {footerLinks.map((column) => (
              <div key={column.title} className="space-y-4">
                <h3 className="text-sm font-semibold text-white">{column.title}</h3>
                <ul className="space-y-3">
                  {column.links.map((link) => (
                    <li key={link.text}>
                      {link.external ? (
                        <a
                          href={link.to}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-sm text-white/60 hover:text-primary transition-colors duration-200"
                        >
                          {link.text}
                        </a>
                      ) : (
                        <Link
                          to={link.to}
                          className="text-sm text-white/60 hover:text-primary transition-colors duration-200"
                        >
                          {link.text}
                        </Link>
                      )}
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </div>

        <div className="mt-12 pt-8 border-t border-white/10">
          <p className="text-center text-sm text-white/60">
            © {new Date().getFullYear()} Soundraiser. All rights reserved.
          </p>
        </div>
      </div>
    </footer>
  );
};

