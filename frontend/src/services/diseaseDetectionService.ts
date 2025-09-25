import * as tf from '@tensorflow/tfjs';
// Types for disease detection
export interface DetectedDisease {
  name: string;
  hindiName: string;
  confidence: number;
  severity: 'mild' | 'moderate' | 'severe';
  affectedArea: number; // percentage of plant affected
  symptoms: string[];
  causes: string[];
  treatments: Treatment[];
  preventions: string[];
  organicTreatments: string[];
  chemicalTreatments: string[];
  estimatedSpread: number; // days to spread if untreated
  economicImpact: {
    yieldLoss: number; // percentage
    treatmentCost: number; // rupees per acre
  };
}

export interface Treatment {
  name: string;
  hindiName: string;
  type: 'organic' | 'chemical' | 'biological';
  dosage: string;
  applicationMethod: string;
  frequency: string;
  cost: number;
  effectiveness: number; // percentage
  safetyPeriod: number; // days before harvest
  instructions: string[];
}

export interface CropHealthAnalysis {
  overallHealth: number; // 0-100 score
  diseases: DetectedDisease[];
  nutritionalDeficiencies: string[];
  environmentalStress: string[];
  recommendations: string[];
  urgentActions: string[];
  monitoringSchedule: string[];
  imageMetadata: {
    quality: 'excellent' | 'good' | 'poor';
    lighting: 'optimal' | 'adequate' | 'poor';
    focus: 'sharp' | 'acceptable' | 'blurry';
    plantPart: 'leaf' | 'stem' | 'fruit' | 'flower' | 'root';
    timestamp: string;
  };
}

export interface HistoricalRecord {
  date: string;
  disease: string;
  severity: string;
  treatment: string;
  outcome: 'resolved' | 'improved' | 'worsened' | 'monitoring';
  images: string[];
  notes: string;
}

// Comprehensive disease database for Indian crops
const diseaseDatabase = {
  // Wheat diseases
  wheat_leaf_rust: {
    name: 'Leaf Rust',
    hindiName: 'पत्ती का रतुआ',
    crop: 'wheat',
    symptoms: ['नारंगी रंग के धब्बे', 'पत्तियों पर पाउडर जैसा पदार्थ', 'पीली पड़ती पत्तियां'],
    causes: ['नमी', 'मध्यम तापमान', 'हवा से फैलता है'],
    organicTreatments: ['नीम का तेल', 'लहसुन का घोल', 'बेकिंग सोडा स्प्रे'],
    chemicalTreatments: ['प्रोपिकोनाज़ोल', 'टेबुकोनाज़ोल'],
    preventions: ['प्रतिरोधी किस्में', 'उचित दूरी', 'फसल चक्रण']
  },
  wheat_powdery_mildew: {
    name: 'Powdery Mildew',
    hindiName: 'चूर्णिल आसिता',
    crop: 'wheat',
    symptoms: ['सफ़ेद पाउडरी धब्बे', 'पत्तियों का मुड़ना', 'वृद्धि में कमी'],
    causes: ['उच्च नमी', 'ठंडा मौसम', 'घने बुआई'],
    organicTreatments: ['दूध का घोल', 'बेकिंग सोडा', 'नीम का तेल'],
    chemicalTreatments: ['सल्फर', 'ट्राईडेमार्फ'],
    preventions: ['हवा का प्रवाह', 'संतुलित उर्वरक', 'जल निकासी']
  },
  
  // Rice diseases
  rice_blast: {
    name: 'Rice Blast',
    hindiName: 'धान का झुलसा रोग',
    crop: 'rice',
    symptoms: ['भूरे धब्बे', 'पत्तियों का सूखना', 'बालियों का झुलसना'],
    causes: ['अधिक नाइट्रोजन', 'नमी', 'घनी रोपाई'],
    organicTreatments: ['ट्राइकोडर्मा', 'नीम केक', 'गोमूत्र'],
    chemicalTreatments: ['कार्बेन्डाजिम', 'प्रोपिकोनाज़ोल'],
    preventions: ['संतुलित NPK', 'उचित दूरी', 'पानी का प्रबंधन']
  },
  rice_brown_spot: {
    name: 'Brown Spot',
    hindiName: 'भूरा धब्बा रोग',
    crop: 'rice',
    symptoms: ['भूरे गोल धब्बे', 'पत्तियों पर छेद', 'अनाज की गुणवत्ता में गिरावट'],
    causes: ['पोटेशियम की कमी', 'सूखा', 'खराब मिट्टी'],
    organicTreatments: ['राख का छिड़काव', 'खाद', 'पौधों का अर्क'],
    chemicalTreatments: ['मैन्कोज़ेब', 'क्लोरोथैलोनिल'],
    preventions: ['उर्वरक संतुलन', 'बीज उपचार', 'फसल अवशेष हटाना']
  },

  // Cotton diseases
  cotton_bollworm: {
    name: 'Bollworm',
    hindiName: 'कपास का कीड़ा',
    crop: 'cotton',
    symptoms: ['फली में छेद', 'कैटरपिलर', 'डैमेज बोल्स'],
    causes: ['गर्म मौसम', 'मादा पतंगे', 'अनुकूल परिस्थितियां'],
    organicTreatments: ['NPV वायरस', 'नीम', 'BT स्प्रे'],
    chemicalTreatments: ['क्लोरपायरीफॉस', 'साइपरमेथ्रिन'],
    preventions: ['फेरोमोन ट्रैप', 'BT कॉटन', 'प्रारंभिक बुआई']
  },

  // Tomato diseases  
  tomato_early_blight: {
    name: 'Early Blight',
    hindiName: 'टमाटर का झुलसा रोग',
    crop: 'tomato',
    symptoms: ['गहरे भूरे धब्बे', 'पत्तियों का पीलापन', 'फल पर धब्बे'],
    causes: ['गर्म मौसम', 'नमी', 'कमजोर पौधे'],
    organicTreatments: ['कॉपर सल्फेट', 'बेकिंग सोडा', 'नीम स्प्रे'],
    chemicalTreatments: ['मैन्कोज़ेब', 'क्लोरोथैलोनिल'],
    preventions: ['ड्रिप सिंचाई', 'मल्चिंग', 'हवा का प्रवाह']
  }
};

