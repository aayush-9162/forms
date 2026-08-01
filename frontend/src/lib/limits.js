// Single source of truth for upload size limits on the client. Reads
// VITE_MAX_FILE_MB so it can be kept in sync with the server's MAX_FILE_MB
// without editing every form. Defaults to 10 MB if unset.
export const MAX_FILE_MB =
  Number(import.meta.env.VITE_MAX_FILE_MB) > 0
    ? Number(import.meta.env.VITE_MAX_FILE_MB)
    : 10

export const MAX_FILE_SIZE = MAX_FILE_MB * 1024 * 1024
