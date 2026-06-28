import express from 'express';
import cors from 'cors';
import multer from 'multer';
import { Jimp } from 'jimp';
import Tesseract from 'tesseract.js';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const upload = multer({ storage: multer.memoryStorage() });

app.use(cors());
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ limit: '50mb' }));

// 圖像處理類
class FloorPlanProcessor {
    constructor(imageBuffer, options = {}) {
        this.imageBuffer = imageBuffer;
        this.scale = parseFloat(options.scale) || 1;
        this.wallThickness = parseFloat(options.wallThickness) || 15;
        this.doorWidth = parseFloat(options.doorWidth) || 90;
        this.ocrLanguage = options.ocrLanguage || 'chi_tra';
        this.edgeThreshold = parseInt(options.edgeThreshold) || 50;
        this.minLineLength = parseInt(options.minLineLength) || 20;
        this.shouldDetectDoors = options.detectDoors !== 'false';
        this.shouldDetectWalls = options.detectWalls !== 'false';
        this.unit = options.unit || 'cm';

        this.dimensions = [];
        this.walls = [];
        this.doors = [];
        this.windows = [];
        this.texts = [];
    }

    // 使用Jimp載入圖像
    async loadImage() {
        try {
            const image = await Jimp.read(this.imageBuffer);
            return image;
        } catch (error) {
            console.error('圖像載入錯誤:', error);
            throw error;
        }
    }

    // OCR識別尺寸標註
    async recognizeDimensions(image) {
        try {
            console.log('開始OCR識別...');

            // 將Jimp圖像轉換為PNG buffer
            const pngBuffer = await image.png.getBuffer('image/png');
            const base64 = pngBuffer.toString('base64');
            const imageData = 'data:image/png;base64,' + base64;

            const { data: { text } } = await Tesseract.recognize(
                imageData,
                this.ocrLanguage,
                { logger: m => console.log('OCR進度:', m.status, m.progress) }
            );

            console.log('識別的文字:', text.substring(0, 200));

            // 提取數字和單位
            const dimensionPattern = /[\d.]+(?:\s*[cm|mmm]*)?/g;
            const matches = text.match(dimensionPattern) || [];
            const uniqueDims = new Set();

            matches.forEach(match => {
                const cleanMatch = match.trim();
                const numValue = parseFloat(cleanMatch);
                if (cleanMatch && !isNaN(numValue) && numValue > 0) {
                    uniqueDims.add(cleanMatch);
                }
            });

            uniqueDims.forEach(dim => {
                this.dimensions.push({
                    value: dim,
                    position: { x: 0, y: 0 }
                });
            });

            console.log('識別到的尺寸:', this.dimensions.length);
            return this.dimensions;
        } catch (error) {
            console.error('OCR識別錯誤:', error);
            return [];
        }
    }

    // 檢測黑色線條（牆面）
    detectWallLines(image) {
        if (!this.shouldDetectWalls) return [];

        const lines = [];
        const width = image.bitmap.width;
        const height = image.bitmap.height;
        const data = image.bitmap.data;

        // 檢測黑色或深灰色像素（牆面）
        const blackPixels = new Set();
        for (let i = 0; i < data.length; i += 4) {
            const r = data[i];
            const g = data[i + 1];
            const b = data[i + 2];
            const a = data[i + 3];

            // 檢測黑色像素
            if (a > 200 && r < 80 && g < 80 && b < 80) {
                blackPixels.add(i / 4);
            }
        }

        console.log('檢測到的黑色像素:', blackPixels.size);

        // 簡單的線條檢測
        const processedPixels = new Set();
        blackPixels.forEach(pixelIdx => {
            if (processedPixels.has(pixelIdx)) return;

            const y = Math.floor(pixelIdx / width);
            const x = pixelIdx % width;

            // 追蹤連続的像素
            let endX = x;
            let endY = y;

            // 向右追蹤（水平線）
            while (endX < width - 1 && blackPixels.has((endY * width + endX + 1))) {
                endX++;
            }

            // 向下追蹤（垂直線）
            while (endY < height - 1 && blackPixels.has(((endY + 1) * width + endX))) {
                endY++;
            }

            const length = Math.max(Math.abs(endX - x), Math.abs(endY - y));
            if (length > this.minLineLength) {
                lines.push({
                    type: 'line',
                    start: { x, y },
                    end: { x: endX, y: endY },
                    length
                });

                // 標記已處理的像素
                for (let i = x; i <= endX; i++) {
                    for (let j = y; j <= endY; j++) {
                        processedPixels.add(j * width + i);
                    }
                }
            }
        });

        return lines;
    }

