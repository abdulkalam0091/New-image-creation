const canvas = document.getElementById('canvas');
const ctx = canvas.getContext('2d');

// UI state
let selectedColor = '#FF0000';
let currentBgSource = 'Images/Artboard 1.jpg';

// Offer image popup / rotation state
let offerImageFile = null;
let offerImageDataURL = null; // holds original OR rotated image dataURL
let offerImageRotation = 0;    // 0, 90, 180, 270

// -------------------- popup preview & rotate --------------------
function previewOfferImage(event) {
    const file = event.target.files?.[0];
    if (!file) return;
    offerImageFile = file;
    offerImageRotation = 0;

    const reader = new FileReader();
    reader.onload = (e) => {
        offerImageDataURL = e.target.result;
        showOfferPopup();
    };
    reader.readAsDataURL(file);
}

function showOfferPopup() {
    const popup = document.getElementById('offerPopup');
    if (popup) popup.style.display = 'flex';
    drawOfferPreview();
}

/* Draw preview in the popup canvas using current offerImageDataURL and offerImageRotation.
   This function only draws a preview — it does NOT mutate offerImageDataURL except when Confirm is pressed.
*/
function drawOfferPreview(forceRedraw = false) {
    const previewCanvas = document.getElementById('offerPreviewCanvas');
    if (!previewCanvas || !offerImageDataURL) return;
    const pCtx = previewCanvas.getContext('2d');

    const img = new Image();
    img.onload = () => {
        const w = previewCanvas.width;
        const h = previewCanvas.height;
        pCtx.clearRect(0, 0, w, h);

        pCtx.save();
        pCtx.translate(w / 2, h / 2);
        pCtx.rotate((offerImageRotation * Math.PI) / 180);

        // scale to fit box
        const scale = Math.min(w / img.width, h / img.height);
        const drawW = img.width * scale;
        const drawH = img.height * scale;

        pCtx.drawImage(img, -drawW / 2, -drawH / 2, drawW, drawH);
        pCtx.restore();
    };

    img.onerror = () => {
        console.error('Failed to load preview image');
        if (forceRedraw) return;
        setTimeout(() => drawOfferPreview(true), 80);
    };

    img.src = offerImageDataURL;
}

function rotateOfferImage() {
    offerImageRotation = (offerImageRotation + 90) % 360;
    drawOfferPreview();
}

function confirmOfferImage() {
    // Save rotated preview back into offerImageDataURL (so main canvas uses rotated image)
    const previewCanvas = document.getElementById('offerPreviewCanvas');
    if (!previewCanvas) {
        // fallback: if something goes wrong, just close popup
        document.getElementById('offerPopup').style.display = 'none';
        return;
    }

    // If rotation is 0, no change; otherwise the preview canvas already displays rotated image,
    // but to be safe we snapshot the preview canvas to a new dataURL.
    offerImageDataURL = previewCanvas.toDataURL('image/png');

    // Keep the original file input as-is (do not clear). This ensures user can still re-open popup.
    document.getElementById('offerPopup').style.display = 'none';

    // Redraw main canvas preview so user immediately sees result when they click Generate (or we can auto-generate)
    // It's better to let user click Generate, but if you want auto-redraw uncomment:
    // generateImage();
}

function closeOfferPopup() {
    document.getElementById('offerPopup').style.display = 'none';
    // Cancel should NOT overwrite confirmed image; but it's reasonable to discard the preview if user cancels.
    // We'll discard only temporary preview state if user cancels before confirming.
    // Keep the file input value so user can re-open preview:
    // do NOT clear offerImageDataURL here — but to follow a clear UX, we'll reset (you can change).
    // I'll reset to null to reflect "user cancelled" behaviour:
    offerImageFile = null;
    offerImageDataURL = null;
    offerImageRotation = 0;
    document.getElementById('offerImage').value = ''; // user cancelled selection
}

// -------------------- background color buttons --------------------
const colorButtons = document.querySelectorAll('button[data-file]');
colorButtons.forEach(button => {
    button.addEventListener('click', (e) => {
        e.preventDefault();
        colorButtons.forEach(b => b.classList.remove('selected'));
        e.currentTarget.classList.add('selected');

        currentBgSource = e.currentTarget.getAttribute('data-file');
        selectedColor = e.currentTarget.getAttribute('data-color') || selectedColor;

        // immediate regenerate to show change
        generateImage();
    });
});

