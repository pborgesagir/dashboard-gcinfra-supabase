// SVG to PNG conversion utility for proper chart capture
export class SVGToPNGConverter {

  static async convertSVGToCanvas(svgElement: SVGElement): Promise<HTMLCanvasElement> {
    return new Promise((resolve, reject) => {
      try {
        // Clone the SVG to avoid modifying the original
        const clonedSVG = svgElement.cloneNode(true) as SVGElement;

        // Ensure SVG has proper dimensions
        const rect = svgElement.getBoundingClientRect();
        clonedSVG.setAttribute('width', rect.width.toString());
        clonedSVG.setAttribute('height', rect.height.toString());

        // Add proper namespace if missing
        if (!clonedSVG.getAttribute('xmlns')) {
          clonedSVG.setAttribute('xmlns', 'http://www.w3.org/2000/svg');
        }

        // Inline all styles
        this.inlineStyles(clonedSVG);

        // Convert to data URL
        const svgData = new XMLSerializer().serializeToString(clonedSVG);
        const svgBlob = new Blob([svgData], { type: 'image/svg+xml;charset=utf-8' });
        const svgUrl = URL.createObjectURL(svgBlob);

        // Create image and canvas
        const img = new Image();
        const canvas = document.createElement('canvas');
        const ctx = canvas.getContext('2d');

        if (!ctx) {
          reject(new Error('Could not get canvas context'));
          return;
        }

        img.onload = () => {
          try {
            canvas.width = rect.width * 2; // Higher resolution
            canvas.height = rect.height * 2;

            // Set white background
            ctx.fillStyle = '#ffffff';
            ctx.fillRect(0, 0, canvas.width, canvas.height);

            // Draw the SVG
            ctx.scale(2, 2); // Scale for higher quality
            ctx.drawImage(img, 0, 0);

            URL.revokeObjectURL(svgUrl);
            resolve(canvas);
          } catch (error) {
            URL.revokeObjectURL(svgUrl);
            reject(error);
          }
        };

        img.onerror = () => {
          URL.revokeObjectURL(svgUrl);
          reject(new Error('Failed to load SVG image'));
        };

        img.src = svgUrl;

      } catch (error) {
        reject(error);
      }
    });
  }

  private static inlineStyles(element: Element): void {
    const computedStyle = window.getComputedStyle(element);
    const inlineStyle = element.getAttribute('style') || '';

    // Important CSS properties for SVG rendering
    const importantProps = [
      'fill', 'stroke', 'stroke-width', 'stroke-dasharray', 'stroke-linecap',
      'font-family', 'font-size', 'font-weight', 'text-anchor', 'dominant-baseline',
      'opacity', 'visibility', 'display', 'color'
    ];

    let newStyle = inlineStyle;

    importantProps.forEach(prop => {
      const value = computedStyle.getPropertyValue(prop);
      if (value && value !== 'initial' && value !== 'normal') {
        if (!newStyle.includes(prop)) {
          newStyle += `${prop}: ${value}; `;
        }
      }
    });

    if (newStyle !== inlineStyle) {
      element.setAttribute('style', newStyle);
    }

    // Recursively process children
    Array.from(element.children).forEach(child => {
      this.inlineStyles(child);
    });
  }

  static async convertElementWithSVGs(element: HTMLElement): Promise<HTMLCanvasElement> {
    const svgElements = element.querySelectorAll('svg');

    if (svgElements.length === 0) {
      // No SVGs, use regular html2canvas
      const html2canvas = (await import('html2canvas')).default;
      return html2canvas(element, {
        scale: 2,
        useCORS: true,
        allowTaint: true,
        backgroundColor: '#ffffff'
      });
    }

    // Convert each SVG to canvas first
    const svgCanvases = await Promise.all(
      Array.from(svgElements).map(svg => this.convertSVGToCanvas(svg))
    );

    // Replace SVGs with canvases temporarily
    const replacements: { svg: SVGElement; placeholder: HTMLElement; canvas: HTMLCanvasElement }[] = [];

    svgElements.forEach((svg, index) => {
      const canvas = svgCanvases[index];
      const placeholder = document.createElement('div');
      placeholder.style.width = svg.style.width || `${svg.getBoundingClientRect().width}px`;
      placeholder.style.height = svg.style.height || `${svg.getBoundingClientRect().height}px`;
      placeholder.style.background = '#ffffff';
      placeholder.style.display = 'inline-block';

      // Insert canvas into placeholder
      canvas.style.width = '100%';
      canvas.style.height = '100%';
      placeholder.appendChild(canvas);

      // Replace SVG with placeholder
      svg.parentNode?.insertBefore(placeholder, svg);
      svg.style.display = 'none';

      replacements.push({ svg, placeholder, canvas });
    });

    try {
      // Capture with html2canvas
      const html2canvas = (await import('html2canvas')).default;
      const result = await html2canvas(element, {
        scale: 2,
        useCORS: true,
        allowTaint: true,
        backgroundColor: '#ffffff',
        logging: false
      });

      return result;
    } finally {
      // Restore original SVGs
      replacements.forEach(({ svg, placeholder }) => {
        svg.style.display = '';
        placeholder.parentNode?.insertBefore(svg, placeholder);
        placeholder.remove();
      });
    }
  }
}