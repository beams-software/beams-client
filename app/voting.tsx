"use client";

import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { RefObject, useEffect, useRef, useState } from "react"
import styled from "styled-components"
import { candidateResponseSchema, VoterSchema } from "./page"
import z from "zod"
import wcsData from "./wcs.json"
import { cn } from "@/lib/utils"

type RadioProps = {
  name: string
  value: string
  checked: boolean
  onChange: () => void
  nextButtonRef: RefObject<HTMLButtonElement | null>
}

const Radio = ({
  name,
  value,
  checked,
  onChange,
  nextButtonRef,
}: RadioProps) => {
  return (
    <StyledWrapper>
      <div className="radio-input-wrapper">
        <label className="label">
          <input
            value={value}
            name={name}
            className="radio-input"
            type="radio"
            checked={checked}
            onChange={(e) => {
              e.target.blur()
              onChange()
            }}
          />
          <div className="radio-design" />
          <div className="label-text">VOTE!</div>
        </label>
      </div>
    </StyledWrapper>
  )
}

const StyledWrapper = styled.div`
  /* MAIN */
  /* =============================================== */
  .label {
    display: flex;
    align-items: center;
    border-radius: 100px;
    padding: 14px 16px;
    margin: 5px 0;
    cursor: pointer;
    transition: 0.3s;
    position: relative;
  }

  .label:hover,
  .label:focus-within,
  .label:active {
    background: hsla(0, 0%, 80%, 0.14);
  }

  .radio-input {
    position: absolute;
    left: 0;
    top: 0;
    width: 1px;
    height: 1px;
    opacity: 0;
    z-index: -1;
  }

  .radio-design {
    width: 22px;
    height: 22px;
    border-radius: 100px;
    background: linear-gradient(
      to right bottom,
      hsl(154, 97%, 62%),
      hsl(225, 97%, 62%)
    );
    position: relative;
  }

  .radio-design::before {
    content: "";
    display: inline-block;
    width: inherit;
    height: inherit;
    border-radius: inherit;
    background: hsl(0, 0%, 90%);
    transform: scale(1.1);
    transition: 0.3s;
  }

  .radio-input:checked + .radio-design::before {
    transform: scale(0);
  }

  .label-text {
    color: hsl(0, 0%, 60%);
    margin-left: 14px;
    letter-spacing: 3px;
    text-transform: uppercase;
    font-size: 18px;
    font-weight: 900;
    transition: 0.3s;
  }

  .radio-input:checked ~ .label-text {
    color: hsl(0, 0%, 40%);
  }
`

const visibleDataSchema = z.array(
  z.object({
    position: z.object({
      id: z.number(),
      priorityNumber: z.number(),
      name: z.string(),
      wcs: z.string(),
    }),
    candidates: z.array(
      z.object({
        admid: z.number(),
        name: z.string(),
        grade: z.number(),
        house: z.enum(["WINTER", "SUMMER", "SPRING"]),
        startingVotes: z.number(),
        photo: z.string(),
        positionId: z.number()
      })
    ),
  })
)

const currentPosAndCadSchema = z.object({
  position: z.object({
    id: z.number(),
    priorityNumber: z.number(),
    name: z.string(),
    wcs: z.string(),
  }),
  candidates: z.array(
    z.object({
      admid: z.number(),
      name: z.string(),
      grade: z.number(),
      house: z.enum(["WINTER", "SUMMER", "SPRING"]),
      startingVotes: z.number(),
      photo: z.string(),
      positionId: z.number()
    })
  ),
})

