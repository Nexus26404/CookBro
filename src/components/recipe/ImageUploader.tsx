'use client';

import { useRef, useState } from 'react';
import { AlertModal } from '../ui/Modal';
import styles from './ImageUploader.module.css';

const MAX_IMAGES = 5;
const MAX_SIZE_MB = 2;

interface ImageUploaderProps {
  images: string[];
  onChange: (images: string[]) => void;
}

export function ImageUploader({ images, onChange }: ImageUploaderProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [dragging, setDragging] = useState(false);

  // Alert modal state
  const [alertState, setAlertState] = useState<{ isOpen: boolean; title: string; description: string; type?: 'error' | 'success' | 'warning' }>({
    isOpen: false,
    title: '',
    description: '',
  });


  // Crop Editor State
  const [editingIndex, setEditingIndex] = useState<number | null>(null); // -1 for new, >= 0 for existing
  const [editingFileSrc, setEditingFileSrc] = useState<string | null>(null);
  const [pendingFiles, setPendingFiles] = useState<string[]>([]);
  const [imgDims, setImgDims] = useState({ nw: 0, nh: 0 });
  const [zoom, setZoom] = useState(1.0);
  const [panOffset, setPanOffset] = useState({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState(false);
  const dragStart = useRef({ x: 0, y: 0 });

  const handleFiles = async (files: FileList | File[]) => {
    const remaining = MAX_IMAGES - images.length;
    if (remaining <= 0) return;

    const toProcess = Array.from(files).slice(0, remaining);
    const rawDataUrls: string[] = [];

    const readFileAsDataUrl = (file: File): Promise<string> => {
      return new Promise((resolve, reject) => {
        if (file.size > MAX_SIZE_MB * 1024 * 1024) {
          setAlertState({
            isOpen: true,
            title: '文件过大',
            description: `"${file.name}" 超过限制的 ${MAX_SIZE_MB}MB，已自动跳过`,
            type: 'warning',
          });
          reject();
          return;
        }
        const reader = new FileReader();
        reader.onload = (e) => resolve(e.target!.result as string);
        reader.onerror = () => reject();
        reader.readAsDataURL(file);
      });
    };

    for (const file of toProcess) {
      try {
        const src = await readFileAsDataUrl(file);
        rawDataUrls.push(src);
      } catch {
        // skipped or error
      }
    }

    if (rawDataUrls.length > 0) {
      setEditingIndex(-1);
      setEditingFileSrc(rawDataUrls[0]);
      setPendingFiles(rawDataUrls.slice(1));
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files?.length) {
      handleFiles(e.target.files);
      e.target.value = '';
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setDragging(false);
    if (e.dataTransfer.files?.length) {
      handleFiles(e.dataTransfer.files);
    }
  };

  const removeImage = (index: number) => {
    onChange(images.filter((_, i) => i !== index));
  };

  const moveImage = (from: number, to: number) => {
    if (to < 0 || to >= images.length) return;
    const next = [...images];
    [next[from], next[to]] = [next[to], next[from]];
    onChange(next);
  };

  const startEditingExisting = (index: number) => {
    setEditingIndex(index);
    setEditingFileSrc(images[index]);
    setPendingFiles([]);
  };

  // Crop Box Dimensions (Fixed 4:3 display ratio in UI)
  const W_BOX = 320;
  const H_BOX = 240;

  const nw = imgDims.nw || 800;
  const nh = imgDims.nh || 600;
  const s0 = Math.max(W_BOX / nw, H_BOX / nh);
  const bw = nw * s0;
  const bh = nh * s0;
  const left_base = W_BOX / 2 - bw / 2;
  const top_base = H_BOX / 2 - bh / 2;

  const handleImgLoad = (e: React.SyntheticEvent<HTMLImageElement>) => {
    const img = e.currentTarget;
    setImgDims({ nw: img.naturalWidth, nh: img.naturalHeight });
    setZoom(1.0);
    setPanOffset({ x: 0, y: 0 });
  };

  const handleDragStart = (clientX: number, clientY: number) => {
    setIsDragging(true);
    dragStart.current = {
      x: clientX - panOffset.x,
      y: clientY - panOffset.y,
    };
  };

  const handleDragMove = (clientX: number, clientY: number) => {
    if (!isDragging) return;
    setPanOffset({
      x: clientX - dragStart.current.x,
      y: clientY - dragStart.current.y,
    });
  };

  const handleDragEnd = () => {
    setIsDragging(false);
  };

  const saveCrop = () => {
    if (!editingFileSrc) return;
    const img = new Image();
    img.onload = () => {
      const canvas = document.createElement('canvas');
      canvas.width = 800;
      canvas.height = 600;
      const ctx = canvas.getContext('2d');
      if (!ctx) return;

      // Draw background (white)
      ctx.fillStyle = '#FFFFFF';
      ctx.fillRect(0, 0, 800, 600);

      // Compute geometry relative to the 800x600 target size
      // scale = 800 / 320 = 2.5
      const SCALE = 2.5;

      const cx_box = left_base + bw / 2 + panOffset.x;
      const cy_box = top_base + bh / 2 + panOffset.y;
      const w_box = bw * zoom;
      const h_box = bh * zoom;
      const x_box = cx_box - w_box / 2;
      const y_box = cy_box - h_box / 2;

      const dx = x_box * SCALE;
      const dy = y_box * SCALE;
      const dw = w_box * SCALE;
      const dh = h_box * SCALE;

      ctx.drawImage(img, dx, dy, dw, dh);

      const croppedBase64 = canvas.toDataURL('image/webp', 0.85);

      if (editingIndex === -1) {
        onChange([...images, croppedBase64]);
      } else if (editingIndex !== null) {
        const next = [...images];
        next[editingIndex] = croppedBase64;
        onChange(next);
      }

      if (editingIndex === -1 && pendingFiles.length > 0) {
        setEditingFileSrc(pendingFiles[0]);
        setPendingFiles(pendingFiles.slice(1));
      } else {
        setEditingFileSrc(null);
        setEditingIndex(null);
        setPendingFiles([]);
      }
    };
    img.src = editingFileSrc;
  };

  const cancelCrop = () => {
    if (editingIndex === -1 && pendingFiles.length > 0) {
      setEditingFileSrc(pendingFiles[0]);
      setPendingFiles(pendingFiles.slice(1));
    } else {
      setEditingFileSrc(null);
      setEditingIndex(null);
      setPendingFiles([]);
    }
  };

  return (
    <div className={styles.wrapper}>
      {/* Preview grid */}
      {images.length > 0 && (
        <div className={styles.grid}>
          {images.map((src, index) => (
            <div key={index} className={`${styles.thumb} ${index === 0 ? styles.thumbCover : ''}`}>
              <img src={src} alt={`预览图 ${index + 1}`} className={styles.thumbImg} />
              {index === 0 && <span className={styles.coverBadge}>封面</span>}
              <div className={styles.thumbActions}>
                {index > 0 && (
                  <button
                    type="button"
                    className={styles.thumbAction}
                    onClick={() => moveImage(index, index - 1)}
                    title="左移"
                  >
                    ←
                  </button>
                )}
                <button
                  type="button"
                  className={styles.thumbAction}
                  onClick={() => startEditingExisting(index)}
                  title="裁剪尺寸/缩放"
                >
                  ✂️
                </button>
                {index < images.length - 1 && (
                  <button
                    type="button"
                    className={styles.thumbAction}
                    onClick={() => moveImage(index, index + 1)}
                    title="右移"
                  >
                    →
                  </button>
                )}
                <button
                  type="button"
                  className={`${styles.thumbAction} ${styles.thumbRemove}`}
                  onClick={() => removeImage(index)}
                  title="删除"
                >
                  ✕
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Upload zone */}
      {images.length < MAX_IMAGES && (
        <div
          className={`${styles.dropzone} ${dragging ? styles.dragging : ''}`}
          onClick={() => inputRef.current?.click()}
          onDragOver={(e) => { e.preventDefault(); setDragging(true); }}
          onDragLeave={() => setDragging(false)}
          onDrop={handleDrop}
        >
          <span className={styles.dropIcon}>📷</span>
          <p className={styles.dropText}>
            {images.length === 0 ? '点击或拖拽图片上传' : '继续添加图片'}
          </p>
          <p className={styles.dropHint}>
            最多 {MAX_IMAGES} 张 · 单张 ≤ {MAX_SIZE_MB}MB · 支持 JPG / PNG / WebP
          </p>
          <p className={styles.dropCount}>
            {images.length} / {MAX_IMAGES}
          </p>
        </div>
      )}

      {images.length >= MAX_IMAGES && (
        <p className={styles.maxReached}>已达到最大图片数量（{MAX_IMAGES} 张）</p>
      )}

      <input
        ref={inputRef}
        type="file"
        accept="image/*"
        multiple
        className={styles.hiddenInput}
        onChange={handleInputChange}
      />

      {/* Crop / Size Editor Modal */}
      {editingFileSrc && (
        <div className={styles.modalOverlay} onClick={cancelCrop}>
          <div className={styles.modal} onClick={(e) => e.stopPropagation()}>
            <h3 className={styles.modalTitle}>
              {editingIndex === -1 ? '裁剪并调整新图片' : '编辑图片尺寸'}
            </h3>
            <p className={styles.modalSubtitle}>拖拽移动图片，滑动下方滑杆调整缩放</p>

            <div
              className={styles.cropContainer}
              style={{ width: W_BOX, height: H_BOX }}
              onMouseDown={(e) => handleDragStart(e.clientX, e.clientY)}
              onMouseMove={(e) => handleDragMove(e.clientX, e.clientY)}
              onMouseUp={handleDragEnd}
              onMouseLeave={handleDragEnd}
              onTouchStart={(e) => {
                if (e.touches.length === 1) {
                  handleDragStart(e.touches[0].clientX, e.touches[0].clientY);
                }
              }}
              onTouchMove={(e) => {
                if (e.touches.length === 1) {
                  handleDragMove(e.touches[0].clientX, e.touches[0].clientY);
                }
              }}
              onTouchEnd={handleDragEnd}
            >
              <img
                src={editingFileSrc}
                alt="编辑中"
                onLoad={handleImgLoad}
                className={styles.cropImg}
                draggable={false}
                style={{
                  width: bw,
                  height: bh,
                  left: left_base,
                  top: top_base,
                  transform: `translate(${panOffset.x}px, ${panOffset.y}px) scale(${zoom})`,
                  transformOrigin: 'center center',
                }}
              />
              <div className={styles.cropOverlay} />
            </div>

            <div className={styles.controlRow}>
              <span className={styles.zoomLabel}>🔍 缩放:</span>
              <input
                type="range"
                min="1.0"
                max="3.0"
                step="0.05"
                value={zoom}
                onChange={(e) => setZoom(parseFloat(e.target.value))}
                className={styles.zoomSlider}
              />
              <span className={styles.zoomVal}>{Math.round(zoom * 100)}%</span>
            </div>

            <div className={styles.btnRow}>
              <button type="button" className={styles.cancelBtn} onClick={cancelCrop}>
                取消
              </button>
              <button type="button" className={styles.saveBtn} onClick={saveCrop}>
                确定裁剪并保存
              </button>
            </div>
          </div>
        </div>
      )}
      {/* Global Alert Modal */}
      <AlertModal
        isOpen={alertState.isOpen}
        onClose={() => setAlertState({ ...alertState, isOpen: false })}
        title={alertState.title}
        description={alertState.description}
        type={alertState.type}
      />
    </div>
  );
}
