// Stepathon Challenge Application
class StepathonApp {
    constructor() {
        this.currentUser = null;
        this.isAdmin = false;
        this.participants = this.loadParticipants();
        this.stepEntries = this.loadStepEntries();
        this.adminCredentials = { username: 'admin', password: 'admin123' }; // Default admin credentials
        this.init();
    }

    init() {
        this.setupEventListeners();
        this.checkCurrentUser();
        this.updateLeaderboard();
        this.updateDates();
    }

    setupEventListeners() {
        // Login tabs
        document.querySelectorAll('.login-tab').forEach(tab => {
            tab.addEventListener('click', (e) => {
                const tabType = e.target.dataset.tab;
                this.switchLoginTab(tabType);
            });
        });

        // Registration form
        document.getElementById('registrationForm').addEventListener('submit', (e) => {
            e.preventDefault();
            this.handleRegistration();
        });

        // User login form
        document.getElementById('loginForm').addEventListener('submit', (e) => {
            e.preventDefault();
            this.handleLogin();
        });

        // Switch between registration and login
        const showRegistrationLink = document.getElementById('showRegistrationLink');
        if (showRegistrationLink) {
            showRegistrationLink.addEventListener('click', (e) => {
                e.preventDefault();
                this.switchLoginTab('user');
            });
        }

        // Forgot password link
        const forgotPasswordLink = document.getElementById('forgotPasswordLink');
        if (forgotPasswordLink) {
            forgotPasswordLink.addEventListener('click', (e) => {
                e.preventDefault();
                this.handleForgotPassword();
            });
        }

        // Admin login form
        document.getElementById('adminForm').addEventListener('submit', (e) => {
            e.preventDefault();
            this.handleAdminLogin();
        });

        document.getElementById('addStepsForm').addEventListener('submit', (e) => {
            e.preventDefault();
            this.addSteps();
        });

        document.getElementById('logoutBtn').addEventListener('click', () => {
            this.logout();
        });

        // Admin logout
        const adminLogoutBtn = document.getElementById('adminLogoutBtn');
        if (adminLogoutBtn) {
            adminLogoutBtn.addEventListener('click', () => {
                this.adminLogout();
            });
        }

        // Manual screenshot upload
        const manualScreenshot = document.getElementById('manualScreenshot');
        if (manualScreenshot) {
            manualScreenshot.addEventListener('change', (e) => {
                this.handleManualScreenshotUpload(e.target.files[0]);
            });
        }

        const removeManualImageBtn = document.getElementById('removeManualImageBtn');
        if (removeManualImageBtn) {
            removeManualImageBtn.addEventListener('click', () => {
                this.resetManualScreenshot();
            });
        }

        // Admin filters
        const adminFilters = document.querySelectorAll('.admin-filters .filter-btn');
        adminFilters.forEach(btn => {
            btn.addEventListener('click', (e) => {
                const filter = e.target.dataset.filter;
                this.filterAdminEntries(filter);
            });
        });

        // Method tabs
        document.querySelectorAll('.method-tab').forEach(tab => {
            tab.addEventListener('click', (e) => {
                const method = e.target.dataset.method;
                this.switchInputMethod(method);
            });
        });

        // Screenshot upload
        const screenshotInput = document.getElementById('screenshotInput');
        const uploadArea = document.getElementById('uploadArea');
        
        screenshotInput.addEventListener('change', (e) => {
            this.handleScreenshotUpload(e.target.files[0]);
        });

        // Drag and drop
        uploadArea.addEventListener('dragover', (e) => {
            e.preventDefault();
            uploadArea.classList.add('dragover');
        });

        uploadArea.addEventListener('dragleave', () => {
            uploadArea.classList.remove('dragover');
        });

        uploadArea.addEventListener('drop', (e) => {
            e.preventDefault();
            uploadArea.classList.remove('dragover');
            const file = e.dataTransfer.files[0];
            if (file && file.type.startsWith('image/')) {
                this.handleScreenshotUpload(file);
            }
        });

        // Remove image
        document.getElementById('removeImageBtn').addEventListener('click', () => {
            this.resetScreenshotForm();
        });

        // Confirm extracted steps
        document.getElementById('confirmStepsBtn').addEventListener('click', async () => {
            const steps = parseInt(document.getElementById('extractedSteps').textContent.replace(/,/g, ''));
            if (steps > 0) {
                // Get the screenshot from OCR form
                const screenshotInput = document.getElementById('screenshotInput');
                if (screenshotInput && screenshotInput.files.length > 0) {
                    // Store screenshot temporarily for addSteps
                    this.tempScreenshotFile = screenshotInput.files[0];
                }
                document.getElementById('stepsInput').value = steps;
                await this.addSteps();
                this.resetScreenshotForm();
                this.tempScreenshotFile = null;
            } else {
                alert('Please edit the steps value before confirming.');
            }
        });

        // Edit steps
        document.getElementById('editStepsBtn').addEventListener('click', () => {
            document.getElementById('editStepsInput').style.display = 'flex';
            const currentSteps = document.getElementById('extractedSteps').textContent.replace(/,/g, '');
            document.getElementById('editedSteps').value = currentSteps;
        });

        // Save edited steps
        document.getElementById('saveEditedStepsBtn').addEventListener('click', () => {
            const editedSteps = parseInt(document.getElementById('editedSteps').value);
            if (!isNaN(editedSteps) && editedSteps >= 0) {
                document.getElementById('extractedSteps').textContent = editedSteps.toLocaleString();
                document.getElementById('editStepsInput').style.display = 'none';
            }
        });

        // Refresh motivation button
        const refreshMotivationBtn = document.getElementById('refreshMotivationBtn');
        if (refreshMotivationBtn) {
            refreshMotivationBtn.addEventListener('click', () => {
                this.updateDailyMotivation();
                // Add animation feedback
                refreshMotivationBtn.style.transform = 'scale(0.95)';
                setTimeout(() => {
                    refreshMotivationBtn.style.transform = 'scale(1)';
                }, 150);
            });
        }

        // Leaderboard filters
        document.querySelectorAll('.filter-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                document.querySelectorAll('.filter-btn').forEach(b => b.classList.remove('active'));
                e.target.classList.add('active');
                this.updateLeaderboard(e.target.dataset.filter);
            });
        });
    }

    switchInputMethod(method) {
        document.querySelectorAll('.method-tab').forEach(tab => {
            tab.classList.remove('active');
        });
        document.querySelector(`[data-method="${method}"]`).classList.add('active');

        if (method === 'manual') {
            document.getElementById('addStepsForm').style.display = 'block';
            document.getElementById('screenshotForm').style.display = 'none';
        } else {
            document.getElementById('addStepsForm').style.display = 'none';
            document.getElementById('screenshotForm').style.display = 'block';
        }
        this.resetScreenshotForm();
    }

    async handleScreenshotUpload(file) {
        if (!file || !file.type.startsWith('image/')) {
            alert('Please upload a valid image file!');
            return;
        }

        // Show image preview
        const reader = new FileReader();
        reader.onload = (e) => {
            document.getElementById('previewImage').src = e.target.result;
            document.getElementById('imagePreview').style.display = 'block';
            document.getElementById('uploadArea').style.display = 'none';
            
            // Start OCR processing
            this.processImageWithOCR(e.target.result);
        };
        reader.readAsDataURL(file);
    }

    async processImageWithOCR(imageDataUrl) {
        const ocrProcessing = document.getElementById('ocrProcessing');
        const extractedResult = document.getElementById('extractedResult');
        
        ocrProcessing.style.display = 'block';
        extractedResult.style.display = 'none';

        try {
            let steps = 0;
            let ocrText = '';
            let ocrWords = [];

            // Try OCR with original image first (better for colored/dark backgrounds)
            try {
                const result1 = await Tesseract.recognize(imageDataUrl, 'eng', {
                    logger: m => {
                        if (m.status === 'recognizing text') {
                            // Progress logging
                        }
                    }
                });
                ocrText = result1.data.text;
                ocrWords = result1.data.words || [];
                console.log('OCR Text (Original):', ocrText);
                console.log('OCR Words (Original):', ocrWords);
                
                steps = this.extractStepsFromText(ocrText, ocrWords);
            } catch (err) {
                console.log('First OCR attempt failed, trying preprocessed image');
            }

            // If no steps found, try with preprocessed image
            if (steps === 0) {
                try {
                    const processedImage = await this.preprocessImage(imageDataUrl);
                    const result2 = await Tesseract.recognize(processedImage, 'eng', {
                        logger: m => {
                            if (m.status === 'recognizing text') {
                                // Progress logging
                            }
                        }
                    });
                    
                    const processedText = result2.data.text;
                    const processedWords = result2.data.words || [];
                    console.log('OCR Text (Processed):', processedText);
                    console.log('OCR Words (Processed):', processedWords);
                    
                    const processedSteps = this.extractStepsFromText(processedText, processedWords);
                    if (processedSteps > 0) {
                        steps = processedSteps;
                        ocrText = processedText;
                        ocrWords = processedWords;
                    }
                } catch (err) {
                    console.log('Processed OCR attempt also failed');
                }
            }

            // If still no steps, try with number-only OCR
            if (steps === 0) {
                try {
                    const result3 = await Tesseract.recognize(imageDataUrl, 'eng', {
                        tessedit_char_whitelist: '0123456789,',
                        tessedit_pageseg_mode: '6' // Uniform block of text
                    });
                    const numbersOnlyText = result3.data.text;
                    console.log('OCR Text (Numbers Only):', numbersOnlyText);
                    const numbersOnlySteps = this.extractStepsFromText(numbersOnlyText, result3.data.words || []);
                    if (numbersOnlySteps > 0) {
                        steps = numbersOnlySteps;
                        // Combine OCR texts for debug
                        if (ocrText) {
                            ocrText += '\n\n--- Numbers Only OCR ---\n' + numbersOnlyText;
                        } else {
                            ocrText = numbersOnlyText;
                        }
                    }
                } catch (err) {
                    console.log('Numbers-only OCR attempt failed');
                }
            }
            
            // If still no steps, try combining all OCR texts for better extraction
            if (steps === 0 && ocrText) {
                // One more attempt with combined text
                steps = this.extractStepsFromText(ocrText, ocrWords);
            }
            
            ocrProcessing.style.display = 'none';
            
            // Always set debug text
            const debugTextEl = document.getElementById('debugOcrText');
            if (debugTextEl) {
                debugTextEl.textContent = ocrText.substring(0, 1000) || 'No text detected by OCR';
            }
            
            if (steps > 0) {
                document.getElementById('extractedSteps').textContent = steps.toLocaleString();
                document.getElementById('confirmStepsBtn').style.display = 'inline-block';
                extractedResult.style.display = 'block';
            } else {
                // Show debug info but still display result card
                const debugInfo = `OCR detected text: "${ocrText.substring(0, 200)}"\n\nCould not detect steps. Please try:\n1. Ensure the step count is clearly visible\n2. Use a clearer image\n3. Or enter steps manually\n\nCheck the Debug Info section below for full OCR text.`;
                alert(debugInfo);
                // Still show the result card with debug info even if no steps detected
                extractedResult.style.display = 'block';
                document.getElementById('extractedSteps').textContent = '0';
                document.getElementById('confirmStepsBtn').style.display = 'none';
            }
        } catch (error) {
            console.error('OCR Error:', error);
            ocrProcessing.style.display = 'none';
            alert('Error processing image. Please try again or enter steps manually.');
            this.resetScreenshotForm();
        }
    }

    async preprocessImage(imageDataUrl) {
        return new Promise((resolve) => {
            const img = new Image();
            img.onload = () => {
                const canvas = document.createElement('canvas');
                const ctx = canvas.getContext('2d');
                
                // Scale up image for better OCR (2x)
                const scale = 2;
                canvas.width = img.width * scale;
                canvas.height = img.height * scale;
                
                // Use image smoothing
                ctx.imageSmoothingEnabled = true;
                ctx.imageSmoothingQuality = 'high';
                
                // Draw scaled image
                ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
                
                // Get image data
                const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
                const data = imageData.data;
                
                // Enhance contrast and brightness (less aggressive)
                for (let i = 0; i < data.length; i += 4) {
                    // Convert to grayscale
                    const gray = data[i] * 0.299 + data[i + 1] * 0.587 + data[i + 2] * 0.114;
                    
                    // Increase contrast moderately
                    const contrast = 1.3;
                    const factor = (259 * (contrast * 255 + 255)) / (255 * (259 - contrast * 255));
                    let newGray = factor * (gray - 128) + 128;
                    
                    // Brightness adjustment
                    newGray = Math.min(255, Math.max(0, newGray + 20));
                    
                    // Soft threshold (not pure black/white)
                    const threshold = newGray > 140 ? 255 : (newGray < 100 ? 0 : newGray);
                    
                    data[i] = threshold;     // R
                    data[i + 1] = threshold; // G
                    data[i + 2] = threshold; // B
                    // data[i + 3] stays as alpha
                }
                
                // Put processed image data back
                ctx.putImageData(imageData, 0, 0);
                
                // Convert back to data URL
                resolve(canvas.toDataURL('image/png'));
            };
            img.src = imageDataUrl;
        });
    }

    extractStepsFromText(text, words = []) {
        // Clean the text - preserve numbers and commas
        const cleanText = text.replace(/\s+/g, ' ');
        
        console.log('Processing text:', cleanText);
        
        // Extract all numbers (with and without commas)
        const allNumbers = [];
        const excludedNumbers = new Set(); // Numbers to exclude (like goal values)
        
        // First, identify numbers to EXCLUDE (goal values, etc.)
        const goalPatterns = [
            /goal\s*:?\s*(\d{1,3}(?:,\d{3})*|\d{3,6})/gi,
            /target\s*:?\s*(\d{1,3}(?:,\d{3})*|\d{3,6})/gi,
            /(\d{1,3}(?:,\d{3})*|\d{3,6})\s*goal/gi,
        ];
        
        goalPatterns.forEach(pattern => {
            const matches = [...cleanText.matchAll(pattern)];
            matches.forEach(match => {
                const numStr = match[1] || match[0].replace(/\D/g, '');
                const parsed = parseInt(numStr.replace(/,/g, ''));
                if (parsed >= 1000) {
                    excludedNumbers.add(parsed);
                    console.log('Excluding goal/target number:', parsed);
                }
            });
        });
        
        // Pattern 1: Numbers with commas (e.g., "6,162", "10,000")
        const commaNumbers = cleanText.match(/\d{1,3}(?:,\d{3})+/g);
        if (commaNumbers) {
            commaNumbers.forEach(num => {
                const parsed = parseInt(num.replace(/,/g, ''));
                if (parsed >= 100 && parsed <= 1000000 && !excludedNumbers.has(parsed)) {
                    // Much lower confidence if it's a round number (likely goal)
                    // Round numbers like 10,000, 5,000, 8,000 are almost always goals
                    let confidence = 0.9;
                    if (parsed % 1000 === 0) {
                        confidence = 0.2; // Very low confidence for round numbers
                    } else if (parsed % 100 === 0) {
                        confidence = 0.7; // Medium confidence for numbers ending in 00
                    }
                    allNumbers.push({ value: parsed, original: num, confidence: confidence });
                }
            });
        }
        
        // Pattern 2: Look for "TOTAL" keyword (HIGHEST PRIORITY - fitness apps often use "TOTAL X steps")
        const totalPatterns = [
            /total\s+(\d{1,3}(?:,\d{3})*|\d{3,6})\s+steps?/gi,
            /total\s+steps?\s*:?\s*(\d{1,3}(?:,\d{3})*|\d{3,6})/gi,
            /(\d{1,3}(?:,\d{3})*|\d{3,6})\s+steps?\s+total/gi,
        ];
        
        totalPatterns.forEach(pattern => {
            const matches = [...cleanText.matchAll(pattern)];
            matches.forEach(match => {
                const numStr = match[1] || match[0].replace(/\D/g, '');
                const parsed = parseInt(numStr.replace(/,/g, ''));
                if (parsed >= 100 && parsed <= 1000000 && !excludedNumbers.has(parsed)) {
                    allNumbers.push({ value: parsed, original: numStr, confidence: 0.99 });
                    console.log('Found TOTAL pattern:', parsed);
                }
            });
        });
        
        // Pattern 2b: Look for "steps" keyword and nearby numbers (HIGH PRIORITY)
        const stepPatterns = [
            /(\d{1,3}(?:,\d{3})*|\d{3,6})\s+steps?/gi,
            /steps?\s*:?\s*(\d{1,3}(?:,\d{3})*|\d{3,6})/gi,
            /(\d{1,3}(?:,\d{3})*|\d{3,6})\s+st\b/gi,
        ];
        
        stepPatterns.forEach(pattern => {
            const matches = [...cleanText.matchAll(pattern)];
            matches.forEach(match => {
                const numStr = match[1] || match[0].replace(/\D/g, '');
                const parsed = parseInt(numStr.replace(/,/g, ''));
                if (parsed >= 100 && parsed <= 1000000 && !excludedNumbers.has(parsed)) {
                    allNumbers.push({ value: parsed, original: numStr, confidence: 0.98 });
                }
            });
        });
        
        // Pattern 2c: "today" keyword (HIGH PRIORITY - step count is usually shown with "today")
        const todayPatterns = [
            /today\s*:?\s*(\d{1,3}(?:,\d{3})*|\d{3,6})/gi,
            /(\d{1,3}(?:,\d{3})*|\d{3,6})\s+today/gi,
            /(\d{1,3}(?:,\d{3})*|\d{3,6})\s+steps?\s+today/gi,
            /today\s+(\d{1,3}(?:,\d{3})*|\d{3,6})\s+steps?/gi,
        ];
        
        todayPatterns.forEach(pattern => {
            const matches = [...cleanText.matchAll(pattern)];
            matches.forEach(match => {
                const numStr = match[1] || match[0].replace(/\D/g, '');
                const parsed = parseInt(numStr.replace(/,/g, ''));
                if (parsed >= 100 && parsed <= 1000000 && !excludedNumbers.has(parsed)) {
                    allNumbers.push({ value: parsed, original: numStr, confidence: 0.97 });
                }
            });
        });
        
        // Pattern 3: 3-digit numbers (common for early day step counts like 981, 987)
        const threeDigitNumbers = cleanText.match(/\b\d{3}\b/g);
        if (threeDigitNumbers) {
            threeDigitNumbers.forEach(num => {
                const parsed = parseInt(num);
                // 3-digit numbers are valid step counts (especially early in the day)
                if (parsed >= 100 && parsed <= 999 && !excludedNumbers.has(parsed)) {
                    // Check if it's near "TOTAL" or "steps" for higher confidence
                    const numIndex = cleanText.indexOf(num);
                    const context = cleanText.substring(
                        Math.max(0, numIndex - 30),
                        Math.min(cleanText.length, numIndex + 30)
                    ).toLowerCase();
                    const confidence = (context.includes('total') || context.includes('step')) ? 0.95 : 0.7;
                    allNumbers.push({ value: parsed, original: num, confidence: confidence });
                }
            });
        }
        
        // Pattern 3b: Large standalone numbers (4-6 digits, likely step counts)
        // Also match numbers with commas that might be split by OCR
        const largeNumbers = cleanText.match(/\b\d{4,6}\b/g);
        if (largeNumbers) {
            largeNumbers.forEach(num => {
                const parsed = parseInt(num);
                if (parsed >= 1000 && parsed <= 100000 && !excludedNumbers.has(parsed)) {
                    const confidence = (parsed % 1000 === 0) ? 0.3 : 0.7;
                    allNumbers.push({ value: parsed, original: num, confidence: confidence });
                }
            });
        }
        
        // Pattern 3c: Numbers that might be split (e.g., "6,162" read as "6 162" or "6162")
        const splitNumbers = cleanText.match(/\d{1,2}\s+\d{3,4}\b/g);
        if (splitNumbers) {
            splitNumbers.forEach(num => {
                const combined = num.replace(/\s+/g, '');
                const parsed = parseInt(combined);
                if (parsed >= 1000 && parsed <= 100000 && !excludedNumbers.has(parsed)) {
                    allNumbers.push({ value: parsed, original: num, confidence: 0.75 });
                }
            });
        }
        
        // Pattern 3d: Look for 4-digit numbers that could be step counts (e.g., 6162)
        const fourDigitNumbers = cleanText.match(/\b\d{4}\b/g);
        if (fourDigitNumbers) {
            fourDigitNumbers.forEach(num => {
                const parsed = parseInt(num);
                // Prefer numbers in typical step range, exclude round numbers
                if (parsed >= 1000 && parsed <= 50000 && !excludedNumbers.has(parsed)) {
                    // Higher confidence for non-round 4-digit numbers
                    const confidence = (parsed % 1000 === 0) ? 0.3 : 0.85;
                    allNumbers.push({ value: parsed, original: num, confidence: confidence });
                }
            });
        }
        
        // Pattern 4: Use word data if available (better position info)
        if (words && words.length > 0) {
            // Find words that look like step counts (large numbers)
            // Sort by bounding box size (larger = more prominent = likely step count)
            const numberWords = words
                .map(word => {
                    const wordText = word.text.replace(/[,\s]/g, '');
                    const parsed = parseInt(wordText);
                    if (!isNaN(parsed) && parsed >= 1000 && parsed <= 100000 && !excludedNumbers.has(parsed)) {
                        const bbox = word.bbox || {};
                        const area = (bbox.x1 - bbox.x0) * (bbox.y1 - bbox.y0);
                        return {
                            value: parsed,
                            original: word.text,
                            area: area,
                            bbox: bbox
                        };
                    }
                    return null;
                })
                .filter(w => w !== null)
                .sort((a, b) => b.area - a.area); // Largest first
            
            numberWords.forEach((word, index) => {
                // Higher confidence for larger/prominent numbers
                let confidence = 0.6;
                
                // Accept 3-digit numbers (like 981, 987) - common for early day step counts
                if (word.value >= 100 && word.value <= 999) {
                    confidence = 0.85; // Good confidence for 3-digit numbers
                }
                // Prefer numbers in typical step range (not round numbers like 10,000)
                else if (word.value >= 1000 && word.value <= 50000) {
                    // Round numbers (multiples of 1000) are likely goals, not step counts
                    if (word.value % 1000 === 0) {
                        confidence = 0.15; // Very low confidence for round numbers (likely goals)
                    } else {
                        confidence = 0.92; // Very high confidence for non-round numbers in step range
                    }
                } else if (word.value > 50000) {
                    confidence = 0.7;
                }
                
                // MAJOR boost for largest bounding box (most prominent number)
                // The step count is ALWAYS the largest/most prominent number on screen
                if (index === 0 && word.area > 1000) {
                    confidence += 0.2; // Extra boost for most prominent number
                    // If it's also non-round, boost even more
                    if (word.value % 1000 !== 0) {
                        confidence += 0.1;
                    }
                }
                
                // Heavy penalty for common goal values
                if (word.value === 10000 || word.value === 5000 || word.value === 8000 || word.value === 12000) {
                    confidence = 0.1; // Almost zero confidence for common goal values
                }
                
                // Additional penalty if excluded
                if (excludedNumbers.has(word.value)) {
                    confidence = 0.05; // Almost zero if explicitly excluded
                }
                
                allNumbers.push({
                    value: word.value,
                    original: word.original,
                    confidence: Math.min(1.0, confidence),
                    bbox: word.bbox,
                    area: word.area
                });
            });
        }
        
        // Pattern 5: Look for numbers near "TOTAL" keyword (HIGHEST PRIORITY)
        const totalIndex = cleanText.toLowerCase().indexOf('total');
        if (totalIndex !== -1) {
            // Extract numbers near "total" (within 40 characters - "TOTAL 981 steps Today")
            const context = cleanText.substring(
                Math.max(0, totalIndex - 10), 
                Math.min(cleanText.length, totalIndex + 40)
            );
            const nearbyNumbers = context.match(/\d{1,3}(?:,\d{3})*|\d{3,6}/g);
            if (nearbyNumbers) {
                nearbyNumbers.forEach(num => {
                    const parsed = parseInt(num.replace(/,/g, ''));
                    // Accept 3-digit numbers too (like 981)
                    if (parsed >= 100 && parsed <= 100000 && !excludedNumbers.has(parsed)) {
                        // Very high confidence for numbers near "TOTAL"
                        allNumbers.push({ value: parsed, original: num, confidence: 0.995 });
                        console.log('Found number near TOTAL:', parsed);
                    }
                });
            }
        }
        
        // Pattern 5b: Look for numbers near "today" keyword (HIGH PRIORITY - step count is usually with "today")
        const todayIndex = cleanText.toLowerCase().indexOf('today');
        if (todayIndex !== -1) {
            // Extract numbers near "today" (within 30 characters)
            const context = cleanText.substring(
                Math.max(0, todayIndex - 30), 
                Math.min(cleanText.length, todayIndex + 30)
            );
            const nearbyNumbers = context.match(/\d{1,3}(?:,\d{3})*|\d{3,6}/g);
            if (nearbyNumbers) {
                nearbyNumbers.forEach(num => {
                    const parsed = parseInt(num.replace(/,/g, ''));
                    // Accept 3-digit numbers too
                    if (parsed >= 100 && parsed <= 100000 && !excludedNumbers.has(parsed)) {
                        // Very high confidence for numbers near "today"
                        allNumbers.push({ value: parsed, original: num, confidence: 0.99 });
                    }
                });
            }
        }
        
        // Pattern 5c: Look for numbers near "step" keyword (but not "goal")
        const stepIndex = cleanText.toLowerCase().indexOf('step');
        if (stepIndex !== -1) {
            // Check if "goal" is nearby - if so, skip this context
            const goalNearby = cleanText.toLowerCase().substring(
                Math.max(0, stepIndex - 20),
                Math.min(cleanText.length, stepIndex + 20)
            ).includes('goal');
            
            if (!goalNearby) {
                const context = cleanText.substring(
                    Math.max(0, stepIndex - 30), 
                    Math.min(cleanText.length, stepIndex + 30)
                );
                const nearbyNumbers = context.match(/\d{1,3}(?:,\d{3})*|\d{3,6}/g);
                if (nearbyNumbers) {
                    nearbyNumbers.forEach(num => {
                        const parsed = parseInt(num.replace(/,/g, ''));
                        // Accept 3-digit numbers too
                        if (parsed >= 100 && parsed <= 100000 && !excludedNumbers.has(parsed)) {
                            allNumbers.push({ value: parsed, original: num, confidence: 0.95 });
                        }
                    });
                }
            }
        }
        
        // Remove duplicates and sort by confidence and value
        const uniqueNumbers = [];
        const seen = new Set();
        
        allNumbers.forEach(item => {
            if (!seen.has(item.value)) {
                seen.add(item.value);
                uniqueNumbers.push(item);
            }
        });
        
        // Sort by confidence (highest first), then by area (largest first if available), then by value
        uniqueNumbers.sort((a, b) => {
            // First priority: confidence
            if (Math.abs(a.confidence - b.confidence) > 0.1) {
                return b.confidence - a.confidence;
            }
            // Second priority: bounding box area (larger = more prominent)
            if (a.area && b.area && Math.abs(a.area - b.area) > 100) {
                return b.area - a.area;
            }
            // Third priority: prefer non-round numbers (not multiples of 1000)
            const aIsRound = a.value % 1000 === 0;
            const bIsRound = b.value % 1000 === 0;
            if (aIsRound !== bIsRound) {
                return aIsRound ? 1 : -1; // Non-round numbers first
            }
            // Fourth priority: value (larger first, but within reasonable range)
            return b.value - a.value;
        });
        
        console.log('Extracted numbers:', uniqueNumbers);
        
        // Return the best match with aggressive filtering
        if (uniqueNumbers.length > 0) {
            // Strategy 1: Highest confidence number (likely from "TOTAL" pattern - 0.995 confidence)
            const highestConfidence = uniqueNumbers.find(n => 
                n.confidence >= 0.99 && 
                !excludedNumbers.has(n.value)
            );
            if (highestConfidence) {
                console.log('Selected highest confidence number (TOTAL pattern):', highestConfidence.value, 'Confidence:', highestConfidence.confidence);
                return highestConfidence.value;
            }
            
            // Strategy 2: Prefer the number with largest bounding box (most prominent) that's not excluded
            // This is the MOST IMPORTANT - step count is always the most prominent number
            const largestArea = uniqueNumbers.find(n => 
                n.area && 
                n.area > 1000 && 
                !excludedNumbers.has(n.value) &&
                n.value % 1000 !== 0  // Not a round number
            );
            if (largestArea) {
                console.log('Selected largest area number (most prominent):', largestArea.value, 'Area:', largestArea.area);
                return largestArea.value;
            }
            
            // Strategy 3: Prefer numbers in the 100-50,000 range that are NOT round numbers
            // Include 3-digit numbers (like 981)
            const typicalNonRound = uniqueNumbers.find(n => 
                n.value >= 100 && 
                n.value <= 50000 && 
                n.value % 1000 !== 0 &&
                !excludedNumbers.has(n.value)
            );
            if (typicalNonRound) {
                console.log('Selected typical non-round number:', typicalNonRound.value);
                return typicalNonRound.value;
            }
            
            // Strategy 4: Highest confidence that's not excluded and not round
            const bestConfidence = uniqueNumbers.find(n => 
                !excludedNumbers.has(n.value) && 
                n.value % 1000 !== 0 &&
                n.confidence > 0.5
            );
            if (bestConfidence) {
                console.log('Selected highest confidence number:', bestConfidence.value, 'Confidence:', bestConfidence.confidence);
                return bestConfidence.value;
            }
            
            // Strategy 5: Any number that's not excluded (even if round)
            const notExcluded = uniqueNumbers.find(n => !excludedNumbers.has(n.value));
            if (notExcluded) {
                console.log('Selected non-excluded number:', notExcluded.value);
                return notExcluded.value;
            }
            
            // Last resort: highest confidence match (but log warning)
            console.warn('WARNING: Using fallback number, may be incorrect:', uniqueNumbers[0].value);
            return uniqueNumbers[0].value;
        }
        
        return 0;
    }

    resetScreenshotForm() {
        document.getElementById('screenshotInput').value = '';
        document.getElementById('imagePreview').style.display = 'none';
        document.getElementById('uploadArea').style.display = 'block';
        document.getElementById('ocrProcessing').style.display = 'none';
        document.getElementById('extractedResult').style.display = 'none';
        document.getElementById('editStepsInput').style.display = 'none';
        document.getElementById('previewImage').src = '';
    }

    updateDates() {
        const today = new Date();
        const startDate = new Date(today);
        startDate.setDate(today.getDate() - (today.getDate() - 1));
        
        const endDate = new Date(startDate);
        endDate.setMonth(endDate.getMonth() + 1);
        endDate.setDate(0);

        document.getElementById('startDate').textContent = this.formatDate(startDate);
        document.getElementById('endDate').textContent = this.formatDate(endDate);
    }

    formatDate(date) {
        return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
    }

    checkCurrentUser() {
        const savedUser = localStorage.getItem('currentUser');
        const savedAdmin = localStorage.getItem('isAdmin');
        
        if (savedAdmin === 'true') {
            this.isAdmin = true;
            this.showAdminDashboard();
        } else if (savedUser) {
            this.currentUser = JSON.parse(savedUser);
            this.showDashboard();
        }
    }

    switchLoginTab(tabType) {
        document.querySelectorAll('.login-tab').forEach(tab => tab.classList.remove('active'));
        document.querySelectorAll('.login-form').forEach(form => {
            form.classList.remove('active');
            if (form.id !== 'adminLoginForm') {
                form.style.display = 'none';
            }
        });
        
        if (tabType === 'user') {
            document.querySelector('[data-tab="user"]').classList.add('active');
            document.getElementById('userLoginForm').style.display = 'block';
            document.getElementById('userLoginForm').classList.add('active');
            document.getElementById('userLoginFormExisting').style.display = 'none';
        } else if (tabType === 'user-login') {
            document.querySelector('[data-tab="user-login"]').classList.add('active');
            document.getElementById('userLoginFormExisting').style.display = 'block';
            document.getElementById('userLoginFormExisting').classList.add('active');
            document.getElementById('userLoginForm').style.display = 'none';
        } else {
            document.querySelector('[data-tab="admin"]').classList.add('active');
            document.getElementById('adminLoginForm').classList.add('active');
            document.getElementById('userLoginForm').style.display = 'none';
            document.getElementById('userLoginFormExisting').style.display = 'none';
        }
    }

    handleAdminLogin() {
        const username = document.getElementById('adminUsername').value.trim();
        const password = document.getElementById('adminPassword').value.trim();

        if (!username || !password) {
            alert('Please enter both username and password!');
            return;
        }

        if (username === this.adminCredentials.username && password === this.adminCredentials.password) {
            this.isAdmin = true;
            localStorage.setItem('isAdmin', 'true');
            this.showAdminDashboard();
        } else {
            alert('Invalid admin credentials!');
        }
    }

    adminLogout() {
        this.isAdmin = false;
        localStorage.removeItem('isAdmin');
        document.getElementById('loginCard').style.display = 'block';
        document.getElementById('adminDashboard').style.display = 'none';
        document.getElementById('dashboardCard').style.display = 'none';
    }

    loadStepEntries() {
        const saved = localStorage.getItem('stepEntries');
        return saved ? JSON.parse(saved) : [];
    }

    saveStepEntries() {
        localStorage.setItem('stepEntries', JSON.stringify(this.stepEntries));
    }

    handleRegistration() {
        const name = document.getElementById('employeeName').value.trim();
        const id = document.getElementById('employeeId').value.trim();
        const email = document.getElementById('emailId').value.trim();
        const username = document.getElementById('username').value.trim();
        const password = document.getElementById('password').value;
        const confirmPassword = document.getElementById('confirmPassword').value;

        // Validation
        if (!name) {
            alert('Please enter your name!');
            return;
        }

        if (!id) {
            alert('Please enter your Employee ID!');
            return;
        }

        if (!email) {
            alert('Please enter your Email ID!');
            return;
        }

        // Email validation
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(email)) {
            alert('Please enter a valid email address!');
            return;
        }

        if (!username || username.length < 3) {
            alert('Please enter a username with at least 3 characters!');
            return;
        }

        if (!password || password.length < 6) {
            alert('Please enter a password with at least 6 characters!');
            return;
        }

        if (password !== confirmPassword) {
            alert('Passwords do not match!');
            return;
        }

        // Check if username already exists
        const existingUser = this.participants.find(p => p.username && p.username.toLowerCase() === username.toLowerCase());
        if (existingUser) {
            alert('Username already exists! Please choose a different username.');
            document.getElementById('username').focus();
            return;
        }

        // Check if email is already registered
        const existingEmail = this.participants.find(p => p.email && p.email.toLowerCase() === email.toLowerCase());
        if (existingEmail) {
            alert('This email is already registered! Please login instead.');
            document.getElementById('emailId').focus();
            this.switchLoginTab('user-login');
            return;
        }

        // Check if employee ID is already registered
        const existingEmployeeId = this.participants.find(p => p.id && p.id.toLowerCase() === id.toLowerCase());
        if (existingEmployeeId) {
            alert('This Employee ID is already registered! Please login instead or contact support if you believe this is an error.');
            document.getElementById('employeeId').focus();
            this.switchLoginTab('user-login');
            return;
        }

        // Create new participant
        const participant = {
            id: id,
            name: name,
            email: email,
            username: username,
            password: this.hashPassword(password), // Store hashed password
            totalSteps: 0,
            dailySteps: {},
            streak: 0,
            lastActivity: null,
            activities: [],
            registeredAt: new Date().toISOString()
        };

        this.participants.push(participant);
        localStorage.setItem('participants', JSON.stringify(this.participants));

        // Simulate sending password email
        this.sendPasswordEmail(email, password, username);

        // Show success message
        alert(`Account created successfully!\n\nYour password has been sent to: ${email}\n\nPlease check your email and login with your username and password.`);
        
        // Clear form and switch to login
        document.getElementById('registrationForm').reset();
        this.switchLoginTab('user-login');
    }

    handleLogin() {
        const username = document.getElementById('loginUsername').value.trim();
        const password = document.getElementById('loginPassword').value;

        if (!username || !password) {
            alert('Please enter both username and password!');
            return;
        }

        // Find participant by username
        const participant = this.participants.find(p => p.username && p.username.toLowerCase() === username.toLowerCase());
        
        if (!participant) {
            alert('Invalid username or password!');
            document.getElementById('loginUsername').focus();
            return;
        }

        // Verify password
        const hashedPassword = this.hashPassword(password);
        if (participant.password !== hashedPassword) {
            alert('Invalid username or password!');
            document.getElementById('loginPassword').focus();
            return;
        }

        this.currentUser = participant;
        localStorage.setItem('currentUser', JSON.stringify(participant));

        // Clear login form
        document.getElementById('loginForm').reset();

        this.showDashboard();
        this.updateLeaderboard();
    }

    hashPassword(password) {
        // Simple hash function (for demo purposes)
        // In production, use a proper hashing library like bcrypt
        let hash = 0;
        for (let i = 0; i < password.length; i++) {
            const char = password.charCodeAt(i);
            hash = ((hash << 5) - hash) + char;
            hash = hash & hash; // Convert to 32bit integer
        }
        return hash.toString();
    }

    sendPasswordEmail(email, password, username) {
        // Simulate email sending
        // In a real application, this would call a backend API to send the email
        console.log(`Email sent to ${email}:`);
        console.log(`Subject: Welcome to WoW-CSG Stepathon Challenge`);
        console.log(`Body: 
Dear Participant,

Welcome to the WoW-CSG Stepathon Challenge 2025!

Your account has been created successfully.

Username: ${username}
Password: ${password}

Please keep this information secure and login to start tracking your steps.

Note: Each email address and Employee ID can only be registered once.

Best regards,
WoW-CSG Stepathon Team
        `);

        // Store email details for display (in real app, this would be sent via backend)
        const emailData = {
            to: email,
            subject: 'Welcome to WoW-CSG Stepathon Challenge - Your Account Details',
            body: `Dear Participant,

Welcome to the WoW-CSG Stepathon Challenge 2025!

Your account has been created successfully.

Username: ${username}
Password: ${password}

Please keep this information secure and login to start tracking your steps.

Note: Each email address and Employee ID can only be registered once.

Best regards,
WoW-CSG Stepathon Team`,
            sentAt: new Date().toISOString()
        };

        // Store in localStorage for reference (in production, this would be handled by backend)
        const sentEmails = JSON.parse(localStorage.getItem('sentEmails') || '[]');
        sentEmails.push(emailData);
        localStorage.setItem('sentEmails', JSON.stringify(sentEmails));
    }

    handleForgotPassword() {
        const username = prompt('Enter your username to receive password reset instructions:');
        if (!username) return;

        const participant = this.participants.find(p => p.username && p.username.toLowerCase() === username.toLowerCase());
        if (!participant) {
            alert('Username not found!');
            return;
        }

        // In a real app, this would send a password reset email
        alert(`Password reset instructions have been sent to: ${participant.email}\n\n(In a production system, you would receive an email with reset instructions.)`);
    }

    showDashboard() {
        document.getElementById('loginCard').style.display = 'none';
        document.getElementById('dashboardCard').style.display = 'block';
        
        this.updateDashboard();
    }

    updateDashboard() {
        if (!this.currentUser) return;

        document.getElementById('userName').textContent = this.currentUser.name;
        
        const today = new Date().toDateString();
        const todaySteps = this.currentUser.dailySteps[today] || 0;
        const totalSteps = this.currentUser.totalSteps || 0;
        const streak = this.calculateStreak(this.currentUser);

        // Animated number counting
        this.animateNumber('todaySteps', todaySteps);
        this.animateNumber('totalSteps', totalSteps);
        this.animateNumber('streak', streak);

        // Update progress bar with animation
        const goal = 10000;
        const progress = Math.min((todaySteps / goal) * 100, 100);
        this.animateProgressBar(progress);
        const progressBadge = document.getElementById('progressBadge');
        if (progressBadge) {
            this.animateNumber('progressBadge', Math.round(progress), '%');
        }
        document.getElementById('remainingSteps').textContent = Math.max(0, goal - todaySteps).toLocaleString();

        // Update rank
        const rank = this.getUserRank(this.currentUser);
        document.getElementById('rank').textContent = rank > 0 ? `#${rank}` : '-';

        // Update activities
        this.updateActivities();
        
        // Update motivation messages
        this.updateMotivationMessages(todaySteps, progress);
        
        // Update daily motivation quote
        this.updateDailyMotivation();
    }

    updateMotivationMessages(todaySteps, progress) {
        const motivationBadge = document.getElementById('motivationBadge');
        const badgeText = document.getElementById('badgeText');
        
        if (!motivationBadge || !badgeText) return;
        
        // Hide previous badge
        motivationBadge.style.display = 'none';
        
        // Show appropriate motivation based on progress
        let message = '';
        let icon = '🎯';
        
        if (progress >= 100) {
            message = 'Amazing! You crushed your daily goal! 🚀';
            icon = '🏆';
        } else if (progress >= 75) {
            message = 'Almost there! Keep pushing! 💪';
            icon = '🔥';
        } else if (progress >= 50) {
            message = 'Halfway there! You\'re doing great! ⭐';
            icon = '⭐';
        } else if (progress >= 25) {
            message = 'Great start! Every step counts! 👣';
            icon = '👣';
        } else if (todaySteps > 0) {
            message = 'You\'re on the right track! Keep moving! 🚶‍♂️';
            icon = '🚶‍♂️';
        }
        
        if (message) {
            badgeText.textContent = message;
            const badgeIcon = motivationBadge.querySelector('.badge-icon');
            if (badgeIcon) badgeIcon.textContent = icon;
            motivationBadge.style.display = 'flex';
        }
    }

    updateDailyMotivation() {
        const motivations = [
            "The only bad workout is the one that didn't happen!",
            "Your body can do it. It's your mind you need to convince!",
            "Don't stop when you're tired. Stop when you're done!",
            "Take care of your body. It's the only place you have to live!",
            "The pain you feel today will be the strength you feel tomorrow!",
            "Success is the sum of small efforts repeated day in and day out!",
            "You don't have to be great to start, but you have to start to be great!",
            "The only way to do great work is to love what you do!",
            "Your limitation—it's only your imagination!",
            "Push yourself, because no one else is going to do it for you!",
            "Great things never come from comfort zones!",
            "Dream it. Wish it. Do it!",
            "Success doesn't just find you. You have to go out and get it!",
            "The harder you work for something, the greater you'll feel when you achieve it!",
            "Dream bigger. Do bigger!",
            "Don't wait for opportunity. Create it!",
            "Some people want it to happen, some wish it would happen, others make it happen!",
            "Great things never come from comfort zones!",
            "Do something today that your future self will thank you for!",
            "The only way to do great work is to love what you do!"
        ];
        
        const motivationText = document.getElementById('dailyMotivation');
        if (motivationText) {
            // Get a random motivation or cycle through them
            const savedIndex = localStorage.getItem('motivationIndex') || '0';
            let index = parseInt(savedIndex);
            index = (index + 1) % motivations.length;
            localStorage.setItem('motivationIndex', index.toString());
            
            motivationText.textContent = `"${motivations[index]}"`;
        }
    }

    animateNumber(elementId, targetValue, suffix = '') {
        const element = document.getElementById(elementId);
        if (!element) return;

        const currentValue = parseInt(element.textContent.replace(/[^0-9]/g, '')) || 0;
        const duration = 1000; // 1 second
        const startTime = performance.now();
        const difference = targetValue - currentValue;

        const animate = (currentTime) => {
            const elapsed = currentTime - startTime;
            const progress = Math.min(elapsed / duration, 1);
            
            // Easing function (ease-out)
            const easeOut = 1 - Math.pow(1 - progress, 3);
            const current = Math.round(currentValue + (difference * easeOut));
            
            element.textContent = current.toLocaleString() + suffix;
            
            if (progress < 1) {
                requestAnimationFrame(animate);
            } else {
                element.textContent = targetValue.toLocaleString() + suffix;
            }
        };

        requestAnimationFrame(animate);
    }

    animateProgressBar(targetProgress) {
        const progressBar = document.getElementById('progressBar');
        const progressText = document.getElementById('progressText');
        const progressFill = document.getElementById('progressFill');
        
        if (!progressBar) return;

        const currentProgress = parseFloat(progressBar.style.width) || 0;
        const duration = 800;
        const startTime = performance.now();
        const difference = targetProgress - currentProgress;

        const animate = (currentTime) => {
            const elapsed = currentTime - startTime;
            const progress = Math.min(elapsed / duration, 1);
            
            // Easing function (ease-out)
            const easeOut = 1 - Math.pow(1 - progress, 3);
            const current = currentProgress + (difference * easeOut);
            
            progressBar.style.width = current + '%';
            if (progressText) {
                progressText.textContent = Math.round(current) + '%';
            }
            
            if (progress < 1) {
                requestAnimationFrame(animate);
            } else {
                progressBar.style.width = targetProgress + '%';
                if (progressText) {
                    progressText.textContent = Math.round(targetProgress) + '%';
                }
            }
        };

        requestAnimationFrame(animate);
    }

    handleManualScreenshotUpload(file) {
        if (!file) return;

        if (!file.type.startsWith('image/')) {
            alert('Please upload an image file!');
            return;
        }

        const reader = new FileReader();
        reader.onload = (e) => {
            const imagePreview = document.getElementById('manualImagePreview');
            const previewImage = document.getElementById('manualPreviewImage');
            const uploadArea = document.getElementById('manualUploadArea');
            
            previewImage.src = e.target.result;
            imagePreview.style.display = 'block';
            uploadArea.style.display = 'none';
        };
        reader.readAsDataURL(file);
    }

    resetManualScreenshot() {
        document.getElementById('manualScreenshot').value = '';
        document.getElementById('manualImagePreview').style.display = 'none';
        document.getElementById('manualUploadArea').style.display = 'block';
        document.getElementById('manualPreviewImage').src = '';
    }

    async addSteps() {
        if (!this.currentUser) return;

        const steps = parseInt(document.getElementById('stepsInput').value);
        if (isNaN(steps) || steps <= 0) {
            alert('Please enter a valid number of steps!');
            return;
        }

        // Check for screenshot (mandatory for all entries)
        const manualScreenshot = document.getElementById('manualScreenshot');
        let screenshotData = null;
        let file = null;

        // Check if screenshot is from OCR method (tempScreenshotFile) or manual upload
        if (this.tempScreenshotFile) {
            file = this.tempScreenshotFile;
            screenshotData = await this.convertFileToBase64(file);
        } else if (manualScreenshot && manualScreenshot.files.length > 0) {
            file = manualScreenshot.files[0];
            screenshotData = await this.convertFileToBase64(file);
        } else {
            alert('Please upload a screenshot for entry validation!');
            return;
        }

        const today = new Date().toDateString();
        const currentSteps = this.currentUser.dailySteps[today] || 0;
        this.currentUser.dailySteps[today] = currentSteps + steps;
        this.currentUser.totalSteps = (this.currentUser.totalSteps || 0) + steps;
        this.currentUser.lastActivity = new Date().toISOString();

        // Create step entry for admin validation
        const entryId = `ENTRY_${Date.now()}`;
        const stepEntry = {
            id: entryId,
            userId: this.currentUser.id,
            userName: this.currentUser.name,
            userEmail: this.currentUser.email,
            steps: steps,
            screenshot: screenshotData,
            date: new Date().toISOString(),
            status: 'pending', // pending, approved, rejected
            validatedBy: null,
            validatedAt: null,
            notes: null
        };

        this.stepEntries.unshift(stepEntry);
        this.saveStepEntries();

        // Add activity
        this.currentUser.activities.unshift({
            date: new Date().toISOString(),
            steps: steps,
            message: `Added ${steps.toLocaleString()} steps (Pending validation)`,
            entryId: entryId
        });

        // Keep only last 20 activities
        if (this.currentUser.activities.length > 20) {
            this.currentUser.activities = this.currentUser.activities.slice(0, 20);
        }

        // Update streak
        this.currentUser.streak = this.calculateStreak(this.currentUser);

        // Save
        const index = this.participants.findIndex(p => p.name === this.currentUser.name);
        if (index !== -1) {
            this.participants[index] = this.currentUser;
        }

        localStorage.setItem('currentUser', JSON.stringify(this.currentUser));
        localStorage.setItem('participants', JSON.stringify(this.participants));

        document.getElementById('stepsInput').value = '';
        this.resetManualScreenshot();
        
        // Show success animation
        this.showSuccessAnimation(steps);
        
        this.updateDashboard();
        this.updateLeaderboard();
    }

    convertFileToBase64(file) {
        return new Promise((resolve, reject) => {
            const reader = new FileReader();
            reader.onload = () => resolve(reader.result);
            reader.onerror = reject;
            reader.readAsDataURL(file);
        });
    }

    showAdminDashboard() {
        document.getElementById('loginCard').style.display = 'none';
        document.getElementById('dashboardCard').style.display = 'none';
        document.getElementById('adminDashboard').style.display = 'block';
        this.updateAdminDashboard();
    }

    updateAdminDashboard() {
        const pending = this.stepEntries.filter(e => e.status === 'pending').length;
        const approved = this.stepEntries.filter(e => e.status === 'approved').length;
        const rejected = this.stepEntries.filter(e => e.status === 'rejected').length;

        document.getElementById('pendingCount').textContent = pending;
        document.getElementById('approvedCount').textContent = approved;
        document.getElementById('rejectedCount').textContent = rejected;

        this.renderValidationList('pending');
    }

    filterAdminEntries(filter) {
        document.querySelectorAll('.admin-filters .filter-btn').forEach(btn => {
            btn.classList.remove('active');
        });
        document.querySelector(`[data-filter="${filter}"]`).classList.add('active');
        this.renderValidationList(filter);
    }

    renderValidationList(filter = 'pending') {
        const validationList = document.getElementById('validationList');
        let entries = [...this.stepEntries];

        if (filter !== 'all') {
            entries = entries.filter(e => e.status === filter);
        }

        if (entries.length === 0) {
            validationList.innerHTML = '<p class="no-entries">No entries found</p>';
            return;
        }

        validationList.innerHTML = entries.map(entry => {
            const date = new Date(entry.date);
            const statusClass = entry.status === 'approved' ? 'approved' : entry.status === 'rejected' ? 'rejected' : 'pending';
            const statusIcon = entry.status === 'approved' ? '✅' : entry.status === 'rejected' ? '❌' : '⏳';
            
            return `
                <div class="validation-entry ${statusClass}">
                    <div class="entry-header">
                        <div class="entry-info">
                            <h4>${entry.userName} (${entry.userEmail})</h4>
                            <p class="entry-date">${date.toLocaleString()}</p>
                        </div>
                        <div class="entry-status ${statusClass}">
                            ${statusIcon} ${entry.status.toUpperCase()}
                        </div>
                    </div>
                    <div class="entry-details">
                        <div class="entry-steps">
                            <strong>Steps:</strong> ${entry.steps.toLocaleString()}
                        </div>
                        <div class="entry-screenshot">
                            <strong>Screenshot:</strong>
                            <img src="${entry.screenshot}" alt="Step screenshot" class="validation-screenshot" onclick="this.classList.toggle('expanded')" style="cursor: pointer;">
                        </div>
                        ${entry.validatedBy ? `<div class="entry-validator">Validated by: ${entry.validatedBy} on ${new Date(entry.validatedAt).toLocaleString()}</div>` : ''}
                        ${entry.lastModifiedBy ? `<div class="entry-modifier">Last modified by: ${entry.lastModifiedBy} on ${new Date(entry.lastModifiedAt).toLocaleString()}</div>` : ''}
                        ${entry.notes ? `<div class="entry-notes">Notes: ${entry.notes}</div>` : ''}
                    </div>
                    <div class="entry-actions">
                        ${entry.status === 'pending' ? `
                            <button class="btn btn-success" onclick="app.validateEntry('${entry.id}', 'approved')">Approve</button>
                            <button class="btn btn-danger" onclick="app.validateEntry('${entry.id}', 'rejected')">Reject</button>
                        ` : entry.status === 'approved' ? `
                            <button class="btn btn-success" onclick="app.validateEntry('${entry.id}', 'approved')">Re-approve</button>
                            <button class="btn btn-danger" onclick="app.validateEntry('${entry.id}', 'rejected')">Reject</button>
                        ` : entry.status === 'rejected' ? `
                            <button class="btn btn-success" onclick="app.validateEntry('${entry.id}', 'approved')">Approve</button>
                            <button class="btn btn-danger" onclick="app.validateEntry('${entry.id}', 'rejected')">Reject Again</button>
                        ` : ''}
                        <button class="btn btn-edit" onclick="app.editEntrySteps('${entry.id}')">✏️ Edit Steps</button>
                    </div>
                </div>
            `;
        }).join('');
    }

    validateEntry(entryId, status) {
        const entry = this.stepEntries.find(e => e.id === entryId);
        if (!entry) return;

        const notes = prompt(status === 'approved' ? 'Add approval notes (optional):' : 'Add rejection reason (required):');
        
        if (status === 'rejected' && !notes) {
            alert('Please provide a reason for rejection!');
            return;
        }

        const previousStatus = entry.status;
        const currentSteps = entry.steps;

        entry.status = status;
        entry.validatedBy = 'Admin';
        entry.validatedAt = new Date().toISOString();
        entry.notes = notes || null;

        // If approving, update user's steps
        if (status === 'approved') {
            const participant = this.participants.find(p => p.id === entry.userId);
            if (participant) {
                const entryDate = new Date(entry.date).toDateString();
                
                // Handle different previous statuses
                if (previousStatus === 'approved') {
                    // Re-approval after edit (entry was reset to pending)
                    // Steps were already removed in editEntrySteps, so just add current steps
                    participant.dailySteps[entryDate] = (participant.dailySteps[entryDate] || 0) + currentSteps;
                    participant.totalSteps = (participant.totalSteps || 0) + currentSteps;
                } else if (previousStatus === 'rejected') {
                    // Approving a previously rejected entry - add the steps
                    participant.dailySteps[entryDate] = (participant.dailySteps[entryDate] || 0) + currentSteps;
                    participant.totalSteps = (participant.totalSteps || 0) + currentSteps;
                } else {
                    // First time approval (pending) - just add the steps
                    participant.dailySteps[entryDate] = (participant.dailySteps[entryDate] || 0) + currentSteps;
                    participant.totalSteps = (participant.totalSteps || 0) + currentSteps;
                }
                
                // Update activity message
                const activity = participant.activities.find(a => a.entryId === entryId);
                if (activity) {
                    if (previousStatus === 'approved') {
                        activity.message = `Steps re-approved: ${currentSteps.toLocaleString()} steps (Approved)`;
                    } else if (previousStatus === 'rejected') {
                        activity.message = `Steps approved after rejection: ${currentSteps.toLocaleString()} steps (Approved)`;
                    } else {
                        activity.message = `Added ${currentSteps.toLocaleString()} steps (Approved)`;
                    }
                }

                localStorage.setItem('participants', JSON.stringify(this.participants));
            }
        } else if (status === 'rejected') {
            // If rejecting a previously approved entry, subtract the steps
            if (previousStatus === 'approved') {
                const participant = this.participants.find(p => p.id === entry.userId);
                if (participant) {
                    const entryDate = new Date(entry.date).toDateString();
                    participant.dailySteps[entryDate] = Math.max(0, (participant.dailySteps[entryDate] || 0) - currentSteps);
                    participant.totalSteps = Math.max(0, (participant.totalSteps || 0) - currentSteps);
                    
                    // Update activity message
                    const activity = participant.activities.find(a => a.entryId === entryId);
                    if (activity) {
                        activity.message = `Added ${currentSteps.toLocaleString()} steps (Rejected)`;
                    }

                    localStorage.setItem('participants', JSON.stringify(this.participants));
                }
            }
            // If rejecting a previously rejected entry, no change needed (steps were never added)
        }

        this.saveStepEntries();
        this.updateAdminDashboard();
        this.updateLeaderboard();
        
        if (status === 'approved' && previousStatus === 'approved') {
            alert(`Entry re-approved successfully!\n\nSteps: ${currentSteps.toLocaleString()}\n\nLeaderboard has been updated.`);
        } else if (status === 'approved' && previousStatus === 'rejected') {
            alert(`Rejected entry approved successfully!\n\nSteps: ${currentSteps.toLocaleString()}\n\nLeaderboard has been updated.`);
        } else {
            alert(`Entry ${status} successfully!`);
        }
    }

    editEntrySteps(entryId) {
        const entry = this.stepEntries.find(e => e.id === entryId);
        if (!entry) return;

        const currentSteps = entry.steps;
        const newStepsStr = prompt(`Edit step count for this entry:\n\nCurrent steps: ${currentSteps.toLocaleString()}\n\nEnter new step count:`, currentSteps);
        
        if (newStepsStr === null) return; // User cancelled

        const newSteps = parseInt(newStepsStr);
        if (isNaN(newSteps) || newSteps < 0) {
            alert('Please enter a valid number of steps (0 or greater)!');
            return;
        }

        if (newSteps === currentSteps) {
            alert('Step count unchanged.');
            return;
        }

        const previousStatus = entry.status;
        const previousSteps = entry.steps;
        entry.steps = newSteps;
        entry.lastModifiedBy = 'Admin';
        entry.lastModifiedAt = new Date().toISOString();

        // If entry was previously approved, remove the old steps from user totals
        if (previousStatus === 'approved') {
            const participant = this.participants.find(p => p.id === entry.userId);
            if (participant) {
                const entryDate = new Date(entry.date).toDateString();
                
                // Subtract old steps
                participant.dailySteps[entryDate] = Math.max(0, (participant.dailySteps[entryDate] || 0) - previousSteps);
                participant.totalSteps = Math.max(0, (participant.totalSteps || 0) - previousSteps);
                
                // Update activity message
                const activity = participant.activities.find(a => a.entryId === entryId);
                if (activity) {
                    activity.message = `Steps updated: ${previousSteps.toLocaleString()} → ${newSteps.toLocaleString()} (Pending re-approval)`;
                }

                localStorage.setItem('participants', JSON.stringify(this.participants));
            }
            
            // Reset status to pending so admin can re-approve
            entry.status = 'pending';
            entry.validatedBy = null;
            entry.validatedAt = null;
            entry.notes = null;
        }

        this.saveStepEntries();
        this.updateAdminDashboard();
        this.updateLeaderboard();
        
        alert(`Step count updated successfully!\n\nPrevious: ${previousSteps.toLocaleString()}\nNew: ${newSteps.toLocaleString()}\nDifference: ${(newSteps - previousSteps).toLocaleString()}\n\nEntry status reset to PENDING. Please approve the entry to apply the changes to the leaderboard.`);
    }

    showSuccessAnimation(steps) {
        // Create a temporary success message
        const successMsg = document.createElement('div');
        successMsg.style.cssText = `
            position: fixed;
            top: 20px;
            right: 20px;
            background: linear-gradient(135deg, #003366 0%, #001a33 100%);
            color: white;
            padding: 20px 30px;
            border-radius: 12px;
            box-shadow: 0 8px 30px rgba(0, 51, 102, 0.4);
            z-index: 1000;
            animation: slideInRight 0.5s ease-out, fadeOut 0.5s ease-out 2.5s;
            font-weight: 600;
            font-size: 1.1rem;
        `;
        successMsg.textContent = `✅ ${steps.toLocaleString()} steps added!`;
        document.body.appendChild(successMsg);

        // Add CSS animations if not already present
        if (!document.getElementById('successAnimationStyles')) {
            const style = document.createElement('style');
            style.id = 'successAnimationStyles';
            style.textContent = `
                @keyframes slideInRight {
                    from {
                        transform: translateX(400px);
                        opacity: 0;
                    }
                    to {
                        transform: translateX(0);
                        opacity: 1;
                    }
                }
                @keyframes fadeOut {
                    from {
                        opacity: 1;
                        transform: translateX(0);
                    }
                    to {
                        opacity: 0;
                        transform: translateX(400px);
                    }
                }
            `;
            document.head.appendChild(style);
        }

        setTimeout(() => {
            successMsg.remove();
        }, 3000);
    }

    calculateStreak(participant) {
        if (!participant.dailySteps) return 0;
        
        const sortedDates = Object.keys(participant.dailySteps)
            .map(d => new Date(d))
            .sort((a, b) => b - a);

        if (sortedDates.length === 0) return 0;

        let streak = 0;
        const today = new Date();
        today.setHours(0, 0, 0, 0);

        for (let i = 0; i < sortedDates.length; i++) {
            const date = new Date(sortedDates[i]);
            date.setHours(0, 0, 0, 0);
            
            const expectedDate = new Date(today);
            expectedDate.setDate(today.getDate() - i);

            if (date.getTime() === expectedDate.getTime() && 
                participant.dailySteps[sortedDates[i].toString()] >= 10000) {
                streak++;
            } else {
                break;
            }
        }

        return streak;
    }

    getUserRank(user) {
        const sorted = [...this.participants].sort((a, b) => 
            (b.totalSteps || 0) - (a.totalSteps || 0)
        );
        return sorted.findIndex(p => p.name === user.name) + 1;
    }

    updateLeaderboard(filter = 'total') {
        const list = document.getElementById('leaderboardList');
        list.innerHTML = '';

        let sorted = [];

        if (filter === 'total') {
            sorted = [...this.participants].sort((a, b) => 
                (b.totalSteps || 0) - (a.totalSteps || 0)
            );
        } else if (filter === 'today') {
            const today = new Date().toDateString();
            sorted = [...this.participants]
                .map(p => ({
                    ...p,
                    todaySteps: p.dailySteps[today] || 0
                }))
                .sort((a, b) => b.todaySteps - a.todaySteps);
        } else if (filter === 'avg') {
            sorted = [...this.participants]
                .map(p => {
                    const days = Object.keys(p.dailySteps || {}).length || 1;
                    return {
                        ...p,
                        avgSteps: (p.totalSteps || 0) / days
                    };
                })
                .sort((a, b) => b.avgSteps - a.avgSteps);
        }

        if (sorted.length === 0) {
            list.innerHTML = '<div class="leaderboard-item"><div class="rank">-</div><div class="name">No participants yet</div><div class="steps">0 steps</div></div>';
            return;
        }

        sorted.forEach((participant, index) => {
            const item = document.createElement('div');
            item.className = 'leaderboard-item';

            let stepsDisplay = '';
            if (filter === 'total') {
                stepsDisplay = `${(participant.totalSteps || 0).toLocaleString()} steps`;
            } else if (filter === 'today') {
                stepsDisplay = `${(participant.todaySteps || 0).toLocaleString()} steps`;
            } else if (filter === 'avg') {
                stepsDisplay = `${Math.round(participant.avgSteps || 0).toLocaleString()} avg`;
            }

            item.innerHTML = `
                <div class="rank">${index + 1}</div>
                <div class="name">${participant.name} ${participant.department ? `(${participant.department})` : ''}</div>
                <div class="steps">${stepsDisplay}</div>
            `;

            list.appendChild(item);
        });
    }

    updateActivities() {
        const list = document.getElementById('activityList');
        list.innerHTML = '';

        if (!this.currentUser.activities || this.currentUser.activities.length === 0) {
            list.innerHTML = '<p class="no-activity">No activity yet. Start walking! 🚶‍♂️</p>';
            return;
        }

        this.currentUser.activities.slice(0, 10).forEach(activity => {
            const item = document.createElement('div');
            item.className = 'activity-item';
            
            const date = new Date(activity.date);
            const timeStr = date.toLocaleString('en-US', {
                month: 'short',
                day: 'numeric',
                hour: '2-digit',
                minute: '2-digit'
            });

            item.innerHTML = `
                <div>${activity.message}</div>
                <div class="activity-time">${timeStr}</div>
            `;

            list.appendChild(item);
        });
    }

    logout() {
        this.currentUser = null;
        localStorage.removeItem('currentUser');
        document.getElementById('loginCard').style.display = 'block';
        document.getElementById('dashboardCard').style.display = 'none';
        document.getElementById('loginForm').reset();
    }

    loadParticipants() {
        const saved = localStorage.getItem('participants');
        return saved ? JSON.parse(saved) : [];
    }
}

// Initialize the app and make it globally accessible
const app = new StepathonApp();
window.app = app; // Make app accessible globally for onclick handlers

