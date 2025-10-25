const canvas = document.getElementById('canvas');
const ctx = canvas.getContext('2d');
let selectedColor = '#FF0000'; // Default color for text (Red)

// currentBgSource MUST be initialized to a valid path.
let currentBgSource = 'Images/Artboard 1.jpg'; 






// --- Background Color Selection Logic ---
const colorButtons = document.querySelectorAll('button[data-file]'); 
colorButtons.forEach(button => {
    button.addEventListener('click', (e) => {
        e.preventDefault(); 
        
        colorButtons.forEach(btn => btn.classList.remove('selected'));
        e.target.classList.add('selected');

        // Update the current background source path
        currentBgSource = e.target.getAttribute('data-file');
        
        // Update the color for the text elements
        selectedColor = e.target.getAttribute('data-color');
        
        // Generate the image immediately upon background change
        generateImage(); 
    });
});

document.getElementById('generateButton').addEventListener('click', generateImage);


// --- Helper Functions: Simplified loadImage for Background (path) and other inputs (file) ---

function loadImage(sourceId, callback, checkAspect = false) {
    let file = null;
    let path = null;

    if (sourceId === 'templateBackground') {
        // BACKGROUND TEMPLATE: Always use the path set by the buttons
        path = currentBgSource;
    } else {
        // OTHER INPUTS (Logo, Offer Image): Try to load file from the input ID
        const fileInput = document.getElementById(sourceId);
        if (fileInput && fileInput.files.length > 0) {
            file = fileInput.files[0];
        }
    }
    
    // CASE 1: Load from a File Object (for logo/offer image)
    if (file) {
        const reader = new FileReader();
        reader.onload = (event) => {
            const img = new Image();
            img.onload = () => {
                if (checkAspect) {
                    const aspectRatio = img.width / img.height;
                    if (aspectRatio < 0.99 || aspectRatio > 1.01) {
                        alert(`🛑 ERROR: The Offer Product Image must be a SQUARE (1:1 Aspect Ratio). Your image ratio is ${aspectRatio.toFixed(2)}. Please upload a square image.`);
                        callback(null, true);
                        return;
                    }
                }
                callback(img, false);
            };
            img.src = event.target.result;
        };
        reader.readAsDataURL(file);
        
    // CASE 2: Load from a Path (for background template)
    } else if (path) {
        const img = new Image();
        img.onload = () => {
             callback(img, false);
        };
        img.onerror = () => {
             alert(`Could not load background image from path: ${path}. Make sure the file exists.`);
             callback(null, false);
        };
        img.src = path;
    } else {
        // No image source found for this element
        callback(null, false);
    }
}



// Handle button clicks
document.querySelectorAll('.controls button').forEach(button => {
    button.addEventListener('click', () => {
        selectedImageSrc = button.getAttribute('data-file');
        drawCanvas(selectedImageSrc);
    });
});

// Draw canvas function
function drawCanvas(imageSrc) {
    const img = new Image();
    img.src = imageSrc;
    img.onload = () => {
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
        // Enable download after image is drawn
        updateDownloadLink();
    };
}

// Download function
function updateDownloadLink() {
    const dataURL = canvas.toDataURL('image/png');
    const downloadLink = document.getElementById('downloadLink');
    const shopName = document.getElementById('shopName').value.trim() || 'OfferImage';
    
    downloadLink.href = dataURL;
    downloadLink.download = shopName + '.png';
    downloadLink.style.display = 'inline-block';
}



// Function to wrap and draw text aligned to the left
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

// Function to wrap and draw text aligned to the right
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


// --- Main Generation Function ---