class DiseaseDetectionService {
  private model: tf.LayersModel | null = null;
  private isModelLoaded: boolean = false;
  private modelLoadingPromise: Promise<void> | null = null;
  private detectionHistory: HistoricalRecord[] = [];
  
  constructor() {
    this.loadModel();
    this.loadHistoryFromStorage();
  }

  // Load pre-trained model (in production, this would be a real trained model)
  private async loadModel(): Promise<void> {
    if (this.modelLoadingPromise) {
      return this.modelLoadingPromise;
    }

    this.modelLoadingPromise = this.initializeModel();
    return this.modelLoadingPromise;
  }

  private async initializeModel(): Promise<void> {
    try {
      // In a real implementation, load from CDN or local storage
      // For demo purposes, create a simple mock model
      this.model = await this.createMockModel();
      this.isModelLoaded = true;
      console.log('Disease detection model loaded successfully');
    } catch (error) {
      console.error('Failed to load disease detection model:', error);
      this.isModelLoaded = false;
    }
  }

  // Create a mock TensorFlow model for demo purposes
  private async createMockModel(): Promise<tf.LayersModel> {
    const model = tf.sequential({
      layers: [
        tf.layers.conv2d({
          inputShape: [224, 224, 3],
          filters: 32,
          kernelSize: 3,
          activation: 'relu'
        }),
        tf.layers.maxPooling2d({ poolSize: 2 }),
        tf.layers.conv2d({ filters: 64, kernelSize: 3, activation: 'relu' }),
        tf.layers.maxPooling2d({ poolSize: 2 }),
        tf.layers.flatten(),
        tf.layers.dense({ units: 128, activation: 'relu' }),
        tf.layers.dropout({ rate: 0.5 }),
        tf.layers.dense({ units: Object.keys(diseaseDatabase).length, activation: 'softmax' })
      ]
    });

    // Compile with mock weights (in production, use pre-trained weights)
    model.compile({
      optimizer: 'adam',
      loss: 'categoricalCrossentropy',
      metrics: ['accuracy']
    });

    return model;
  }

  // Main disease detection function
  async detectDisease(imageFile: File): Promise<CropHealthAnalysis> {
    try {
      // Ensure model is loaded
      if (!this.isModelLoaded) {
        await this.loadModel();
      }

      // Validate image
      const imageValidation = await this.validateImage(imageFile);
      if (!imageValidation.isValid) {
        throw new Error(`Image validation failed: ${imageValidation.error}`);
      }

      // Process image
      const processedImage = await this.preprocessImage(imageFile);
      
      // Get predictions from model
      const predictions = await this.getPredictions(processedImage);
      
      // Analyze predictions and generate comprehensive result
      const analysis = await this.analyzePredictions(predictions, imageFile);
      
      // Save to history
      this.saveToHistory(analysis);
      
      return analysis;

    } catch (error) {
      console.error('Disease detection failed:', error);
      // Return fallback analysis
      return this.getFallbackAnalysis(imageFile);
    }
  }

