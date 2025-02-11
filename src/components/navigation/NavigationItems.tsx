
import {
  NavigationMenu,
  NavigationMenuContent,
  NavigationMenuItem,
  NavigationMenuLink,
  NavigationMenuList,
  NavigationMenuTrigger,
} from "@/components/ui/navigation-menu"
import { cn } from "@/lib/utils"
import { 
  BarChart3, 
  Mail, 
  Share2, 
  Target, 
  BookOpen, 
  HelpCircle,
} from "lucide-react"
import { useLocation } from "react-router-dom"

const features = [
  {
    title: "Release Pages",
    description: "Beautifully designed pages for your releases",
    href: "/features#release-pages",
    icon: Share2
  },
  {
    title: "Meta Pixel Integration",
    description: "Track conversions and retarget your audience",
    href: "/features#meta-pixel",
    icon: Target
  },
  {
    title: "Real-Time Analytics",
    description: "Comprehensive analytics across platforms",
    href: "/features#analytics",
    icon: BarChart3
  },
  {
    title: "Email List Building",
    description: "Turn passive listeners into engaged fans",
    href: "/features#email-list",
    icon: Mail
  },
]

const resources = [
  {
    title: "Blog",
    description: "Read the latest updates and tips",
    href: "/blog",
    icon: BookOpen
  },
  {
    title: "Help Center",
    description: "Get help with your questions",
    href: "/help",
    icon: HelpCircle
  },
]

export function NavigationItems() {
  const location = useLocation()

  return (
    <NavigationMenu>
      <NavigationMenuList>
        <NavigationMenuItem>
          <NavigationMenuTrigger
            className="h-8 px-3 text-sm hover:bg-neutral-50 transition-colors"
          >
            Features
          </NavigationMenuTrigger>
          <NavigationMenuContent>
            <div className="grid gap-3 p-4 w-[440px] animate-scale-in">
              <div className="grid grid-cols-2 gap-3">
                {features.map((feature) => (
                  <NavigationMenuLink
                    key={feature.title}
                    href={feature.href}
                    className={cn(
                      "block select-none space-y-1 rounded-md p-3 leading-none no-underline outline-none transition-colors",
                      "hover:bg-neutral-50 focus:bg-neutral-50",
                      location.hash === feature.href.split('#')[1] && "bg-neutral-50"
                    )}
                  >
                    <div className="flex items-center gap-2">
                      <feature.icon className="h-4 w-4 text-primary" />
                      <div className="text-sm font-medium leading-none">{feature.title}</div>
                    </div>
                    <p className="line-clamp-2 text-sm leading-snug text-muted-foreground mt-2">
                      {feature.description}
                    </p>
                  </NavigationMenuLink>
                ))}
              </div>
              <div className="mt-3 border-t pt-3">
                <NavigationMenuLink
                  href="/features"
                  className="text-sm text-muted-foreground hover:text-primary transition-colors"
                >
                  View all features →
                </NavigationMenuLink>
              </div>
            </div>
          </NavigationMenuContent>
        </NavigationMenuItem>
        <NavigationMenuItem>
          <NavigationMenuTrigger
            className="h-8 px-3 text-sm hover:bg-neutral-50 transition-colors"
          >
            Resources
          </NavigationMenuTrigger>
          <NavigationMenuContent>
            <div className="grid gap-3 p-4 w-[360px] animate-scale-in">
              {resources.map((resource) => (
                <NavigationMenuLink
                  key={resource.title}
                  href={resource.href}
                  className={cn(
                    "block select-none space-y-1 rounded-md p-3 leading-none no-underline outline-none transition-colors",
                    "hover:bg-neutral-50 focus:bg-neutral-50",
                    location.pathname === resource.href && "bg-neutral-50"
                  )}
                >
                  <div className="flex items-center gap-2">
                    <resource.icon className="h-4 w-4 text-primary" />
                    <div className="text-sm font-medium leading-none">{resource.title}</div>
                  </div>
                  <p className="line-clamp-2 text-sm leading-snug text-muted-foreground mt-2">
                    {resource.description}
                  </p>
                </NavigationMenuLink>
              ))}
            </div>
          </NavigationMenuContent>
        </NavigationMenuItem>
        <NavigationMenuItem>
          <NavigationMenuLink
            href="/pricing"
            className={cn(
              "group inline-flex h-8 w-max items-center justify-center rounded-md px-3 py-2 text-sm font-medium transition-colors",
              "hover:bg-neutral-50 hover:text-primary focus:bg-neutral-50 focus:text-primary focus:outline-none",
              "disabled:pointer-events-none disabled:opacity-50",
              location.pathname === "/pricing" && "bg-neutral-50 text-primary"
            )}
          >
            Pricing
          </NavigationMenuLink>
        </NavigationMenuItem>
      </NavigationMenuList>
    </NavigationMenu>
  )
}

