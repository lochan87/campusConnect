import React, { useRef, useState, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { FiCamera, FiTrash2, FiUpload, FiX, FiCheck } from 'react-icons/fi';
import toast from 'react-hot-toast';

/**
 * AvatarUploader — reusable profile photo upload widget.
 *
 * Props:
 *   currentAvatar  {string|null}  — current base64/URL avatar
 *   displayName    {string}        — fallback initial letter display
 *   size           {number}        — avatar diameter in px (default 96)
 *   editable       {boolean}       — show upload controls (default false)
 *   onUpload       {async fn}      — async (File) => void, called after user confirms
 *   onRemove       {async fn}      — async () => void, called when user removes photo
 *   className      {string}        — extra wrapper classes
 */

const MAX_CANVAS_PX = 300; // resize to at most 300×300
const JPEG_QUALITY  = 0.82;

/** Client-side resize using canvas → returns a Blob */
async function resizeImage(file) {
  return new Promise((resolve, reject) => {
    const img = new Image();
    const url = URL.createObjectURL(file);
    img.onload = () => {
      URL.revokeObjectURL(url);
      let { width, height } = img;
      if (width > MAX_CANVAS_PX || height > MAX_CANVAS_PX) {
        const ratio = Math.min(MAX_CANVAS_PX / width, MAX_CANVAS_PX / height);
        width  = Math.round(width  * ratio);
        height = Math.round(height * ratio);
      }
      const canvas = document.createElement('canvas');
      canvas.width  = width;
      canvas.height = height;
      const ctx = canvas.getContext('2d');
      // Round-clip (makes a circle on canvas — optional, we crop in CSS)
      ctx.drawImage(img, 0, 0, width, height);
      canvas.toBlob(
        (blob) => blob ? resolve(blob) : reject(new Error('Canvas toBlob failed')),
        'image/jpeg',
        JPEG_QUALITY
      );
    };
    img.onerror = () => { URL.revokeObjectURL(url); reject(new Error('Image load error')); };
    img.src = url;
  });
}

const AvatarUploader = ({
  currentAvatar = null,
  displayName   = '?',
  size          = 96,
  editable      = false,
  onUpload,
  onRemove,
  className     = '',
}) => {
  const fileInputRef   = useRef(null);
  const [preview, setPreview]     = useState(null); // local blob URL
  const [pendingBlob, setPending] = useState(null); // resized Blob ready to send
  const [uploading, setUploading] = useState(false);
  const [removing, setRemoving]   = useState(false);
  const [isDragging, setDragging] = useState(false);

  const initial = (displayName || '?').charAt(0).toUpperCase();
  const displayed = preview || currentAvatar;

  // ── Handle file selection / drop ──────────────────────────────────────────
  const processFile = useCallback(async (file) => {
    if (!file) return;
    const allowed = ['image/jpeg', 'image/png', 'image/webp'];
    if (!allowed.includes(file.type)) {
      toast.error('Only JPEG, PNG, or WebP images are allowed');
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      toast.error('Image must be smaller than 5 MB');
      return;
    }
    try {
      const resized = await resizeImage(file);
      const url     = URL.createObjectURL(resized);
      setPreview(url);
      setPending(resized);
    } catch {
      toast.error('Failed to process image');
    }
  }, []);

  const handleFileInput = (e) => {
    const file = e.target.files?.[0];
    if (file) processFile(file);
    e.target.value = '';
  };

  const handleDragOver = (e) => { e.preventDefault(); setDragging(true);  };
  const handleDragLeave = ()  => setDragging(false);
  const handleDrop = (e) => {
    e.preventDefault();
    setDragging(false);
    processFile(e.dataTransfer?.files?.[0]);
  };

  // ── Confirm upload ────────────────────────────────────────────────────────
  const handleConfirm = async () => {
    if (!pendingBlob || !onUpload) return;
    setUploading(true);
    try {
      const file = new File([pendingBlob], 'avatar.jpg', { type: 'image/jpeg' });
      await onUpload(file);
      toast.success('Profile photo updated!');
      setPreview(null);
      setPending(null);
    } catch (err) {
      toast.error(err?.response?.data?.error || err?.message || 'Upload failed');
    } finally {
      setUploading(false);
    }
  };

  // ── Cancel pending ────────────────────────────────────────────────────────
  const handleCancel = () => {
    if (preview) URL.revokeObjectURL(preview);
    setPreview(null);
    setPending(null);
  };

  // ── Remove avatar ─────────────────────────────────────────────────────────
  const handleRemove = async () => {
    if (!onRemove) return;
    setRemoving(true);
    try {
      await onRemove();
      toast.success('Profile photo removed');
    } catch {
      toast.error('Failed to remove photo');
    } finally {
      setRemoving(false);
    }
  };

  return (
    <div className={`flex flex-col items-center gap-3 ${className}`}>
      {/* Avatar circle */}
      <div
        style={{ width: size, height: size }}
        className={`relative flex-shrink-0 rounded-full group ${editable ? 'cursor-pointer' : ''} ${isDragging ? 'ring-4 ring-indigo-400' : ''}`}
        onDragOver={editable ? handleDragOver : undefined}
        onDragLeave={editable ? handleDragLeave : undefined}
        onDrop={editable ? handleDrop : undefined}
        onClick={editable && !pendingBlob ? () => fileInputRef.current?.click() : undefined}
      >
        {/* Image or initials */}
        {displayed ? (
          <img
            src={displayed}
            alt={displayName}
            className="w-full h-full rounded-full object-cover shadow-xl"
            style={{ width: size, height: size }}
          />
        ) : (
          <div
            className="w-full h-full rounded-full bg-gradient-to-br from-indigo-500 via-indigo-600 to-purple-600 flex items-center justify-center shadow-xl"
            style={{ width: size, height: size }}
          >
            <span
              className="font-bold text-white select-none"
              style={{ fontSize: size * 0.35 }}
            >
              {initial}
            </span>
          </div>
        )}

        {/* Camera overlay — shown on hover when editable and no pending preview */}
        {editable && !pendingBlob && (
          <div className="absolute inset-0 rounded-full bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex flex-col items-center justify-center gap-1 pointer-events-none">
            <FiCamera className="w-6 h-6 text-white drop-shadow" />
            <span className="text-white text-[10px] font-semibold tracking-wide">Change</span>
          </div>
        )}

        {/* Uploading spinner overlay */}
        {uploading && (
          <div className="absolute inset-0 rounded-full bg-black/50 flex items-center justify-center">
            <div className="w-7 h-7 border-2 border-white border-t-transparent rounded-full animate-spin" />
          </div>
        )}
      </div>

      {/* Hidden file input */}
      <input
        ref={fileInputRef}
        type="file"
        accept="image/jpeg,image/png,image/webp"
        className="hidden"
        onChange={handleFileInput}
      />

      {/* Confirm / Cancel row when there's a pending preview */}
      <AnimatePresence>
        {pendingBlob && (
          <motion.div
            initial={{ opacity: 0, y: -6, height: 0 }}
            animate={{ opacity: 1, y: 0, height: 'auto' }}
            exit={{ opacity: 0, y: -6, height: 0 }}
            className="flex items-center gap-2"
          >
            <button
              onClick={handleConfirm}
              disabled={uploading}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-indigo-600 text-white text-xs font-semibold hover:bg-indigo-700 disabled:opacity-60 transition-colors shadow-md"
            >
              {uploading ? (
                <div className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />
              ) : (
                <FiCheck className="w-3.5 h-3.5" />
              )}
              Save
            </button>
            <button
              onClick={handleCancel}
              disabled={uploading}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 text-xs font-semibold hover:bg-gray-300 dark:hover:bg-gray-600 disabled:opacity-60 transition-colors"
            >
              <FiX className="w-3.5 h-3.5" />
              Cancel
            </button>
          </motion.div>
        )}
      </AnimatePresence>

      {/* "Upload photo" / "Remove" buttons when editable and no pending preview */}
      {editable && !pendingBlob && (
        <div className="flex items-center gap-2">
          <button
            onClick={() => fileInputRef.current?.click()}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-indigo-50 dark:bg-indigo-900/30 text-indigo-700 dark:text-indigo-400 text-xs font-semibold hover:bg-indigo-100 dark:hover:bg-indigo-900/50 transition-colors border border-indigo-200 dark:border-indigo-700"
          >
            <FiUpload className="w-3.5 h-3.5" />
            {currentAvatar ? 'Change Photo' : 'Upload Photo'}
          </button>
          {currentAvatar && onRemove && (
            <button
              onClick={handleRemove}
              disabled={removing}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 text-xs font-semibold hover:bg-red-100 dark:hover:bg-red-900/30 disabled:opacity-60 transition-colors border border-red-200 dark:border-red-700"
            >
              {removing ? (
                <div className="w-3.5 h-3.5 border-2 border-red-400 border-t-transparent rounded-full animate-spin" />
              ) : (
                <FiTrash2 className="w-3.5 h-3.5" />
              )}
              Remove
            </button>
          )}
        </div>
      )}

      {/* Drag hint */}
      {editable && !pendingBlob && (
        <p className="text-[10px] text-gray-400 dark:text-gray-500 text-center leading-tight">
          Drag & drop or click to upload · JPEG / PNG / WebP · max 5 MB
        </p>
      )}
    </div>
  );
};

export default AvatarUploader;