  // Validate uploaded image
  private async validateImage(file: File): Promise<{isValid: boolean, error?: string}> {
    // Check file type
    if (!file.type.startsWith('image/')) {
      return { isValid: false, error: 'केवल इमेज फाइलें अपलोड करें' };
    }

    // Check file size (max 10MB)
    if (file.size > 10 * 1024 * 1024) {
      return { isValid: false, error: 'इमेज का साइज 10MB से कम होना चाहिए' };
    }

    // Check image dimensions
    return new Promise((resolve) => {
      const img = new Image();
      img.onload = () => {
        if (img.width < 100 || img.height < 100) {
          resolve({ isValid: false, error: 'इमेज कम से कम 100x100 पिक्सेल की होनी चाहिए' });
        } else {
          resolve({ isValid: true });
        }
      };
      img.onerror = () => {
        resolve({ isValid: false, error: 'इमेज फाइल करप्ट है' });
      };
      img.src = URL.createObjectURL(file);
    });
  }

  // Preprocess image for model input
  private async preprocessImage(file: File): Promise<tf.Tensor> {
    return new Promise((resolve) => {
      const img = new Image();
      img.onload = () => {
        // Create canvas and resize image to 224x224
        const canvas = document.createElement('canvas');
        const ctx = canvas.getContext('2d')!;
        canvas.width = 224;
        canvas.height = 224;
        
        ctx.drawImage(img, 0, 0, 224, 224);
        
        // Convert to tensor
        const tensor = tf.browser.fromPixels(canvas)
          .expandDims(0) // Add batch dimension
          .div(255.0); // Normalize to 0-1
        
        resolve(tensor);
      };
      img.src = URL.createObjectURL(file);
    });
  }

  // Get predictions from the model
  private async getPredictions(imageTensor: tf.Tensor): Promise<number[]> {
    if (!this.model) {
      throw new Error('Model not loaded');
    }

    // Get predictions
    const predictions = this.model.predict(imageTensor) as tf.Tensor;
    const predictionData = await predictions.data();
    
    // Clean up tensors
    imageTensor.dispose();
    predictions.dispose();
    
    return Array.from(predictionData);
  }

  // Analyze predictions and create comprehensive health analysis
  private async analyzePredictions(predictions: number[], imageFile: File): Promise<CropHealthAnalysis> {
    // Get top predictions
    const diseaseKeys = Object.keys(diseaseDatabase);
    const topPredictions = predictions
      .map((prob, index) => ({ 
        diseaseKey: diseaseKeys[index], 
        confidence: prob 
      }))
      .sort((a, b) => b.confidence - a.confidence)
      .slice(0, 3);

    const detectedDiseases: DetectedDisease[] = [];
    
    // Process top predictions
    for (const pred of topPredictions) {
      if (pred.confidence > 0.3) { // Only include if confidence > 30%
        const diseaseData = diseaseDatabase[pred.diseaseKey as keyof typeof diseaseDatabase];
        if (diseaseData) {
          const disease = await this.createDiseaseAnalysis(diseaseData, pred.confidence);
          detectedDiseases.push(disease);
        }
      }
    }

    // If no high-confidence predictions, use rule-based detection
    if (detectedDiseases.length === 0) {
      const ruleBasedDisease = await this.ruleBasedDetection(imageFile);
      if (ruleBasedDisease) {
        detectedDiseases.push(ruleBasedDisease);
      }
    }

    // Calculate overall health score
    const overallHealth = this.calculateHealthScore(detectedDiseases);
    
    // Generate recommendations and actions
    const { recommendations, urgentActions } = this.generateRecommendations(detectedDiseases);
    
    // Analyze image quality
    const imageMetadata = await this.analyzeImageQuality(imageFile);

    return {
      overallHealth,
      diseases: detectedDiseases,
      nutritionalDeficiencies: this.detectNutritionalDeficiencies(detectedDiseases),
      environmentalStress: this.detectEnvironmentalStress(detectedDiseases),
      recommendations,
      urgentActions,
      monitoringSchedule: this.generateMonitoringSchedule(detectedDiseases),
      imageMetadata
    };
  }

