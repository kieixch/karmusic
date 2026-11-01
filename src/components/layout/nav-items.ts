import {
  Compass,
  FolderDown,
  Globe2,
  Heart,
  History,
  Home,
  Library,
  ListMusic,
  Search,
  Settings,
  ScrollText,
} from "lucide-react";

export interface NavItem {
  href: string;
  label: string;
  icon: typeof Home;
  exact?: boolean;
}

export const discoverNav: NavItem[] = [
  { href: "/", label: "Home", icon: Home, exact: true },
  { href: "/explore", label: "Explore", icon: Compass },
  { href: "/search", label: "Search", icon: Search },
  { href: "/online", label: "Online Music", icon: Globe2 },
];

export const musicNav: NavItem[] = [
  { href: "/library", label: "Your Library", icon: Library, exact: true },
  { href: "/library/local", label: "Local Music", icon: FolderDown },
  { href: "/playlists", label: "Playlists", icon: ListMusic },
  { href: "/favorites", label: "Favorites", icon: Heart },
  { href: "/recent", label: "Recently Played", icon: History },
];

export const mobileNav: NavItem[] = [
  { href: "/", label: "Home", icon: Home, exact: true },
  { href: "/explore", label: "Explore", icon: Compass },
  { href: "/search", label: "Search", icon: Search },
  { href: "/library", label: "Library", icon: Library },
  { href: "/playlists", label: "Playlists", icon: ListMusic },
];

export const lyricsNav = { href: "/now-playing", label: "Lyrics Mode", icon: ScrollText, exact: false };
export const settingsNav: NavItem = { href: "/settings", label: "Settings", icon: Settings };
