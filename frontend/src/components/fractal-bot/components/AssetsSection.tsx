import React, { useState, useRef } from 'react';
import { Asset } from '../types/state';
import { AssetModal } from './AssetModal';

interface AssetsSectionProps {
    assets: Asset[];
    onUpload?: (file: File) => void;
    onDelete?: (assetId: string) => void;
}

export const getAssetColor = (type: string, metadata?: { type?: string; name?: string; timestamp?: string; tags?: string[];[key: string]: any }) => {
    // Get file extension and type
    const fileType = metadata?.type || '';
    const fileName = metadata?.name || '';
    const extension = fileName.split('.').pop()?.toLowerCase() || '';

    // Images
    if (fileType.startsWith('image/') || ['jpg', 'jpeg', 'png', 'gif', 'svg', 'webp'].includes(extension)) {
        return 'from-rose-400/20 to-pink-400/20 dark:from-rose-500/20 dark:to-pink-500/20';
    }

    // Code files
    if (fileType.startsWith('text/') || ['js', 'ts', 'jsx', 'tsx', 'py', 'java', 'cpp', 'cs', 'go', 'rs', 'php'].includes(extension)) {
        return 'from-blue-400/20 to-indigo-400/20 dark:from-blue-500/20 dark:to-indigo-500/20';
    }

    // Document files
    if (fileType === 'application/pdf' || ['doc', 'docx', 'pdf', 'txt', 'md', 'rtf'].includes(extension)) {
        return 'from-emerald-400/20 to-teal-400/20 dark:from-emerald-500/20 dark:to-teal-500/20';
    }

    // Default
    return 'from-gray-400/20 to-gray-500/20 dark:from-gray-500/20 dark:to-gray-600/20';
};

export const getAssetIcon = (type: string, metadata?: { type?: string; name?: string; timestamp?: string; tags?: string[];[key: string]: any }) => {
    const fileType = metadata?.type || '';
    const fileName = metadata?.name || '';
    const extension = fileName.split('.').pop()?.toLowerCase() || '';

    // Specific overrides
    if (type === 'dataset') {
        return (
            <svg className="w-6 h-6 text-purple-500 dark:text-purple-400" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 7v10c0 2.21 3.582 4 8 4s8-1.79 8-4V7M4 7c0 2.21 3.582 4 8 4s8-1.79 8-4M4 7c0-2.21 3.582-4 8-4s8 1.79 8 4m0 5c0 2.21-3.582 4-8 4s-8-1.79-8-4" />
            </svg>
        );
    }

    if (type === 'report') {
        return (
            <svg className="w-6 h-6 text-red-500 dark:text-red-400" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
            </svg>
        );
    }

    if (type === 'data') {
        return (
            <svg className="w-6 h-6 text-green-500 dark:text-green-400" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M3 10h18M3 14h18m-9-4v8m-7 0h14a2 2 0 002-2V8a2 2 0 00-2-2H6a2 2 0 00-2 2v8a2 2 0 002 2z" />
            </svg>
        );
    }

    // File type based icons
    if (fileType.startsWith('image/') || ['jpg', 'jpeg', 'png', 'gif', 'svg', 'webp'].includes(extension)) {
        return (
            <svg className="w-6 h-6 text-rose-500 dark:text-rose-400" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
            </svg>
        );
    }

    if (fileType === 'application/pdf' || extension === 'pdf') {
        return (
            <svg className="w-6 h-6 text-red-500 dark:text-red-400" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
            </svg>
        );
    }

    if (['xls', 'xlsx', 'csv'].includes(extension)) {
        return (
            <svg className="w-6 h-6 text-green-500 dark:text-green-400" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M3 10h18M3 14h18m-9-4v8m-7 0h14a2 2 0 002-2V8a2 2 0 00-2-2H6a2 2 0 00-2 2v8a2 2 0 002 2z" />
            </svg>
        );
    }

    if (fileType.startsWith('text/') || ['txt', 'md', 'rtf'].includes(extension)) {
        return (
            <svg className="w-6 h-6 text-emerald-500 dark:text-emerald-400" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
        );
    }

    // Default
    return (
        <svg className="w-6 h-6 text-gray-500 dark:text-gray-400" viewBox="0 0 24 24" fill="none" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
        </svg>
    );
};

