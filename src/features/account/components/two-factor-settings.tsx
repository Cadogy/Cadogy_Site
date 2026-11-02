"use client"

import { useState, type FormEvent } from "react"
import Image from "next/image"
import { useRouter } from "next/navigation"
import { authClient } from "@/features/auth/client"
import { Copy, Download, Loader2 } from "lucide-react"
import QRCode from "qrcode"

import { Button } from "@/components/ui/button"
import { Field } from "@/components/ui/field"
import { Input } from "@/components/ui/input"

import { FormAlert } from "./auth-card"
import { authErrorMessage } from "./auth-errors"

type Purpose = "enable" | "disable" | "codes"

type Step =
  | { readonly kind: "idle" }
  | { readonly kind: "password"; readonly purpose: Purpose }
  | {
      readonly kind: "scan"
      readonly qr: string
      readonly secret: string
      readonly backupCodes: readonly string[]
    }
  | { readonly kind: "codes"; readonly codes: readonly string[] }

type ClientError = { code?: string; message?: string; status: number }

const groupedSecret = (uri: string) =>
  (new URL(uri).searchParams.get("secret") ?? "").replace(/(.{4})(?=.)/g, "$1 ")

const qrDataUrl = async (uri: string) =>
  `data:image/svg+xml;utf8,${encodeURIComponent(
    await QRCode.toString(uri, { type: "svg", margin: 1 })
  )}`

function SubmitButton({
  pending,
  children,
}: {
  pending: boolean
  children: React.ReactNode
}) {
  return (
    <Button type="submit" disabled={pending}>
      {pending ? (
        <Loader2 className="size-4 animate-spin" aria-hidden="true" />
      ) : null}
      {children}
    </Button>
  )
}

function BackupCodes({
  codes,
  onDone,
}: {
  codes: readonly string[]
  onDone: () => void
}) {
  const text = codes.join("\n")
  const download = () => {
    const url = URL.createObjectURL(new Blob([text], { type: "text/plain" }))
    const link = document.createElement("a")
    link.href = url
    link.download = "cadogy-backup-codes.txt"
    link.click()
    URL.revokeObjectURL(url)
  }
  return (
    <div className="grid gap-5">
      <p className="text-sm text-muted-foreground">
        Save these backup codes somewhere safe, like your password manager. Each
        one signs you in once if you lose your phone. We won&apos;t show them
        again.
      </p>
      <ul className="grid grid-cols-2 gap-x-6 gap-y-2 border-t pt-4 font-mono text-sm">
        {codes.map((code) => (
          <li key={code}>{code}</li>
        ))}
      </ul>
      <div className="flex flex-wrap gap-2">
        <Button
          type="button"
          variant="outline"
          onClick={() => void navigator.clipboard?.writeText(text)}
        >
          <Copy className="size-4" aria-hidden="true" />
          Copy
        </Button>
        <Button type="button" variant="outline" onClick={download}>
          <Download className="size-4" aria-hidden="true" />
          Download
        </Button>
        <Button type="button" onClick={onDone}>
          I&apos;ve saved my codes
        </Button>
      </div>
    </div>
  )
}

const PASSWORD_PROMPTS: Record<Purpose, string> = {
  enable: "Confirm your password to set up two-factor.",
  disable: "Confirm your password to turn off two-factor.",
  codes:
    "Confirm your password to create new backup codes. Your old codes stop working.",
}

