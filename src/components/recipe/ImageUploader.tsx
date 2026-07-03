'use client';

import { useRef, useState } from 'react';
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

  const compressAndConvert = (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
      if (!file.type.startsWith('image/')) {
        reject(new Error('只支持图片文件'));
        return;
      }
      const reader = new FileReader();
      reader.onload = (e) => {
        const img = new Image();
        img.onload = () => {
          const canvas = document.createElement('canvas');
          const MAX_DIM = 1200;
          let { width, height } = img;
          if (width > MAX_DIM || height > MAX_DIM) {
            if (width > height) {
              height = Math.round((height * MAX_DIM) / width);
              width = MAX_DIM;
            } else {
              width = Math.round((width * MAX_DIM) / height);
              height = MAX_DIM;
            }
          }
          canvas.width = width;
          canvas.height = height;
          const ctx = canvas.getContext('2d')!;
          ctx.drawImage(img, 0, 0, width, height);
          resolve(canvas.toDataURL('image/webp', 0.82));
        };
        img.onerror = reject;
        img.src = e.target!.result as string;
      };
      reader.onerror = reject;
      reader.readAsDataURL(file);
    });
  };

  const handleFiles = async (files: FileList | File[]) => {
    const remaining = MAX_IMAGES - images.length;
    if (remaining <= 0) return;

    const toProcess = Array.from(files).slice(0, remaining);
    const results: string[] = [];

    for (const file of toProcess) {
      if (file.size > MAX_SIZE_MB * 1024 * 1024) {
        alert(`"${file.name}" 超过 ${MAX_SIZE_MB}MB，已跳过`);
        continue;
      }
      try {
        const dataUrl = await compressAndConvert(file);
        results.push(dataUrl);
      } catch {
        alert(`"${file.name}" 无法读取，已跳过`);
      }
    }

    if (results.length > 0) {
      onChange([...images, ...results]);
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files?.length) {
      handleFiles(e.target.files);
      // reset so same file can be re-selected
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
    </div>
  );
}
