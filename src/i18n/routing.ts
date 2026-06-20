import {defineRouting} from 'next-intl/routing';
import {createNavigation} from 'next-intl/navigation';

export const routing = defineRouting({
  locales: ['ar', 'en'],

  /** Arabic is the site default — do not redirect to English from browser language. */
  defaultLocale: 'ar',
  localeDetection: false,

  localePrefix: 'always',
});

// Lightweight wrappers around Next.js' navigation APIs
// that will automatically consider the routing configuration
export const {Link, redirect, usePathname, useRouter} =
  createNavigation(routing);