export const AssetsSection: React.FC<AssetsSectionProps> = ({ assets, onUpload, onDelete }) => {
    const [selectedAsset, setSelectedAsset] = useState<Asset | null>(null);
    const [previewAsset, setPreviewAsset] = useState<{ asset: Asset; position: { x: number; y: number } } | null>(null);
    const fileInputRef = useRef<HTMLInputElement>(null);

    const handleMouseEnter = (asset: Asset, event: React.MouseEvent) => {
        const rect = event.currentTarget.getBoundingClientRect();
        setPreviewAsset({
            asset,
            position: {
                x: rect.right,
                y: rect.top
            }
        });
    };

    const handleMouseLeave = () => {
        setPreviewAsset(null);
    };

    const handleUploadClick = () => {
        fileInputRef.current?.click();
    };

    const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
        const file = event.target.files?.[0];
        if (file && onUpload) {
            onUpload(file);
        }
        if (fileInputRef.current) {
            fileInputRef.current.value = '';
        }
    };

    const handleDelete = (assetId: string, event: React.MouseEvent) => {
        event.stopPropagation();
        if (onDelete) {
            onDelete(assetId);
        }
    };

    // Create a matrix of 3xN cells
    const matrixSize = Math.max(9, Math.ceil(assets.length / 3) * 3);
    const matrixCells = Array.from({ length: matrixSize }, (_, i) => i);

    return (
        <div className="h-full flex flex-col">
            {/* Header */}
            <div className="flex-none p-4 border-b border-gray-200 dark:border-gray-700">
                <div className="flex justify-between items-center">
                    <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
                        Workspace
                    </h3>
                    <button
                        onClick={handleUploadClick}
                        className="px-3 py-1.5 text-sm text-gray-600 dark:text-gray-300 hover:text-gray-900 dark:hover:text-gray-100 rounded-md hover:bg-gray-100 dark:hover:bg-gray-800/50 transition-all duration-200 flex items-center gap-2 group"
                    >
                        <svg
                            className="w-4 h-4 transition-transform duration-200 group-hover:scale-110"
                            fill="none"
                            stroke="currentColor"
                            viewBox="0 0 24 24"
                        >
                            <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                strokeWidth={2}
                                d="M12 4v16m8-8H4"
                            />
                        </svg>
                        Add Asset
                    </button>
                </div>
            </div>

            {/* Matrix Grid */}
            <div className="flex-1 overflow-y-auto p-4">
                <div className="relative">
                    {/* Background Texture */}
                    <div className="absolute inset-0 bg-gradient-to-br from-gray-50/50 to-gray-100/50 dark:from-gray-900/50 dark:to-gray-800/50 rounded-xl backdrop-blur-sm" />

                    {/* Matrix Grid */}
                    <div className="relative grid grid-cols-3 gap-4 p-4">
                        {matrixCells.map((index) => {
                            const asset = assets[index];
                            return (
                                <div
                                    key={index}
                                    className={`aspect-square rounded-xl border-2 border-dashed border-gray-200/50 dark:border-gray-700/50 
                                              ${asset ? 'border-transparent' : 'hover:border-gray-300/50 dark:hover:border-gray-600/50'} 
                                              transition-all duration-200 relative group`}
                                >
                                    {asset ? (
                                        <div
                                            className={`absolute inset-0 bg-gradient-to-br rounded-xl shadow-lg 
                                                      hover:shadow-xl transition-all duration-200 cursor-pointer
                                                      hover:scale-[1.02] hover:-translate-y-0.5
                                                      ${!asset.ready ? 'animate-pulse' : ''}`}
                                            onClick={() => setSelectedAsset(asset)}
                                            onMouseEnter={(e) => handleMouseEnter(asset, e)}
                                            onMouseLeave={handleMouseLeave}
                                        >
                                            <div className={`absolute inset-0 bg-gradient-to-br ${getAssetColor(asset.type, asset.metadata)} rounded-xl ${!asset.ready ? 'opacity-70' : ''}`} />
                                            <div className="absolute inset-0 flex flex-col p-4">
                                                <div className="flex items-center justify-between mb-2">
                                                    <div className={`${!asset.ready ? 'animate-pulse' : ''}`}>
                                                        {getAssetIcon(asset.type, asset.metadata)}
                                                    </div>
                                                    <button
                                                        onClick={(e) => handleDelete(asset.id, e)}
                                                        className="p-1 rounded-full bg-white/80 dark:bg-gray-800/80 
                                                                 text-gray-500 hover:text-red-500 opacity-0 group-hover:opacity-100 
                                                                 transition-opacity duration-200"
                                                    >
                                                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                                                        </svg>
                                                    </button>
                                                </div>
                                                <div className="flex-1 flex flex-col justify-end">
                                                    <h4 className={`text-sm font-medium text-gray-900 dark:text-gray-100 mb-1 ${!asset.ready ? 'animate-pulse' : ''}`}>
                                                        {asset.name}
                                                    </h4>
                                                    <div className="text-xs text-gray-500 dark:text-gray-400 space-y-0.5">
                                                        <p className="truncate">
                                                            {asset.type}
                                                        </p>
                                                        <p>
                                                            {new Date(asset.metadata.timestamp).toLocaleDateString(undefined, {
                                                                month: 'short',
                                                                day: 'numeric',
                                                                hour: '2-digit',
                                                                minute: '2-digit'
                                                            })}
                                                        </p>
                                                        {asset.metadata.tags && asset.metadata.tags.length > 0 && (
                                                            <div className="flex flex-wrap gap-1">
                                                                {asset.metadata.tags.slice(0, 2).map((tag, i) => (
                                                                    <span key={i} className="px-1.5 py-0.5 rounded-full bg-white/50 dark:bg-gray-800/50 text-[10px] text-gray-600 dark:text-gray-400">
                                                                        {tag}
                                                                    </span>
                                                                ))}
                                                            </div>
                                                        )}
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                    ) : (
                                        <div
                                            className="absolute inset-0 flex items-center justify-center cursor-pointer hover:bg-gray-50/50 dark:hover:bg-gray-800/50 rounded-xl transition-colors duration-200"
                                            onClick={handleUploadClick}
                                        >
                                            <svg className="w-6 h-6 text-gray-300 dark:text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 4v16m8-8H4" />
                                            </svg>
                                        </div>
                                    )}
                                </div>
                            );
                        })}
                    </div>
                </div>
            </div>

            {/* Hidden file input */}
            <input
                type="file"
                ref={fileInputRef}
                onChange={handleFileChange}
                className="hidden"
            />

            {/* Asset Preview */}
            {previewAsset && (
                <div
                    className="fixed z-[100] w-[500px] bg-white dark:bg-gray-800 rounded-lg shadow-2xl border border-gray-200/50 dark:border-gray-700/50 
                              animate-fade-in pointer-events-none backdrop-blur-sm"
                    style={{
                        left: `${previewAsset.position.x + 16}px`,
                        top: `${previewAsset.position.y}px`,
                        maxHeight: '80vh',
                        overflow: 'auto'
                    }}
                >
                    <div className="p-4">
                        <div className="flex items-center gap-3 mb-4">
                            <div className={`flex-shrink-0 w-10 h-10 rounded-lg flex items-center justify-center ${getAssetColor(previewAsset.asset.type, previewAsset.asset.metadata)}`}>
                                {getAssetIcon(previewAsset.asset.type, previewAsset.asset.metadata)}
                            </div>
                            <div>
                                <h3 className="text-base font-medium text-gray-900 dark:text-gray-100">
                                    {previewAsset.asset.name}
                                </h3>
                                <p className="text-sm text-gray-500 dark:text-gray-400">
                                    {previewAsset.asset.type} • {new Date(previewAsset.asset.metadata.timestamp).toLocaleDateString()}
                                </p>
                            </div>
                        </div>
                        <div className="text-sm text-gray-600 dark:text-gray-300">
                            <pre className="whitespace-pre-wrap break-all">
                                {typeof previewAsset.asset.content === 'string'
                                    ? previewAsset.asset.content
                                    : JSON.stringify(previewAsset.asset.content, null, 2)
                                }
                            </pre>
                        </div>
                    </div>
                </div>
            )}

            {/* Asset Modal */}
            {selectedAsset && (
                <AssetModal
                    asset={selectedAsset}
                    onClose={() => setSelectedAsset(null)}
                />
            )}
        </div>
    );
}; 