import html2canvas from 'html2canvas'

export async function captureHtmlSnapshot(htmlContent, approximatePosition = 0) {
  return new Promise((resolve) => {
    const container = document.createElement('div')
    container.style.cssText = `
      position: fixed;
      left: -9999px;
      top: 0;
      width: 1280px;
      height: 900px;
      overflow: hidden;
      z-index: -1;
      background: white;
    `
    document.body.appendChild(container)

    const iframe = document.createElement('iframe')
    iframe.style.cssText = `
      width: 1280px;
      height: 900px;
      border: none;
      background: white;
    `
    container.appendChild(iframe)

    iframe.onload = async () => {
      try {
        await new Promise(r => setTimeout(r, 600))

        const iframeDoc = iframe.contentDocument
        const targetY = Math.max(0, (approximatePosition / 100) * 900 - 100)

        const cropDiv = document.createElement('div')
        cropDiv.style.cssText = `
          position: fixed;
          left: -9999px;
          top: 0;
          width: 640px;
          height: 220px;
          overflow: hidden;
          background: white;
          z-index: -1;
        `
        document.body.appendChild(cropDiv)

        const clone = iframeDoc.body.cloneNode(true)
        clone.style.cssText = `
          transform: translateY(-${targetY}px) scale(0.5);
          transform-origin: top left;
          width: 1280px;
          pointer-events: none;
        `
        cropDiv.appendChild(clone)

        await new Promise(r => setTimeout(r, 200))

        const canvas = await html2canvas(cropDiv, {
          width: 640,
          height: 220,
          scale: 1,
          useCORS: true,
          allowTaint: true,
          backgroundColor: '#ffffff',
          logging: false,
        })

        const dataUrl = canvas.toDataURL('image/jpeg', 0.85)
        document.body.removeChild(container)
        document.body.removeChild(cropDiv)
        resolve(dataUrl)
      } catch (err) {
        console.error('Snapshot failed:', err)
        document.body.removeChild(container)
        resolve(null)
      }
    }

    iframe.srcdoc = htmlContent
  })
}

export async function captureBeforeAfter(htmlBefore, htmlAfter, approximatePosition = 30) {
  const [thumbnailBefore, thumbnailAfter] = await Promise.all([
    captureHtmlSnapshot(htmlBefore, approximatePosition),
    captureHtmlSnapshot(htmlAfter, approximatePosition),
  ])
  return { thumbnailBefore, thumbnailAfter }
}
