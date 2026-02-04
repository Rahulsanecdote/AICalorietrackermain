import React, { useState, useRef } from 'react';
import { ProgressPhoto } from '../../types/analytics';
import { Upload, Trash2, X, ChevronLeft, ChevronRight, Camera } from 'lucide-react';

interface ProgressPhotoGalleryProps {
  photos: ProgressPhoto[];
  onUpload: (file: File, date?: string, weight?: number) => Promise<void>;
  onDelete: (id: string) => void;
  isLoading: boolean;
}

export default function ProgressPhotoGallery({ photos, onUpload, onDelete, isLoading }: ProgressPhotoGalleryProps) {
  const [selectedPhoto, setSelectedPhoto] = useState<ProgressPhoto | null>(null);
  const [showUploadModal, setShowUploadModal] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [uploadDate, setUploadDate] = useState(new Date().toISOString().split('T')[0]);

  const [compareMode, setCompareMode] = useState(false); // Added missing state
  const [comparePhoto1, setComparePhoto1] = useState<ProgressPhoto | null>(null);
  const [comparePhoto2, setComparePhoto2] = useState<ProgressPhoto | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setSelectedFile(file);
      const reader = new FileReader();
      reader.onload = (event) => {
        setPreviewUrl(event.target?.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleUpload = async () => {
    if (selectedFile) {
      await onUpload(selectedFile, uploadDate);
      setSelectedFile(null);
      setPreviewUrl(null);
      setShowUploadModal(false);
    }
  };

  const handleCompare = () => {
    if (comparePhoto1 && comparePhoto2) {
      setSelectedPhoto(comparePhoto1);
      setCompareMode(true);
    }
  };

  const openPhotoViewer = (photo: ProgressPhoto) => {
    setSelectedPhoto(photo);
    setCompareMode(false);
  };

  return (
    <div>
      {/* Compare Selection */}
      <div className="mb-4 p-3 bg-muted/50 rounded-xl">
        <p className="text-sm text-muted-foreground mb-2">Compare two photos:</p>
        <div className="flex items-center gap-2">
          <select
            className="flex-1 px-3 py-2 bg-background border border-input rounded-lg text-sm text-foreground focus:ring-2 focus:ring-ring"
            value={comparePhoto1?.id || ''}
            onChange={(e) => {
              const photo = photos.find((p) => p.id === e.target.value);
              setComparePhoto1(photo || null);
            }}
          >
            <option value="">Select first photo</option>
            {photos.map((photo) => (
              <option key={photo.id} value={photo.id}>
                {new Date(photo.date).toLocaleDateString()}
              </option>
            ))}
          </select>
          <span className="text-muted-foreground">vs</span>
          <select
            className="flex-1 px-3 py-2 bg-background border border-input rounded-lg text-sm text-foreground focus:ring-2 focus:ring-ring"
            value={comparePhoto2?.id || ''}
            onChange={(e) => {
              const photo = photos.find((p) => p.id === e.target.value);
              setComparePhoto2(photo || null);
            }}
          >
            <option value="">Select second photo</option>
            {photos.map((photo) => (
              <option key={photo.id} value={photo.id}>
                {new Date(photo.date).toLocaleDateString()}
              </option>
            ))}
          </select>
          <button
            onClick={handleCompare}
            disabled={!comparePhoto1 || !comparePhoto2}
            className="px-4 py-2 bg-primary text-primary-foreground rounded-lg text-sm disabled:opacity-50 disabled:cursor-not-allowed hover:bg-primary/90 transition-colors"
          >
            Compare
          </button>
        </div>
      </div>

      {/* Upload Button */}
      <button
        onClick={() => setShowUploadModal(true)}
        className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 transition-colors font-medium mb-4"
      >
        <Upload className="w-4 h-4" />
        Upload Progress Photo
      </button>

      {/* Photo Grid */}
      {photos.length > 0 ? (
        <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
          {photos.map((photo) => (
            <div
              key={photo.id}
              className="relative group aspect-square rounded-xl overflow-hidden bg-muted cursor-pointer"
              onClick={() => openPhotoViewer(photo)}
            >
              <img
                src={photo.frontUrl}
                alt={`Progress photo ${photo.date}`}
                className="w-full h-full object-cover"
              />
              <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex flex-col items-center justify-center">
                <p className="text-white text-sm font-medium">
                  {new Date(photo.date).toLocaleDateString('en-US', {
                    month: 'short',
                    day: 'numeric',
                    year: 'numeric',
                  })}
                </p>
                {photo.weightAtTime && (
                  <p className="text-white/80 text-xs mt-1">{photo.weightAtTime} kg</p>
                )}
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    if (confirm('Delete this photo?')) {
                      onDelete(photo.id);
                    }
                  }}
                  className="absolute top-2 right-2 p-1.5 bg-red-500/80 text-white rounded-lg opacity-0 group-hover:opacity-100 transition-opacity"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="bg-muted/30 rounded-xl p-8 text-center border border-border dashed">
          <Camera className="w-12 h-12 text-muted-foreground/30 mx-auto mb-3" />
          <p className="text-muted-foreground mb-2">No progress photos yet</p>
          <p className="text-sm text-muted-foreground/70">Upload your first photo to track your progress</p>
        </div>
      )}

      {/* Upload Modal */}
      {showUploadModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4 backdrop-blur-sm">
          <div className="bg-card rounded-2xl w-full max-w-md p-6 border border-border">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-foreground">Upload Progress Photo</h3>
              <button
                onClick={() => {
                  setShowUploadModal(false);
                  setSelectedFile(null);
                  setPreviewUrl(null);
                }}
                className="p-1 hover:bg-muted rounded-lg"
              >
                <X className="w-5 h-5 text-muted-foreground" />
              </button>
            </div>

            {!previewUrl ? (
              <div
                onClick={() => fileInputRef.current?.click()}
                className="border-2 border-dashed border-border rounded-xl p-8 text-center cursor-pointer hover:border-primary/50 hover:bg-muted/50 transition-all"
              >
                <Upload className="w-10 h-10 text-muted-foreground mx-auto mb-3" />
                <p className="text-foreground mb-1">Click to select a photo</p>
                <p className="text-xs text-muted-foreground">JPG, PNG up to 5MB</p>
              </div>
            ) : (
              <div className="space-y-4">
                <div className="relative rounded-xl overflow-hidden bg-muted">
                  <img
                    src={previewUrl}
                    alt="Preview"
                    className="w-full h-64 object-contain"
                  />
                  <button
                    onClick={() => {
                      setSelectedFile(null);
                      setPreviewUrl(null);
                    }}
                    className="absolute top-2 right-2 p-1.5 bg-black/50 text-white rounded-lg hover:bg-black/70"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>
                <div>
                  <label htmlFor="photo-upload-date" className="block text-sm font-medium text-foreground mb-1">Date</label>
                  <input
                    id="photo-upload-date"
                    name="photo-upload-date"
                    type="date"
                    autoComplete="off"
                    value={uploadDate}
                    onChange={(e) => setUploadDate(e.target.value)}
                    className="w-full px-4 py-2 bg-background border border-input rounded-lg focus:ring-2 focus:ring-ring text-foreground"
                  />
                </div>
              </div>
            )}

            <input
              ref={fileInputRef}
              id="photo-file-input"
              name="photo-file-input"
              type="file"
              accept="image/*"
              onChange={handleFileSelect}
              className="hidden"
            />

            {previewUrl && (
              <div className="flex gap-3 mt-4">
                <button
                  onClick={() => {
                    setShowUploadModal(false);
                    setSelectedFile(null);
                    setPreviewUrl(null);
                  }}
                  className="flex-1 px-4 py-2 text-muted-foreground hover:bg-muted rounded-lg transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={handleUpload}
                  disabled={isLoading}
                  className="flex-1 px-4 py-2 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 transition-colors disabled:opacity-50"
                >
                  {isLoading ? 'Uploading...' : 'Upload'}
                </button>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Photo Viewer Modal */}
      {selectedPhoto && (
        <div className="fixed inset-0 bg-black/90 flex items-center justify-center z-50 p-4">
          <button
            onClick={() => {
              setSelectedPhoto(null);
              setCompareMode(false);
            }}
            className="absolute top-4 right-4 p-2 text-white/80 hover:text-white"
          >
            <X className="w-6 h-6" />
          </button>

          <div className="max-w-4xl w-full">
            <div className="relative">
              {compareMode && comparePhoto1 && comparePhoto2 ? (
                <div className="grid grid-cols-2 gap-4">
                  <div className="relative">
                    <img
                      src={comparePhoto1.frontUrl}
                      alt={`Date: ${comparePhoto1.date}`}
                      className="w-full max-h-[80vh] object-contain"
                    />
                    <div className="absolute bottom-4 left-4 bg-black/50 text-white px-3 py-1 rounded-lg">
                      <p className="text-sm font-medium">{new Date(comparePhoto1.date).toLocaleDateString()}</p>
                      {comparePhoto1.weightAtTime && (
                        <p className="text-xs">{comparePhoto1.weightAtTime}kg</p>
                      )}
                    </div>
                  </div>
                  <div className="relative">
                    <img
                      src={comparePhoto2.frontUrl}
                      alt={`Date: ${comparePhoto2.date}`}
                      className="w-full max-h-[80vh] object-contain"
                    />
                    <div className="absolute bottom-4 left-4 bg-black/50 text-white px-3 py-1 rounded-lg">
                      <p className="text-sm font-medium">{new Date(comparePhoto2.date).toLocaleDateString()}</p>
                      {comparePhoto2.weightAtTime && (
                        <p className="text-xs">{comparePhoto2.weightAtTime}kg</p>
                      )}
                    </div>
                  </div>
                </div>
              ) : (
                <img
                  src={selectedPhoto.frontUrl}
                  alt="Progress photo"
                  className="w-full max-h-[80vh] object-contain"
                />
              )}

              {/* Photo Info (Single Photo Mode) */}
              {!compareMode && (
                <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/80 to-transparent p-4">
                  <p className="text-white font-medium">
                    {new Date(selectedPhoto.date).toLocaleDateString('en-US', {
                      weekday: 'long',
                      month: 'long',
                      day: 'numeric',
                      year: 'numeric',
                    })}
                  </p>
                  {selectedPhoto.weightAtTime && (
                    <p className="text-white/80 text-sm">Weight: {selectedPhoto.weightAtTime} kg</p>
                  )}
                </div>
              )}

              {/* Navigation arrows (Single Photo Mode Only) */}
              {!compareMode && photos.length > 1 && (
                <>
                  <button
                    onClick={() => {
                      const currentIndex = photos.findIndex((p) => p.id === selectedPhoto.id);
                      if (currentIndex > 0) {
                        setSelectedPhoto(photos[currentIndex - 1] ?? null);
                      }
                    }}
                    disabled={photos.findIndex((p) => p.id === selectedPhoto.id) === 0}
                    className="absolute left-4 top-1/2 -translate-y-1/2 p-2 bg-card/20 text-white rounded-full disabled:opacity-30"
                  >
                    <ChevronLeft className="w-6 h-6" />
                  </button>
                  <button
                    onClick={() => {
                      const currentIndex = photos.findIndex((p) => p.id === selectedPhoto.id);
                      if (currentIndex < photos.length - 1) {
                        setSelectedPhoto(photos[currentIndex + 1] ?? null);
                      }
                    }}
                    disabled={photos.findIndex((p) => p.id === selectedPhoto.id) === photos.length - 1}
                    className="absolute right-4 top-1/2 -translate-y-1/2 p-2 bg-card/20 text-white rounded-full disabled:opacity-30"
                  >
                    <ChevronRight className="w-6 h-6" />
                  </button>
                </>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
