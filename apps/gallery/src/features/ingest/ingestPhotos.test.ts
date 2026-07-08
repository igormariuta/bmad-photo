import { describe, expect, it } from "vitest";
import { isImageFile } from "./ingestPhotos";

function makeFile(name: string, type: string): File {
  return new File(["x"], name, { type });
}

describe("isImageFile", () => {
  it("accepts a file with an image/* MIME type", () => {
    expect(isImageFile(makeFile("photo.jpg", "image/jpeg"))).toBe(true);
  });

  it("accepts a recognized image extension even with no/unreliable MIME type", () => {
    expect(isImageFile(makeFile("photo.HEIC", ""))).toBe(true);
    expect(isImageFile(makeFile("photo.png", ""))).toBe(true);
  });

  it("rejects non-image junk a folder pick can include", () => {
    expect(isImageFile(makeFile(".DS_Store", ""))).toBe(false);
    expect(isImageFile(makeFile("Thumbs.db", "application/octet-stream"))).toBe(false);
  });
});
