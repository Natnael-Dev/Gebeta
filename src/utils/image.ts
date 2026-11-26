/**
 * Resizes and compresses an uploaded/captured image file into a WebP (or JPEG fallback)
 * base64 data URL bounded by `maxDim` pixels and `maxChars` characters.
 */
export async function compressImageDataUrl(
  file: File,
  maxDim = 480,
  quality = 0.82,
  maxChars = 240_000,
): Promise<string> {
  const objectUrl = URL.createObjectURL(file)
  try {
    const img = await new Promise<HTMLImageElement>((resolve, reject) => {
      const image = new Image()
      image.onload = () => resolve(image)
      image.onerror = () => reject(new Error('Failed to decode image'))
      image.src = objectUrl
    })

    const rawW = img.naturalWidth || img.width
    const rawH = img.naturalHeight || img.height
    const longest = Math.max(rawW, rawH, 1)
    const scale = longest > maxDim ? maxDim / longest : 1
    const width = Math.max(1, Math.round(rawW * scale))
    const height = Math.max(1, Math.round(rawH * scale))

    const canvas = document.createElement('canvas')
    canvas.width = width
    canvas.height = height
    const ctx = canvas.getContext('2d')
    if (!ctx) throw new Error('Canvas 2D context unavailable')
    ctx.drawImage(img, 0, 0, width, height)

    const encode = (q: number): string => {
      const webp = canvas.toDataURL('image/webp', q)
      if (webp.startsWith('data:image/webp')) return webp
      ctx.save()
      ctx.globalCompositeOperation = 'destination-over'
      ctx.fillStyle = '#ffffff'
      ctx.fillRect(0, 0, width, height)
      ctx.restore()
      return canvas.toDataURL('image/jpeg', q)
    }

    let dataUrl = encode(quality)
    if (dataUrl.length > maxChars) {
      dataUrl = encode(Math.max(0.45, quality - 0.25))
    }
    if (dataUrl.length > maxChars) {
      throw new Error('Compressed image exceeds max length')
    }
    return dataUrl
  } finally {
    URL.revokeObjectURL(objectUrl)
  }
}