function generateImage() {


                 // --- Footer Logo: Use uploaded footer logo OR fallback to company logo ---
// --- Alert checks for required fields ---
// --- Alert checks for required fields ---
// --- Alert checks for required fields ---
if (!document.getElementById('companyLogo').files.length) {
    alert("⚠️ Please upload the Company Logo!");
    return;
}
if (!document.getElementById('offerImage').files.length) {
    alert("⚠️ Please upload the Offer Image!");
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




    const canvas = document.getElementById('canvas');
    const ctx = canvas.getContext('2d');

    const W = 800;
    const H = 800;
    canvas.width = W;
    canvas.height = H;

    // Get input values
    const offerText = document.getElementById('offerText').value.toUpperCase();
    const shopName = document.getElementById('shopName').value;
    const shopAddress = document.getElementById('shopAddress').value;
    const contact = document.getElementById('contact').value;
    const contact2 = document.getElementById('contact2').value || '';

    // --- 1. Load Selected Background and Draw ---
    // Using a placeholder ID 'templateBackground' to trigger path loading logic
    loadImage('templateBackground', (bgImg) => {
        if (!bgImg) {
            return;
        }
        ctx.clearRect(0, 0, W, H);
        
        // Draw the selected background image.
        ctx.drawImage(bgImg, 0, 0, W, H);

        // --- 2. Draw Top Logo ---
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

            // --- 3. Draw Product Image (SMALLER & HIGHER) ---
            loadImage('offerImage', (offerImg, ratioFailed) => {
                if (ratioFailed) {
                    return;
                }

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

                // --- 4. Draw Offer Text (DYNAMIC SIZING & PERFECT ALIGNMENT) ---
              // --- Offer Text Rendering with Auto Font Scaling ---
// === OFFER TEXT AUTO FIT (Malayalam + Multi-line Support) ===
 const offerTextBoxY = H * 0.71;
                const offerTextBoxHeight = H * 0.11;
                const offerTextCenterX = W * 0.5;
                const offerTextMaxWidth = W * 0.70;
                

let fontSize = 22;                 
let lineHeightText = 38;

// Function: wrap text based on available width
function wrapText(ctx, text, maxWidth) {
    const words = text.split(' ');
    let lines = [];
    let line = '';

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
    return lines;
}



// Try to find best font size to fit inside box height
let lines;


do {
    ctx.font = `bold ${fontSize}px "Noto Sans Malayalam", Arial`;
    lines = wrapText(ctx, offerText, offerTextMaxWidth, 4); // <- limit to 4 lines
    lineHeight = fontSize * 1.25;
    const totalHeight = lines.length * lineHeight;
    if (totalHeight > offerTextBoxHeight) {
        fontSize -= 2; // shrink font gradually until fits
    } else {
        break;
    }
} while (fontSize > 12);
do {
    ctx.font = `bold ${fontSize}px "Noto Sans Malayalam", Arial`;
    lines = wrapText(ctx, offerText, offerTextMaxWidth);
    lineHeight = fontSize * 1.25;
    const totalHeight = lines.length * lineHeight;
    if (totalHeight > offerTextBoxHeight) {
        fontSize -= 2; // shrink font gradually until fits
    } else {
        break;
    }
} while (fontSize > 12);

ctx.font = `bold ${fontSize}px "Noto Sans Malayalam", Arial`;
ctx.textAlign = 'center';
ctx.fillStyle = selectedColor;

// 1. Set the baseline to middle for accurate centering
ctx.textBaseline = 'middle'; 

// 2. Calculate the vertical center of the box
const textCenterY = offerTextBoxY + (offerTextBoxHeight / 4);
const totalTextHeight = lines.length * lineHeight;

// 3. Find the Y-coordinate for the *center* of the first line
let firstLineCenterY = textCenterY - (totalTextHeight / 4) + (lineHeight / 2);

// Draw wrapped text lines, using the calculated center point
lines.forEach((line, i) => {
    ctx.fillText(line, offerTextCenterX, firstLineCenterY + i * lineHeight);
});

// Reset baseline to default if needed elsewhere (optional but good practice)
// ctx.textBaseline = 'alphabetic';


                // --- 5. Draw Footer Content (Contact Details and Footer Logo) ---
                const footerBoxY = H * 0.85;
                const footerBoxH = H * 0.10;
                const lineHeightFooter = 16;
                const leftColumnX = W * 0.10;
                const leftColumnWidth = W * 0.35; 
                const rightColumnX = W * 0.90;
                const rightColumnWidth = W * 0.25;

                const maxLinesInFooterBlock = 4;
                const totalBlockHeight = maxLinesInFooterBlock * lineHeightFooter;
                const footerTextCenterY = footerBoxY + (footerBoxH / 2);

                // Text Block Start Y: Centers the 4-line capacity block vertically
                const textBlockStartY = footerTextCenterY - (totalBlockHeight / 2) + (lineHeightFooter * 0.5);

                // Column 1: Left Side (Shop Details)
                let currentYLeft = textBlockStartY;
                ctx.font = 'bold 12px Arial';
                // Use the selected color for the "FOR MORE DETAILS" header.
                ctx.fillStyle = selectedColor; 
                ctx.textAlign = 'left';
                ctx.fillText("FOR MORE DETAILS", leftColumnX, currentYLeft);
                currentYLeft += lineHeightFooter * 1.0;

                ctx.font = 'bold 14px Arial';
                ctx.fillStyle = '#000000'; // Keep shop details black

                // Wrap and draw shop name
                currentYLeft = wrapTextLeft(ctx, `VISIT ${shopName.toUpperCase()}`, leftColumnX, currentYLeft, leftColumnWidth, lineHeightFooter, 1).finalY;

                // Wrap and draw shop address
                if (shopAddress) {
                    ctx.font = '12px Arial';
                    const addressLineHeight = 14;
                    wrapTextLeft(ctx, shopAddress.toUpperCase(), leftColumnX, currentYLeft - addressLineHeight * 0.1, leftColumnWidth, addressLineHeight, 3);
                }

                // Column 3: Right Side (Contact)
                let currentYRight = textBlockStartY; 
                ctx.font = 'bold 22px Arial';
                ctx.fillStyle = '#000000'; // Keep contact header black
                ctx.textAlign = 'right';
                ctx.fillText("Contact", rightColumnX, currentYRight);
                currentYRight += lineHeightFooter * 1.1;

                ctx.font = 'bold 18px Arial';
                // Contact 1 (wrapped)
                currentYRight = wrapTextRight(ctx, contact, rightColumnX, currentYRight, rightColumnWidth, lineHeightFooter).finalY;

                // Contact 2 (wrapped)
                if (contact2) {
                    ctx.font = '18px Arial';
                    wrapTextRight(ctx, contact2, rightColumnX, currentYRight - lineHeightFooter * 0.0, rightColumnWidth, lineHeightFooter * 0.9);
                }

                // Column 2: Center (Footer Logo)
                
   


// --- Function to draw footer logo ---
// --- Column 2: Footer Logo (Always company logo) ---
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

    updateDownloadLink(canvas);
});


            }, true);
        });
    });
}



