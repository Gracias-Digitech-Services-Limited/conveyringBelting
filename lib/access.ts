import type { Access, FieldAccess } from 'payload'

/** Mirrors WordPress's Administrator role: manages users, menus and site settings. */
export const isAdmin: Access = ({ req }) => req.user?.role === 'admin'

/** Mirrors WordPress's Editor role: full content management, but not site configuration. */
export const isLoggedIn: Access = ({ req }) => Boolean(req.user)

export const isAdminFieldAccess: FieldAccess = ({ req }) => req.user?.role === 'admin'