export function Voting({
  voter,
  candidatesData,
  apiURL,
  onSubmit,
}: {
  voter: z.infer<typeof VoterSchema> | null
  candidatesData: z.infer<typeof candidateResponseSchema> | undefined
  apiURL: string
  onSubmit: (
    submissionData: {
      positionId: number
      candidateAdmId: number
    }[]
  ) => void
}) {
  const [currentPage, setCurrentPage] = useState(0)
  const nextButtonRef = useRef<HTMLButtonElement>(null)
  const [posAndCadVisible, setPosAndCadVisible] = useState<
    z.infer<typeof visibleDataSchema>
  >([])
  const [currentPosAndCad, setCurrentPosAndCad] =
    useState<z.infer<typeof currentPosAndCadSchema>>()
  const [votes, setVotes] = useState<Map<number, number>>(
    new Map<number, number>()
  )
  useEffect(() => {
    if (!voter || !candidatesData) return

    const gradeKey = `Grade ${voter.grade}` as keyof typeof wcsData
    const gradeHouseKey =
      `Grade ${voter.grade} ${voter.house}` as keyof typeof wcsData

    const voterWCS = [
      1,
      wcsData[gradeKey],
      wcsData[voter.house],
      wcsData[gradeHouseKey],
    ]

    const visible = candidatesData.result.filter((p) => {
      const posWCS = p.position.wcs.split(";").map((e) => parseInt(e, 10))

      return posWCS.some((e) => voterWCS.includes(e))
    })

    setPosAndCadVisible(visible)
    setCurrentPosAndCad(visible[0])
    setCurrentPage(0)
  }, [voter, candidatesData])

  useEffect(() => console.log(posAndCadVisible), [posAndCadVisible])

  useEffect(() => {
    if (candidateSelectRef.current) {
      candidateSelectRef.current.hidden = true
    }
  }, [votes])

  const candidateSelectRef = useRef<HTMLParagraphElement>(null)
  const [highlightNext, setHighlightNext] = useState(false)
  const onCandidateSelected = (positionId: number, candidateId: number) => {
    setVotes((prev) => {
      const next = new Map(prev)
      next.set(positionId, candidateId)
      return next
    })

    setTimeout(() => {
      nextButtonRef.current?.scrollIntoView({
        behavior: "smooth",
        block: "center",
      })

      setHighlightNext(true)

      setTimeout(() => {
        setHighlightNext(false)
      }, 1000)
    }, 100)
  }

  return (
    <>
    
      <div className="w-full">
        <Card>
          <CardContent>
            <p className="text-muted-foreground">Your Name: {voter?.name}</p>
            <div className="flex flex-col items-center">
              <p>Voting Progress</p>
              <div className="flex flex-row gap-1">
                {posAndCadVisible.map((p) => {
                  return (
                    <input
                      key={p.position.id}
                      type="checkbox"
                      className="pointer-events-none"
                      ref={(z) => {
                        if (z) {
                          if (p.position.id === currentPosAndCad?.position.id) {
                            z.indeterminate = true
                            z.checked = false
                          } else if (votes.has(p.position.id)) {
                            z.indeterminate = false
                            z.checked = true
                          }
                        }
                      }}
                    />
                  )
                })}
              </div>
            </div>
            <p className="my-2 text-xl">
              Voting For: {currentPosAndCad?.position.name}
            </p>
            <p
              className="text-balance text-destructive"
              hidden
              ref={candidateSelectRef}
            >
              Please select a candidate.
            </p>
            <hr />
            <div className="grid grid-flow-row">
              {currentPosAndCad?.candidates.map((cad) => {
                return (
                  <div key={cad.admid}>
                    <div className="grid grid-cols-[500px_auto_auto]" key={cad.admid}>
                      <div
                        className="m-5 ml-50 grid h-min grid-cols-[0.2fr_0.2fr_auto] self-center "
                        key={`${cad.admid}-details`}
                      >
                        <p>Name</p>
                        <p>:</p>
                        <p>{cad.name}</p>
                        <p>Grade</p>
                        <p>:</p>
                        <p>{cad.grade}</p>
                      </div>
                      <img
                        src={`${apiURL}/static/candidates/${cad.photo}`}
                        width={130}
                        onClick={() =>
                          onCandidateSelected(
                            currentPosAndCad.position.id,
                            cad.admid
                          )
                        }
                        className="m-5 cursor-pointer justify-self-center"
                      />
                      <div
                        className="self-center justify-self-center"
                        key={`${cad.admid}-radio-div`}
                      >
                        <Radio
                          name={`${currentPosAndCad.position.id}`}
                          value={`${cad.admid}`}
                          checked={
                            votes.get(currentPosAndCad.position.id) ===
                            cad.admid
                          }
                          onChange={() =>
                            onCandidateSelected(
                              currentPosAndCad.position.id,
                              cad.admid
                            )
                          }
                          nextButtonRef={nextButtonRef}
                        />
                      </div>
                    </div>
                    <hr key={`${cad.admid}-hr`} />
                  </div>
                )
              })}

              <div className="m-7 grid grid-flow-col">
                <Button
                  className="w-min"
                  variant={"outline"}
                  disabled={currentPage == 0}
                  onClick={() => {
                    setCurrentPosAndCad(posAndCadVisible[currentPage - 1])
                    setCurrentPage(currentPage - 1)
                    window.scrollTo({
                      top: 0,
                      behavior: "smooth",
                    })
                  }}
                >
                  {"<-"} Prev
                </Button>
                <Button
                  className={cn(
                    "w-min justify-self-end",
                    highlightNext && "next-glow-once"
                  )}
                  ref={nextButtonRef}
                  onClick={() => {
                    if (currentPosAndCad) {
                      if (candidateSelectRef.current) {
                        if (!votes.has(currentPosAndCad.position.id)) {
                          candidateSelectRef.current.hidden = false
                          window.scrollTo({
                            top: 0,
                            behavior: "smooth",
                          })
                          return
                        }
                      }
                    }

                    if (currentPage + 1 === posAndCadVisible.length) {
                      if (votes.size === posAndCadVisible.length) {
                        const submitData = votes
                          .entries()
                          .map((w) => {
                            return {
                              positionId: w[0],
                              candidateAdmId: w[1],
                            }
                          })
                          .toArray()
                          onSubmit(submitData)
                      } else {
                        if (candidateSelectRef.current) {
                          candidateSelectRef.current.hidden = false
                          window.scrollTo({
                            top: 0,
                            behavior: "smooth",
                          })
                          return
                        }
                      }
                    } else {
                      setCurrentPosAndCad(posAndCadVisible[currentPage + 1])
                      setCurrentPage(currentPage + 1)
                    }
                    window.scrollTo({
                      top: 0,
                      behavior: "smooth",
                    })
                  }}
                >
                  {currentPage + 1 === posAndCadVisible.length
                    ? "Submit"
                    : "Next ->"}
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </>
  )
}
