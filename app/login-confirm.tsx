"use client";

import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import {
  FieldGroup,
} from "@/components/ui/field"
import z from "zod"
import { VoterSchema } from "./page"

export function LoginConfirm({
  voter,
  className,
  onYes,
  onNo,
  ...props
}: {
  voter: z.infer<typeof VoterSchema> | null
  onYes: () => void
  onNo: () => void
  className?: string
} & React.ComponentProps<"div">) {
  return (
    <div className={cn("flex flex-col gap-6", className)} {...props}>
      <Card className="overflow-hidden p-0">
        <CardContent className="grid p-0 md:grid-cols-2">
          <div className="p-8">
            <FieldGroup>
              <div className="flex flex-col items-center gap-2 text-center">
                <h1 className="text-2xl font-bold">BSC Elections!</h1>
                <p className="text-balance text-muted-foreground">
                  Confirm your details. Is this you?
                </p>
              </div>
              <>
                <div className="grid grid-cols-[auto_1%_auto] gap-2">
                  <p className="text-muted-foreground">Your Name</p>
                  <p className="text-muted-foreground">:</p>
                  <p>{voter?.name}</p>
                  <p className="text-muted-foreground">Your Admission Number</p>
                  <p className="text-muted-foreground">:</p>
                  <p>{voter?.admid}</p>
                  <p className="text-muted-foreground">Grade</p>
                  <p className="text-muted-foreground">:</p>
                  <p>{voter?.grade}</p>
                  <p className="text-muted-foreground">Class</p>
                  <p className="text-muted-foreground">:</p>
                  <p>{voter?.class}</p>
                  <p className="text-muted-foreground">House</p>
                  <p className="text-muted-foreground">:</p>
                  <p>{voter?.house}</p>
                </div>
                <div className="grid grid-flow-col gap-5 w-full">
                    <Button className="w-full" variant="secondary" onClick={onNo}>No</Button>
                    <Button className="w-full" onClick={onYes}>Yes</Button>
                </div>
              </>
            </FieldGroup>
          </div>

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
