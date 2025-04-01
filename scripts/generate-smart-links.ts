import { supabase } from '../src/integrations/supabase/client';
import fs from 'fs/promises';
import path from 'path';

// HTML template function
const generateHTML = (smartLink: any) => `
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>${smartLink.title} by ${smartLink.artist_name} | Listen on All Platforms</title>
    
    <!-- Favicon -->
    <link rel="icon" type="image/png" href="/lovable-uploads/soundraiser-logo/Iso A fav.png" />
    
    <!-- Open Graph / Facebook -->
    <meta property="og:type" content="music.song" />
    <meta property="og:title" content="${smartLink.title} by ${smartLink.artist_name} | Listen on All Platforms" />
    <meta property="og:description" content="Stream or download ${smartLink.title} by ${smartLink.artist_name}. Available on Spotify, Apple Music, and more streaming platforms." />
    <meta property="og:image" content="${smartLink.artwork_url}" />
    <meta property="og:url" content="https://soundraiser.io/l/${smartLink.slug}" />
    <meta property="og:site_name" content="Soundraiser" />
    
    <!-- Twitter -->
    <meta name="twitter:card" content="summary_large_image" />
    <meta name="twitter:title" content="${smartLink.title} by ${smartLink.artist_name} | Listen on All Platforms" />
    <meta name="twitter:description" content="Stream or download ${smartLink.title} by ${smartLink.artist_name}. Available on Spotify, Apple Music, and more streaming platforms." />
    <meta name="twitter:image" content="${smartLink.artwork_url}" />
    
    <!-- Styles -->
    <link href="https://cdn.jsdelivr.net/npm/tailwindcss@2/dist/tailwind.min.css" rel="stylesheet">
</head>
<body class="min-h-screen bg-gray-50">
    <div class="relative min-h-screen flex flex-col items-center justify-center">
        <!-- Background Image -->
        <div 
            class="absolute inset-0 bg-cover bg-center bg-no-repeat"
            style="background-image: url('${smartLink.artwork_url}'); filter: blur(30px) brightness(0.7); transform: scale(1.1);"
        ></div>

        <!-- Content -->
        <div class="relative w-full max-w-md mx-auto px-4 py-8 z-10">
            <div class="bg-white/95 backdrop-blur-sm rounded-3xl p-6 shadow-xl">
                <!-- Header -->
                <div class="text-center mb-8">
                    <img 
                        src="${smartLink.artwork_url}"
                        alt="${smartLink.title} cover"
                        class="w-72 h-72 mx-auto rounded-2xl shadow-xl mb-6 object-cover"
                        loading="eager"
                    />
                    <h1 class="text-2xl font-bold mb-1 text-gray-900">${smartLink.title}</h1>
                    <p class="text-lg text-gray-600 mb-2">${smartLink.artist_name}</p>
                    ${smartLink.description ? `<p class="text-sm text-gray-500 max-w-md mx-auto mt-3 px-4">${smartLink.description}</p>` : ''}
                </div>

                <!-- Platform Links -->
                <div class="space-y-4">
                    ${smartLink.platform_links?.map(link => `
                        <a 
                            href="${link.url}"
                            target="_blank"
                            rel="noopener noreferrer"
                            class="flex items-center w-full p-3 bg-white hover:bg-gray-50 rounded-xl border border-gray-200 transition-colors"
                            data-platform-link-id="${link.id}"
                        >
                            <img 
                                src="/lovable-uploads/${link.platform_id}.png"
                                alt="${link.platform_name}"
                                class="w-8 h-8 object-contain"
                            />
                            <span class="ml-3 font-medium text-gray-700">
                                ${link.platform_id === 'itunes' || link.platform_id === 'beatport' ? 'Buy on' : 'Play on'} ${link.platform_name}
                            </span>
                        </a>
                    `).join('')}
                </div>

                ${smartLink.email_capture_enabled ? `
                    <!-- Email Capture Form -->
                    <div class="mt-8 p-4 bg-gray-50 rounded-xl">
                        <h3 class="text-lg font-semibold mb-2">${smartLink.email_capture_title || 'Stay Updated'}</h3>
                        <p class="text-sm text-gray-600 mb-4">${smartLink.email_capture_description || 'Subscribe to get updates about new releases.'}</p>
                        <form id="email-form" class="space-y-3">
                            <input 
                                type="email" 
                                placeholder="Your email address" 
                                class="w-full px-4 py-2 rounded-lg border border-gray-200"
                                required
                            />
                            <button 
                                type="submit"
                                class="w-full px-4 py-2 bg-[#6851FB] text-white rounded-lg hover:bg-[#4A47A5] transition-colors"
                            >
                                Subscribe
                            </button>
                        </form>
                    </div>
                ` : ''}
            </div>

            ${!smartLink.profiles?.hide_branding ? `
                <div class="mt-8 text-center">
                    <a 
                        href="https://soundraiser.io" 
                        target="_blank" 
                        rel="noopener noreferrer"
                        class="inline-flex items-center gap-1.5 text-white/60 hover:text-white/80 transition-colors group"
                    >
                        <img 
                            src="/lovable-uploads/soundraiser-logo/Iso D.svg"
                            alt="Soundraiser"
                            class="h-4 w-4 opacity-60 group-hover:opacity-80 transition-opacity"
                        />
                        <span class="text-sm">Powered by Soundraiser</span>
                    </a>
                </div>
            ` : ''}
        </div>
    </div>

    <!-- Analytics & Interaction Scripts -->
    <script>
        // Track page view
        fetch('/api/analytics/view', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                smartLinkId: '${smartLink.id}',
                userAgent: navigator.userAgent
            })
        }).catch(console.error);

        // Track platform clicks
        document.querySelectorAll('[data-platform-link-id]').forEach(link => {
            link.addEventListener('click', () => {
                const platformLinkId = link.dataset.platformLinkId;
                fetch('/api/analytics/click', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ platformLinkId })
                }).catch(console.error);
            });
        });

        // Handle email subscription
        const emailForm = document.getElementById('email-form');
        if (emailForm) {
            emailForm.addEventListener('submit', (event) => {
                event.preventDefault();
                const email = event.target.querySelector('input[type="email"]').value;
                
                fetch('/api/subscribe', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        email,
                        smartLinkId: '${smartLink.id}'
                    })
                })
                .then(response => response.json())
                .then(data => {
                    if (data.success) {
                        emailForm.innerHTML = '<p class="text-green-600 text-center py-2">Thanks for subscribing!</p>';
                    } else {
                        throw new Error(data.message);
                    }
                })
                .catch(error => {
                    console.error('Error:', error);
                    alert('Something went wrong. Please try again.');
                });
            });
        }

        ${smartLink.meta_pixel_id ? `
            // Meta Pixel
            !function(f,b,e,v,n,t,s)
            {if(f.fbq)return;n=f.fbq=function(){n.callMethod?
            n.callMethod.apply(n,arguments):n.queue.push(arguments)};
            if(!f._fbq)f._fbq=n;n.push=n;n.loaded=!0;n.version='2.0';
            n.queue=[];t=b.createElement(e);t.async=!0;
            t.src=v;s=b.getElementsByTagName(e)[0];
            s.parentNode.insertBefore(t,s)}(window, document,'script',
            'https://connect.facebook.net/en_US/fbevents.js');
            fbq('init', '${smartLink.meta_pixel_id}');
            fbq('track', '${smartLink.meta_view_event || 'SmartLinkView'}');
        ` : ''}
    </script>
</body>
</html>
`;

async function generateSmartLinks() {
    try {
        // Create output directory
        const outputDir = path.join(process.cwd(), 'public', 'l');
        await fs.mkdir(outputDir, { recursive: true });

        // Fetch all smart links
        const { data: smartLinks, error } = await supabase
            .from('smart_links')
            .select(`
                *,
                platform_links (
                    id,
                    platform_id,
                    platform_name,
                    url
                ),
                profiles:user_id (
                    hide_branding
                )
            `);

        if (error) throw error;

        // Generate HTML files
        for (const smartLink of smartLinks) {
            const html = generateHTML(smartLink);
            await fs.writeFile(
                path.join(outputDir, `${smartLink.slug}.html`),
                html
            );
            console.log(`Generated: ${smartLink.slug}.html`);
        }

        console.log(`\nSuccessfully generated ${smartLinks.length} smart link pages`);
    } catch (error) {
        console.error('Error generating smart links:', error);
        process.exit(1);
    }
}

generateSmartLinks(); 