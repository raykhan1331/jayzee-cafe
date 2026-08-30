import { promises as fs } from "fs";
import path from "path";

const DATA_DIR = path.join(process.cwd(), "data");

async function ensureDir() {
  await fs.mkdir(DATA_DIR, { recursive: true });
}

export async function readRecords<T>(file: string): Promise<T[]> {
  await ensureDir();
  const filePath = path.join(DATA_DIR, file);
  try {
    const raw = await fs.readFile(filePath, "utf-8");
    return JSON.parse(raw) as T[];
  } catch {
    return [];
  }
}

export async function appendRecord<T extends { id: string }>(
  file: string,
  record: T
): Promise<T> {
  await ensureDir();
  const filePath = path.join(DATA_DIR, file);
  const records = await readRecords<T>(file);
  records.push(record);
  await fs.writeFile(filePath, JSON.stringify(records, null, 2), "utf-8");
  return record;
}

export function generateId(prefix: string): string {
  const rand = Math.random().toString(36).slice(2, 8).toUpperCase();
  return `${prefix}-${Date.now().toString(36).toUpperCase()}${rand}`;
}
