
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
  return (
    <NavigationMenu>
      <NavigationMenuList>
        <NavigationMenuItem>
          <NavigationMenuTrigger>Features</NavigationMenuTrigger>
          <NavigationMenuContent>
            <div className="grid gap-3 p-6 w-[500px]">
              <div className="grid grid-cols-2 gap-4">
                {features.map((feature) => (
                  <NavigationMenuLink
                    key={feature.title}
                    href={feature.href}
                    className={cn(
                      "block select-none space-y-1 rounded-md p-3 leading-none no-underline outline-none transition-colors hover:bg-accent hover:text-accent-foreground focus:bg-accent focus:text-accent-foreground"
                    )}
                  >
                    <div className="flex items-center gap-2">
                      <feature.icon className="h-4 w-4" />
                      <div className="text-sm font-medium leading-none">{feature.title}</div>
                    </div>
                    <p className="line-clamp-2 text-sm leading-snug text-muted-foreground">
                      {feature.description}
                    </p>
                  </NavigationMenuLink>
                ))}
              </div>
              <div className="mt-4 border-t pt-4">
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
          <NavigationMenuTrigger>Resources</NavigationMenuTrigger>
          <NavigationMenuContent>
            <div className="grid gap-3 p-6 w-[400px]">
              {resources.map((resource) => (
                <NavigationMenuLink
                  key={resource.title}
                  href={resource.href}
                  className={cn(
                    "block select-none space-y-1 rounded-md p-3 leading-none no-underline outline-none transition-colors hover:bg-accent hover:text-accent-foreground focus:bg-accent focus:text-accent-foreground"
                  )}
                >
                  <div className="flex items-center gap-2">
                    <resource.icon className="h-4 w-4" />
                    <div className="text-sm font-medium leading-none">{resource.title}</div>
                  </div>
                  <p className="line-clamp-2 text-sm leading-snug text-muted-foreground">
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
            className="group inline-flex h-10 w-max items-center justify-center rounded-md px-4 py-2 text-sm font-medium transition-colors hover:text-primary focus:text-primary focus:outline-none disabled:pointer-events-none disabled:opacity-50"
          >
            Pricing
          </NavigationMenuLink>
        </NavigationMenuItem>
      </NavigationMenuList>
    </NavigationMenu>
  )
}
