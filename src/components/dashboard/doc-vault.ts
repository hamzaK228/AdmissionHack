"use client";

/**
 * Document vault — real file storage in the visitor's browser via IndexedDB.
 *
 * This is the student's own copy and it works with no account at all: download
 * and delete are fully local. It is not the whole story any more — when the
 * student is signed in, the folder workspace also mirrors each file into cloud
 * storage so a counselor can open it, and records that fact here as `cloudPath`.
 * A file WITHOUT a `cloudPath` is genuinely local-only, and the UI says so.
 */

const DB_NAME = "admissionhack-files";
const STORE = "files";

export interface StoredFile {
  id: string;
  name: string;
  type: string;
  size: number;
  addedAt: string;
  /** "vault" for general documents, "score-report" for official exam reports */
  kind?: "vault" | "score-report";
  /** for score reports: which exam it belongs to (ielts | toefl | sat) */
  examId?: string;
  /** for vault files: which workspace folder (see src/data/document-folders.ts) */
  folder?: string;
  /** set once this file has been mirrored into cloud storage, so a counselor can open it */
  cloudPath?: string;
  blob: Blob;
}

function openDB(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const req = indexedDB.open(DB_NAME, 1);
    req.onupgradeneeded = () => {
      if (!req.result.objectStoreNames.contains(STORE)) {
        req.result.createObjectStore(STORE, { keyPath: "id" });
      }
    };
    req.onsuccess = () => resolve(req.result);
    req.onerror = () => reject(req.error);
  });
}

export async function addFiles(
  files: FileList | File[],
  meta: { kind?: StoredFile["kind"]; examId?: string; folder?: string } = {},
): Promise<StoredFile[]> {
  const db = await openDB();
  const tx = db.transaction(STORE, "readwrite");
  const store = tx.objectStore(STORE);
  const created: StoredFile[] = [];
  for (const file of Array.from(files)) {
    const record: StoredFile = {
      id: crypto.randomUUID(),
      name: file.name,
      type: file.type || "application/octet-stream",
      size: file.size,
      addedAt: new Date().toISOString(),
      kind: meta.kind ?? "vault",
      ...(meta.examId ? { examId: meta.examId } : {}),
      ...(meta.folder ? { folder: meta.folder } : {}),
      blob: file,
    };
    store.put(record);
    created.push(record);
  }
  await new Promise<void>((resolve, reject) => {
    tx.oncomplete = () => resolve();
    tx.onerror = () => reject(tx.error);
  });
  db.close();
  return created;
}

/** Records that a local file has been mirrored to cloud storage. */
export async function markFileUploaded(id: string, cloudPath: string): Promise<void> {
  const db = await openDB();
  const tx = db.transaction(STORE, "readwrite");
  const store = tx.objectStore(STORE);
  const existing = await new Promise<StoredFile | undefined>((resolve) => {
    const req = store.get(id);
    req.onsuccess = () => resolve(req.result as StoredFile | undefined);
    req.onerror = () => resolve(undefined);
  });
  if (existing) store.put({ ...existing, cloudPath });
  await new Promise<void>((resolve, reject) => {
    tx.oncomplete = () => resolve();
    tx.onerror = () => reject(tx.error);
  });
  db.close();
}

export async function getAllFiles(): Promise<StoredFile[]> {
  const db = await openDB();
  const tx = db.transaction(STORE, "readonly");
  const req = tx.objectStore(STORE).getAll();
  const files = await new Promise<StoredFile[]>((resolve, reject) => {
    req.onsuccess = () => resolve(req.result as StoredFile[]);
    req.onerror = () => reject(req.error);
  });
  db.close();
  return files.sort((a, b) => b.addedAt.localeCompare(a.addedAt));
}

/** Removes the local record and hands it back, so the caller can drop the cloud copy too. */
export async function deleteFile(id: string): Promise<StoredFile | undefined> {
  const db = await openDB();
  const tx = db.transaction(STORE, "readwrite");
  const store = tx.objectStore(STORE);
  const existing = await new Promise<StoredFile | undefined>((resolve) => {
    const req = store.get(id);
    req.onsuccess = () => resolve(req.result as StoredFile | undefined);
    req.onerror = () => resolve(undefined);
  });
  store.delete(id);
  await new Promise<void>((resolve, reject) => {
    tx.oncomplete = () => resolve();
    tx.onerror = () => reject(tx.error);
  });
  db.close();
  return existing;
}

/** Files belonging to one exam (score reports). */
export async function filesForExam(examId: string): Promise<StoredFile[]> {
  const all = await getAllFiles();
  return all.filter((f) => f.kind === "score-report" && f.examId === examId);
}

/** Vault files filed in one workspace folder. */
export async function filesInFolder(folder: string): Promise<StoredFile[]> {
  const all = await getAllFiles();
  return all.filter((f) => f.kind !== "score-report" && f.folder === folder);
}

export function downloadStoredFile(f: StoredFile) {
  const url = URL.createObjectURL(f.blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = f.name;
  a.click();
  setTimeout(() => URL.revokeObjectURL(url), 2000);
}

export function formatSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(0)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

export function fileIcon(name: string): string {
  const ext = name.split(".").pop()?.toLowerCase() ?? "";
  if (["pdf"].includes(ext)) return "📕";
  if (["png", "jpg", "jpeg", "webp", "heic"].includes(ext)) return "🖼️";
  if (["doc", "docx"].includes(ext)) return "📄";
  if (["xls", "xlsx", "csv"].includes(ext)) return "📊";
  if (["zip", "rar", "7z"].includes(ext)) return "🗜️";
  return "📁";
}
