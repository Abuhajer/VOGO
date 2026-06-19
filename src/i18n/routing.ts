import {defineRouting} from 'next-intl/routing';
import {createNavigation} from 'next-intl/navigation';

export const routing = defineRouting({
  // A list of all locales that are supported
  locales: ['ar', 'en'],

  // Used when no locale matches
  defaultLocale: 'ar',

  // Prepend the locale to all paths
  localePrefix: 'always'
});

// Lightweight wrappers around Next.js' navigation APIs
// that will automatically consider the routing configuration
export const {Link, redirect, usePathname, useRouter} =
  createNavigation(routing);
