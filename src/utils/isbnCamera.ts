import { Html5Qrcode, Html5QrcodeSupportedFormats } from 'html5-qrcode'
import { normalizeIsbn } from '@/utils/isbn'

const ISBN_FORMATS = [Html5QrcodeSupportedFormats.EAN_13, Html5QrcodeSupportedFormats.EAN_8]

const SCAN_CONFIG = {
  fps: 10,
  qrbox: (viewfinderWidth: number, viewfinderHeight: number) => {
    const width = Math.floor(Math.min(viewfinderWidth * 0.92, viewfinderHeight * 0.82))
    const height = Math.max(72, Math.floor(width * 0.3))
    return { width, height }
  },
  aspectRatio: 1.777778,
  disableFlip: true,
  videoConstraints: {
    facingMode: { ideal: 'environment' },
    width: { ideal: 1920 },
    height: { ideal: 1080 },
  } satisfies MediaTrackConstraints,
}

export function createHtml5IsbnScanner(elementId: string) {
  return new Html5Qrcode(elementId, {
    formatsToSupport: ISBN_FORMATS,
    useBarCodeDetectorIfSupported: true,
    verbose: false,
  })
}

async function pickRearCamera(): Promise<string | MediaTrackConstraints> {
  try {
    const cameras = await Html5Qrcode.getCameras()
    if (!cameras.length) return { facingMode: 'environment' }

    const rear = cameras.find((camera) =>
      /back|rear|environment|traseir|trás|wide/i.test(camera.label),
    )
    return rear?.id ?? cameras[cameras.length - 1]!.id
  } catch {
    return { facingMode: 'environment' }
  }
}

async function applyContinuousFocus(scanner: Html5Qrcode) {
  try {
    await scanner.applyVideoConstraints({
      advanced: [{ focusMode: 'continuous' } as MediaTrackConstraintSet],
    })
  } catch {
    /* alguns navegadores ignoram focusMode */
  }
}

export async function startHtml5IsbnScan(
  scanner: Html5Qrcode,
  onIsbn: (raw: string) => void,
) {
  const camera = await pickRearCamera()
  let handled = false

  const cameraCandidates: Array<string | MediaTrackConstraints> = [
    camera,
    { facingMode: 'environment' },
    { facingMode: { ideal: 'environment' } },
  ]

  let lastError: unknown

  for (const candidate of cameraCandidates) {
    try {
      await scanner.start(
        candidate,
        SCAN_CONFIG,
        (decodedText) => {
          if (handled) return
          if (!normalizeIsbn(decodedText)) return
          handled = true
          onIsbn(decodedText)
        },
        () => {
          /* ignora frames sem código */
        },
      )
      await applyContinuousFocus(scanner)
      return
    } catch (err) {
      lastError = err
      try {
        if (scanner.isScanning) await scanner.stop()
      } catch {
        /* ignora falha ao limpar tentativa */
      }
    }
  }

  throw lastError ?? new Error('Nenhuma câmera disponível neste dispositivo.')
}

export async function stopHtml5IsbnScan(scanner: Html5Qrcode | null) {
  if (!scanner) return

  try {
    if (scanner.isScanning) await scanner.stop()
  } catch {
    /* ignora */
  }

  try {
    scanner.clear()
  } catch {
    /* ignora */
  }
}

export async function scanIsbnFromImageFile(
  scanner: Html5Qrcode,
  file: File,
): Promise<string | null> {
  const result = await scanner.scanFileV2(file, false)
  return normalizeIsbn(result.decodedText)
}

export function html5TorchSupported(scanner: Html5Qrcode): boolean {
  try {
    return scanner.getRunningTrackCameraCapabilities().torchFeature().isSupported()
  } catch {
    return false
  }
}

export async function toggleHtml5Torch(scanner: Html5Qrcode, enabled: boolean): Promise<boolean> {
  try {
    const torch = scanner.getRunningTrackCameraCapabilities().torchFeature()
    if (!torch.isSupported()) return false
    await torch.apply(enabled)
    return true
  } catch {
    return false
  }
}

export async function refocusHtml5Scanner(scanner: Html5Qrcode) {
  try {
    await scanner.applyVideoConstraints({
      advanced: [{ focusMode: 'single-shot' } as MediaTrackConstraintSet],
    })
    await applyContinuousFocus(scanner)
  } catch {
    /* ignora */
  }
}
