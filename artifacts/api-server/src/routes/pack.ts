import { Router, type IRouter } from "express";
import { spawn } from "child_process";
import path from "path";
import { fileURLToPath } from "url";
import { PackItemsBody, PackItemsResponse } from "@workspace/api-zod";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const PACKER_BIN = path.resolve(__dirname, "../../c-src/packer");

const router: IRouter = Router();

router.post("/pack", async (req, res) => {
  const parseResult = PackItemsBody.safeParse(req.body);
  if (!parseResult.success) {
    res.status(400).json({ error: "Invalid input: " + parseResult.error.message });
    return;
  }

  const { suitcase, items } = parseResult.data;

  let input = `${suitcase.width} ${suitcase.breadth} ${suitcase.height}\n`;
  input += `${items.length}\n`;
  for (const item of items) {
    input += `${item.width} ${item.breadth} ${item.height}\n`;
  }

  try {
    const result = await runPacker(input);
    const parsed = parsePackerOutput(result);
    const validated = PackItemsResponse.parse(parsed);
    res.json(validated);
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : String(err);
    res.status(500).json({ error: "Failed to run packer: " + message });
  }
});

function runPacker(input: string): Promise<string> {
  return new Promise((resolve, reject) => {
    const proc = spawn(PACKER_BIN, [], { timeout: 30000 });
    let stdout = "";
    let stderr = "";

    proc.stdout.on("data", (chunk: Buffer) => {
      stdout += chunk.toString();
    });
    proc.stderr.on("data", (chunk: Buffer) => {
      stderr += chunk.toString();
    });
    proc.on("close", (code) => {
      if (code === 0) {
        resolve(stdout);
      } else {
        reject(new Error(`Packer exited with code ${code}: ${stderr}`));
      }
    });
    proc.on("error", (err) => {
      reject(new Error(`Failed to spawn packer: ${err.message}`));
    });

    proc.stdin.write(input);
    proc.stdin.end();
  });
}

function parseCoords(line: string): number[] {
  // Parses "Bottom-front-left: (x, y, z)" or "Top-back-right: (x, y, z)"
  const match = line.match(/\((\d+),\s*(\d+),\s*(\d+)\)/);
  if (!match) return [0, 0, 0];
  return [parseInt(match[1], 10), parseInt(match[2], 10), parseInt(match[3], 10)];
}

function parsePackerOutput(output: string): {
  maxItemsPacked: number;
  packedItems: Array<{
    itemIndex: number;
    bottomFrontLeft: number[];
    topBackRight: number[];
  }>;
} {
  const lines = output.split("\n").map((l) => l.trim()).filter((l) => l !== "");
  if (lines.length === 0) {
    return { maxItemsPacked: 0, packedItems: [] };
  }

  // Find "Maximum items packed: N"
  let maxItemsPacked = 0;
  for (const line of lines) {
    const m = line.match(/Maximum items packed:\s*(\d+)/);
    if (m) { maxItemsPacked = parseInt(m[1], 10); break; }
  }

  const packedItems = [];
  for (let i = 0; i < lines.length; i++) {
    const itemMatch = lines[i].match(/^Item\s+(\d+)$/);
    if (itemMatch) {
      const itemIndex = parseInt(itemMatch[1], 10);
      const bfl = i + 1 < lines.length ? parseCoords(lines[i + 1]) : [0, 0, 0];
      const tbr = i + 2 < lines.length ? parseCoords(lines[i + 2]) : [0, 0, 0];
      packedItems.push({ itemIndex, bottomFrontLeft: bfl, topBackRight: tbr });
      i += 2;
    }
  }

  return { maxItemsPacked, packedItems };
}

export default router;
