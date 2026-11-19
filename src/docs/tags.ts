// Nama tag dipakai di `tags` setiap file *.docs.ts dan di `tagDefinitions`
// (src/docs/openapi.ts). Urutan di `tagDefinitions` = urutan di sidebar.
export const docTags = {
  auth: "Auth",
} as const;

export type DocTag = (typeof docTags)[keyof typeof docTags];
