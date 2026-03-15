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

function parsePackerOutput(output: string): {
  maxItemsPacked: number;
  packedItems: Array<{
    itemIndex: number;
    bottomFrontLeft: number[];
    topBackRight: number[];
  }>;
} {
  const lines = output.trim().split("\n").filter((l) => l.trim() !== "");
  if (lines.length === 0) {
    return { maxItemsPacked: 0, packedItems: [] };
  }

  const maxItemsPacked = parseInt(lines[0], 10);
  const packedItems = [];

  for (let i = 1; i < lines.length; i++) {
    const nums = lines[i].trim().split(/\s+/).map(Number);
    if (nums.length < 7) continue;
    const [itemIndex, x1, y1, z1, x2, y2, z2] = nums;
    packedItems.push({
      itemIndex,
      bottomFrontLeft: [x1, y1, z1],
      topBackRight: [x2, y2, z2],
    });
  }

  return { maxItemsPacked, packedItems };
}

export default router;