  // Create detailed disease analysis
  private async createDiseaseAnalysis(diseaseData: any, confidence: number): Promise<DetectedDisease> {
    const severity = this.determineSeverity(confidence);
    const affectedArea = this.estimateAffectedArea(confidence, severity);
    
    const treatments: Treatment[] = [
      ...this.createTreatments(diseaseData.organicTreatments, 'organic'),
      ...this.createTreatments(diseaseData.chemicalTreatments, 'chemical')
    ];

    return {
      name: diseaseData.name,
      hindiName: diseaseData.hindiName,
      confidence: Math.round(confidence * 100),
      severity,
      affectedArea,
      symptoms: diseaseData.symptoms,
      causes: diseaseData.causes,
      treatments,
      preventions: diseaseData.preventions,
      organicTreatments: diseaseData.organicTreatments,
      chemicalTreatments: diseaseData.chemicalTreatments,
      estimatedSpread: this.estimateSpreadRate(severity),
      economicImpact: {
        yieldLoss: this.estimateYieldLoss(severity, affectedArea),
        treatmentCost: this.estimateTreatmentCost(treatments)
      }
    };
  }

  // Rule-based detection as fallback
  private async ruleBasedDetection(imageFile: File): Promise<DetectedDisease | null> {
    // Simple color-based analysis for demo
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d')!;
    const img = new Image();
    
    return new Promise((resolve) => {
      img.onload = () => {
        canvas.width = img.width;
        canvas.height = img.height;
        ctx.drawImage(img, 0, 0);
        
        // Analyze dominant colors
        const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
        const colorAnalysis = this.analyzeColors(imageData);
        
        // Basic rule-based classification
        if (colorAnalysis.brownSpots > 0.3) {
          resolve(this.createMockDisease('Brown Spot', 'भूरा धब्बा', 0.7));
        } else if (colorAnalysis.yellowAreas > 0.4) {
          resolve(this.createMockDisease('Leaf Yellowing', 'पत्तियों का पीलापन', 0.6));
        } else if (colorAnalysis.darkSpots > 0.2) {
          resolve(this.createMockDisease('Fungal Infection', 'फंगल संक्रमण', 0.65));
        } else {
          resolve(null);
        }
      };
      
      img.src = URL.createObjectURL(imageFile);
    });
  }

  // Analyze color distribution in image
  private analyzeColors(imageData: ImageData): any {
    const pixels = imageData.data;
    let brownSpots = 0, yellowAreas = 0, darkSpots = 0, totalPixels = 0;
    
    for (let i = 0; i < pixels.length; i += 4) {
      const r = pixels[i];
      const g = pixels[i + 1];
      const b = pixels[i + 2];
      
      // Check for brown (disease spots)
      if (r > 100 && r < 160 && g > 60 && g < 120 && b < 80) {
        brownSpots++;
      }
      // Check for yellow (nutrient deficiency)
      else if (r > 200 && g > 180 && b < 100) {
        yellowAreas++;
      }
      // Check for dark spots (severe disease)
      else if (r < 80 && g < 80 && b < 80) {
        darkSpots++;
      }
      
      totalPixels++;
    }
    
    return {
      brownSpots: brownSpots / (totalPixels / 4),
      yellowAreas: yellowAreas / (totalPixels / 4),
      darkSpots: darkSpots / (totalPixels / 4)
    };
  }

  // Helper methods
  private createMockDisease(name: string, hindiName: string, confidence: number): DetectedDisease {
    const severity = this.determineSeverity(confidence);
    return {
      name,
      hindiName,
      confidence: Math.round(confidence * 100),
      severity,
      affectedArea: Math.round(confidence * 40),
      symptoms: ['पत्तियों पर धब्बे', 'रंग में परिवर्तन'],
      causes: ['नमी', 'मौसम', 'संक्रमण'],
      treatments: [],
      preventions: ['स्वच्छता', 'उचित दूरी', 'नियमित निगरानी'],
      organicTreatments: ['नीम स्प्रे', 'जैविक फफूंदनाशक'],
      chemicalTreatments: ['रासायनिक स्प्रे'],
      estimatedSpread: this.estimateSpreadRate(severity),
      economicImpact: {
        yieldLoss: this.estimateYieldLoss(severity, confidence * 40),
        treatmentCost: 1500
      }
    };
  }

  private determineSeverity(confidence: number): 'mild' | 'moderate' | 'severe' {
    if (confidence > 0.8) return 'severe';
    if (confidence > 0.5) return 'moderate';
    return 'mild';
  }