// -------------------- unified image loader --------------------
/* loadImage supports:
   - sourceId === 'templateBackground' -> path from currentBgSource
   - sourceId === 'companyLogo' -> takes file input companyLogo if present
   - sourceId === 'offerImage' -> uses offerImageDataURL (confirmed rotated image if confirmed) OR file input if no dataURL
*/
function loadImage(sourceId, callback) {
    // 1) offerImage priority: if we already have a dataURL (confirmed rotated), use it
    if (sourceId === 'offerImage' && offerImageDataURL) {
        const img = new Image();
        img.onload = () => callback(img, false);
        img.onerror = () => callback(null, false);
        img.src = offerImageDataURL;
        return;
    }

    // 2) otherwise check file input for offerImage
    if (sourceId === 'offerImage') {
        const fileInput = document.getElementById('offerImage');
        if (fileInput && fileInput.files.length > 0) {
            const file = fileInput.files[0];
            const reader = new FileReader();
            reader.onload = (e) => {
                const img = new Image();
                img.onload = () => callback(img, false);
                img.onerror = () => callback(null, false);
                img.src = e.target.result;
            };
            reader.readAsDataURL(file);
            return;
        }
        // fallback: no offer image found
        callback(null, false);
        return;
    }

    // 3) companyLogo: prefer uploaded file; if nothing, return null (you can change to fallback path)
    if (sourceId === 'companyLogo') {
        const fileInput = document.getElementById('companyLogo');
        if (fileInput && fileInput.files.length > 0) {
            const file = fileInput.files[0];
            const reader = new FileReader();
            reader.onload = (e) => {
                const img = new Image();
                img.onload = () => callback(img, false);
                img.onerror = () => callback(null, false);
                img.src = e.target.result;
            };
            reader.readAsDataURL(file);
            return;
        } else {
            // no logo uploaded
            callback(null, false);
            return;
        }
    }

    // 4) templateBackground: use currentBgSource path
    if (sourceId === 'templateBackground') {
        const img = new Image();
        img.onload = () => callback(img, false);
        img.onerror = () => {
            console.warn('Background load error for', currentBgSource);
            callback(null, false);
        };
        img.src = currentBgSource;
        return;
    }

    // fallback
    callback(null, false);
}

// -------------------- download helper --------------------
function updateDownloadLink() {
    const dataURL = canvas.toDataURL('image/png');
    const downloadLink = document.getElementById('downloadLink');

    const rawShop = document.getElementById('shopName')?.value || '';
    const shopName = rawShop.trim() || 'Shop';

    const rawOffer = document.getElementById('offerText')?.value || '';
    const firstLine = rawOffer.split(/\r?\n/)[0].trim();
    const offerText = firstLine || 'Offer';

    const cleanShop = shopName.replace(/[^\w\s-]/g, '').replace(/\s+/g, '_');
    const cleanOffer = offerText.replace(/[^\w\s-]/g, '').replace(/\s+/g, '_');

    const fileName = `${cleanShop}_${cleanOffer}.png`;

    downloadLink.href = dataURL;
    downloadLink.download = fileName;
    downloadLink.style.display = 'inline-block';
}

// -------------------- text wrapping utilities (kept same) --------------------
function wrapTextLeft(ctx, text, x, y, maxWidth, lineHeight, maxLines = Infinity) {
    const words = text.split(' ');
    let line = '';
    let finalY = y;
    let lines = [];

    for (let n = 0; n < words.length; n++) {
        const testLine = line + words[n] + ' ';
        const metrics = ctx.measureText(testLine);
        if (metrics.width > maxWidth && n > 0) {
            lines.push(line.trim());
            line = words[n] + ' ';
        } else {
            line = testLine;
        }
    }
    lines.push(line.trim());

    for (let i = 0; i < Math.min(lines.length, maxLines); i++) {
        ctx.fillText(lines[i], x, finalY);
        finalY += lineHeight;
    }

    return { finalY: finalY };
}

function wrapTextRight(ctx, text, x, y, maxWidth, lineHeight) {
    const words = text.split(' ');
    let line = '';
    let lines = [];

    for (let n = 0; n < words.length; n++) {
        const testLine = line + words[n] + ' ';
        const metrics = ctx.measureText(testLine);
        if (metrics.width > maxWidth && n > 0) {
            lines.push(line.trim());
            line = words[n] + ' ';
        } else {
            line = testLine;
        }
    }
    lines.push(line.trim());

    let finalY = y;
    for (let n = 0; n < lines.length; n++) {
        ctx.fillText(lines[n], x, finalY);
        finalY += lineHeight;
    }

    return { finalY: finalY };
}

