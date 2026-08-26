// Shared by every "fetch a binary response, save it as a file" flow (log
// export zips, ticket attachment downloads, ...) instead of each feature
// re-implementing the same object-URL/synthetic-anchor dance.
export function triggerBlobDownload(blob: Blob, filename: string): void {
  const objectUrl = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = objectUrl;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  link.remove();
  URL.revokeObjectURL(objectUrl);
}