  private estimateAffectedArea(confidence: number, severity: string): number {
    const baseArea = confidence * 50;
    const severityMultiplier = severity === 'severe' ? 1.5 : severity === 'moderate' ? 1.2 : 1.0;
    return Math.min(95, Math.round(baseArea * severityMultiplier));
  }

  private estimateSpreadRate(severity: string): number {
    switch (severity) {
      case 'severe': return 3;
      case 'moderate': return 7;
      case 'mild': return 14;
      default: return 10;
    }
  }

  private estimateYieldLoss(severity: string, affectedArea: number): number {
    const baseYieldLoss = {
      severe: 0.6,
      moderate: 0.3,
      mild: 0.1
    };
    
    return Math.round(baseYieldLoss[severity as keyof typeof baseYieldLoss] * affectedArea);
  }

  private estimateTreatmentCost(treatments: Treatment[]): number {
    if (treatments.length === 0) return 1000;
    return Math.round(treatments.reduce((sum, t) => sum + t.cost, 0) / treatments.length);
  }

  private createTreatments(treatmentNames: string[], type: 'organic' | 'chemical'): Treatment[] {
    return treatmentNames.map(name => ({
      name,
      hindiName: this.getHindiTreatmentName(name),
      type,
      dosage: type === 'organic' ? '10-15 ml/लीटर' : '2-3 ml/लीटर',
      applicationMethod: 'छिड़काव',
      frequency: 'साप्ताहिक',
      cost: type === 'organic' ? 800 : 1200,
      effectiveness: type === 'organic' ? 75 : 90,
      safetyPeriod: type === 'organic' ? 3 : 7,
      instructions: ['शाम के समय छिड़काव करें', 'हवा न हो तो छिड़कें', 'सुरक्षा उपकरण पहनें']
    }));
  }

  private getHindiTreatmentName(englishName: string): string {
    const translations: { [key: string]: string } = {
      'Neem oil': 'नीम का तेल',
      'Baking soda': 'बेकिंग सोडा',
      'Garlic extract': 'लहसुन का अर्क',
      'Trichoderma': 'ट्राइकोडर्मा',
      'Copper sulfate': 'कॉपर सल्फेट',
      'Mancozeb': 'मैन्कोज़ेब',
      'Propiconazole': 'प्रोपिकोनाज़ोल'
    };
    return translations[englishName] || englishName;
  }

  private calculateHealthScore(diseases: DetectedDisease[]): number {
    if (diseases.length === 0) return 95;
    
    let totalImpact = 0;
    diseases.forEach(disease => {
      const severityImpact = disease.severity === 'severe' ? 30 : 
                            disease.severity === 'moderate' ? 15 : 5;
      totalImpact += severityImpact * (disease.affectedArea / 100);
    });
    
    return Math.max(20, Math.round(100 - totalImpact));
  }

  private generateRecommendations(diseases: DetectedDisease[]): {
    recommendations: string[];
    urgentActions: string[];
  } {
    const recommendations: string[] = [];
    const urgentActions: string[] = [];

    if (diseases.length === 0) {
      recommendations.push('आपकी फसल स्वस्थ दिख रही है');
      recommendations.push('नियमित निगरानी करते रहें');
      recommendations.push('पानी का उचित प्रबंधन करें');
    } else {
      diseases.forEach(disease => {
        if (disease.severity === 'severe') {
          urgentActions.push(`${disease.hindiName} के लिए तुरंत उपचार करें`);
          urgentActions.push('कृषि विशेषज्ञ से सलाह लें');
        }
        
        recommendations.push(...disease.preventions);
        
        if (disease.organicTreatments.length > 0) {
          recommendations.push(`जैविक उपचार: ${disease.organicTreatments[0]}`);
        }
      });
    }

    return {
      recommendations: [...new Set(recommendations)],
      urgentActions: [...new Set(urgentActions)]
    };
  }

  private detectNutritionalDeficiencies(diseases: DetectedDisease[]): string[] {
    const deficiencies: string[] = [];
    
    // Simple heuristic based on disease patterns
    const hasYellowing = diseases.some(d => 
      d.symptoms.some(s => s.includes('पीला') || s.includes('yellow'))
    );
    
    if (hasYellowing) {
      deficiencies.push('नाइट्रोजन की कमी');
    }

    return deficiencies;
  }

  private detectEnvironmentalStress(diseases: DetectedDisease[]): string[] {
    const stressFactors: string[] = [];
    
    diseases.forEach(disease => {
      if (disease.causes.includes('नमी')) {
        stressFactors.push('अतिरिक्त नमी');
      }
      if (disease.causes.includes('सूखा')) {
        stressFactors.push('पानी की कमी');
      }
    });

    return [...new Set(stressFactors)];
  }

