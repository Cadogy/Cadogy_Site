import { displayIp } from "./devices"

type SignInPlace = { readonly device: string; readonly network: string }

export const networkOf = (ip: string) => {
  const address = displayIp(ip)
  if (!address) return ""
  if (address.includes(".")) return address.split(".").slice(0, 3).join(".")
  return address.split(":").slice(0, 3).join(":")
}

export const isUnfamiliarSignIn = ({
  device,
  network,
  history,
}: SignInPlace & { readonly history: readonly SignInPlace[] }) =>
  history.length > 0 &&
  !history.some((past) => past.device === device && past.network === network)
