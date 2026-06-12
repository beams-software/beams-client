"use client";

import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import {
  Field,
  FieldGroup,
  FieldLabel,
} from "@/components/ui/field"
import { Input } from "@/components/ui/input"
import {
  Dispatch,
  SetStateAction,
  useEffect,
  useRef,
  useState,
} from "react"
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Spinner } from "@/components/ui/spinner"

export function LoginForm({
  isLoading,
  className,
  onLoginSubmit,
  successString,
  errorString,
  ...props
}: {
  onLoginSubmit: (
    admid: number,
    house: string,
    setErrorString: Dispatch<SetStateAction<string | null>>
  ) => void
  successString: string | null
  errorString: string | null
  isLoading: boolean
  className?: string
} & React.ComponentProps<"div">) {
  const [error, setError] = useState<string | null>(null)

  const admInput = useRef<HTMLInputElement>(null)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [admid, setAdmid] = useState<number | null>(null)
  const [house, setHouse] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(successString)
  const [error2, setError2] = useState<string | null>(errorString)

  const onFormSubmit = (e: React.SubmitEvent<HTMLFormElement>) => {
    e.preventDefault()
    if (admid && house) {
      onLoginSubmit(admid, house, setError)
    }
  }

  useEffect(() => {
    if (admInput.current) {
      admInput.current.value = ""
    }
  }, [])

  return (
    <div className={cn("flex flex-col gap-6", className)} {...props}>
      <Card className="overflow-hidden p-0">
        <CardContent className="grid p-0 md:grid-cols-2">
          <form className="p-6 md:p-8" onSubmit={onFormSubmit}>
            <FieldGroup>
              <div className="flex flex-col items-center gap-2 text-center">
                <h1 className="text-2xl font-bold">BSC Elections!</h1>
                <p className="text-balance text-muted-foreground">
                  {isLoading ? "Loading..." : "Enter your details"}
                </p>
                {error && (
                  <p className="text-balance text-destructive">{error}</p>
                )}
                {errorString && (
                  <p
                    className="text-balance text-destructive"
                    ref={(r) => {
                      if (r) {
                        setTimeout(() => {
                          r.innerText = ""
                        }, 10000)
                      }
                    }}
                  >
                    {errorString}
                  </p>
                )}
                {successString && (
                  <p
                    className="text-balance text-green-500"
                    ref={(r) => {
                      if (r) {
                        setTimeout(() => {
                          r.innerText = ""
                        }, 5000)
                      }
                    }}
                  >
                    {successString}
                  </p>
                )}
              </div>
              {isLoading ? (
                <Spinner className="m-15 size-10 self-center" />
              ) : (
                <>
                  <Field>
                    <FieldLabel htmlFor="admid">Admission Number</FieldLabel>
                    <Input
                      id="admid"
                      type="number"
                      placeholder="Enter your admission"
                      required
                      disabled={isLoading}
                      defaultValue={""}
                      ref={admInput}
                      onChange={(e) => {
                        setAdmid(parseInt(e.target.value))
                      }}
                    />
                  </Field>

                  <Field>
                    <FieldLabel htmlFor="house">House</FieldLabel>
                    <Select required name="house" onValueChange={setHouse}>
                      <SelectTrigger>
                        <SelectValue placeholder="Select your house" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectGroup>
                          <SelectItem value="WINTER">WINTER</SelectItem>
                          <SelectItem value="SUMMER">SUMMER</SelectItem>
                          <SelectItem value="SPRING">SPRING</SelectItem>
                        </SelectGroup>
                      </SelectContent>
                    </Select>
                  </Field>

                  <Field>
                    <Button type="submit" disabled={isLoading}>
                      {isLoading ? "Logging in..." : "Login"}
                    </Button>
                  </Field>
                </>
              )}
            </FieldGroup>
          </form>
          <div className="relative hidden bg-muted md:block">
            <img
              src="/beams_2_800x800.png"
              alt="Image"
              className="absolute inset-0 h-full w-full object-cover"
            />
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