  private generateMonitoringSchedule(diseases: DetectedDisease[]): string[] {
    const schedule: string[] = [];
    
    if (diseases.some(d => d.severity === 'severe')) {
      schedule.push('प्रतिदिन फसल की जांच करें');
    } else if (diseases.some(d => d.severity === 'moderate')) {
      schedule.push('हर 2-3 दिन में जांच करें');
    } else {
      schedule.push('साप्ताहिक जांच पर्याप्त है');
    }
    
    schedule.push('मौसम बदलने पर विशेष ध्यान दें');
    schedule.push('नए लक्षणों के लिए निगरानी करें');
    
    return schedule;
  }

  private async analyzeImageQuality(file: File): Promise<CropHealthAnalysis['imageMetadata']> {
    // Simple image quality analysis
    return {
      quality: file.size > 500000 ? 'excellent' : file.size > 100000 ? 'good' : 'poor',
      lighting: 'adequate', // Would analyze brightness in real implementation
      focus: 'acceptable',   // Would analyze sharpness in real implementation  
      plantPart: 'leaf',     // Would detect plant part in real implementation
      timestamp: new Date().toISOString()
    };
  }

  private getFallbackAnalysis(imageFile: File): CropHealthAnalysis {
    return {
      overallHealth: 85,
      diseases: [],
      nutritionalDeficiencies: [],
      environmentalStress: [],
      recommendations: [
        'इमेज की गुणवत्ता बेहतर करके फिर से कोशिश करें',
        'अच्छी रोशनी में फोटो लें',
        'पत्तियों को पास से फोटो लें'
      ],
      urgentActions: [],
      monitoringSchedule: ['नियमित निगरानी करते रहें'],
      imageMetadata: {
        quality: 'poor',
        lighting: 'poor',
        focus: 'blurry',
        plantPart: 'leaf',
        timestamp: new Date().toISOString()
      }
    };
  }

  // History management
  private saveToHistory(analysis: CropHealthAnalysis): void {
    const record: HistoricalRecord = {
      date: new Date().toISOString(),
      disease: analysis.diseases.length > 0 ? analysis.diseases[0].hindiName : 'स्वस्थ',
      severity: analysis.diseases.length > 0 ? analysis.diseases[0].severity : 'mild',
      treatment: 'सुझाव दिए गए',
      outcome: 'monitoring',
      images: [], // Would store image URLs in real implementation
      notes: `स्वास्थ्य स्कोर: ${analysis.overallHealth}`
    };
    
    this.detectionHistory.push(record);
    this.saveHistoryToStorage();
  }

  private saveHistoryToStorage(): void {
    try {
      localStorage.setItem('disease_detection_history', JSON.stringify(this.detectionHistory));
    } catch (error) {
      console.error('Error saving detection history:', error);
    }
  }

  private loadHistoryFromStorage(): void {
    try {
      const stored = localStorage.getItem('disease_detection_history');
      if (stored) {
        this.detectionHistory = JSON.parse(stored);
      }
    } catch (error) {
      console.error('Error loading detection history:', error);
      this.detectionHistory = [];
    }
  }

  // Public methods for accessing history
  getDetectionHistory(): HistoricalRecord[] {
    return this.detectionHistory;
  }

  clearHistory(): void {
    this.detectionHistory = [];
    localStorage.removeItem('disease_detection_history');
  }

  // Batch processing for multiple images
  async detectDiseasesInBatch(imageFiles: File[]): Promise<CropHealthAnalysis[]> {
    const results: CropHealthAnalysis[] = [];
    
    for (const file of imageFiles) {
      try {
        const analysis = await this.detectDisease(file);
        results.push(analysis);
      } catch (error) {
        console.error(`Error processing ${file.name}:`, error);
        results.push(this.getFallbackAnalysis(file));
      }
    }
    
    return results;
  }

  // Model management
  getModelStatus(): { loaded: boolean; version: string; accuracy: number } {
    return {
      loaded: this.isModelLoaded,
      version: '1.0.0',
      accuracy: 0.89 // Mock accuracy
    };
  }

  async updateModel(): Promise<boolean> {
    try {
      console.log('Checking for model updates...');
      // In real implementation, check for newer model versions
      return true;
    } catch (error) {
      console.error('Model update failed:', error);
      return false;
    }
  }
}

export const diseaseDetectionService = new DiseaseDetectionService();
export default diseaseDetectionService;