
import { useState, useEffect, useMemo } from "react";
import { useParams, useNavigate, useLocation } from "react-router-dom";
import { 
  BookOpen, 
  List, 
  BarChart3, 
  Image as ImageIcon, 
  HelpCircle, 
  Search, 
  Settings,
  Users,
  CreditCard,
  MessageSquare,
  Menu
} from "lucide-react";

import { PageSEO } from "@/components/seo/PageSEO";
import { Footer } from "@/components/landing/Footer";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { Separator } from "@/components/ui/separator";
import { cn } from "@/lib/utils";

// Import help center components
import { HelpSearch } from "@/components/help/HelpSearch";
import { HelpNavigation } from "@/components/help/HelpNavigation";
import { HelpArticle } from "@/components/help/HelpArticle";
import { HelpHome } from "@/components/help/HelpHome";
import { HelpSearchResults } from "@/components/help/HelpSearchResults";
import { HelpCategoryView } from "@/components/help/HelpCategoryView";
import { HelpSidebar } from "@/components/help/HelpSidebar";

// Import types
import { HelpCategory, HelpArticle as HelpArticleType, HelpSearchResult } from "@/types/help";

export default function Help() {
  const navigate = useNavigate();
  const location = useLocation();
  const { categoryId, slug } = useParams<{ categoryId?: string; slug?: string }>();
  
  const [activeArticleId, setActiveArticleId] = useState<string | null>(null);
  const [activeCategoryId, setActiveCategoryId] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState<HelpSearchResult[]>([]);
  const [showSearchResults, setShowSearchResults] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  
  // Define categories and their icons
  const categories: HelpCategory[] = [
    { 
      id: 'getting-started', 
      name: 'Getting Started', 
      icon: BookOpen,
      description: 'Learn the basics of Soundraiser and how to get up and running quickly.'
    },
    { 
      id: 'smart-links', 
      name: 'Smart Links', 
      icon: List,
      description: 'Create, customize, and manage your music Smart Links across platforms.'
    },
    { 
      id: 'analytics', 
      name: 'Analytics & Tracking', 
      icon: BarChart3,
      description: 'Understand your audience and track the performance of your music links.'
    },
    { 
      id: 'account-billing', 
      name: 'Account & Billing', 
      icon: CreditCard,
      description: 'Manage your subscription, payments, and account settings.'
    },
    { 
      id: 'troubleshooting', 
      name: 'Troubleshooting', 
      icon: HelpCircle,
      description: 'Solutions to common issues and technical problems.'
    }
  ];
  
  // Define help articles
  const articles: HelpArticleType[] = [
    // Getting Started
    {
      id: 'welcome',
      title: 'Welcome to Soundraiser',
      content: `
        <h2>Welcome to Soundraiser</h2>
        <p>Soundraiser is the all-in-one platform that empowers independent musicians to amplify their reach and get their music heard. Our tools are designed specifically for musicians like you who want to streamline promotion and connect with fans more effectively.</p>
        
        <h3>What You Can Do With Soundraiser</h3>
        <p>With Soundraiser, you can:</p>
        <ul>
          <li><strong>Create Smart Links</strong> – Share your music across all streaming platforms with a single, customizable link</li>
          <li><strong>Track Performance</strong> – Get detailed analytics on who's clicking, where they're from, and what platforms they prefer</li>
          <li><strong>Grow Your Fan Base</strong> – Capture email addresses and build your mailing list directly through your Smart Links</li>
          <li><strong>Reach More Listeners</strong> – Access promotion tools and services designed to expand your audience</li>
        </ul>
        
        <h3>Getting Started is Easy</h3>
        <p>To get the most out of Soundraiser:</p>
        <ol>
          <li><a href="/register">Create your account</a> or <a href="/login">log in</a> if you already have one</li>
          <li>Set up your first Smart Link (it takes less than 5 minutes!)</li>
          <li>Share it everywhere – social media, email, website, etc.</li>
          <li>Track your results and optimize your promotion strategy</li>
        </ol>
        
        <h3>Need Help?</h3>
        <p>This Help Center contains everything you need to know about using Soundraiser. If you can't find what you're looking for, our support team is always ready to assist you. Just <a href="/contact">contact us</a> with any questions.</p>
        
        <p>Ready to amplify your music? Let's get started!</p>
      `,
      category_id: 'getting-started',
      slug: 'welcome',
      featured: true,
      related: ['account-creation', 'first-smart-link']
    },
    {
      id: 'account-creation',
      title: 'Creating Your Account',
      content: `
        <h2>Creating Your Soundraiser Account</h2>
        <p>Setting up your Soundraiser account is quick and simple. Follow these steps to create your account and start promoting your music more effectively.</p>
        
        <h3>Step 1: Sign Up</h3>
        <p>Visit the <a href="/register">registration page</a> and enter your information:</p>
        <ul>
          <li>Email address (you'll use this to log in)</li>
          <li>Password (make it secure!)</li>
          <li>Your name or artist name</li>
        </ul>
        <p>You can also sign up using your Google account for faster access.</p>
        
        <h3>Step 2: Verify Your Email</h3>
        <p>Check your inbox for a verification email from Soundraiser. Click the link to verify your email address. If you don't see the email, check your spam folder or request a new verification email from the login page.</p>
        
        <h3>Step 3: Complete Your Profile</h3>
        <p>Once verified, you'll be prompted to complete your profile:</p>
        <ul>
          <li>Upload a profile picture (your logo or artist photo)</li>
          <li>Add your social media links (optional but recommended)</li>
          <li>Select your primary music genre</li>
        </ul>
        
        <h3>Step 4: Explore Your Dashboard</h3>
        <p>After completing setup, you'll be taken to your dashboard. Take a moment to familiarize yourself with the interface and available features. The main navigation includes:</p>
        <ul>
          <li>Dashboard: Overview of your links and performance</li>
          <li>Smart Links: Create and manage your links</li>
          <li>Analytics: Detailed performance statistics</li>
          <li>Settings: Account management</li>
        </ul>
        
        <h3>Security Recommendations</h3>
        <p>To keep your Soundraiser account secure:</p>
        <ul>
          <li>Use a strong, unique password</li>
          <li>Never share your login credentials</li>
          <li>Log out when using shared computers</li>
          <li>Keep your email address up to date</li>
        </ul>
        
        <p>Now you're ready to create your first Smart Link! Check out our guide on <a href="/help/first-smart-link">Creating Your First Smart Link</a> to get started.</p>
      `,
      category_id: 'getting-started',
      slug: 'creating-your-account',
      related: ['welcome', 'first-smart-link', 'dashboard-overview']
    },
    {
      id: 'dashboard-overview',
      title: 'Understanding Your Dashboard',
      content: `
        <h2>Understanding Your Soundraiser Dashboard</h2>
        <p>Your Soundraiser dashboard is the command center for all your music promotion activities. Here's a guide to help you navigate and make the most of your dashboard.</p>
        
        <h3>Dashboard Overview</h3>
        <p>When you log in to Soundraiser, you'll land on your dashboard, which provides a quick snapshot of your Smart Links' performance and important metrics. The dashboard is divided into several key sections:</p>
        
        <h3>1. Performance Summary</h3>
        <p>At the top of your dashboard, you'll see cards displaying your key metrics:</p>
        <ul>
          <li><strong>Total Views</strong>: The number of times your Smart Links have been visited</li>
          <li><strong>Total Clicks</strong>: How many times visitors have clicked through to streaming platforms</li>
          <li><strong>Click-Through Rate (CTR)</strong>: The percentage of views that resulted in clicks</li>
          <li><strong>Top Platforms</strong>: Which streaming services are most popular with your audience</li>
        </ul>
        
        <h3>2. Recent Smart Links</h3>
        <p>This section displays your most recently created Smart Links, allowing you to:</p>
        <ul>
          <li>Quickly access your latest links</li>
          <li>See their basic performance stats</li>
          <li>Copy links directly to your clipboard for sharing</li>
          <li>Access edit options and detailed analytics</li>
        </ul>
        
        <h3>3. Traffic Trends</h3>
        <p>The traffic chart shows how your link performance has changed over time, helping you identify:</p>
        <ul>
          <li>Performance spikes related to your promotional efforts</li>
          <li>Day-to-day and week-to-week trends</li>
          <li>Growth patterns that can inform your strategy</li>
        </ul>
        <p>You can adjust the time range to view data for the last 7 days, 30 days, or custom periods.</p>
        
        <h3>4. Geographic Distribution</h3>
        <p>This map and accompanying table show where your listeners are located around the world, providing valuable insights for:</p>
        <ul>
          <li>Tour planning</li>
          <li>Targeted advertising</li>
          <li>Content strategy adjustments</li>
          <li>Understanding where your music is gaining traction</li>
        </ul>
        
        <h3>5. Quick Actions</h3>
        <p>The sidebar contains quick action buttons to:</p>
        <ul>
          <li><strong>Create New Link</strong>: Start the process of creating a new Smart Link</li>
          <li><strong>View All Links</strong>: Access your complete Smart Link library</li>
          <li><strong>Full Analytics</strong>: Dive deeper into your performance data</li>
          <li><strong>Account Settings</strong>: Manage your profile</li>
        </ul>
        
        <p>Now that you understand your dashboard, you're ready to take full advantage of Soundraiser's powerful promotion tools. Ready to create your first Smart Link? Check out our <a href="/help/first-smart-link">Smart Link creation guide</a>.</p>
      `,
      category_id: 'getting-started',
      slug: 'dashboard-overview',
      popular: true,
      related: ['analytics-basics', 'first-smart-link']
    },
    
    // Smart Links
    {
      id: 'first-smart-link',
      title: 'Creating Your First Smart Link',
      content: `
        <h2>Creating Your First Smart Link</h2>
        <p>Smart Links are the core of Soundraiser's platform, allowing you to share your music across all streaming platforms with a single, customizable link. This guide will walk you through creating your first Smart Link from start to finish.</p>
        
        <h3>Before You Start</h3>
        <p>Make sure you have the following ready:</p>
        <ul>
          <li>Your release details (title, artist name)</li>
          <li>High-quality artwork (1500 x 1500px recommended)</li>
          <li>Your music should be live on at least one streaming platform</li>
        </ul>
        
        <h3>Step 1: Initiate Smart Link Creation</h3>
        <p>From your Soundraiser dashboard, click the "<strong>Create New Link</strong>" button in the top right corner. This will take you to the Smart Link creation wizard.</p>
        
        <h3>Step 2: Enter Basic Information</h3>
        <p>In the first step of the wizard, enter:</p>
        <ul>
          <li><strong>Title</strong>: Your song or album name (e.g., "Midnight Dreams")</li>
          <li><strong>Artist Name</strong>: Your artist name or band name (e.g., "Sarah Johnson")</li>
          <li><strong>Release Type</strong>: Select from Single, EP, Album, or Compilation</li>
          <li><strong>Release Date</strong> (optional): When your music was or will be released</li>
          <li><strong>Primary Genre</strong> (optional): Select the main genre of your music</li>
        </ul>
        <p>Click "<strong>Next</strong>" to continue.</p>
        
        <h3>Step 3: Add Streaming Platforms</h3>
        <p>There are two ways to add your music to your Smart Link:</p>
        
        <h4>Option A: Automatic Search (Recommended)</h4>
        <p>This is the fastest way to set up your Smart Link:</p>
        <ol>
          <li>Enter your title and artist name in the search field</li>
          <li>Click "<strong>Search</strong>"</li>
          <li>Soundraiser will scan major platforms and find your music</li>
          <li>Review the results and select the correct matches</li>
          <li>Click "<strong>Add Selected Links</strong>"</li>
        </ol>
        
        <h4>Option B: Manual Addition</h4>
        <p>If your music is on platforms not covered by the automatic search, or if you need more control:</p>
        <ol>
          <li>Click the "<strong>Add Manually</strong>" tab</li>
          <li>Select a platform from the dropdown (e.g., Spotify, Apple Music)</li>
          <li>Paste your music's URL on that platform</li>
          <li>Click "<strong>Add Link</strong>"</li>
          <li>Repeat for each platform where your music is available</li>
        </ol>
        
        <p>You can add as many platforms as needed. Click "<strong>Next</strong>" when finished.</p>
        
        <h3>Step 4: Upload Artwork</h3>
        <p>Your Smart Link needs artwork to look professional:</p>
        <ol>
          <li>Click "<strong>Upload Artwork</strong>" or drag and drop your image</li>
          <li>Crop or adjust the image if needed</li>
          <li>Preview how it will appear on your Smart Link</li>
        </ol>
        <p>Best practices for artwork:</p>
        <ul>
          <li>Use high-resolution images (1500 x 1500px)</li>
          <li>Make sure text is readable at smaller sizes</li>
          <li>Use the same artwork as your official release for consistency</li>
        </ul>
        <p>Click "<strong>Next</strong>" to continue.</p>
        
        <h3>Step 5: Customize Your Link URL</h3>
        <p>Now, customize your Smart Link URL:</p>
        <ol>
          <li>Choose a unique slug for your link (e.g., "midnight-dreams")</li>
          <li>Your final URL will be: soundraiser.io/link/your-slug</li>
        </ol>
        <p>Click "<strong>Next</strong>" to continue.</p>
        
        <h3>Step 6: Review and Publish</h3>
        <p>In the final step:</p>
        <ol>
          <li>Review all your Smart Link details</li>
          <li>Preview how it will appear on both desktop and mobile</li>
          <li>Make any final adjustments</li>
          <li>Click "<strong>Publish Smart Link</strong>"</li>
        </ol>
        
        <h3>Congratulations!</h3>
        <p>Your Smart Link is now live! You'll see a success screen with options to:</p>
        <ul>
          <li><strong>Copy Link</strong>: Copy your link to the clipboard</li>
          <li><strong>Share</strong>: Directly share to social platforms</li>
          <li><strong>View Analytics</strong>: See your link performance (data will appear as fans engage)</li>
          <li><strong>Create Another</strong>: Start the process again for another release</li>
        </ul>
        
        <h3>Next Steps</h3>
        <p>Now that your Smart Link is live, make the most of it by:</p>
        <ul>
          <li>Adding it to all your social media bios</li>
          <li>Including it in your email signature</li>
          <li>Sharing it when promoting your music</li>
          <li>Monitoring analytics to understand your audience better</li>
        </ul>
        
        <p>For more advanced strategies, check out our articles on <a href="/help/platform-integration">Adding Streaming Platforms</a> and <a href="/help/link-management">Managing Your Links</a>.</p>
      `,
      category_id: 'smart-links',
      slug: 'first-smart-link',
      popular: true,
      featured: true,
      related: ['platform-integration', 'link-management']
    },
    {
      id: 'platform-integration',
      title: 'Adding Streaming Platforms',
      content: `
        <h2>Adding Streaming Platforms to Your Smart Link</h2>
        <p>The power of Soundraiser Smart Links lies in their ability to connect fans to your music across multiple streaming platforms with a single link. This guide will help you effectively add and manage streaming platforms in your Smart Links.</p>
        
        <h3>Supported Streaming Platforms</h3>
        <p>Soundraiser supports a wide range of music streaming and download platforms, including:</p>
        
        <h4>Major Streaming Services:</h4>
        <ul>
          <li>Spotify</li>
          <li>Apple Music</li>
          <li>YouTube Music</li>
          <li>Amazon Music</li>
          <li>Deezer</li>
          <li>Tidal</li>
          <li>Pandora</li>
        </ul>
        
        <h4>Download Stores:</h4>
        <ul>
          <li>iTunes</li>
          <li>Amazon MP3</li>
          <li>Beatport (for electronic music)</li>
          <li>Bandcamp</li>
        </ul>
        
        <h4>Video Platforms:</h4>
        <ul>
          <li>YouTube</li>
          <li>Vevo</li>
        </ul>
        
        <h4>Regional and Specialized Services:</h4>
        <ul>
          <li>Anghami (Middle East)</li>
          <li>Boomplay (Africa)</li>
          <li>JioSaavn (India)</li>
          <li>SoundCloud</li>
          <li>Audiomack</li>
        </ul>
        
        <h3>Methods for Adding Platforms</h3>
        
        <h4>Method 1: Automatic Search (Recommended)</h4>
        <p>Our automatic search feature can find your music across multiple platforms simultaneously:</p>
        <ol>
          <li>During Smart Link creation, navigate to the "Add Platforms" step</li>
          <li>Enter your track/album title and artist name in the search field</li>
          <li>Click "<strong>Search</strong>"</li>
          <li>Soundraiser will display matching results from various platforms</li>
          <li>Check the correct matches and click "<strong>Add Selected</strong>"</li>
        </ol>
        <p>Pro tip: For best results, use the exact title as it appears on streaming platforms.</p>
        
        <h4>Method 2: Manual URL Addition</h4>
        <p>For platforms not covered by automatic search or for more precise control:</p>
        <ol>
          <li>Go to the "Add Manually" tab in the platforms step</li>
          <li>Select a platform from the dropdown menu</li>
          <li>Copy the URL of your music on that platform</li>
          <li>Paste the URL into the field</li>
          <li>Click "<strong>Add Link</strong>"</li>
          <li>Repeat for each platform</li>
        </ol>
        
        <h3>Finding Your Music URLs</h3>
        <p>To manually add platforms, you'll need the direct URLs to your music. Here's how to find them on major platforms:</p>
        
        <h4>Spotify:</h4>
        <ol>
          <li>Open Spotify and navigate to your track/album</li>
          <li>Click the three dots (⋯) and select "Share"</li>
          <li>Choose "Copy Link" to get the URL</li>
        </ol>
        
        <h4>Apple Music:</h4>
        <ol>
          <li>Navigate to your music in Apple Music</li>
          <li>Click the three dots (⋯) and select "Share"</li>
          <li>Choose "Copy Link"</li>
        </ol>
        
        <h4>YouTube:</h4>
        <ol>
          <li>Open your music video on YouTube</li>
          <li>Click "Share" below the video</li>
          <li>Copy the displayed URL</li>
        </ol>
        
        <h3>Organizing Your Platforms</h3>
        <p>The order of platforms can impact click-through rates. Consider these strategies:</p>
        
        <h4>Platform Prioritization:</h4>
        <ul>
          <li>Place the most popular platforms for your audience at the top</li>
          <li>If you earn more from certain platforms, prioritize those</li>
          <li>Consider featuring platforms where you have exclusive content</li>
        </ul>
        
        <h4>Customizing the Order:</h4>
        <ol>
          <li>In the platform setup or edit screen, find the platform list</li>
          <li>Use the drag handles to reorder platforms</li>
          <li>The new order will be saved automatically</li>
        </ol>
        
        <h3>Best Practices</h3>
        <ul>
          <li><strong>Be Comprehensive</strong>: Include as many platforms as possible to reach all fans</li>
          <li><strong>Update Regularly</strong>: Add new platforms as your music becomes available on them</li>
          <li><strong>Test Your Links</strong>: Always verify that your links work correctly after setup</li>
          <li><strong>Analyze Platform Performance</strong>: Use analytics to see which platforms your fans prefer</li>
        </ul>
      `,
      category_id: 'smart-links',
      slug: 'adding-streaming-platforms',
      related: ['first-smart-link', 'link-management']
    },
    {
      id: 'link-management',
      title: 'Managing Your Links',
      content: `
        <h2>Managing Your Smart Links</h2>
        <p>As your music catalog grows, effectively managing your Smart Links becomes increasingly important. This guide will help you organize, edit, and maintain your links for maximum effectiveness.</p>
        
        <h3>Viewing Your Smart Links</h3>
        <p>Soundraiser provides multiple ways to access and view your Smart Links:</p>
        
        <h4>Dashboard View</h4>
        <ul>
          <li>Your most recent and top-performing links appear directly on your dashboard</li>
          <li>Quick stats show views, clicks, and click-through rates</li>
          <li>Action buttons provide direct access to edit, analytics, and sharing functions</li>
        </ul>
        
        <h4>Smart Links Library</h4>
        <ul>
          <li>Access your complete library by clicking "Smart Links" in the main navigation</li>
          <li>View links in either grid (visual) or list (detailed) format</li>
          <li>Sort by date created, performance, or alphabetically</li>
          <li>Filter links by status (active, archived)</li>
        </ul>
        
        <h3>Editing Your Smart Links</h3>
        
        <h4>Making Basic Changes</h4>
        <ol>
          <li>Find the link you want to edit in your library</li>
          <li>Click the "Edit" button (pencil icon)</li>
          <li>Navigate through the edit wizard to change specific elements</li>
          <li>Save changes when finished</li>
        </ol>
        
        <h4>What You Can Edit</h4>
        <ul>
          <li><strong>Basic Information</strong>: Title, artist name, release type</li>
          <li><strong>Platforms</strong>: Add, remove, or update streaming platform links</li>
          <li><strong>Artwork</strong>: Update the cover image</li>
          <li><strong>URL</strong>: Change the custom slug (note: this will break any existing shared links)</li>
        </ul>
        
        <h3>Smart Link Status Management</h3>
        
        <h4>Active Links</h4>
        <ul>
          <li>Live links that are publicly accessible</li>
          <li>Appear in search results and can be shared</li>
          <li>Analytics are tracked in real-time</li>
        </ul>
        
        <h4>Archived Links</h4>
        <ul>
          <li>Hide older or less relevant links from your active library</li>
          <li>Links remain accessible to fans who have the URL</li>
          <li>Analytics continue to be tracked</li>
          <li>Can be unarchived at any time</li>
        </ul>
        
        <h3>Link Duplication</h3>
        <p>Save time by duplicating existing links:</p>
        <ol>
          <li>Find the link you want to duplicate</li>
          <li>Click the "More" menu (three dots) and select "Duplicate"</li>
          <li>A new copy will be created with "(Copy)" added to the title</li>
          <li>Modify the copy as needed and save</li>
        </ol>
        <p>This is especially useful when creating Smart Links for releases with similar platform availability.</p>
        
        <h3>Link Deletion</h3>
        <p>To permanently delete a Smart Link:</p>
        <ol>
          <li>Find the link in your library</li>
          <li>Click the "More" menu (three dots) and select "Delete"</li>
          <li>Confirm the deletion when prompted</li>
        </ol>
        <p><strong>Note</strong>: Deletion is permanent and cannot be undone. Consider archiving links instead if you might need them later.</p>
        
        <h3>Best Practices for Link Management</h3>
        <ul>
          <li><strong>Regular Audits</strong>: Periodically review your links to ensure all platform links are working</li>
          <li><strong>Consistent Naming</strong>: Use a consistent naming convention for easy identification</li>
          <li><strong>Update Platforms</strong>: Add new streaming services as your music becomes available on them</li>
          <li><strong>Archive Old Links</strong>: Keep your active library focused on current priorities</li>
        </ul>
      `,
      category_id: 'smart-links',
      slug: 'link-management',
      related: ['first-smart-link', 'analytics-basics']
    },
    
    // Analytics
    {
      id: 'analytics-basics',
      title: 'Understanding Analytics',
      content: `
        <h2>Understanding Your Analytics Dashboard</h2>
        <p>Soundraiser's analytics dashboard provides powerful insights into how your Smart Links are performing. This guide will help you understand, interpret, and leverage this data to optimize your music promotion strategy.</p>
        
        <h3>Accessing Your Analytics</h3>
        <p>There are several ways to access analytics in Soundraiser:</p>
        <ul>
          <li><strong>Main Dashboard</strong>: View high-level stats for all your links</li>
          <li><strong>Analytics Tab</strong>: Access comprehensive analytics for all links</li>
          <li><strong>Individual Link Analytics</strong>: Click the "Analytics" button on any specific link</li>
        </ul>
        
        <h3>Key Performance Metrics</h3>
        
        <h4>Traffic Metrics</h4>
        <ul>
          <li><strong>Views</strong>: Total number of visits to your Smart Link page</li>
          <li><strong>Unique Visitors</strong>: Number of different people who visited</li>
          <li><strong>Returning Visitors</strong>: People who came back multiple times</li>
        </ul>
        
        <h4>Engagement Metrics</h4>
        <ul>
          <li><strong>Clicks</strong>: Total number of clicks on streaming platform buttons</li>
          <li><strong>Click-Through Rate (CTR)</strong>: Percentage of visitors who clicked a platform (Clicks ÷ Views)</li>
          <li><strong>Platforms Clicked</strong>: Distribution of clicks across different streaming services</li>
        </ul>
        
        <h3>Understanding the Analytics Dashboard</h3>
        
        <h4>Overview Section</h4>
        <p>The Overview provides a snapshot of your performance across all Smart Links:</p>
        <ul>
          <li><strong>Total Views & Clicks</strong>: Aggregate performance for all links</li>
          <li><strong>Performance Graph</strong>: Visual representation of traffic over time</li>
          <li><strong>Top Performing Links</strong>: Your most successful Smart Links</li>
        </ul>
        
        <h4>Geographic Data</h4>
        <p>The Geographic section shows where your audience is located:</p>
        <ul>
          <li><strong>World Map</strong>: Visual representation of global distribution</li>
          <li><strong>Country Breakdown</strong>: Table of top countries with metrics</li>
          <li><strong>City-Level Data</strong>: Major cities where your music is popular</li>
        </ul>
        <p>This information is valuable for tour planning, localized promotion, and targeting ads to your strongest markets.</p>
        
        <h4>Platform Preferences</h4>
        <p>Understand which streaming platforms your audience prefers:</p>
        <ul>
          <li><strong>Platform Distribution</strong>: Percentage breakdown of platform clicks</li>
          <li><strong>Platform Trends</strong>: Changes in platform popularity over time</li>
          <li><strong>Platform by Region</strong>: How platform preferences vary by country</li>
        </ul>
        <p>Use this data to prioritize platforms in your marketing efforts and understand where your fans like to listen.</p>
        
        <h3>Interpreting Your Data</h3>
        
        <h4>What Makes Good Metrics?</h4>
        <p>While performance varies by genre and audience, here are some benchmarks:</p>
        <ul>
          <li><strong>Healthy CTR</strong>: Above 30% (meaning 3 out of 10 visitors click a platform)</li>
          <li><strong>Good Bounce Rate</strong>: Below 60%</li>
          <li><strong>Strong Return Rate</strong>: 15% or higher returning visitors</li>
        </ul>
        
        <h4>Identifying Opportunities</h4>
        <ul>
          <li><strong>Geographic Expansion</strong>: Countries with high engagement but low promotion</li>
          <li><strong>Platform Gaps</strong>: Popular platforms you haven't prioritized</li>
          <li><strong>Referral Potential</strong>: Websites or channels sending quality traffic</li>
          <li><strong>Conversion Bottlenecks</strong>: Pages with views but low engagement</li>
        </ul>
        
        <h3>Using Analytics to Improve Performance</h3>
        
        <h4>Content Optimization</h4>
        <ul>
          <li>Test different artwork to see what drives more engagement</li>
          <li>Adjust platform order based on popularity</li>
          <li>Add missing platforms that are popular in your key regions</li>
        </ul>
        
        <h4>Promotional Strategy</h4>
        <ul>
          <li>Focus marketing efforts on channels sending the most engaged traffic</li>
          <li>Target ads to regions showing organic interest</li>
          <li>Schedule posts during your audience's most active hours</li>
        </ul>
      `,
      category_id: 'analytics',
      slug: 'understanding-analytics',
      popular: true,
      related: ['views-vs-clicks', 'platform-metrics']
    },
    {
      id: 'views-vs-clicks',
      title: 'Views vs. Clicks: Understanding the Difference',
      content: `
        <h2>Views vs. Clicks: Understanding the Difference</h2>
        <p>When analyzing your Smart Link performance, two of the most important metrics to understand are views and clicks. This guide explains what these metrics mean, how they differ, and how to use them to improve your music promotion strategy.</p>
        
        <h3>What Are Views?</h3>
        <p>Views (sometimes called impressions) represent the number of times your Smart Link page has been loaded in a browser. In other words, views count how many times people have visited your link.</p>
        
        <h4>What Counts as a View:</h4>
        <ul>
          <li>Someone directly entering your Smart Link URL</li>
          <li>A visitor clicking your link from social media, email, or another website</li>
          <li>Someone clicking a bookmark to your link</li>
          <li>A page refresh also counts as an additional view</li>
        </ul>
        
        <h4>Types of Views:</h4>
        <ul>
          <li><strong>Total Views</strong>: All page loads, including repeat visits</li>
          <li><strong>Unique Views</strong>: Number of different people who visited your link</li>
          <li><strong>New vs. Returning Views</strong>: First-time visitors compared to repeat visitors</li>
        </ul>
        
        <h3>What Are Clicks?</h3>
        <p>Clicks represent interaction with your Smart Link page, specifically when a visitor clicks on one of the streaming platform buttons to listen to your music. This is the key conversion action you want visitors to take.</p>
        
        <h4>What Counts as a Click:</h4>
        <ul>
          <li>Clicking on any streaming platform button</li>
          <li>Clicking pre-save or follow buttons</li>
          <li>Clicking custom call-to-action buttons you've added</li>
        </ul>
        
        <h4>Types of Clicks:</h4>
        <ul>
          <li><strong>Total Clicks</strong>: All button clicks across all platforms</li>
          <li><strong>Platform-Specific Clicks</strong>: Clicks broken down by streaming service</li>
          <li><strong>Unique Clicks</strong>: Number of different people who clicked (vs. multiple clicks by the same person)</li>
        </ul>
        
        <h3>Click-Through Rate (CTR)</h3>
        <p>Click-Through Rate is the percentage of views that result in clicks. It's calculated by dividing clicks by views and multiplying by 100:</p>
        
        <p><strong>CTR = (Clicks ÷ Views) × 100%</strong></p>
        
        <h4>What CTR Tells You:</h4>
        <ul>
          <li>How effective your Smart Link is at converting visitors to listeners</li>
          <li>Whether your design and content are compelling</li>
          <li>If you're attracting the right audience who is interested in your music</li>
        </ul>
        
        <h4>Typical CTR Benchmarks:</h4>
        <ul>
          <li><strong>Excellent</strong>: 50%+ (half or more of visitors click through)</li>
          <li><strong>Good</strong>: 30-50% (about a third of visitors engage)</li>
          <li><strong>Average</strong>: 15-30% (typical for many Smart Links)</li>
          <li><strong>Below Average</strong>: Under 15% (may indicate issues to address)</li>
        </ul>
        
        <h3>Improving Your View-to-Click Ratio</h3>
        
        <h4>If You Have High Views but Low Clicks:</h4>
        <ul>
          <li><strong>Enhance Visual Appeal</strong>: Use more attractive, professional artwork</li>
          <li><strong>Optimize Platform Order</strong>: Put the most popular platforms for your audience first</li>
          <li><strong>Improve Load Time</strong>: Ensure your page loads quickly, especially on mobile</li>
          <li><strong>Add a Call-to-Action</strong>: Include text encouraging visitors to click</li>
          <li><strong>Target Your Promotion</strong>: Make sure you're sharing your link with the right audience</li>
        </ul>
        
        <h4>If You Have Low Views:</h4>
        <ul>
          <li><strong>Increase Promotion</strong>: Share your link more frequently on social media</li>
          <li><strong>Diversify Channels</strong>: Use multiple platforms to share your link</li>
          <li><strong>Improve Link Placement</strong>: Add your link to your bio, email signature, etc.</li>
          <li><strong>Consider Paid Promotion</strong>: Use targeted ads to boost visibility</li>
        </ul>
      `,
      category_id: 'analytics',
      slug: 'views-vs-clicks',
      featured: true,
      related: ['analytics-basics', 'platform-metrics']
    },
    {
      id: 'platform-metrics',
      title: 'Understanding Platform Performance',
      content: `
        <h2>Understanding Platform Performance</h2>
        <p>One of the most valuable insights Soundraiser analytics provides is detailed information about how your audience interacts with different streaming platforms. This guide will help you understand and leverage platform performance data to optimize your music promotion strategy.</p>
        
        <h3>Platform Performance Overview</h3>
        <p>Soundraiser tracks which streaming platforms your fans prefer to use when clicking through from your Smart Links. This data is presented in several ways:</p>
        
        <h4>Platform Distribution</h4>
        <ul>
          <li><strong>Platform Breakdown Chart</strong>: Visual representation showing the percentage of clicks each platform receives</li>
          <li><strong>Platform Leaderboard</strong>: Ranked list of platforms by number of clicks</li>
          <li><strong>Click Volume</strong>: Raw number of clicks each platform received</li>
        </ul>
        
        <h3>Why Platform Metrics Matter</h3>
        <p>Understanding platform preferences helps you:</p>
        <ul>
          <li><strong>Focus Promotion</strong>: Allocate more resources to platforms where your audience is most active</li>
          <li><strong>Optimize Revenue</strong>: Prioritize platforms with better royalty rates or promotional opportunities</li>
          <li><strong>Identify Opportunities</strong>: Discover emerging platforms gaining traction with your audience</li>
          <li><strong>Improve Link Design</strong>: Arrange platforms in an order that matches user preferences</li>
        </ul>
        
        <h3>Analyzing Platform Data</h3>
        
        <h4>Global vs. Regional Preferences</h4>
        <p>Platform preferences often vary by geography. Soundraiser shows you:</p>
        <ul>
          <li>Which platforms are popular in specific countries or regions</li>
          <li>How platform preferences differ across your listener base</li>
          <li>Regional platforms that may be important in specific markets</li>
        </ul>
        
        <h4>Trending Platform Changes</h4>
        <p>Track how platform preferences change over time:</p>
        <ul>
          <li>Rising platforms gaining popularity with your audience</li>
          <li>Declining platforms that may be losing relevance</li>
          <li>Seasonal or campaign-related shifts in platform usage</li>
        </ul>
        
        <h3>Optimizing Based on Platform Data</h3>
        
        <h4>Smart Link Platform Arrangement</h4>
        <p>Use platform performance data to optimize your Smart Links:</p>
        <ul>
          <li>Reorder platforms to put the most popular ones first</li>
          <li>Consider creating region-specific Smart Links with different platform priorities</li>
          <li>Test different arrangements to see what drives the highest overall engagement</li>
        </ul>
        
        <h4>Marketing Strategy Adjustments</h4>
        <ul>
          <li>Focus playlist pitching efforts on platforms most popular with your audience</li>
          <li>Create platform-specific promotional content (e.g., "Listen on Spotify" graphics for audiences that prefer Spotify)</li>
          <li>Consider exclusive content or early releases on your most popular platforms</li>
        </ul>
      `,
      category_id: 'analytics',
      slug: 'platform-performance',
      popular: true,
      related: ['analytics-basics', 'views-vs-clicks']
    },
    
    // Account & Billing
    {
      id: 'account-settings',
      title: 'Managing Your Account Settings',
      content: `
        <h2>Managing Your Account Settings</h2>
        <p>Your Soundraiser account settings let you control your profile, notification preferences, security options, and more. This guide will walk you through all available account settings and explain how to configure them for the best experience.</p>
        
        <h3>Accessing Your Account Settings</h3>
        <p>To manage your account settings:</p>
        <ol>
          <li>Log in to your Soundraiser account</li>
          <li>Click on your profile picture in the top-right corner</li>
          <li>Select "Settings" from the dropdown menu</li>
        </ol>
        
        <h3>Profile Settings</h3>
        <p>Your profile information is displayed across Soundraiser and can influence how your Smart Links appear:</p>
        
        <h4>Basic Information</h4>
        <ul>
          <li><strong>Name/Artist Name</strong>: Update your display name</li>
          <li><strong>Profile Picture</strong>: Upload or change your profile image</li>
          <li><strong>Bio</strong>: Add a short description about yourself or your music</li>
          <li><strong>Primary Genre</strong>: Select your main music genre</li>
        </ul>
        
        <h4>Contact Information</h4>
        <ul>
          <li><strong>Email Address</strong>: Your primary contact and login email</li>
          <li><strong>Recovery Email</strong>: Optional secondary email for account recovery</li>
          <li><strong>Phone Number</strong>: Optional for account security and recovery</li>
        </ul>
        
        <h3>Account Security</h3>
        
        <h4>Password Management</h4>
        <ul>
          <li><strong>Change Password</strong>: Update your current password</li>
          <li><strong>Password Requirements</strong>: Minimum 8 characters with mixed case, numbers, and symbols</li>
        </ul>
        
        <h4>Login Settings</h4>
        <ul>
          <li><strong>Connected Accounts</strong>: Manage third-party login providers (Google, etc.)</li>
          <li><strong>Login History</strong>: View recent logins to your account</li>
          <li><strong>Session Management</strong>: View and terminate active sessions</li>
        </ul>
        
        <h3>Notification Settings</h3>
        <p>Control how and when Soundraiser communicates with you:</p>
        
        <h4>Email Notifications</h4>
        <ul>
          <li><strong>Smart Link Performance</strong>: Get updates on your link statistics</li>
          <li><strong>New Features</strong>: Learn about new Soundraiser features</li>
          <li><strong>Tips & Resources</strong>: Receive music promotion tips and guides</li>
          <li><strong>Account Alerts</strong>: Important account-related notifications</li>
        </ul>
        
        <h4>Notification Frequency</h4>
        <ul>
          <li>Choose between immediate, daily, weekly, or monthly digests</li>
          <li>Set quiet hours when you don't want to receive notifications</li>
        </ul>
        
        <h3>Subscription Management</h3>
        <p>View and manage your Soundraiser subscription:</p>
        <ul>
          <li><strong>Current Plan</strong>: See details of your active subscription</li>
          <li><strong>Billing Cycle</strong>: Check your next billing date</li>
          <li><strong>Upgrade/Downgrade</strong>: Change your subscription level</li>
          <li><strong>Cancel Subscription</strong>: End your paid subscription</li>
        </ul>
        
        <h3>Data & Privacy</h3>
        
        <h4>Data Management</h4>
        <ul>
          <li><strong>Download Your Data</strong>: Export all your Soundraiser data</li>
          <li><strong>Smart Link Backups</strong>: Export backup copies of your links</li>
        </ul>
        
        <h4>Privacy Controls</h4>
        <ul>
          <li><strong>Profile Visibility</strong>: Control who can see your profile</li>
          <li><strong>Analytics Cookies</strong>: Manage analytics and tracking preferences</li>
          <li><strong>Marketing Preferences</strong>: Opt in/out of marketing communications</li>
        </ul>
        
        <h3>Account Deletion</h3>
        <p>If you wish to delete your account:</p>
        <ol>
          <li>Go to Account Settings > Advanced</li>
          <li>Scroll to the bottom and click "Delete Account"</li>
          <li>Follow the confirmation steps</li>
        </ol>
        <p><strong>Note</strong>: Account deletion is permanent and will remove all your Smart Links and data.</p>
      `,
      category_id: 'account-billing',
      slug: 'account-settings',
      related: ['subscription-management']
    },
    {
      id: 'subscription-management',
      title: 'Managing Your Subscription',
      content: `
        <h2>Managing Your Subscription</h2>
        <p>Your Soundraiser subscription gives you access to powerful music promotion tools. This guide will help you understand and manage your subscription, including how to upgrade, downgrade, or cancel your plan.</p>
        
        <h3>Understanding Your Current Plan</h3>
        <p>To view your current subscription details:</p>
        <ol>
          <li>Log in to your Soundraiser account</li>
          <li>Click your profile picture in the top-right corner</li>
          <li>Select "Settings" from the dropdown menu</li>
          <li>Navigate to the "Subscription" tab</li>
        </ol>
        <p>Here you'll see:</p>
        <ul>
          <li>Your current plan (Free or Pro)</li>
          <li>Billing cycle (monthly or annual)</li>
          <li>Next billing date</li>
          <li>Payment method</li>
          <li>Usage statistics relative to your plan limits</li>
        </ul>
        
        <h3>Upgrading Your Subscription</h3>
        <p>To upgrade from Free to Pro:</p>
        <ol>
          <li>Go to Settings > Subscription</li>
          <li>Click "Upgrade to Pro"</li>
          <li>Choose between monthly or annual billing (annual includes a discount)</li>
          <li>Select or add a payment method</li>
          <li>Review the order summary</li>
          <li>Click "Confirm Upgrade"</li>
        </ol>
        <p>Your upgrade will be effective immediately, giving you instant access to all Pro features.</p>
        
        <h3>Switching Between Billing Cycles</h3>
        <p>To switch between monthly and annual billing:</p>
        <ol>
          <li>Go to Settings > Subscription</li>
          <li>Click "Change Plan"</li>
          <li>Select your preferred billing cycle</li>
          <li>Review the changes and confirm</li>
        </ol>
        <p><strong>Note</strong>: When switching from monthly to annual, you'll be charged the annual rate minus any prorated credit for your unused monthly period. When switching from annual to monthly, the change will take effect at the end of your current annual period.</p>
        
        <h3>Canceling Your Subscription</h3>
        <p>If you need to cancel your paid subscription:</p>
        <ol>
          <li>Go to Settings > Subscription</li>
          <li>Click "Cancel Subscription"</li>
          <li>Select a reason for cancellation (this helps us improve)</li>
          <li>Click "Confirm Cancellation"</li>
        </ol>
        <p><strong>Important</strong>: Cancellation takes effect at the end of your current billing period. You'll continue to have access to Pro features until that date. Your account will then revert to the Free plan rather than being deleted.</p>
        
        <h3>What Happens After Cancellation</h3>
        <ul>
          <li>Your account remains active on the Free plan</li>
          <li>Your Smart Links will continue to work</li>
          <li>Pro features will become unavailable</li>
          <li>Link analytics data will be retained</li>
          <li>You can resubscribe at any time</li>
        </ul>
      `,
      category_id: 'account-billing',
      slug: 'subscription-management',
      related: ['account-settings']
    },
    
    // Troubleshooting
    {
      id: 'common-issues',
      title: 'Common Issues and Solutions',
      content: `
        <h2>Common Issues and Solutions</h2>
        <p>Even with the most reliable platforms, users occasionally run into issues. This guide covers the most common problems Soundraiser users encounter and provides step-by-step solutions.</p>
        
        <h3>Smart Link Creation Issues</h3>
        
        <h4>Problem: Automatic platform search isn't finding my music</h4>
        <p><strong>Solutions:</strong></p>
        <ul>
          <li>Verify your music is actually live on streaming platforms (there can be delays after distribution)</li>
          <li>Try using the exact title as it appears on streaming services, including any featuring artists</li>
          <li>Search using ISRC code if available</li>
          <li>If automatic search fails, use manual link addition instead</li>
        </ul>
        
        <h4>Problem: Unable to upload artwork</h4>
        <p><strong>Solutions:</strong></p>
        <ul>
          <li>Ensure your image is in JPG, PNG, or WebP format</li>
          <li>Check that the file size is under 5MB</li>
          <li>Try a different browser or clear your browser cache</li>
          <li>Resize your image if it's excessively large (recommended: 1500x1500px)</li>
        </ul>
        
        <h4>Problem: Custom URL is unavailable</h4>
        <p><strong>Solutions:</strong></p>
        <ul>
          <li>Try a more specific URL (e.g., add your artist name)</li>
          <li>Use hyphens instead of spaces or underscores</li>
          <li>Add a unique identifier like release year or version</li>
        </ul>
        
        <h3>Account Access Issues</h3>
        
        <h4>Problem: Forgotten password</h4>
        <p><strong>Solutions:</strong></p>
        <ol>
          <li>Click "Forgot password" on the login screen</li>
          <li>Enter your email address</li>
          <li>Check your inbox for a password reset link (check spam folder too)</li>
          <li>Follow the link to create a new password</li>
        </ol>
        
        <h4>Problem: Not receiving verification email</h4>
        <p><strong>Solutions:</strong></p>
        <ul>
          <li>Check your spam/junk folder</li>
          <li>Add no-reply@soundraiser.io to your contacts</li>
          <li>Try requesting the email again after 5 minutes</li>
          <li>Verify you entered your email correctly during registration</li>
          <li>Contact support if issues persist</li>
        </ul>
        
        <h3>Smart Link Performance Issues</h3>
        
        <h4>Problem: Smart Link loads slowly</h4>
        <p><strong>Solutions:</strong></p>
        <ul>
          <li>Optimize your cover artwork (compress the image file)</li>
          <li>Reduce the number of platforms if you have an excessive amount</li>
          <li>Check your internet connection</li>
          <li>Clear your browser cache</li>
        </ul>
        
        <h4>Problem: Platform links not working</h4>
        <p><strong>Solutions:</strong></p>
        <ul>
          <li>Verify the platform links are still valid (platforms occasionally change URL structures)</li>
          <li>Check if the music is still available on that platform</li>
          <li>Edit the Smart Link to update any broken links</li>
          <li>Test the platform links outside of your Smart Link to confirm they work</li>
        </ul>
        
        <h3>Analytics Issues</h3>
        
        <h4>Problem: Analytics not showing any data</h4>
        <p><strong>Solutions:</strong></p>
        <ul>
          <li>Verify your Smart Link has actually been visited (share it with friends to test)</li>
          <li>Be patient - analytics can take up to 24 hours to fully process</li>
          <li>Check if you have an ad or tracking blocker enabled that might interfere</li>
          <li>Try a different browser or device</li>
        </ul>
        
        <h4>Problem: Click counts seem inaccurate</h4>
        <p><strong>Solutions:</strong></p>
        <ul>
          <li>Remember that some streaming services open in their apps rather than browsers, which can affect tracking</li>
          <li>Certain privacy features on users' devices can block tracking</li>
          <li>There will always be some discrepancy between link analytics and platform-reported streams</li>
        </ul>
        
        <h3>Billing Issues</h3>
        
        <h4>Problem: Payment method declined</h4>
        <p><strong>Solutions:</strong></p>
        <ul>
          <li>Verify your card details are correct and up to date</li>
          <li>Check that your card has sufficient funds</li>
          <li>Contact your bank to ensure they're not blocking the transaction</li>
          <li>Try a different payment method</li>
        </ul>
        
        <h4>Problem: Subscription not reflecting upgrade</h4>
        <p><strong>Solutions:</strong></p>
        <ul>
          <li>Refresh the page or log out and back in</li>
          <li>Check if the payment was successfully processed</li>
          <li>Allow up to 15 minutes for the system to fully process the change</li>
          <li>Contact support if the issue persists after an hour</li>
        </ul>
        
        <h3>Technical Requirements</h3>
        <p>For the best Soundraiser experience, ensure:</p>
        <ul>
          <li>You're using an up-to-date browser (Chrome, Firefox, Safari, or Edge)</li>
          <li>JavaScript is enabled</li>
          <li>Cookies are allowed for soundraiser.io</li>
          <li>Your device has a stable internet connection</li>
        </ul>
        
        <h3>Still Need Help?</h3>
        <p>If you've tried these solutions and still experience issues:</p>
        <ol>
          <li>Check our <a href="/help">Help Center</a> for more detailed guides</li>
          <li><a href="/contact">Contact our support team</a> with specific details about your issue</li>
          <li>Include screenshots and browser/device information when possible</li>
        </ol>
      `,
      category_id: 'troubleshooting',
      slug: 'common-issues',
      popular: true,
      related: ['account-settings', 'first-smart-link']
    }
  ];
  
  // Enhance articles with category information
  const articlesWithCategories = articles.map(article => {
    const category = categories.find(c => c.id === article.category_id) || null;
    return { ...article, category };
  });
  
  // Select featured and popular articles
  const featuredArticles = articlesWithCategories.filter(article => article.featured);
  const popularArticles = articlesWithCategories.filter(article => article.popular);

  // Handle search
  const performSearch = (query: string) => {
    setSearchQuery(query);
    setShowSearchResults(query.trim() !== "");
    
    if (query.trim() === "") {
      setSearchResults([]);
      return;
    }
    
    // Simple search algorithm that looks for matches in title and content
    const results: HelpSearchResult[] = [];
    
    articles.forEach(article => {
      const titleMatch = article.title.toLowerCase().includes(query.toLowerCase());
      const contentMatch = article.content.toLowerCase().includes(query.toLowerCase());
      
      if (titleMatch || contentMatch) {
        // Calculate relevance score (title matches are weighted higher)
        const relevance = (titleMatch ? 3 : 0) + (contentMatch ? 1 : 0);
        results.push({ article, relevance });
      }
    });
    
    // Sort by relevance score
    results.sort((a, b) => b.relevance - a.relevance);
    setSearchResults(results);
  };
  
  const handleClearSearch = () => {
    setSearchQuery("");
    setShowSearchResults(false);
    setSearchResults([]);
  };
  
  // Handle article selection
  const handleArticleSelect = (articleId: string) => {
    const article = articles.find(a => a.id === articleId);
    if (article) {
      navigate(`/help/${article.slug}`);
    }
  };
  
  // Handle category selection
  const handleCategorySelect = (categoryId: string) => {
    navigate(`/help/category/${categoryId}`);
  };
  
  // Handle back navigation
  const handleBack = () => {
    navigate('/help');
  };
  
  // URL-based navigation & routing
  useEffect(() => {
    // Case 1: Article route (/help/:slug)
    if (slug && !categoryId) {
      const article = articles.find(a => a.slug === slug);
      if (article) {
        setActiveArticleId(article.id);
        setActiveCategoryId(article.category_id);
        setShowSearchResults(false);
      } else {
        navigate('/help', { replace: true });
      }
    } 
    // Case 2: Category route (/help/category/:categoryId)
    else if (categoryId && !slug) {
      const category = categories.find(c => c.id === categoryId);
      if (category) {
        setActiveCategoryId(categoryId);
        setActiveArticleId(null);
        setShowSearchResults(false);
      } else {
        navigate('/help', { replace: true });
      }
    }
    // Case 3: Default help center route (/help)
    else if (location.pathname === '/help') {
      setActiveArticleId(null);
      setActiveCategoryId(null);
    }
  }, [slug, categoryId, articles, categories, navigate, location.pathname]);
  
  // Get current article and related articles
  const currentArticle = activeArticleId ? 
    articlesWithCategories.find(a => a.id === activeArticleId) || null 
    : null;
  
  const currentCategory = activeCategoryId ? 
    categories.find(c => c.id === activeCategoryId) || null 
    : null;
    
  const articlesInCurrentCategory = currentCategory ?
    articlesWithCategories.filter(a => a.category_id === currentCategory.id)
    : [];
  
  const relatedArticles = useMemo(() => {
    if (!currentArticle || !currentArticle.related || currentArticle.related.length === 0) {
      return [];
    }
    return articlesWithCategories.filter(a => currentArticle.related!.includes(a.id));
  }, [currentArticle, articlesWithCategories]);
  
  return (
    <>
      <PageSEO
        title={currentArticle ? `${currentArticle.title} | Help Center` : (currentCategory ? `${currentCategory.name} | Help Center` : "Help Center")}
        description="Find answers to your questions about Soundraiser. Learn how to create Smart Links, manage your music, track analytics, and more."
      />
      
      <main className="min-h-screen bg-background py-12">
        <div className="container px-4 mx-auto max-w-screen-xl">
          {/* Mobile Search and Menu */}
          <div className="flex items-center justify-between mb-6 md:hidden">
            <div className="flex-1 mr-3">
              <HelpSearch onSearch={performSearch} />
            </div>
            
            <Sheet open={sidebarOpen} onOpenChange={setSidebarOpen}>
              <SheetTrigger asChild>
                <Button variant="outline" size="icon">
                  <Menu className="h-5 w-5" />
                  <span className="sr-only">Open menu</span>
                </Button>
              </SheetTrigger>
              <SheetContent side="right" className="w-[300px] sm:w-[350px] overflow-auto">
                <HelpSidebar
                  categories={categories}
                  articles={articles}
                  activeArticleId={activeArticleId}
                  activeCategoryId={activeCategoryId}
                  onSelectArticle={handleArticleSelect}
                  onSelectCategory={handleCategorySelect}
                  className="mt-6"
                />
              </SheetContent>
            </Sheet>
          </div>
          
          {/* Desktop Search */}
          <div className="hidden md:block mb-8">
            <div className="max-w-2xl mx-auto">
              <HelpSearch onSearch={performSearch} />
            </div>
          </div>
          
          {/* Main Layout */}
          <div className="flex flex-col md:flex-row gap-8">
            {/* Sidebar (Desktop only) */}
            <div className="hidden md:block w-64 lg:w-72 flex-shrink-0">
              <HelpSidebar
                categories={categories}
                articles={articles}
                activeArticleId={activeArticleId}
                activeCategoryId={activeCategoryId}
                onSelectArticle={handleArticleSelect}
                onSelectCategory={handleCategorySelect}
              />
            </div>
            
            {/* Main Content Area */}
            <div className="flex-1">
              {/* Search Results */}
              {showSearchResults && (
                <HelpSearchResults 
                  searchQuery={searchQuery}
                  searchResults={searchResults}
                  popularArticles={popularArticles}
                  onSelectArticle={handleArticleSelect}
                  onClearSearch={handleClearSearch}
                />
              )}
              
              {/* Article, Category, or Home View */}
              {!showSearchResults && (
                <>
                  {activeArticleId && currentArticle ? (
                    <HelpArticle
                      article={currentArticle}
                      relatedArticles={relatedArticles}
                      onBack={handleBack}
                      onArticleSelect={handleArticleSelect}
                    />
                  ) : currentCategory ? (
                    <HelpCategoryView
                      category={currentCategory}
                      articles={articlesInCurrentCategory}
                      onSelectArticle={handleArticleSelect}
                    />
                  ) : (
                    <HelpHome
                      categories={categories}
                      articles={articlesWithCategories}
                      featuredArticles={featuredArticles}
                      popularArticles={popularArticles}
                      onSelectArticle={handleArticleSelect}
                    />
                  )}
                </>
              )}
            </div>
          </div>
        </div>
      </main>
      
      <Footer />
    </>
  );
}