// -------------------- main generateImage (kept mostly as you had it) --------------------
function generateImage() {
    // VALIDATIONS: allow offer image either via confirmed dataURL OR file input
    if (!document.getElementById('companyLogo').files.length) {
        alert("⚠️ Please upload the Company Logo!");
        return;
    }
    
    if (!document.getElementById('offerText').value.trim()) {
        alert("⚠️ Please enter the Offer Text!");
        return;
    }
    if (!document.getElementById('shopName').value.trim()) {
        alert("⚠️ Please enter the Shop Name!");
        return;
    }
    if (!document.getElementById('shopAddress').value.trim()) {
        alert("⚠️ Please enter the Shop Address!");
        return;
    }
    if (!document.getElementById('contact').value.trim()) {
        alert("⚠️ Please enter Contact Number 1!");
        return;
    }

    const W = 800, H = 800;
    canvas.width = W;
    canvas.height = H;

    const offerText = document.getElementById('offerText').value.toUpperCase();
    const shopName = document.getElementById('shopName').value;
    const shopAddress = document.getElementById('shopAddress').value;
    const contact = document.getElementById('contact').value;
    const contact2 = document.getElementById('contact2').value || '';

    // Draw background -> then logo -> then offer image -> text -> footer
    loadImage('templateBackground', (bgImg) => {
        if (!bgImg) return;
        ctx.clearRect(0, 0, W, H);
        ctx.drawImage(bgImg, 0, 0, W, H);

        loadImage('companyLogo', (logo) => {
            if (logo) {
                const topBarY = H * 0.07;
                const topBarH = H * 0.12;
                const logoMaxW = W * 0.55;
                const logoMaxH = topBarH * 0.90;

                const widthScale = logoMaxW / logo.width;
                const heightScale = logoMaxH / logo.height;
                const scale = Math.min(widthScale, heightScale, 1.0);

                const finalW = logo.width * scale;
                const finalH = logo.height * scale;

                const logoX = W * 0.5 - finalW / 2;
                const logoY = topBarY + (topBarH / 2) - (finalH / 2) + 3;
                ctx.drawImage(logo, logoX, logoY, finalW, finalH);
            }

            // Offer image (uses offerImageDataURL if confirmed OR file input)
            loadImage('offerImage', (offerImg) => {
                if (offerImg) {
                    const pedestalTopY = H * 0.68;
                    const offerAreaTopY = H * 0.28;
                    const desiredMaxWidth = W * 0.50;
                    const desiredMaxHeight = (pedestalTopY - offerAreaTopY) * 0.7;

                    const widthScale = desiredMaxWidth / offerImg.width;
                    const heightScale = desiredMaxHeight / offerImg.height;
                    const scale = Math.min(widthScale, heightScale);

                    const finalW = offerImg.width * scale;
                    const finalH = offerImg.height * scale;
                    const offerImgX = W * 0.5 - finalW / 2;
                    const availableSpace = pedestalTopY - offerAreaTopY;
                    const offerImgY = offerAreaTopY + (availableSpace / 2) - (finalH / 2);

                    ctx.drawImage(offerImg, offerImgX, offerImgY, finalW, finalH);
                }

                // Offer text autosize & draw (kept your logic)
                // --- OFFER TEXT LOGIC FIX ---

// --- OFFER TEXT LOGIC (NO EXTRA BOX) ---

// --- OFFER TEXT LOGIC (ONLY COUPON BACKGROUND SHOWS OFFER TEXT) ---

// --- OFFER TEXT LOGIC (BLACK FOR COUPON, COLOR FOR OTHERS) ---

// --- IMPROVED OFFER TEXT LOGIC (respects manual line breaks + perfect centering) ---

const src = currentBgSource.toLowerCase();
const isCouponMode = src.includes("coupon") || src.includes("c11");
const hasOfferImage = !!offerImg;

// Skip only if coupon has image
if (isCouponMode && hasOfferImage) return;

// Split text into manual lines first
let userLines = offerText
  .split(/\r?\n/)
  .map(line => line.trim())
  .filter(line => line.length > 0);

// Auto-size font based on total line count and box width/height
let fontSize = 34;
let lineHeight;
let lines = [];

// Helper for wrapping single line if it’s too long
function wrapSingleLine(ctxLocal, text, maxW) {
  const words = text.split(' ');
  let line = '', lines = [];
  for (let n = 0; n < words.length; n++) {
    const testLine = line + words[n] + ' ';
    if (ctxLocal.measureText(testLine).width > maxW && n > 0) {
      lines.push(line.trim());
      line = words[n] + ' ';
    } else {
      line = testLine;
    }
  }
  lines.push(line.trim());
  return lines;
}

// Calculate lines properly (manual + wrapped)
do {
  ctx.font = `bold ${fontSize}px "Noto Sans Malayalam", Arial`;
  lineHeight = fontSize * 1.25;
  lines = [];
  userLines.forEach(line => {
    const wrapped = wrapSingleLine(ctx, line, W * 0.7);
    lines.push(...wrapped);
  });
  if (lines.length * lineHeight > H * 0.13) fontSize -= 2;
  else break;
} while (fontSize > 12);

ctx.font = `bold ${fontSize}px "Noto Sans Malayalam", Arial`;
ctx.textAlign = 'center';
ctx.textBaseline = 'middle';

// Color logic
ctx.fillStyle = isCouponMode ? "#000000" : selectedColor;

// Determine vertical start position
const textBlockHeight = lines.length * lineHeight;
const textBoxY = isCouponMode ? H * 0.54 : H * 0.74;
const startY = textBoxY - textBlockHeight / 2 + lineHeight / 2;

// Draw lines perfectly centered
lines.forEach((ln, i) => {
  ctx.fillText(ln, W / 2, startY + i * lineHeight);
});


// else (coupon + offer image) → no text drawn

                
                // Footer (kept your footer drawing code)
                // --- FOOTER POSITION LOGIC ---
// For coupon templates, move footer up (start earlier)


if (isCouponMode) {
    footerBoxY = H * 0.82//     
    footerBoxH = H * 0.12; // Slightly taller for readability
} else {
    footerBoxY = H * 0.85; // Normal
    footerBoxH = H * 0.10;
}

                const lineHeightFooter = 16;
                const leftColumnX = W * 0.10;
                const leftColumnWidth = W * 0.35;
                const rightColumnX = W * 0.90;
                const rightColumnWidth = W * 0.25;

                const maxLinesInFooterBlock = 4;
                const totalBlockHeight = maxLinesInFooterBlock * lineHeightFooter;
                const footerTextCenterY = footerBoxY + (footerBoxH / 2);

                const textBlockStartY = footerTextCenterY - (totalBlockHeight / 2) + (lineHeightFooter * 0.5);

                let currentYLeft = textBlockStartY;
                ctx.font = 'bold 14px Arial';
                ctx.fillStyle = selectedColor;
                ctx.textAlign = 'left';
                ctx.fillText("FOR MORE DETAILS", leftColumnX, currentYLeft);
                currentYLeft += lineHeightFooter * 1.0;

                ctx.font = 'bold 14px Arial';
                ctx.fillStyle = '#000000';
                currentYLeft = wrapTextLeft(ctx, `VISIT ${shopName.toUpperCase()}`, leftColumnX, currentYLeft, leftColumnWidth, lineHeightFooter, 1).finalY;

                if (shopAddress) {
                    ctx.font = '15px Arial';
                    const addressLineHeight = 15;
                    wrapTextLeft(ctx, shopAddress.toUpperCase(), leftColumnX, currentYLeft - addressLineHeight * 0.1, leftColumnWidth, addressLineHeight, 3);
                }

                let currentYRight = textBlockStartY;
                ctx.font = 'bold 24px Arial';
                ctx.fillStyle = '#000000';
                ctx.textAlign = 'right';
                ctx.fillText("Contact", rightColumnX, currentYRight);
                currentYRight += lineHeightFooter * 1.1;
                ctx.font = 'bold 18px Arial';
                currentYRight = wrapTextRight(ctx, contact, rightColumnX, currentYRight, rightColumnWidth, lineHeightFooter).finalY;
                if (contact2) {
                    ctx.font = '18px Arial';
                    wrapTextRight(ctx, contact2, rightColumnX, currentYRight - lineHeightFooter * 0.0, rightColumnWidth, lineHeightFooter * 0.9);
                }

                // Footer center logo (re-use companyLogo)
                // (We already loaded companyLogo above; to keep flow simple call loadImage again)
                loadImage('companyLogo', (fLogo) => {
                    if (fLogo) {
                        const logoMaxW = W * 0.15;
                        const logoMaxH = footerBoxH * 0.9;
                        const centerColumnX = W * 0.47;
                        const centerColumnWidth = W * 0.24;
                        const footerCenterY = footerBoxY + (footerBoxH / 2);

                        const logoWidthScale = logoMaxW / fLogo.width;
                        const logoHeightScale = logoMaxH / fLogo.height;
                        const logoScale = Math.min(logoWidthScale, logoHeightScale);

                        const finalW = fLogo.width * logoScale;
                        const finalH = fLogo.height * logoScale;

                        const logoX = centerColumnX + (centerColumnWidth / 2) - (finalW / 2);
                        const logoY = footerCenterY - (finalH / 2) - 8;
                        ctx.drawImage(fLogo, logoX, logoY, finalW, finalH);
                    }

                    updateDownloadLink();
                });

            }); // end loadImage(offerImage)
        }); // end loadImage(companyLogo)
    }); // end loadImage(background)
}


function toggleOfferImageInput() {
  const checkbox = document.getElementById('noOfferImageCheckbox');
  const offerSection = document.getElementById('offerImageSection');
  const offerInput = document.getElementById('offerImage');

  if (checkbox.checked) {
    // Hide both label + input
    offerSection.style.display = 'none';

    // Clear offer image data
    offerInput.value = '';
    offerImageFile = null;
    offerImageDataURL = null;
    offerImageRotation = 0;
  } else {
    // Show both label + input
    offerSection.style.display = 'block';
  }
}
