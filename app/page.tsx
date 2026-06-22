"use client"

import { useEffect, useState } from "react"
import { LoginForm } from "./login-form"
import axios from "axios"
import z from "zod"
import { LoginConfirm } from "./login-confirm"
import { useQuery } from "@tanstack/react-query"
import { Spinner } from "@/components/ui/spinner"
import { Voting } from "./voting"
import axiosRetry from "axios-retry";
import confetti from "canvas-confetti"

axiosRetry(axios, {
  retries: 3,
  retryDelay: axiosRetry.exponentialDelay,
  retryCondition: (error) => {
    if (!error.response) return true; // network error

    return error.response.status >= 500;
  },
});

enum Progress {
  LoginForm,
  LoginConfirmation,
  Voting,
}

const voteSubmissionSchema = z.object({
  admid: z.number(),
  votedInfo: z.object({
    createdAt: z.string().default(() => new Date().toISOString()),
    editedAt: z.string().default(() => new Date().toISOString()),
    absent: z.stringbool().default(false).or(z.boolean().default(false)),
    votingData: z.object({
      votedAt: z.string(),
      votedComputer: z.string(),
      toWho: z.array(
        z.object({ positionId: z.number(), candidateAdmId: z.number() })
      ),
    }),
  }),
})
export const VoterSchema = z.object({
  admid: z.coerce.number(),
  name: z.coerce.string(),
  grade: z.coerce.number(),
  house: z.enum(["WINTER", "SUMMER", "SPRING"]),
  class: z.coerce.string(),
  voted: z.stringbool().default(false).or(z.boolean().default(false)),
  votedInfo: z
    .object({
      createdAt: z.string().default(() => new Date().toISOString()),
      editedAt: z.string().default(() => new Date().toISOString()),
      absent: z.stringbool().default(false).or(z.boolean().default(false)),
      votingData: z
        .object({
          votedAt: z.string(),
          votedComputer: z.string(),
          toWho: z.array(
            z.object({ positionId: z.number(), candidateAdmId: z.number() })
          ),
        })
        .or(z.object({}))
        .default({}),
    })
    .default(() => ({
      createdAt: new Date().toISOString(),
      editedAt: new Date().toISOString(),
      absent: false,
      votingData: {},
    })),
})

const voterResponseSchema = z.object({
  status: z.number(),
  voter: VoterSchema.nullable(),
})

export const candidateResponseSchema = z.object({
  status: z.number(),
  result: z.array(
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
  ),
})

