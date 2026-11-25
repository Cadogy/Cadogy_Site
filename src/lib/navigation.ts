export const isActivePath = (
  pathname: string,
  href: string,
  { exact = false }: { exact?: boolean } = {}
) => pathname === href || (!exact && pathname.startsWith(`${href}/`))
