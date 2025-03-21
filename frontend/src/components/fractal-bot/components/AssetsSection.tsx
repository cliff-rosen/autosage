import React, { useState, useRef } from 'react';
import { Asset } from '../types/state';
import { AssetModal } from './AssetModal';

interface AssetsSectionProps {
    assets: Asset[];
    onUpload?: (file: File) => void;
}

export const getAssetIcon = (type: string, metadata?: { type?: string; name?: string; timestamp?: string; tags?: string[];[key: string]: any }) => {
    // Get file extension and type
    const fileType = metadata?.type || '';
    const fileName = metadata?.name || '';
    const extension = fileName.split('.').pop()?.toLowerCase() || '';

    // Images
    if (fileType.startsWith('image/') || ['jpg', 'jpeg', 'png', 'gif', 'svg', 'webp'].includes(extension)) {
        return (
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
            </svg>
        );
    }

    // Code files
    if (fileType.startsWith('text/') || ['js', 'ts', 'jsx', 'tsx', 'py', 'java', 'cpp', 'cs', 'go', 'rs', 'php'].includes(extension)) {
        return (
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 20l4-16m4 4l4 4-4 4M6 16l-4-4 4-4" />
            </svg>
        );
    }

    // Document files
    if (fileType === 'application/pdf' || ['doc', 'docx', 'pdf', 'txt', 'md', 'rtf'].includes(extension)) {
        return (
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
            </svg>
        );
    }

    // Spreadsheet files
    if (fileType.includes('spreadsheet') || ['xls', 'xlsx', 'csv'].includes(extension)) {
        return (
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h18M3 14h18m-9-4v8m-7 0h14a2 2 0 002-2V8a2 2 0 00-2-2H6a2 2 0 00-2 2v8a2 2 0 002 2z" />
            </svg>
        );
    }

    // Archive files
    if (fileType.includes('zip') || fileType.includes('compressed') || ['zip', 'rar', '7z', 'tar', 'gz'].includes(extension)) {
        return (
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 8h14M5 8a2 2 0 110-4h14a2 2 0 110 4M5 8v10a2 2 0 002 2h10a2 2 0 002-2V8m-9 4h4" />
            </svg>
        );
    }

    // JSON files
    if (fileType === 'application/json' || extension === 'json') {
        return (
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 7v10c0 2.21 3.582 4 8 4s8-1.79 8-4V7M4 7c0 2.21 3.582 4 8 4s8-1.79 8-4M4 7c0-2.21 3.582-4 8-4s8 1.79 8 4m0 5c0 2.21-3.582 4-8 4s-8-1.79-8-4" />
            </svg>
        );
    }

    // Asset type icons (fallback)
    switch (type) {
        case 'data':
            if (metadata?.type === 'comparison') {
                return (
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7h12m0 0l-4-4m4 4l-4 4m0 6H4m0 0l4 4m-4-4l4-4" />
                    </svg>
                );
            }
            return (
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 7v10c0 2.21 3.582 4 8 4s8-1.79 8-4V7M4 7c0 2.21 3.582 4 8 4s8-1.79 8-4M4 7c0-2.21 3.582-4 8-4s8 1.79 8 4m0 5c0 2.21-3.582 4-8 4s-8-1.79-8-4" />
                </svg>
            );
        case 'analysis':
            return (
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                </svg>
            );
        default:
            return (
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
            );
    }
};

export const getAssetColor = (type: string, metadata?: { type?: string; name?: string; timestamp?: string; tags?: string[];[key: string]: any }) => {
    // Get file extension and type
    const fileType = metadata?.type || '';
    const fileName = metadata?.name || '';
    const extension = fileName.split('.').pop()?.toLowerCase() || '';

    // Special case for comparison type
    if (metadata?.type === 'comparison') {
        return 'bg-orange-100 text-orange-600 dark:bg-orange-900/30 dark:text-orange-400';
    }

    // Images
    if (fileType.startsWith('image/') || ['jpg', 'jpeg', 'png', 'gif', 'svg', 'webp'].includes(extension)) {
        return 'bg-pink-100 text-pink-600 dark:bg-pink-900/30 dark:text-pink-400';
    }

    // Code files
    if (fileType.startsWith('text/') || ['js', 'ts', 'jsx', 'tsx', 'py', 'java', 'cpp', 'cs', 'go', 'rs', 'php'].includes(extension)) {
        return 'bg-emerald-100 text-emerald-600 dark:bg-emerald-900/30 dark:text-emerald-400';
    }

    // Document files
    if (fileType === 'application/pdf' || ['doc', 'docx', 'pdf', 'txt', 'md', 'rtf'].includes(extension)) {
        return 'bg-blue-100 text-blue-600 dark:bg-blue-900/30 dark:text-blue-400';
    }

    // Spreadsheet files
    if (fileType.includes('spreadsheet') || ['xls', 'xlsx', 'csv'].includes(extension)) {
        return 'bg-green-100 text-green-600 dark:bg-green-900/30 dark:text-green-400';
    }

    // Archive files
    if (fileType.includes('zip') || fileType.includes('compressed') || ['zip', 'rar', '7z', 'tar', 'gz'].includes(extension)) {
        return 'bg-amber-100 text-amber-600 dark:bg-amber-900/30 dark:text-amber-400';
    }

    // JSON files
    if (fileType === 'application/json' || extension === 'json') {
        return 'bg-indigo-100 text-indigo-600 dark:bg-indigo-900/30 dark:text-indigo-400';
    }

    // Asset type colors (fallback)
    switch (type) {
        case 'data':
            return 'bg-violet-100 text-violet-600 dark:bg-violet-900/30 dark:text-violet-400';
        case 'analysis':
            return 'bg-cyan-100 text-cyan-600 dark:bg-cyan-900/30 dark:text-cyan-400';
        default:
            return 'bg-gray-100 text-gray-600 dark:bg-gray-700 dark:text-gray-400';
    }
};