export default function LoginPage() {
  const apiUrl =
    typeof window !== "undefined" ? localStorage.getItem("API_URL") : null

  const computerName =
    typeof window !== "undefined" ? (localStorage.getItem("computerName") || "unknownComputer") : ""

  const [loginLoading, setLoginLoading] = useState(false)
  const [progress, setProgress] = useState(Progress.LoginForm)

  const [voterInfo, setVoterInfo] = useState<z.infer<
    typeof VoterSchema
  > | null>(null)

  const [successString, setSuccessString] = useState("")
  const [errorString, setErrorString] = useState("")

  const voteSubmissionConfetti = () => {
    const end = Date.now() + 3 * 1000 // 3 seconds
    const colors = ["#a786ff", "#fd8bbc", "#eca184", "#f8deb1"]

    const frame = () => {
      if (Date.now() > end) return

      confetti({
        particleCount: 2,
        angle: 60,
        spread: 55,
        startVelocity: 60,
        origin: { x: 0, y: 0.5 },
        colors: colors,
      })
      confetti({
        particleCount: 2,
        angle: 120,
        spread: 55,
        startVelocity: 60,
        origin: { x: 1, y: 0.5 },
        colors: colors,
      })

      requestAnimationFrame(frame)
    }

    frame()
  }

  const heartbeat = useQuery({
    queryKey: ["heartbeat"],
    queryFn: async () => {
      const res = await fetch(`${apiUrl}/voting/heartbeat`)

      if (!res.ok) {
        throw new Error("Heartbeat failed")
      }

      return res.json()
    },
    refetchInterval: 10000,
    retry: 3,
  })

  const candidatesData = useQuery({
    queryKey: ["candidatesData"],
    queryFn: async () => {
      const res = await fetch(`${apiUrl}/voting/getCandidates`)

      if (!res.ok) {
        throw new Error("Fetching candidate data failed")
      }

      return candidateResponseSchema.parse(await res.json())
    },
    refetchInterval: 2 * 60 * 1000,
    retry: 3,
  })

  const [isDisconnected, setIsDisconnected] = useState(false)

  useEffect(() => {
    if (heartbeat.isError) {
      setIsDisconnected(true)
    }
  }, [heartbeat.isError])

  useEffect(() => {
    if (heartbeat.isSuccess) {
      setIsDisconnected(false)
    }
  }, [heartbeat.isSuccess])

  useEffect(() => {
    console.log(candidatesData.data)
  }, [candidatesData.data])

  const render = () => {
    switch (progress) {
      case Progress.LoginForm:
        return (
          <div className="w-full max-w-sm md:max-w-4xl">
            <LoginForm
              isLoading={loginLoading}
              successString={successString}
              errorString={errorString}
              onLoginSubmit={async (admid, house, setLoginError) => {
                // console.log(admid, house)
                setLoginLoading(true)
                try {
                  const res = await axios.get(
                    `${apiUrl}/voting/getVoter/${admid}/${house}`
                  )
                  const voter = voterResponseSchema.parse(res.data).voter
                  if (voter) {
                    if (!voter.voted) {
                      if (!voter.votedInfo.absent) {
                        setLoginLoading(false)
                        setVoterInfo(voter)
                        setProgress(Progress.LoginConfirmation)
                      } else {
                        setLoginLoading(false)
                        setLoginError(
                          "Error: That student is absent. Please check your details."
                        )
                        setTimeout(() => {
                          setLoginError(null)
                        }, 10000)
                      }
                    } else {
                      setLoginLoading(false)
                      setLoginError(
                        "Error: That student has already voted. Please check your details."
                      )
                      setTimeout(() => {
                        setLoginError(null)
                      }, 10000)
                    }
                  } else {
                    setLoginLoading(false)
                    setLoginError("Error: Please enter your details correctly.")
                    setTimeout(() => {
                      setLoginError(null)
                    }, 10000)
                  }
                } catch (error) {
                  console.log("LoginError", error)
                  setLoginLoading(false)
                  setLoginError(
                    "Error: Unknown error, please contact a teacher."
                  )
                  setTimeout(() => {
                    setLoginError(null)
                  }, 20000)
                }
              }}
            />
          </div>
        )
      case Progress.LoginConfirmation:
        return (
          <div className="w-full max-w-sm md:max-w-4xl">
            <LoginConfirm
              onYes={() => {
                setProgress(Progress.Voting)
              }}
              onNo={() => {
                setVoterInfo(null)
                setProgress(Progress.LoginForm)
              }}
              voter={voterInfo}
            />
          </div>
        )
      case Progress.Voting:
        return (
          <Voting
            voter={voterInfo}
            candidatesData={candidatesData.data}
            apiURL={apiUrl || ""}
            onSubmit={async (s) => {
              console.log(s)
              setLoginLoading(true)
              setProgress(Progress.LoginForm)
              setSuccessString("")
              setErrorString("")
              if (voterInfo) {
                try {
                  const data: z.infer<typeof voteSubmissionSchema> = {
                    admid: voterInfo.admid,
                    votedInfo: {
                      createdAt: voterInfo.votedInfo.createdAt,
                      editedAt: voterInfo.votedInfo.editedAt,
                      absent: voterInfo.votedInfo.absent,
                      votingData: {
                        votedAt: new Date().toISOString(),
                        votedComputer: computerName,
                        toWho: s,
                      },
                    },
                  }
                  const res = await axios.post(
                    `${apiUrl}/voting/submitVote`,
                    data
                  )
                  if (res.data.status === 200) {
                    setLoginLoading(false);
                    setVoterInfo(null);
                    setSuccessString("SUCCESS: Your vote has been submitted!");
                    voteSubmissionConfetti()
                  }else{
                    setLoginLoading(false);
                    setVoterInfo(null);
                    setErrorString("ERROR: YOUR VOTE WAS NOT SUBMITTED! CONTACT TEACHERS!")
                    console.log(res)
                  }
                  
                } catch (error) {
                  setLoginLoading(false);
                  setVoterInfo(null);
                  setErrorString("ERROR: YOUR VOTE WAS NOT SUBMITTED! CONTACT TEACHERS!")
                  console.log(error)
                }
              }
            }}
          />
        )
      default:
        break
    }
  }

  return (
    <div className="flex min-h-svh flex-col items-center justify-center bg-muted p-6 md:p-10">
      {render()}
      {!(heartbeat.data ? heartbeat.data.v : true) && (
        <div className="fixed inset-0 flex items-center justify-center bg-background/75">
          <Spinner className="m-3 size-6" />
          <span>Voting has been paused...</span>
        </div>
      )}
      {isDisconnected && (
        <div className="fixed inset-0 flex items-center justify-center bg-background/75">
          <Spinner className="m-3 size-6" />
          <span>Reconnecting to election server...</span>
        </div>
      )}
    </div>
  )
}