    // 檢測門窗圓圈
    detectDoors(image) {
        if (!this.shouldDetectDoors) return [];

        const doors = [];
        const width = image.bitmap.width;
        const height = image.bitmap.height;
        const data = image.bitmap.data;

        // 檢測綠色圓圈（用於門窗標記）
        const greenPixels = [];
        for (let i = 0; i < data.length; i += 4) {
            const r = data[i];
            const g = data[i + 1];
            const b = data[i + 2];
            const a = data[i + 3];

            // 綠色像素檢測
            if (a > 200 && g > 150 && r < 100 && b < 100) {
                const pixelIndex = i / 4;
                greenPixels.push({
                    x: pixelIndex % width,
                    y: Math.floor(pixelIndex / width)
                });
            }
        }

        // 聚類綠色像素以識別圓圈
        const clusters = [];
        const visited = new Set();

        greenPixels.forEach((pixel, idx) => {
            if (visited.has(idx)) return;

            const cluster = [pixel];
            visited.add(idx);

            // 簡單的聚類算法
            greenPixels.forEach((otherPixel, otherIdx) => {
                if (!visited.has(otherIdx)) {
                    const dist = Math.sqrt(
                        Math.pow(pixel.x - otherPixel.x, 2) +
                        Math.pow(pixel.y - otherPixel.y, 2)
                    );
                    if (dist < 30) {
                        cluster.push(otherPixel);
                        visited.add(otherIdx);
                    }
                }
            });

            if (cluster.length > 5) {
                clusters.push(cluster);
            }
        });

        // 計算每個聚類的中心
        clusters.forEach(cluster => {
            const avgX = cluster.reduce((sum, p) => sum + p.x, 0) / cluster.length;
            const avgY = cluster.reduce((sum, p) => sum + p.y, 0) / cluster.length;
            doors.push({
                position: { x: Math.round(avgX), y: Math.round(avgY) },
                type: 'door',
                width: this.doorWidth,
                pixelCount: cluster.length
            });
        });

        return doors;
    }

    // 提取文字（按顏色分類）
    extractColoredTexts(image) {
        const texts = [];
        const width = image.bitmap.width;
        const height = image.bitmap.height;
        const data = image.bitmap.data;

        // 檢測紅色像素（天花板高度）
        const redTexts = [];
        for (let i = 0; i < data.length; i += 4) {
            const r = data[i];
            const g = data[i + 1];
            const b = data[i + 2];
            const a = data[i + 3];

            // 紅色檢測
            if (a > 200 && r > 150 && g < 100 && b < 100) {
                redTexts.push({
                    color: 'red',
                    meaning: '天花板或樑高度',
                    position: { x: (i / 4) % width, y: Math.floor((i / 4) / width) }
                });
            }
        }

        // 檢測綠色像素（水電冷氣）
        const greenTexts = [];
        for (let i = 0; i < data.length; i += 4) {
            const r = data[i];
            const g = data[i + 1];
            const b = data[i + 2];
            const a = data[i + 3];

            // 綠色檢測
            if (a > 200 && g > 150 && r < 100 && b < 100) {
                greenTexts.push({
                    color: 'green',
                    meaning: '水電冷氣套管',
                    position: { x: (i / 4) % width, y: Math.floor((i / 4) / width) }
                });
            }
        }

        return texts;
    }

    // 主處理方法
    async process() {
        try {
            const image = await this.loadImage();

            // 執行各種檢測
            console.log('開始處理圖像...');
            await this.recognizeDimensions(image);
            this.walls = this.detectWallLines(image);
            this.doors = this.detectDoors(image);
            this.texts = this.extractColoredTexts(image);

            console.log('處理完成');
            return {
                success: true,
                dimensions: this.dimensions,
                walls: this.walls,
                doors: this.doors,
                windows: this.windows,
                texts: this.texts,
                unit: this.unit,
                scale: this.scale,
                message: `識別成功: ${this.dimensions.length} 個尺寸, ${this.walls.length} 面牆, ${this.doors.length} 個門窗`
            };
        } catch (error) {
            console.error('處理錯誤:', error);
            return {
                success: false,
                error: error.message
            };
        }
    }
}

// DXF生成器
class DXFGenerator {
    constructor(data, unit = 'cm') {
        this.data = data;
        this.unit = unit;
        this.entities = [];
        this.layers = [];
    }

    // 簡單的DXF格式生成
    generate() {
        try {
            let dxfContent = this.generateHeader();
            dxfContent += this.generateTables();
            dxfContent += this.generateBlocks();
            dxfContent += this.generateEntities();
            dxfContent += this.generateFooter();

            return dxfContent;
        } catch (error) {
            console.error('DXF生成錯誤:', error);
            return null;
        }
    }