export const AssetsSection: React.FC<AssetsSectionProps> = ({ assets, onUpload }) => {
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
        // Reset the input
        if (fileInputRef.current) {
            fileInputRef.current.value = '';
        }
    };

    const handleDownload = (asset: Asset) => {
        const content = typeof asset.content === 'string'
            ? asset.content
            : JSON.stringify(asset.content, null, 2);

        const blob = new Blob([content], { type: 'text/plain' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `${asset.name}.txt`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
    };

    return (
        <div className="h-full flex flex-col">
            <div className="flex-none p-4 border-b border-gray-200 dark:border-gray-700">
                <div className="flex items-center justify-between">
                    <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
                        Assets
                    </h3>
                    <button
                        onClick={handleUploadClick}
                        className="p-2 text-gray-600 hover:text-gray-900 dark:text-gray-400 dark:hover:text-gray-100 
                                 bg-gray-100 hover:bg-gray-200 dark:bg-gray-800 dark:hover:bg-gray-700 
                                 rounded-lg transition-colors duration-200"
                        title="Upload Asset"
                    >
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" />
                        </svg>
                    </button>
                    <input
                        ref={fileInputRef}
                        type="file"
                        className="hidden"
                        onChange={handleFileChange}
                    />
                </div>
            </div>

            <div className="flex-1 overflow-y-auto p-4">
                <div className="grid grid-cols-2 gap-6">
                    {assets.map(asset => (
                        <div
                            key={asset.id}
                            className={`
                                group relative bg-white/90 dark:bg-gray-800/90 rounded-lg 
                                hover:shadow-xl hover:scale-[1.01] transition-all duration-200 p-4 cursor-pointer
                                backdrop-blur-sm
                                ${!asset.ready ? 'animate-pulse opacity-70' : ''}
                            `}
                            onMouseEnter={(e) => handleMouseEnter(asset, e)}
                            onMouseLeave={handleMouseLeave}
                            onClick={() => setSelectedAsset(asset)}
                        >
                            <div className="flex flex-col gap-3">
                                <div className="flex items-center gap-3">
                                    <div className={`flex-shrink-0 w-10 h-10 rounded-lg flex items-center justify-center ${getAssetColor(asset.type, asset.metadata)}`}>
                                        {getAssetIcon(asset.type, asset.metadata)}
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <h5 className="text-sm font-medium text-gray-900 dark:text-gray-100">
                                            {asset.name}
                                        </h5>
                                        <p className="text-xs text-gray-500 dark:text-gray-400">
                                            {asset.type} • {new Date(asset.metadata.timestamp).toLocaleDateString()}
                                        </p>
                                    </div>
                                    <div className="flex-shrink-0 opacity-0 group-hover:opacity-100 transition-opacity duration-200">
                                        <button
                                            onClick={(e) => {
                                                e.stopPropagation();
                                                handleDownload(asset);
                                            }}
                                            className="p-1 text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
                                            title="Download Asset"
                                        >
                                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                                            </svg>
                                        </button>
                                    </div>
                                </div>
                                <div className="text-sm text-gray-600 dark:text-gray-300 line-clamp-2 break-all">
                                    {typeof asset.content === 'string'
                                        ? asset.content
                                        : JSON.stringify(asset.content)}
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            </div>

            {/* Asset Preview */}
            {previewAsset && (
                <div
                    className="fixed z-50 w-[500px] bg-white dark:bg-gray-800 rounded-lg shadow-2xl border border-gray-200/50 dark:border-gray-700/50 
                              animate-fade-in pointer-events-none backdrop-blur-sm"
                    style={{
                        left: `${previewAsset.position.x + 16}px`,
                        top: `${previewAsset.position.y}px`,
                        maxHeight: '80vh',
                        overflow: 'auto'
                    }}
                >
                    <div className="p-6">
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