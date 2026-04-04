import { NextResponse } from "next/server"
import { spawn } from "child_process"

export async function POST(req: Request) {
  try {
    const body = await req.json()

    return await new Promise<Response>((resolve) => {
      const py = spawn("python", ["ml/predict.py", JSON.stringify(body)])

      let result = ""
      let error = ""

      py.on("error", (spawnError) => {
        console.error("Python spawn error:", spawnError)
        resolve(NextResponse.json({ error: "ML process failed" }, { status: 500 }))
      })

      py.stdout.on("data", (data) => {
        result += data.toString()
      })

      py.stderr.on("data", (err) => {
        error += err.toString()
      })

      py.on("close", () => {
        if (error) {
          console.error("Python error:", error)
          resolve(NextResponse.json({ error: "ML error" }, { status: 500 }))
          return
        }

        try {
          const parsed = JSON.parse(result)
          resolve(NextResponse.json(parsed))
        } catch {
          resolve(NextResponse.json({ error: "Invalid ML response" }, { status: 500 }))
        }
      })
    })

  } catch {
    return NextResponse.json({ error: "Request failed" }, { status: 500 })
  }
}