    generateHeader() {
        return `  0
SECTION
  2
HEADER
  9
$ACADVER
  1
AC1021
  0
ENDSEC
`;
    }

    generateTables() {
        return `  0
SECTION
  2
TABLES
  0
TABLE
  2
LAYER
 70
3
  0
LAYER
  2
WALL
 70
0
 62
7
  6
CONTINUOUS
  0
LAYER
  2
DOOR
 70
0
 62
3
  6
CONTINUOUS
  0
LAYER
  2
DIMENSIONS
 70
0
 62
5
  6
CONTINUOUS
  0
ENDTAB
  0
ENDSEC
`;
    }

    generateBlocks() {
        return `  0
SECTION
  2
BLOCKS
  0
ENDSEC
`;
    }

    generateEntities() {
        let entities = `  0
SECTION
  2
ENTITIES
`;

        // 繪製牆面
        if (this.data.walls && this.data.walls.length > 0) {
            this.data.walls.forEach((wall, idx) => {
                const x1 = wall.start.x * this.data.scale;
                const y1 = wall.start.y * this.data.scale;
                const x2 = wall.end.x * this.data.scale;
                const y2 = wall.end.y * this.data.scale;

                entities += `  0
LINE
  8
WALL
 10
${x1}
 20
${y1}
 30
0
 11
${x2}
 21
${y2}
 31
0
`;
            });
        }

        // 繪製門窗
        if (this.data.doors && this.data.doors.length > 0) {
            this.data.doors.forEach((door, idx) => {
                const x = door.position.x * this.data.scale;
                const y = door.position.y * this.data.scale;
                const r = (door.width / 2) * this.data.scale;

                entities += `  0
CIRCLE
  8
DOOR
 10
${x}
 20
${y}
 30
0
 40
${r}
`;
            });
        }

        // 添加尺寸標註
        if (this.data.dimensions && this.data.dimensions.length > 0) {
            this.data.dimensions.forEach((dim, idx) => {
                const value = parseFloat(dim.value);
                const x = (dim.position?.x || 50 + idx * 20) * this.data.scale;
                const y = (dim.position?.y || 50) * this.data.scale;

                entities += `  0
TEXT
  8
DIMENSIONS
 10
${x}
 20
${y}
 30
0
 40
2.5
  1
${value} ${this.unit}
`;
            });
        }

        entities += `  0
ENDSEC
`;
        return entities;
    }

    generateFooter() {
        return `  0
EOF
`;
    }
}

// API端點：處理圖像
app.post('/api/process', upload.single('image'), async (req, res) => {
    try {
        if (!req.file) {
            return res.json({ success: false, error: '未收到圖像' });
        }

        console.log('收到圖像，大小:', req.file.size, 'bytes');

        const processor = new FloorPlanProcessor(req.file.buffer, {
            scale: req.body.scale,
            wallThickness: req.body.wallThickness,
            doorWidth: req.body.doorWidth,
            ocrLanguage: req.body.ocrLanguage,
            edgeThreshold: req.body.edgeThreshold,
            minLineLength: req.body.minLineLength,
            detectDoors: req.body.detectDoors,
            detectWalls: req.body.detectWalls,
            unit: req.body.unit || 'cm'
        });

        const result = await processor.process();
        res.json(result);
    } catch (error) {
        console.error('API錯誤:', error);
        res.json({ success: false, error: error.message });
    }
});

// API端點：生成DXF
app.post('/api/generate-dxf', express.json({ limit: '50mb' }), (req, res) => {
    try {
        const { data, unit } = req.body;

        if (!data) {
            return res.json({ success: false, error: '無效的數據' });
        }

        console.log('生成DXF...');
        const generator = new DXFGenerator(data, unit || 'cm');
        const dxfContent = generator.generate();

        if (dxfContent) {
            res.setHeader('Content-Type', 'application/dxf');
            res.setHeader('Content-Disposition', 'attachment; filename="floorplan.dxf"');
            res.send(dxfContent);
        } else {
            res.json({ success: false, error: 'DXF生成失敗' });
        }
    } catch (error) {
        console.error('DXF生成API錯誤:', error);
        res.json({ success: false, error: error.message });
    }
});

// 健康檢查端點
app.get('/api/health', (req, res) => {
    res.json({ status: 'ok', service: 'FloorPlan Converter' });
});

// 主頁面
app.get('/converter', (req, res) => {
    res.sendFile(path.join(__dirname, '..', 'floorplan-converter.html'));
});

app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, '..', 'floorplan-converter.html'));
});

// 啟動伺服器
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log(`🏠 樓層平面轉換工具已啟動: http://localhost:${PORT}`);
    console.log(`📍 訪問地址: http://localhost:${PORT}`);
});

export default app;
