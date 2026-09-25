import { NextResponse } from "next/server";
import { exec } from "child_process";

export async function POST(): Promise<Response> {
  return new Promise<Response>((resolve) => {
    exec("bun run scripts/seed.ts", { cwd: process.cwd() }, (err, stdout, stderr) => {
      if (err) {
        resolve(NextResponse.json({ error: err.message, stderr }, { status: 500 }));
        return;
      }
      resolve(NextResponse.json({ ok: true, output: stdout }));
    });
  });
}
