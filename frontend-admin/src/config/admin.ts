// Compatibility entrypoint for admin-only consumers. The navigation contract
// is shared because the Portal shell renders an admin switch for authorized
// client users as well.
export {
  adminSurfaceLinks,
  adminSurfaceNavigation,
} from '@/config/admin-navigation'
