import React, { useState, useEffect, useRef } from 'react';
import { RefreshCw, Code, Copy, Check, Sliders, Image as ImageIcon, Type, Sparkles, HelpCircle } from 'lucide-react';
import { ObjectItem } from '../types';

interface ImageWorkshopProps {
  currentBucketName: string;
  selectedFile: ObjectItem;
  onClose: () => void;
}

export default function ImageWorkshop({
  currentBucketName,
  selectedFile,
  onClose,
}: ImageWorkshopProps) {
  // 1. Storage class & General options
  const [copied, setCopied] = useState(false);
  const [activeSubTab, setActiveSubTab] = useState<'adjust' | 'code'>('adjust');

  // 2. Process Parameters
  // --- Resize ---
  const [resizeEnabled, setResizeEnabled] = useState(true);
  const [width, setWidth] = useState<number>(300);
  const [height, setHeight] = useState<number>(200);
  const [resizeMode, setResizeMode] = useState<'lfit' | 'mfit' | 'fill' | 'pad' | 'fixed'>('fixed');
  const [padColor, setPadColor] = useState<string>('FFFFFF');

  // --- Rotate ---
  const [rotateEnabled, setRotateEnabled] = useState(false);
  const [angle, setAngle] = useState<number>(90);

  // --- Crop ---
  const [cropEnabled, setCropEnabled] = useState(false);
  const [cropW, setCropW] = useState<number>(200);
  const [cropH, setCropH] = useState<number>(150);
  const [cropX, setCropX] = useState<number>(0);
  const [cropY, setCropY] = useState<number>(0);
  const [cropGravity, setCropGravity] = useState<'nw' | 'north' | 'ne' | 'west' | 'center' | 'east' | 'sw' | 'south' | 'se'>('nw');

  // --- Watermark ---
  const [watermarkEnabled, setWatermarkEnabled] = useState(false);
  const [watermarkText, setWatermarkText] = useState<string>('Chinatelecom');
  const [watermarkColor, setWatermarkColor] = useState<string>('FF0000');
  const [watermarkSize, setWatermarkSize] = useState<number>(40);
  const [watermarkOpacity, setWatermarkOpacity] = useState<number>(80);
  const [watermarkFont, setWatermarkFont] = useState<'yahei' | 'heiti' | 'kaishu' | 'youyuan'>('kaishu');
  const [watermarkGravity, setWatermarkGravity] = useState<'nw' | 'north' | 'ne' | 'west' | 'center' | 'east' | 'sw' | 'south' | 'se'>('se');

  // --- Format Converter ---
  const [formatEnabled, setFormatEnabled] = useState(false);
  const [targetFormat, setTargetFormat] = useState<'jpg' | 'png' | 'webp' | 'tiff'>('png');

  // 3. Render Canvas simulation
  const mainCanvasRef = useRef<HTMLCanvasElement | null>(null);

  // Trigger Base64 calculation
  const getBase64Text = (str: string) => {
    try {
      // Basic Base64 safely replacing '/' with '_' for ZOS compatibility
      const b64 = btoa(unescape(encodeURIComponent(str)));
      return b64.replace(/\//g, '_');
    } catch (e) {
      return 'Q2hpbmF0ZWxlY29t';
    }
  };

  // Construct ZOS API process query string
  const zosQueryString = () => {
    const segments: string[] = [];

    if (resizeEnabled) {
      const modeSeg = resizeMode !== 'lfit' ? `,m_${resizeMode}` : '';
      const colorSeg = resizeMode === 'pad' ? `,color_${padColor}` : '';
      segments.push(`image/resize,w_${width},h_${height}${modeSeg}${colorSeg}`);
    }

    if (rotateEnabled) {
      segments.push(`image/rotate,${angle}`);
    }

    if (cropEnabled) {
      segments.push(`image/crop,w_${cropW},h_${cropH},x_${cropX},y_${cropY},g_${cropGravity}`);
    }

    if (watermarkEnabled) {
      const b64Val = getBase64Text(watermarkText);
      const fontMap = { yahei: 'yahei', heiti: 'heiti', kaishu: 'kaishu', youyuan: 'youyuan' };
      segments.push(
        `image/watermark,text_${b64Val},color_${watermarkColor},size_${watermarkSize},t_${watermarkOpacity},type_${fontMap[watermarkFont]},g_${watermarkGravity}`
      );
    }

    if (formatEnabled) {
      segments.push(`image/format,${targetFormat}`);
    }

    if (segments.length === 0) return '';
    return `?x-zos-process=${segments.join('/')}`;
  };

  const getRESTUrl = () => {
    return `https://${currentBucketName}.zos.shanghai36.ctyun.cn/${selectedFile.key}${zosQueryString()}`;
  };

  const getJavaCode = () => {
    const imageOpString = zosQueryString().replace('?x-zos-process=', '');
    return `import com.amazonaws.services.s3.AmazonS3;
import com.amazonaws.services.s3.AmazonS3ClientBuilder;
import com.amazonaws.services.s3.model.GetObjectRequest;
import com.amazonaws.services.s3.model.S3Object;
import java.io.FileOutputStream;
import java.io.InputStream;

public class ZosImagePipeline {
    public static void main(String[] args) {
        String ACCESS_KEY = "y8UbdXnvDxa8L...";
        String SECRET_KEY = "xxxxxxxxxxxxxxxxxxxxxxxxxxxx";
        String END_POINT  = "https://shanghai36.zos.ctyun.cn";
        String BUCKET_NAME = "${currentBucketName}";
        String OBJ_KEY = "${selectedFile.key}";

        // Initialize S3 SDK compatible client
        AmazonS3 s3Client = AmazonS3ClientBuilder.standard()
                .withEndpointConfiguration(new AwsClientBuilder.EndpointConfiguration(END_POINT, "cn-east-1"))
                .build();

        GetObjectRequest request = new GetObjectRequest(BUCKET_NAME, OBJ_KEY);
        
        // Match user's customized image pipeline options (Snapshots Section 5)
        String imageop = "${imageOpString || 'image/info'}";
        request.setZosProcess(imageop);

        try {
            S3Object result = s3Client.getObject(request);
            InputStream in = result.getObjectContent();
            FileOutputStream out = new FileOutputStream("./processed_image.${formatEnabled ? targetFormat : 'png'}");
            byte[] buffer = new byte[4096];
            int length;
            while ((length = in.read(buffer)) > 0) {
                out.write(buffer, 0, length);
            }
            in.close();
            out.close();
            System.out.println("ZOS image workflow completed successfully!");
        } catch (Exception e) {
            e.printStackTrace();
        }
    }
}`;
  };

  const handleCopyCode = () => {
    navigator.clipboard.writeText(getJavaCode());
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleCopyUrl = () => {
    navigator.clipboard.writeText(getRESTUrl());
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  // Canvas Drawing simulating physical effects of ZOS pipeline
  useEffect(() => {
    const canvas = mainCanvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Reset dimensions
    canvas.width = 600;
    canvas.height = 400;

    // Clear Workspace
    ctx.fillStyle = '#1e293b'; // dark blue background
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // Apply Background/Grid Pattern
    ctx.strokeStyle = '#334155';
    ctx.lineWidth = 0.5;
    for (let i = 0; i < canvas.width; i += 25) {
      ctx.beginPath();
      ctx.moveTo(i, 0);
      ctx.lineTo(i, canvas.height);
      ctx.stroke();
    }
    for (let j = 0; j < canvas.height; j += 25) {
      ctx.beginPath();
      ctx.moveTo(0, j);
      ctx.lineTo(canvas.width, j);
      ctx.stroke();
    }

    ctx.save();

    // 1. Draw Simulated Image (Sunrise Sunset scene inside idealcloud container)
    let imgW = 280;
    let imgH = 200;
    let imgX = (canvas.width - imgW) / 2;
    let imgY = (canvas.height - imgH) / 2;

    // Standard resize operations
    if (resizeEnabled) {
      // Map limits
      const scaledW = Math.max(80, Math.min(width, 360));
      const scaledH = Math.max(60, Math.min(height, 260));

      if (resizeMode === 'fixed') {
        imgW = scaledW;
        imgH = scaledH;
      } else if (resizeMode === 'pad') {
        // Pads with mock background color
        ctx.fillStyle = `#${padColor}`;
        ctx.fillRect(imgX - 10, imgY - 10, imgW + 20, imgH + 20);
        ctx.strokeStyle = '#f97316';
        ctx.lineWidth = 1.5;
        ctx.strokeRect(imgX - 10, imgY - 10, imgW + 20, imgH + 20);
        imgW = scaledW * 0.9;
        imgH = scaledH * 0.9;
      } else {
        // fit styles
        imgW = scaledW;
        imgH = scaledH;
      }
      imgX = (canvas.width - imgW) / 2;
      imgY = (canvas.height - imgH) / 2;
    }

    // Apply Center and Rotation Transformation if active
    ctx.translate(canvas.width / 2, canvas.height / 2);
    if (rotateEnabled) {
      ctx.rotate((angle * Math.PI) / 180);
    }
    ctx.translate(-canvas.width / 2, -canvas.height / 2);

    // Draw high quality mock sunset gradient
    const gradient = ctx.createLinearGradient(imgX, imgY, imgX, imgY + imgH);
    gradient.addColorStop(0, '#f43f5e'); // warm red
    gradient.addColorStop(0.5, '#f97316'); // sun orange
    gradient.addColorStop(1, '#eab308'); // yellow glow
    ctx.fillStyle = gradient;
    ctx.fillRect(imgX, imgY, imgW, imgH);

    // Draw the "Ideal Sun" circle in the sky
    ctx.fillStyle = '#ffffff';
    ctx.beginPath();
    ctx.arc(imgX + imgW / 2, imgY + imgH / 2, Math.min(imgW, imgH) * 0.25, 0, Math.PI * 2);
    ctx.fill();

    // Draw ocean wave layers
    ctx.fillStyle = 'rgba(14, 116, 144, 0.45)'; // cyan water
    ctx.fillRect(imgX, imgY + imgH * 0.65, imgW, imgH * 0.35);
    ctx.fillStyle = 'rgba(3, 105, 161, 0.6)'; // dark blue water
    ctx.fillRect(imgX, imgY + imgH * 0.8, imgW, imgH * 0.2);

    // Format marker
    ctx.fillStyle = 'rgba(15, 23, 42, 0.7)';
    ctx.fillRect(imgX + 8, imgY + 8, 70, 18);
    ctx.fillStyle = '#38bdf8';
    ctx.font = '9px monospace';
    ctx.textAlign = 'center';
    ctx.fillText(`FORMAT: ${formatEnabled ? targetFormat.toUpperCase() : 'RAW'}`, imgX + 43, imgY + 20);

    // Crop Outline simulation
    if (cropEnabled) {
      ctx.strokeStyle = '#ef4444';
      ctx.lineWidth = 2.5;
      ctx.setLineDash([4, 4]);

      // Crop coordinates offset
      const cx = imgX + (imgW - cropW) / 2 + cropX;
      const cy = imgY + (imgH - cropH) / 2 + cropY;
      ctx.strokeRect(cx, cy, Math.min(cropW, imgW), Math.min(cropH, imgH));
      ctx.setLineDash([]);

      // Draw dark overlay around crop box
      ctx.fillStyle = 'rgba(15, 23, 42, 0.5)';
      // left
      ctx.fillRect(imgX, imgY, cx - imgX, imgH);
      // right
      ctx.fillRect(cx + Math.min(cropW, imgW), imgY, imgX + imgW - (cx + Math.min(cropW, imgW)), imgH);
    }

    // Apply Watermark
    if (watermarkEnabled && watermarkText) {
      ctx.save();
      ctx.fillStyle = `#${watermarkColor}`;
      ctx.globalAlpha = watermarkOpacity / 100;
      
      let fName = 'sans-serif';
      if (watermarkFont === 'kaishu') fName = 'serif';
      else if (watermarkFont === 'heiti') fName = 'monospace';
      
      ctx.font = `${watermarkSize * 0.4}px ${fName}`;
      ctx.textAlign = 'left';

      // Gravity Calculation inside image coordinates
      let textX = imgX + 10;
      let textY = imgY + 20;
      const tMetrics = ctx.measureText(watermarkText);
      const textWidth = tMetrics.width;
      const textHeight = watermarkSize * 0.35;

      switch (watermarkGravity) {
        case 'nw':
          textX = imgX + 10;
          textY = imgY + textHeight + 10;
          break;
        case 'north':
          textX = imgX + (imgW - textWidth) / 2;
          textY = imgY + textHeight + 10;
          break;
        case 'ne':
          textX = imgX + imgW - textWidth - 10;
          textY = imgY + textHeight + 10;
          break;
        case 'west':
          textX = imgX + 10;
          textY = imgY + imgH / 2 + textHeight / 2;
          break;
        case 'center':
          textX = imgX + (imgW - textWidth) / 2;
          textY = imgY + imgH / 2 + textHeight / 2;
          break;
        case 'east':
          textX = imgX + imgW - textWidth - 10;
          textY = imgY + imgH / 2 + textHeight / 2;
          break;
        case 'sw':
          textX = imgX + 10;
          textY = imgY + imgH - 12;
          break;
        case 'south':
          textX = imgX + (imgW - textWidth) / 2;
          textY = imgY + imgH - 12;
          break;
        case 'se':
          textX = imgX + imgW - textWidth - 10;
          textY = imgY + imgH - 12;
          break;
      }

      ctx.fillText(watermarkText, textX, textY);
      ctx.restore();
    }

    ctx.restore();
  }, [
    resizeEnabled,
    width,
    height,
    resizeMode,
    padColor,
    rotateEnabled,
    angle,
    cropEnabled,
    cropW,
    cropH,
    cropX,
    cropY,
    cropGravity,
    watermarkEnabled,
    watermarkText,
    watermarkColor,
    watermarkSize,
    watermarkOpacity,
    watermarkFont,
    watermarkGravity,
    formatEnabled,
    targetFormat,
  ]);

  return (
    <div className="bg-slate-950 rounded-xl p-5 border border-slate-800 text-slate-200 mt-4" id="ideal-zos-workshop">
      <div className="flex items-center justify-between border-b border-slate-800 pb-3 mb-4">
        <div className="flex items-center space-x-2.5">
          <Sparkles className="h-5 w-5 text-orange-400" />
          <div>
            <h3 className="text-sm font-semibold text-white flex items-center space-x-2">
              <span>ZOS 智能图片处理沙箱</span>
              <span className="text-[10px] uppercase font-mono px-1.5 py-0.5 rounded bg-orange-500/20 text-orange-400 font-bold border border-orange-500/30">
                Live REST Pipeline
              </span>
            </h3>
            <p className="text-[11px] text-slate-400">正在对 {selectedFile.name} 设备中的图片文件进行流式处理...</p>
          </div>
        </div>
        <button
          onClick={onClose}
          className="text-xs bg-slate-800 hover:bg-slate-700 px-2.5 py-1 text-slate-300 rounded cursor-pointer"
        >
          返回文件列表
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
        {/* Left Side: Parameters sliders */}
        <div className="lg:col-span-5 space-y-4 max-h-[550px] overflow-y-auto pr-2 scrollbar-thin">
          {/* Resize Tool */}
          <div className="bg-slate-900/60 p-3 rounded-lg border border-slate-800 space-y-3">
            <div className="flex items-center justify-between">
              <label className="flex items-center space-x-2 font-medium text-xs text-white">
                <input
                  type="checkbox"
                  checked={resizeEnabled}
                  onChange={(e) => setResizeEnabled(e.target.checked)}
                  className="rounded border-slate-700 bg-slate-800 text-orange-500 focus:ring-0"
                />
                <span className="font-sans">1. 尺寸缩放 (Resize)</span>
              </label>
              <Sliders className="h-3.5 w-3.5 text-slate-500" />
            </div>

            {resizeEnabled && (
              <div className="space-y-2.5 pl-5 pt-1 text-[11px]">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <span className="text-slate-400 block mb-1">目标宽度 w: {width}px</span>
                    <input
                      type="range"
                      min="40"
                      max="600"
                      value={width}
                      onChange={(e) => setWidth(parseInt(e.target.value))}
                      className="w-full h-1 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-orange-500"
                    />
                  </div>
                  <div>
                    <span className="text-slate-400 block mb-1">目标高度 h: {height}px</span>
                    <input
                      type="range"
                      min="40"
                      max="400"
                      value={height}
                      onChange={(e) => setHeight(parseInt(e.target.value))}
                      className="w-full h-1 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-orange-500"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <span className="text-slate-400 block mb-1">缩放模式 mode</span>
                    <select
                      value={resizeMode}
                      onChange={(e: any) => setResizeMode(e.target.value)}
                      className="w-full bg-slate-950 border border-slate-800 rounded px-1.5 py-1 text-slate-300 focus:outline-none"
                    >
                      <option value="fixed">fixed (强制拉伸)</option>
                      <option value="pad">pad (等比例填充)</option>
                      <option value="fill">fill (等比裁剪)</option>
                      <option value="lfit">lfit (限宽比例)</option>
                      <option value="mfit">mfit (长边缩放)</option>
                    </select>
                  </div>

                  {resizeMode === 'pad' && (
                    <div>
                      <span className="text-slate-400 block mb-1">填充背景颜色 padColor</span>
                      <select
                        value={padColor}
                        onChange={(e) => setPadColor(e.target.value)}
                        className="w-full bg-slate-950 border border-slate-800 rounded px-1.5 py-1 text-slate-300 focus:outline-none"
                      >
                        <option value="FFFFFF">FFFFFF (白色)</option>
                        <option value="000000">000000 (黑色)</option>
                        <option value="3c8dbc">3C8DBC (天翼蓝)</option>
                        <option value="ef4444">EF4444 (警示红)</option>
                      </select>
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>

          {/* Rotate Tool */}
          <div className="bg-slate-900/60 p-3 rounded-lg border border-slate-800 space-y-3">
            <div className="flex items-center justify-between">
              <label className="flex items-center space-x-2 font-medium text-xs text-white">
                <input
                  type="checkbox"
                  checked={rotateEnabled}
                  onChange={(e) => setRotateEnabled(e.target.checked)}
                  className="rounded border-slate-700 bg-slate-800 text-orange-500 focus:ring-0"
                />
                <span>2. 顺时针旋转 (Rotate)</span>
              </label>
              <RefreshCw className="h-3.5 w-3.5 text-slate-500" />
            </div>

            {rotateEnabled && (
              <div className="pl-5 pt-1 text-[11px] space-y-2">
                <span className="text-slate-400 block mb-1">角度 angle: {angle}°</span>
                <div className="flex space-x-2">
                  {[90, 180, 270, 45, 120].map((deg) => (
                    <button
                      key={deg}
                      onClick={() => setAngle(deg)}
                      className={`px-3 py-1 rounded cursor-pointer ${
                        angle === deg ? 'bg-orange-500 text-white' : 'bg-slate-950 text-slate-400 hover:text-white'
                      }`}
                    >
                      {deg}°
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Crop Tool */}
          <div className="bg-slate-900/60 p-3 rounded-lg border border-slate-800 space-y-3">
            <div className="flex items-center justify-between">
              <label className="flex items-center space-x-2 font-medium text-xs text-white">
                <input
                  type="checkbox"
                  checked={cropEnabled}
                  onChange={(e) => setCropEnabled(e.target.checked)}
                  className="rounded border-slate-700 bg-slate-800 text-orange-500 focus:ring-0"
                />
                <span>3. 图片裁剪 (Crop)</span>
              </label>
              <Sliders className="h-3.5 w-3.5 text-slate-500" />
            </div>

            {cropEnabled && (
              <div className="pl-5 pt-1 text-[11px] space-y-2.5">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <span className="text-slate-400 block mb-1">裁剪宽 w: {cropW}px</span>
                    <input
                      type="range"
                      min="40"
                      max="280"
                      value={cropW}
                      onChange={(e) => setCropW(parseInt(e.target.value))}
                      className="w-full h-1 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-orange-500"
                    />
                  </div>
                  <div>
                    <span className="text-slate-400 block mb-1">裁剪高 h: {cropH}px</span>
                    <input
                      type="range"
                      min="40"
                      max="200"
                      value={cropH}
                      onChange={(e) => setCropH(parseInt(e.target.value))}
                      className="w-full h-1 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-orange-500"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <span className="text-slate-400 block mb-1">偏移横坐标 x: {cropX}px</span>
                    <input
                      type="number"
                      value={cropX}
                      onChange={(e) => setCropX(parseInt(e.target.value) || 0)}
                      className="w-full bg-slate-950 border border-slate-800 rounded px-2 py-1 text-slate-300 font-mono text-center focus:outline-none"
                    />
                  </div>
                  <div>
                    <span className="text-slate-400 block mb-1">偏移纵坐标 y: {cropY}px</span>
                    <input
                      type="number"
                      value={cropY}
                      onChange={(e) => setCropY(parseInt(e.target.value) || 0)}
                      className="w-full bg-slate-950 border border-slate-800 rounded px-2 py-1 text-slate-300 font-mono text-center focus:outline-none"
                    />
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Watermark Tool */}
          <div className="bg-slate-900/60 p-3 rounded-lg border border-slate-800 space-y-3">
            <div className="flex items-center justify-between">
              <label className="flex items-center space-x-2 font-medium text-xs text-white">
                <input
                  type="checkbox"
                  checked={watermarkEnabled}
                  onChange={(e) => setWatermarkEnabled(e.target.checked)}
                  className="rounded border-slate-700 bg-slate-800 text-orange-500 focus:ring-0"
                />
                <span>4. 数据加水印保护 (Watermark)</span>
              </label>
              <Type className="h-3.5 w-3.5 text-slate-500" />
            </div>

            {watermarkEnabled && (
              <div className="pl-5 pt-1 text-[11px] space-y-3">
                <div>
                  <span className="text-slate-400 block mb-1">水印文字内容 text</span>
                  <input
                    type="text"
                    value={watermarkText}
                    onChange={(e) => setWatermarkText(e.target.value)}
                    placeholder="e.g. Chinatelecom"
                    className="w-full bg-slate-950 border border-slate-800 rounded px-2 py-1.5 text-slate-300 placeholder-slate-600 focus:outline-none focus:border-orange-500"
                  />
                  <span className="text-[10px] text-slate-500 mt-1 block">ZOS要求该参数在HTTP传输时需要进行Base64编码</span>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <span className="text-slate-400 block mb-1">字体样式 type</span>
                    <select
                      value={watermarkFont}
                      onChange={(e: any) => setWatermarkFont(e.target.value)}
                      className="w-full bg-slate-950 border border-slate-800 rounded px-1.5 py-1 text-slate-300 focus:outline-none"
                    >
                      <option value="kaishu">楷数 (kaishu)</option>
                      <option value="heiti">黑体 (heiti)</option>
                      <option value="yahei">微软雅黑 (yahei)</option>
                      <option value="youyuan">幼圆 (youyuan)</option>
                    </select>
                  </div>
                  <div>
                    <span className="text-slate-400 block mb-1">水印位置 gravity</span>
                    <select
                      value={watermarkGravity}
                      onChange={(e: any) => setWatermarkGravity(e.target.value)}
                      className="w-full bg-slate-950 border border-slate-800 rounded px-1.5 py-1 text-slate-300 focus:outline-none font-mono"
                    >
                      <option value="se">右下角 se</option>
                      <option value="sw">左下角 sw</option>
                      <option value="ne">右上角 ne</option>
                      <option value="nw">左上角 nw</option>
                      <option value="center">中间 center</option>
                      <option value="north">中上 north</option>
                      <option value="south">中下 south</option>
                    </select>
                  </div>
                </div>

                <div className="grid grid-cols-3 gap-2">
                  <div>
                    <span className="text-slate-400 block mb-1">大小 size</span>
                    <input
                      type="number"
                      value={watermarkSize}
                      onChange={(e) => setWatermarkSize(parseInt(e.target.value) || 12)}
                      className="w-full bg-slate-950 border border-slate-800 rounded px-2 py-1 text-slate-300 font-mono text-center focus:outline-none"
                    />
                  </div>
                  <div>
                    <span className="text-slate-400 block mb-1">透明度 t %</span>
                    <input
                      type="number"
                      min="10"
                      max="100"
                      value={watermarkOpacity}
                      onChange={(e) => setWatermarkOpacity(parseInt(e.target.value) || 100)}
                      className="w-full bg-slate-950 border border-slate-800 rounded px-2 py-1 text-slate-300 font-mono text-center focus:outline-none"
                    />
                  </div>
                  <div>
                    <span className="text-slate-400 block mb-1">颜色 hex</span>
                    <select
                      value={watermarkColor}
                      onChange={(e) => setWatermarkColor(e.target.value)}
                      className="w-full bg-slate-950 border border-slate-800 rounded px-1.5 py-1 text-slate-300 focus:outline-none font-mono text-xs"
                    >
                      <option value="FF0000">红 (FF0000)</option>
                      <option value="FFFFFF">白 (FFFFFF)</option>
                      <option value="000000">黑 (000000)</option>
                      <option value="0000FF">蓝 (0000FF)</option>
                      <option value="FFFF00">黄 (FFFF00)</option>
                    </select>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Format Converter */}
          <div className="bg-slate-900/60 p-3 rounded-lg border border-slate-800 space-y-3">
            <div className="flex items-center justify-between">
              <label className="flex items-center space-x-2 font-medium text-xs text-white">
                <input
                  type="checkbox"
                  checked={formatEnabled}
                  onChange={(e) => setFormatEnabled(e.target.checked)}
                  className="rounded border-slate-700 bg-slate-800 text-orange-500 focus:ring-0"
                />
                <span>5. 格式在线转换 (Format Conversion)</span>
              </label>
              <Sliders className="h-3.5 w-3.5 text-slate-500" />
            </div>

            {formatEnabled && (
              <div className="pl-5 pt-1 text-[11px] space-y-2">
                <span className="text-slate-400 block mb-1">目标输出图片格式</span>
                <div className="flex space-x-2">
                  {['png', 'jpg', 'webp', 'tiff'].map((fmt: any) => (
                    <button
                      key={fmt}
                      onClick={() => setTargetFormat(fmt)}
                      className={`px-3 py-1 rounded cursor-pointer capitalize font-sans ${
                        targetFormat === fmt ? 'bg-orange-500 text-white' : 'bg-slate-950 text-slate-400 hover:text-white'
                      }`}
                    >
                      {fmt}
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Right Side: Render Simulation + REST string code area */}
        <div className="lg:col-span-7 flex flex-col space-y-4">
          {/* Main Visualizer */}
          <div className="bg-slate-900 rounded-lg p-4 border border-slate-800 flex flex-col items-center flex-1 justify-center relative min-h-[300px]">
            <span className="text-[10px] text-slate-500 font-mono absolute top-2 left-3">IMAGE WORKSPACE PREVIEW</span>
            
            <div className="max-w-full overflow-hidden rounded-md border border-slate-700/50 shadow-2xl shadow-indigo-500/5">
              <canvas ref={mainCanvasRef} className="max-w-full h-auto block" />
            </div>

            <div className="text-center mt-3 text-[10px] text-slate-500 flex items-center space-x-1 justify-center">
              <HelpCircle className="h-3 w-3" />
              <span>当前在沙箱容器中采用 HTML5 模拟 ZOS 流式图像处理器(OSD)的数据渲染</span>
            </div>
          </div>

          {/* Tab Selection */}
          <div className="flex space-x-1.5 border-b border-slate-800 pb-1">
            <button
              onClick={() => setActiveSubTab('adjust')}
              className={`px-4 py-1.5 text-xs font-medium cursor-pointer transition-colors ${
                activeSubTab === 'adjust' ? 'text-white border-b-2 border-orange-500 font-bold' : 'text-slate-400 hover:text-white'
              }`}
            >
              模拟 RESTful 请求 URL
            </button>
            <button
              onClick={() => setActiveSubTab('code')}
              className={`px-4 py-1.5 text-xs font-medium cursor-pointer transition-colors flex items-center space-x-1.5 ${
                activeSubTab === 'code' ? 'text-white border-b-2 border-orange-500 font-bold' : 'text-slate-400 hover:text-white'
              }`}
            >
              <Code className="h-3.5 w-3.5" />
              <span>获取 Java SDK 代码</span>
            </button>
          </div>

          {/* Tab Panel */}
          {activeSubTab === 'adjust' ? (
            <div className="bg-slate-900 p-4 rounded-lg border border-slate-800 space-y-3">
              <div className="text-xs font-bold text-white flex items-center space-x-1.5">
                <span className="h-2 w-2 rounded-full bg-sky-400 animate-ping"></span>
                <span>REST HTTP API 地址:</span>
              </div>
              <div className="flex bg-slate-950 rounded border border-slate-800 overflow-hidden font-mono text-[10px] items-center">
                <div className="bg-emerald-500/10 text-emerald-400 text-[9px] px-2 py-2 border-r border-slate-800 select-none font-bold">GET</div>
                <div className="flex-1 px-3 text-slate-300 select-all truncate py-2" title={getRESTUrl()}>
                  {getRESTUrl()}
                </div>
                <button
                  onClick={handleCopyUrl}
                  className="bg-slate-900 hover:bg-slate-800 text-slate-400 hover:text-white border-l border-slate-800 px-3 py-2 cursor-pointer transition-colors flex items-center"
                >
                  {copied ? <Check className="h-3.5 w-3.5 text-emerald-400" /> : <Copy className="h-3.5 w-3.5" />}
                </button>
              </div>

              {/* Code parameters interpretation */}
              <div className="text-[11px] text-slate-400 space-y-1 bg-slate-950/40 p-2 rounded border border-slate-900/50">
                <div className="text-white font-semibold mb-1">图片处理参数详细解析 (用户手册对照):</div>
                <div className="grid grid-cols-2 gap-y-1 border-slate-800 font-mono text-[10px]">
                  {resizeEnabled && (
                    <>
                      <div>resize,w_{width},h_{height}</div>
                      <div className="text-slate-500">→ 等比/原图进行缩放 (至 {width}x{height}px)</div>
                    </>
                  )}
                  {rotateEnabled && (
                    <>
                      <div>rotate,${angle}</div>
                      <div className="text-slate-500">→ 顺时针旋转角度 (旋转角度为 {angle} 度)</div>
                    </>
                  )}
                  {cropEnabled && (
                    <>
                      <div>crop,w_{cropW},h_{cropH},g_{cropGravity}</div>
                      <div className="text-slate-500">→ 高度与宽度边界裁剪 (原点: {cropGravity})</div>
                    </>
                  )}
                  {watermarkEnabled && (
                    <>
                      <div>watermark,text_{getBase64Text(watermarkText).substring(0, 10)}...</div>
                      <div className="text-slate-500">→ 增加文本水印 (防伪抗链, 属性 {watermarkGravity})</div>
                    </>
                  )}
                  {formatEnabled && (
                    <>
                      <div>format,{targetFormat}</div>
                      <div className="text-slate-500">→ 动态转换目标格式 (输出类型为 {targetFormat.toUpperCase()})</div>
                    </>
                  )}
                </div>
              </div>
            </div>
          ) : (
            <div className="bg-slate-900 p-4 rounded-lg border border-slate-800 space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-white font-mono">picturedemo.java</span>
                <button
                  onClick={handleCopyCode}
                  className="text-[10px] bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white px-2 py-1 rounded flex items-center space-x-1.5 cursor-pointer"
                >
                  {copied ? (
                    <>
                      <Check className="h-3 w-3 text-emerald-400" />
                      <span>已复制成功</span>
                    </>
                  ) : (
                    <>
                      <Copy className="h-3 w-3" />
                      <span>复制代码</span>
                    </>
                  )}
                </button>
              </div>
              <pre className="bg-slate-950 p-3 rounded text-[10px] font-mono text-slate-300 overflow-x-auto max-h-[160px] leading-relaxed">
                {getJavaCode()}
              </pre>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