export function TwoFactorSettings({ enabled }: { enabled: boolean }) {
  const router = useRouter()
  const [step, setStep] = useState<Step>({ kind: "idle" })
  const [pending, setPending] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const finish = () => {
    setStep({ kind: "idle" })
    router.refresh()
  }

  const fail = (clientError: ClientError) => {
    setPending(false)
    setError(authErrorMessage(clientError))
  }

  const start = (purpose: Purpose) => {
    setError(null)
    setStep({ kind: "password", purpose })
  }

  const confirmPassword = async (
    purpose: Purpose,
    event: FormEvent<HTMLFormElement>
  ) => {
    event.preventDefault()
    const password = String(
      new FormData(event.currentTarget).get("password") ?? ""
    )
    setPending(true)
    setError(null)

    if (purpose === "enable") {
      const result = await authClient.twoFactor.enable({ password })
      if (result.error) return fail(result.error)
      if (!("totpURI" in result.data))
        return fail({
          status: 500,
          message: "Two-factor setup isn't available.",
        })
      setStep({
        kind: "scan",
        qr: await qrDataUrl(result.data.totpURI),
        secret: groupedSecret(result.data.totpURI),
        backupCodes: result.data.backupCodes,
      })
    }
    if (purpose === "disable") {
      const result = await authClient.twoFactor.disable({ password })
      if (result.error) return fail(result.error)
      finish()
    }
    if (purpose === "codes") {
      const result = await authClient.twoFactor.generateBackupCodes({
        password,
      })
      if (result.error) return fail(result.error)
      setStep({ kind: "codes", codes: result.data.backupCodes })
    }
    setPending(false)
  }

  const verifyCode = async (
    backupCodes: readonly string[],
    event: FormEvent<HTMLFormElement>
  ) => {
    event.preventDefault()
    const code = String(
      new FormData(event.currentTarget).get("code") ?? ""
    ).trim()
    setPending(true)
    setError(null)
    const result = await authClient.twoFactor.verifyTotp({ code })
    if (result.error) return fail(result.error)
    setPending(false)
    setStep({ kind: "codes", codes: backupCodes })
  }

  return (
    <div className="grid gap-5">
      {error ? <FormAlert>{error}</FormAlert> : null}

      {step.kind === "idle" ? (
        <div className="flex flex-wrap items-center gap-4 border-t pt-5">
          <p className="flex-1 text-sm">
            {enabled
              ? "On. You'll enter a code from your authenticator app when you sign in with your password."
              : "Off. Add a code from an authenticator app to your sign-in."}
          </p>
          {enabled ? (
            <div className="flex flex-wrap gap-2">
              <Button variant="outline" onClick={() => start("codes")}>
                New backup codes
              </Button>
              <Button variant="ghost" onClick={() => start("disable")}>
                Turn off
              </Button>
            </div>
          ) : (
            <Button onClick={() => start("enable")}>Turn on two-factor</Button>
          )}
        </div>
      ) : null}

      {step.kind === "password" ? (
        <form
          onSubmit={(event) => void confirmPassword(step.purpose, event)}
          className="grid gap-5 border-t pt-5"
        >
          <p className="text-sm text-muted-foreground">
            {PASSWORD_PROMPTS[step.purpose]}
          </p>
          <Field id="two-factor-password" label="Password">
            {(control) => (
              <Input
                {...control}
                name="password"
                type="password"
                autoComplete="current-password"
                required
                autoFocus
              />
            )}
          </Field>
          <div className="flex flex-wrap gap-2">
            <SubmitButton pending={pending}>Continue</SubmitButton>
            <Button type="button" variant="ghost" onClick={finish}>
              Cancel
            </Button>
          </div>
        </form>
      ) : null}

      {step.kind === "scan" ? (
        <form
          onSubmit={(event) => void verifyCode(step.backupCodes, event)}
          className="grid gap-5 border-t pt-5"
        >
          <p className="text-sm text-muted-foreground">
            Scan this with an authenticator app such as 1Password, Google
            Authenticator or Authy, then enter the 6-digit code it shows.
          </p>
          <div className="flex flex-wrap items-center gap-6">
            <Image
              unoptimized
              src={step.qr}
              alt="QR code for your authenticator app"
              width={176}
              height={176}
              className="rounded-field bg-white p-2"
            />
            <div className="grid gap-1 text-sm">
              <span className="text-muted-foreground">
                Can&apos;t scan? Enter this key:
              </span>
              <code className="font-mono">{step.secret}</code>
            </div>
          </div>
          <Field id="two-factor-code" label="Code from your app">
            {(control) => (
              <Input
                {...control}
                name="code"
                inputMode="numeric"
                autoComplete="one-time-code"
                maxLength={6}
                required
              />
            )}
          </Field>
          <div className="flex flex-wrap gap-2">
            <SubmitButton pending={pending}>Verify and turn on</SubmitButton>
            <Button type="button" variant="ghost" onClick={finish}>
              Cancel
            </Button>
          </div>
        </form>
      ) : null}

      {step.kind === "codes" ? (
        <BackupCodes codes={step.codes} onDone={finish} />
      ) : null}
    </div>
  )
}
